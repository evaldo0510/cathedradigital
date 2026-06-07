import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";

const SUPABASE_URL = "https://gpwrpmoniglarqwfyryp.supabase.co";

console.log("Gerando script SQL para migração de dados...");

const DEUTERO_BOOKS = [
  { abbr: '1Mc', name: '1 Macabeus', chapters: 16 },
  { abbr: '2Mc', name: '2 Macabeus', chapters: 15 },
  { abbr: 'Tb', name: 'Tobias', chapters: 14 },
  { abbr: 'Jdt', name: 'Judite', chapters: 16 },
  { abbr: 'Sb', name: 'Sabedoria', chapters: 19 },
  { abbr: 'Eclo', name: 'Eclesiástico', chapters: 51 },
  { abbr: 'Br', name: 'Baruc', chapters: 6 }
];

async function translateWithAI(verses: any[], bookName: string, chapter: number, apiKey: string) {
  const prompt = `Translate the following Bible verses from ${bookName} Chapter ${chapter} into natural, high-quality Portuguese (Brazilian). 
  Use the formal and solemn tone typical of Catholic Bibles (like Bíblia de Jerusalém or Ave Maria). 
  Return ONLY a JSON object with a key "verses" containing the array of objects with "number" and "text" fields.
  
  Input: ${JSON.stringify(verses)}`;

  const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
    method: "POST",
    headers: {
      "Authorization": `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: "google/gemini-2.0-flash-lite",
      messages: [
        { role: "system", content: "You are an expert biblical translator specializing in Catholic Portuguese translations. You must return only a JSON object with the key 'verses'." },
        { role: "user", content: prompt }
      ],
      response_format: { type: "json_object" }
    }),
  });

  if (!response.ok) throw new Error(`AI Gateway failed: ${response.status}`);
  const result = await response.json();
  const parsed = JSON.parse(result.choices[0].message.content);
  return parsed.verses;
}

async function migrate() {
  const aiKey = Deno.env.get("LOVABLE_API_KEY");
  if (!aiKey) {
     console.error("LOVABLE_API_KEY ausente.");
     return;
  }

  for (const book of DEUTERO_BOOKS) {
    console.log(`-- Livro: ${book.name}`);
    for (let ch = 1; ch <= book.chapters; ch++) {
       try {
         const res = await fetch(`https://bible-api.com/${encodeURIComponent(book.name)}+${ch}?translation=webbe`);
         const apiData = await res.json();
         if (!apiData.verses) continue;
         
         const englishVerses = apiData.verses.map((v: any) => ({ number: v.verse, text: v.text }));
         const ptVerses = await translateWithAI(englishVerses, book.name, ch, aiKey);
         
         console.log(`-- Cap ${ch} traduzido`);
         
         // Gerar SQL para execução posterior ou via psql
         // Note: we need the book_id. We'll use a subquery.
         const chapterSql = `WITH b AS (SELECT id FROM bible_books WHERE abbrev = '${book.abbr}') INSERT INTO bible_chapters (book_id, number) SELECT id, ${ch} FROM b ON CONFLICT (book_id, number) DO UPDATE SET updated_at = now() RETURNING id;`;
         
         // This is complex for a raw script. We'll use a temporary file.
         const versesSql = ptVerses.map((v: any) => 
            `INSERT INTO bible_verses (chapter_id, number, text) SELECT id, ${v.number}, '${v.text.replace(/'/g, "''")}' FROM (SELECT id FROM bible_chapters WHERE book_id = (SELECT id FROM bible_books WHERE abbrev = '${book.abbr}') AND number = ${ch}) c ON CONFLICT (chapter_id, number) DO UPDATE SET text = EXCLUDED.text;`
         ).join('\n');
         
         await Deno.writeTextFile("migration_data.sql", chapterSql + "\n" + versesSql + "\n", { append: true });
         
         await new Promise(r => setTimeout(r, 200));
       } catch(e) {
          console.error(`Erro no cap ${ch}: ${e.message}`);
       }
    }
  }
}

migrate();
