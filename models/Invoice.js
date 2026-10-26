import { supabase } from '../lib/supabase.js';
import Product from './Product.js';
import Service from './Service.js';

function mapInvoice(data, items = []) {
  if (!data) return null;
  return {
    ...data,
    _id: data.id,
    id: data.id,
    customerName: data.customer_name,
    customerPhone: data.customer_phone,
    totalAmount: Number(data.total_amount) || 0,
    paymentUrl: data.payment_url,
    paymentStatus: data.payment_status,
    createdAt: data.created_at,
    updatedAt: data.updated_at,
    items,
  };
}

async function getItems(invoiceId) {
  const { data, error } = await supabase.from('invoice_items').select('*').eq('invoice_id', invoiceId);
  if (error) throw error;

  return Promise.all((data || []).map(async (item) => {
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
      price: Number(item.price) || 0,
      productId: item.product_id,
      serviceId: item.service_id,
    };
  }));
}

const Invoice = {
  async findOne(query = {}) {
    if (!supabase) return null;
    const id = query._id || query.id;
    if (id) return Invoice.findById(id);
    let q = supabase.from('invoices').select('*');
    if (query.authority) q = q.eq('authority', query.authority);
    const { data, error } = await q.limit(1).maybeSingle();
    if (error) throw error;
    if (!data) return null;
    const items = await getItems(data.id);
    return mapInvoice(data, items);
  },

  async findById(id) {
    if (!supabase || !id || typeof id === 'object') return null;
    const { data, error } = await supabase.from('invoices').select('*').eq('id', id).maybeSingle();
    if (error) throw error;
    if (!data) return null;
    const items = await getItems(data.id);
    return mapInvoice(data, items);
  },

  async find(query = {}) {
    if (!supabase) return [];
    let q = supabase.from('invoices').select('*').order('created_at', { ascending: false });
    if (query.paymentStatus) q = q.eq('payment_status', query.paymentStatus);
    if (query.customerPhone) q = q.eq('customer_phone', query.customerPhone);
    const { data, error } = await q;
    if (error) throw error;
    return Promise.all((data || []).map(async (inv) => {
      const items = await getItems(inv.id);
      return mapInvoice(inv, items);
    }));
  },

  async create(doc) {
    if (!supabase) throw new Error('Supabase not configured');
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
      const itemsToInsert = doc.items.map((item) => ({
        invoice_id: invoiceId,
        product_id: item.productId || item.product || null,
        service_id: item.serviceId || item.service || null,
        type: item.type,
        quantity: Number(item.quantity) || 1,
        price: Number(item.price) || 0,
      }));
      const { error: itemErr } = await supabase.from('invoice_items').insert(itemsToInsert);
      if (itemErr) {
        await supabase.from('invoices').delete().eq('id', invoiceId);
        throw itemErr;
      }
    }

    return Invoice.findById(invoiceId);
  },

  async findByIdAndUpdate(id, update) {
    if (!supabase) throw new Error('Supabase not configured');
    const payload = { updated_at: new Date().toISOString() };
    if (update.customerName !== undefined) payload.customer_name = update.customerName;
    if (update.customerPhone !== undefined) payload.customer_phone = update.customerPhone;
    if (update.totalAmount !== undefined) payload.total_amount = update.totalAmount;
    if (update.paymentUrl !== undefined) payload.payment_url = update.paymentUrl;
    if (update.paymentStatus !== undefined) payload.payment_status = update.paymentStatus;
    if (update.authority !== undefined) payload.authority = update.authority;
    const { error } = await supabase.from('invoices').update(payload).eq('id', id);
    if (error) throw error;
    return Invoice.findById(id);
  },

  async findByIdAndDelete(id) {
    if (!supabase) throw new Error('Supabase not configured');
    const inv = await Invoice.findById(id);
    await supabase.from('invoice_items').delete().eq('invoice_id', id);
    const { error } = await supabase.from('invoices').delete().eq('id', id);
    if (error) throw error;
    return inv;
  },
};

export default Invoice;
