
import dotenv from 'dotenv';
dotenv.config({ path: 'server/.env' });
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

async function debug() {
    console.log("QUICK CHECK START");
    const { data: posts, error } = await supabase.from('scheduled_posts').select('*').limit(5);
    if (error) console.error(error);
    else console.log(JSON.stringify(posts, null, 2));
}
debug();
