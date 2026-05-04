import { createSupabaseModel } from '../utils/supabase.js';

const ChatMessage = createSupabaseModel('chat_messages');

export default ChatMessage;
