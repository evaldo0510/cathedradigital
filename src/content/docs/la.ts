import type { DocsBundle } from './types';

export const docsLa: DocsBundle = {
  categories: {
    inicio: 'Initium',
    leitura: 'Lectio',
    oracao: 'Oratio',
    estudo: 'Studium',
  },
  ui: {
    portalTitle: 'Documenta',
    portalSubtitle: 'Breves commentarioli ad Cathedram spiritualiter adhibendam.',
    searchLabel: 'Quaerere in documentis',
    searchPlaceholder: 'Quaere commentariolum, argumentum vel verbum…',
    empty: 'Nullum commentariolum quaesitis respondet.',
    resultsCount: (n) => (n === 1 ? 'Unum commentariolum inventum' : `${n} commentarioli inventi`),
    back: 'Ad documenta redire',
    onThisPage: 'In hac pagina',
  },
  guides: [
    {
      slug: 'primeiros-passos',
      category: 'inicio',
      title: 'Prima initia',
      summary: 'Quomodo Cathedra disponatur et unde primo die incipiendum sit.',
      keywords: ['initium', 'ratio', 'atrium', 'navigatio'],
      sections: [
        {
          heading: 'Quid sit Cathedra',
          body: [
            'Cathedra Scripturam, liturgiam, orationem et Patres uno in loco colligit, omnibus inter se relatis.',
            'Non notitias congerere quaerimus, sed vitam interiorem constanter fovere.',
          ],
        },
        {
          heading: 'Unde incipiendum',
          body: [
            'Ab Atrio incipe: liturgiam diei, lectionem continuam et opera imperfecta ostendit.',
            'Rationem crea, ut profectus lectionis, notae et meditationes inter instrumenta serventur.',
          ],
        },
        {
          heading: 'Modus cotidianus',
          body: [
            'Unum Scripturae caput, una oratio, unum glossarii verbum in die sufficiunt ad consuetudinem.',
            'Constantia plus valet quam multitudo.',
          ],
        },
      ],
    },
    {
      slug: 'biblia-e-leitura-continua',
      category: 'leitura',
      title: 'Biblia et lectio continua',
      summary: 'Lectio per capita, notae, reditus et inquisitio in textu sacro.',
      keywords: ['biblia', 'scriptura', 'caput', 'versus', 'nota'],
      sections: [
        {
          heading: 'Lectio per capita',
          body: [
            'Scriptura per integra capita legitur, nihil praetermisso, ut contextus servetur.',
            'Translatio adhibita in capite lectoris indicatur.',
          ],
        },
        {
          heading: 'Redire ubi desiisti',
          body: [
            'Unumquodque caput lectum notatur et in «Lectionem continua» apparet.',
            'Notae et meditationes versui adhaerent, non sessioni.',
          ],
        },
        {
          heading: 'Relationes mutuae',
          body: ['Relationes in textu in schedula volante aperiuntur, lectione non interrupta.'],
        },
      ],
    },
    {
      slug: 'liturgia-e-missal',
      category: 'leitura',
      title: 'Liturgia et Missale',
      summary: 'Calendarium liturgicum, lectiones diei et Liturgia Horarum.',
      keywords: ['missa', 'missale', 'breviarium', 'horae', 'calendarium'],
      sections: [
        {
          heading: 'Liturgia diei',
          body: [
            'Calendarium tempus liturgicum, colorem et memoriam diei sponte computat.',
            'Lectiones propriae lectione continua exhibentur, orationi paratae.',
          ],
        },
        {
          heading: 'Liturgia Horarum',
          body: [
            'Laudes, Hora Media, Vesperae et Completorium breviarii ordinem sequuntur.',
            'Textus ordine exhibentur, nullis paginarum saltibus.',
          ],
        },
      ],
    },
    {
      slug: 'oracao-e-rosario',
      category: 'oracao',
      title: 'Oratio et Rosarium',
      summary: 'Modus contemplationis, mysteria Rosarii et Via Crucis.',
      keywords: ['rosarium', 'via crucis', 'mysteria', 'contemplatio'],
      sections: [
        {
          heading: 'Modus contemplationis',
          body: [
            'Modus contemplationis interficiem ad essentialia redigit: textum, numerum, imaginem.',
            'Transitus inter mysteria manu fit, tempore tuo servato.',
          ],
        },
        {
          heading: 'Rosarium et Via Crucis',
          body: [
            'Unumquodque mysterium meditationem propriam, Scripturam et imaginem sacram fert.',
            'Via Crucis quattuordecim stationes ordine tradito sequitur.',
          ],
        },
      ],
    },
    {
      slug: 'glossario-e-nexus',
      category: 'estudo',
      title: 'Glossarium et Nexus',
      summary: 'Verba theologica et nexus relationum qui thesaurum coniungit.',
      keywords: ['glossarium', 'verbum', 'nexus', 'relationes'],
      sections: [
        {
          heading: 'Verba',
          body: [
            'Unumquodque verbum definitionem, etymologiam, Scripturam, Magisterium, Traditionem et usum praebet.',
            'Sola verba edita publice patent.',
          ],
        },
        {
          heading: 'Nexus Theologicus',
          body: [
            'Nexus verba, sanctos, orationes et loca biblica inter se coniungit.',
            'Suasiones in fine lectionis apparent, ut continuatio, non ut distractio.',
          ],
        },
      ],
    },
  ],
};
