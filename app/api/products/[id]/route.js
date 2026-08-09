import { NextResponse } from 'next/server';
import connectToDatabase from '../../../../lib/mongodb.js';
import Product from '../../../../models/Product.js';
import { requireAuth } from '../../../../lib/auth.js';

export async function PUT(request, { params }) {
  try {
    const userId = await requireAuth();
    
    if (!userId) {
      return NextResponse.json(
        { error: 'احراز هویت نشده' },
        { status: 401 }
      );
    }

    const { name, price, description, imageUrl } = await request.json();

    await connectToDatabase();

    const product = await Product.findByIdAndUpdate(
      params.id,
      {
        name,
        price,
        description: description || '',
        imageUrl: imageUrl || '',
      },
      { new: true }
    );

    if (!product) {
      return NextResponse.json(
        { error: 'محصول یافت نشد' },
        { status: 404 }
      );
    }

    return NextResponse.json({ success: true, product });
  } catch (error) {
    console.error('Update product error:', error);
    return NextResponse.json(
      { error: 'خطا در بروزرسانی محصول' },
      { status: 500 }
    );
  }
}

export async function DELETE(request, { params }) {
  try {
    const userId = await requireAuth();
    
    if (!userId) {
      return NextResponse.json(
        { error: 'احراز هویت نشده' },
        { status: 401 }
      );
    }

    await connectToDatabase();

    const product = await Product.findByIdAndDelete(params.id);

    if (!product) {
      return NextResponse.json(
        { error: 'محصول یافت نشد' },
        { status: 404 }
      );
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Delete product error:', error);
    return NextResponse.json(
      { error: 'خطا در حذف محصول' },
      { status: 500 }
    );
  }
}
