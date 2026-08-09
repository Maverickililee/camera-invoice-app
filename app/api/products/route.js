import { NextResponse } from 'next/server';
import connectToDatabase from '../../../lib/mongodb.js';
import Product from '../../../models/Product.js';
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

    const products = await Product.find({}).sort({ createdAt: -1 });

    return NextResponse.json({ products });
  } catch (error) {
    console.error('Get products error:', error);
    return NextResponse.json(
      { error: 'خطا در دریافت محصولات' },
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
        { error: 'نام و قیمت محصول الزامی است' },
        { status: 400 }
      );
    }

    await connectToDatabase();

    const product = await Product.create({
      name,
      price,
      description: description || '',
      imageUrl: imageUrl || '',
    });

    return NextResponse.json({ success: true, product }, { status: 201 });
  } catch (error) {
    console.error('Create product error:', error);
    return NextResponse.json(
      { error: 'خطا در ایجاد محصول' },
      { status: 500 }
    );
  }
}
