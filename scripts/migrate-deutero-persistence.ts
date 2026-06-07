import { createClient } from "@supabase/supabase-js";

const SUPABASE_URL = process.env.SUPABASE_URL!;
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const LOVABLE_API_KEY = process.env.LOVABLE_API_KEY!;


const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

const DEUTERO_BOOKS = [
  { abbr: '1Mc', name: '1 Macabeus', chapters: 16 },
  { abbr: '2Mc', name: '2 Macabeus', chapters: 15 },
  { abbr: 'Tb', name: 'Tobias', chapters: 14 },
  { abbr: 'Jdt', name: 'Judite', chapters: 16 },
  { abbr: 'Sb', name: 'Sabedoria', chapters: 19 },
  { abbr: 'Eclo', name: 'Eclesiástico', chapters: 51 },
  { abbr: 'Br', name: 'Baruc', chapters: 6 }
];

async function translateWithAI(verses: any[], bookName: string, chapter: number) {
  const prompt = `Translate the following Bible verses from ${bookName} Chapter ${chapter} into natural, high-quality Portuguese (Brazilian). 
  Use the formal and solemn tone typical of Catholic Bibles (like Bíblia de Jerusalém or Ave Maria). 
  Return ONLY a JSON object with a key "verses" containing the array of objects with "number" and "text" fields.
  
  Input: ${JSON.stringify(verses)}`;

  const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
    method: "POST",
    headers: {
      "Authorization": `Bearer ${LOVABLE_API_KEY}`,
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

async function migrateDeutero() {
  console.log("🚀 Iniciando Migração Deuterocanônica para Supabase...");

  for (const book of DEUTERO_BOOKS) {
    console.log(`\n📖 Processando ${book.name}...`);
    
    // 1. Garantir livro no banco
    const { data: bookRecord, error: bookError } = await supabase
      .from('bible_books')
      .upsert({ 
        name: book.name, 
        abbrev: book.abbr, 
        testament: 'antigo', 
        canonical_type: 'deuterocanonico', 
        chapters_count: book.chapters 
      })
      .select()
      .single();

    if (bookError) {
      console.error(`Erro ao criar livro ${book.name}:`, bookError);
      continue;
    }

    // 2. Migrar cada capítulo
    for (let ch = 1; ch <= book.chapters; ch++) {
      console.log(`  - Capítulo ${ch}/${book.chapters}`);
      
      try {
        // Fetch from BibleAPI (English WEBBE)
        const englishName = book.name.toLowerCase().replace(' ', '');
        const res = await fetch(`https://bible-api.com/${encodeURIComponent(book.name)}+${ch}?translation=webbe`);
        const apiData = await res.json();
        
        if (!apiData.verses) {
          console.warn(`    ⚠️ Sem versículos para ${book.name} ${ch}`);
          continue;
        }

        const englishVerses = apiData.verses.map((v: any) => ({ number: v.verse, text: v.text }));
        
        // Translate to Portuguese
        const ptVerses = await translateWithAI(englishVerses, book.name, ch);

        // Save Chapter
        const { data: chapterRecord, error: chError } = await supabase
          .from('bible_chapters')
          .upsert({ book_id: bookRecord.id, number: ch })
          .select()
          .single();

        if (chError) {
          console.error(`    ❌ Erro ao salvar capítulo ${ch}:`, chError);
          continue;
        }

        // Save Verses
        const verseInserts = ptVerses.map((v: any) => ({
          chapter_id: chapterRecord.id,
          number: v.number,
          text: v.text
        }));

        const { error: vError } = await supabase
          .from('bible_verses')
          .upsert(verseInserts, { onConflict: 'chapter_id,number' });

        if (vError) {
          console.error(`    ❌ Erro ao salvar versículos do cap ${ch}:`, vError);
        } else {
          console.log(`    ✅ Cap ${ch} migrado com sucesso (${ptVerses.length} versículos)`);
        }

        // Sleep to avoid rate limits
        await new Promise(r => setTimeout(r, 500));
        
      } catch (err) {
        console.error(`    💥 Erro crítico no capítulo ${ch}:`, err.message);
      }
    }
  }

  console.log("\n✨ Migração concluída!");
}

migrateDeutero();
