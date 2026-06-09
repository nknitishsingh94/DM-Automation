import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config({ path: '.env' });

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

async function checkFailedThreads() {
    const { data, error } = await supabase
        .from('scheduled_posts')
        .select('*')
        .eq('platform', 'threads')
        .order('created_at', { ascending: false })
        .limit(10);
        
    if (error) {
        console.error("Error:", error);
    } else {
        console.log("Recent Threads Posts:", JSON.stringify(data, null, 2));
    }
}

checkFailedThreads();
