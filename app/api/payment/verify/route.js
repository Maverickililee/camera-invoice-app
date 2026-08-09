import { NextResponse } from 'next/server';
import connectToDatabase from '../../../../lib/mongodb.js';
import Invoice from '../../../../models/Invoice.js';

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

    if (status === 'OK') {
      const merchantId = process.env.ZARINPAL_MERCHANT_ID;
      const mode = process.env.ZARINPAL_MODE || 'sandbox';
      
      const zarinpalUrl = mode === 'sandbox'
        ? 'https://sandbox.zarinpal.com/pg/v4/payment/verify.json'
        : 'https://api.zarinpal.com/pg/v4/payment/verify.json';

      const response = await fetch(zarinpalUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          merchant_id: merchantId,
          amount: invoice.totalAmount * 10,
          authority: authority,
        }),
      });

      const data = await response.json();

      if (data.errors && data.errors.length > 0) {
        console.error('Zarinpal verify error:', data.errors);
        invoice.paymentStatus = 'failed';
        await invoice.save();
        return NextResponse.redirect(new URL(`/invoice/${invoice._id}?status=failed`, request.url));
      }

      if (data.data.ref_id) {
        invoice.paymentStatus = 'paid';
        await invoice.save();
        return NextResponse.redirect(new URL(`/invoice/${invoice._id}?status=success`, request.url));
      }
    } else {
      invoice.paymentStatus = 'failed';
      await invoice.save();
      return NextResponse.redirect(new URL(`/invoice/${invoice._id}?status=cancelled`, request.url));
    }

    return NextResponse.redirect(new URL(`/invoice/${invoice._id}`, request.url));
  } catch (error) {
    console.error('Payment verify error:', error);
    return NextResponse.redirect(new URL('/?error=server', request.url));
  }
}
