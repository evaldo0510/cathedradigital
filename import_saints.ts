
import { ALL_SAINTS } from './src/data/saints';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

async function importSaints() {
  console.log(`Starting import of ${ALL_SAINTS.length} saints...`);
  
  const formattedSaints = ALL_SAINTS.map(s => ({
    id: s.id,
    name: s.name,
    title: s.title,
    feast_day: s.feastDay,
    feast_month: s.feastMonth,
    feast_day_num: s.feastDayNum,
    born: s.born,
    died: s.died,
    patron_of: s.patronOf,
    bio: s.bio,
    full_bio: s.fullBio,
    works: JSON.stringify(s.works),
    quotes: s.quotes,
    category: s.category,
    image: s.image,
    prayer: s.prayer,
    virtues: s.virtues,
    bible_refs: JSON.stringify(s.bibleRefs || []),
    catechism_refs: s.catechismRefs || [],
    church_doc_refs: JSON.stringify(s.churchDocRefs || [])
  }));

  // Insert in batches of 50 to avoid limits
  for (let i = 0; i < formattedSaints.length; i += 50) {
    const batch = formattedSaints.slice(i, i + 50);
    const { error } = await supabase
      .from('saints')
      .upsert(batch, { onConflict: 'id' });
    
    if (error) {
      console.error(`Error inserting batch ${i / 50}:`, error);
    } else {
      console.log(`Inserted batch ${i / 50 + 1}`);
    }
  }
  
  console.log('Import finished!');
}

importSaints();
