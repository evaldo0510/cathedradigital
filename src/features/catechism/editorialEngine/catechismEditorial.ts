/**
 * catechismEditorial — camada editorial do Catecismo (Sprint 3).
 *
 * Constituição Editorial 1.0.0, Cap. IX: nenhuma leitura da Cathedra termina
 * em texto cru. Cada capítulo do CIC recebe:
 *
 *   Introdução → Contexto histórico → Contexto doutrinário →
 *   Aplicação espiritual → Leitura complementar → Oração final
 *
 * Dado puro, sem React e sem rotas. O encerramento é entregue no formato
 * aceito por `resolveEditorialClosure` (chave `editorial_closure`), de modo
 * que o Reader V2 consome exatamente o mesmo contrato dos demais módulos.
 */

import type { CatechismLocation } from './catechismStructure';

export interface CatechismFurtherReading {
  /** Kind do Nexus — resolvido por `resolveNexusHref` no consumidor. */
  kind: 'bible_verse' | 'saint' | 'patristic' | 'magisterium_doc' | 'prayer' | 'glossary' | 'liturgy';
  ref: string;
  label: string;
  note?: string;
}

export interface CatechismEditorial {
  /** Abertura editorial — por que este capítulo importa. 1 a 2 frases. */
  introduction: string;
  /** Contexto histórico — de onde nasce esta doutrina. */
  historicalContext: string;
  /** Contexto doutrinário — onde ela se encaixa no todo da fé. */
  doctrinalContext: string;
  /** Aplicação espiritual — o que muda na vida de quem lê. */
  application: string;
  /** Pergunta interior sóbria para o encerramento. */
  reflection: string;
  /** Oração final breve (2 a 4 linhas). */
  prayer: string;
  /** Leitura complementar curada — Escritura, Padres, Magistério, santos. */
  furtherReading: readonly CatechismFurtherReading[];
}

type EditorialSeed = Omit<CatechismEditorial, 'furtherReading'> & {
  furtherReading?: readonly CatechismFurtherReading[];
};

