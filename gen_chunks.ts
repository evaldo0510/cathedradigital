
import { ALL_SAINTS } from './src/data/saints';
import * as fs from 'fs';

function escapeSql(str: any): string {
  if (str === null || str === undefined) return 'NULL';
  if (typeof str === 'number') return str.toString();
  return `$$${str.toString().replace(/\$\$/g, '$ $')}$$`;
}

function formatArray(arr: string[]): string {
  if (!arr || arr.length === 0) return "'{}'::text[]";
  const escaped = arr.map(s => `"${s.replace(/"/g, '\\"')}"`).join(',');
  return `'\{${escaped}\}'::text[]`;
}

function formatJson(obj: any): string {
  return `$$${JSON.stringify(obj).replace(/\$\$/g, '$ $')}$$::jsonb`;
}

function formatIntArray(arr: number[]): string {
  if (!arr || arr.length === 0) return "'{}'::integer[]";
  return `'\{${arr.join(',')}\}'::integer[]`;
}

const chunkSize = 20;
for (let i = 0; i < ALL_SAINTS.length; i += chunkSize) {
  const batch = ALL_SAINTS.slice(i, i + chunkSize);
  const rows = batch.map(s => {
    return `(${[
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
    ].join(', ')})`;
  }).join(',\n');

  const sql = `INSERT INTO public.saints (id, name, title, feast_day, feast_month, feast_day_num, born, died, patron_of, bio, full_bio, works, quotes, category, image, prayer, virtues, bible_refs, catechism_refs, church_doc_refs) 
VALUES 
${rows} 
ON CONFLICT (id) DO UPDATE SET 
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
  church_doc_refs = EXCLUDED.church_doc_refs;`;

  fs.writeFileSync(`chunk_${Math.floor(i / chunkSize)}.sql`, sql);
}
console.log(`Generated ${Math.ceil(ALL_SAINTS.length / chunkSize)} chunks.`);
