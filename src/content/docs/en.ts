import type { DocsBundle } from './types';

export const docsEn: DocsBundle = {
  categories: {
    inicio: 'Getting started',
    leitura: 'Reading',
    oracao: 'Prayer',
    estudo: 'Study',
  },
  ui: {
    portalTitle: 'Documentation',
    portalSubtitle: 'Short guides for using Cathedra with spiritual profit.',
    searchLabel: 'Search the documentation',
    searchPlaceholder: 'Search a guide, topic or word…',
    empty: 'No guide matches your search.',
    resultsCount: (n) => (n === 1 ? '1 guide found' : `${n} guides found`),
    back: 'Back to documentation',
    onThisPage: 'On this page',
  },
  guides: [
    {
      slug: 'primeiros-passos',
      category: 'inicio',
      title: 'Getting started',
      summary: 'How Cathedra is organised and where to begin on day one.',
      keywords: ['start', 'account', 'profile', 'navigation', 'atrium'],
      sections: [
        {
          heading: 'What Cathedra is',
          body: [
            'Cathedra gathers Scripture, liturgy, prayer and the Fathers in one place, cross-referenced throughout.',
            'The aim is not to accumulate information, but to sustain a steady interior life.',
          ],
        },
        {
          heading: 'Where to begin',
          body: [
            'Start at the Atrium: it shows the liturgy of the day, your continuous reading and anything left unfinished.',
            'Create an account to keep reading progress, marks and reflections across devices.',
          ],
        },
        {
          heading: 'A suggested rhythm',
          body: [
            'One chapter of Scripture, one prayer and one glossary entry a day is enough to build the habit.',
            'Constancy matters more than volume.',
          ],
        },
      ],
    },
    {
      slug: 'biblia-e-leitura-continua',
      category: 'leitura',
      title: 'Bible and continuous reading',
      summary: 'Chapter reading, marks, resuming and searching the sacred text.',
      keywords: ['bible', 'scripture', 'chapter', 'verse', 'bookmark'],
      sections: [
        {
          heading: 'Reading by chapter',
          body: [
            'Scripture is read in whole chapters, uncut, so the context is preserved.',
            'The active translation is shown in the reader header.',
          ],
        },
        {
          heading: 'Resume where you stopped',
          body: [
            'Every chapter you read is recorded and appears under "Continue reading".',
            'Marks and reflections are bound to the verse, not to the session.',
          ],
        },
        {
          heading: 'Cross-references',
          body: ['References inside the text open in a floating card, without pulling you out of the reading.'],
        },
      ],
    },
    {
      slug: 'liturgia-e-missal',
      category: 'leitura',
      title: 'Liturgy and Missal',
      summary: 'Liturgical calendar, readings of the day and the Liturgy of the Hours.',
      keywords: ['mass', 'missal', 'breviary', 'hours', 'calendar', 'liturgical season'],
      sections: [
        {
          heading: 'Liturgy of the day',
          body: [
            'The calendar computes the liturgical season, colour and memorial automatically.',
            'The proper readings are shown as continuous reading, ready for prayer.',
          ],
        },
        {
          heading: 'Liturgy of the Hours',
          body: [
            'Lauds, Midday Prayer, Vespers and Compline follow the structure of the breviary.',
            'Texts are laid out in sequence, with no jumps between pages.',
          ],
        },
      ],
    },
    {
      slug: 'oracao-e-rosario',
      category: 'oracao',
      title: 'Prayer and the Rosary',
      summary: 'Contemplation mode, the mysteries of the Rosary and the Way of the Cross.',
      keywords: ['rosary', 'way of the cross', 'mysteries', 'contemplation'],
      sections: [
        {
          heading: 'Contemplation mode',
          body: [
            'Contemplation mode strips the interface down to text, rhythm and image.',
            'Moving between mysteries is manual, at your own pace.',
          ],
        },
        {
          heading: 'Rosary and Way of the Cross',
          body: [
            'Each mystery carries its own meditation, Scripture and sacred image.',
            'The Way of the Cross follows the fourteen stations in the traditional order.',
          ],
        },
      ],
    },
    {
      slug: 'glossario-e-nexus',
      category: 'estudo',
      title: 'Glossary and Nexus',
      summary: 'Theological entries and the reference graph that binds the library.',
      keywords: ['glossary', 'entry', 'nexus', 'references', 'graph'],
      sections: [
        {
          heading: 'Entries',
          body: [
            'Each entry offers definition, etymology, Scripture, Magisterium, Tradition and application.',
            'Only published entries are visible to the public.',
          ],
        },
        {
          heading: 'Nexus Theologicus',
          body: [
            'The Nexus links entries, saints, prayers and biblical passages to one another.',
            'Suggestions appear at the end of a reading, as continuity rather than distraction.',
          ],
        },
      ],
    },
  ],
};
