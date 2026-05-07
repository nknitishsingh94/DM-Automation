import { createSupabaseModel } from '../utils/supabase.js';

const ScheduledPost = createSupabaseModel('scheduled_posts');

export default ScheduledPost;
