#!/usr/bin/env node
/**
 * convert-to-ndjson.mjs
 * --------------------------------------------------------------
 * Converte dumps bíblicos brutos para o formato NDJSON canônico
 * consumido por `supabase/functions/bible-import-ndjson`:
 *
 *     {"abbr":"Gn","chapter":1,"verse":1,"text":"..."}
 *
 * Formatos suportados (auto-detecção pela extensão):
 *   - .json      → array [{book/abbr/livro, chapter/cap, verse/v, text/texto}]
 *   - .ndjson    → 1 objeto por linha (mesma forma do JSON acima)
 *   - .csv|.tsv  → header obrigatório com colunas: book|abbr, chapter, verse, text
 *   - .usfm|.sfm → parser mínimo (\\id, \\c, \\v) por arquivo OU diretório
 *
 * Uso:
 *   node scripts/convert-to-ndjson.mjs <input> <output.ndjson> [--strict]
 *
 *   --strict: aborta no primeiro verso que não bater no canon Cathedra
 *             (por padrão grava em <output>.rejected.ndjson e segue)
 *
 * O conversor NORMALIZA nomes/abreviações para o canon usado pelo
 * Cathedra (Gn, Ex, 1Sm, Sb, Eclo, 1Mc, etc.) via tabela de aliases.
 * --------------------------------------------------------------
 */
import fs from 'node:fs';
import path from 'node:path';
import readline from 'node:readline';

