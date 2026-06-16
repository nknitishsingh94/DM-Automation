import { createSupabaseModel } from '../utils/supabase.js';

const ApiKey = createSupabaseModel('api_keys');

export default ApiKey;
