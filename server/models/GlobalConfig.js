import { createSupabaseModel } from '../utils/supabase.js';

const GlobalConfig = createSupabaseModel('global_configs');

export default GlobalConfig;
