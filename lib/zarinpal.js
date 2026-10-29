const MERCHANT_ID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

export async function createZarinpalPayment(invoice, requestOrigin) {
  const merchantId = process.env.ZARINPAL_MERCHANT_ID?.trim();
  const mode = (process.env.ZARINPAL_MODE || 'sandbox').toLowerCase();
  const amount = Number(invoice?.totalAmount);

  if (!MERCHANT_ID_PATTERN.test(merchantId || '')) {
    const error = new Error('شناسه پذیرنده زرین‌پال باید یک UUID معتبر باشد');
    error.status = 503;
    throw error;
  }

  if (!Number.isSafeInteger(amount) || amount <= 0) {
    const error = new Error('مبلغ فاکتور معتبر نیست');
    error.status = 400;
    throw error;
  }

  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || requestOrigin;
  if (!baseUrl) {
    const error = new Error('آدرس اصلی سایت تنظیم نشده است');
    error.status = 503;
    throw error;
  }

  const callbackUrl = new URL('/api/payment/verify', baseUrl).toString();
  const endpoint = mode === 'sandbox'
    ? 'https://sandbox.zarinpal.com/pg/v4/payment/request.json'
    : 'https://payment.zarinpal.com/pg/v4/payment/request.json';

  const response = await fetch(endpoint, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Accept: 'application/json',
    },
    body: JSON.stringify({
      merchant_id: merchantId,
      currency: 'IRT',
      amount,
      description: `فاکتور شماره ${invoice._id} - ${invoice.customerName}`,
      callback_url: callbackUrl,
    }),
  });

  const data = await response.json().catch(() => null);
  const errors = data?.errors;
  const hasErrors = Array.isArray(errors)
    ? errors.length > 0
    : Boolean(errors && Object.keys(errors).length > 0);

  if (!response.ok || hasErrors || !data?.data?.authority) {
    console.error('ZarinPal payment request failed:', {
      status: response.status,
      errorCodes: Array.isArray(errors)
        ? errors.map((item) => item?.code).filter(Boolean)
        : Object.keys(errors || {}),
    });
    const error = new Error('زرین‌پال نتوانست لینک پرداخت را ایجاد کند');
    error.status = 502;
    throw error;
  }

  const authority = data.data.authority;
  const paymentUrl = mode === 'sandbox'
    ? `https://sandbox.zarinpal.com/pg/StartPay/${authority}`
    : `https://payment.zarinpal.com/pg/StartPay/${authority}`;

  return { authority, paymentUrl };
}
