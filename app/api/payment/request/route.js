import { NextResponse } from 'next/server';
import connectToDatabase from '../../../../lib/supabase-db.js';
import Invoice from '../../../../models/Invoice.js';
import { requireAuth } from '../../../../lib/auth.js';
import { createZarinpalPayment } from '../../../../lib/zarinpal.js';

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

    if (invoice.paymentUrl && invoice.authority) {
      return NextResponse.json({
        success: true,
        paymentUrl: invoice.paymentUrl,
        authority: invoice.authority,
      });
    }

    const { authority, paymentUrl } = await createZarinpalPayment(
      invoice,
      new URL(request.url).origin
    );

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
      { error: error.message || 'خطا در درخواست پرداخت' },
      { status: Number.isInteger(error.status) ? error.status : 500 }
    );
  }
}
