'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { deleteCookie } from 'cookies-next';

export default function DashboardPage() {
  const router = useRouter();
  const [analytics, setAnalytics] = useState(null);
  const [loading, setLoading] = useState(true);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [showInvoiceModal, setShowInvoiceModal] = useState(false);
  const [invoiceFilter, setInvoiceFilter] = useState('all');
  const [invoices, setInvoices] = useState([]);
  const [invoicesLoading, setInvoicesLoading] = useState(false);

  useEffect(() => {
    checkAuth();
    fetchAnalytics();
  }, []);

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

  const fetchAnalytics = async () => {
    try {
      const response = await fetch('/api/analytics/weekly');
      const data = await response.json();
      
      if (response.ok) {
        setAnalytics(data);
      }
    } catch (error) {
      console.error('Error fetching analytics:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => {
    deleteCookie('auth-token');
    router.push('/login');
  };

  const fetchInvoices = async (filter) => {
    setInvoicesLoading(true);
    try {
      const url = filter === 'all' ? '/api/invoices' : `/api/invoices?status=${filter}`;
      const response = await fetch(url);
      const data = await response.json();
      
      if (response.ok) {
        setInvoices(data.invoices);
      }
    } catch (error) {
      console.error('Error fetching invoices:', error);
    } finally {
      setInvoicesLoading(false);
    }
  };

  const handleCardClick = (filter) => {
    setInvoiceFilter(filter);
    setShowInvoiceModal(true);
    fetchInvoices(filter);
  };

  const handleDeleteInvoice = async (invoiceId) => {
    if (!confirm('آیا از حذف این فاکتور مطمئن هستید؟')) {
      return;
    }

    try {
      const response = await fetch(`/api/invoices/${invoiceId}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        setInvoices(invoices.filter(inv => inv._id !== invoiceId));
        fetchAnalytics();
      } else {
        alert('خطا در حذف فاکتور');
      }
    } catch (error) {
      console.error('Error deleting invoice:', error);
      alert('خطا در ارتباط با سرور');
    }
  };

  if (loading) {
    return <div className="p-8 text-center">در حال بارگذاری...</div>;
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Mobile Header */}
      <div className="md:hidden bg-white shadow p-4 flex justify-between items-center">
        <h1 className="text-lg font-bold text-gray-800">داشبورد ادمین</h1>
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
              <a href="/dashboard" className="flex items-center gap-3 px-4 py-3 text-white bg-gradient-to-r from-blue-500 to-indigo-500 rounded-xl shadow-lg">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
                </svg>
                داشبورد
              </a>
              <a href="/dashboard/products" className="flex items-center gap-3 px-4 py-3 text-slate-300 hover:bg-slate-700/50 hover:text-white rounded-xl transition-all duration-200">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
                </svg>
                محصولات
              </a>
              <a href="/dashboard/services" className="flex items-center gap-3 px-4 py-3 text-slate-300 hover:bg-slate-700/50 hover:text-white rounded-xl transition-all duration-200">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                </svg>
                خدمات
              </a>
              <a href="/dashboard/customers" className="flex items-center gap-3 px-4 py-3 text-slate-300 hover:bg-slate-700/50 hover:text-white rounded-xl transition-all duration-200">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                </svg>
                مشتریان
              </a>
              <a href="/dashboard/invoices/create" className="flex items-center gap-3 px-4 py-3 text-slate-300 hover:bg-slate-700/50 hover:text-white rounded-xl transition-all duration-200">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                </svg>
                ایجاد فاکتور
              </a>
              <a href="/dashboard/invoices" className="flex items-center gap-3 px-4 py-3 text-slate-300 hover:bg-slate-700/50 hover:text-white rounded-xl transition-all duration-200">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                </svg>
                فاکتورها
              </a>
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
              <h1 className="text-3xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">داشبورد</h1>
              <p className="text-gray-500 mt-2">نمای کلی آمار و عملکرد</p>
            </div>

            {/* Stats Cards */}
            {analytics && (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
                <div className="bg-white rounded-2xl shadow-lg shadow-blue-100/50 p-6 border border-gray-100 hover:shadow-xl transition-shadow duration-300">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-gray-500 text-sm font-medium">درآمد کل (هفته)</p>
                      <p className="text-3xl font-bold text-green-600 mt-2">
                        {new Intl.NumberFormat('fa-IR').format(analytics.totalRevenue)}
                      </p>
                      <p className="text-gray-400 text-xs mt-1">تومان</p>
                    </div>
                    <div className="bg-gradient-to-br from-green-400 to-green-600 p-4 rounded-2xl shadow-lg">
                      <svg className="w-7 h-7 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                    </div>
                  </div>
                </div>

                <div onClick={() => handleCardClick('pending')} className="bg-white rounded-2xl shadow-lg shadow-yellow-100/50 p-6 border border-gray-100 hover:shadow-xl transition-shadow duration-300 cursor-pointer">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-gray-500 text-sm font-medium">در انتظار پرداخت</p>
                      <p className="text-3xl font-bold text-yellow-600 mt-2">
                        {new Intl.NumberFormat('fa-IR').format(analytics.pendingRevenue)}
                      </p>
                      <p className="text-gray-400 text-xs mt-1">تومان</p>
                    </div>
                    <div className="bg-gradient-to-br from-yellow-400 to-orange-500 p-4 rounded-2xl shadow-lg">
                      <svg className="w-7 h-7 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                    </div>
                  </div>
                </div>

                <div onClick={() => handleCardClick('paid')} className="bg-white rounded-2xl shadow-lg shadow-blue-100/50 p-6 border border-gray-100 hover:shadow-xl transition-shadow duration-300 cursor-pointer">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-gray-500 text-sm font-medium">فاکتورهای پرداخت شده</p>
                      <p className="text-3xl font-bold text-blue-600 mt-2">
                        {new Intl.NumberFormat('fa-IR').format(analytics.paidCount)}
                      </p>
                      <p className="text-gray-400 text-xs mt-1">فاکتور</p>
                    </div>
                    <div className="bg-gradient-to-br from-blue-400 to-indigo-600 p-4 rounded-2xl shadow-lg">
                      <svg className="w-7 h-7 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                    </div>
                  </div>
                </div>

                <div onClick={() => handleCardClick('all')} className="bg-white rounded-2xl shadow-lg shadow-purple-100/50 p-6 border border-gray-100 hover:shadow-xl transition-shadow duration-300 cursor-pointer">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-gray-500 text-sm font-medium">کل فاکتورها</p>
                      <p className="text-3xl font-bold text-purple-600 mt-2">
                        {new Intl.NumberFormat('fa-IR').format(analytics.totalInvoices)}
                      </p>
                      <p className="text-gray-400 text-xs mt-1">فاکتور</p>
                    </div>
                    <div className="bg-gradient-to-br from-purple-400 to-purple-600 p-4 rounded-2xl shadow-lg">
                      <svg className="w-7 h-7 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                      </svg>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Weekly Revenue Chart */}
            {analytics && analytics.dailyRevenue && (
              <div className="bg-white rounded-2xl shadow-lg shadow-blue-100/50 p-8 border border-gray-100 mb-8">
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4">
                  <h2 className="text-xl font-bold text-gray-800">درآمد هفتگی</h2>
                  <div className="flex gap-4">
                    <div className="text-right">
                      <p className="text-xs text-gray-500">کل هفته</p>
                      <p className="text-lg font-bold text-blue-600">
                        {new Intl.NumberFormat('fa-IR').format(analytics.dailyRevenue.reduce((sum, day) => sum + day.revenue, 0))}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-xs text-gray-500">میانگین روزانه</p>
                      <p className="text-lg font-bold text-indigo-600">
                        {new Intl.NumberFormat('fa-IR').format(Math.round(analytics.dailyRevenue.reduce((sum, day) => sum + day.revenue, 0) / analytics.dailyRevenue.length))}
                      </p>
                    </div>
                  </div>
                </div>
                <div className="overflow-x-auto">
                  <div className="flex items-end justify-between h-72 gap-3 min-w-max">
                    {analytics.dailyRevenue.map((day, index) => {
                      const maxRevenue = Math.max(...analytics.dailyRevenue.map(d => d.revenue));
                      const height = maxRevenue > 0 ? (day.revenue / maxRevenue) * 100 : 0;
                      return (
                        <div key={index} className="flex-1 flex flex-col items-center group min-w-[60px]">
                          <div 
                            className="w-full bg-gradient-to-t from-blue-500 to-indigo-500 rounded-t-lg relative transition-all duration-300 group-hover:from-blue-600 group-hover:to-indigo-600 shadow-md" 
                            style={{ height: `${height}%`, minHeight: '4px' }}
                          >
                            <div className="absolute -top-10 left-1/2 transform -translate-x-1/2 text-xs font-semibold text-gray-700 bg-white px-3 py-2 rounded-lg shadow-lg border border-gray-100 opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap z-10">
                              {day.revenue > 0 ? new Intl.NumberFormat('fa-IR').format(day.revenue) + ' تومان' : '0 تومان'}
                            </div>
                          </div>
                          <p className="text-xs text-gray-600 mt-3 font-medium">{day.date}</p>
                          <p className="text-xs text-blue-500 font-semibold">
                            {day.revenue > 0 ? new Intl.NumberFormat('fa-IR').format(day.revenue) : '0'}
                          </p>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>
            )}

            {/* Quick Actions */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <a href="/dashboard/products" className="bg-white rounded-lg shadow p-6 hover:shadow-lg transition cursor-pointer">
                <div className="flex items-center gap-4">
                  <div className="bg-blue-100 p-3 rounded-lg">
                    <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
                    </svg>
                  </div>
                  <div>
                    <h3 className="font-semibold text-gray-800">مدیریت محصولات</h3>
                    <p className="text-sm text-gray-500">افزودن، ویرایش و حذف محصولات</p>
                  </div>
                </div>
              </a>

              <a href="/dashboard/invoices/create" className="bg-white rounded-lg shadow p-6 hover:shadow-lg transition cursor-pointer">
                <div className="flex items-center gap-4">
                  <div className="bg-green-100 p-3 rounded-lg">
                    <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                    </svg>
                  </div>
                  <div>
                    <h3 className="font-semibold text-gray-800">ایجاد فاکتور</h3>
                    <p className="text-sm text-gray-500">ساخت فاکتور جدید برای مشتری</p>
                  </div>
                </div>
              </a>

              <a href="/dashboard/invoices" className="bg-white rounded-lg shadow p-6 hover:shadow-lg transition cursor-pointer">
                <div className="flex items-center gap-4">
                  <div className="bg-purple-100 p-3 rounded-lg">
                    <svg className="w-6 h-6 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                    </svg>
                  </div>
                  <div>
                    <h3 className="font-semibold text-gray-800">تاریخچه فاکتورها</h3>
                    <p className="text-sm text-gray-500">مشاهده فاکتورهای قبلی</p>
                  </div>
                </div>
              </a>
            </div>
          </div>
        </main>
      </div>

      {/* Invoice Modal */}
      {showInvoiceModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-hidden">
            <div className="p-6 border-b border-gray-200 flex justify-between items-center">
              <h2 className="text-2xl font-bold text-gray-800">
                {invoiceFilter === 'pending' ? 'فاکتورهای در انتظار پرداخت' : 
                 invoiceFilter === 'paid' ? 'فاکتورهای پرداخت شده' : 
                 'همه فاکتورها'}
              </h2>
              <button
                onClick={() => setShowInvoiceModal(false)}
                className="text-gray-500 hover:text-gray-700"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            <div className="p-6 overflow-y-auto max-h-[calc(90vh-140px)]">
              {invoicesLoading ? (
                <div className="text-center py-8">در حال بارگذاری...</div>
              ) : invoices.length === 0 ? (
                <div className="text-center py-8 text-gray-500">فاکتوری یافت نشد</div>
              ) : (
                <div className="space-y-4">
                  {invoices.map((invoice) => (
                    <div key={invoice._id} className="bg-gray-50 rounded-xl p-4 border border-gray-200">
                      <div className="flex justify-between items-start mb-3">
                        <div>
                          <p className="font-semibold text-gray-800">
                            {invoice.customerName}
                          </p>
                          <p className="text-sm text-gray-500">{invoice.customerPhone}</p>
                          <p className="text-xs text-gray-400 mt-1">
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
                      <div className="mt-4 flex justify-end">
                        <button
                          onClick={() => handleDeleteInvoice(invoice._id)}
                          className="flex items-center gap-2 px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors"
                        >
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                          </svg>
                          حذف
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
