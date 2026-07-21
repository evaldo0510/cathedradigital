/**
 * viaSacraStations — dados editoriais das 14 estações da Via Sacra.
 *
 * Cada estação carrega, além do enunciado tradicional, camadas contemplativas
 * do padrão Logos 2030: meditação alongada (logos), Padres da Igreja, referência
 * do Catecismo, oração final, fruto espiritual e ação concreta para o dia.
 *
 * O conteúdo é 100% editorial e curado, sem dependência de IA em runtime.
 */

export interface ViaSacraFather {
  /** Nome do Padre / Doutor da Igreja. */
  author: string;
  /** Citação textual, curta e contemplativa. */
  quote: string;
  /** Obra ou contexto (opcional). */
  source?: string;
}

export interface ViaSacraStation {
  num: number;
  title: string;
  /** Referência bíblica canônica (ex.: "Mt 27,22-26"). */
  scripture: string;
  /** Passagem bíblica expandida (2-4 linhas), para leitura contemplativa. */
  biblicalPassage: string;
  /** Meditação clássica curta (a antiga meditação — mantida). */
  meditation: string;
  /** Meditação expandida "Logos" (5-8 linhas, teológica e existencial). */
  logosMeditation: string;
  /** Convite de contemplação (2-3 frases) antes do silêncio guiado. */
  contemplationInvitation: string[];
  /** Padre(s) da Igreja associados à estação. */
  fathers: ViaSacraFather[];
  /** Referência ao Catecismo (número + tema curto). */
  catechism: { ref: string; theme: string };
  /** Oração tradicional final da estação. */
  prayer: string;
  /** Fruto espiritual da estação (virtude a pedir). */
  fruit: string;
  /** Ação concreta para o dia (gesto encarnado). */
  action: string;
}

