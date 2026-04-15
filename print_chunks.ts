
import fs from 'fs';

const chunks = fs.readdirSync('.').filter(f => f.startsWith('full_import_chunk_')).sort();

for (const chunk of chunks) {
    const sql = fs.readFileSync(chunk, 'utf-8');
    // We need to use supabase--insert, but since it's a tool, I'll print the instructions
    console.log(`CHUNK: ${chunk}`);
    console.log(sql);
}
