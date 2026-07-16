/**
 * Fonte única dos documentos do Magistério.
 *
 * Padrão espelhado do módulo Bíblia (`src/data/bible-books.ts`):
 *   - Interface tipada por documento com metadados canônicos.
 *   - Agrupamento em categorias com `order` explícito (autoridade canônica).
 *   - Derivação automática de temas para filtros.
 *
 * `MAGISTERIUM_URLS` (Record<string, string>) é mantido inalterado para
 * preservar compatibilidade com `MagisteriumViewer` e `MagisteriumPopover`,
 * que fazem lookup direto por chave.
 */

export type MagisteriumType =
  | 'Constituição'
  | 'Encíclica'
  | 'Exortação Apostólica'
  | 'Carta Apostólica'
  | 'Documento Doutrinal'
  | 'Compêndio'
  | 'Código';

/**
 * Tag temática usada nos chips do Explorer.
 * Alias nomeado para tornar explícito que `MagisteriumDocument.themes`
 * (plural) é a lista de tags, distinta de `SPIRITUAL_GUIDANCE.theme`
 * (singular = nome do tópico de orientação espiritual).
 */
export type MagisteriumTheme = string;

export interface MagisteriumDocument {
  /** Slug estável usado nas rotas (`/magisterium/:id`) e no lookup de URL. */
  id: string;
  title: string;
  /** Sigla clássica (LG, DV, RN...). Opcional. */
  abbr?: string;
  type: MagisteriumType;
  /** Nome da categoria/coleção a que pertence. */
  category: string;
  author: string;
  /** Pontificado ou concílio (redundante com `author` na maioria dos casos). */
  pontificate?: string;
  year: number;
  /** Data ISO (YYYY-MM-DD) quando conhecida — usada em ordenação cronológica fina. */
  date?: string;
  /** Tags temáticas (plural). NÃO usar `theme` singular. */
  themes: MagisteriumTheme[];
  url: string;
  summary: string;
}

export interface MagisteriumCategory {
  name: string;
  description: string;
  /** Ordem canônica da categoria (menor = maior autoridade/precedência). */
  order: number;
  documents: MagisteriumDocument[];
}

