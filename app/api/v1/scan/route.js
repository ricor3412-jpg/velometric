import { NextResponse } from 'next/server';
import { getOrCreateDomain, startScan } from '@/lib/db';
import { runAsyncAuditProcess } from '@/lib/audit-process';
import { validateRequest } from '@/lib/auth';

export async function POST(req) {
  try {
    // 1. Authenticate
    const auth = await validateRequest(req);
    if (!auth.valid) {
      return NextResponse.json({ error: auth.error }, { status: auth.status });
    }

    // 2. Parse payload
    const { url, network = '4g' } = await req.json();

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
    
    // 3. Setup DB records
    const domain = await getOrCreateDomain(domainName, parsedUrl.origin);
    const scanId = await startScan(domain.id, network);

    // 4. Fire and forget the heavy process
    const crawlUrl = parsedUrl.origin.endsWith('/') ? parsedUrl.origin : parsedUrl.origin + '/';
    runAsyncAuditProcess(scanId, crawlUrl, network);

    const isVercel = process.env.VERCEL === '1';

    // 5. Standardized response for agents
    return NextResponse.json({ 
      success: true, 
      scan_id: scanId, 
      domain: domainName,
      status: 'initiated',
      message: 'Audit process started successfully.',
      warning: isVercel ? 'Serverless environment detected. Background processing may be limited by execution timeouts.' : null
    }, { status: 201 });

  } catch (error) {
    console.error('v1 API Scan Error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
