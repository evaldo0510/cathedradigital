
import { createClient } from '@supabase/supabase-js';
import { ALL_SAINTS } from './src/data/saints';

const supabaseUrl = process.env.SUPABASE_URL!;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const supabase = createClient(supabaseUrl, supabaseKey);

async function importSaints() {
  console.log(`Starting import of ${ALL_SAINTS.length} saints...`);
  
  // Chunking to avoid large request body limits
  const CHUNK_SIZE = 25;
  for (let i = 0; i < ALL_SAINTS.length; i += CHUNK_SIZE) {
    const chunk = ALL_SAINTS.slice(i, i + CHUNK_SIZE);
    
    // Format for DB
    const formatted = chunk.map(s => ({
      id: s.id,
      name: s.name,
      title: s.title,
      feast_day: s.feastDay,
      feast_month: s.feastMonth,
      feast_day_num: s.feastDayNum,
      born: s.born || '',
      died: s.died || '',
      patron_of: s.patronOf || [],
      bio: s.bio || '',
      full_bio: s.fullBio || s.bio || '',
      category: s.category,
      image: s.image || '',
      prayer: s.prayer || '',
      virtues: s.virtues || [],
      quotes: s.quotes || [],
      works: JSON.stringify(s.works || []),
      bible_refs: JSON.stringify(s.bibleRefs || []),
      catechism_refs: s.catechismRefs || [],
      church_doc_refs: JSON.stringify(s.churchDocRefs || [])
    }));

    const { error } = await supabase.from('saints').upsert(formatted, { onConflict: 'id' });
    
    if (error) {
      console.error(`Error importing chunk ${i / CHUNK_SIZE + 1}:`, error);
    } else {
      console.log(`Imported chunk ${i / CHUNK_SIZE + 1} (${Math.min(i + CHUNK_SIZE, ALL_SAINTS.length)}/${ALL_SAINTS.length})`);
    }
  }
}

importSaints().catch(console.error);
