import { NextResponse } from 'next/server';
import connectToDatabase from '../../../lib/supabase-db.js';
import User from '../../../models/User.js';
import bcrypt from 'bcryptjs';

export async function POST(request) {
  try {
    try {
      await connectToDatabase();
    } catch (e) {
      console.error('Setup db err:', e);
      return NextResponse.json({ error: 'خطا در ایجاد کاربر ادمین', detail: 'db' }, { status: 500 });
    }

    let body;
    try {
      body = await request.json();
    } catch (e) {
      body = {};
    }
    const { username, password } = body || {};

    if (!username || !password) {
      return NextResponse.json(
        { error: 'نام کاربری و رمز عبور الزامی است' },
        { status: 400 }
      );
    }

    let existingUser;
    try {
      existingUser = await User.findOne({ username });
    } catch (e) {
      console.error('Setup find err:', e);
      return NextResponse.json({ error: 'خطا در ایجاد کاربر ادمین', detail: 'find' }, { status: 500 });
    }
    if (existingUser) {
      return NextResponse.json(
        { error: 'کاربر با این نام کاربری قبلاً ثبت شده است' },
        { status: 400 }
      );
    }

    let hashedPassword;
    try {
      hashedPassword = await bcrypt.hash(password, 10);
    } catch (e) {
      console.error('Setup hash err:', e);
      return NextResponse.json({ error: 'خطا در ایجاد کاربر ادمین', detail: 'hash' }, { status: 500 });
    }
    let user;
    try {
      user = await User.create({
        username,
        password: hashedPassword,
        isAdmin: true,
      });
    } catch (e) {
      console.error('Setup create err:', e);
      return NextResponse.json({ error: 'خطا در ایجاد کاربر ادمین', detail: e.message }, { status: 500 });
    }

    return NextResponse.json({ 
      success: true, 
      message: 'کاربر ادمین با موفقیت ایجاد شد',
      username: user.username 
    });
  } catch (error) {
    console.error('Setup admin error:', error);
    return NextResponse.json(
      { error: 'خطا در ایجاد کاربر ادمین', detail: error.message },
      { status: 500 }
    );
  }
}
