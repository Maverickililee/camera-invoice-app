import { NextResponse } from 'next/server';
import connectToDatabase from '../../../lib/mongodb.js';
import Customer from '../../../models/Customer.js';

export async function GET(request) {
  try {
    await connectToDatabase();
    const customers = await Customer.find().sort({ createdAt: -1 });
    return NextResponse.json({ customers });
  } catch (error) {
    console.error('Get customers error:', error);
    return NextResponse.json(
      { error: 'خطا در دریافت لیست مشتریان' },
      { status: 500 }
    );
  }
}

export async function POST(request) {
  try {
    await connectToDatabase();
    const body = await request.json();
    const { firstName, lastName, phone } = body;

    const existingCustomer = await Customer.findOne({ phone });
    if (existingCustomer) {
      return NextResponse.json(
        { error: 'مشتری با این شماره تماس قبلاً ثبت شده است' },
        { status: 400 }
      );
    }

    const customer = await Customer.create({
      firstName,
      lastName,
      phone,
    });

    return NextResponse.json({ customer }, { status: 201 });
  } catch (error) {
    console.error('Create customer error:', error);
    return NextResponse.json(
      { error: 'خطا در ایجاد مشتری' },
      { status: 500 }
    );
  }
}

export async function PUT(request) {
  try {
    await connectToDatabase();
    const body = await request.json();
    const { id, firstName, lastName, phone } = body;

    const existingCustomer = await Customer.findOne({ phone, _id: { $ne: id } });
    if (existingCustomer) {
      return NextResponse.json(
        { error: 'مشتری با این شماره تماس قبلاً ثبت شده است' },
        { status: 400 }
      );
    }

    const customer = await Customer.findByIdAndUpdate(
      id,
      { firstName, lastName, phone },
      { new: true }
    );

    if (!customer) {
      return NextResponse.json(
        { error: 'مشتری یافت نشد' },
        { status: 404 }
      );
    }

    return NextResponse.json({ customer });
  } catch (error) {
    console.error('Update customer error:', error);
    return NextResponse.json(
      { error: 'خطا در ویرایش مشتری' },
      { status: 500 }
    );
  }
}

export async function DELETE(request) {
  try {
    await connectToDatabase();
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    const customer = await Customer.findByIdAndDelete(id);

    if (!customer) {
      return NextResponse.json(
        { error: 'مشتری یافت نشد' },
        { status: 404 }
      );
    }

    return NextResponse.json({ message: 'مشتری با موفقیت حذف شد' });
  } catch (error) {
    console.error('Delete customer error:', error);
    return NextResponse.json(
      { error: 'خطا در حذف مشتری' },
      { status: 500 }
    );
  }
}
