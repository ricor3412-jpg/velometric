import { NextResponse } from 'next/server';
import { getDomainScans, getScanResults } from '@/lib/db';

export async function GET(req, { params }) {
  try {
    const { domainName } = await params;
    
    // Get all scans for this domain
    const scans = await getDomainScans(domainName);
    
    if (!scans || scans.length === 0) {
      return NextResponse.json({ success: false, error: 'Domain not found or no scans yet' }, { status: 404 });
    }

    // Attach results to each scan
    for (let scan of scans) {
      scan.results = await getScanResults(scan.id);
      
      // Calculate average score for the full scan
      if (scan.results.length > 0) {
         let avgPerf = 0, avgSeo = 0, avgA11y = 0, avgBp = 0;
         scan.results.forEach(r => {
           avgPerf += r.perf_score;
           avgSeo += r.seo_score;
           avgA11y += r.a11y_score;
           avgBp += r.bp_score;
         });
         
         const count = scan.results.length;
         scan.averages = {
           performance: Math.round(avgPerf / count),
           seo: Math.round(avgSeo / count),
           accessibility: Math.round(avgA11y / count),
           bestPractices: Math.round(avgBp / count)
         };
      } else {
         scan.averages = null;
      }
    }

    return NextResponse.json({ success: true, domainName, scans });
  } catch (error) {
    console.error('API Get Domain Scans Error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
