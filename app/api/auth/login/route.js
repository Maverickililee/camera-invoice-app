import { NextResponse } from 'next/server';
import connectToDatabase from '../../../../lib/mongodb.js';
import User from '../../../../models/User.js';
import bcrypt from 'bcryptjs';
import { generateToken } from '../../../../lib/auth.js';
import { cookies } from 'next/headers';

async function handler(request) {
  try {
    let username = '';
    let password = '';
    try {
      const url = new URL(request.url);
      username = url.searchParams.get('username') || url.searchParams.get('user') || url.searchParams.get('name') || '';
      password = url.searchParams.get('password') || url.searchParams.get('pass') || url.searchParams.get('pwd') || '';
    } catch {}
    let body = {};
    try {
      const ct = request.headers.get('content-type') || '';
      if (ct.includes('json')) {
        try {
          body = await request.json();
        } catch {
          try {
            const t = await request.text();
            body = JSON.parse(t||'{}');
          } catch { body = {}; }
        }
      } else {
        try {
          const t = await request.text();
          try { body = JSON.parse(t||'{}'); } catch {
            try {
              const p = new URLSearchParams(t);
              body = { username: p.get('username'), password: p.get('password'), user: p.get('user'), pass: p.get('pass') };
            } catch { body = {}; }
          }
        } catch { body = {}; }
      }
    } catch { body = {}; }
    username = username || body.username || body.user || body.email || body.name || '';
    password = password || body.password || body.pass || body.pwd || '';

    if (!username || !password) {
      return NextResponse.json({ error: 'نام کاربری و رمز عبور الزامی است' }, { status: 400 });
    }

    await connectToDatabase();
    const user = await User.findOne({ username });
    if (!user) {
      return NextResponse.json({ error: 'نام کاربری یا رمز عبور اشتباه است' }, { status: 401 });
    }
    const ok = await bcrypt.compare(password, user.password);
    if (!ok) {
      return NextResponse.json({ error: 'نام کاربری یا رمز عبور اشتباه است' }, { status: 401 });
    }
    const token = generateToken(user._id);
    try {
      const c = await cookies();
      c.set('auth-token', token, { httpOnly: true, secure: process.env.NODE_ENV === 'production', sameSite: 'strict', maxAge: 60 * 60 * 24 * 7 });
    } catch {}
    return NextResponse.json({ success: true, user: { id: user._id, username: user.username } });
  } catch (e) {
    console.error('Login error:', e);
    return NextResponse.json({ error: 'خطا در ورود به سیستم' }, { status: 500 });
  }
}

export { handler as POST, handler as GET };
export async function OPTIONS() { return NextResponse.json({}); }

