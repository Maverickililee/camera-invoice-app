# یافته‌های پیکربندی زرین‌پال

- مستندات رسمی زرین‌پال، `merchant_id` را کدی یکتا با طول ۳۶ کاراکتر معرفی می‌کند.
- برای Sandbox باید endpointها به `sandbox.zarinpal.com` تغییر یابند و برای `merchant_id` یک UUID دلخواه وارد شود.
- `callback_url` آدرسی است که کاربر پس از پایان پرداخت به آن بازگردانده می‌شود.
- مرحلهٔ درخواست با `currency: IRT` می‌تواند مبلغ را به تومان بپذیرد؛ در مرحلهٔ تأیید، مستندات مبلغ را به ریال می‌خواهد.

منابع:
- https://www.zarinpal.com/docs/paymentGateway/
- https://www.zarinpal.com/docs/paymentGateway/sandBox
- https://www.zarinpal.com/docs/paymentGateway/connectToGateway.html
- https://www.zarinpal.com/docs/paymentGateway/moreFeatures/currency.html
