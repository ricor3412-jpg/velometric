import { NextResponse } from 'next/server';
import { createApiKey, listApiKeys, revokeApiKey } from '@/lib/db';

export async function GET() {
  try {
    const keys = await listApiKeys();
    return NextResponse.json({ success: true, keys });
  } catch (error) {
    return NextResponse.json({ error: 'Failed to list keys' }, { status: 500 });
  }
}

export async function POST(req) {
  try {
    const { name } = await req.json();
    if (!name) return NextResponse.json({ error: 'Name is required' }, { status: 400 });
    
    const key = await createApiKey(name);
    return NextResponse.json({ success: true, key });
  } catch (error) {
    return NextResponse.json({ error: 'Failed to create key' }, { status: 500 });
  }
}

export async function DELETE(req) {
  try {
    const { id } = await req.json();
    if (!id) return NextResponse.json({ error: 'ID is required' }, { status: 400 });
    
    await revokeApiKey(id);
    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json({ error: 'Failed to revoke key' }, { status: 500 });
  }
}
