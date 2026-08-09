import { NextResponse } from 'next/server';
import connectToDatabase from '../../../../lib/mongodb.js';
import Invoice from '../../../../models/Invoice.js';
import { requireAuth } from '../../../../lib/auth.js';

export async function GET(request, { params }) {
  try {
    await connectToDatabase();

    const invoice = await Invoice.findById(params.id)
      .populate('items.product')
      .populate('items.service');

    if (!invoice) {
      return NextResponse.json(
        { error: 'فاکتور یافت نشد' },
        { status: 404 }
      );
    }

    return NextResponse.json({ invoice });
  } catch (error) {
    console.error('Get invoice error:', error);
    return NextResponse.json(
      { error: 'خطا در دریافت فاکتور' },
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

    const invoice = await Invoice.findById(params.id);

    if (!invoice) {
      return NextResponse.json(
        { error: 'فاکتور یافت نشد' },
        { status: 404 }
      );
    }

    await Invoice.findByIdAndDelete(params.id);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Delete invoice error:', error);
    return NextResponse.json(
      { error: 'خطا در حذف فاکتور' },
      { status: 500 }
    );
  }
}
