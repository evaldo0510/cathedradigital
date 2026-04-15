
import { ALL_SAINTS } from './src/data/saints';

function escapeSql(str: string): string {
  if (!str) return 'NULL';
  // Use dollar quoting for all text fields to safely handle single quotes and newlines
  return `$$${str}$$`;
}

function formatArray(arr: string[]): string {
  if (!arr || arr.length === 0) return "'{}'::text[]";
  const escaped = arr.map(s => `"${s.replace(/"/g, '\\"')}"`).join(',');
  return `'\{${escaped}\}'::text[]`;
}

function formatJson(obj: any): string {
  // Dollar quote for JSONB as well
  return `$$${JSON.stringify(obj)}$$::jsonb`;
}

function formatIntArray(arr: number[]): string {
  if (!arr || arr.length === 0) return "'{}'::integer[]";
  return `'\{${arr.join(',')}\}'::integer[]`;
}


const BATCH_SIZE = 5;

for (let i = 0; i < ALL_SAINTS.length; i += BATCH_SIZE) {
  const batch = ALL_SAINTS.slice(i, i + BATCH_SIZE);
  console.log(`INSERT INTO public.saints (id, name, title, feast_day, feast_month, feast_day_num, born, died, patron_of, bio, full_bio, works, quotes, category, image, prayer, virtues, bible_refs, catechism_refs, church_doc_refs) VALUES`);
  
  for (let j = 0; j < batch.length; j++) {
    const s = batch[j];
    const row = [
      escapeSql(s.id),
      escapeSql(s.name),
      escapeSql(s.title),
      escapeSql(s.feastDay),
      s.feastMonth || 'NULL',
      s.feastDayNum || 'NULL',
      escapeSql(s.born || ''),
      escapeSql(s.died || ''),
      formatArray(s.patronOf || []),
      escapeSql(s.bio || ''),
      escapeSql(s.fullBio || s.bio || ''),
      formatJson(s.works || []),
      formatArray(s.quotes || []),
      escapeSql(s.category),
      escapeSql(s.image || ''),
      escapeSql(s.prayer || ''),
      formatArray(s.virtues || []),
      formatJson(s.bibleRefs || []),
      formatIntArray(s.catechismRefs || []),
      formatJson(s.churchDocRefs || [])
    ].join(', ');

    console.log(`(${row})${j === batch.length - 1 ? '' : ','}`);
  }

  console.log(`ON CONFLICT (id) DO UPDATE SET 
    name = EXCLUDED.name,
    title = EXCLUDED.title,
    feast_day = EXCLUDED.feast_day,
    feast_month = EXCLUDED.feast_month,
    feast_day_num = EXCLUDED.feast_day_num,
    born = EXCLUDED.born,
    died = EXCLUDED.died,
    patron_of = EXCLUDED.patron_of,
    bio = EXCLUDED.bio,
    full_bio = EXCLUDED.full_bio,
    works = EXCLUDED.works,
    quotes = EXCLUDED.quotes,
    category = EXCLUDED.category,
    image = EXCLUDED.image,
    prayer = EXCLUDED.prayer,
    virtues = EXCLUDED.virtues,
    bible_refs = EXCLUDED.bible_refs,
    catechism_refs = EXCLUDED.catechism_refs,
    church_doc_refs = EXCLUDED.church_doc_refs;`);
}


