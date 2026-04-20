import { crawlWebsite } from './crawler';
import { auditUrl } from './auditor';
import { finishScan, savePageResult, appendLog } from './db';
import db from './db';

export async function runAsyncAuditProcess(scanId, startUrl, networkProfile = '4g') {
  try {
    await appendLog(scanId, `Initializing crawler for ${startUrl}...`);
    // 1. Crawl website (limit to 10 pages for decent speed in MVP)
    const urlsToAudit = await crawlWebsite(startUrl, 10);
    await appendLog(scanId, `Discovered ${urlsToAudit.length} pages to audit.`);
    
    // 2. Run Lighthouse Audit on each URL for both Desktop and Mobile
    const devices = ['desktop', 'mobile'];
    
    for (const pageUrl of urlsToAudit) {
       for (const device of devices) {
          await appendLog(scanId, `Running Lighthouse (${device}) [Network: ${networkProfile}] on ${pageUrl}...`);
          const result = await auditUrl(pageUrl, device, networkProfile);
          
          if (result) {
            await savePageResult(scanId, pageUrl, device, result.scores, result.rawData);
            await appendLog(scanId, `Finished ${device} audit for ${pageUrl} - Perf: ${result.scores.performance}`, 'success');
          } else {
            await appendLog(scanId, `Failed to audit ${pageUrl} on ${device}`, 'error');
          }
       }
    }

    // 3. Mark scan as finished
    await finishScan(scanId);
    await appendLog(scanId, `Scan fully completed!`, 'success');
    console.log(`[Process] Scan ${scanId} fully completed!`);

  } catch (err) {
    console.error(`[Process] Fatal error in scan ${scanId}:`, err);
    await appendLog(scanId, `Fatal Error: ${err.message}`, 'error');
    
    // Update scan status to failed
    const { updateScanStatus } = await import('./db');
    await updateScanStatus(scanId, 'failed');
  }
}
