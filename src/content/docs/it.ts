import type { DocsBundle } from './types';

export const docsIt: DocsBundle = {
  categories: {
    inicio: 'Iniziare',
    leitura: 'Lettura',
    oracao: 'Preghiera',
    estudo: 'Studio',
  },
  ui: {
    portalTitle: 'Documentazione',
    portalSubtitle: 'Brevi guide per usare Cathedra con frutto spirituale.',
    searchLabel: 'Cerca nella documentazione',
    searchPlaceholder: 'Cerca una guida, un tema o una parola…',
    empty: 'Nessuna guida corrisponde alla ricerca.',
    resultsCount: (n) => (n === 1 ? '1 guida trovata' : `${n} guide trovate`),
    back: 'Torna alla documentazione',
    onThisPage: 'In questa pagina',
  },
  guides: [
    {
      slug: 'primeiros-passos',
      category: 'inicio',
      title: 'Primi passi',
      summary: 'Come è organizzata Cathedra e da dove cominciare il primo giorno.',
      keywords: ['inizio', 'account', 'profilo', 'navigazione', 'atrio'],
      sections: [
        {
          heading: 'Che cos’è Cathedra',
          body: [
            'Cathedra raccoglie Scrittura, liturgia, preghiera e patristica in un solo luogo, con rimandi incrociati in tutto l’archivio.',
            'Lo scopo non è accumulare informazioni, ma sostenere una vita interiore costante.',
          ],
        },
        {
          heading: 'Da dove cominciare',
          body: [
            'Inizi dall’Atrio: mostra la liturgia del giorno, la lettura continua e ciò che è rimasto in sospeso.',
            'Crei un account per conservare progressi, segni e riflessioni tra i dispositivi.',
          ],
        },
        {
          heading: 'Ritmo suggerito',
          body: [
            'Un capitolo di Scrittura, una preghiera e una voce del glossario al giorno bastano a formare l’abitudine.',
            'La costanza vale più della quantità.',
          ],
        },
      ],
    },
    {
      slug: 'biblia-e-leitura-continua',
      category: 'leitura',
      title: 'Bibbia e lettura continua',
      summary: 'Lettura per capitoli, segni, ripresa e ricerca nel testo sacro.',
      keywords: ['bibbia', 'scrittura', 'capitolo', 'versetto', 'segnalibro'],
      sections: [
        {
          heading: 'Lettura per capitolo',
          body: [
            'La Scrittura si legge in capitoli interi, senza tagli, per conservare il contesto.',
            'La traduzione attiva è indicata nell’intestazione del lettore.',
          ],
        },
        {
          heading: 'Riprendere da dove si è fermato',
          body: [
            'Ogni capitolo letto viene registrato e compare in «Continua a leggere».',
            'Segni e riflessioni sono legati al versetto, non alla sessione.',
          ],
        },
        {
          heading: 'Rimandi',
          body: ['I rimandi nel testo si aprono in una scheda fluttuante, senza interrompere la lettura.'],
        },
      ],
    },
    {
      slug: 'liturgia-e-missal',
      category: 'leitura',
      title: 'Liturgia e Messale',
      summary: 'Calendario liturgico, letture del giorno e Liturgia delle Ore.',
      keywords: ['messa', 'messale', 'breviario', 'ore', 'calendario', 'tempo liturgico'],
      sections: [
        {
          heading: 'Liturgia del giorno',
          body: [
            'Il calendario calcola automaticamente il tempo liturgico, il colore e la memoria del giorno.',
            'Le letture proprie sono presentate in lettura continua, pronte per la preghiera.',
          ],
        },
        {
          heading: 'Liturgia delle Ore',
          body: [
            'Lodi, Ora Media, Vespri e Compieta seguono la struttura del breviario.',
            'I testi sono disposti in sequenza, senza salti tra le pagine.',
          ],
        },
      ],
    },
    {
      slug: 'oracao-e-rosario',
      category: 'oracao',
      title: 'Preghiera e Rosario',
      summary: 'Modalità contemplazione, misteri del Rosario e Via Crucis.',
      keywords: ['rosario', 'via crucis', 'misteri', 'contemplazione'],
      sections: [
        {
          heading: 'Modalità contemplazione',
          body: [
            'La modalità contemplazione riduce l’interfaccia all’essenziale: testo, ritmo e immagine.',
            'Il passaggio tra i misteri è manuale, secondo il suo tempo.',
          ],
        },
        {
          heading: 'Rosario e Via Crucis',
          body: [
            'Ogni mistero porta con sé meditazione propria, Scrittura e immagine sacra.',
            'La Via Crucis segue le quattordici stazioni nell’ordine tradizionale.',
          ],
        },
      ],
    },
    {
      slug: 'glossario-e-nexus',
      category: 'estudo',
      title: 'Glossario e Nexus',
      summary: 'Voci teologiche e il grafo di rimandi che unisce l’archivio.',
      keywords: ['glossario', 'voce', 'nexus', 'rimandi', 'grafo'],
      sections: [
        {
          heading: 'Voci',
          body: [
            'Ogni voce offre definizione, etimologia, Scrittura, Magistero, Tradizione e applicazione.',
            'Solo le voci pubblicate sono visibili al pubblico.',
          ],
        },
        {
          heading: 'Nexus Theologicus',
          body: [
            'Il Nexus collega tra loro voci, santi, preghiere e passi biblici.',
            'I suggerimenti compaiono al termine della lettura, come continuità e non come distrazione.',
          ],
        },
      ],
    },
  ],
};
