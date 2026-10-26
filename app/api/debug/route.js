import { NextResponse } from 'next/server';

export async function GET(request) {
  try {
    return NextResponse.json({ ok: true, time: new Date().toISOString() });
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
