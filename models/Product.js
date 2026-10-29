import { supabase } from '../lib/supabase.js';

const Product = {
  async findOne(query = {}) {
    if (!supabase) return null;
    let q = supabase.from('products').select('*');
    if (query._id) q = q.eq('id', query._id);
    const { data, error } = await q.limit(1).maybeSingle();
    if (error) throw error;
    if (!data) return null;
    return { ...data, _id: data.id, id: data.id, imageUrl: data.image_url, description: data.description || '' };
  },
  async find(query = {}) {
    if (!supabase) return [];
    let q = supabase.from('products').select('*').order('created_at', { ascending: false });
    const { data, error } = await q;
    if (error) throw error;
    return (data || []).map(d => ({ ...d, _id: d.id, id: d.id, imageUrl: d.image_url, description: d.description || '' }));
  },
  async create(doc) {
    if (!supabase) throw new Error('Supabase not configured');
    const { data, error } = await supabase.from('products').insert({
      name: doc.name,
      price: doc.price,
      description: doc.description || '',
      image_url: doc.imageUrl || '',
    }).select().single();
    if (error) throw error;
    return { ...data, _id: data.id, id: data.id, imageUrl: data.image_url };
  },
  async findByIdAndUpdate(id, update) {
    if (!supabase) throw new Error('Supabase not configured');
    const updates = {};
    if (update.name) updates.name = update.name;
    if (update.price) updates.price = update.price;
    if (update.description !== undefined) updates.description = update.description;
    if (update.imageUrl !== undefined) updates.image_url = update.imageUrl;
    updates.updated_at = new Date().toISOString();
    const { data, error } = await supabase.from('products').update(updates).eq('id', id).select().single();
    if (error) throw error;
    return { ...data, _id: data.id, id: data.id, imageUrl: data.image_url };
  },
  async findByIdAndDelete(id) {
    if (!supabase) throw new Error('Supabase not configured');
    const { data, error } = await supabase.from('products').delete().eq('id', id).select().maybeSingle();
    if (error) throw error;
    if (!data) return null;
    return { ...data, _id: data.id, id: data.id, imageUrl: data.image_url };
  }
};

Product.findById = async (id) => Product.findOne({ _id: id });

export default Product;
