import { NextResponse } from 'next/server';
import connectToDatabase from '../../../../lib/mongodb.js';
import User from '../../../../models/User.js';
import bcrypt from 'bcryptjs';
import { generateToken } from '../../../../lib/auth.js';
import { cookies } from 'next/headers';

async function handler(request) {
  try {
    let body = {};
    try {
      const ct = request.headers.get('content-type') || '';
      if (ct.includes('application/json')) {
        body = await request.json();
      } else if (ct.includes('application/x-www-form-urlencoded')) {
        const t = await request.text();
        const params = new URLSearchParams(t);
        body = { username: params.get('username')||params.get('user'), password: params.get('password')||params.get('pass') };
      } else {
        const t = await request.text();
        try { body = JSON.parse(t||'{}'); } catch {
          try {
            const params = new URLSearchParams(t);
            body = { username: params.get('username')||params.get('user'), password: params.get('password')||params.get('pass') };
          } catch { body = {}; }
        }
      }
    } catch { body = {}; }

    let username = body.username || body.user || body.email || body.name || '';
    let password = body.password || body.pass || body.pwd || body.code || '';
    if (!username || !password) {
      try {
        const url = new URL(request.url);
        username = username || url.searchParams.get('username')||url.searchParams.get('user')||'';
        password = password || url.searchParams.get('password')||url.searchParams.get('pass')||'';
      } catch {}
    }

    if (!username || !password) {
      return NextResponse.json({ error: 'نام کاربری و رمز عبور الزامی است' }, { status: 400 });
    }

    await connectToDatabase();
    const user = await User.findOne({ username });
    if (!user) {
      return NextResponse.json({ error: 'نام کاربری یا رمز عبور اشتباه است' }, { status: 401 });
    }
    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
      return NextResponse.json({ error: 'نام کاربری یا رمز عبور اشتباه است' }, { status: 401 });
    }
    const token = generateToken(user._id);
    try {
      const cookieStore = await cookies();
      cookieStore.set('auth-token', token, { httpOnly: true, secure: process.env.NODE_ENV === 'production', sameSite: 'strict', maxAge: 60 * 60 * 24 * 7 });
    } catch {}
    return NextResponse.json({ success: true, user: { id: user._id, username: user.username } });
  } catch (error) {
    console.error('Login error:', error);
    return NextResponse.json({ error: 'خطا در ورود به سیستم' }, { status: 500 });
  }
}

export { handler as POST, handler as GET };
export async function OPTIONS() { return NextResponse.json({}); }
