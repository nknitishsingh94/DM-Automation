
import dotenv from 'dotenv';
dotenv.config({ path: 'server/.env' });
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

async function debug() {
    console.log("--- SYSTEM DIAGNOSTIC START ---");
    const now = new Date();
    console.log("Current Time (UTC):", now.toISOString());

    // 1. Check Table Structure
    console.log("\n1. Checking Table Structure...");
    const { data: cols, error: colErr } = await supabase.rpc('get_columns', { table_name: 'scheduled_posts' });
    if (colErr) console.log("RPC Error (get_columns):", colErr.message);
    else console.log("Columns:", cols.map(c => c.column_name).join(", "));

    // 2. Check ANY Scheduled Post
    console.log("\n2. Checking ANY 'Scheduled' posts in DB...");
    const { data: posts, error } = await supabase
        .from('scheduled_posts')
        .select('*')
        .eq('status', 'Scheduled');

    if (error) {
        console.error("DB Error:", error.message);
    } else {
        console.log(`Found ${posts.length} posts with status "Scheduled".`);
        posts.forEach(p => {
            console.log(`- ID: ${p.id}, User: ${p.user_id || p.userId}, Time: ${p.scheduled_for || p.scheduledFor}, Status: ${p.status}`);
        });
    }

    // 3. Check for specific user (nknitishsingh94@gmail.com)
    console.log("\n3. Finding NITISH User ID...");
    const { data: users } = await supabase.from('users').select('id,email').eq('email', 'nknitishsingh94@gmail.com');
    if (users && users.length > 0) {
        const uid = users[0].id;
        console.log(`Found User: ${uid}`);
        
        const { data: userPosts } = await supabase.from('scheduled_posts').select('*').eq('user_id', uid);
        console.log(`User has ${userPosts?.length || 0} total posts.`);
        userPosts?.forEach(p => {
            console.log(`   [${p.status}] Time: ${p.scheduled_for}, ID: ${p.id}`);
        });
    } else {
        console.log("User not found by email.");
    }
    console.log("--- SYSTEM DIAGNOSTIC END ---");
}

debug();
