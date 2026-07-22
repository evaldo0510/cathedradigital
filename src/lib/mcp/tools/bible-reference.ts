import { defineTool } from "@lovable.dev/mcp-js";
import { createClient } from "@supabase/supabase-js";
import { z } from "zod";

/**
 * Resolve uma referência bíblica como "Jo 3,16" · "Mt 5,3-12" · "Gn 1,1-2,3"
 * (formato português) para os versículos correspondentes.
 *
 * Aceita também parâmetros estruturados quando `reference` não é fornecido.
 * Máx. 50 versículos por chamada.
 */
export default defineTool({
  name: "bible_reference",
  title: "Referência Bíblica",
  description:
    "Retorna o texto dos versículos de uma referência bíblica (ex.: 'Jo 3,16', 'Mt 5,3-12'). Alternativamente aceita abreviação do livro + capítulo + versículo(s). Dados públicos.",
  inputSchema: {
    reference: z.string().trim().min(1).max(60).optional().describe("Referência no formato PT-BR: 'Jo 3,16' ou 'Mt 5,3-12'."),
    book: z.string().trim().min(1).max(10).optional().describe("Abreviação do livro (ex.: 'Jo', 'Mt', 'Gn')."),
    chapter: z.number().int().min(1).max(200).optional(),
    verse: z.number().int().min(1).max(200).optional(),
    verse_end: z.number().int().min(1).max(200).optional(),
  },
  annotations: { readOnlyHint: true, idempotentHint: true, openWorldHint: false },
  handler: async (input) => {
    let book = input.book;
    let chapter = input.chapter;
    let verse = input.verse;
    let verseEnd = input.verse_end;

    if (input.reference) {
      // "Jo 3,16" | "Mt 5,3-12" | "Gn 1,1-3"
      const m = input.reference.match(/^\s*([1-3]?\s?[A-Za-zÀ-ÿ]+)\s*(\d+)\s*[,:]\s*(\d+)(?:\s*[-–]\s*(\d+))?\s*$/);
      if (!m) return { content: [{ type: "text", text: `Formato não reconhecido: '${input.reference}'. Use 'Jo 3,16' ou 'Mt 5,3-12'.` }], isError: true };
      book = m[1].replace(/\s+/g, "");
      chapter = Number(m[2]);
      verse = Number(m[3]);
      verseEnd = m[4] ? Number(m[4]) : undefined;
    }

    if (!book || !chapter || !verse) {
      return { content: [{ type: "text", text: "Forneça `reference` ou `book`+`chapter`+`verse`." }], isError: true };
    }
    const vEnd = verseEnd ?? verse;
    if (vEnd < verse) return { content: [{ type: "text", text: "verse_end deve ser >= verse." }], isError: true };
    if (vEnd - verse + 1 > 50) return { content: [{ type: "text", text: "Máximo de 50 versículos por chamada." }], isError: true };

    const sb = createClient(process.env.SUPABASE_URL!, process.env.SUPABASE_PUBLISHABLE_KEY!, {
      auth: { persistSession: false, autoRefreshToken: false },
    });

    // Resolve o livro (abbrev exato, sem acento/caixa importam via ilike)
    const { data: bookRow, error: bookErr } = await sb
      .from("bible_books")
      .select("id,name,abbrev,testament")
      .ilike("abbrev", book)
      .maybeSingle();
    if (bookErr) return { content: [{ type: "text", text: bookErr.message }], isError: true };
    if (!bookRow) return { content: [{ type: "text", text: `Livro '${book}' não encontrado. Use abreviações canônicas (Gn, Ex, Sl, Mt, Mc, Lc, Jo, Rm, Ap…).` }], isError: true };

    const { data: chapterRow, error: chErr } = await sb
      .from("bible_chapters")
      .select("id,number")
      .eq("book_id", bookRow.id)
      .eq("number", chapter)
      .limit(1)
      .maybeSingle();
    if (chErr) return { content: [{ type: "text", text: chErr.message }], isError: true };
    if (!chapterRow) return { content: [{ type: "text", text: `${bookRow.name} não tem capítulo ${chapter}.` }], isError: true };

    const { data: verses, error: vErr } = await sb
      .from("bible_verses")
      .select("number,text,translation_id")
      .eq("chapter_id", chapterRow.id)
      .gte("number", verse)
      .lte("number", vEnd)
      .order("number", { ascending: true });
    if (vErr) return { content: [{ type: "text", text: vErr.message }], isError: true };
    if (!verses || verses.length === 0) return { content: [{ type: "text", text: `Sem versículos em ${bookRow.abbrev} ${chapter},${verse}${verseEnd ? `-${verseEnd}` : ""}.` }], isError: true };

    // Escolhe uma única tradução (a primeira encontrada) para output consistente
    const primaryTranslation = verses[0].translation_id;
    const filtered = verses.filter(v => v.translation_id === primaryTranslation);

    const label = `${bookRow.abbrev} ${chapter},${verse}${verseEnd && verseEnd !== verse ? `-${verseEnd}` : ""}`;
    const textJoined = filtered.map(v => `${v.number} ${v.text}`).join("\n");
    return {
      content: [{ type: "text", text: `${label}\n${textJoined}` }],
      structuredContent: {
        reference: label,
        book: bookRow,
        chapter,
        verses: filtered.map(v => ({ number: v.number, text: v.text })),
      },
    };
  },
});
