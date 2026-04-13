import { createClient } from '@supabase/supabase-js';
import fs from 'fs';

const supabaseUrl = process.env.SUPABASE_URL!;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const supabase = createClient(supabaseUrl, supabaseKey);

async function importSteps() {
  const content = fs.readFileSync('cleaned_steps.json', 'utf8');
  const steps = JSON.parse(content);
  
  console.log(`Parsed ${steps.length} steps.`);
  
  for (let i = 0; i < steps.length; i += 50) {
    const chunk = steps.slice(i, i + 50);
    const { error } = await supabase.from('journey_steps').upsert(chunk, { onConflict: 'id' });
    if (error) {
      console.error('Error inserting chunk:', error);
    } else {
      console.log(`Inserted chunk ${i / 50 + 1}`);
    }
  }
}

importSteps().catch(console.error);