// ---------------------------- Canon mínimo ----------------------------
// Mapa nome/alias → abbr canônica do Cathedra. Cobre PT, EN, USFM IDs e
// variantes católicas comuns. Estendível.
const ALIAS_TO_ABBR = Object.freeze({
  // Pentateuco
  'gn': 'Gn', 'gen': 'Gn', 'genesis': 'Gn', 'gênesis': 'Gn', 'genese': 'Gn',
  'ex': 'Ex', 'exo': 'Ex', 'exodo': 'Ex', 'êxodo': 'Ex', 'exodus': 'Ex',
  'lv': 'Lv', 'lev': 'Lv', 'levitico': 'Lv', 'levítico': 'Lv', 'leviticus': 'Lv',
  'nm': 'Nm', 'num': 'Nm', 'numeros': 'Nm', 'números': 'Nm', 'numbers': 'Nm',
  'dt': 'Dt', 'deu': 'Dt', 'deuteronomio': 'Dt', 'deuteronômio': 'Dt', 'deuteronomy': 'Dt',
  // Históricos
  'js': 'Js', 'jos': 'Js', 'josue': 'Js', 'josué': 'Js', 'joshua': 'Js',
  'jz': 'Jz', 'jdg': 'Jz', 'jui': 'Jz', 'juizes': 'Jz', 'juízes': 'Jz', 'judges': 'Jz',
  'rt': 'Rt', 'rut': 'Rt', 'rute': 'Rt', 'ruth': 'Rt',
  '1sm': '1Sm', '1sa': '1Sm', '1samuel': '1Sm', '1 samuel': '1Sm', '1sam': '1Sm',
  '2sm': '2Sm', '2sa': '2Sm', '2samuel': '2Sm', '2 samuel': '2Sm', '2sam': '2Sm',
  '1rs': '1Rs', '1ki': '1Rs', '1reis': '1Rs', '1 reis': '1Rs', '1kings': '1Rs',
  '2rs': '2Rs', '2ki': '2Rs', '2reis': '2Rs', '2 reis': '2Rs', '2kings': '2Rs',
  '1cr': '1Cr', '1ch': '1Cr', '1cronicas': '1Cr', '1crônicas': '1Cr', '1chronicles': '1Cr',
  '2cr': '2Cr', '2ch': '2Cr', '2cronicas': '2Cr', '2crônicas': '2Cr', '2chronicles': '2Cr',
  'ed': 'Ed', 'esd': 'Ed', 'esdras': 'Ed', 'ezr': 'Ed', 'ezra': 'Ed',
  'ne': 'Ne', 'neh': 'Ne', 'neemias': 'Ne', 'nehemiah': 'Ne',
  'tb': 'Tb', 'tob': 'Tb', 'tobias': 'Tb', 'tobit': 'Tb',
  'jt': 'Jt', 'jdt': 'Jt', 'judite': 'Jt', 'judith': 'Jt',
  'et': 'Et', 'est': 'Et', 'ester': 'Et', 'esther': 'Et',
  '1mc': '1Mc', '1ma': '1Mc', '1macabeus': '1Mc', '1maccabees': '1Mc',
  '2mc': '2Mc', '2ma': '2Mc', '2macabeus': '2Mc', '2maccabees': '2Mc',
  // Sapienciais
  'jó': 'Jó', 'jo': 'Jó', 'job': 'Jó',
  'sl': 'Sl', 'psa': 'Sl', 'salmos': 'Sl', 'psalms': 'Sl', 'ps': 'Sl',
  'pr': 'Pr', 'prv': 'Pr', 'pro': 'Pr', 'proverbios': 'Pr', 'provérbios': 'Pr', 'proverbs': 'Pr',
  'ec': 'Ec', 'ecl': 'Ec', 'eclesiastes': 'Ec', 'ecclesiastes': 'Ec', 'qoh': 'Ec',
  'ct': 'Ct', 'sng': 'Ct', 'cantares': 'Ct', 'canticos': 'Ct', 'cânticos': 'Ct', 'songofsongs': 'Ct',
  'sb': 'Sb', 'wis': 'Sb', 'sabedoria': 'Sb', 'wisdom': 'Sb',
  'eclo': 'Eclo', 'sir': 'Eclo', 'eclesiastico': 'Eclo', 'eclesiástico': 'Eclo', 'sirach': 'Eclo', 'ben sira': 'Eclo',
  // Proféticos
  'is': 'Is', 'isa': 'Is', 'isaias': 'Is', 'isaías': 'Is', 'isaiah': 'Is',
  'jr': 'Jr', 'jer': 'Jr', 'jeremias': 'Jr', 'jeremiah': 'Jr',
  'lm': 'Lm', 'lam': 'Lm', 'lamentacoes': 'Lm', 'lamentações': 'Lm', 'lamentations': 'Lm',
  'br': 'Br', 'bar': 'Br', 'baruc': 'Br', 'baruch': 'Br',
  'ez': 'Ez', 'ezk': 'Ez', 'ezequiel': 'Ez', 'ezekiel': 'Ez',
  'dn': 'Dn', 'dan': 'Dn', 'daniel': 'Dn',
  'os': 'Os', 'hos': 'Os', 'oseias': 'Os', 'oséias': 'Os', 'hosea': 'Os',
  'jl': 'Jl', 'jol': 'Jl', 'joel': 'Jl',
  'am': 'Am', 'amo': 'Am', 'amos': 'Am', 'amós': 'Am',
  'ab': 'Ab', 'oba': 'Ab', 'abdias': 'Ab', 'obadiah': 'Ab',
  'jn': 'Jn', 'jon': 'Jn', 'jonas': 'Jn', 'jonah': 'Jn',
  'mq': 'Mq', 'mic': 'Mq', 'miqueias': 'Mq', 'miquéias': 'Mq', 'micah': 'Mq',
  'na': 'Na', 'nam': 'Na', 'naum': 'Na', 'nahum': 'Na',
  'hab': 'Hab', 'hb': 'Hab', 'habacuc': 'Hab', 'habakkuk': 'Hab',
  'sf': 'Sf', 'zep': 'Sf', 'sofonias': 'Sf', 'zephaniah': 'Sf',
  'ag': 'Ag', 'hag': 'Ag', 'ageu': 'Ag', 'haggai': 'Ag',
  'zc': 'Zc', 'zec': 'Zc', 'zacarias': 'Zc', 'zechariah': 'Zc',
  'ml': 'Ml', 'mal': 'Ml', 'malaquias': 'Ml', 'malachi': 'Ml',
  // NT
  'mt': 'Mt', 'mat': 'Mt', 'mateus': 'Mt', 'matthew': 'Mt',
  'mc': 'Mc', 'mrk': 'Mc', 'marcos': 'Mc', 'mark': 'Mc',
  'lc': 'Lc', 'luk': 'Lc', 'lucas': 'Lc', 'luke': 'Lc',
  'jo': 'Jo', 'jhn': 'Jo', 'joao': 'Jo', 'joão': 'Jo', 'john': 'Jo',
  'at': 'At', 'act': 'At', 'atos': 'At', 'acts': 'At',
  'rm': 'Rm', 'rom': 'Rm', 'romanos': 'Rm', 'romans': 'Rm',
  '1co': '1Cor', '1cor': '1Cor', '1 cor': '1Cor', '1corintios': '1Cor', '1coríntios': '1Cor', '1corinthians': '1Cor',
  '2co': '2Cor', '2cor': '2Cor', '2 cor': '2Cor', '2corintios': '2Cor', '2coríntios': '2Cor', '2corinthians': '2Cor',
  'gl': 'Gl', 'gal': 'Gl', 'galatas': 'Gl', 'gálatas': 'Gl', 'galatians': 'Gl',
  'ef': 'Ef', 'eph': 'Ef', 'efesios': 'Ef', 'efésios': 'Ef', 'ephesians': 'Ef',
  'fl': 'Fl', 'php': 'Fl', 'filipenses': 'Fl', 'philippians': 'Fl',
  'cl': 'Cl', 'col': 'Cl', 'colossenses': 'Cl', 'colossians': 'Cl',
  '1ts': '1Ts', '1th': '1Ts', '1tessalonicenses': '1Ts', '1thessalonians': '1Ts',
  '2ts': '2Ts', '2th': '2Ts', '2tessalonicenses': '2Ts', '2thessalonians': '2Ts',
  '1tm': '1Tm', '1ti': '1Tm', '1timoteo': '1Tm', '1timóteo': '1Tm', '1timothy': '1Tm',
  '2tm': '2Tm', '2ti': '2Tm', '2timoteo': '2Tm', '2timóteo': '2Tm', '2timothy': '2Tm',
  'tt': 'Tt', 'tit': 'Tt', 'tito': 'Tt', 'titus': 'Tt',
  'fm': 'Fm', 'phm': 'Fm', 'filemon': 'Fm', 'philemon': 'Fm',
  'hb2': 'Hb', 'heb': 'Hb', 'hebreus': 'Hb', 'hebrews': 'Hb', 'hbr': 'Hb',
  'tg': 'Tg', 'jas': 'Tg', 'tiago': 'Tg', 'james': 'Tg',
  '1pd': '1Pd', '1pe': '1Pd', '1pedro': '1Pd', '1peter': '1Pd',
  '2pd': '2Pd', '2pe': '2Pd', '2pedro': '2Pd', '2peter': '2Pd',
  '1jo': '1Jo', '1jn': '1Jo', '1joao': '1Jo', '1joão': '1Jo', '1john': '1Jo',
  '2jo': '2Jo', '2jn': '2Jo', '2joao': '2Jo', '2joão': '2Jo', '2john': '2Jo',
  '3jo': '3Jo', '3jn': '3Jo', '3joao': '3Jo', '3joão': '3Jo', '3john': '3Jo',
  'jd': 'Jd', 'jud': 'Jd', 'judas': 'Jd', 'jude': 'Jd',
  'ap': 'Ap', 'rev': 'Ap', 'apocalipse': 'Ap', 'revelation': 'Ap',
});

