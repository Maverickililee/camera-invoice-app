import { supabase } from './supabase.js';

async function connectToDatabase() {
  return supabase;
}

export default connectToDatabase;
