import { supabase } from '../lib/supabase.js';

const Service = {
  async findOne(query = {}) {
    let q = supabase.from('services').select('*');
    if (query._id) q = q.eq('id', query._id);
    const { data, error } = await q.limit(1).maybeSingle();
    if (error) throw error;
    if (!data) return null;
    return { ...data, _id: data.id, id: data.id };
  },
  async find(query = {}) {
    let q = supabase.from('services').select('*').order('created_at', { ascending: false });
    const { data, error } = await q;
    if (error) throw error;
    return (data || []).map(d => ({ ...d, _id: d.id, id: d.id }));
  },
  async create(doc) {
    const { data, error } = await supabase.from('services').insert({
      name: doc.name,
      price: doc.price,
      description: doc.description || '',
      image_url: doc.imageUrl || '',
    }).select().single();
    if (error) throw error;
    return { ...data, _id: data.id, id: data.id, imageUrl: data.image_url };
  },
  async findByIdAndUpdate(id, update) {
    const updates = {};
    if (update.name) updates.name = update.name;
    if (update.price) updates.price = update.price;
    if (update.description !== undefined) updates.description = update.description;
    if (update.imageUrl !== undefined) updates.image_url = update.imageUrl;
    updates.updated_at = new Date().toISOString();
    const { data, error } = await supabase.from('services').update(updates).eq('id', id).select().single();
    if (error) throw error;
    return { ...data, _id: data.id, id: data.id, imageUrl: data.image_url };
  },
  async findByIdAndDelete(id) {
    const { error } = await supabase.from('services').delete().eq('id', id);
    if (error) throw error;
    return null;
  }
};

Service.findById = Service.findOne;

export default Service;
