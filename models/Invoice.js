import { supabase } from '../lib/supabase.js';

const Invoice = {
  async findOne(query = {}) {
    if (!supabase) return null;
    let q = supabase.from('invoices').select('*');
    if (query._id) q = q.eq('id', query._id);
    if (query.authority) q = q.eq('authority', query.authority);
    const { data, error } = await q.limit(1).maybeSingle();
    if (error) throw error;
    if (!data) return null;
    return { ...data, _id: data.id, id: data.id };
  },
  async find(query = {}) {
    if (!supabase) return [];
    let q = supabase.from('invoices').select('*').order('created_at', { ascending: false });
    const { data, error } = await q;
    if (error) throw error;
    return (data || []).map(d => ({ ...d, _id: d.id, id: d.id }));
  },
  async create(doc) {
    if (!supabase) throw new Error('Supabase not configured');
    const { data, error } = await supabase.from('invoices').insert({
      customer_name: doc.customerName,
      customer_phone: doc.customerPhone,
      items: doc.items,
      total_amount: doc.totalAmount,
      payment_url: doc.paymentUrl || '',
      payment_status: doc.paymentStatus || 'pending',
      authority: doc.authority || '',
    }).select().single();
    if (error) throw error;
    return { ...data, _id: data.id, id: data.id, customerName: data.customer_name, customerPhone: data.customer_phone, totalAmount: data.total_amount, paymentUrl: data.payment_url, paymentStatus: data.payment_status };
  },
  async findByIdAndUpdate(id, update) {
    if (!supabase) throw new Error('Supabase not configured');
    const updates = {};
    if (update.paymentStatus) updates.payment_status = update.paymentStatus;
    if (update.paymentUrl) updates.payment_url = update.paymentUrl;
    if (update.authority) updates.authority = update.authority;
    updates.updated_at = new Date().toISOString();
    const { data, error } = await supabase.from('invoices').update(updates).eq('id', id).select().single();
    if (error) throw error;
    return { ...data, _id: data.id, id: data.id, customerName: data.customer_name, customerPhone: data.customer_phone, totalAmount: data.total_amount, paymentUrl: data.payment_url, paymentStatus: data.payment_status };
  },
  async findByIdAndDelete(id) {
    if (!supabase) throw new Error('Supabase not configured');
    const { error } = await supabase.from('invoices').delete().eq('id', id);
    if (error) throw error;
    return null;
  }
};

Invoice.findById = Invoice.findOne;

export default Invoice;
