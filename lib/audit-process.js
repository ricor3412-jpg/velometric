import { crawlWebsite } from './crawler';
import { auditUrl } from './auditor';
import { finishScan, savePageResult, appendLog } from './db';
import db from './db';

export async function runAsyncAuditProcess(scanId, startUrl, networkProfile = '4g') {
  try {
    await appendLog(scanId, `Initializing crawler for ${startUrl}...`);
    // 1. Crawl website (limit to 5 pages for speed and stability on Vercel)
    const urlsToAudit = await crawlWebsite(startUrl, 5);
    await appendLog(scanId, `Discovered ${urlsToAudit.length} pages to audit (Priority: Home).`);
    
    // 2. Run Lighthouse Audit on each URL for both Desktop and Mobile
    const devices = ['desktop', 'mobile'];
    
    // Check if scan was cancelled before starting pages
    let { data: currentScan } = await db.from('scans').select('status').eq('id', scanId).single();
    if (currentScan?.status === 'cancelled') {
      await appendLog(scanId, `Scan was cancelled by user. Stopping...`, 'warn');
      return;
    }

    for (const pageUrl of urlsToAudit) {
       // Check for cancellation before each page
       const { data: check } = await db.from('scans').select('status').eq('id', scanId).single();
       if (check?.status === 'cancelled') {
         await appendLog(scanId, `Scan cancelled. Skipping remaining pages.`, 'warn');
         break;
       }

       const isHome = pageUrl === startUrl || pageUrl === startUrl.slice(0, -1) || pageUrl === startUrl + '/';
       await appendLog(scanId, `Starting audits for ${pageUrl}${isHome ? ' (Homepage)' : ''}...`);
       
       // Run Lighthouse Audit on each URL for both Desktop and Mobile in parallel
       await Promise.all(devices.map(async (device) => {
          try {
            await appendLog(scanId, `Running Lighthouse (${device}) [Network: ${networkProfile}] on ${pageUrl}...`);
            const result = await auditUrl(pageUrl, device, networkProfile);
            
            if (result) {
              await savePageResult(scanId, pageUrl, device, result.scores, result.rawData);
              await appendLog(scanId, `Finished ${device} audit for ${pageUrl} - Perf: ${result.scores.performance}`, 'success');
            } else {
              await appendLog(scanId, `Failed to audit ${pageUrl} on ${device}`, 'error');
            }
          } catch (e) {
            await appendLog(scanId, `Error in ${device} audit for ${pageUrl}: ${e.message}`, 'error');
          }
       }));
    }

    // 3. Mark scan as finished (only if not cancelled)
    const { data: finalCheck } = await db.from('scans').select('status').eq('id', scanId).single();
    if (finalCheck?.status !== 'cancelled') {
      await finishScan(scanId);
      await appendLog(scanId, `Scan fully completed! All processed.`, 'success');
    }
    console.log(`[Process] Scan ${scanId} fully completed!`);

  } catch (err) {
    console.error(`[Process] Fatal error in scan ${scanId}:`, err);
    await appendLog(scanId, `Fatal Error: ${err.message}`, 'error');
    
    // Update scan status to failed
    const { updateScanStatus } = await import('./db');
    await updateScanStatus(scanId, 'failed');
  }
}
