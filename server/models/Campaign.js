import { createSupabaseModel } from '../utils/supabase.js';

const Campaign = createSupabaseModel('campaigns');

export default Campaign;
