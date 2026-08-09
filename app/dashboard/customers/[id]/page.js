'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { deleteCookie } from 'cookies-next';
import Link from 'next/link';

export default function CustomerDetailPage({ params }) {
  const router = useRouter();
  const [customer, setCustomer] = useState(null);
  const [invoices, setInvoices] = useState([]);
  const [filteredInvoices, setFilteredInvoices] = useState([]);
  const [invoiceFilter, setInvoiceFilter] = useState('all');
  const [loading, setLoading] = useState(true);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  useEffect(() => {
    checkAuth();
    fetchCustomer();
    fetchCustomerInvoices();
  }, [params.id]);

  useEffect(() => {
    if (invoiceFilter === 'all') {
      setFilteredInvoices(invoices);
    } else if (invoiceFilter === 'paid') {
      setFilteredInvoices(invoices.filter(inv => inv.paymentStatus === 'paid'));
    } else if (invoiceFilter === 'pending') {
      setFilteredInvoices(invoices.filter(inv => inv.paymentStatus === 'pending'));
    }
  }, [invoiceFilter, invoices]);

  const checkAuth = async () => {
    try {
      const response = await fetch('/api/auth/check');
      const data = await response.json();
      
      if (!data.authenticated) {
        router.push('/login');
      }
    } catch (error) {
      router.push('/login');
    }
  };

  const fetchCustomer = async () => {
    try {
      const response = await fetch(`/api/customers/${params.id}`);
      const data = await response.json();
      
      if (response.ok) {
        setCustomer(data.customer);
      }
    } catch (error) {
      console.error('Error fetching customer:', error);
    }
  };

  const fetchCustomerInvoices = async () => {
    try {
      const response = await fetch(`/api/invoices?customerPhone=${encodeURIComponent(customer?.phone || '')}`);
      const data = await response.json();
      
      if (response.ok) {
        setInvoices(data.invoices);
      }
    } catch (error) {
      console.error('Error fetching invoices:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => {
    deleteCookie('auth-token');
    router.push('/login');
  };

  if (loading) {
    return <div className="p-8 text-center">در حال بارگذاری...</div>;
  }

  if (!customer) {
    return <div className="p-8 text-center">مشتری یافت نشد</div>;
  }

  const totalSpent = invoices.reduce((sum, inv) => sum + inv.totalAmount, 0);
  const paidInvoices = invoices.filter(inv => inv.paymentStatus === 'paid').length;
  const pendingInvoices = invoices.filter(inv => inv.paymentStatus === 'pending').length;

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Mobile Header */}
      <div className="md:hidden bg-white shadow p-4 flex justify-between items-center">
        <h1 className="text-lg font-bold text-gray-800">جزئیات مشتری</h1>
        <button
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          className="text-gray-700 focus:outline-none"
        >
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            {mobileMenuOpen ? (
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            ) : (
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
            )}
          </svg>
        </button>
      </div>

      <div className="flex flex-col md:flex-row">
        {/* Sidebar */}
        <aside className={`${mobileMenuOpen ? 'block' : 'hidden'} md:block w-full md:w-72 bg-gradient-to-b from-slate-900 to-slate-800 md:h-screen md:fixed z-10 shadow-2xl`}>
          <div className="p-6">
            <div className="hidden md:block mb-8">
              <h1 className="text-2xl font-bold text-white mb-1">داشبورد ادمین</h1>
              <p className="text-slate-400 text-sm">سیستم مدیریت فاکتور</p>
            </div>
            <nav className="space-y-2">
              <Link href="/dashboard" className="flex items-center gap-3 px-4 py-3 text-slate-300 hover:bg-slate-700/50 hover:text-white rounded-xl transition-all duration-200">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
                </svg>
                داشبورد
              </Link>
              <Link href="/dashboard/customers" className="flex items-center gap-3 px-4 py-3 text-white bg-gradient-to-r from-blue-500 to-indigo-500 rounded-xl shadow-lg">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                </svg>
                مشتریان
              </Link>
            </nav>
          </div>
          <div className="md:absolute md:bottom-0 w-full p-6">
            <button
              onClick={handleLogout}
              className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-gradient-to-r from-red-500 to-red-600 text-white rounded-xl hover:from-red-600 hover:to-red-700 shadow-lg transition-all duration-200"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
              </svg>
              خروج
            </button>
          </div>
        </aside>

        {/* Main Content */}
        <main className="flex-1 md:mr-72 bg-gradient-to-br from-slate-50 to-blue-50 min-h-screen p-4 md:p-8">
          <div className="max-w-7xl mx-auto">
            <div className="mb-8">
              <Link href="/dashboard/customers" className="text-blue-600 hover:text-blue-800 mb-4 inline-block">
                ← بازگشت به لیست مشتریان
              </Link>
              <h1 className="text-3xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent mt-2">
                {customer.firstName} {customer.lastName}
              </h1>
              <p className="text-gray-500 mt-2">{customer.phone}</p>
            </div>

            {/* Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
              <div onClick={() => setInvoiceFilter('all')} className="bg-white rounded-2xl shadow-lg shadow-green-100/50 p-6 border border-gray-100 cursor-pointer hover:shadow-xl transition-shadow">
                <p className="text-gray-500 text-sm font-medium">کل خرید</p>
                <p className="text-3xl font-bold text-green-600 mt-2">
                  {new Intl.NumberFormat('fa-IR').format(totalSpent)}
                </p>
                <p className="text-gray-400 text-xs mt-1">تومان</p>
              </div>
              <div onClick={() => setInvoiceFilter('paid')} className="bg-white rounded-2xl shadow-lg shadow-blue-100/50 p-6 border border-gray-100 cursor-pointer hover:shadow-xl transition-shadow">
                <p className="text-gray-500 text-sm font-medium">فاکتورهای پرداخت شده</p>
                <p className="text-3xl font-bold text-blue-600 mt-2">
                  {new Intl.NumberFormat('fa-IR').format(paidInvoices)}
                </p>
                <p className="text-gray-400 text-xs mt-1">فاکتور</p>
              </div>
              <div onClick={() => setInvoiceFilter('pending')} className="bg-white rounded-2xl shadow-lg shadow-yellow-100/50 p-6 border border-gray-100 cursor-pointer hover:shadow-xl transition-shadow">
                <p className="text-gray-500 text-sm font-medium">در انتظار پرداخت</p>
                <p className="text-3xl font-bold text-yellow-600 mt-2">
                  {new Intl.NumberFormat('fa-IR').format(pendingInvoices)}
                </p>
                <p className="text-gray-400 text-xs mt-1">فاکتور</p>
              </div>
            </div>

            {/* Invoices List */}
            <div className="bg-white rounded-2xl shadow-lg shadow-blue-100/50 p-6 border border-gray-100">
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-xl font-bold text-gray-800">
                  {invoiceFilter === 'all' ? 'تاریخچه فاکتورها' : 
                   invoiceFilter === 'paid' ? 'فاکتورهای پرداخت شده' : 
                   'فاکتورهای در انتظار پرداخت'}
                </h2>
                <button
                  onClick={() => setInvoiceFilter('all')}
                  className="text-sm text-blue-600 hover:text-blue-800"
                >
                  نمایش همه
                </button>
              </div>
              {filteredInvoices.length === 0 ? (
                <div className="text-center py-8 text-gray-500">فاکتوری یافت نشد</div>
              ) : (
                <div className="space-y-4">
                  {filteredInvoices.map((invoice) => (
                    <div key={invoice._id} className="bg-gray-50 rounded-xl p-4 border border-gray-200">
                      <div className="flex justify-between items-start mb-3">
                        <div>
                          <p className="font-semibold text-gray-800">
                            فاکتور #{invoice._id.substring(invoice._id.length - 8)}
                          </p>
                          <p className="text-sm text-gray-500">
                            {new Date(invoice.createdAt).toLocaleDateString('fa-IR')}
                          </p>
                        </div>
                        <div className="text-left">
                          <p className="font-bold text-lg text-blue-600">
                            {new Intl.NumberFormat('fa-IR').format(invoice.totalAmount)} تومان
                          </p>
                          <span className={`inline-block px-2 py-1 rounded-full text-xs mt-1 ${
                            invoice.paymentStatus === 'paid' 
                              ? 'bg-green-100 text-green-700' 
                              : invoice.paymentStatus === 'pending'
                              ? 'bg-yellow-100 text-yellow-700'
                              : 'bg-red-100 text-red-700'
                          }`}>
                            {invoice.paymentStatus === 'paid' ? 'پرداخت شده' : 
                             invoice.paymentStatus === 'pending' ? 'در انتظار پرداخت' : 
                             'ناموفق'}
                          </span>
                        </div>
                      </div>
                      <div className="border-t border-gray-200 pt-3 mt-3">
                        <p className="text-sm text-gray-600 mb-2">آیتم‌ها:</p>
                        <div className="space-y-2">
                          {invoice.items.map((item, idx) => (
                            <div key={idx} className="flex justify-between text-sm">
                              <span className="text-gray-700">
                                {item.type === 'product' 
                                  ? item.product?.name || 'محصول حذف شده'
                                  : item.service?.name || 'خدمت حذف شده'
                                }
                              </span>
                              <span className="text-gray-500">
                                {new Intl.NumberFormat('fa-IR').format(item.price)} × {item.quantity}
                              </span>
                            </div>
                          ))}
                        </div>
                      </div>
                      <div className="mt-4">
                        <Link
                          href={`/invoice/${invoice._id}`}
                          className="text-blue-600 hover:text-blue-800 text-sm"
                        >
                          مشاهده فاکتور →
                        </Link>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}
