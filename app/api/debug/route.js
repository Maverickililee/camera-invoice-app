import { NextResponse } from 'next/server';

export async function GET(request) {
  return NextResponse.json({ env: !!process.env.MONGODB_URI });
}