const EDITORIAL: Record<string, EditorialSeed> = {
  prologo: {
    introduction:
      'O Catecismo não começa por definições, mas por um convite: Deus chama o homem à sua própria vida bem-aventurada.',
    historicalContext:
      'Redigido após o Concílio Vaticano II e promulgado por João Paulo II em 1992, o Prólogo retoma a estrutura catequética antiga: fé professada, celebrada, vivida e rezada.',
    doctrinalContext:
      'Estabelece a finalidade de toda catequese — não informar sobre Deus, mas conduzir à comunhão com Ele.',
    application:
      'Ler o Catecismo como quem escuta uma convocação pessoal, não como quem consulta um código.',
    reflection: 'O que espero encontrar aqui: argumentos ou o próprio Deus?',
    prayer:
      'Senhor, que eu não estude a fé de longe.\nDai-me conhecer-Vos amando e amar-Vos conhecendo.\nAmém.',
    furtherReading: [
      { kind: 'bible_verse', ref: 'jo/17/3', label: 'Jo 17,3 — A vida eterna é conhecer-Te' },
      { kind: 'saint', ref: 'agostinho', label: 'Santo Agostinho', note: 'Inquieto está o nosso coração' },
    ],
  },

  'capax-dei': {
    introduction:
      'Antes de qualquer doutrina, o Catecismo afirma uma capacidade: o homem é capaz de Deus.',
    historicalContext:
      'A formulação capax Dei atravessa a tradição desde os Padres gregos e Agostinho, e responde ao ateísmo moderno sem polêmica, pela via do desejo.',
    doctrinalContext:
      'A razão pode conhecer Deus a partir das criaturas; a Revelação, porém, é necessária para conhecê-Lo como Ele é.',
    application:
      'Reconhecer no próprio desassossego não um defeito, mas um vestígio da vocação à comunhão.',
    reflection: 'Que inquietude minha ainda não levei diante de Deus?',
    prayer:
      'Deus, que me criastes para Vós,\nnão deixeis que eu me contente com menos.\nAmém.',
    furtherReading: [
      { kind: 'bible_verse', ref: 'at/17/26', label: 'At 17,26-28 — Nele vivemos e existimos' },
      { kind: 'saint', ref: 'agostinho', label: 'Santo Agostinho', note: 'Confissões I,1' },
    ],
  },

  revelacao: {
    introduction:
      'Deus não é conclusão de um raciocínio: é Alguém que sai ao encontro e fala.',
    historicalContext:
      'O capítulo condensa a Dei Verbum (1965), que superou a oposição entre Escritura e Tradição herdada das controvérsias do século XVI.',
    doctrinalContext:
      'Escritura, Tradição e Magistério formam um só depósito: nenhum subsiste sem os outros.',
    application:
      'Abrir a Escritura como palavra dirigida hoje, e não como documento do passado.',
    reflection: 'Escuto a Palavra ou apenas leio sobre ela?',
    prayer:
      'Falai, Senhor, que o vosso servo escuta.\nAbri-me os ouvidos do coração.\nAmém.',
    furtherReading: [
      { kind: 'bible_verse', ref: 'hb/1/1', label: 'Hb 1,1-2 — Deus falou-nos pelo Filho' },
      { kind: 'magisterium_doc', ref: 'dei-verbum', label: 'Dei Verbum', note: 'Concílio Vaticano II' },
      { kind: 'patristic', ref: 'ireneu', label: 'Santo Irineu', note: 'Contra as heresias' },
    ],
  },

  'resposta-da-fe': {
    introduction:
      'À Palavra de Deus corresponde a obediência da fé — livre, pessoal e eclesial ao mesmo tempo.',
    historicalContext:
      'Creio e Cremos formam um par antigo: o batizado responde em primeira pessoa dentro de uma fé que recebeu da Igreja.',
    doctrinalContext:
      'A fé é dom e ato humano; é necessária à salvação e cresce pela escuta e pela caridade.',
    application:
      'Rezar o Credo devagar uma vez ao dia, como resposta e não como fórmula.',
    reflection: 'Minha fé é minha e, ao mesmo tempo, é da Igreja?',
    prayer:
      'Creio, Senhor; vinde em auxílio da minha pouca fé.\nAmém.',
    furtherReading: [
      { kind: 'bible_verse', ref: 'mc/9/24', label: 'Mc 9,24 — Vem em auxílio da minha falta de fé' },
      { kind: 'prayer', ref: 'credo', label: 'Credo Niceno-Constantinopolitano' },
    ],
  },

  'creio-em-deus-pai': {
    introduction:
      'A fé cristã começa por um Nome revelado e por uma paternidade que precede toda criação.',
    historicalContext:
      'Os Símbolos nascem da liturgia batismal; o de Niceia-Constantinopla (325/381) fixou a fé trinitária contra o arianismo.',
    doctrinalContext:
      'Um só Deus em três Pessoas; a criação é obra livre do amor, e o mal não é criatura de Deus.',
    application:
      'Diante do que não se explica, permanecer na confiança filial em vez de exigir explicação.',
    reflection: 'Trato Deus como Pai ou apenas como Causa?',
    prayer:
      'Pai, criastes-me sem que eu pedisse\ne sustentais-me sem que eu perceba.\nEnsinai-me a confiar.\nAmém.',
    furtherReading: [
      { kind: 'bible_verse', ref: 'gn/1/1', label: 'Gn 1,1-31 — No princípio' },
      { kind: 'bible_verse', ref: 'ex/3/14', label: 'Ex 3,14 — Eu sou Aquele que sou' },
      { kind: 'patristic', ref: 'atanasio', label: 'Santo Atanásio', note: 'A encarnação do Verbo' },
    ],
  },

  'creio-em-jesus-cristo': {
    introduction:
      'O coração do Credo: Deus não enviou uma mensagem, enviou o Filho.',
    historicalContext:
      'Os artigos cristológicos condensam os concílios de Éfeso (431) e Calcedônia (451): verdadeiro Deus e verdadeiro homem, sem confusão nem separação.',
    doctrinalContext:
      'Toda a vida de Cristo é mistério de salvação — encarnação, vida oculta, ministério, paixão, ressurreição e ascensão.',
    application:
      'Contemplar um episódio do Evangelho por vez, deixando que ele interprete a própria vida.',
    reflection: 'Que passo da vida de Cristo fala diretamente à minha hora presente?',
    prayer:
      'Senhor Jesus, verdadeiro Deus e verdadeiro homem,\nfazei-me caminhar onde caminhastes.\nAmém.',
    furtherReading: [
      { kind: 'bible_verse', ref: 'jo/1/14', label: 'Jo 1,14 — O Verbo se fez carne' },
      { kind: 'bible_verse', ref: 'fl/2/6', label: 'Fl 2,6-11 — Esvaziou-se a si mesmo' },
      { kind: 'saint', ref: 'atanasio', label: 'Santo Atanásio' },
    ],
  },

  'creio-no-espirito-santo': {
    introduction:
      'O Espírito não é apêndice do Credo: é quem torna presente a obra de Cristo na Igreja e em cada alma.',
    historicalContext:
      'A profissão do Espírito como Senhor que dá a vida foi fixada em Constantinopla (381), completando a fé trinitária.',
    doctrinalContext:
      'Do Espírito derivam a Igreja, o perdão dos pecados, a ressurreição da carne e a vida eterna — uma única economia de graça.',
    application:
      'Invocar o Espírito antes de decidir, e não apenas depois de errar.',
    reflection: 'Deixo o Espírito conduzir ou apenas peço que confirme o que já decidi?',
    prayer:
      'Vinde, Espírito Santo,\nenchei os corações dos vossos fiéis\ne acendei neles o fogo do vosso amor.\nAmém.',
    furtherReading: [
      { kind: 'bible_verse', ref: 'at/2/1', label: 'At 2,1-11 — Pentecostes' },
      { kind: 'prayer', ref: 'veni-creator', label: 'Veni Creator Spiritus' },
      { kind: 'magisterium_doc', ref: 'lumen-gentium', label: 'Lumen Gentium' },
    ],
  },

  'economia-sacramental': {
    introduction:
      'A liturgia não é cerimônia acrescentada à fé: é a própria obra da Trindade tocando o tempo.',
    historicalContext:
      'A Parte II recolhe a Sacrosanctum Concilium (1963) e o movimento litúrgico que redescobriu o mistério pascal como centro.',
    doctrinalContext:
      'Os sacramentos são de Cristo e da Igreja; agem ex opere operato, mas frutificam conforme a disposição de quem os recebe.',
    application:
      'Chegar à celebração alguns minutos antes, em silêncio, para receber e não apenas assistir.',
    reflection: 'Participo do mistério ou observo um rito?',
    prayer:
      'Senhor, que o que celebro com os lábios\neu creia no coração e viva nas obras.\nAmém.',
    furtherReading: [
      { kind: 'magisterium_doc', ref: 'sacrosanctum-concilium', label: 'Sacrosanctum Concilium' },
      { kind: 'liturgy', ref: 'hoje', label: 'Liturgia de hoje' },
    ],
  },

  'celebracao-sacramental': {
    introduction:
      'Quem celebra, como, quando e onde: a liturgia tem carne, gesto, tempo e lugar.',
    historicalContext:
      'A diversidade de ritos — latino, bizantino, copta e outros — é herança viva das Igrejas apostólicas.',
    doctrinalContext:
      'A unidade do mistério pascal não exige uniformidade de rito; exige comunhão.',
    application:
      'Reconhecer no canto, no silêncio e no gesto uma linguagem que também ensina.',
    reflection: 'O que meu corpo reza quando estou na liturgia?',
    prayer:
      'Senhor, ensinai-me a rezar também com os gestos,\npara que nada em mim fique de fora da vossa presença.\nAmém.',
    furtherReading: [
      { kind: 'liturgy', ref: 'hoje', label: 'Liturgia de hoje' },
      { kind: 'magisterium_doc', ref: 'sacrosanctum-concilium', label: 'Sacrosanctum Concilium' },
    ],
  },

  'iniciacao-crista': {
    introduction:
      'Batismo, Confirmação e Eucaristia não são três eventos isolados: são um único nascimento que se completa.',
    historicalContext:
      'Na Igreja antiga os três sacramentos eram conferidos na mesma vigília pascal — herança ainda visível no catecumenato de adultos.',
    doctrinalContext:
      'A Eucaristia é fonte e ápice de toda a vida cristã; nela o sacrifício da cruz se torna presente.',
    application:
      'Recordar a data do próprio Batismo e agradecê-la como aniversário de vida.',
    reflection: 'Vivo como quem foi mergulhado na morte e na ressurreição de Cristo?',
    prayer:
      'Senhor, que a graça recebida no Batismo\nnão fique adormecida em mim.\nAmém.',
    furtherReading: [
      { kind: 'bible_verse', ref: 'rm/6/3', label: 'Rm 6,3-4 — Batizados na sua morte' },
      { kind: 'bible_verse', ref: 'jo/6/51', label: 'Jo 6,51 — Eu sou o pão vivo' },
      { kind: 'saint', ref: 'ambrosio', label: 'Santo Ambrósio', note: 'Sobre os mistérios' },
    ],
  },

  'sacramentos-de-cura': {
    introduction:
      'O batizado ainda adoece e ainda peca — e por isso Cristo continua curando por sinais concretos.',
    historicalContext:
      'A prática penitencial passou da forma pública e única, na Antiguidade, à confissão reiterável difundida pelos monges irlandeses.',
    doctrinalContext:
      'A conversão é obra da graça; o sacramento reconcilia com Deus e também com a Igreja.',
    application:
      'Marcar a próxima confissão antes de sair desta leitura.',
    reflection: 'Que ferida minha ainda evito levar ao confessionário?',
    prayer:
      'Senhor, tende compaixão de mim, pecador.\nCurai o que em mim resiste à vossa misericórdia.\nAmém.',
    furtherReading: [
      { kind: 'bible_verse', ref: 'lc/15/11', label: 'Lc 15,11-32 — O filho pródigo' },
      { kind: 'bible_verse', ref: 'tg/5/14', label: 'Tg 5,14-15 — Chame os presbíteros' },
    ],
  },

  'sacramentos-comunhao': {
    introduction:
      'Ordem e Matrimônio consagram pessoas para a salvação dos outros.',
    historicalContext:
      'A doutrina sobre o sacramento da Ordem foi precisada em Trento e retomada pela Lumen Gentium na tríplice missão de ensinar, santificar e governar.',
    doctrinalContext:
      'Ambos os sacramentos são ordenados à comunhão: quem os recebe já não vive para si.',
    application:
      'Rezar hoje, nominalmente, por um sacerdote e por um casal.',
    reflection: 'Para quem a minha vocação existe?',
    prayer:
      'Senhor, dai à vossa Igreja pastores segundo o vosso coração\ne famílias que sejam sinal do vosso amor.\nAmém.',
    furtherReading: [
      { kind: 'bible_verse', ref: 'ef/5/25', label: 'Ef 5,25-32 — Este mistério é grande' },
      { kind: 'magisterium_doc', ref: 'lumen-gentium', label: 'Lumen Gentium' },
    ],
  },

  sacramentais: {
    introduction:
      'Bênçãos, exéquias e sinais menores preparam a alma para a graça dos sacramentos.',
    historicalContext:
      'Os sacramentais acompanham a vida cristã desde a Antiguidade: bênção da casa, do pão, dos que partem.',
    doctrinalContext:
      'Não conferem a graça como os sacramentos, mas dispõem a recebê-la e santificam as circunstâncias.',
    application:
      'Abençoar a própria casa e a mesa, retomando um gesto simples e antigo.',
    reflection: 'Que parte da minha vida cotidiana ainda não entreguei a Deus?',
    prayer:
      'Abençoai, Senhor, esta casa e os que nela vivem.\nAmém.',
    furtherReading: [
      { kind: 'liturgy', ref: 'hoje', label: 'Liturgia de hoje' },
    ],
  },

  'dignidade-humana': {
    introduction:
      'A moral católica não começa por proibições, mas por uma afirmação: o homem é imagem de Deus.',
    historicalContext:
      'A Parte III recolhe a Gaudium et Spes (1965) e a tradição tomista sobre a beatitude como fim último do agir humano.',
    doctrinalContext:
      'Liberdade, consciência, virtudes e pecado só se compreendem à luz da vocação à bem-aventurança.',
    application:
      'Examinar uma decisão recente pelos três critérios: objeto, intenção e circunstâncias.',
    reflection: 'Escolho o que é bom ou apenas o que é permitido?',
    prayer:
      'Senhor, formai em mim uma consciência reta,\nque não confunda desejo com verdade.\nAmém.',
    furtherReading: [
      { kind: 'bible_verse', ref: 'mt/5/1', label: 'Mt 5,1-12 — As bem-aventuranças' },
      { kind: 'saint', ref: 'tomas-de-aquino', label: 'São Tomás de Aquino' },
      { kind: 'magisterium_doc', ref: 'gaudium-et-spes', label: 'Gaudium et Spes' },
    ],
  },

  'comunidade-humana': {
    introduction:
      'Ninguém se salva sozinho — e ninguém peca sozinho.',
    historicalContext:
      'A doutrina social moderna nasce com a Rerum Novarum (1891) e amadurece ao longo de um século de encíclicas.',
    doctrinalContext:
      'Bem comum, subsidiariedade e solidariedade não são política: são consequências da dignidade da pessoa.',
    application:
      'Identificar uma estrutura concreta da própria rotina que fere alguém, e mudá-la.',
    reflection: 'Minha conversão pessoal alcança a vida em comum?',
    prayer:
      'Senhor, que eu não separe o amor a Vós\ndo cuidado com quem está ao meu lado.\nAmém.',
    furtherReading: [
      { kind: 'bible_verse', ref: 'mt/25/31', label: 'Mt 25,31-46 — A mim o fizestes' },
      { kind: 'magisterium_doc', ref: 'rerum-novarum', label: 'Rerum Novarum' },
    ],
  },

  'lei-e-graca': {
    introduction:
      'A lei mostra o caminho; só a graça dá as forças para percorrê-lo.',
    historicalContext:
      'O tema atravessa Agostinho contra os pelagianos e Trento sobre a justificação, retomado no diálogo ecumênico contemporâneo.',
    doctrinalContext:
      'Lei natural, Lei antiga e Lei nova formam uma pedagogia única; a Lei nova é a graça do Espírito Santo.',
    application:
      'Pedir a graça antes de prometer o esforço.',
    reflection: 'Tento ser bom por minhas forças ou pela graça recebida?',
    prayer:
      'Dai-me, Senhor, o que ordenais,\ne ordenai o que quiserdes.\nAmém.',
    furtherReading: [
      { kind: 'bible_verse', ref: 'rm/8/1', label: 'Rm 8,1-4 — A lei do Espírito da vida' },
      { kind: 'saint', ref: 'agostinho', label: 'Santo Agostinho', note: 'Doctor Gratiae' },
    ],
  },

  'primeira-tabua': {
    introduction:
      'Os três primeiros mandamentos ordenam a relação com Deus — e por isso ordenam todo o resto.',
    historicalContext:
      'O Decálogo é dado no Sinai e relido por Cristo no Sermão da Montanha, que o leva à sua plenitude interior.',
    doctrinalContext:
      'Adoração, respeito ao Nome e santificação do dia do Senhor sustentam a vida teologal.',
    application:
      'Reservar o domingo — inteiro, não o resto dele — para Deus, o descanso e a família.',
    reflection: 'O que, de fato, ocupa o lugar de Deus na minha semana?',
    prayer:
      'Senhor, sede o primeiro no meu tempo,\ne não apenas no que dele sobra.\nAmém.',
    furtherReading: [
      { kind: 'bible_verse', ref: 'ex/20/1', label: 'Ex 20,1-17 — O Decálogo' },
      { kind: 'bible_verse', ref: 'mt/22/37', label: 'Mt 22,37-40 — O maior mandamento' },
    ],
  },

  'segunda-tabua': {
    introduction:
      'Do quarto ao décimo mandamento, o amor a Deus se verifica no trato concreto com o próximo.',
    historicalContext:
      'A ordem dos mandamentos que a catequese ocidental usa vem de Agostinho, e organiza os deveres da vida familiar, social e interior.',
    doctrinalContext:
      'A vida, a fidelidade, os bens, a verdade e o desejo pertencem ao mesmo tecido moral.',
    application:
      'Escolher hoje uma reparação concreta: uma verdade dita, uma dívida paga, um perdão pedido.',
    reflection: 'Em que ponto meu amor ao próximo ainda é apenas intenção?',
    prayer:
      'Senhor, dai-me amar de modo concreto,\ncomo Vós me amais.\nAmém.',
    furtherReading: [
      { kind: 'bible_verse', ref: 'lc/10/25', label: 'Lc 10,25-37 — O bom samaritano' },
      { kind: 'bible_verse', ref: '1cor/13/1', label: '1Cor 13 — O hino da caridade' },
    ],
  },

  'revelacao-da-oracao': {
    introduction:
      'A oração não foi inventada pelo homem: foi revelada, e sua história tem nomes próprios.',
    historicalContext:
      'De Abraão a Maria, o Catecismo lê a Escritura como uma escola de oração que culmina em Cristo.',
    doctrinalContext:
      'Orar é responder — é sempre Deus quem chama primeiro.',
    application:
      'Rezar hoje um salmo inteiro, sem pressa, como quem aprende.',
    reflection: 'Minha oração nasce de necessidade ou de aliança?',
    prayer:
      'Senhor, ensinai-nos a orar.\nAmém.',
    furtherReading: [
      { kind: 'bible_verse', ref: 'lc/11/1', label: 'Lc 11,1 — Senhor, ensina-nos a orar' },
      { kind: 'prayer', ref: 'liturgia-das-horas', label: 'Liturgia das Horas' },
    ],
  },

  'tradicao-da-oracao': {
    introduction:
      'Ninguém reza do zero: recebe-se um caminho, fontes e mestres.',
    historicalContext:
      'As grandes escolas de espiritualidade — monástica, carmelitana, inaciana — são variações de uma mesma tradição orante.',
    doctrinalContext:
      'Reza-se ao Pai, por Cristo, no Espírito Santo, na comunhão dos santos.',
    application:
      'Escolher um mestre de oração e permanecer com ele por um mês.',
    reflection: 'Quem me ensina a rezar?',
    prayer:
      'Pai, por Cristo, no Espírito,\nrecebei a oração pobre que sei fazer.\nAmém.',
    furtherReading: [
      { kind: 'saint', ref: 'teresa-de-avila', label: 'Santa Teresa de Ávila' },
      { kind: 'prayer', ref: 'rosario', label: 'Santo Rosário' },
    ],
  },

  'vida-de-oracao': {
    introduction:
      'Oração vocal, meditação e contemplação não são graus de mérito: são modos de permanecer.',
    historicalContext:
      'A distinção clássica das três expressões vem da tradição monástica e foi consagrada pelos doutores carmelitas.',
    doctrinalContext:
      'O combate da oração — distração, secura, desânimo — pertence à vida espiritual normal.',
    application:
      'Fixar uma hora do dia e mantê-la, mesmo sem sentir nada.',
    reflection: 'Abandono a oração quando ela deixa de consolar?',
    prayer:
      'Senhor, quando eu nada sentir,\ndai-me a fidelidade de permanecer.\nAmém.',
    furtherReading: [
      { kind: 'saint', ref: 'teresa-de-lisieux', label: 'Santa Teresa de Lisieux' },
      { kind: 'prayer', ref: 'adoracao', label: 'Adoração eucarística' },
    ],
  },

  'pai-nosso': {
    introduction:
      'O Catecismo termina onde a fé respira: na oração que o próprio Senhor ensinou.',
    historicalContext:
      'Tertuliano chamou o Pai Nosso de resumo de todo o Evangelho; desde a Antiguidade era entregue aos catecúmenos antes do Batismo.',
    doctrinalContext:
      'As sete petições resumem toda a esperança cristã, do Nome santificado à libertação do mal.',
    application:
      'Rezar o Pai Nosso uma vez ao dia petição por petição, detendo-se em cada uma.',
    reflection: 'Ouso realmente chamar Deus de Pai?',
    prayer:
      'Pai nosso que estais nos céus,\nsantificado seja o vosso nome.\nAmém.',
    furtherReading: [
      { kind: 'bible_verse', ref: 'mt/6/9', label: 'Mt 6,9-13 — O Pai Nosso' },
      { kind: 'prayer', ref: 'pai-nosso', label: 'Pai Nosso' },
      { kind: 'patristic', ref: 'cipriano', label: 'São Cipriano', note: 'Sobre a oração do Senhor' },
    ],
  },
};

