import { NextResponse } from 'next/server';
import { getLatestScans } from '@/lib/db';

export async function GET() {
  try {
    const scans = getLatestScans();
    return NextResponse.json({ success: true, scans });
  } catch (error) {
    console.error('API Get Scans Error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
