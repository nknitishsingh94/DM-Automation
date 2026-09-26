import { createSupabaseModel } from '../utils/supabase.js';

const Transaction = createSupabaseModel('transactions');

export default Transaction;