/** Fallback editorial sóbrio — nunca deixa um § sem moldura de leitura. */
function derive(location: CatechismLocation): CatechismEditorial {
  return {
    introduction: `${location.theme}. Este trecho pertence a ${location.chapter}, dentro de ${location.partTitle}.`,
    historicalContext:
      'O Catecismo recolhe aqui a doutrina professada pela Igreja ao longo dos séculos, tal como fixada nos concílios e na liturgia.',
    doctrinalContext: `Leia este parágrafo dentro do fio de ${location.section} — nenhum artigo do Catecismo se compreende isolado.`,
    application: 'Reter uma frase deste trecho e levá-la à oração de hoje.',
    reflection: 'O que este texto pede de mim, concretamente, nas próximas horas?',
    prayer: 'Senhor, que a verdade que professo\nse torne vida em mim.\nAmém.',
    furtherReading: [],
  };
}

/** Resolve a moldura editorial de um parágrafo, sempre com conteúdo. */
export function resolveCatechismEditorial(location: CatechismLocation): CatechismEditorial {
  const seed = EDITORIAL[location.editorialKey];
  if (!seed) return derive(location);
  return { ...seed, furtherReading: seed.furtherReading ?? [] };
}

/**
 * Monta o objeto `editorial_closure` no contrato aceito por
 * `resolveEditorialClosure`, mantendo o Catecismo idêntico aos demais módulos.
 */
export function buildCatechismClosure(
  location: CatechismLocation,
  editorial: CatechismEditorial,
  next?: { label: string; href: string; kicker?: string },
): { editorial_closure: Record<string, unknown> } {
  return {
    editorial_closure: {
      reflection: editorial.reflection,
      application: editorial.application,
      prayer: editorial.prayer,
      next,
      nexus: editorial.furtherReading.slice(0, 3).map((r) => ({
        kind: r.kind,
        ref: r.ref,
        label: r.label,
        note: r.note,
      })),
      source: 'cathedra-editorial',
    },
  };
}
