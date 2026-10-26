import { NextResponse } from 'next/server';
import connectToDatabase from '../../../../lib/supabase-db.js';
import Invoice from '../../../../models/Invoice.js';

const isValidMerchantId = (merchantId) => (
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(merchantId || '')
);

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const authority = searchParams.get('Authority');
    const status = searchParams.get('Status');

    if (!authority || !status) {
      return NextResponse.redirect(new URL('/?error=invalid', request.url));
    }

    await connectToDatabase();

    const invoice = await Invoice.findOne({ authority });

    if (!invoice) {
      return NextResponse.redirect(new URL('/?error=notfound', request.url));
    }

    if (invoice.paymentStatus === 'paid') {
      return NextResponse.redirect(new URL(`/invoice/${invoice._id}?status=success`, request.url));
    }

    if (status === 'OK') {
      const merchantId = process.env.ZARINPAL_MERCHANT_ID?.trim();
      const mode = (process.env.ZARINPAL_MODE || 'sandbox').toLowerCase();

      if (!isValidMerchantId(merchantId)) {
        console.error('ZarinPal merchant ID is not configured.');
        await Invoice.findByIdAndUpdate(invoice._id, { paymentStatus: 'failed' });
        return NextResponse.redirect(new URL(`/invoice/${invoice._id}?status=failed`, request.url));
      }
      
      const zarinpalUrl = mode === 'sandbox'
        ? 'https://sandbox.zarinpal.com/pg/v4/payment/verify.json'
        : 'https://payment.zarinpal.com/pg/v4/payment/verify.json';

      const response = await fetch(zarinpalUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          merchant_id: merchantId,
          amount: Number(invoice.totalAmount) * 10, // API تأیید مبلغ را به ریال می‌خواهد
          authority: authority,
        }),
      });

      const data = await response.json().catch(() => null);

      if (!response.ok || data?.errors?.length > 0) {
        console.error('Zarinpal verify error:', {
          status: response.status,
          errors: data?.errors,
        });
        await Invoice.findByIdAndUpdate(invoice._id, { paymentStatus: 'failed' });
        return NextResponse.redirect(new URL(`/invoice/${invoice._id}?status=failed`, request.url));
      }

      if (data?.data?.ref_id) {
        await Invoice.findByIdAndUpdate(invoice._id, { paymentStatus: 'paid' });
        return NextResponse.redirect(new URL(`/invoice/${invoice._id}?status=success`, request.url));
      }
    } else {
      await Invoice.findByIdAndUpdate(invoice._id, { paymentStatus: 'failed' });
      return NextResponse.redirect(new URL(`/invoice/${invoice._id}?status=cancelled`, request.url));
    }

    return NextResponse.redirect(new URL(`/invoice/${invoice._id}`, request.url));
  } catch (error) {
    console.error('Payment verify error:', error);
    return NextResponse.redirect(new URL('/?error=server', request.url));
  }
}
