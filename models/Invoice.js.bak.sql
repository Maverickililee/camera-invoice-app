import { supabase } from './supabase.js';
import Product from './Product.js';
import Service from './Service.js';

const Invoice = {
  async find(query = {}) {
    let q = supabase.from('invoices').select('*').order('created_at', { ascending: false });
    if (query.paymentStatus) q = q.eq('payment_status', query.paymentStatus);
    if (query.customerPhone) q = q.eq('customer_phone', query.customerPhone);
    const { data, error } = await q;
    if (error) throw error;
    const invoices = await Promise.all((data || []).map(async (inv) => {
      const items = await Invoice._getItems(inv.id);
      return { 
        ...inv, 
        _id: inv.id, 
        id: inv.id,
        customerName: inv.customer_name,
        customerPhone: inv.customer_phone,
        totalAmount: inv.total_amount,
        paymentUrl: inv.payment_url,
        paymentStatus: inv.payment_status,
        items
      };
    }));
    return invoices;
  },
  async _getItems(invoiceId) {
    const { data, error } = await supabase.from('invoice_items').select('*').eq('invoice_id', invoiceId);
    if (error) throw error;
    return await Promise.all((data || []).map(async (item) => {
      let product = null;
      let service = null;
      if (item.product_id) {
        product = await Product.findById(item.product_id);
      }
      if (item.service_id) {
        service = await Service.findById(item.service_id);
      }
      return {
        _id: item.id,
        id: item.id,
        product,
        service,
        type: item.type,
        quantity: item.quantity,
        price: item.price,
        productId: item.product_id,
        serviceId: item.service_id,
      };
    }));
  },
  async findById(id) {
    const { data, error } = await supabase.from('invoices').select('*').eq('id', id).maybeSingle();
    if (error) throw error;
    if (!data) return null;
    const items = await Invoice._getItems(data.id);
    return { 
      ...data, 
      _id: data.id, 
      id: data.id,
      customerName: data.customer_name,
      customerPhone: data.customer_phone,
      totalAmount: data.total_amount,
      paymentUrl: data.payment_url,
      paymentStatus: data.payment_status,
      items
    };
  },
  async findOne(query = {}) {
    if (query._id) return Invoice.findById(query._id);
    return null;
  },
  async create(doc) {
    const { data, error } = await supabase.from('invoices').insert({
      customer_name: doc.customerName,
      customer_phone: doc.customerPhone,
      total_amount: doc.totalAmount,
      payment_url: doc.paymentUrl || '',
      payment_status: doc.paymentStatus || 'pending',
      authority: doc.authority || '',
    }).select().single();
    if (error) throw error;
    const invoiceId = data.id;
    if (doc.items && doc.items.length) {
      const itemsToInsert = doc.items.map(item => ({
        invoice_id: invoiceId,
        product_id: item.product || item.productId || null,
        service_id: item.service || item.serviceId || null,
        type: item.type,
        quantity: item.quantity,
        price: item.price,
      }));
      const { error: itemErr } = await supabase.from('invoice_items').insert(itemsToInsert);
      if (itemErr) throw itemErr;
    }
    const inv = await Invoice.findById(invoiceId);
    return inv;
  },
  async findByIdAndUpdate(id, update, options = {}) {
    const payload = {};
    if (update.customerName !== undefined) payload.customer_name = update.customerName;
    if (update.customerPhone !== undefined) payload.customer_phone = update.customerPhone;
    if (update.totalAmount !== undefined) payload.total_amount = update.totalAmount;
    if (update.paymentUrl !== undefined) payload.payment_url = update.paymentUrl;
    if (update.paymentStatus !== undefined) payload.payment_status = update.paymentStatus;
    if (update.authority !== undefined) payload.authority = update.authority;
    payload.updated_at = new Date().toISOString();
    const { data, error } = await supabase.from('invoices').update(payload).eq('id', id).select().single();
    if (error) throw error;
    return Invoice.findById(data.id);
  },
  async findByIdAndDelete(id) {
    const inv = await Invoice.findById(id);
    const { error } = await supabase.from('invoices').delete().eq('id', id);
    if (error) throw error;
    return inv;
  },
  populate() {
    return Invoice;
  }
};

Invoice.Schema = {};

export default Invoice;
