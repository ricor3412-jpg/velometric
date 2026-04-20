import { NextResponse } from 'next/server';
import { getDomainScans, getScanResults } from '@/lib/db';
import { validateRequest } from '@/lib/auth';

export async function GET(req, { params }) {
  try {
    // 1. Authenticate
    const auth = await validateRequest(req);
    if (!auth.valid) {
      return NextResponse.json({ error: auth.error }, { status: auth.status });
    }

    const { domain } = await params;
    
    // 2. Fetch history
    const history = getDomainScans(domain);
    
    if (!history || history.length === 0) {
      return NextResponse.json({ 
        success: true, 
        domain, 
        history: [], 
        message: 'No history found for this domain.' 
      });
    }

    // 3. For each scan, we could potentially attach top-level scores 
    // to give a quick overview without requiring fetching each scan ID separately.
    const enrichedHistory = history.map(scan => {
        // We could fetch scores here if we want a detailed history, 
        // but for now we return the scan metadata as per the plan.
        return {
            id: scan.id,
            status: scan.status,
            network: scan.network_profile,
            started_at: scan.started_at,
            completed_at: scan.completed_at
        };
    });

    return NextResponse.json({ 
      success: true, 
      domain, 
      count: enrichedHistory.length,
      history: enrichedHistory
    });

  } catch (error) {
    console.error('v1 API History Error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
