import { supabase } from '../lib/supabase.js';

const User = {
  async findOne(query = {}) {
    let q = supabase.from('users').select('*');
    if (query.username) q = q.eq('username', query.username);
    if (query._id) q = q.eq('id', query._id);
    const { data, error } = await q.limit(1).maybeSingle();
    if (error) throw error;
    if (!data) return null;
    return { ...data, _id: data.id, id: data.id };
  },
  async find(query = {}) {
    let q = supabase.from('users').select('*');
    if (query.username) q = q.eq('username', query.username);
    const { data, error } = await q;
    if (error) throw error;
    return (data || []).map(d => ({ ...d, _id: d.id, id: d.id }));
  },
  async create(doc) {
    const { data, error } = await supabase.from('users').insert({
      username: doc.username,
      password: doc.password,
      is_admin: doc.isAdmin || false,
    }).select().single();
    if (error) throw error;
    return { ...data, _id: data.id, id: data.id };
  },
  async countDocuments() {
    const { count, error } = await supabase.from('users').select('*', { count: 'exact', head: true });
    if (error) throw error;
    return count || 0;
  }
};

User.findById = User.findOne;
User.Schema = {};

export default User;
