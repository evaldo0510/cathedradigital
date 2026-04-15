
import { execSync } from 'child_process';
import fs from 'fs';

const files = fs.readdirSync('.').filter(f => f.startsWith('saint_chunk_')).sort();

console.log(`Found ${files.length} chunks to import.`);

for (const file of files) {
    console.log(`Importing ${file}...`);
    try {
        execSync(`psql -f ${file}`);
        console.log(`Successfully imported ${file}`);
    } catch (error) {
        console.error(`Error importing ${file}:`, error.message);
    }
}
console.log('Finished importing all chunks.');
