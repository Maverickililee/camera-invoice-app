import { NextResponse } from 'next/server';
import connectToDatabase from '../../../lib/mongodb.js';
import Service from '../../../models/Service.js';
import { requireAuth } from '../../../lib/auth.js';

export async function GET(request) {
  try {
    const userId = await requireAuth();
    
    if (!userId) {
      return NextResponse.json(
        { error: 'احراز هویت نشده' },
        { status: 401 }
      );
    }

    await connectToDatabase();

    const services = await Service.find({}).sort({ createdAt: -1 });

    return NextResponse.json({ services });
  } catch (error) {
    console.error('Get services error:', error);
    return NextResponse.json(
      { error: 'خطا در دریافت خدمات' },
      { status: 500 }
    );
  }
}

export async function POST(request) {
  try {
    const userId = await requireAuth();
    
    if (!userId) {
      return NextResponse.json(
        { error: 'احراز هویت نشده' },
        { status: 401 }
      );
    }

    const { name, price, description, imageUrl } = await request.json();

    if (!name || !price) {
      return NextResponse.json(
        { error: 'نام و قیمت خدمت الزامی است' },
        { status: 400 }
      );
    }

    await connectToDatabase();

    const service = await Service.create({
      name,
      price,
      description: description || '',
      imageUrl: imageUrl || '',
    });

    return NextResponse.json({ success: true, service }, { status: 201 });
  } catch (error) {
    console.error('Create service error:', error);
    return NextResponse.json(
      { error: 'خطا در ایجاد خدمت' },
      { status: 500 }
    );
  }
}
