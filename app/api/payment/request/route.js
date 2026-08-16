import { NextResponse } from 'next/server';
import connectToDatabase from '../../../../lib/mongodb.js';
import Invoice from '../../../../models/Invoice.js';
import { requireAuth } from '../../../../lib/auth.js';

export async function POST(request) {
  try {
    const userId = await requireAuth();
    
    if (!userId) {
      return NextResponse.json(
        { error: 'احراز هویت نشده' },
        { status: 401 }
      );
    }

    const { invoiceId } = await request.json();

    if (!invoiceId) {
      return NextResponse.json(
        { error: 'شناسه فاکتور الزامی است' },
        { status: 400 }
      );
    }

    await connectToDatabase();

    const invoice = await Invoice.findById(invoiceId);

    if (!invoice) {
      return NextResponse.json(
        { error: 'فاکتور یافت نشد' },
        { status: 404 }
      );
    }

    if (invoice.paymentStatus === 'paid') {
      return NextResponse.json(
        { error: 'این فاکتور قبلاً پرداخت شده است' },
        { status: 400 }
      );
    }

    const merchantId = process.env.ZARINPAL_MERCHANT_ID;
    const mode = process.env.ZARINPAL_MODE || 'sandbox';
    
    const amount = invoice.totalAmount;
    const description = `فاکتور شماره ${invoice._id} - ${invoice.customerName}`;
    const callbackUrl = `${process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000'}/api/payment/verify`;

    const zarinpalUrl = mode === 'sandbox' 
      ? 'https://sandbox.zarinpal.com/pg/v4/payment/request.json'
      : 'https://api.zarinpal.com/pg/v4/payment/request.json';

    console.log('ZarinPal Request:', {
      merchantId,
      amount,
      description,
      callbackUrl,
      zarinpalUrl,
    });

    const response = await fetch(zarinpalUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        merchant_id: merchantId,
        amount: amount * 10, // Convert to Tomans (Zarinpal uses Tomans)
        description: description,
        callback_url: callbackUrl,
      }),
    });

    const data = await response.json();
    console.log('ZarinPal Response:', data);

    if (data.errors && data.errors.length > 0) {
      console.error('Zarinpal request error:', data.errors);
      return NextResponse.json(
        { error: 'خطا در اتصال به درگاه پرداخت: ' + JSON.stringify(data.errors) },
        { status: 500 }
      );
    }

    if (!data.data || !data.data.authority) {
      console.error('ZarinPal invalid response:', data);
      return NextResponse.json(
        { error: 'پاسخ نامعتبر از درگاه پرداخت' },
        { status: 500 }
      );
    }

    const authority = data.data.authority;
    const paymentUrl = mode === 'sandbox'
      ? `https://sandbox.zarinpal.com/pg/StartPay/${authority}`
      : `https://www.zarinpal.com/pg/StartPay/${authority}`;

    invoice.authority = authority;
    invoice.paymentUrl = paymentUrl;
    await invoice.save();

    return NextResponse.json({
      success: true,
      paymentUrl,
      authority,
    });
  } catch (error) {
    console.error('Payment request error:', error);
    return NextResponse.json(
      { error: 'خطا در درخواست پرداخت' },
      { status: 500 }
    );
  }
}