// 'Hb' (Hebreus) vs 'Hab' (Habacuc) — normalização: vem nas alias acima.

function norm(s) {
  return String(s).trim().toLowerCase().replace(/\s+/g, ' ');
}

function resolveAbbr(raw) {
  if (raw == null) return null;
  const n = norm(raw);
  if (ALIAS_TO_ABBR[n]) return ALIAS_TO_ABBR[n];
  const compact = n.replace(/[.\s]/g, '');
  if (ALIAS_TO_ABBR[compact]) return ALIAS_TO_ABBR[compact];
  return null;
}

// ---------------------------- Emissor NDJSON ----------------------------
function makeWriter(outPath) {
  const stream = fs.createWriteStream(outPath, { encoding: 'utf8' });
  const rejStream = fs.createWriteStream(outPath + '.rejected.ndjson', { encoding: 'utf8' });
  let ok = 0, rej = 0;
  return {
    write(rec, raw) {
      const abbr = resolveAbbr(rec.book ?? rec.abbr ?? rec.livro);
      const chapter = Number(rec.chapter ?? rec.cap ?? rec.capitulo);
      const verse = Number(rec.verse ?? rec.v ?? rec.versiculo ?? rec.versículo);
      const text = String(rec.text ?? rec.texto ?? '').trim();
      if (!abbr || !Number.isInteger(chapter) || chapter < 1 || !Number.isInteger(verse) || verse < 1 || !text) {
        rej++; rejStream.write(JSON.stringify({ reason: 'invalid', raw: raw ?? rec }) + '\n');
        return false;
      }
      stream.write(JSON.stringify({ abbr, chapter, verse, text }) + '\n');
      ok++; return true;
    },
    async close() {
      await new Promise(r => stream.end(r));
      await new Promise(r => rejStream.end(r));
      return { ok, rej };
    },
  };
}

