import { supabase } from './supabase.js';

const Customer = {
  async find(query = {}) {
    let q = supabase.from('customers').select('*').order('created_at', { ascending: false });
    const { data, error } = await q;
    if (error) throw error;
    return (data || []).map(d => ({ ...d, _id: d.id, id: d.id, firstName: d.first_name, lastName: d.last_name }));
  },
  async findOne(query = {}) {
    let q = supabase.from('customers').select('*');
    if (query.phone) q = q.eq('phone', query.phone);
    if (query._id) q = q.eq('id', query._id);
    const { data, error } = await q.limit(1).maybeSingle();
    if (error) throw error;
    if (!data) return null;
    return { ...data, _id: data.id, id: data.id, firstName: data.first_name, lastName: data.last_name };
  },
  async findById(id) {
    return Customer.findOne({ _id: id });
  },
  async create(doc) {
    const { data, error } = await supabase.from('customers').insert({
      first_name: doc.firstName || doc.first_name,
      last_name: doc.lastName || doc.last_name,
      phone: doc.phone,
    }).select().single();
    if (error) throw error;
    return { ...data, _id: data.id, id: data.id, firstName: data.first_name, lastName: data.last_name };
  },
  async findByIdAndUpdate(id, update, options = {}) {
    const payload = {};
    if (update.firstName !== undefined) payload.first_name = update.firstName;
    if (update.lastName !== undefined) payload.last_name = update.lastName;
    if (update.phone !== undefined) payload.phone = update.phone;
    const { data, error } = await supabase.from('customers').update(payload).eq('id', id).select().single();
    if (error) throw error;
    return { ...data, _id: data.id, id: data.id, firstName: data.first_name, lastName: data.last_name };
  },
  async findByIdAndDelete(id) {
    const { data, error } = await supabase.from('customers').delete().eq('id', id).select().single();
    if (error) throw error;
    if (!data) return null;
    return { ...data, _id: data.id, id: data.id };
  }
};

export default Customer;
