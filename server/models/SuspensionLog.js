import { createSupabaseModel } from '../utils/supabase.js';

const SuspensionLog = createSupabaseModel('suspension_logs');

export default SuspensionLog;
