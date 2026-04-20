import { NextResponse } from 'next/server';
import { getScanById, getScanResults } from '@/lib/db';
import { validateRequest } from '@/lib/auth';

export async function GET(req, { params }) {
  try {
    // 1. Authenticate
    const auth = await validateRequest(req);
    if (!auth.valid) {
      return NextResponse.json({ error: auth.error }, { status: auth.status });
    }

    const { id } = await params;
    
    // 2. Fetch scan metadata
    const scan = getScanById(id);
    if (!scan) {
      return NextResponse.json({ error: 'Scan not found' }, { status: 404 });
    }

    // 3. Fetch results if finished
    let results = [];
    if (scan.status === 'completed') {
      results = getScanResults(id);
    }

    // 4. Transform results for agent consumption (remove heavy raw_data if not requested?)
    // For now we keep it simple and return the summary
    const summaryResults = results.map(r => ({
      url: r.url,
      device: r.device_type,
      scores: {
        performance: r.perf_score,
        seo: r.seo_score,
        accessibility: r.a11y_score,
        best_practices: r.bp_score
      }
    }));

    return NextResponse.json({ 
      success: true, 
      scan_id: scan.id,
      domain: scan.domain_name,
      status: scan.status,
      network: scan.network_profile,
      started_at: scan.started_at,
      completed_at: scan.completed_at,
      total_pages: summaryResults.length,
      results: summaryResults
    });

  } catch (error) {
    console.error('v1 API Results Error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
