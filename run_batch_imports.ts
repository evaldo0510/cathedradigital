
import { execSync } from 'child_process';
import fs from 'fs';

const content = fs.readFileSync('all_chunks.sql', 'utf-8');
// Split by "INSERT INTO"
const commands = content.split('INSERT INTO').filter(c => c.trim().length > 0).map(c => 'INSERT INTO' + c);

console.log(`Found ${commands.length} individual INSERT commands.`);

for (let i = 0; i < commands.length; i++) {
    const cmd = commands[i];
    console.log(`Running command ${i + 1}/${commands.length}...`);
    try {
        // Use psql -c but we need to escape properly
        // Safer to write to a temp file
        fs.writeFileSync('temp_cmd.sql', cmd);
        execSync('psql -f temp_cmd.sql');
        console.log(`Success.`);
    } catch (error) {
        console.error(`Error:`, error.message);
    }
}
console.log('Finished.');
