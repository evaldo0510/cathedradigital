
import fs from 'fs';

const content = fs.readFileSync('all_chunks.sql', 'utf-8');
const inserts = content.split('INSERT INTO').filter(c => c.trim().length > 0).map(c => 'INSERT INTO' + c);

console.log(`Found ${inserts.length} commands.`);

// Create 10 batches
const batchSize = Math.ceil(inserts.length / 10);
for (let i = 0; i < 10; i++) {
    const batch = inserts.slice(i * batchSize, (i + 1) * batchSize).join('\n');
    if (batch.length > 0) {
        fs.writeFileSync(`batch_${i}.sql`, batch);
        console.log(`Created batch_${i}.sql with ${inserts.slice(i * batchSize, (i + 1) * batchSize).length} commands.`);
    }
}
