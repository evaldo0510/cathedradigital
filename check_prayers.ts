import { createClient } from '@supabase/supabase-js';
const supabase = createClient(process.env.VITE_SUPABASE_URL!, process.env.VITE_SUPABASE_ANON_KEY!);
async function main() {
  const { data, error } = await supabase.from('prayers').select('id, slug, title, is_published');
  if (error) {
    console.error('SQL_CHECK_ERROR:', error.message);
    process.exit(1);
  }
  console.log('SQL_CHECK_RESULT:', JSON.stringify(data));
}
main();
