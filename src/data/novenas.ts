/**
 * Editorial: Novenas fundamentais.
 * Estrutura fixa de 9 dias, com abertura, meditação diária e encerramento.
 * Fonte: tradição litúrgica romana e devocionários aprovados (Pia Sociedade de S. Paulo, ACI Digital).
 */

export interface NovenaDay {
  day: number;
  title: string;
  scripture?: string;
  meditation: string;
  intention: string;
}

export interface Novena {
  slug: string;
  title: string;
  latin?: string;
  patron: string;
  category: 'Jesus Cristo' | 'Virgem Maria' | 'Santos' | 'Espírito Santo';
  summary: string;
  opening: string;
  closing: string;
  finalPrayer: string;
  days: NovenaDay[];
}

const CLOSING_MARIANA =
  'Pai Nosso… Ave Maria… Glória ao Pai…\n\nRogai por nós, Santa Mãe de Deus.\nPara que sejamos dignos das promessas de Cristo. Amém.';

export const NOVENAS: Novena[] = [
  {
    slug: 'espirito-santo',
    title: 'Novena ao Espírito Santo',
    latin: 'Novena Sancti Spiritus',
    patron: 'Espírito Santo',
    category: 'Espírito Santo',
    summary:
      'A mais antiga das novenas: os nove dias entre a Ascensão e Pentecostes, em que os Apóstolos perseveraram unidos em oração com Maria.',
    opening:
      'Vinde, Espírito Santo, enchei os corações dos vossos fiéis e acendei neles o fogo do vosso amor.\n\nEnviai o vosso Espírito e tudo será criado.\nE renovareis a face da terra.',
    closing:
      'Ó Deus, que instruístes os corações dos vossos fiéis com a luz do Espírito Santo, fazei que apreciemos retamente todas as coisas segundo o mesmo Espírito e gozemos sempre da sua consolação. Por Cristo, Senhor nosso. Amém.',
    finalPrayer:
      'Espírito Santo, alma da minha alma, eu Vos adoro. Iluminai-me, guiai-me, fortificai-me, consolai-me. Dizei-me o que devo fazer, dai-me as vossas ordens. Prometo submeter-me a tudo o que desejardes de mim e aceitar tudo o que permitirdes me aconteça. Fazei-me somente conhecer a vossa vontade.',
    days: [
      {
        day: 1,
        title: 'Espírito de Sabedoria',
        scripture: 'At 1,14',
        meditation:
          'Perseveravam unânimes na oração, com algumas mulheres, entre as quais Maria, Mãe de Jesus. A Sabedoria começa no coração que se aquieta para escutar.',
        intention: 'Peço o dom da Sabedoria — para saborear as coisas de Deus antes das coisas dos homens.',
      },
      {
        day: 2,
        title: 'Espírito de Entendimento',
        scripture: 'Jo 14,26',
        meditation:
          'O Paráclito, que o Pai enviará em meu nome, vos ensinará todas as coisas. O Entendimento penetra os mistérios da fé, para além da mera palavra.',
        intention: 'Peço o dom do Entendimento — para penetrar as verdades reveladas com luz interior.',
      },
      {
        day: 3,
        title: 'Espírito de Conselho',
        scripture: 'Rm 8,14',
        meditation:
          'Todos os que são guiados pelo Espírito de Deus são filhos de Deus. O Conselho é a bússola divina nas decisões que a razão não basta iluminar.',
        intention: 'Peço o dom do Conselho — para escolher sempre o caminho que conduz à salvação.',
      },
      {
        day: 4,
        title: 'Espírito de Fortaleza',
        scripture: 'At 1,8',
        meditation:
          'Recebereis a força do Espírito Santo, que descerá sobre vós, e sereis minhas testemunhas. A Fortaleza sustenta o cristão diante do medo e da adversidade.',
        intention: 'Peço o dom da Fortaleza — para vencer as tentações e perseverar até o fim.',
      },
      {
        day: 5,
        title: 'Espírito de Ciência',
        scripture: 'Sb 7,7',
        meditation:
          'Roguei, e foi-me concedida a prudência; invoquei, e veio a mim o espírito da sabedoria. A Ciência ensina a olhar as criaturas em Deus, sem se prender a elas.',
        intention: 'Peço o dom da Ciência — para reconhecer a mão do Criador em todas as coisas criadas.',
      },
      {
        day: 6,
        title: 'Espírito de Piedade',
        scripture: 'Rm 8,15',
        meditation:
          'Recebestes o Espírito de adoção de filhos, no qual clamamos: Abbá! Pai! A Piedade é o afeto filial que torna a oração respiração da alma.',
        intention: 'Peço o dom da Piedade — para amar a Deus como Pai e servir aos irmãos como filhos seus.',
      },
      {
        day: 7,
        title: 'Espírito de Temor de Deus',
        scripture: 'Sl 111,10',
        meditation:
          'O princípio da sabedoria é o temor do Senhor. Não o medo do escravo, mas o pudor do filho que teme ofender aquele que ama.',
        intention: 'Peço o dom do Temor de Deus — para nunca me apartar de Vós por afeto ao pecado.',
      },
      {
        day: 8,
        title: 'Os Frutos do Espírito',
        scripture: 'Gl 5,22',
        meditation:
          'O fruto do Espírito é: caridade, alegria, paz, paciência, benignidade, bondade, longanimidade, mansidão, fé, modéstia, continência, castidade. Onde há Espírito, há colheita.',
        intention: 'Peço a maturação dos frutos do Espírito na minha vida diária.',
      },
      {
        day: 9,
        title: 'Vinde, Espírito Santo',
        scripture: 'At 2,4',
        meditation:
          'Todos ficaram cheios do Espírito Santo. Pentecostes é o cume desta novena — o Espírito que desce e faz nova toda a Igreja.',
        intention: 'Renovai em mim, Senhor, as maravilhas de Pentecostes.',
      },
    ],
  },
  {
    slug: 'nossa-senhora-perpetuo-socorro',
    title: 'Novena de Nossa Senhora do Perpétuo Socorro',
    latin: 'Novena Beatæ Mariæ Virginis Perpetui Succursus',
    patron: 'Virgem Maria',
    category: 'Virgem Maria',
    summary:
      'Devoção redentorista difundida no mundo inteiro, invoca o auxílio maternal de Maria em todas as necessidades urgentes.',
    opening:
      'Ó Mãe do Perpétuo Socorro, permiti que eu Vos invoque sempre, poderoso nome que é socorro dos vivos e salvação dos moribundos.\n\nMãe puríssima, fazei que eu pronuncie sempre o vosso nome com toda confiança.',
    closing:
      'Ó Maria, sois todo-poderosa junto de vosso Filho, alcançai-nos as graças que Vos pedimos nesta novena, se forem para maior glória de Deus e bem de nossa alma. Amém.',
    finalPrayer:
      'Ó Senhora minha, ó minha Mãe! Eu me ofereço todo a Vós; e em prova de minha devoção, Vos consagro neste dia meus olhos, meus ouvidos, minha boca, meu coração e inteiramente todo o meu ser. Já que sou vosso, ó incomparável Mãe, guardai-me e defendei-me como coisa e propriedade vossa. Amém.',
    days: Array.from({ length: 9 }, (_, i) => {
      const themes = [
        { title: 'Mãe da confiança', text: 'Confio em Vós como filho no colo materno — nada me falta se Vós me guardais.' },
        { title: 'Mãe da misericórdia', text: 'Vossa misericórdia é maior que a minha miséria. Alcançai-me o perdão que peço.' },
        { title: 'Mãe do bom conselho', text: 'Iluminai as decisões que preciso tomar; dai-me a prudência que me falta.' },
        { title: 'Mãe consoladora dos aflitos', text: 'Enxugai as lágrimas de todo coração ferido — em especial deste que hoje Vos suplica.' },
        { title: 'Saúde dos enfermos', text: 'Alcançai a cura àqueles que sofrem no corpo e na alma, se conforme à vontade de Deus.' },
        { title: 'Refúgio dos pecadores', text: 'Sob vosso manto se abrigam os fracos: acolhei-me na hora da tentação.' },
        { title: 'Auxílio dos cristãos', text: 'Fortalecei minha fé nas horas de dúvida e nas provações da vida presente.' },
        { title: 'Rainha da família', text: 'Guardai meus familiares, meus amigos e todos que estão sob minha responsabilidade.' },
        { title: 'Mãe do perpétuo socorro', text: 'Não me abandoneis nunca — em vida, na hora da morte, e no dia do juízo.' },
      ];
      return {
        day: i + 1,
        title: themes[i].title,
        meditation: themes[i].text,
        intention: 'Apresento a Maria a intenção secreta desta novena, confiando no seu poderoso socorro.',
      };
    }),
  },
  {
    slug: 'sao-jose',
    title: 'Novena a São José',
    latin: 'Novena Sancti Ioseph',
    patron: 'São José',
    category: 'Santos',
    summary:
      'Padroeiro da Igreja Universal, guardião de Jesus e Maria, protetor dos trabalhadores e dos moribundos.',
    opening:
      'Ó glorioso São José, esposo de Maria Santíssima, concedei-nos vossa paternal proteção, alcançai-nos a graça que vos pedimos com confiança nesta novena. Assim seja.',
    closing:
      'Lembrai-vos, ó puríssimo esposo da Virgem Maria, meu amável protetor São José, que jamais se ouviu dizer que algum daqueles que recorreram à vossa proteção e imploraram vosso auxílio fosse por vós desamparado. Cheio de confiança, a vós recorro. Amém.',
    finalPrayer:
      'São José, modelo dos que trabalham, obtende-me a graça de trabalhar em espírito de penitência, para expiar meus pecados; de trabalhar conscienciosamente, preferindo o cumprimento do dever ao meu gosto próprio; de trabalhar em ação de graças e alegria, honrando os dons recebidos de Deus. Amém.',
    days: Array.from({ length: 9 }, (_, i) => {
      const themes = [
        { title: 'José, homem justo', text: 'A Escritura vos chama justo. Ensinai-me a viver com retidão simples, sem alarde.' },
        { title: 'José, esposo de Maria', text: 'Guardastes a Virgem com fidelidade e ternura. Sede modelo de todo esposo cristão.' },
        { title: 'José, pai adotivo de Jesus', text: 'A Palavra encarnada Vos chamou pai. Alcançai-me a graça da paternidade espiritual.' },
        { title: 'José, chefe da Sagrada Família', text: 'Vossa casa foi santuário do silêncio e do trabalho. Santificai as casas de todos os que Vos invocam.' },
        { title: 'José, mestre dos operários', text: 'Ensinastes Jesus a serrar e a plainar. Dignificai o trabalho humano que hoje ofereço.' },
        { title: 'José, protetor da Igreja', text: 'Guardai a Igreja peregrina, como guardastes o Menino nas fugas do Egito.' },
        { title: 'José, terror dos demônios', text: 'Vossa presença põe em fuga o inimigo. Defendei-me nas tentações e nos combates.' },
        { title: 'José, padroeiro dos moribundos', text: 'Morrestes nos braços de Jesus e Maria. Alcançai-me a graça de uma boa morte.' },
        { title: 'José, esperança dos enfermos', text: 'Rogai pelos que sofrem no corpo e no espírito, e obtende-lhes consolação.' },
      ];
      return {
        day: i + 1,
        title: themes[i].title,
        meditation: themes[i].text,
        intention: 'Apresento a São José a intenção pela qual faço esta novena.',
      };
    }),
  },
  {
    slug: 'sagrado-coracao',
    title: 'Novena ao Sagrado Coração de Jesus',
    latin: 'Novena Sacratissimi Cordis Iesu',
    patron: 'Sagrado Coração de Jesus',
    category: 'Jesus Cristo',
    summary:
      'Fundada nas revelações a Santa Margarida Maria Alacoque, contempla o Coração de Cristo — fornalha ardente de caridade e refúgio dos pecadores.',
    opening:
      'Ó Sagrado Coração de Jesus, cheio de bondade infinita, humildemente prostrado diante de Vós, venho renovar meu ato de consagração e reparar, pelas manifestações do meu amor, todas as blasfêmias e ingratidões com que sois continuamente ofendido.',
    closing:
      'Doce Coração do meu Jesus, fazei que eu Vos ame cada vez mais. Coração de Jesus, em Vós confio. Amém.',
    finalPrayer:
      'Lembrai-vos, ó dulcíssimo Jesus, que jamais se ouviu dizer que algum daqueles que recorreram à vossa proteção implorando o socorro do vosso Sagrado Coração fosse por Vós abandonado. Animado desta confiança, a Vós recorro. Amém.',
    days: Array.from({ length: 9 }, (_, i) => {
      const themes = [
        { title: 'Coração de Jesus, fonte de vida', text: 'De vosso lado aberto brotou o sangue e a água — sacramentos da Igreja.' },
        { title: 'Coração de Jesus, santuário da justiça', text: 'Ali habita a plenitude da divindade: dai-me sede de retidão.' },
        { title: 'Coração de Jesus, cheio de bondade', text: 'Bondade que não se cansa de perdoar: acolhei este pecador que a Vós recorre.' },
        { title: 'Coração de Jesus, abismo de virtudes', text: 'Modelai meu coração conforme o Vosso — manso e humilde.' },
        { title: 'Coração de Jesus, paciente e misericordioso', text: 'Suportai minhas quedas e me reergueis sempre que caio.' },
        { title: 'Coração de Jesus, propiciação pelos nossos pecados', text: 'Vossa Paixão é o preço da minha salvação. Não seja em vão em mim.' },
        { title: 'Coração de Jesus, nossa paz e reconciliação', text: 'Reconciliai-me com Deus, comigo mesmo e com meus irmãos.' },
        { title: 'Coração de Jesus, salvação dos que em Vós esperam', text: 'Firmai minha esperança nas provações e na hora da morte.' },
        { title: 'Coração de Jesus, delícia de todos os santos', text: 'Concedei-me participar um dia da alegria eterna dos vossos amigos.' },
      ];
      return {
        day: i + 1,
        title: themes[i].title,
        meditation: themes[i].text,
        intention: 'Apresento ao Sagrado Coração a graça pela qual faço esta novena.',
      };
    }),
  },
];

export function getNovenaBySlug(slug: string): Novena | undefined {
  return NOVENAS.find((n) => n.slug === slug);
}
