import { supabase } from './supabase.js';

const Service = {
  async find(query = {}) {
    let q = supabase.from('services').select('*').order('created_at', { ascending: false });
    const { data, error } = await q;
    if (error) throw error;
    return (data || []).map(d => ({ ...d, _id: d.id, id: d.id, imageUrl: d.image_url }));
  },
  async findById(id) {
    const { data, error } = await supabase.from('services').select('*').eq('id', id).maybeSingle();
    if (error) throw error;
    if (!data) return null;
    return { ...data, _id: data.id, id: data.id, imageUrl: data.image_url };
  },
  async findOne(query = {}) {
    if (query._id) return Service.findById(query._id);
    return null;
  },
  async create(doc) {
    const { data, error } = await supabase.from('services').insert({
      name: doc.name,
      price: doc.price,
      description: doc.description || '',
      image_url: doc.imageUrl || doc.image_url || '',
    }).select().single();
    if (error) throw error;
    return { ...data, _id: data.id, id: data.id, imageUrl: data.image_url };
  },
  async findByIdAndUpdate(id, update, options = {}) {
    const payload = {};
    if (update.name !== undefined) payload.name = update.name;
    if (update.price !== undefined) payload.price = update.price;
    if (update.description !== undefined) payload.description = update.description;
    if (update.imageUrl !== undefined) payload.image_url = update.imageUrl;
    if (update.image_url !== undefined) payload.image_url = update.image_url;
    payload.updated_at = new Date().toISOString();
    const { data, error } = await supabase.from('services').update(payload).eq('id', id).select().single();
    if (error) throw error;
    return { ...data, _id: data.id, id: data.id, imageUrl: data.image_url };
  },
  async findByIdAndDelete(id) {
    const { data, error } = await supabase.from('services').delete().eq('id', id).select().single();
    if (error) throw error;
    if (!data) return null;
    return { ...data, _id: data.id, id: data.id };
  }
};

export default Service;
