import { NextResponse } from 'next/server';
import connectToDatabase from '../../../../lib/supabase-db.js';
import Invoice from '../../../../models/Invoice.js';
import { requireAuth } from '../../../../lib/auth.js';

const isValidMerchantId = (merchantId) => (
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(merchantId || '')
);

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

    const merchantId = process.env.ZARINPAL_MERCHANT_ID?.trim();
    const mode = (process.env.ZARINPAL_MODE || 'sandbox').toLowerCase();
    const amount = Number(invoice.totalAmount);

    if (!isValidMerchantId(merchantId)) {
      console.error('ZarinPal merchant ID is not configured.');
      return NextResponse.json(
        { error: 'شناسه پذیرنده زرین‌پال باید یک UUID معتبر باشد' },
        { status: 503 }
      );
    }

    if (!Number.isSafeInteger(amount) || amount <= 0) {
      return NextResponse.json(
        { error: 'مبلغ فاکتور معتبر نیست' },
        { status: 400 }
      );
    }

    const description = `فاکتور شماره ${invoice._id} - ${invoice.customerName}`;
    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || new URL(request.url).origin;
    const callbackUrl = new URL('/api/payment/verify', baseUrl).toString();

    const zarinpalUrl = mode === 'sandbox' 
      ? 'https://sandbox.zarinpal.com/pg/v4/payment/request.json'
      : 'https://payment.zarinpal.com/pg/v4/payment/request.json';

    console.log('ZarinPal Request:', {
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
        currency: 'IRT',
        amount,
        description: description,
        callback_url: callbackUrl,
      }),
    });

    const data = await response.json().catch(() => null);
    console.log('ZarinPal Response:', data);

    if (!response.ok || data?.errors?.length > 0) {
      console.error('Zarinpal request error:', {
        status: response.status,
        errors: data?.errors,
      });
      return NextResponse.json(
        { error: 'درگاه پرداخت درخواست را نپذیرفت' },
        { status: 502 }
      );
    }

    if (!data?.data?.authority) {
      console.error('ZarinPal invalid response:', data);
      return NextResponse.json(
        { error: 'پاسخ نامعتبر از درگاه پرداخت' },
        { status: 500 }
      );
    }

    const authority = data.data.authority;
    const paymentUrl = mode === 'sandbox'
      ? `https://sandbox.zarinpal.com/pg/StartPay/${authority}`
      : `https://payment.zarinpal.com/pg/StartPay/${authority}`;

    await Invoice.findByIdAndUpdate(invoice._id, {
      authority,
      paymentUrl,
    });

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
