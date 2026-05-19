import { createSupabaseModel } from '../utils/supabase.js';

const Review = createSupabaseModel('reviews');

export default Review;