export const VIA_SACRA_STATIONS: ViaSacraStation[] = [
  {
    num: 1,
    title: 'Jesus é condenado à morte',
    scripture: 'Mt 27,22-26',
    biblicalPassage: 'Pilatos lhes disse: "Que farei então de Jesus, chamado o Cristo?" Todos responderam: "Seja crucificado!" [...] Então lhes soltou Barrabás e, mandando açoitar Jesus, entregou-o para ser crucificado.',
    meditation: 'Pilatos lava as mãos. O Inocente é entregue à morte por nossos pecados. Quantas vezes condenamos o próximo com nossos julgamentos?',
    logosMeditation: 'Diante do Verbo silencioso, o poder do mundo se revela covarde. Pilatos representa toda a humanidade que prefere a paz aparente à verdade que exige. Ao lavar as mãos, ele inaugura o gesto de todos os que, sabendo o bem, escolhem o silêncio cúmplice. Cristo aceita a sentença injusta porque veio para revelar que o Reino não se defende com espada, mas se doa com amor.',
    contemplationInvitation: [
      'Escute o silêncio de Cristo diante da acusação.',
      'Reconheça em Pilatos a sua própria tentação de omissão.',
      'Deixe que o Inocente condenado o purifique dos seus juízos.',
    ],
    fathers: [
      { author: 'Santo Agostinho', quote: 'O juiz de todos é julgado; o Verbo eterno se cala para que a Verdade fale mais alto do que as palavras.', source: 'Sermão 218' },
      { author: 'São João Crisóstomo', quote: 'Nada há de mais estranho do que ver a Justiça sofrer condenação; e nada de mais salutar, pois foi assim que a injustiça foi vencida.', source: 'Homilia sobre Mateus, 86' },
    ],
    catechism: { ref: 'CIC 596-598', theme: 'Os responsáveis pela morte de Jesus' },
    prayer: 'Senhor Jesus, ajudai-me a nunca condenar injustamente o meu próximo, mas a aceitar com humildade as provações da vida.',
    fruit: 'Espírito de justiça e coragem para não se calar diante do mal.',
    action: 'Hoje, absterei-me de todo juízo temerário sobre alguém.',
  },
  {
    num: 2,
    title: 'Jesus carrega a Cruz',
    scripture: 'Jo 19,17',
    biblicalPassage: 'E ele, carregando a sua Cruz, saiu para o lugar chamado Calvário, em hebraico Gólgota.',
    meditation: 'O peso da Cruz é o peso de todos os pecados da humanidade. Jesus a abraça com amor. Cada sofrimento unido a Ele se torna redentor.',
    logosMeditation: 'A Cruz não é imposta a Cristo: é abraçada. No lenho colocam-se todos os pesos do mundo — as guerras, os abandonos, as doenças, os pecados ocultos. Ao carregá-la voluntariamente, o Filho de Deus transforma o instrumento da maldição no altar da nova aliança. Aqui aprendemos que amar é sustentar, sem murmurar, o peso do outro.',
    contemplationInvitation: [
      'Veja Cristo abraçar o madeiro que traz o seu nome.',
      'Reconheça qual cruz hoje pesa mais sobre você.',
      'Peça a graça de carregá-la em silêncio, unida à d’Ele.',
    ],
    fathers: [
      { author: 'Santo Andrade de Creta', quote: 'Ó Cruz preciosa, que trazes o corpo do meu Senhor: por ti a morte foi vencida e a vida restituída.', source: 'Homilia sobre a Exaltação da Cruz' },
      { author: 'São Cirilo de Jerusalém', quote: 'Ele carregou o madeiro para que carregássemos com Ele a nossa própria cruz, sem desespero, mas com esperança.', source: 'Catequese XIII' },
    ],
    catechism: { ref: 'CIC 1505', theme: 'Cristo carrega nossas fraquezas e enfermidades' },
    prayer: 'Senhor, dai-me forças para carregar minha cruz de cada dia, unindo meus sofrimentos aos Vossos.',
    fruit: 'Paciência interior nas provações cotidianas.',
    action: 'Oferecerei o esforço mais duro do dia em silêncio, unido à Cruz.',
  },
  {
    num: 3,
    title: 'Jesus cai pela primeira vez',
    scripture: 'Is 53,4-6',
    biblicalPassage: 'Eram os nossos sofrimentos que ele levava, e as nossas dores que carregava. [...] O Senhor fez cair sobre ele a iniquidade de todos nós.',
    meditation: 'A fraqueza humana de Cristo revela a profundidade de Sua kenosis. Ele cai para nos ensinar a levantar.',
    logosMeditation: 'A primeira queda mostra que o Verbo assumiu integralmente a natureza humana — inclusive a fraqueza física. Ele cai não por fingimento, mas porque quis descer até o extremo da fragilidade. Cada uma das nossas quedas encontra na sua um sentido: nenhuma é definitiva quando aceitamos a mão que se estende do Calvário.',
    contemplationInvitation: [
      'Contemple o rosto do Salvador contra o chão de pedra.',
      'Não desvie o olhar da sua própria fragilidade.',
      'Peça a graça de se levantar cada vez que cair.',
    ],
    fathers: [
      { author: 'São Leão Magno', quote: 'O que estava caído em Adão, o Senhor levantou-o em si mesmo; e caindo, quis nos ensinar a levantar.', source: 'Sermão 63' },
      { author: 'São Bernardo de Claraval', quote: 'Nenhuma queda é mortal onde ainda existe o desejo de levantar. Cristo caiu para tornar a nossa queda medicinal.', source: 'Sobre a Ascensão do Senhor' },
    ],
    catechism: { ref: 'CIC 612-613', theme: 'A agonia de Getsêmani e a obediência até a morte' },
    prayer: 'Senhor, quando eu cair em pecado, dai-me a graça de me levantar arrependido e confiante em Vossa misericórdia.',
    fruit: 'Humildade diante das próprias limitações.',
    action: 'Ao cair em fraqueza hoje, farei imediatamente um ato de contrição.',
  },
  {
    num: 4,
    title: 'Jesus encontra Sua Mãe',
    scripture: 'Lc 2,34-35',
    biblicalPassage: '"Este menino está posto para queda e ressurgimento de muitos em Israel [...] e uma espada traspassará a tua própria alma."',
    meditation: 'A espada de dor atravessa o Coração Imaculado de Maria. Mãe e Filho unidos no sacrifício redentor.',
    logosMeditation: 'No cruzamento dos olhares entre Jesus e Maria concentra-se toda a compaixão do universo. Nenhuma palavra é dita — e no silêncio se cumpre a profecia de Simeão. Maria não impede, não lamenta em voz alta: oferece. Nesse fiat prolongado do Calvário, ela se torna Mãe de todos os que sofrem.',
    contemplationInvitation: [
      'Detenha-se no olhar entre Jesus e Maria.',
      'Note como o amor verdadeiro suporta sem impedir o sacrifício.',
      'Peça a Nossa Senhora um coração compassivo como o dela.',
    ],
    fathers: [
      { author: 'São Bernardo', quote: 'Ó verdadeiramente mais que mártir, cuja alma foi traspassada pela dor mais aguda do que qualquer dor corporal.', source: 'Sermão para o dia da Assunção' },
      { author: 'Santo Afonso de Ligório', quote: 'Todos os sofrimentos de Maria eram um só sofrimento com os de Jesus; ela padecia no coração o que Ele padecia no corpo.', source: 'As Glórias de Maria' },
    ],
    catechism: { ref: 'CIC 964', theme: 'Maria associada ao mistério do Filho' },
    prayer: 'Maria Santíssima, concedei-me a graça de compartilhar vossa compaixão diante dos sofrimentos de Jesus.',
    fruit: 'Compaixão silenciosa diante do sofrimento alheio.',
    action: 'Ligarei ou visitarei alguém que hoje precisa de uma presença.',
  },
  {
    num: 5,
    title: 'Simão Cireneu ajuda Jesus',
    scripture: 'Mc 15,21',
    biblicalPassage: 'Obrigaram um transeunte, Simão de Cirene, pai de Alexandre e de Rufo, que voltava do campo, a levar a Cruz de Jesus.',
    meditation: 'Simão é obrigado a ajudar, mas descobre a graça nesse serviço. Somos chamados a ajudar Cristo nos que sofrem.',
    logosMeditation: 'O convite à cruz raramente começa como escolha; começa como interrupção. Simão volta do trabalho, cansado, e é arrancado da sua rotina. O que parecia constrangimento tornou-se batismo: sua família se fez cristã, seus filhos são nomeados no Evangelho. Cada cruz imprevista que carregamos pelo outro pode ser o início oculto da nossa santificação.',
    contemplationInvitation: [
      'Reconheça as cruzes que a vida lhe impõe sem escolha.',
      'Recuse a autopiedade; abrace o dever presente.',
      'Peça o espírito de serviço escondido.',
    ],
    fathers: [
      { author: 'Orígenes', quote: 'Simão levou a Cruz porque também nós devemos levá-la; ninguém segue Cristo sem carregar o mesmo lenho.', source: 'Comentário a Mateus' },
      { author: 'São Josemaria Escrivá', quote: 'Não recuses jamais a cruz de cada dia: escondida nela está a grandeza de Deus.', source: 'Caminho' },
    ],
    catechism: { ref: 'CIC 618', theme: 'Nossa participação no sacrifício de Cristo' },
    prayer: 'Senhor, dai-me um coração generoso para ajudar os que sofrem, vendo em cada um o Vosso rosto.',
    fruit: 'Prontidão silenciosa para servir sem ser pedido.',
    action: 'Assumirei uma tarefa que ninguém quer fazer, sem reclamar.',
  },
  {
    num: 6,
    title: 'Verônica enxuga o rosto de Jesus',
    scripture: 'Is 53,2-3',
    biblicalPassage: 'Não tinha beleza nem esplendor para atrair os nossos olhares [...] homem das dores, familiarizado com o sofrimento.',
    meditation: 'Um gesto de coragem e compaixão. O rosto desfigurado de Cristo se imprime no véu. A face de Deus se revela no sofrimento.',
    logosMeditation: 'Enquanto todos afastam os olhos do rosto desfigurado, uma mulher se aproxima com um véu. Não impede a paixão, não muda o desfecho — apenas oferece um gesto. E Cristo grava para sempre nele a sua face. Deus deixa impresso o seu rosto em cada gesto de ternura oferecido aos que ninguém mais olha.',
    contemplationInvitation: [
      'Imagine a coragem daquele véu erguido no meio da multidão hostil.',
      'Pergunte-se: em que rostos hoje Cristo espera o meu véu?',
      'Contemple: quando amamos, o Senhor imprime nele o próprio rosto.',
    ],
    fathers: [
      { author: 'São João Paulo II', quote: 'Verônica é o gesto do amor que não teme aproximar-se do rosto desfigurado do irmão que sofre.', source: 'Via Sacra de 2000' },
      { author: 'Tertuliano', quote: 'Deus vela seu rosto sob a fealdade da Paixão para que o reconheçamos em toda face marcada pelo sofrimento.', source: 'Contra Marcião III' },
    ],
    catechism: { ref: 'CIC 476-477', theme: 'A face de Cristo, ícone do Pai' },
    prayer: 'Senhor, dai-me a coragem de Verônica para socorrer os que sofrem, mesmo quando o mundo se cala.',
    fruit: 'Coragem discreta para consolar quem sofre em público.',
    action: 'Direi hoje uma palavra de conforto a alguém socialmente ignorado.',
  },
  {
    num: 7,
    title: 'Jesus cai pela segunda vez',
    scripture: 'Sl 22,7-8',
    biblicalPassage: 'Eu sou um verme, e não um homem; opróbrio dos homens, desprezo do povo. Todos os que me veem escarnecem de mim.',
    meditation: 'A segunda queda revela a persistência do pecado humano. Mas Cristo continua caminhando por amor a nós.',
    logosMeditation: 'A segunda queda é a mais dura, porque diz da recaída. Não basta cair uma vez: a natureza ferida volta ao chão. Cristo aceita cair de novo, para que compreendamos que a santidade não é ausência de quedas, mas a fidelidade obstinada de se levantar. A Paixão continua, e Ele continua com ela.',
    contemplationInvitation: [
      'Aceite, sem envergonhar-se, o rosto das suas recaídas.',
      'Contemple o Senhor que se ergue novamente por amor.',
      'Peça constância na luta espiritual.',
    ],
    fathers: [
      { author: 'São Gregório Magno', quote: 'Não é grande cair, pois somos humanos; mas é grande erguer-se sempre, pois esta é a força da graça.', source: 'Moralia in Job' },
      { author: 'Santa Catarina de Sena', quote: 'Não é a queda que ofende Deus, mas a permanência no chão por falta de confiança.', source: 'Diálogo' },
    ],
    catechism: { ref: 'CIC 1439', theme: 'A conversão contínua do cristão' },
    prayer: 'Senhor, nas minhas recaídas, não permitais que eu desespere, mas que confie sempre em Vossa graça.',
    fruit: 'Perseverança sem desânimo diante das recaídas.',
    action: 'Retomarei hoje um compromisso espiritual que havia abandonado.',
  },
  {
    num: 8,
    title: 'Jesus consola as mulheres de Jerusalém',
    scripture: 'Lc 23,27-31',
    biblicalPassage: '"Filhas de Jerusalém, não choreis por mim; chorai antes por vós mesmas e por vossos filhos."',
    meditation: 'Mesmo em Sua agonia, Jesus pensa nos outros. "Não choreis por mim, chorai por vós e por vossos filhos."',
    logosMeditation: 'Em pleno tormento, Jesus interrompe o próprio caminho para falar às mulheres. A sua palavra não busca compaixão: convida à conversão. O verdadeiro luto cristão não é sobre a dor dos outros, mas sobre o pecado que ainda habita em nós. Chorar por Cristo sem chorar pelos próprios pecados é lágrima estéril.',
    contemplationInvitation: [
      'Ouça o Senhor lhe dirigir estas mesmas palavras.',
      'Distinga a emoção da conversão verdadeira.',
      'Deixe brotar o dom das lágrimas pelos próprios pecados.',
    ],
    fathers: [
      { author: 'Santo Efrém', quote: 'Não são as lágrimas do sentimento que salvam, mas as lágrimas da penitência que lavam a alma.', source: 'Hinos sobre a Igreja' },
      { author: 'São Bernardo', quote: 'Chorai vossos pecados, não a Paixão; pois vossa lágrima o consola mais do que qualquer compaixão sensível.', source: 'Sermões sobre a Quaresma' },
    ],
    catechism: { ref: 'CIC 1431', theme: 'A contrição do coração' },
    prayer: 'Senhor, dai-me a graça de chorar sinceramente por meus pecados e de consolar os que sofrem.',
    fruit: 'Dom das lágrimas — contrição verdadeira.',
    action: 'Farei hoje um exame de consciência mais atento à noite.',
  },
  {
    num: 9,
    title: 'Jesus cai pela terceira vez',
    scripture: 'Lm 3,27-32',
    biblicalPassage: 'É bom para o homem carregar o jugo desde a juventude. [...] Pois o Senhor não rejeita para sempre.',
    meditation: 'A terceira queda mostra o esgotamento total. Cristo desce ao abismo de nossa fraqueza para nos elevar.',
    logosMeditation: 'A terceira queda é a queda quase sem forças. Cristo desce ao ponto mais baixo — não porque falhou, mas porque quis alcançar quem já não crê poder levantar-se. Aqui o Verbo toca o fundo do abismo humano: o cansaço extremo, a solidão espiritual, o sentimento de derrota. E, mesmo assim, se levanta. Nenhum abismo humano é mais fundo do que a sua misericórdia.',
    contemplationInvitation: [
      'Não esconda do Senhor o seu cansaço espiritual.',
      'Compreenda: Ele caiu até onde você caiu.',
      'Peça a graça de recomeçar mais uma vez.',
    ],
    fathers: [
      { author: 'São João Cassiano', quote: 'O demônio tenta convencer-nos que já é tarde; mas o Senhor cai três vezes para nos dizer que nunca é tarde.', source: 'Colações' },
      { author: 'Santa Teresa de Ávila', quote: 'Não vos assusteis das quedas: assusta-vos apenas de permanecer caídos como se Deus não fosse fiel.', source: 'Caminho de Perfeição' },
    ],
    catechism: { ref: 'CIC 1848', theme: 'A misericórdia infinita de Deus' },
    prayer: 'Senhor, quando eu estiver no limite das minhas forças, sustentai-me com Vossa graça.',
    fruit: 'Confiança absoluta na misericórdia divina.',
    action: 'Ao esgotar-me hoje, farei uma breve oração de confiança em vez de reclamar.',
  },
  {
    num: 10,
    title: 'Jesus é despojado de Suas vestes',
    scripture: 'Sl 22,19',
    biblicalPassage: 'Repartem entre si as minhas vestes e sobre a minha túnica lançam sortes.',
    meditation: 'Despojado de tudo, Cristo revela que nossa dignidade não vem das aparências, mas do amor de Deus.',
    logosMeditation: 'A nudez do Calvário é a nudez do Éden invertida: o novo Adão devolve, no despojamento, aquilo que o primeiro perdeu ao querer possuir. Cristo se desnuda para revestir a humanidade de dignidade nova. Também nós somos chamados a esse despojamento interior: soltar as vestes da vaidade, da posse, do controle — para vestir apenas a caridade.',
    contemplationInvitation: [
      'Contemple o Verbo despojado de tudo, exceto do amor.',
      'Identifique uma "veste" interior a que ainda se apega.',
      'Peça a liberdade dos verdadeiros pobres de espírito.',
    ],
    fathers: [
      { author: 'São Francisco de Assis', quote: 'Nu segui a Cristo nu na Cruz; pois só quem se despoja de tudo pode ser revestido de Deus.', source: 'Legenda Maior' },
      { author: 'Santo Ambrósio', quote: 'Aquele que reveste a criação com beleza é agora despido, para que aprendêssemos que a verdadeira vestimenta é a graça.', source: 'De Officiis' },
    ],
    catechism: { ref: 'CIC 2544', theme: 'Pobreza de coração e desapego' },
    prayer: 'Senhor, despojai-me de todo apego desordenado e revesti-me da Vossa caridade.',
    fruit: 'Desapego interior das aparências.',
    action: 'Doarei hoje algo meu que ainda tenha valor e utilidade.',
  },
  {
    num: 11,
    title: 'Jesus é pregado na Cruz',
    scripture: 'Lc 23,33-34',
    biblicalPassage: 'Chegando ao lugar chamado Calvário, ali o crucificaram. E Jesus dizia: "Pai, perdoa-lhes, porque não sabem o que fazem."',
    meditation: '"Pai, perdoai-os, pois não sabem o que fazem." O perdão divino se manifesta no ápice da dor.',
    logosMeditation: 'No momento em que os pregos rasgam a carne, brota da boca de Cristo o perdão. O sangue e a misericórdia jorram juntos. Aqui se revela que o amor cristão não é sentimento: é decisão soberana, capaz de abençoar quem fere. Perdoar não é aprovar o mal; é recusar-se a devolvê-lo.',
    contemplationInvitation: [
      'Escute o "Pai, perdoai-os" ecoar sobre a sua própria história.',
      'Traga à memória alguém que você ainda não perdoou.',
      'Peça a graça de abençoar, não de retribuir.',
    ],
    fathers: [
      { author: 'Santo Estêvão (protomártir)', quote: '"Senhor, não lhes imputes este pecado" — ecoa o mestre pregando o perdão até no último suspiro.', source: 'At 7,60' },
      { author: 'Santo Tomás de Aquino', quote: 'O perdão dado do alto da Cruz é o argumento mais poderoso de que a Redenção é obra do amor, não da violência.', source: 'Suma Teológica III, q.47' },
    ],
    catechism: { ref: 'CIC 2843-2845', theme: 'Perdoar como Cristo perdoou' },
    prayer: 'Senhor, dai-me a graça de perdoar como Vós perdoastes, mesmo aqueles que me fizeram mal.',
    fruit: 'Perdão libertador — do outro e de si mesmo.',
    action: 'Rezarei hoje explicitamente por alguém que me feriu.',
  },
  {
    num: 12,
    title: 'Jesus morre na Cruz',
    scripture: 'Jo 19,28-30',
    biblicalPassage: 'Jesus, sabendo que tudo estava consumado, para que se cumprisse a Escritura, disse: "Tenho sede." [...] Depois, inclinando a cabeça, entregou o espírito.',
    meditation: '"Está consumado." O sacrifício perfeito é oferecido. O véu do Templo se rasga. A salvação é realizada.',
    logosMeditation: 'O grito "está consumado" não é o gemido de um vencido: é a proclamação de que a obra da salvação está inteira. Nesse instante, o véu do Templo se rasga — o acesso ao Santo dos Santos abre-se para sempre. A morte de Cristo é o ato mais livre da história: Ele entrega o espírito porque quer, não porque a morte o vence. Aqui nasce a Igreja, do lado aberto do Redentor.',
    contemplationInvitation: [
      'Faça silêncio absoluto. Não há palavra à altura.',
      'Adore a entrega voluntária do Filho.',
      'Ofereça a sua vida junto à d’Ele.',
    ],
    fathers: [
      { author: 'Santo Agostinho', quote: 'Dormindo Cristo na Cruz, foi formada a Esposa do seu lado aberto — como Eva do lado de Adão adormecido.', source: 'Comentário ao Evangelho de João' },
      { author: 'São Cirilo de Alexandria', quote: 'Aquele que dá vida a todos aceita morrer, para que a própria morte se torne caminho de vida.', source: 'Comentário a João' },
    ],
    catechism: { ref: 'CIC 616-617', theme: 'A eficácia salvífica da morte de Cristo' },
    prayer: 'Senhor Jesus, pela Vossa morte na Cruz, concedei-me a graça de morrer para o pecado e viver para Deus.',
    fruit: 'Morte ao pecado; entrega total ao Pai.',
    action: 'Farei hoje um minuto de silêncio adorador diante de um crucifixo.',
  },
  {
    num: 13,
    title: 'Jesus é descido da Cruz',
    scripture: 'Jo 19,38-40',
    biblicalPassage: 'José de Arimateia [...] pediu a Pilatos que lhe permitisse retirar o corpo de Jesus [...] envolveu o corpo em panos de linho, com aromas.',
    meditation: 'O corpo sagrado é deposto nos braços de Maria. A Pietà — a Mãe recebe o Filho morto.',
    logosMeditation: 'Nos braços de Maria, o Redentor repousa como criança. É a Pietà — o círculo se fecha: aquela que O recebeu em Belém O recebe agora no Calvário. No colo materno, o Corpo eucarístico já anuncia o mistério: será entregue, guardado, adorado. Toda alma que acolhe Cristo morto em si aprende, com Maria, a arte da adoração silenciosa.',
    contemplationInvitation: [
      'Coloque-se ao lado de Maria diante do Corpo do Filho.',
      'Recolha, em silêncio, o que sente diante desse mistério.',
      'Peça o dom da adoração eucarística.',
    ],
    fathers: [
      { author: 'São João Damasceno', quote: 'Nos braços da Mãe repousa Aquele que sustenta os céus; a Pietà é o primeiro sacrário da Igreja.', source: 'Homilia sobre a Dormição' },
      { author: 'Santo Alberto Magno', quote: 'Maria recebe o corpo entregue — e por isso é a primeira mestra da adoração eucarística.', source: 'De Eucharistia' },
    ],
    catechism: { ref: 'CIC 1370', theme: 'Maria unida à oferta eucarística' },
    prayer: 'Maria, Mãe de Deus, recebei-me em vossos braços como recebestes o corpo de vosso Filho.',
    fruit: 'Devoção eucarística e amor filial a Maria.',
    action: 'Rezarei hoje três Ave-Marias diante de uma imagem da Virgem.',
  },
  {
    num: 14,
    title: 'Jesus é colocado no sepulcro',
    scripture: 'Mt 27,59-60',
    biblicalPassage: 'José tomou o corpo, envolveu-o num lençol limpo, e depositou-o no seu sepulcro novo, que abrira na rocha; e, rolando uma grande pedra à entrada do sepulcro, retirou-se.',
    meditation: 'O grão de trigo cai na terra e morre para dar muito fruto. O sepulcro não é o fim, mas o prelúdio da Ressurreição.',
    logosMeditation: 'O sepulcro parece o fim — mas é o ventre. Como o grão que morre para dar fruto, Cristo repousa três dias no seio da terra para germinar como Vida Nova. O silêncio do Sábado Santo é o silêncio mais fecundo da história. Todo cristão é enterrado com Cristo no batismo, para com Ele ressurgir. O sepulcro é a promessa velada da Páscoa.',
    contemplationInvitation: [
      'Contemple o silêncio absoluto do Sábado Santo.',
      'Reconheça em si os "sepulcros" que aguardam ressurreição.',
      'Feche esta Via Sacra em silêncio esperançoso.',
    ],
    fathers: [
      { author: 'Homilia antiga do Sábado Santo', quote: 'Um grande silêncio envolve a terra: um grande silêncio, e depois a solidão, porque o Rei dorme.', source: 'Ofício de Leituras — Sábado Santo' },
      { author: 'São Paulo', quote: 'Fomos sepultados com Cristo pelo batismo em sua morte, para que, como Cristo ressuscitou dos mortos, assim também nós vivamos uma vida nova.', source: 'Rm 6,4' },
    ],
    catechism: { ref: 'CIC 624-628', theme: 'Cristo no sepulcro — descanso do Sábado Santo' },
    prayer: 'Senhor, sepultai em mim o homem velho do pecado e fazei nascer o homem novo em Cristo Ressuscitado. Amém.',
    fruit: 'Esperança pascal — a certeza da vida nova.',
    action: 'Encerrarei o dia com um Pai-Nosso oferecido pelas almas do purgatório.',
  },
];
