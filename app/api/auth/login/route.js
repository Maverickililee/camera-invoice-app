import { NextResponse } from 'next/server';
import connectToDatabase from '../../../../lib/mongodb.js';
import User from '../../../../models/User.js';
import bcrypt from 'bcryptjs';
import { generateToken } from '../../../../lib/auth.js';
import { cookies } from 'next/headers';

export async function POST(request) {
  try {
    let body = {};
    try {
      const contentType = request.headers.get('content-type') || '';
      if (contentType.includes('json')) {
        body = await request.json();
      } else {
        const text = await request.text();
        try { body = JSON.parse(text); } catch {}
      }
    } catch (e) {
      try {
        const text = await request.text();
        try { body = JSON.parse(text); } catch {}
      } catch {}
    }
    const username = body?.username || body?.user || body?.email || '';
    const password = body?.password || body?.pass || body?.pwd || '';

    if (!username || !password) {
      return NextResponse.json(
        { error: 'نام کاربری و رمز عبور الزامی است' },
        { status: 400 }
      );
    }

    try {
      await connectToDatabase();
    } catch (e) {
      console.error('DB connect err:', e);
      return NextResponse.json({ error: 'خطا در ورود به سیستم', detail: 'db' }, { status: 500 });
    }

    let user;
    try {
      user = await User.findOne({ username });
    } catch (e) {
      console.error('Find user err:', e);
      return NextResponse.json({ error: 'خطا در ورود به سیستم', detail: 'find' }, { status: 500 });
    }

    if (!user) {
      return NextResponse.json(
        { error: 'نام کاربری یا رمز عبور اشتباه است' },
        { status: 401 }
      );
    }

    let isPasswordValid;
    try {
      isPasswordValid = await bcrypt.compare(password, user.password);
    } catch (e) {
      console.error('Bcrypt err:', e);
      return NextResponse.json({ error: 'خطا در ورود به سیستم', detail: 'bcrypt' }, { status: 500 });
    }

    if (!isPasswordValid) {
      return NextResponse.json(
        { error: 'نام کاربری یا رمز عبور اشتباه است' },
        { status: 401 }
      );
    }

    let token;
    try {
      token = generateToken(user._id);
    } catch (e) {
      console.error('Token err:', e);
      return NextResponse.json({ error: 'خطا در ورود به سیستم', detail: 'token' }, { status: 500 });
    }

    try {
      const cookieStore = await cookies();
      cookieStore.set('auth-token', token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'strict',
        maxAge: 60 * 60 * 24 * 7,
      });
    } catch (e) {
      console.error('Cookie err:', e);
    }

    return NextResponse.json({
      success: true,
      user: {
        id: user._id,
        username: user.username,
      },
    });
  } catch (error) {
    console.error('Login error:', error);
    return NextResponse.json(
      { error: 'خطا در ورود به سیستم', detail: error.message },
      { status: 500 }
    );
  }
}

export async function GET(request) {
  try {
    let body = {};
    try {
      const contentType = request.headers.get('content-type') || '';
      if (contentType.includes('json')) {
        body = await request.json();
      } else {
        const text = await request.text();
        try { body = JSON.parse(text); } catch {}
      }
    } catch {}
    const username = body?.username || '';
    const password = body?.password || '';
    if (!username || !password) {
      const url = new URL(request.url);
      const u = url.searchParams.get('username') || url.searchParams.get('user');
      const p = url.searchParams.get('password') || url.searchParams.get('pass');
      if (u && p) {
        body = { username: u, password: p };
      } else {
        return NextResponse.json({ error: 'نام کاربری و رمز عبور الزامی است' }, { status: 400 });
      }
    }
    // reuse
    return POST(request);
  } catch (e) {
    return NextResponse.json({ error: 'err' }, { status: 500 });
  }
}
