
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.resolve('server', '.env') });

import { createClient } from '@supabase/supabase-js';

console.log("URL:", process.env.SUPABASE_URL ? "SET" : "MISSING");
console.log("KEY:", process.env.SUPABASE_SERVICE_ROLE_KEY ? "SET" : "MISSING");

const supabase = createClient(process.env.SUPABASE_URL || 'missing', process.env.SUPABASE_SERVICE_ROLE_KEY || 'missing');

async function debug() {
    console.log("QUICK CHECK START");
    const { data: posts, error } = await supabase.from('scheduled_posts').select('*').limit(5);
    if (error) console.error("Error:", error.message);
    else console.log("Posts found:", (posts || []).length);
    if (posts) {
        posts.forEach(p => console.log(`Post ID: ${p.id}, Status: ${p.status}, Time: ${p.scheduled_for}`));
    }
}
debug();
