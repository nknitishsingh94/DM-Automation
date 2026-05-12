import 'dotenv/config';
import { supabase } from '../utils/supabase.js';

async function probe() {
  console.log("🔍 Probing 'campaigns' columns...");
  // We use a query that will fail if we guess a column wrong, 
  // or we can use a raw SQL if we have access, but we don't.
  // Instead, let's just fetch everything and see the keys of the first row.
  const { data, error } = await supabase.from('campaigns').select('*').limit(1);
  if (error) console.error("❌ Campaigns error:", error.message);
  else {
    if (data.length > 0) {
      console.log("✅ Campaigns columns:", Object.keys(data[0]));
    } else {
      console.log("⚠️ Campaigns table is empty. Inserting a test row...");
      const testRow = {
        userId: '70aafc45-6ca3-4ed1-9dea-99d4c7a613cb',
        name: 'Test',
        trigger: 'TEST',
        response: 'test',
        dmsSent: 0,
        status: 'Active'
      };
      const { data: d2, error: e2 } = await supabase.from('campaigns').insert(testRow).select();
      if (e2) {
        console.error("❌ Insert failed:", e2.message);
        console.log("🔍 Trying with lowercase column names...");
        const lowerRow = {
          userid: testRow.userId,
          name: testRow.name,
          trigger: testRow.trigger,
          response: testRow.response,
          dmssent: 0,
          status: testRow.status
        };
        const { data: d3, error: e3 } = await supabase.from('campaigns').insert(lowerRow).select();
        if (e3) console.error("❌ Lowercase insert failed too:", e3.message);
        else console.log("✅ Success with lowercase! Columns:", Object.keys(d3[0]));
      } else {
        console.log("✅ Success with camelCase! Columns:", Object.keys(d2[0]));
      }
    }
  }
}

probe();
