import { NextResponse } from 'next/server';
import connectToDatabase from '../../../lib/mongodb.js';
import Invoice from '../../../models/Invoice.js';
import Product from '../../../models/Product.js';
import Service from '../../../models/Service.js';
import Customer from '../../../models/Customer.js';
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

    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status');
    const customerPhone = searchParams.get('customerPhone');

    const query = {};
    if (status) {
      query.paymentStatus = status;
    }
    if (customerPhone) {
      query.customerPhone = customerPhone;
    }

    const invoices = await Invoice.find(query)
      .populate('items.product')
      .populate('items.service')
      .sort({ createdAt: -1 });

    return NextResponse.json({ invoices });
  } catch (error) {
    console.error('Get invoices error:', error);
    return NextResponse.json(
      { error: 'خطا در دریافت فاکتورها' },
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

    const { customerName, customerPhone, items } = await request.json();

    if (!customerName || !customerPhone || !items || items.length === 0) {
      return NextResponse.json(
        { error: 'اطلاعات نامعتبر است' },
        { status: 400 }
      );
    }

    await connectToDatabase();

    // Check if customer exists, if not create new customer
    let customer = await Customer.findOne({ phone: customerPhone });
    if (!customer) {
      const nameParts = customerName.split(' ');
      const firstName = nameParts[0] || customerName;
      const lastName = nameParts.slice(1).join(' ') || '-';
      
      customer = await Customer.create({
        firstName,
        lastName,
        phone: customerPhone,
      });
    }

    let totalAmount = 0;
    const populatedItems = [];

    for (const item of items) {
      if (item.type === 'product') {
        const product = await Product.findById(item.productId);
        
        if (!product) {
          return NextResponse.json(
            { error: `محصول با شناسه ${item.productId} یافت نشد` },
            { status: 404 }
          );
        }

        const itemTotal = product.price * item.quantity;
        totalAmount += itemTotal;

        populatedItems.push({
          product: product._id,
          type: 'product',
          quantity: item.quantity,
          price: product.price,
        });
      } else if (item.type === 'service') {
        const service = await Service.findById(item.serviceId);
        
        if (!service) {
          return NextResponse.json(
            { error: `خدمت با شناسه ${item.serviceId} یافت نشد` },
            { status: 404 }
          );
        }

        const itemTotal = service.price * item.quantity;
        totalAmount += itemTotal;

        populatedItems.push({
          service: service._id,
          type: 'service',
          quantity: item.quantity,
          price: service.price,
        });
      }
    }

    const invoice = await Invoice.create({
      customerName,
      customerPhone,
      items: populatedItems,
      totalAmount,
      paymentStatus: 'pending',
    });

    const populatedInvoice = await Invoice.findById(invoice._id)
      .populate('items.product')
      .populate('items.service');

    return NextResponse.json({ success: true, invoice: populatedInvoice }, { status: 201 });
  } catch (error) {
    console.error('Create invoice error:', error);
    return NextResponse.json(
      { error: 'خطا در ایجاد فاکتور' },
      { status: 500 }
    );
  }
}
