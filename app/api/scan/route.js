import { NextResponse } from 'next/server';
import { getOrCreateDomain, startScan, getDomainScans, getScanResults, getScanById } from '@/lib/db';
import { runAsyncAuditProcess } from '@/lib/audit-process';

export async function GET(req) {
  const { searchParams } = new URL(req.url);
  const name = searchParams.get('name');
  const id = searchParams.get('id');

  try {
    let scan;
    if (id) {
      scan = await getScanById(id);
    } else if (name) {
      const scans = await getDomainScans(name);
      if (scans.length > 0) {
        scan = await getScanById(scans[0].id);
      }
    }

    if (!scan) {
      return NextResponse.json({ error: 'Scan not found' }, { status: 404 });
    }

    const results = await getScanResults(scan.id);
    
    // Aggregate results for summary
    const summary = {
      performance: Math.round(results.reduce((acc, r) => acc + r.perf_score, 0) / (results.length || 1)),
      seo: Math.round(results.reduce((acc, r) => acc + r.seo_score, 0) / (results.length || 1)),
      accessibility: Math.round(results.reduce((acc, r) => acc + r.a11y_score, 0) / (results.length || 1)),
      bestPractices: Math.round(results.reduce((acc, r) => acc + r.bp_score, 0) / (results.length || 1)),
      metrics: results[0]?.raw_data?.metrics || {}, // Use metrics from first page as proxy
      audits: results.flatMap(r => {
         const raw = typeof r.raw_data === 'string' ? JSON.parse(r.raw_data) : r.raw_data;
         return Object.values(raw?.audits || {}).filter(a => a.score < 1);
      })
    };

    return NextResponse.json({ 
      success: true, 
      scan: { ...scan, results: summary, allResults: results } 
    });
  } catch (error) {
    console.error('API Get Scan Error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

// Avoid API route timeout by letting the heavy lifting run async
export async function POST(req) {
  try {
    const { url, networkProfile = '4g' } = await req.json();

    if (!url) {
      return NextResponse.json({ error: 'URL is required' }, { status: 400 });
    }

    let parsedUrl;
    try {
      parsedUrl = new URL(url);
    } catch (e) {
      return NextResponse.json({ error: 'Invalid URL formatting' }, { status: 400 });
    }

    const domainName = parsedUrl.hostname;
    
    // Setup DB records
    const domain = await getOrCreateDomain(domainName, parsedUrl.origin);
    const scanId = await startScan(domain.id, networkProfile);

    // Fire and forget the heavy process
    const crawlUrl = parsedUrl.origin.endsWith('/') ? parsedUrl.origin : parsedUrl.origin + '/';
    runAsyncAuditProcess(scanId, crawlUrl, networkProfile);

    const isVercel = process.env.VERCEL === '1';

    return NextResponse.json({ 
      success: true, 
      scanId, 
      domain: domainName,
      warning: isVercel ? 'Vercel Serverless Functions have execution limits. Large site audits may be interrupted.' : null
    });
  } catch (error) {
    console.error('API Scan Error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
