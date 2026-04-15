
import { ALL_SAINTS } from './src/data/saints';
import fs from 'fs';

function escape(str: string | undefined): string {
    if (str === undefined || str === null) return 'NULL';
    return "$$" + str.replace(/\$\$/g, '$ $') + "$$";
}

function formatArray(arr: any[] | undefined): string {
    if (!arr) return "'{}'::text[]";
    const escaped = arr.map(v => '"' + String(v).replace(/"/g, '\\"') + '"').join(',');
    return "'{" + escaped + "}'::text[]";
}

function formatIntArray(arr: any[] | undefined): string {
    if (!arr) return "'{}'::integer[]";
    return "'{" + arr.join(',') + "}'::integer[]";
}

let sql = "INSERT INTO public.saints (id, name, title, feast_day, feast_month, feast_day_num, born, died, patron_of, bio, full_bio, works, quotes, category, image, prayer, virtues, bible_refs, catechism_refs, church_doc_refs) VALUES \n";

const values = ALL_SAINTS.map(s => {
    return `(${escape(s.id)}, ${escape(s.name)}, ${escape(s.title)}, ${escape(s.feastDay)}, ${s.feastMonth}, ${s.feastDayNum}, ${escape(s.born)}, ${escape(s.died)}, ${formatArray(s.patronOf)}, ${escape(s.bio)}, ${escape(s.fullBio || s.bio)}, ${escape(JSON.stringify(s.works || []))}::jsonb, ${formatArray(s.quotes)}, ${escape(s.category)}, ${escape(s.image)}, ${escape(s.prayer)}, ${formatArray(s.virtues)}, ${escape(JSON.stringify(s.bibleRefs || []))}::jsonb, ${formatIntArray(s.catechismRefs)}, ${escape(JSON.stringify(s.churchDocRefs || []))}::jsonb)`;
});

sql += values.join(",\n") + "\n";
sql += "ON CONFLICT (id) DO UPDATE SET \n" +
    "    name = EXCLUDED.name, \n" +
    "    title = EXCLUDED.title, \n" +
    "    feast_day = EXCLUDED.feast_day, \n" +
    "    feast_month = EXCLUDED.feast_month, \n" +
    "    feast_day_num = EXCLUDED.feast_day_num, \n" +
    "    born = EXCLUDED.born, \n" +
    "    died = EXCLUDED.died, \n" +
    "    patron_of = EXCLUDED.patron_of, \n" +
    "    bio = EXCLUDED.bio, \n" +
    "    full_bio = EXCLUDED.full_bio, \n" +
    "    works = EXCLUDED.works, \n" +
    "    quotes = EXCLUDED.quotes, \n" +
    "    category = EXCLUDED.category, \n" +
    "    image = EXCLUDED.image, \n" +
    "    prayer = EXCLUDED.prayer, \n" +
    "    virtues = EXCLUDED.virtues, \n" +
    "    bible_refs = EXCLUDED.bible_refs, \n" +
    "    catechism_refs = EXCLUDED.catechism_refs, \n" +
    "    church_doc_refs = EXCLUDED.church_doc_refs;";

fs.writeFileSync('full_import_final.sql', sql);
console.log('Generated full_import_final.sql');
