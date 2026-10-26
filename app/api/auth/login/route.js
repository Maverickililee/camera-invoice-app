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
      body = await request.json();
    } catch {
      try {
        const text = await request.text();
        try { body = JSON.parse(text || '{}'); } catch { body = {}; }
      } catch {
        body = {};
      }
    }

    let username = body.username || body.user || body.email || body.name || '';
    let password = body.password || body.pass || body.pwd || body.code || '';

    if (!username || !password) {
      try {
        const url = new URL(request.url);
        username = username || url.searchParams.get('username') || url.searchParams.get('user') || url.searchParams.get('email') || '';
        password = password || url.searchParams.get('password') || url.searchParams.get('pass') || url.searchParams.get('pwd') || '';
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
      cookieStore.set('auth-token', token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'strict',
        maxAge: 60 * 60 * 24 * 7,
      });
    } catch {}

    return NextResponse.json({
      success: true,
      user: {
        id: user._id,
        username: user.username,
      },
    });
  } catch (error) {
    console.error('Login error:', error);
    return NextResponse.json({ error: 'خطا در ورود به سیستم' }, { status: 500 });
  }
}

export const POST = handler;
export const GET = handler;
export const PUT = handler;
export const PATCH = handler;
export const DELETE = handler;
export async function OPTIONS() {
  return NextResponse.json({});
}
