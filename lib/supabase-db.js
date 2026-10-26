import { supabase } from './supabase.js';

export async function connectToDatabase() {
  return supabase;
}

export default connectToDatabase;
