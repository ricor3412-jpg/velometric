export const THROTTLING_PROFILES = {
  '5g': { rttMs: 20, throughputKbps: 50 * 1024, cpuSlowdownMultiplier: 1 },
  '4g': { rttMs: 40, throughputKbps: 10 * 1024, cpuSlowdownMultiplier: 1 },
  '3g-fast': { rttMs: 150, throughputKbps: 1.6 * 1024, cpuSlowdownMultiplier: 4 },
  '3g-slow': { rttMs: 400, throughputKbps: 400, cpuSlowdownMultiplier: 4 },
  'none': { rttMs: 0, throughputKbps: 0, cpuSlowdownMultiplier: 1 }
};

async function auditWithPSI(url, deviceType) {
  const strategy = deviceType === 'mobile' ? 'MOBILE' : 'DESKTOP';
  const apiKey = process.env.PAGESPEED_API_KEY;
  
  // Base PSI URL with all relevant categories
  let apiUrl = `https://www.googleapis.com/pagespeedonline/v5/runPagespeed?url=${encodeURIComponent(url)}&strategy=${strategy}&category=performance&category=seo&category=accessibility&category=best-practices`;
  
  if (apiKey) apiUrl += `&key=${apiKey}`;

  console.log(`[Auditor] Using PSI API for ${url} (${deviceType})`);
  const response = await fetch(apiUrl);
  
  if (!response.ok) {
    const errorData = await response.json();
    throw new Error(`PSI API Error: ${errorData.error?.message || response.statusText}`);
  }

  const data = await response.json();
  const report = data.lighthouseResult;

  const scores = {
    performance: Math.round(report.categories.performance.score * 100),
    seo: Math.round(report.categories.seo.score * 100),
    accessibility: Math.round(report.categories.accessibility.score * 100),
    'best-practices': Math.round(report.categories['best-practices'].score * 100)
  };

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

  const screenshot = report.audits['final-screenshot']?.details?.data || null;
  const filmstrip = report.audits['screenshot-thumbnails']?.details?.items || [];

  const metrics = {
    fcp: report.audits['first-contentful-paint']?.displayValue || null,
    lcp: report.audits['largest-contentful-paint']?.displayValue || null,
    tbt: report.audits['total-blocking-time']?.displayValue || null,
    cls: report.audits['cumulative-layout-shift']?.displayValue || null,
    si: report.audits['speed-index']?.displayValue || null,
    // Raw numeric values
    ttfb: report.audits['server-response-time']?.numericValue || 0,
    fcpValue: report.audits['first-contentful-paint']?.numericValue || 0,
    lcpValue: report.audits['largest-contentful-paint']?.numericValue || 0,
    ttiValue: report.audits['interactive']?.numericValue || 0,
    onloadValue: 0, // PSI doesn't easily provide onload/total in the same way
    fullyLoadedValue: report.audits['interactive']?.numericValue || 0,
  };

  return {
    scores,
    rawData: JSON.stringify({
      issues,
      screenshot,
      filmstrip,
      metrics,
      resources: [], // PSI doesn't return full network-requests in this compact view easily
      fromAPI: true
    })
  };
}

export async function auditUrl(url, deviceType = 'desktop', networkProfile = '4g') {
  // If we are on Vercel or explicitly told to use API, use PSI
  // Vercel environment usually has VERCEL=1
  if (process.env.VERCEL || process.env.USE_PSI_API === 'true') {
    try {
      return await auditWithPSI(url, deviceType);
    } catch (err) {
      console.error("[Auditor] PSI API failed, falling back to null.", err.message);
      return null; 
    }
  }

  let browser;
  try {
    // Dynamic imports for local execution to keep Vercel bundle small
    const { default: lighthouse } = await import('lighthouse');
    const { default: puppeteer } = await import('puppeteer');

    console.log(`[Auditor] Starting local audit for ${url} on ${deviceType}`);
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
      // Raw numeric values for timeline
      ttfb: report.audits['server-response-time']?.numericValue || 0,
      fcpValue: report.audits['first-contentful-paint']?.numericValue || 0,
      lcpValue: report.audits['largest-contentful-paint']?.numericValue || 0,
      ttiValue: report.audits['interactive']?.numericValue || 0,
      onloadValue: report.audits['mainthread-work-breakdown']?.numericValue || 0, // Approx onload
      fullyLoadedValue: report.timing?.total || 0,
    };

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
    console.error(`[Auditor] Local execution error:`, error);
    return null;
  }
}
