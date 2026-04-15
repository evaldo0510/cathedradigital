
import { execSync } from 'child_process';
import fs from 'fs';

const files = fs.readdirSync('.').filter(f => f.startsWith('batch_') && f.endsWith('.sql')).sort();

console.log(`Found ${files.length} batches to import.`);

for (const file of files) {
    console.log(`Importing ${file}...`);
    try {
        execSync(`psql -f ${file}`);
        console.log(`Successfully imported ${file}`);
        // Wait 2 seconds between batches
        execSync('sleep 2');
    } catch (error) {
        console.error(`Error importing ${file}:`, error.message);
    }
}
console.log('Finished importing all batches.');
