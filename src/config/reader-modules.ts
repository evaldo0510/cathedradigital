/**
 * Registro canônico de módulos de leitura da Cathedra.
 *
 * Fonte única de verdade para:
 *  - `scripts/reader-template-audit.ts` (score de aderência ao Reader Template Master)
 *  - `tests/e2e/reader-template-chain.spec.ts` (verificação DOM da cadeia)
 *  - `src/test/reader-template-chain.static.test.ts` (verificação estática)
 *
 * Regra: TODO módulo com experiência de leitura deve estar aqui.
 * Não criar readers fora deste registro (proíbe drift silencioso).
 */

export type ReaderModuleStatus = 'certified' | 'partial' | 'pending';

export interface ReaderModule {
  /** Slug estável. Aparece nos relatórios. */
  id: string;
  /** Nome humano do módulo. */
  label: string;
  /** Arquivo entry que renderiza o Reader (relativo à raiz). */
  entry: string;
  /**
   * Rotas SPA que instanciam este módulo, na forma navegável.
   * A primeira rota é usada como sample no E2E.
   */
  sampleRoutes: string[];
  /** Score alvo desta Fase (0-100). Bloqueia CI quando `blocking = true`. */
  targetScore: number;
  /** Score atual ~ auditoria manual. Atualizado pelo auditor. */
  status: ReaderModuleStatus;
  /** Se `true`, score abaixo do alvo falha o CI. */
  blocking: boolean;
  /**
   * Se o módulo intencionalmente NÃO possui um dos slots
   * (ex.: coleção sem NexusPanel), documentar aqui para não penalizar.
   */
  optionalSlots?: Array<'nexus' | 'continuation' | 'popover'>;
}

export const READER_MODULES: readonly ReaderModule[] = [
  {
    id: 'glossary',
    label: 'Glossário',
    entry: 'src/pages/GlossaryTermPage.tsx',
    sampleRoutes: ['/glossario/graca'],
    targetScore: 100,
    status: 'certified',
    blocking: true,
  },
  {
    id: 'catechism',
    label: 'Catecismo',
    // Entry real do leitor (o antigo caminho era apenas um shim de reexport,
    // o que fazia a auditoria medir um arquivo sem JSX e reportar 15/100).
    entry: 'src/modules/catequese/reader/Catechism.tsx',
    sampleRoutes: ['/catechism?p=1'],
    targetScore: 90,
    status: 'certified',
    blocking: true,
  },
  {
    id: 'bible',
    label: 'Bíblia',
    entry: 'src/components/cathedra/BibleReader.tsx',
    sampleRoutes: ['/biblia/joao/1'],
    targetScore: 85,
    status: 'certified',
    blocking: false,
  },
  {
    id: 'magisterium',
    label: 'Magistério',
    entry: 'src/components/cathedra/MagisteriumViewer.tsx',
    sampleRoutes: ['/magisterio'],
    targetScore: 80,
    status: 'certified',
    blocking: false,
  },
  {
    id: 'saints',
    label: 'Santos',
    // `SaintDetail` é um modal legado; a rota /santos/:id renderiza o motor
    // editorial (SaintAutoPage), que é o Reader real do módulo.
    entry: 'src/features/saints/editorialEngine/SaintAutoPage.tsx',
    sampleRoutes: ['/santos'],
    targetScore: 80,
    status: 'certified',
    blocking: false,
  },
  // Nota: entrada canônica do Prayer Engine é `prayer-engine` (sub-onda C0.3).
  {
    id: 'journey',
    label: 'Jornadas',
    entry: 'src/components/cathedra/JornadaStepPage.tsx',
    sampleRoutes: ['/jornadas'],
    targetScore: 80,
    status: 'certified',
    blocking: false,
  },
  {
    id: 'collection',
    label: 'Coleções',
    entry: 'src/pages/CollectionPage.tsx',
    sampleRoutes: ['/colecoes'],
    targetScore: 80,
    status: 'certified',
    blocking: false,
    optionalSlots: ['popover'],
  },
  {
    id: 'novena',
    label: 'Novenas',
    entry: 'src/pages/NovenaDetailPage.tsx',
    sampleRoutes: ['/novenas'],
    targetScore: 80,
    status: 'certified',
    blocking: false,
  },
  // ── Sub-onda C0.1 (migrados) ─────────────────────────────────────────
  {
    id: 'missal',
    label: 'Missal Romano',
    entry: 'src/components/cathedra/MissaContinuousReader.tsx',
    sampleRoutes: ['/missal'],
    targetScore: 90,
    status: 'certified',
    blocking: true,
  },
  {
    id: 'breviary',
    label: 'Liturgia das Horas',
    entry: 'src/components/cathedra/BreviaryContinuousReader.tsx',
    sampleRoutes: ['/liturgia-das-horas'],
    targetScore: 90,
    status: 'certified',
    blocking: true,
  },
  // ── Sub-onda C0.3 · Prayer Engine (fase 2: MysteryNexusPanel removido) ─
  {
    id: 'prayer-engine',
    label: 'Prayer Engine (Rosário, Via Sacra, Novenas, Ladainhas)',
    entry: 'src/components/cathedra/PrayerEngineReader.tsx',
    sampleRoutes: ['/oracao'],
    targetScore: 90,
    status: 'certified',
    blocking: true,
  },
] as const;



