import { NextResponse } from 'next/server';
import connectToDatabase from '../../../../lib/mongodb.js';
import User from '../../../../models/User.js';
import bcrypt from 'bcryptjs';
import { generateToken } from '../../../../lib/auth.js';
import { cookies } from 'next/headers';

export async function POST(request) {
  try {
    let body;
    try {
      const text = await request.text();
      body = JSON.parse(text);
    } catch (e) {
      try {
        body = await request.json();
      } catch (e2) {
        return NextResponse.json({ error: 'درخواست نامعتبر', detail: 'json' }, { status: 400 });
      }
    }
    const { username, password } = body || {};

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
