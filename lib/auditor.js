import lighthouse from 'lighthouse';
import puppeteer from 'puppeteer';

export const THROTTLING_PROFILES = {
  '5g': {
    rttMs: 20,
    throughputKbps: 50 * 1024,
    requestLatencyMs: 0,
    downloadThroughputKbps: 50 * 1024,
    uploadThroughputKbps: 10 * 1024,
    cpuSlowdownMultiplier: 1,
  },
  '4g': {
    rttMs: 40,
    throughputKbps: 10 * 1024,
    requestLatencyMs: 0,
    downloadThroughputKbps: 10 * 1024,
    uploadThroughputKbps: 5 * 1024,
    cpuSlowdownMultiplier: 1,
  },
  '3g-fast': {
    rttMs: 150,
    throughputKbps: 1.6 * 1024,
    requestLatencyMs: 0,
    downloadThroughputKbps: 1.6 * 1024,
    uploadThroughputKbps: 768,
    cpuSlowdownMultiplier: 4,
  },
  '3g-slow': {
    rttMs: 400,
    throughputKbps: 400,
    requestLatencyMs: 0,
    downloadThroughputKbps: 400,
    uploadThroughputKbps: 400,
    cpuSlowdownMultiplier: 4,
  },
  'none': {
    rttMs: 0,
    throughputKbps: 0,
    requestLatencyMs: 0,
    downloadThroughputKbps: 0,
    uploadThroughputKbps: 0,
    cpuSlowdownMultiplier: 1,
  }
};

export async function auditUrl(url, deviceType = 'desktop', networkProfile = '4g') {
  let browser;
  try {
    console.log(`[Auditor] Starting audit for ${url} on ${deviceType} with ${networkProfile} network`);
    browser = await puppeteer.launch({
      headless: true,
      args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-gpu']
    });

    const isMobile = deviceType === 'mobile';
    const throttle = THROTTLING_PROFILES[networkProfile] || THROTTLING_PROFILES['4g'];
    
    const options = {
      logLevel: 'error',
      output: 'json',
      onlyCategories: ['performance', 'seo', 'accessibility', 'best-practices'],
      port: new URL(browser.wsEndpoint()).port,
      formFactor: isMobile ? 'mobile' : 'desktop',
      throttlingMethod: networkProfile === 'none' ? 'provided' : 'simulate',
      throttling: throttle,
      screenEmulation: {
        mobile: isMobile,
        width: isMobile ? 412 : 1350,
        height: isMobile ? 823 : 940,
        deviceScaleFactor: isMobile ? 1.75 : 1,
        disabled: false
      }
    };

    const runnerResult = await lighthouse(url, options);
    const report = runnerResult.lhr;
    
    const scores = {
      performance: Math.round(report.categories.performance.score * 100),
      seo: Math.round(report.categories.seo.score * 100),
      accessibility: Math.round(report.categories.accessibility.score * 100),
      'best-practices': Math.round(report.categories['best-practices'].score * 100)
    };

    // Extract specific failed audits (opportunities & diagnostics)
    const issues = [];
    for (const key in report.audits) {
       const audit = report.audits[key];
       if (audit.score !== null && audit.score < 1 && audit.scoreDisplayMode !== 'notApplicable' && audit.scoreDisplayMode !== 'informative') {
          issues.push({
             id: audit.id,
             title: audit.title,
             description: audit.description,
             score: audit.score,
             displayValue: audit.displayValue || null
          });
       }
    }

    // Extract resources for the DOM/Resource Change Detector
    const networkRequests = report.audits['network-requests']?.details?.items?.map(item => ({
      url: item.url,
      type: item.resourceType,
      size: item.transferSize,
      duration: item.endTime - item.startTime,
    })) || [];

    const screenshot = report.audits['final-screenshot']?.details?.data || null;
    const filmstrip = report.audits['screenshot-thumbnails']?.details?.items || [];

    const metrics = {
      fcp: report.audits['first-contentful-paint']?.displayValue || null,
      lcp: report.audits['largest-contentful-paint']?.displayValue || null,
      tbt: report.audits['total-blocking-time']?.displayValue || null,
      cls: report.audits['cumulative-layout-shift']?.displayValue || null,
      si: report.audits['speed-index']?.displayValue || null,
    };

    console.log(`[Auditor] Audit complete for ${url} on ${deviceType}`, scores);

    await browser.close();
    return { 
      scores, 
      rawData: JSON.stringify({ 
        issues, 
        screenshot, 
        filmstrip, 
        metrics,
        resources: networkRequests 
      }) 
    };
  } catch (error) {
    if (browser) await browser.close();
    console.error(`[Auditor] Error auditing ${url} on ${deviceType}:`, error);
    return null;
  }
}
