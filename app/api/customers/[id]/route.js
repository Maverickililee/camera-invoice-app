import { NextResponse } from 'next/server';
import connectToDatabase from '../../../../lib/mongodb.js';
import Customer from '../../../../models/Customer.js';
import { requireAuth } from '../../../../lib/auth.js';

export async function GET(request, { params }) {
  try {
    const userId = await requireAuth();
    
    if (!userId) {
      return NextResponse.json(
        { error: 'احراز هویت نشده' },
        { status: 401 }
      );
    }

    await connectToDatabase();

    const customer = await Customer.findById(params.id);

    if (!customer) {
      return NextResponse.json(
        { error: 'مشتری یافت نشد' },
        { status: 404 }
      );
    }

    return NextResponse.json({ customer });
  } catch (error) {
    console.error('Get customer error:', error);
    return NextResponse.json(
      { error: 'خطا در دریافت مشتری' },
      { status: 500 }
    );
  }
}
