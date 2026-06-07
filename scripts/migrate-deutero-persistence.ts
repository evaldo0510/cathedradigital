import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";

const SUPABASE_URL = "https://gpwrpmoniglarqwfyryp.supabase.co";
// NOTA: A chave anon é suficiente para leitura, mas para escrita em RLS público ou service role é necessário
// Como estamos no sandbox com acesso direto ao banco via psql, usaremos o psql para inserir os dados reais
// para evitar problemas de segredos expostos em scripts de build.

console.log("Migração iniciada via injeção SQL direta para evitar dependência de segredos no sandbox.");

const DEUTERO_BOOKS = [
  { abbr: '1Mc', name: '1 Macabeus', chapters: 16 },
  { abbr: '2Mc', name: '2 Macabeus', chapters: 15 },
  { abbr: 'Tb', name: 'Tobias', chapters: 14 },
  { abbr: 'Jdt', name: 'Judite', chapters: 16 },
  { abbr: 'Sb', name: 'Sabedoria', chapters: 19 },
  { abbr: 'Eclo', name: 'Eclesiástico', chapters: 51 },
  { abbr: 'Br', name: 'Baruc', chapters: 6 }
];

async function generateSqlInserts() {
  let sql = "";
  
  for (const book of DEUTERO_BOOKS) {
    sql += `INSERT INTO public.bible_books (name, abbrev, testament, canonical_type, chapters_count) VALUES ('${book.name}', '${book.abbr}', 'antigo', 'deuterocanonico', ${book.chapters}) ON CONFLICT (abbrev) DO UPDATE SET name = EXCLUDED.name RETURNING id;\n`;
  }
  
  console.log("-- SQL Gerado para metadados de livros");
  return sql;
}

// Devido às limitações de segredos no sandbox para scripts Bun, 
// a estratégia será gerar blocos de INSERT e executá-los via psql.
console.log("Use o comando psql para aplicar a migração de dados.");


migrateDeutero();
