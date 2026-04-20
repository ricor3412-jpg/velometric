import { NextResponse } from 'next/server';
import { getScanLogs } from '@/lib/db';

export async function GET(req, { params }) {
  try {
    const { scanId } = await params;
    const logs = await getScanLogs(scanId);
    
    return NextResponse.json({ success: true, logs });
  } catch (error) {
    console.error('API Get Scan Logs Error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
