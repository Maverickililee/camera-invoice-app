'use client';

import { useEffect, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { toJalaali } from 'jalaali-js';

export default function InvoicePage({ params }) {
  const searchParams = useSearchParams();
  const [invoice, setInvoice] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const paymentStatus = searchParams.get('status');
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    fetchInvoice();
  }, [params.id]);

  const fetchInvoice = async () => {
    try {
      const response = await fetch(`/api/invoices/${params.id}`);
      const data = await response.json();
      
      if (response.ok) {
        setInvoice(data.invoice);
      } else {
        setError(data.error || 'فاکتور یافت نشد');
      }
    } catch (error) {
      setError('خطا در دریافت فاکتور');
    } finally {
      setLoading(false);
    }
  };

  const copyInvoiceLink = () => {
    const link = window.location.href;
    navigator.clipboard.writeText(link);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const copyPaymentLink = () => {
    if (invoice.paymentUrl) {
      navigator.clipboard.writeText(invoice.paymentUrl);
      alert('لینک پرداخت کپی شد');
    }
  };

  const getStatusClass = (status) => {
    switch (status) {
      case 'paid': return 'bg-green-100 text-green-800';
      case 'pending': return 'bg-yellow-100 text-yellow-800';
      case 'failed': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusText = (status) => {
    switch (status) {
      case 'paid': return 'پرداخت شده';
      case 'pending': return 'در انتظار پرداخت';
      case 'failed': return 'ناموفق';
      default: return status;
    }
  };

  const toJalali = (date) => {
    const d = new Date(date);
    const j = toJalaali(d);
    return `${j.jy}/${j.jm}/${j.jd}`;
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">در حال بارگذاری...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="bg-white rounded-lg shadow-lg p-8 max-w-md">
          <div className="text-center">
            <div className="text-red-500 text-5xl mb-4">⚠</div>
            <h2 className="text-xl font-bold text-gray-800 mb-2">خطا</h2>
            <p className="text-gray-600">{error}</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 py-8 px-4">
      <div className="max-w-3xl mx-auto">
        {/* Invoice Link at Top */}
        <div className="bg-white rounded-lg shadow-lg p-4 mb-6 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="bg-blue-100 p-2 rounded-lg">
              <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
              </svg>
            </div>
            <div>
              <p className="text-sm text-gray-500">لینک فاکتور</p>
              <p className="text-xs text-gray-400">{window.location.href}</p>
            </div>
          </div>
          <button
            onClick={copyInvoiceLink}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition flex items-center gap-2"
          >
            {copied ? 'کپی شد!' : 'کپی لینک'}
          </button>
        </div>

        {/* Payment Status Messages */}
        {paymentStatus === 'success' && (
          <div className="bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded-lg mb-6 flex items-center gap-3">
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <span>پرداخت با موفقیت انجام شد!</span>
          </div>
        )}

        {paymentStatus === 'failed' && (
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded-lg mb-6 flex items-center gap-3">
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <span>پرداخت ناموفق بود. لطفاً مجدداً تلاش کنید.</span>
          </div>
        )}

        {paymentStatus === 'cancelled' && (
          <div className="bg-yellow-100 border border-yellow-400 text-yellow-700 px-4 py-3 rounded-lg mb-6 flex items-center gap-3">
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
            <span>پرداخت لغو شد.</span>
          </div>
        )}

        {/* Invoice Card */}
        <div className="bg-white rounded-lg shadow-lg overflow-hidden">
          {/* Header */}
          <div className="bg-gradient-to-r from-blue-600 to-indigo-600 text-white p-6">
            <div className="flex justify-between items-start">
              <div>
                <h1 className="text-2xl font-bold mb-2">فاکتور</h1>
                <p className="text-blue-100">شماره: {invoice._id.substring(invoice._id.length - 8)}</p>
                <p className="text-blue-100">تاریخ: {toJalali(invoice.createdAt)}</p>
              </div>
              <div className={`px-4 py-2 rounded-full text-sm font-medium ${getStatusClass(invoice.paymentStatus)}`}>
                {getStatusText(invoice.paymentStatus)}
              </div>
            </div>
          </div>

          {/* Customer Info */}
          <div className="p-6 border-b">
            <h3 className="text-lg font-semibold text-gray-800 mb-4">اطلاعات مشتری</h3>
            <div className="grid grid-cols-2 gap-4">
              <div className="bg-gray-50 p-4 rounded-lg">
                <p className="text-sm text-gray-500 mb-1">نام</p>
                <p className="font-medium text-gray-800">{invoice.customerName}</p>
              </div>
              <div className="bg-gray-50 p-4 rounded-lg">
                <p className="text-sm text-gray-500 mb-1">شماره تماس</p>
                <p className="font-medium text-gray-800">{invoice.customerPhone}</p>
              </div>
            </div>
          </div>

          {/* Items */}
          <div className="p-6 border-b">
            <h3 className="text-lg font-semibold text-gray-800 mb-4">آیتم‌ها</h3>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="bg-gray-50">
                    <th className="px-4 py-3 text-right text-sm font-medium text-gray-600">نام</th>
                    <th className="px-4 py-3 text-right text-sm font-medium text-gray-600">قیمت واحد</th>
                    <th className="px-4 py-3 text-right text-sm font-medium text-gray-600">تعداد</th>
                    <th className="px-4 py-3 text-right text-sm font-medium text-gray-600">جمع</th>
                  </tr>
                </thead>
                <tbody>
                  {invoice.items.map((item, index) => {
                    const itemName = item.type === 'service' 
                      ? item.service?.name 
                      : item.product?.name;
                    return (
                      <tr key={index} className="border-t">
                        <td className="px-4 py-3 text-gray-800">{itemName}</td>
                        <td className="px-4 py-3 text-gray-600">{new Intl.NumberFormat('fa-IR').format(item.price)} تومان</td>
                        <td className="px-4 py-3 text-gray-600">{item.quantity}</td>
                        <td className="px-4 py-3 font-medium text-gray-800">{new Intl.NumberFormat('fa-IR').format(item.price * item.quantity)} تومان</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>

          {/* Total */}
          <div className="p-6 bg-gray-50">
            <div className="flex justify-between items-center">
              <span className="text-lg font-semibold text-gray-700">جمع کل:</span>
              <span className="text-2xl font-bold text-blue-600">
                {new Intl.NumberFormat('fa-IR').format(invoice.totalAmount)} تومان
              </span>
            </div>
          </div>

          {/* Payment Section */}
          {invoice.paymentStatus === 'pending' && invoice.paymentUrl && (
            <div className="p-6 border-t">
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-4">
                <p className="text-sm text-gray-600 mb-2">لینک پرداخت:</p>
                <p className="text-xs text-blue-600 break-all">{invoice.paymentUrl}</p>
              </div>
              <div className="flex gap-3">
                <button
                  onClick={copyPaymentLink}
                  className="flex-1 px-6 py-3 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition font-medium"
                >
                  کپی لینک پرداخت
                </button>
                <button
                  onClick={() => window.open(invoice.paymentUrl, '_blank')}
                  className="flex-1 px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition font-medium"
                >
                  پرداخت آنلاین
                </button>
              </div>
            </div>
          )}

          {invoice.paymentStatus === 'paid' && (
            <div className="p-6 border-t bg-green-50">
              <div className="flex items-center justify-center gap-3 text-green-700">
                <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <span className="font-semibold text-lg">این فاکتور پرداخت شده است</span>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
