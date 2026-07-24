/**
 * Metadados dos Acervos (hubs) da Biblioteca. Cada acervo é um LibraryModule
 * com descrição editorial, imagem e temas relacionados. Fonte única para a
 * página `/biblioteca/acervo/:module` e para os cards da home.
 */
import type { LibraryModule } from '@/modules/biblioteca/types';
import collectionSagradaEscritura from '@/assets/collections/sagrada-escritura.jpg';
import collectionCatecismo from '@/assets/collections/catecismo.jpg';
import collectionMagisterio from '@/assets/collections/magisterio.jpg';
import collectionSantosPadres from '@/assets/collections/santos-padres.jpg';

export interface AcervoMeta {
  module: LibraryModule;
  slug: string;
  title: string;
  meta: string;
  shortDescription: string;
  longDescription: string;
  image?: string;
  themes: { label: string; query: string }[];
}

export const LIBRARY_ACERVOS: AcervoMeta[] = [
  {
    module: 'bible',
    slug: 'sagrada-escritura',
    title: 'Sagrada Escritura',
    meta: '73 Livros · Antigo e Novo Testamento',
    shortDescription:
      'Antigo e Novo Testamento, com anotações e Nexus contextual.',
    longDescription:
      'A Palavra de Deus escrita, transmitida pela Tradição da Igreja. Percorra os 73 livros com anotações editoriais, referências cruzadas Nexus e leitura contínua em capítulos.',
    image: collectionSagradaEscritura,
    themes: [
      { label: 'Salmos', query: 'Salmo' },
      { label: 'Evangelho', query: 'Evangelho' },
      { label: 'Paulo', query: 'Paulo' },
      { label: 'Profetas', query: 'Profeta' },
    ],
  },
  {
    module: 'catechism',
    slug: 'catecismo',
    title: 'Catecismo',
    meta: '2865 Parágrafos · CIC',
    shortDescription:
      'A doutrina da Igreja organizada e interconectada.',
    longDescription:
      'O Catecismo da Igreja Católica em sua estrutura canônica de quatro partes: profissão da fé, celebração, vida em Cristo e oração. Cada parágrafo interligado à Escritura, Padres e Magistério.',
    image: collectionCatecismo,
    themes: [
      { label: 'Credo', query: 'Credo' },
      { label: 'Sacramentos', query: 'Sacramento' },
      { label: 'Mandamentos', query: 'Mandamento' },
      { label: 'Oração', query: 'Oração' },
    ],
  },
  {
    module: 'magisterium',
    slug: 'magisterio',
    title: 'Magistério',
    meta: 'Encíclicas · Constituições · Exortações',
    shortDescription:
      'Documentos pontifícios que definem o dogma através dos séculos.',
    longDescription:
      'O ensinamento autêntico dos Sucessores de Pedro e dos Concílios. Encíclicas, constituições apostólicas, exortações e decretos organizados por pontificado e tema.',
    image: collectionMagisterio,
    themes: [
      { label: 'Vaticano II', query: 'Vaticano II' },
      { label: 'Social', query: 'Rerum' },
      { label: 'Doutrina', query: 'Fides' },
      { label: 'Moral', query: 'Veritatis' },
    ],
  },
  {
    module: 'saints',
    slug: 'santos-padres',
    title: 'Santos & Padres',
    meta: 'Vida · Escritos · Doutores da Igreja',
    shortDescription:
      'Testemunhos e obras dos Padres e Doutores da Igreja.',
    longDescription:
      'Da era apostólica ao século XX: vidas exemplares, escritos e legados espirituais dos santos canonizados e dos Padres que forjaram a Tradição.',
    image: collectionSantosPadres,
    themes: [
      { label: 'Padres', query: 'Padre' },
      { label: 'Doutores', query: 'Doutor' },
      { label: 'Mártires', query: 'Mártir' },
      { label: 'Místicos', query: 'Místico' },
    ],
  },
];

export const LIBRARY_ACERVO_BY_SLUG = new Map<string, AcervoMeta>(
  LIBRARY_ACERVOS.map((a) => [a.slug, a]),
);

export const LIBRARY_ACERVO_BY_MODULE = new Map<LibraryModule, AcervoMeta>(
  LIBRARY_ACERVOS.map((a) => [a.module, a]),
);
