
import { getLatestScans, getScanLogs } from './lib/db.js';

async function check() {
  try {
    const scans = await getLatestScans();
    console.log('Latest Scans:', scans.slice(0, 3).map(s => ({ id: s.id, status: s.status, name: s.name })));
    
    if (scans.length > 0) {
      const firstScan = scans[0];
      const logs = await getScanLogs(firstScan.id);
      console.log(`Logs for ${firstScan.name} (${firstScan.id}):`);
      logs.forEach(l => console.log(`[${l.type}] ${l.message}`));
    }
  } catch (e) {
    console.error(e);
  }
}

check();