// ---------------------------------------------------------------------------
// URLs (compat) — mantidas idênticas ao arquivo original.
// ---------------------------------------------------------------------------
export const MAGISTERIUM_URLS: Record<string, string> = {
  // Documentos conciliares e dogmáticos (chaves por nome — legado)
  'Dei Filius': 'https://www.vatican.va/archive/hist_councils/i-vatican-council/documents/vat-i_const_18700424_dei-filius_la.html',
  'Ineffabilis Deus': 'https://www.vatican.va/content/pius-ix/la/documents/bulla-ineffabilis-deus-8-decembris-1854.html',
  'Munificentissimus Deus': 'https://www.vatican.va/content/pius-xii/pt/apost_constitutions/documents/hf_p-xii_apc_19501101_munificentissimus-deus.html',
  'Pastor Aeternus': 'https://www.vatican.va/archive/hist_councils/i-vatican-council/documents/vat-i_const_18700718_pastor-aeternus_la.html',
  'Mystici Corporis': 'https://www.vatican.va/content/pius-xii/pt/encyclicals/documents/hf_p-xii_enc_29061943_mystici-corporis-christi.html',
  'Benedictus Deus': 'https://www.vatican.va/content/benedict-xii/la/documents/constitutio-dogmatica-benedictus-deus-29-ian-1336.html',
  'Credo Niceno': 'https://www.vatican.va/archive/hist_councils/ii_vatican_council/documents/vat-ii_const_19641121_lumen-gentium_po.html',
  'Dei Verbum': 'https://www.vatican.va/archive/hist_councils/ii_vatican_council/documents/vat-ii_const_19651118_dei-verbum_po.html',
  'dv': 'https://www.vatican.va/archive/hist_councils/ii_vatican_council/documents/vat-ii_const_19651118_dei-verbum_po.html',
  'Decreto Sacrosanctis Trento': 'https://www.vatican.va/archive/hist_councils/ii_vatican_council/documents/vat-ii_const_19631204_sacrosanctum-concilium_po.html',
  'sc': 'https://www.vatican.va/archive/hist_councils/ii_vatican_council/documents/vat-ii_const_19631204_sacrosanctum-concilium_po.html',

  // Encíclicas / Exortações / Cartas
  'rn': 'https://www.vatican.va/content/leo-xiii/pt/encyclicals/documents/hf_l-xiii_enc_15051891_rerum-novarum.html',
  'hv': 'https://www.vatican.va/content/paul-vi/pt/encyclicals/documents/hf_p-vi_enc_25071968_humanae-vitae.html',
  'ls': 'https://www.vatican.va/content/francesco/pt/encyclicals/documents/papa-francesco_20150524_enciclica-laudato-si.html',
  'ft': 'https://www.vatican.va/content/francesco/pt/encyclicals/documents/papa-francesco_20201003_enciclica-fratelli-tutti.html',
  'rh': 'https://www.vatican.va/content/john-paul-ii/pt/encyclicals/documents/hf_jp-ii_enc_04031979_redemptor-hominis.html',
  'vs': 'https://www.vatican.va/content/john-paul-ii/pt/encyclicals/documents/hf_jp-ii_enc_06081993_veritatis-splendor.html',
  'fr': 'https://www.vatican.va/content/john-paul-ii/pt/encyclicals/documents/hf_jp-ii_enc_14091998_fides-et-ratio.html',
  'dce': 'https://www.vatican.va/content/benedict-xvi/pt/encyclicals/documents/hf_ben-xvi_enc_20051225_deus-caritas-est.html',
  'ss': 'https://www.vatican.va/content/benedict-xvi/pt/encyclicals/documents/hf_ben-xvi_enc_20071130_spe-salvi.html',
  'civ': 'https://www.vatican.va/content/benedict-xvi/pt/encyclicals/documents/hf_ben-xvi_enc_20090629_caritas-in-veritate.html',
  'lf': 'https://www.vatican.va/content/francesco/pt/encyclicals/documents/papa-francesco_20130629_enciclica-lumen-fidei.html',
  'ev': 'https://www.vatican.va/content/john-paul-ii/pt/encyclicals/documents/hf_jp-ii_enc_25031995_evangelium-vitae.html',
  'ge': 'https://www.vatican.va/content/francesco/pt/apost_exhortations/documents/papa-francesco_esortazione-ap_20180319_gaudete-et-exsultate.html',
  'al': 'https://www.vatican.va/content/francesco/pt/apost_exhortations/documents/papa-francesco_esortazione-ap_20160319_amoris-laetitia.html',
  'cv': 'https://www.vatican.va/content/francesco/pt/apost_exhortations/documents/papa-francesco_esortazione-ap_20190325_christus-vivit.html',
  'sd': 'https://www.vatican.va/content/john-paul-ii/pt/apost_letters/1984/documents/hf_jp-ii_apl_11021984_salvifici-doloris.html',
  'lg': 'https://www.vatican.va/archive/hist_councils/ii_vatican_council/documents/vat-ii_const_19641121_lumen-gentium_po.html',
  'gs': 'https://www.vatican.va/archive/hist_councils/ii_vatican_council/documents/vat-ii_const_19651207_gaudium-et-spes_po.html',
  'pc': 'https://www.vatican.va/content/francesco/pt/apost_letters/documents/papa-francesco-lettera-ap_20201208_patris-corde.html',
  'mm': 'https://www.vatican.va/content/francesco/pt/apost_letters/documents/papa-francesco-lettera-ap_20161120_misericordia-et-misera.html',
  'rvm': 'https://www.vatican.va/content/john-paul-ii/pt/apost_letters/2002/documents/hf_jp-ii_apl_20021016_rosarium-virginis-mariae.html',
  'dd': 'https://www.vatican.va/content/john-paul-ii/pt/apost_letters/1998/documents/hf_jp-ii_apl_05071998_dies-domini.html',
  'md': 'https://www.vatican.va/content/john-paul-ii/pt/apost_letters/1988/documents/hf_jp-ii_apl_15081988_mulieris-dignitatem.html',
  'cdsi': 'https://www.vatican.va/roman_curia/pontifical_councils/justpeace/documents/rc_pc_justpeace_doc_20060526_compendio-dott-soc_po.html',
  'di': 'https://www.vatican.va/roman_curia/congregations/cfaith/documents/rc_con_cfaith_doc_20000806_dominus-iesus_po.html',
  'cdc': 'https://www.vatican.va/archive/cod-iuris-canonici/portuguese/codex-iuris-canonici_po.pdf',
  'cic': 'https://www.vatican.va/archive/cathechism_po/index_po.htm',

  // Aliases por slug para documentos que só tinham chave por nome — permitem
  // que o Viewer resolva `/magisterium/:slug` sem depender de nomes com espaço.
  'dfil': 'https://www.vatican.va/archive/hist_councils/i-vatican-council/documents/vat-i_const_18700424_dei-filius_la.html',
  'paet': 'https://www.vatican.va/archive/hist_councils/i-vatican-council/documents/vat-i_const_18700718_pastor-aeternus_la.html',
  'ideus': 'https://www.vatican.va/content/pius-ix/la/documents/bulla-ineffabilis-deus-8-decembris-1854.html',
  'mdeus': 'https://www.vatican.va/content/pius-xii/pt/apost_constitutions/documents/hf_p-xii_apc_19501101_munificentissimus-deus.html',
  'bdeus': 'https://www.vatican.va/content/benedict-xii/la/documents/constitutio-dogmatica-benedictus-deus-29-ian-1336.html',
  'mcorp': 'https://www.vatican.va/content/pius-xii/pt/encyclicals/documents/hf_p-xii_enc_29061943_mystici-corporis-christi.html',

  // ---------------------------------------------------------------------------
  // Aliases legíveis (STAB-002A) — permitem deep-links humanamente legíveis
  // como `/magisterium/deus-caritas-est`. Slugs curtos permanecem canônicos;
  // estes são apenas tolerância de entrada. Não emitir a partir do app.
  // ---------------------------------------------------------------------------
  'rerum-novarum': 'https://www.vatican.va/content/leo-xiii/pt/encyclicals/documents/hf_l-xiii_enc_15051891_rerum-novarum.html',
  'humanae-vitae': 'https://www.vatican.va/content/paul-vi/pt/encyclicals/documents/hf_p-vi_enc_25071968_humanae-vitae.html',
  'laudato-si': 'https://www.vatican.va/content/francesco/pt/encyclicals/documents/papa-francesco_20150524_enciclica-laudato-si.html',
  'fratelli-tutti': 'https://www.vatican.va/content/francesco/pt/encyclicals/documents/papa-francesco_20201003_enciclica-fratelli-tutti.html',
  'redemptor-hominis': 'https://www.vatican.va/content/john-paul-ii/pt/encyclicals/documents/hf_jp-ii_enc_04031979_redemptor-hominis.html',
  'veritatis-splendor': 'https://www.vatican.va/content/john-paul-ii/pt/encyclicals/documents/hf_jp-ii_enc_06081993_veritatis-splendor.html',
  'fides-et-ratio': 'https://www.vatican.va/content/john-paul-ii/pt/encyclicals/documents/hf_jp-ii_enc_14091998_fides-et-ratio.html',
  'deus-caritas-est': 'https://www.vatican.va/content/benedict-xvi/pt/encyclicals/documents/hf_ben-xvi_enc_20051225_deus-caritas-est.html',
  'spe-salvi': 'https://www.vatican.va/content/benedict-xvi/pt/encyclicals/documents/hf_ben-xvi_enc_20071130_spe-salvi.html',
  'caritas-in-veritate': 'https://www.vatican.va/content/benedict-xvi/pt/encyclicals/documents/hf_ben-xvi_enc_20090629_caritas-in-veritate.html',
  'lumen-fidei': 'https://www.vatican.va/content/francesco/pt/encyclicals/documents/papa-francesco_20130629_enciclica-lumen-fidei.html',
  'evangelium-vitae': 'https://www.vatican.va/content/john-paul-ii/pt/encyclicals/documents/hf_jp-ii_enc_25031995_evangelium-vitae.html',
  'gaudete-et-exsultate': 'https://www.vatican.va/content/francesco/pt/apost_exhortations/documents/papa-francesco_esortazione-ap_20180319_gaudete-et-exsultate.html',
  'evangelii-gaudium': MAGISTERIUM_URLS['ge'] ?? 'https://www.vatican.va/content/francesco/pt/apost_exhortations/documents/papa-francesco_esortazione-ap_20131124_evangelii-gaudium.html',
  'amoris-laetitia': 'https://www.vatican.va/content/francesco/pt/apost_exhortations/documents/papa-francesco_esortazione-ap_20160319_amoris-laetitia.html',
  'christus-vivit': 'https://www.vatican.va/content/francesco/pt/apost_exhortations/documents/papa-francesco_esortazione-ap_20190325_christus-vivit.html',
  'salvifici-doloris': 'https://www.vatican.va/content/john-paul-ii/pt/apost_letters/1984/documents/hf_jp-ii_apl_11021984_salvifici-doloris.html',
  'lumen-gentium': 'https://www.vatican.va/archive/hist_councils/ii_vatican_council/documents/vat-ii_const_19641121_lumen-gentium_po.html',
  'gaudium-et-spes': 'https://www.vatican.va/archive/hist_councils/ii_vatican_council/documents/vat-ii_const_19651207_gaudium-et-spes_po.html',
  'dei-verbum': 'https://www.vatican.va/archive/hist_councils/ii_vatican_council/documents/vat-ii_const_19651118_dei-verbum_po.html',
  'sacrosanctum-concilium': 'https://www.vatican.va/archive/hist_councils/ii_vatican_council/documents/vat-ii_const_19631204_sacrosanctum-concilium_po.html',
  'patris-corde': 'https://www.vatican.va/content/francesco/pt/apost_letters/documents/papa-francesco-lettera-ap_20201208_patris-corde.html',
  'misericordia-et-misera': 'https://www.vatican.va/content/francesco/pt/apost_letters/documents/papa-francesco-lettera-ap_20161120_misericordia-et-misera.html',
  'rosarium-virginis-mariae': 'https://www.vatican.va/content/john-paul-ii/pt/apost_letters/2002/documents/hf_jp-ii_apl_20021016_rosarium-virginis-mariae.html',
  'dies-domini': 'https://www.vatican.va/content/john-paul-ii/pt/apost_letters/1998/documents/hf_jp-ii_apl_05071998_dies-domini.html',
  'mulieris-dignitatem': 'https://www.vatican.va/content/john-paul-ii/pt/apost_letters/1988/documents/hf_jp-ii_apl_15081988_mulieris-dignitatem.html',
  'dominus-iesus': 'https://www.vatican.va/roman_curia/congregations/cfaith/documents/rc_con_cfaith_doc_20000806_dominus-iesus_po.html',
  'compendio-doutrina-social': 'https://www.vatican.va/roman_curia/pontifical_councils/justpeace/documents/rc_pc_justpeace_doc_20060526_compendio-dott-soc_po.html',
  'codex-iuris-canonici': 'https://www.vatican.va/archive/cod-iuris-canonici/portuguese/codex-iuris-canonici_po.pdf',
  'catecismo-igreja-catolica': 'https://www.vatican.va/archive/cathechism_po/index_po.htm',
  'dei-filius': 'https://www.vatican.va/archive/hist_councils/i-vatican-council/documents/vat-i_const_18700424_dei-filius_la.html',
  'pastor-aeternus': 'https://www.vatican.va/archive/hist_councils/i-vatican-council/documents/vat-i_const_18700718_pastor-aeternus_la.html',
  'ineffabilis-deus': 'https://www.vatican.va/content/pius-ix/la/documents/bulla-ineffabilis-deus-8-decembris-1854.html',
  'munificentissimus-deus': 'https://www.vatican.va/content/pius-xii/pt/apost_constitutions/documents/hf_p-xii_apc_19501101_munificentissimus-deus.html',
  'benedictus-deus': 'https://www.vatican.va/content/benedict-xii/la/documents/constitutio-dogmatica-benedictus-deus-29-ian-1336.html',
  'mystici-corporis': 'https://www.vatican.va/content/pius-xii/pt/encyclicals/documents/hf_p-xii_enc_29061943_mystici-corporis-christi.html',
};