// ---------------------------- Parsers ----------------------------
async function fromJsonArray(input, writer, strict) {
  const txt = fs.readFileSync(input, 'utf8');
  const arr = JSON.parse(txt);
  if (!Array.isArray(arr)) throw new Error('JSON precisa ser um array.');
  for (const rec of arr) if (!writer.write(rec, rec) && strict) throw new Error('Linha inválida (strict)');
}

async function fromNdjson(input, writer, strict) {
  const rl = readline.createInterface({ input: fs.createReadStream(input), crlfDelay: Infinity });
  for await (const line of rl) {
    const t = line.trim(); if (!t) continue;
    try {
      const rec = JSON.parse(t);
      if (!writer.write(rec, rec) && strict) throw new Error('Linha inválida (strict)');
    } catch (e) {
      if (strict) throw e;
    }
  }
}

async function fromCsv(input, writer, strict, sep) {
  const rl = readline.createInterface({ input: fs.createReadStream(input), crlfDelay: Infinity });
  let header = null;
  for await (const line of rl) {
    if (!line.trim()) continue;
    const cells = parseCsvLine(line, sep);
    if (!header) { header = cells.map(c => c.toLowerCase().trim()); continue; }
    const rec = Object.fromEntries(header.map((h, i) => [h, cells[i]]));
    if (!writer.write(rec, rec) && strict) throw new Error('Linha inválida (strict)');
  }
}

function parseCsvLine(line, sep) {
  const out = []; let cur = ''; let q = false;
  for (let i = 0; i < line.length; i++) {
    const c = line[i];
    if (q) {
      if (c === '"' && line[i + 1] === '"') { cur += '"'; i++; }
      else if (c === '"') q = false;
      else cur += c;
    } else {
      if (c === '"') q = true;
      else if (c === sep) { out.push(cur); cur = ''; }
      else cur += c;
    }
  }
  out.push(cur);
  return out;
}

async function fromUsfmFile(input, writer, strict, defaultAbbr) {
  const txt = fs.readFileSync(input, 'utf8');
  let abbr = defaultAbbr ?? null;
  let chapter = null;
  // Match \id, \c, \v, com texto até próxima tag.
  const tagRe = /\\(id|c|v)\s+(\S+)([^\\]*)/g;
  let m;
  while ((m = tagRe.exec(txt))) {
    const [, tag, val, body] = m;
    if (tag === 'id') abbr = resolveAbbr(val) ?? abbr;
    else if (tag === 'c') chapter = Number(val);
    else if (tag === 'v') {
      const verse = Number(val);
      const text = body.replace(/\\\S+\s*/g, ' ').replace(/\s+/g, ' ').trim();
      const rec = { abbr, chapter, verse, text };
      if (!writer.write(rec, rec) && strict) throw new Error('Verso USFM inválido (strict)');
    }
  }
}

async function fromUsfmDir(input, writer, strict) {
  const files = fs.readdirSync(input).filter(f => /\.(usfm|sfm|txt)$/i.test(f));
  for (const f of files) {
    const guess = resolveAbbr(path.basename(f).split('.')[0]);
    await fromUsfmFile(path.join(input, f), writer, strict, guess);
  }
}

// ---------------------------- Main ----------------------------
async function main() {
  const [input, output, ...flags] = process.argv.slice(2);
  if (!input || !output) {
    console.error('uso: node scripts/convert-to-ndjson.mjs <input> <output.ndjson> [--strict]');
    process.exit(2);
  }
  const strict = flags.includes('--strict');
  const writer = makeWriter(output);
  const ext = path.extname(input).toLowerCase();
  const stat = fs.statSync(input);

  if (stat.isDirectory()) {
    await fromUsfmDir(input, writer, strict);
  } else if (ext === '.json') {
    await fromJsonArray(input, writer, strict);
  } else if (ext === '.ndjson' || ext === '.jsonl') {
    await fromNdjson(input, writer, strict);
  } else if (ext === '.csv') {
    await fromCsv(input, writer, strict, ',');
  } else if (ext === '.tsv') {
    await fromCsv(input, writer, strict, '\t');
  } else if (ext === '.usfm' || ext === '.sfm') {
    await fromUsfmFile(input, writer, strict);
  } else {
    throw new Error(`Extensão não suportada: ${ext}`);
  }

  const { ok, rej } = await writer.close();
  console.log(`✓ NDJSON canônico gerado em ${output}`);
  console.log(`  versos válidos: ${ok}`);
  console.log(`  rejeitados:    ${rej}  →  ${output}.rejected.ndjson`);
  if (rej > 0 && strict) process.exit(1);
}

main().catch(e => { console.error('✗', e.message); process.exit(1); });
