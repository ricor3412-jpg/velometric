import { NextResponse } from 'next/server';
import { getLatestScans } from '@/lib/db';

export async function GET() {
  try {
    const scans = await getLatestScans();
    return NextResponse.json({ success: true, scans });
  } catch (error) {
    console.error('API Get Scans Error Detail:', {
      message: error.message,
      code: error.code,
      details: error.details,
      hint: error.hint
    });
    return NextResponse.json({ 
      error: 'Failed to fetch scans', 
      details: error.message 
    }, { status: 500 });
  }
}

export async function DELETE() {
  try {
    const { clearAllScans } = await import('@/lib/db');
    await clearAllScans();
    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
