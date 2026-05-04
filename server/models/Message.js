import { createSupabaseModel } from '../utils/supabase.js';

const Message = createSupabaseModel('messages');

export default Message;
