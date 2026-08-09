import { NextResponse } from 'next/server';
import connectToDatabase from '../../../../lib/mongodb.js';
import Service from '../../../../models/Service.js';
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

    const service = await Service.findByIdAndUpdate(
      params.id,
      {
        name,
        price,
        description: description || '',
        imageUrl: imageUrl || '',
      },
      { new: true }
    );

    if (!service) {
      return NextResponse.json(
        { error: 'خدمت یافت نشد' },
        { status: 404 }
      );
    }

    return NextResponse.json({ success: true, service });
  } catch (error) {
    console.error('Update service error:', error);
    return NextResponse.json(
      { error: 'خطا در بروزرسانی خدمت' },
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

    const service = await Service.findByIdAndDelete(params.id);

    if (!service) {
      return NextResponse.json(
        { error: 'خدمت یافت نشد' },
        { status: 404 }
      );
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Delete service error:', error);
    return NextResponse.json(
      { error: 'خطا در حذف خدمت' },
      { status: 500 }
    );
  }
}
