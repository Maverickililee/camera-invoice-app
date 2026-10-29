import { supabase } from '../lib/supabase.js';

const Customer = {
  async findOne(query = {}) {
    if (!supabase) return null;
    let q = supabase.from('customers').select('*');
    if (query.phone) q = q.eq('phone', query.phone);
    if (query._id) q = q.eq('id', query._id);
    const { data, error } = await q.limit(1).maybeSingle();
    if (error) throw error;
    if (!data) return null;
    return { ...data, _id: data.id, id: data.id, firstName: data.first_name, lastName: data.last_name };
  },
  async find(query = {}) {
    if (!supabase) return [];
    let q = supabase.from('customers').select('*');
    if (query.phone) q = q.eq('phone', query.phone);
    const { data, error } = await q;
    if (error) throw error;
    return (data || []).map(d => ({ ...d, _id: d.id, id: d.id, firstName: d.first_name, lastName: d.last_name }));
  },
  async create(doc) {
    if (!supabase) throw new Error('Supabase not configured');
    const { data, error } = await supabase.from('customers').insert({
      first_name: doc.firstName,
      last_name: doc.lastName,
      phone: doc.phone,
    }).select().single();
    if (error) throw error;
    return { ...data, _id: data.id, id: data.id, firstName: data.first_name, lastName: data.last_name };
  },
  async findByIdAndUpdate(id, update) {
    if (!supabase) throw new Error('Supabase not configured');
    const updates = {};
    if (update.firstName) updates.first_name = update.firstName;
    if (update.lastName) updates.last_name = update.lastName;
    if (update.phone) updates.phone = update.phone;
    const { data, error } = await supabase.from('customers').update(updates).eq('id', id).select().single();
    if (error) throw error;
    return { ...data, _id: data.id, id: data.id, firstName: data.first_name, lastName: data.last_name };
  },
  async findByIdAndDelete(id) {
    if (!supabase) throw new Error('Supabase not configured');
    const { data, error } = await supabase.from('customers').delete().eq('id', id).select().maybeSingle();
    if (error) throw error;
    if (!data) return null;
    return { ...data, _id: data.id, id: data.id, firstName: data.first_name, lastName: data.last_name };
  }
};

Customer.findById = async (id) => Customer.findOne({ _id: id });

export default Customer;
