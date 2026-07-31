import type { DocsBundle } from './types';

export const docsEs: DocsBundle = {
  categories: {
    inicio: 'Comenzar',
    leitura: 'Lectura',
    oracao: 'Oración',
    estudo: 'Estudio',
  },
  ui: {
    portalTitle: 'Documentación',
    portalSubtitle: 'Guías breves para usar Cathedra con provecho espiritual.',
    searchLabel: 'Buscar en la documentación',
    searchPlaceholder: 'Buscar guía, tema o palabra…',
    empty: 'Ninguna guía coincide con la búsqueda.',
    resultsCount: (n) => (n === 1 ? '1 guía encontrada' : `${n} guías encontradas`),
    back: 'Volver a la documentación',
    onThisPage: 'En esta página',
  },
  guides: [
    {
      slug: 'primeiros-passos',
      category: 'inicio',
      title: 'Primeros pasos',
      summary: 'Cómo se organiza Cathedra y por dónde empezar el primer día.',
      keywords: ['inicio', 'cuenta', 'perfil', 'navegación', 'atrio'],
      sections: [
        {
          heading: 'Qué es Cathedra',
          body: [
            'Cathedra reúne Escritura, liturgia, oración y patrística en un solo lugar, con referencias cruzadas en todo el acervo.',
            'El propósito no es acumular información, sino sostener una vida interior constante.',
          ],
        },
        {
          heading: 'Por dónde empezar',
          body: [
            'Comience por el Atrio: presenta la liturgia del día, la lectura continua y lo que quedó pendiente.',
            'Cree una cuenta para conservar progreso, marcas y reflexiones entre dispositivos.',
          ],
        },
        {
          heading: 'Ritmo sugerido',
          body: [
            'Un capítulo de Escritura, una oración y un término al día bastan para formar el hábito.',
            'La constancia vale más que la cantidad.',
          ],
        },
      ],
    },
    {
      slug: 'biblia-e-leitura-continua',
      category: 'leitura',
      title: 'Biblia y lectura continua',
      summary: 'Lectura por capítulos, marcas, reanudación y búsqueda en el texto sagrado.',
      keywords: ['biblia', 'escritura', 'capítulo', 'versículo', 'marcador'],
      sections: [
        {
          heading: 'Lectura por capítulo',
          body: [
            'La Escritura se lee en capítulos completos, sin cortes, para preservar el contexto.',
            'La traducción activa se indica en el encabezado del lector.',
          ],
        },
        {
          heading: 'Retomar donde se detuvo',
          body: [
            'Cada capítulo leído queda registrado y aparece en «Continuar leyendo».',
            'Las marcas y reflexiones se vinculan al versículo, no a la sesión.',
          ],
        },
        {
          heading: 'Referencias cruzadas',
          body: ['Las referencias del texto se abren en una tarjeta flotante, sin sacarlo de la lectura.'],
        },
      ],
    },
    {
      slug: 'liturgia-e-missal',
      category: 'leitura',
      title: 'Liturgia y Misal',
      summary: 'Calendario litúrgico, lecturas del día y Liturgia de las Horas.',
      keywords: ['misa', 'misal', 'breviario', 'horas', 'calendario', 'tiempo litúrgico'],
      sections: [
        {
          heading: 'Liturgia del día',
          body: [
            'El calendario calcula automáticamente el tiempo litúrgico, el color y la memoria del día.',
            'Las lecturas propias se presentan en lectura continua, dispuestas para la oración.',
          ],
        },
        {
          heading: 'Liturgia de las Horas',
          body: [
            'Laudes, Hora Media, Vísperas y Completas siguen la estructura del breviario.',
            'Los textos se muestran en secuencia, sin saltos entre páginas.',
          ],
        },
      ],
    },
    {
      slug: 'oracao-e-rosario',
      category: 'oracao',
      title: 'Oración y Rosario',
      summary: 'Modo contemplación, misterios del Rosario y Vía Crucis.',
      keywords: ['rosario', 'vía crucis', 'misterios', 'contemplación'],
      sections: [
        {
          heading: 'Modo contemplación',
          body: [
            'El modo contemplación reduce la interfaz a lo esencial: texto, ritmo e imagen.',
            'El paso entre misterios es manual, respetando su tiempo.',
          ],
        },
        {
          heading: 'Rosario y Vía Crucis',
          body: [
            'Cada misterio ofrece meditación propia, Escritura e imagen sacra.',
            'El Vía Crucis sigue las catorce estaciones en el orden tradicional.',
          ],
        },
      ],
    },
    {
      slug: 'glossario-e-nexus',
      category: 'estudo',
      title: 'Glosario y Nexus',
      summary: 'Términos teológicos y el grafo de referencias que une el acervo.',
      keywords: ['glosario', 'término', 'nexus', 'referencias', 'grafo'],
      sections: [
        {
          heading: 'Términos',
          body: [
            'Cada término ofrece definición, etimología, Escritura, Magisterio, Tradición y aplicación.',
            'Solo los términos publicados son visibles al público.',
          ],
        },
        {
          heading: 'Nexus Theologicus',
          body: [
            'El Nexus enlaza términos, santos, oraciones y pasajes bíblicos entre sí.',
            'Las sugerencias aparecen al final de la lectura, como continuidad y no como distracción.',
          ],
        },
      ],
    },
  ],
};
