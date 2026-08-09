import { NextResponse } from 'next/server';
import connectToDatabase from '../../../lib/mongodb.js';
import User from '../../../models/User.js';
import bcrypt from 'bcryptjs';

export async function POST(request) {
  try {
    await connectToDatabase();

    const { username, password } = await request.json();

    if (!username || !password) {
      return NextResponse.json(
        { error: 'نام کاربری و رمز عبور الزامی است' },
        { status: 400 }
      );
    }

    // Check if admin already exists
    const existingUser = await User.findOne({ username });
    if (existingUser) {
      return NextResponse.json(
        { error: 'کاربر با این نام کاربری قبلاً ثبت شده است' },
        { status: 400 }
      );
    }

    // Create admin user
    const hashedPassword = await bcrypt.hash(password, 10);
    const user = await User.create({
      username,
      password: hashedPassword,
      isAdmin: true,
    });

    return NextResponse.json({ 
      success: true, 
      message: 'کاربر ادمین با موفقیت ایجاد شد',
      username: user.username 
    });
  } catch (error) {
    console.error('Setup admin error:', error);
    return NextResponse.json(
      { error: 'خطا در ایجاد کاربر ادمین' },
      { status: 500 }
    );
  }
}
