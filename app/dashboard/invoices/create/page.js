'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { deleteCookie } from 'cookies-next';

export default function CreateInvoicePage() {
  const router = useRouter();
  const [products, setProducts] = useState([]);
  const [filteredProducts, setFilteredProducts] = useState([]);
  const [services, setServices] = useState([]);
  const [filteredServices, setFilteredServices] = useState([]);
  const [customers, setCustomers] = useState([]);
  const [filteredCustomers, setFilteredCustomers] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [customerSearchQuery, setCustomerSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);
  const [cart, setCart] = useState([]);
  const [customerName, setCustomerName] = useState('');
  const [customerPhone, setCustomerPhone] = useState('');
  const [selectedCustomerId, setSelectedCustomerId] = useState('');
  const [invoiceId, setInvoiceId] = useState(null);
  const [paymentUrl, setPaymentUrl] = useState('');
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [activeTab, setActiveTab] = useState('products');
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  useEffect(() => {
    checkAuth();
    fetchProducts();
    fetchServices();
    fetchCustomers();
  }, []);

  useEffect(() => {
    if (searchQuery) {
      const filteredProducts = products.filter(product =>
        product.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        product.description.toLowerCase().includes(searchQuery.toLowerCase())
      );
      const filteredServices = services.filter(service =>
        service.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        service.description.toLowerCase().includes(searchQuery.toLowerCase())
      );
      setFilteredProducts(filteredProducts);
      setFilteredServices(filteredServices);
    } else {
      setFilteredProducts(products);
      setFilteredServices(services);
    }
  }, [searchQuery, products, services]);

  useEffect(() => {
    if (customerSearchQuery) {
      const filtered = customers.filter(customer =>
        customer.firstName.toLowerCase().includes(customerSearchQuery.toLowerCase()) ||
        customer.lastName.toLowerCase().includes(customerSearchQuery.toLowerCase()) ||
        customer.phone.includes(customerSearchQuery)
      );
      setFilteredCustomers(filtered);
    } else {
      setFilteredCustomers(customers);
    }
  }, [customerSearchQuery, customers]);

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

  const fetchProducts = async () => {
    try {
      const response = await fetch('/api/products');
      const data = await response.json();
      
      if (response.ok) {
        setProducts(data.products);
      } else {
        console.error('Failed to fetch products');
      }
    } catch (error) {
      console.error('Error fetching products:', error);
    }
  };

  const fetchServices = async () => {
    try {
      const response = await fetch('/api/services');
      const data = await response.json();
      
      if (response.ok) {
        setServices(data.services);
      } else {
        console.error('Failed to fetch services');
      }
    } catch (error) {
      console.error('Error fetching services:', error);
    }
  };

  const fetchCustomers = async () => {
    try {
      const response = await fetch('/api/customers');
      const data = await response.json();
      
      if (response.ok) {
        setCustomers(data.customers);
      } else {
        console.error('Failed to fetch customers');
      }
    } catch (error) {
      console.error('Error fetching customers:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCustomerSelect = (customerId) => {
    setSelectedCustomerId(customerId);
    if (customerId) {
      const customer = customers.find(c => c._id === customerId);
      if (customer) {
        setCustomerName(customer.firstName + ' ' + customer.lastName);
        setCustomerPhone(customer.phone);
      }
    } else {
      setCustomerName('');
      setCustomerPhone('');
    }
  };

  const addToCart = (item, type, quantity = 1) => {
    const itemId = type === 'product' ? item._id : item._id;
    const existingItem = cart.find(i => i.itemId === itemId && i.type === type);
    
    if (existingItem) {
      setCart(cart.map(i => 
        i.itemId === itemId && i.type === type
          ? { ...i, quantity: i.quantity + quantity }
          : i
      ));
    } else {
      setCart([...cart, {
        itemId,
        type,
        name: item.name,
        price: item.price,
        quantity,
        productId: type === 'product' ? item._id : undefined,
        serviceId: type === 'service' ? item._id : undefined,
      }]);
    }
  };

  const updateCartQuantity = (itemId, type, quantity) => {
    if (quantity <= 0) {
      removeFromCart(itemId, type);
      return;
    }
    setCart(cart.map(i => 
      i.itemId === itemId && i.type === type
        ? { ...i, quantity }
        : i
    ));
  };

  const removeFromCart = (itemId, type) => {
    setCart(cart.filter(item => !(item.itemId === itemId && item.type === type)));
  };

  const getTotal = () => {
    return cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);
  };

  const handleCreateInvoice = async () => {
    if (!customerName || !customerPhone) {
      alert('لطفاً نام و شماره تماس مشتری را وارد کنید');
      return;
    }

    if (cart.length === 0) {
      alert('سبد خرید خالی است');
      return;
    }

    try {
      const response = await fetch('/api/invoices', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          customerName,
          customerPhone,
          items: cart.map(item => ({
            type: item.type,
            productId: item.productId,
            serviceId: item.serviceId,
            quantity: item.quantity,
          })),
        }),
      });

      const data = await response.json();

      if (response.ok) {
        setInvoiceId(data.invoice._id);
        setShowPaymentModal(true);
      } else {
        console.error('Create invoice error:', data);
        alert(data.error || 'خطا در ایجاد فاکتور');
      }
    } catch (error) {
      console.error('Create invoice catch error:', error);
      alert('خطا در ارتباط با سرور: ' + error.message);
    }
  };

  const handleRequestPayment = async () => {
    try {
      const response = await fetch('/api/payment/request', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ invoiceId }),
      });

      const data = await response.json();

      if (response.ok) {
        setPaymentUrl(data.paymentUrl);
      } else {
        alert(data.error || 'خطا در درخواست پرداخت');
      }
    } catch (error) {
      alert('خطا در ارتباط با سرور');
    }
  };

  const copyPaymentLink = () => {
    navigator.clipboard.writeText(paymentUrl);
    alert('لینک پرداخت کپی شد');
  };

  const handleLogout = () => {
    deleteCookie('auth-token');
    router.push('/login');
  };

  if (loading) {
    return <div className="p-8 text-center">در حال بارگذاری...</div>;
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Mobile Header */}
      <div className="md:hidden bg-white shadow p-4 flex justify-between items-center">
        <h1 className="text-lg font-bold text-gray-800">ایجاد فاکتور</h1>
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
              <a href="/dashboard" className="flex items-center gap-3 px-4 py-3 text-slate-300 hover:bg-slate-700/50 hover:text-white rounded-xl transition-all duration-200">
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
              <a href="/dashboard/invoices/create" className="flex items-center gap-3 px-4 py-3 text-white bg-gradient-to-r from-blue-500 to-indigo-500 rounded-xl shadow-lg">
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
              <h1 className="text-3xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">ایجاد فاکتور جدید</h1>
              <p className="text-gray-500 mt-2">ایجاد فاکتور برای مشتریان</p>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Left Column */}
              <div className="space-y-6">
                {/* Customer Info */}
                <div className="bg-white rounded-2xl shadow-lg shadow-blue-100/50 p-6 border border-gray-100">
                  <h2 className="text-lg font-bold text-gray-800 mb-4">اطلاعات مشتری</h2>
                  <div className="space-y-4">
                    <div>
                      <label className="block text-gray-700 mb-2">جستجوی مشتری</label>
                      <input
                        type="text"
                        placeholder="جستجو بر اساس نام یا شماره تماس..."
                        value={customerSearchQuery}
                        onChange={(e) => setCustomerSearchQuery(e.target.value)}
                        className="w-full px-3 py-2 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
                      />
                    </div>
                    {customerSearchQuery && filteredCustomers.length > 0 && (
                      <div className="border border-gray-200 rounded-xl max-h-40 overflow-y-auto">
                        {filteredCustomers.map((customer) => (
                          <div
                            key={customer._id}
                            onClick={() => {
                              setCustomerName(customer.firstName + ' ' + customer.lastName);
                              setCustomerPhone(customer.phone);
                              setSelectedCustomerId(customer._id);
                              setCustomerSearchQuery('');
                            }}
                            className="px-3 py-2 hover:bg-gray-100 cursor-pointer border-b border-gray-100 last:border-b-0"
                          >
                            <p className="font-medium text-gray-800">
                              {customer.firstName} {customer.lastName}
                            </p>
                            <p className="text-sm text-gray-500">{customer.phone}</p>
                          </div>
                        ))}
                      </div>
                    )}
                    <div>
                      <label className="block text-gray-700 mb-2">نام مشتری</label>
                      <input
                        type="text"
                        value={customerName}
                        onChange={(e) => {
                          setCustomerName(e.target.value);
                          setSelectedCustomerId('');
                        }}
                        className="w-full px-3 py-2 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-gray-700 mb-2">شماره تماس</label>
                      <input
                        type="text"
                        value={customerPhone}
                        onChange={(e) => {
                          setCustomerPhone(e.target.value);
                          setSelectedCustomerId('');
                        }}
                        className="w-full px-3 py-2 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
                        required
                      />
                    </div>
                  </div>
                </div>

                {/* Products/Services Selection */}
                <div className="bg-white rounded-2xl shadow-lg shadow-blue-100/50 p-6 border border-gray-100">
                  <h2 className="text-lg font-bold text-gray-800 mb-4">انتخاب محصولات و خدمات</h2>
                  <input
                    type="text"
                    placeholder="جستجوی محصول یا خدمت..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white shadow-sm mb-4"
                  />
                  <div className="flex gap-2 mb-4">
                    <button
                      onClick={() => setActiveTab('products')}
                      className={`flex-1 px-4 py-2 rounded-lg ${activeTab === 'products' ? 'bg-blue-600 text-white' : 'bg-gray-200 text-gray-700'}`}
                    >
                      محصولات
                    </button>
                    <button
                      onClick={() => setActiveTab('services')}
                      className={`flex-1 px-4 py-2 rounded-lg ${activeTab === 'services' ? 'bg-blue-600 text-white' : 'bg-gray-200 text-gray-700'}`}
                    >
                      خدمات
                    </button>
                  </div>

                  {activeTab === 'products' ? (
                    filteredProducts.length === 0 ? (
                      <p className="text-gray-500 text-center py-4">محصولی یافت نشد</p>
                    ) : (
                      <div className="space-y-3">
                        {filteredProducts.map((product) => (
                          <div 
                            key={product._id}
                            className="flex items-center justify-between p-3 border rounded-lg hover:bg-gray-50"
                          >
                            <div className="flex items-center gap-3">
                              {product.imageUrl ? (
                                <img
                                  src={product.imageUrl}
                                  alt={product.name}
                                  className="w-12 h-12 object-cover rounded-lg cursor-pointer hover:opacity-80"
                                  onClick={() => window.open(product.imageUrl, '_blank')}
                                />
                              ) : (
                                <div className="w-12 h-12 bg-gray-200 rounded-lg flex items-center justify-center text-gray-400">
                                  -
                                </div>
                              )}
                              <div>
                                <p className="font-medium text-gray-800">{product.name}</p>
                                <p className="text-sm text-gray-500">{new Intl.NumberFormat('fa-IR').format(product.price)} تومان</p>
                              </div>
                            </div>
                            <button 
                              onClick={() => addToCart(product, 'product')}
                              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                            >
                              +
                            </button>
                          </div>
                        ))}
                      </div>
                    )
                  ) : (
                    filteredServices.length === 0 ? (
                      <p className="text-gray-500 text-center py-4">خدمتی یافت نشد</p>
                    ) : (
                      <div className="space-y-3">
                        {filteredServices.map((service) => (
                          <div 
                            key={service._id}
                            className="flex items-center justify-between p-3 border rounded-lg hover:bg-gray-50"
                          >
                            <div className="flex items-center gap-3">
                              {service.imageUrl ? (
                                <img
                                  src={service.imageUrl}
                                  alt={service.name}
                                  className="w-12 h-12 object-cover rounded-lg cursor-pointer hover:opacity-80"
                                  onClick={() => window.open(service.imageUrl, '_blank')}
                                />
                              ) : (
                                <div className="w-12 h-12 bg-gray-200 rounded-lg flex items-center justify-center text-gray-400">
                                  -
                                </div>
                              )}
                              <div>
                                <p className="font-medium text-gray-800">{service.name}</p>
                                <p className="text-sm text-gray-500">{new Intl.NumberFormat('fa-IR').format(service.price)} تومان</p>
                              </div>
                            </div>
                            <button 
                              onClick={() => addToCart(service, 'service')}
                              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                            >
                              +
                            </button>
                          </div>
                        ))}
                      </div>
                    )
                  )}
                </div>
              </div>

              {/* Right Column - Cart */}
              <div>
                <div className="bg-white rounded-2xl shadow-lg shadow-blue-100/50 p-6 sticky top-8 border border-gray-100">
                  <h2 className="text-lg font-bold text-gray-800 mb-4">سبد خرید</h2>
                  
                  {cart.length === 0 ? (
                    <p className="text-gray-500 text-center py-8">سبد خرید خالی است</p>
                  ) : (
                    <>
                      <div className="space-y-3 mb-4">
                        {cart.map((item) => (
                          <div 
                            key={`${item.type}-${item.itemId}`}
                            className="flex items-center justify-between p-3 border rounded-lg"
                          >
                            <div className="flex-1">
                              <p className="font-medium text-gray-800">{item.name}</p>
                              <p className="text-sm text-gray-500">{new Intl.NumberFormat('fa-IR').format(item.price)} تومان</p>
                            </div>
                            <div className="flex items-center gap-2">
                              <button 
                                onClick={() => updateCartQuantity(item.itemId, item.type, item.quantity - 1)}
                                className="w-8 h-8 bg-gray-200 rounded hover:bg-gray-300"
                              >
                                -
                              </button>
                              <input
                                type="number"
                                min="1"
                                value={item.quantity}
                                onChange={(e) => updateCartQuantity(item.itemId, item.type, parseInt(e.target.value) || 1)}
                                className="w-16 text-center border rounded px-2 py-1"
                              />
                              <button 
                                onClick={() => updateCartQuantity(item.itemId, item.type, item.quantity + 1)}
                                className="w-8 h-8 bg-gray-200 rounded hover:bg-gray-300"
                              >
                                +
                              </button>
                              <button 
                                onClick={() => removeFromCart(item.itemId, item.type)}
                                className="w-8 h-8 bg-red-100 text-red-600 rounded hover:bg-red-200"
                              >
                                ×
                              </button>
                            </div>
                          </div>
                        ))}
                      </div>

                      <div className="border-t pt-4 mb-4">
                        <div className="flex justify-between items-center text-xl font-bold">
                          <span className="text-gray-700">جمع کل:</span>
                          <span className="text-blue-600">{new Intl.NumberFormat('fa-IR').format(getTotal())} تومان</span>
                        </div>
                      </div>

                      <button 
                        onClick={handleCreateInvoice}
                        className="w-full px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 font-medium"
                      >
                        ایجاد فاکتور
                      </button>
                    </>
                  )}
                </div>
              </div>
            </div>
          </div>
        </main>
      </div>

      {/* Payment Modal */}
      {showPaymentModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md">
            <h2 className="text-xl font-bold mb-4">فاکتور ایجاد شد</h2>
            
            {!paymentUrl ? (
              <>
                <p className="text-gray-600 mb-6">فاکتور با موفقیت ایجاد شد. آیا می‌خواهید لینک پرداخت را بسازید؟</p>
                <div className="flex gap-3">
                  <button 
                    onClick={handleRequestPayment}
                    className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                  >
                    ساخت لینک پرداخت
                  </button>
                  <button 
                    onClick={() => router.push(`/invoice/${invoiceId}`)}
                    className="flex-1 px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300"
                  >
                    مشاهده فاکتور
                  </button>
                </div>
              </>
            ) : (
              <>
                <p className="text-gray-600 mb-4">لینک پرداخت ایجاد شد:</p>
                <div className="bg-gray-50 p-4 rounded-lg mb-4 break-all text-sm">
                  {paymentUrl}
                </div>
                <div className="flex gap-3 mb-3">
                  <button 
                    onClick={copyPaymentLink}
                    className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                  >
                    کپی لینک
                  </button>
                  <button 
                    onClick={() => window.open(paymentUrl, '_blank')}
                    className="flex-1 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
                  >
                    پرداخت
                  </button>
                </div>
                <button 
                  onClick={() => router.push(`/invoice/${invoiceId}`)}
                  className="w-full px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300"
                >
                  مشاهده فاکتور
                </button>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
