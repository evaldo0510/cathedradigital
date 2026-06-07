const BOOKS_TO_TEST = [
  { abbr: 'Sl', ch: 151, expectedMinVerses: 1 },
  { abbr: 'Sl', ch: 119, expectedMinVerses: 176 },
  { abbr: 'Ab', ch: 1, expectedMinVerses: 1 },
  { abbr: 'Tb', ch: 1, expectedMinVerses: 1 },
  { abbr: 'Jt', ch: 1, expectedMinVerses: 1 },
  { abbr: 'Sb', ch: 1, expectedMinVerses: 1 },
  { abbr: 'Eclo', ch: 1, expectedMinVerses: 1 },
  { abbr: 'Br', ch: 1, expectedMinVerses: 1 },
  { abbr: '1Mc', ch: 1, expectedMinVerses: 1 },
  { abbr: '2Mc', ch: 1, expectedMinVerses: 1 },
  { abbr: '1 João', ch: 1, expectedMinVerses: 1 },
  { abbr: '2 Reis', ch: 1, expectedMinVerses: 1 }
];

async function runTests() {
  console.log('--- BIBLE PREMIUM REGRESSION TESTS ---');
  let failures = 0;

  for (const test of BOOKS_TO_TEST) {
    try {
      // Mocking the call structure similar to supabase.functions.invoke
      const response = await fetch('https://pdtitltfscdxtvujveoe.functions.supabase.co/bible-text', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${process.env.SUPABASE_ANON_KEY}`
        },
        body: JSON.stringify({ book: test.abbr, chapter: test.ch })
      });

      if (!response.ok) {
        console.error(`❌ FAIL: ${test.abbr} ${test.ch} - HTTP ${response.status}`);
        failures++;
        continue;
      }

      const data = await response.json();
      const verseCount = data.verses?.length || 0;

      if (verseCount >= test.expectedMinVerses) {
        console.log(`✅ PASS: ${test.abbr} ${test.ch} (${verseCount} verses)`);
      } else {
        console.error(`❌ FAIL: ${test.abbr} ${test.ch} - Expected >= ${test.expectedMinVerses}, found ${verseCount}`);
        failures++;
      }
    } catch (e) {
      console.error(`❌ FAIL: ${test.abbr} ${test.ch} - Error: ${e.message}`);
      failures++;
    }
  }

  console.log(`--- SUMMARY: ${BOOKS_TO_TEST.length - failures} PASSED, ${failures} FAILED ---`);
  process.exit(failures > 0 ? 1 : 0);
}

runTests();