/** Componentes/adaptadores proibidos pelo Reader Architecture Rule. */
export const FORBIDDEN_IMPORTS = [
  {
    id: 'nexus-bubbles',
    pattern: /from\s+['"][^'"]*cathedra\/NexusBubbles['"]/,
    label: 'NexusBubbles',
    replacement: 'NexusPanel + ReferencePopover',
  },
  {
    id: 'mystery-nexus-panel',
    pattern: /from\s+['"][^'"]*prayer\/rosary\/MysteryNexusPanel['"]/,
    label: 'MysteryNexusPanel',
    replacement: 'NexusPanel + prayerAutoNexus',
  },
  {
    id: 'auto-nexus-list-local',
    // função local declarada dentro de uma página
    pattern: /\b(?:function|const)\s+AutoNexusList\b/,
    label: 'AutoNexusList (local)',
    replacement: 'NexusPanel',
  },
  {
    id: 'nexus-full-list-local',
    pattern: /\b(?:function|const)\s+NexusFullList\b/,
    label: 'NexusFullList (local)',
    replacement: 'NexusPanel',
  },
  {
    id: 'radix-popover-direct',
    pattern: /from\s+['"]@radix-ui\/react-popover['"]/,
    label: '@radix-ui/react-popover (direto)',
    replacement: 'ReferencePopover ou src/components/ui/popover',
  },
  {
    id: 'reader-deep-import',
    // Reader V2: primitivos só podem ser consumidos pelo barrel canônico.
    pattern: /from\s+['"]@\/components\/reader\/[A-Za-z]/,
    label: 'import profundo de primitivo do Reader',
    replacement: "import { ... } from '@/components/reader'",
  },
] as const;

/**
 * Arquivos onde os imports proibidos são tolerados (guardrail allowlist).
 * Sempre que Fase D remover fisicamente um arquivo deprecado, remover
 * a entrada correspondente daqui.
 */
export const GUARDRAIL_ALLOWLIST: readonly string[] = [
  // Primitivo shadcn (Popover base)
  'src/components/ui/popover.tsx',
  // ReferencePopover é o único wrapper autorizado
  'src/components/reader/ReferencePopover.tsx',
  // C0.4.b: NexusBubbles extinto. TagBubble migrado para ThemeChip.
  //    C0.4 concluída: Bible/Journey/Magisterium/Saint migrados de NexusBubbles → NexusPanel.
  'src/components/cathedra/MissalPage.tsx',            // sub-onda C.4
  'src/components/cathedra/MissaContinuousReader.tsx', // sub-onda C.4
  'src/components/cathedra/BreviaryPage.tsx',          // sub-onda C.4
  'src/components/cathedra/BreviaryContinuousReader.tsx', // sub-onda C.4
  // Popovers editoriais legados (ainda usam radix diretamente até migrarem para ReferencePopover)
  'src/components/cathedra/BibleVersePopover.tsx',
  'src/components/cathedra/BibleDictionaryPopover.tsx',
  'src/lib/nexusContent.ts',
  // Import type-only do contrato de EditorialClosure (evita ciclo com o barrel)
  'src/lib/editorial/resolveClosure.ts',
];

