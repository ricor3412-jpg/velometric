import { crawlWebsite } from './crawler';
import { auditUrl } from './auditor';
import { finishScan, savePageResult, appendLog } from './db';
import db from './db';

export async function runAsyncAuditProcess(scanId, startUrl, networkProfile = '4g') {
  try {
    appendLog(scanId, `Initializing crawler for ${startUrl}...`);
    // 1. Crawl website (limit to 10 pages for decent speed in MVP)
    const urlsToAudit = await crawlWebsite(startUrl, 10);
    appendLog(scanId, `Discovered ${urlsToAudit.length} pages to audit.`);
    
    // 2. Run Lighthouse Audit on each URL for both Desktop and Mobile
    const devices = ['desktop', 'mobile'];
    
    for (const pageUrl of urlsToAudit) {
       for (const device of devices) {
          appendLog(scanId, `Running Lighthouse (${device}) [Network: ${networkProfile}] on ${pageUrl}...`);
          const result = await auditUrl(pageUrl, device, networkProfile);
          
          if (result) {
            savePageResult(scanId, pageUrl, device, result.scores, result.rawData);
            appendLog(scanId, `Finished ${device} audit for ${pageUrl} - Perf: ${result.scores.performance}`, 'success');
          } else {
            appendLog(scanId, `Failed to audit ${pageUrl} on ${device}`, 'error');
          }
       }
    }

    // 3. Mark scan as finished
    finishScan(scanId);
    appendLog(scanId, `Scan fully completed!`, 'success');
    console.log(`[Process] Scan ${scanId} fully completed!`);

  } catch (err) {
    console.error(`[Process] Fatal error in scan ${scanId}:`, err);
    appendLog(scanId, `Fatal Error: ${err.message}`, 'error');
    
    // Update scan status to failed
    db.prepare("UPDATE scans SET status = 'failed' WHERE id = ?").run(scanId);
  }
}
