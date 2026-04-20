import { NextResponse } from 'next/server';
import { getOrCreateDomain, startScan } from '@/lib/db';
import { runAsyncAuditProcess } from '@/lib/audit-process';

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
    const domain = getOrCreateDomain(domainName, parsedUrl.origin);
    const scanId = startScan(domain.id, networkProfile);

    // Fire and forget the heavy process
    const crawlUrl = parsedUrl.origin.endsWith('/') ? parsedUrl.origin : parsedUrl.origin + '/';
    runAsyncAuditProcess(scanId, crawlUrl, networkProfile);

    return NextResponse.json({ success: true, scanId, domain: domainName });
  } catch (error) {
    console.error('API Scan Error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