// ---------------------------------------------------------------------------
// Documentos estruturados — fonte única para o Explorer.
// ---------------------------------------------------------------------------
export const MAGISTERIUM_CATEGORIES: MagisteriumCategory[] = [
  {
    name: 'Concílios Ecumênicos',
    description: 'Definições dogmáticas e pastorais dos Concílios universais.',
    order: 1,
    documents: [
      { id: 'dfil', title: 'Dei Filius', abbr: 'DF', type: 'Constituição', category: 'Concílios Ecumênicos', author: 'Concílio Vaticano I', pontificate: 'Pio IX', year: 1870, date: '1870-04-24', themes: ['Fé', 'Revelação', 'Razão'], url: MAGISTERIUM_URLS['dfil'], summary: 'Constituição dogmática sobre a fé católica.' },
      { id: 'paet', title: 'Pastor Aeternus', abbr: 'PA', type: 'Constituição', category: 'Concílios Ecumênicos', author: 'Concílio Vaticano I', pontificate: 'Pio IX', year: 1870, date: '1870-07-18', themes: ['Papado', 'Infalibilidade', 'Eclesiologia'], url: MAGISTERIUM_URLS['paet'], summary: 'Constituição dogmática sobre a Igreja de Cristo e o primado romano.' },
      { id: 'sc',   title: 'Sacrosanctum Concilium', abbr: 'SC', type: 'Constituição', category: 'Concílios Ecumênicos', author: 'Concílio Vaticano II', pontificate: 'Paulo VI', year: 1963, date: '1963-12-04', themes: ['Liturgia', 'Sacramentos'], url: MAGISTERIUM_URLS['sc'], summary: 'Constituição sobre a Sagrada Liturgia.' },
      { id: 'lg',   title: 'Lumen Gentium', abbr: 'LG', type: 'Constituição', category: 'Concílios Ecumênicos', author: 'Concílio Vaticano II', pontificate: 'Paulo VI', year: 1964, date: '1964-11-21', themes: ['Eclesiologia', 'Povo de Deus'], url: MAGISTERIUM_URLS['lg'], summary: 'Constituição dogmática sobre a Igreja.' },
      { id: 'dv',   title: 'Dei Verbum', abbr: 'DV', type: 'Constituição', category: 'Concílios Ecumênicos', author: 'Concílio Vaticano II', pontificate: 'Paulo VI', year: 1965, date: '1965-11-18', themes: ['Revelação', 'Bíblia', 'Tradição'], url: MAGISTERIUM_URLS['dv'], summary: 'Constituição dogmática sobre a Revelação divina.' },
      { id: 'gs',   title: 'Gaudium et Spes', abbr: 'GS', type: 'Constituição', category: 'Concílios Ecumênicos', author: 'Concílio Vaticano II', pontificate: 'Paulo VI', year: 1965, date: '1965-12-07', themes: ['Social', 'Mundo', 'Antropologia'], url: MAGISTERIUM_URLS['gs'], summary: 'Constituição pastoral sobre a Igreja no mundo contemporâneo.' },
    ],
  },
  {
    name: 'Constituições Apostólicas',
    description: 'Constituições papais de caráter dogmático ou disciplinar universal.',
    order: 2,
    documents: [
      { id: 'bdeus', title: 'Benedictus Deus', type: 'Constituição', category: 'Constituições Apostólicas', author: 'Bento XII', pontificate: 'Bento XII', year: 1336, date: '1336-01-29', themes: ['Escatologia', 'Visão Beatífica'], url: MAGISTERIUM_URLS['bdeus'], summary: 'Definição dogmática sobre a visão beatífica após a morte.' },
      { id: 'ideus', title: 'Ineffabilis Deus', type: 'Constituição', category: 'Constituições Apostólicas', author: 'Pio IX', pontificate: 'Pio IX', year: 1854, date: '1854-12-08', themes: ['Maria', 'Imaculada Conceição'], url: MAGISTERIUM_URLS['ideus'], summary: 'Definição dogmática da Imaculada Conceição de Maria.' },
      { id: 'mdeus', title: 'Munificentissimus Deus', type: 'Constituição', category: 'Constituições Apostólicas', author: 'Pio XII', pontificate: 'Pio XII', year: 1950, date: '1950-11-01', themes: ['Maria', 'Assunção'], url: MAGISTERIUM_URLS['mdeus'], summary: 'Definição dogmática da Assunção de Maria.' },
    ],
  },
  {
    name: 'Encíclicas',
    description: 'Cartas doutrinais dirigidas à Igreja universal.',
    order: 3,
    documents: [
      { id: 'rn',    title: 'Rerum Novarum', abbr: 'RN', type: 'Encíclica', category: 'Encíclicas', author: 'Leão XIII', pontificate: 'Leão XIII', year: 1891, date: '1891-05-15', themes: ['Social', 'Trabalho'], url: MAGISTERIUM_URLS['rn'], summary: 'Sobre a condição dos operários e a questão social.' },
      { id: 'mcorp', title: 'Mystici Corporis Christi', type: 'Encíclica', category: 'Encíclicas', author: 'Pio XII', pontificate: 'Pio XII', year: 1943, date: '1943-06-29', themes: ['Eclesiologia', 'Cristologia'], url: MAGISTERIUM_URLS['mcorp'], summary: 'Sobre o Corpo Místico de Cristo.' },
      { id: 'hv',    title: 'Humanae Vitae', abbr: 'HV', type: 'Encíclica', category: 'Encíclicas', author: 'Paulo VI', pontificate: 'Paulo VI', year: 1968, date: '1968-07-25', themes: ['Vida', 'Família', 'Moral'], url: MAGISTERIUM_URLS['hv'], summary: 'Sobre a regulação da natalidade e o amor conjugal.' },
      { id: 'rh',    title: 'Redemptor Hominis', abbr: 'RH', type: 'Encíclica', category: 'Encíclicas', author: 'João Paulo II', pontificate: 'João Paulo II', year: 1979, date: '1979-03-04', themes: ['Cristologia', 'Antropologia'], url: MAGISTERIUM_URLS['rh'], summary: 'O Redentor do homem, centro do cosmos e da história.' },
      { id: 'vs',    title: 'Veritatis Splendor', abbr: 'VS', type: 'Encíclica', category: 'Encíclicas', author: 'João Paulo II', pontificate: 'João Paulo II', year: 1993, date: '1993-08-06', themes: ['Moral', 'Verdade'], url: MAGISTERIUM_URLS['vs'], summary: 'Sobre questões fundamentais do ensinamento moral da Igreja.' },
      { id: 'ev',    title: 'Evangelium Vitae', abbr: 'EV', type: 'Encíclica', category: 'Encíclicas', author: 'João Paulo II', pontificate: 'João Paulo II', year: 1995, date: '1995-03-25', themes: ['Vida', 'Bioética'], url: MAGISTERIUM_URLS['ev'], summary: 'Sobre o valor e a inviolabilidade da vida humana.' },
      { id: 'fr',    title: 'Fides et Ratio', abbr: 'FR', type: 'Encíclica', category: 'Encíclicas', author: 'João Paulo II', pontificate: 'João Paulo II', year: 1998, date: '1998-09-14', themes: ['Fé', 'Razão', 'Filosofia'], url: MAGISTERIUM_URLS['fr'], summary: 'Sobre as relações entre fé e razão.' },
      { id: 'dce',   title: 'Deus Caritas Est', abbr: 'DCE', type: 'Encíclica', category: 'Encíclicas', author: 'Bento XVI', pontificate: 'Bento XVI', year: 2005, date: '2005-12-25', themes: ['Amor', 'Caridade'], url: MAGISTERIUM_URLS['dce'], summary: 'Sobre o amor cristão.' },
      { id: 'ss',    title: 'Spe Salvi', abbr: 'SS', type: 'Encíclica', category: 'Encíclicas', author: 'Bento XVI', pontificate: 'Bento XVI', year: 2007, date: '2007-11-30', themes: ['Esperança', 'Escatologia'], url: MAGISTERIUM_URLS['ss'], summary: 'Sobre a esperança cristã.' },
      { id: 'civ',   title: 'Caritas in Veritate', abbr: 'CIV', type: 'Encíclica', category: 'Encíclicas', author: 'Bento XVI', pontificate: 'Bento XVI', year: 2009, date: '2009-06-29', themes: ['Social', 'Desenvolvimento'], url: MAGISTERIUM_URLS['civ'], summary: 'Sobre o desenvolvimento humano integral na caridade e na verdade.' },
      { id: 'lf',    title: 'Lumen Fidei', abbr: 'LF', type: 'Encíclica', category: 'Encíclicas', author: 'Francisco', pontificate: 'Francisco', year: 2013, date: '2013-06-29', themes: ['Fé'], url: MAGISTERIUM_URLS['lf'], summary: 'Sobre a luz da fé.' },
      { id: 'ls',    title: "Laudato Si'", abbr: 'LS', type: 'Encíclica', category: 'Encíclicas', author: 'Francisco', pontificate: 'Francisco', year: 2015, date: '2015-05-24', themes: ['Ecologia', 'Criação'], url: MAGISTERIUM_URLS['ls'], summary: 'Sobre o cuidado da casa comum.' },
      { id: 'ft',    title: 'Fratelli Tutti', abbr: 'FT', type: 'Encíclica', category: 'Encíclicas', author: 'Francisco', pontificate: 'Francisco', year: 2020, date: '2020-10-03', themes: ['Fraternidade', 'Social'], url: MAGISTERIUM_URLS['ft'], summary: 'Sobre a fraternidade e a amizade social.' },
    ],
  },
  {
    name: 'Exortações Apostólicas',
    description: 'Documentos pós-sinodais que exortam à vida cristã.',
    order: 4,
    documents: [
      { id: 'al', title: 'Amoris Laetitia', abbr: 'AL', type: 'Exortação Apostólica', category: 'Exortações Apostólicas', author: 'Francisco', pontificate: 'Francisco', year: 2016, date: '2016-03-19', themes: ['Família', 'Amor'], url: MAGISTERIUM_URLS['al'], summary: 'Sobre o amor na família.' },
      { id: 'ge', title: 'Gaudete et Exsultate', abbr: 'GE', type: 'Exortação Apostólica', category: 'Exortações Apostólicas', author: 'Francisco', pontificate: 'Francisco', year: 2018, date: '2018-03-19', themes: ['Santidade'], url: MAGISTERIUM_URLS['ge'], summary: 'Sobre o chamado à santidade no mundo atual.' },
      { id: 'cv', title: 'Christus Vivit', abbr: 'CV', type: 'Exortação Apostólica', category: 'Exortações Apostólicas', author: 'Francisco', pontificate: 'Francisco', year: 2019, date: '2019-03-25', themes: ['Jovens', 'Vocação'], url: MAGISTERIUM_URLS['cv'], summary: 'Exortação aos jovens e a todo o Povo de Deus.' },
    ],
  },
  {
    name: 'Cartas Apostólicas',
    description: 'Cartas papais sobre temas específicos.',
    order: 5,
    documents: [
      { id: 'sd',  title: 'Salvifici Doloris', abbr: 'SD', type: 'Carta Apostólica', category: 'Cartas Apostólicas', author: 'João Paulo II', pontificate: 'João Paulo II', year: 1984, date: '1984-02-11', themes: ['Sofrimento'], url: MAGISTERIUM_URLS['sd'], summary: 'Sobre o sentido cristão do sofrimento humano.' },
      { id: 'md',  title: 'Mulieris Dignitatem', abbr: 'MD', type: 'Carta Apostólica', category: 'Cartas Apostólicas', author: 'João Paulo II', pontificate: 'João Paulo II', year: 1988, date: '1988-08-15', themes: ['Mulher', 'Dignidade'], url: MAGISTERIUM_URLS['md'], summary: 'Sobre a dignidade e a vocação da mulher.' },
      { id: 'dd',  title: 'Dies Domini', abbr: 'DD', type: 'Carta Apostólica', category: 'Cartas Apostólicas', author: 'João Paulo II', pontificate: 'João Paulo II', year: 1998, date: '1998-07-05', themes: ['Domingo', 'Eucaristia'], url: MAGISTERIUM_URLS['dd'], summary: 'Sobre a santificação do domingo.' },
      { id: 'rvm', title: 'Rosarium Virginis Mariae', abbr: 'RVM', type: 'Carta Apostólica', category: 'Cartas Apostólicas', author: 'João Paulo II', pontificate: 'João Paulo II', year: 2002, date: '2002-10-16', themes: ['Maria', 'Rosário'], url: MAGISTERIUM_URLS['rvm'], summary: 'Sobre o Santo Rosário.' },
      { id: 'mm',  title: 'Misericordia et Misera', abbr: 'MM', type: 'Carta Apostólica', category: 'Cartas Apostólicas', author: 'Francisco', pontificate: 'Francisco', year: 2016, date: '2016-11-20', themes: ['Misericórdia'], url: MAGISTERIUM_URLS['mm'], summary: 'No termo do Jubileu Extraordinário da Misericórdia.' },
      { id: 'pc',  title: 'Patris Corde', abbr: 'PC', type: 'Carta Apostólica', category: 'Cartas Apostólicas', author: 'Francisco', pontificate: 'Francisco', year: 2020, date: '2020-12-08', themes: ['São José', 'Paternidade'], url: MAGISTERIUM_URLS['pc'], summary: 'Com coração de pai: no 150º aniversário da declaração de São José como Padroeiro da Igreja Universal.' },
    ],
  },
  {
    name: 'Documentos Doutrinais',
    description: 'Declarações e instruções dos Dicastérios da Santa Sé.',
    order: 6,
    documents: [
      { id: 'di', title: 'Dominus Iesus', type: 'Documento Doutrinal', category: 'Documentos Doutrinais', author: 'Congregação para a Doutrina da Fé', pontificate: 'João Paulo II', year: 2000, date: '2000-08-06', themes: ['Ecumenismo', 'Salvação', 'Cristologia'], url: MAGISTERIUM_URLS['di'], summary: 'Sobre a unicidade e a universalidade salvífica de Jesus Cristo e da Igreja.' },
    ],
  },
  {
    name: 'Compêndios e Códigos',
    description: 'Corpos sistemáticos da doutrina e da disciplina eclesiástica.',
    order: 7,
    documents: [
      { id: 'cic',  title: 'Catecismo da Igreja Católica', abbr: 'CIC', type: 'Compêndio', category: 'Compêndios e Códigos', author: 'João Paulo II', pontificate: 'João Paulo II', year: 1992, date: '1992-10-11', themes: ['Doutrina', 'Fé'], url: MAGISTERIUM_URLS['cic'], summary: 'Exposição sistemática da fé e da doutrina católica.' },
      { id: 'cdsi', title: 'Compêndio da Doutrina Social', abbr: 'CDSI', type: 'Compêndio', category: 'Compêndios e Códigos', author: 'Pontifício Conselho Justiça e Paz', pontificate: 'João Paulo II', year: 2004, date: '2004-06-29', themes: ['Social', 'Moral'], url: MAGISTERIUM_URLS['cdsi'], summary: 'Apresentação orgânica do ensinamento social da Igreja.' },
      { id: 'cdc',  title: 'Código de Direito Canônico', abbr: 'CDC', type: 'Código', category: 'Compêndios e Códigos', author: 'João Paulo II', pontificate: 'João Paulo II', year: 1983, date: '1983-01-25', themes: ['Direito', 'Disciplina'], url: MAGISTERIUM_URLS['cdc'], summary: 'Corpo legislativo fundamental para a Igreja latina.' },
    ],
  },
];

/** Lista plana em ordem canônica: categoria (`order`) → data cronológica. */
export const MAGISTERIUM_DOCUMENTS: MagisteriumDocument[] = MAGISTERIUM_CATEGORIES
  .slice()
  .sort((a, b) => a.order - b.order)
  .flatMap(cat =>
    cat.documents.slice().sort((a, b) => (a.date ?? `${a.year}`).localeCompare(b.date ?? `${b.year}`))
  );

/** Universo de temas para os chips de filtro (ordenado alfabeticamente). */
export const MAGISTERIUM_THEMES: string[] = Array.from(
  new Set(MAGISTERIUM_DOCUMENTS.flatMap(d => d.themes))
).sort((a, b) => a.localeCompare(b, 'pt-BR'));

/** Universo de tipos, na ordem em que aparecem nas categorias. */
export const MAGISTERIUM_TYPES: MagisteriumType[] = Array.from(
  new Set(MAGISTERIUM_DOCUMENTS.map(d => d.type))
) as MagisteriumType[];
