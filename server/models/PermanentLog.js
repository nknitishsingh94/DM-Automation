import { createSupabaseModel } from '../utils/supabase.js';

const PermanentLog = createSupabaseModel('permanent_logs');

export default PermanentLog;
