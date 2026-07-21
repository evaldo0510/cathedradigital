/**
 * Validação de JSON-LD no build (prebuild).
 * Instancia os construtores de JSON-LD conhecidos com amostras deterministicas
 * e valida contra `src/lib/seo/jsonLdValidator.ts`. Falha o build (exit 1) se
 * qualquer campo obrigatório do Schema.org estiver ausente ou inválido.
 */
import { validateJsonLdList } from '../src/lib/seo/jsonLdValidator';

// Amostras — devem espelhar EXATAMENTE o formato emitido nas páginas.
// Se um builder for alterado, adicione/ajuste a amostra correspondente aqui.

const CANONICAL_BASE = 'https://www.cathedradigital.com.br';
const isoDate = '2026-07-21';
const hourSlug = 'laudes';
const canonical = `${CANONICAL_BASE}/breviary?h=${hourSlug}&d=${isoDate}`;

const breviaryJsonLd = [
  {
    '@context': 'https://schema.org',
    '@type': 'Event',
    name: 'Laudes — Liturgia das Horas',
    startDate: isoDate,
    eventAttendanceMode: 'https://schema.org/OnlineEventAttendanceMode',
    eventStatus: 'https://schema.org/EventScheduled',
    description: 'Laudes matutinas da Liturgia das Horas.',
    inLanguage: 'pt-BR',
    isAccessibleForFree: true,
    url: canonical,
    location: { '@type': 'VirtualLocation', url: canonical },
    organizer: { '@type': 'Organization', name: 'Cathedra Digital', url: CANONICAL_BASE },
    about: 'Tempo Comum',
  },
  {
    '@context': 'https://schema.org',
    '@type': 'Article',
    headline: 'Laudes · Liturgia das Horas',
    articleSection: 'Liturgia das Horas',
    inLanguage: 'pt-BR',
    datePublished: new Date().toISOString(),
    dateModified: new Date().toISOString(),
    author: { '@type': 'Organization', name: 'Cathedra Digital' },
    publisher: { '@type': 'Organization', name: 'Cathedra Digital', url: CANONICAL_BASE },
    mainEntityOfPage: { '@type': 'WebPage', '@id': canonical },
    description: 'Laudes.',
  },
];

const errors = validateJsonLdList(breviaryJsonLd, 'BreviaryPage');

if (errors.length > 0) {
  console.error('❌ JSON-LD inválido detectado:');
  for (const e of errors) console.error('  •', e);
  process.exit(1);
}

console.log(`✅ JSON-LD validado (${breviaryJsonLd.length} nós, 0 erros).`);
