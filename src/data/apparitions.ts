import guadalupeImg from '@/assets/aparicao-guadalupe.webp';
import lourdesImg from '@/assets/aparicao-lourdes.webp';
import fatimaImg from '@/assets/aparicao-fatima.webp';
import aparecidaImg from '@/assets/aparicao-aparecida.webp';
import laSaletteImg from '@/assets/aparicao-la-salette.webp';
import knockImg from '@/assets/aparicao-knock.webp';
import kibehoImg from '@/assets/aparicao-kibeho.webp';
import akitaImg from '@/assets/aparicao-akita.webp';
import { DeepContent } from '@/types';

export interface Apparition extends Partial<DeepContent> {
  id: string;
  title: string;
  location: string;
  country: string;
  year: number;
  date: string;
  seer: string;
  seerStory: string;
  summary: string;
  fullStory: string;
  message: string;
  liturgicalFeast: string;
  approved: boolean;
  image: string;
  imageSrc: string;
  color: string;
}

export const APPARITIONS: Apparition[] = [
  {
    id: 'guadalupe',
    title: 'Nossa Senhora de Guadalupe',
    location: 'Tepeyac, Cidade do México',
    country: 'México',
    year: 1531,
    date: '9–12 de dezembro de 1531',
    seer: 'São Juan Diego Cuauhtlatoatzin',
    seerStory: 'Juan Diego era um indígena nahua, simples agricultor de 57 anos, recém-convertido ao cristianismo. Nascido em 1474 com o nome de Cuauhtlatoatzin ("águia que fala"), foi batizado por volta de 1524 pelos primeiros missionários franciscanos. Viúvo e humilde, caminhava regularmente até a igreja para receber instrução religiosa. Após as aparições, dedicou o resto de sua vida a cuidar da ermida construída no Tepeyac, onde a imagem milagrosa foi colocada. Foi canonizado pelo Papa João Paulo II em 2002.',
    summary: 'A Virgem apareceu a Juan Diego no monte Tepeyac, deixando sua imagem milagrosamente impressa em sua tilma.',
    fullStory: 'Em dezembro de 1531, a Virgem Maria apareceu ao indígena Juan Diego no monte Tepeyac, próximo à Cidade do México. Ela se apresentou como a "Mãe do verdadeiro Deus" e pediu que fosse construída uma igreja naquele local. O bispo Juan de Zumárraga pediu um sinal como prova. Em 12 de dezembro, a Virgem instruiu Juan Diego a colher rosas de Castela — flores impossíveis naquela estação e naquele terreno — e levá-las ao bispo em sua tilma (manto). Quando Juan Diego abriu a tilma diante do bispo, as rosas caíram e revelou-se a imagem milagrosa de Nossa Senhora impressa no tecido. A tilma, feita de fibra de agave (que normalmente se decompõe em 20 anos), permanece intacta após quase 500 anos. A imagem converteu milhões de indígenas ao cristianismo em poucos anos.',
    message: 'Maria se revela como Mãe de toda a humanidade, unindo os povos pela fé e pela compaixão. Sua mensagem é de consolo: "Não estou eu aqui, que sou tua Mãe?"',
    liturgicalFeast: '12 de dezembro',
    approved: true,
    image: '🌹',
    imageSrc: guadalupeImg,
    color: 'from-primary/20 to-primary/5 border-primary/30',
    textoBase: 'Não estou eu aqui, que sou tua Mãe? Não estás sob o meu manto e sob a minha proteção?',
    explicacao: 'Maria fala a Juan Diego quando ele estava angustiado com a doença de seu tio. Ela assegura que sua presença materna é um escudo e que nada deve nos perturbar, pois ela cuida de nós como seus filhos mais queridos.',
    interpretacaoProfunda: 'As palavras de Maria ecoam a proteção de Deus sobre Israel e a maternidade espiritual da Igreja. O "manto" de Guadalupe é, simbolicamente, o abraço misericordioso de Deus que acolhe todas as culturas e dores, transformando a angústia em esperança.',
    aplicacaoPratica: 'Quando sentir medo ou ansiedade hoje, pare um momento e imagine-se sob o manto de Maria. Deixe que essa certeza de ser cuidado por uma Mãe Celestial acalme seu coração e te dê forças para enfrentar os desafios.',
    reflexaoFinal: 'O que eu tenho tentado carregar sozinho, esquecendo-me de que tenho uma Mãe que me protege?',
    exercicio: 'Reze uma Salve Rainha bem devagar, visualizando a proteção materna de Maria sobre sua família.',
  },
  {
    id: 'la-salette',
    title: 'Nossa Senhora de La Salette',
    location: 'La Salette-Fallavaux, Alpes',
    country: 'França',
    year: 1846,
    date: '19 de setembro de 1846',
    seer: 'Mélanie Calvat e Maximin Giraud',
    seerStory: 'Mélanie Calvat tinha 14 anos e Maximin Giraud tinha 11 quando viram a "Bela Senhora" chorando nas montanhas. Ambos eram pastores pobres e quase analfabetos da região dos Alpes franceses. Mélanie era uma criança solitária e introvertida; Maximin, alegre e brincalhão. Os dois mal se conheciam antes do dia da aparição — haviam se encontrado apenas no dia anterior. Após a aparição, cada um recebeu um segredo particular da Virgem. Mélanie entrou para a vida religiosa, vivendo em vários conventos na França e Itália, falecendo em 1904. Maximin teve uma vida mais atribulada, tentando sem sucesso o seminário e outros caminhos, falecendo em 1875 aos 40 anos. Ambos mantiveram até o fim a veracidade de seu testemunho.',
    summary: 'A Virgem apareceu chorando a dois pastorzinhos nos Alpes franceses, lamentando a profanação do domingo e o abandono da oração.',
    fullStory: 'Em 19 de setembro de 1846, na montanha de La Salette, nos Alpes franceses, a cerca de 1.800 metros de altitude, duas crianças pastoras — Mélanie Calvat e Maximin Giraud — viram uma esfera de luz que se abriu, revelando uma mulher sentada sobre uma pedra, com o rosto entre as mãos, chorando. A "Bela Senhora" levantou-se e falou às crianças em francês e em patois (dialeto local). Ela lamentou a profanação do domingo, a blasfêmia do nome de Deus e o abandono da oração. Advertiu sobre más colheitas, fome e epidemias como consequências. Confiou um segredo a cada criança. Pediu que sua mensagem fosse transmitida "a todo o seu povo". Em seguida, elevou-se no ar e desapareceu. O bispo de Grenoble aprovou o culto em 1851, e uma basílica foi construída no local da aparição. O santuário de La Salette continua sendo importante centro de peregrinação.',
    message: 'Maria chora pela indiferença de seus filhos. Pede a santificação do domingo, a oração constante e a conversão do coração. Alerta que o afastamento de Deus traz consequências para a humanidade.',
    liturgicalFeast: '19 de setembro',
    approved: true,
    image: '😢',
    imageSrc: laSaletteImg,
    color: 'from-violet-500/20 to-violet-600/5 border-violet-500/30',
  },
  {
    id: 'lourdes',
    title: 'Nossa Senhora de Lourdes',
    location: 'Gruta de Massabielle, Lourdes',
    country: 'França',
    year: 1858,
    date: '11 de fevereiro a 16 de julho de 1858',
    seer: 'Santa Bernadette Soubirous',
    seerStory: 'Bernadette Soubirous nasceu em 7 de janeiro de 1844 em Lourdes, filha de um moleiro empobrecido. A família vivia na miséria extrema, num antigo calabouço chamado "le cachot". Bernadette era uma menina frágil, asmática, semianalfabeta, que ainda não havia feito a Primeira Comunhão aos 14 anos. Após as 18 aparições, enfrentou interrogatórios severos das autoridades civis e eclesiásticas, mas manteve seu testemunho com firmeza inabalável. Entrou no convento das Irmãs da Caridade de Nevers em 1866, onde viveu em oração e sofrimento. Morreu em 16 de abril de 1879, aos 35 anos, pronunciando: "Santa Maria, Mãe de Deus, rogai por mim, pobre pecadora." Seu corpo permanece incorrupto. Foi canonizada em 1933.',
    summary: 'A Imaculada Conceição apareceu 18 vezes a Bernadette numa gruta, revelando uma fonte de água que se tornou centro mundial de peregrinação e curas.',
    fullStory: 'Entre fevereiro e julho de 1858, a Virgem Maria apareceu 18 vezes a Bernadette Soubirous na gruta de Massabielle, às margens do rio Gave. Na nona aparição, a Virgem instruiu Bernadette a cavar o chão da gruta, de onde brotou uma fonte de água que flui até hoje. Na décima sexta aparição, em 25 de março (festa da Anunciação), a Virgem revelou sua identidade: "Que soy era Immaculada Councepciou" (Eu sou a Imaculada Conceição) — confirmando o dogma proclamado pelo Papa Pio IX apenas quatro anos antes, em 1854. Desde então, Lourdes tornou-se o maior centro de peregrinação mariana do mundo, com milhões de peregrinos anuais. O Bureau Médico de Lourdes registrou 70 curas oficialmente reconhecidas como milagres pela Igreja.',
    message: 'Maria convida à penitência, à oração e à conversão. Pede que se reze o Rosário e que se faça procissões. A água da fonte simboliza a purificação e a graça divina.',
    liturgicalFeast: '11 de fevereiro',
    approved: true,
    image: '💧',
    imageSrc: lourdesImg,
    color: 'from-primary/20 to-primary/5 border-primary/30',
  },
  {
    id: 'knock',
    title: 'Nossa Senhora de Knock',
    location: 'Knock, Condado de Mayo',
    country: 'Irlanda',
    year: 1879,
    date: '21 de agosto de 1879',
    seer: '15 testemunhas (homens, mulheres e crianças)',
    seerStory: 'Diferente de outras aparições, em Knock não houve um único vidente privilegiado, mas quinze testemunhas de diversas idades — de crianças de 5 anos a idosos de 75. Entre elas estavam Mary McLoughlin (governanta do pároco), Mary Beirne (jovem de 29 anos que primeiro identificou as figuras), Bridget Trench (idosa de 75 anos que rezou o Rosário durante toda a aparição), e o menino John Curry, de apenas 5 anos. Todas as testemunhas permaneceram do lado de fora da igreja sob chuva intensa durante cerca de duas horas, observando as figuras luminosas. Notavelmente, nenhuma das figuras falou — a aparição foi inteiramente silenciosa. Uma Comissão Eclesiástica ouviu as testemunhas em 1879 e novamente em 1936, considerando seus depoimentos confiáveis e consistentes.',
    summary: 'A Virgem Maria, São José e São João Evangelista apareceram na parede da igreja de Knock, com um altar, um cordeiro e uma cruz, diante de 15 testemunhas sob chuva.',
    fullStory: 'Na noite chuvosa de 21 de agosto de 1879, quinze pessoas — homens, mulheres e crianças — viram uma aparição luminosa na parede sul (empena) da igreja paroquial de Knock. A visão incluía três figuras: a Virgem Maria ao centro, vestida de branco com uma coroa dourada, de mãos erguidas em oração; São José à sua direita, com a cabeça inclinada; e São João Evangelista à esquerda, vestido como bispo, com um livro na mão esquerda e a mão direita erguida como se pregasse. À esquerda de São João havia um altar com um cordeiro e uma cruz, rodeado por anjos. As figuras eram tridimensionais, luminosas e flutuavam a alguns centímetros acima do chão. A aparição durou cerca de duas horas. Apesar da chuva torrencial, o chão ao redor das figuras permaneceu seco. A aparição foi completamente silenciosa — nenhuma das figuras proferiu qualquer palavra. A Comissão Eclesiástica de 1879 considerou as testemunhas confiáveis. O Papa João Paulo II visitou Knock em 1979, no centenário da aparição, e elevou a igreja a Basílica.',
    message: 'A aparição silenciosa de Knock é interpretada como uma mensagem de fé eucarística (o Cordeiro sobre o altar), de esperança na tribulação (a Irlanda sofria grande fome) e de intercessão materna. Maria aparece como Rainha do Céu, em oração silenciosa por seu povo.',
    liturgicalFeast: '21 de agosto',
    approved: true,
    image: '🐑',
    imageSrc: knockImg,
    color: 'from-teal-500/20 to-teal-600/5 border-teal-500/30',
  },
  {
    id: 'fatima',
    title: 'Nossa Senhora de Fátima',
    location: 'Cova da Iria, Fátima',
    country: 'Portugal',
    year: 1917,
    date: '13 de maio a 13 de outubro de 1917',
    seer: 'Lúcia dos Santos, Francisco e Jacinta Marto',
    seerStory: 'Os três pastorzinhos de Fátima eram primos. Lúcia de Jesus dos Santos tinha 10 anos; Francisco Marto, 9 anos; e Jacinta Marto, 7 anos. Eram crianças simples e analfabetas de famílias camponesas da aldeia de Aljustrel. Francisco, de temperamento contemplativo, foi descrito pela Virgem como precisando "rezar muitos rosários" para ir ao Céu. Morreu em 4 de abril de 1919, vítima da gripe espanhola, aos 10 anos. Jacinta, a mais jovem, sofreu intensamente antes de morrer em 20 de fevereiro de 1920, aos 9 anos, oferecendo seus sofrimentos pela conversão dos pecadores. Francisco e Jacinta foram canonizados pelo Papa Francisco em 2017. Lúcia tornou-se religiosa carmelita, vivendo até os 97 anos (†2005). É Serva de Deus em processo de beatificação.',
    summary: 'A Virgem apareceu a três crianças pastoras, revelando três segredos proféticos e realizando o Milagre do Sol diante de 70.000 pessoas.',
    fullStory: 'Em 1917, durante a Primeira Guerra Mundial, a Virgem Maria apareceu seis vezes a três pastorzinhos na Cova da Iria, Fátima. As aparições foram precedidas por três visitas do Anjo de Portugal em 1916. A Virgem revelou três segredos: a visão do inferno, a devoção ao Imaculado Coração de Maria e a consagração da Rússia, e o terceiro segredo (revelado em 2000, referente à perseguição da Igreja e ao atentado contra o Papa). Em cada aparição, Maria pediu a recitação diária do Rosário pela paz no mundo. Na última aparição, em 13 de outubro de 1917, ocorreu o "Milagre do Sol": cerca de 70.000 pessoas viram o sol "dançar" no céu, girar e parecer precipitar-se sobre a terra, secando instantaneamente as roupas e o chão encharcados pela chuva. O fenômeno foi testemunhado por crentes e céticos, e reportado por jornais seculares da época.',
    message: 'Maria pede oração (especialmente o Rosário), penitência, conversão e devoção ao seu Imaculado Coração. Alerta sobre as consequências do pecado e promete: "Por fim, o meu Imaculado Coração triunfará."',
    liturgicalFeast: '13 de maio',
    approved: true,
    image: '☀️',
    imageSrc: fatimaImg,
    color: 'from-secondary/20 to-secondary/5 border-secondary/30',
  },
  {
    id: 'aparecida',
    title: 'Nossa Senhora Aparecida',
    location: 'Rio Paraíba do Sul, Aparecida',
    country: 'Brasil',
    year: 1717,
    date: 'Outubro de 1717',
    seer: 'Pescadores Domingos Garcia, João Alves e Filipe Pedroso',
    seerStory: 'Os três pescadores eram homens simples da vila de Guaratinguetá, na capitania de São Paulo. Domingos Garcia, João Alves e Filipe Pedroso saíram para pescar no rio Paraíba do Sul em preparação para uma recepção ao Conde de Assumar, governador da capitania. Após horas sem conseguir nenhum peixe, lançaram suas redes mais uma vez perto do Porto de Itaguaçu. João Alves recolheu primeiro o corpo de uma pequena imagem de terracota, e na jogada seguinte, a cabeça. Após reunirem a imagem de Nossa Senhora da Conceição — enegrecida pelo tempo submersa na água —, as redes encheram-se de peixes em abundância. A devoção à imagem cresceu entre as famílias da região, que começaram a rezar diante dela. Milagres passaram a ser atribuídos à intercessão da Virgem Aparecida.',
    summary: 'Uma imagem de Nossa Senhora da Conceição foi miraculosamente encontrada por pescadores no rio Paraíba do Sul, tornando-se Padroeira do Brasil.',
    fullStory: 'Em outubro de 1717, três pescadores lançaram suas redes no rio Paraíba do Sul, perto de Guaratinguetá. Após horas sem sucesso, encontraram primeiro o corpo, depois a cabeça de uma pequena imagem de terracota de Nossa Senhora da Conceição, enegrecida pelas águas e pelo tempo. Imediatamente após a descoberta, as redes se encheram de peixes em abundância. A imagem, de apenas 36 centímetros, foi levada para a casa de Filipe Pedroso, onde vizinhos começaram a rezar diante dela. Milagres passaram a ser relatados: a cura de doentes, a libertação de escravos (cujas correntes se quebraram diante da imagem), e muitas outras graças. Uma primeira capela foi construída em 1745, seguida de uma igreja maior em 1834. O grandioso Santuário Nacional de Aparecida, a segunda maior basílica católica do mundo (após São Pedro), foi inaugurado em 1980. Nossa Senhora Aparecida foi proclamada Padroeira do Brasil pelo Papa Pio XI em 1930. A festa de 12 de outubro é feriado nacional.',
    message: 'Maria se faz presente de modo simples e humilde, entre pescadores comuns, mostrando que Deus age através dos pequenos e dos pobres. Sua imagem escura abraça a diversidade do povo brasileiro.',
    liturgicalFeast: '12 de outubro',
    approved: true,
    image: '🐟',
    imageSrc: aparecidaImg,
    color: 'from-primary/20 to-primary/5 border-primary/30',
  },
  {
    id: 'kibeho',
    title: 'Nossa Senhora de Kibeho',
    location: 'Kibeho, Província do Sul',
    country: 'Ruanda',
    year: 1981,
    date: '28 de novembro de 1981 a 28 de novembro de 1989',
    seer: 'Alphonsine Mumureke, Nathalie Mukamazimpaka e Marie Claire Mukangango',
    seerStory: 'As três videntes eram estudantes do colégio de Kibeho. Alphonsine Mumureke tinha 16 anos quando teve a primeira visão em 28 de novembro de 1981 — era uma jovem tímida e piedosa. Nathalie Mukamazimpaka, de 17 anos, começou a ter visões em janeiro de 1982; era conhecida por sua vida de oração intensa e penitência rigorosa. Marie Claire Mukangango, de 21 anos, inicialmente cética e hostil às alegações de Alphonsine, começou a ter visões em março de 1982 e tornou-se a mais fervorosa propagadora da mensagem do Rosário das Sete Dores. Marie Claire foi tragicamente assassinada durante o genocídio de Ruanda em 1994. Alphonsine tornou-se religiosa e vive na Itália. Nathalie vive uma vida reservada em Ruanda. A Igreja aprovou oficialmente as aparições das três videntes em 2001.',
    summary: 'A Virgem apareceu a três jovens estudantes em Ruanda, alertando sobre terríveis sofrimentos futuros e pedindo oração e conversão — 13 anos antes do genocídio.',
    fullStory: 'Entre 1981 e 1989, a Virgem Maria apareceu a três jovens estudantes no colégio de Kibeho, em Ruanda. Apresentando-se como "Nyina wa Jambo" (Mãe do Verbo), Maria transmitiu mensagens de oração, conversão e penitência. Em visões aterradoras, as jovens viram rios de sangue, corpos mutilados e devastação generalizada — imagens proféticas que se cumpriram tragicamente durante o genocídio de Ruanda em 1994, quando cerca de 800.000 pessoas foram massacradas em apenas 100 dias. A Virgem pediu especialmente a recitação do "Rosário das Sete Dores", meditando sobre os sofrimentos de Maria. Kibeho é a primeira e até agora única aparição mariana oficialmente aprovada pela Igreja na África. O bispo de Gikongoro aprovou as aparições em 2001, após mais de 20 anos de investigação. O Santuário de Kibeho tornou-se importante centro de peregrinação para toda a África.',
    message: 'Maria convida à conversão urgente, à oração do Rosário das Sete Dores e à penitência. Alerta que o mundo caminha para a catástrofe se não se converter. Pede especialmente: "Rezem, rezem, rezem" e "Convertam-se enquanto ainda há tempo."',
    liturgicalFeast: '28 de novembro',
    approved: true,
    image: '🕊️',
    imageSrc: kibehoImg,
    color: 'from-orange-500/20 to-orange-600/5 border-orange-500/30',
  },
  {
    id: 'akita',
    title: 'Nossa Senhora de Akita',
    location: 'Yuzawadai, Akita',
    country: 'Japão',
    year: 1973,
    date: '6 de julho de 1973 a 15 de setembro de 1981',
    seer: 'Irmã Agnes Katsuko Sasagawa',
    seerStory: 'Agnes Katsuko Sasagawa nasceu em 28 de maio de 1931. Converteu-se ao catolicismo na idade adulta após uma vida marcada por doenças. Ficou completamente surda, uma condição que os médicos consideravam irreversível. Entrou para o Instituto das Servas da Eucaristia em Yuzawadai, Akita, em 1973. Logo após sua chegada, uma ferida dolorosa em forma de cruz apareceu na palma de sua mão esquerda, que sangrava abundantemente. A estátua de Nossa Senhora na capela do convento começou a exsudar um líquido das mãos e depois a chorar. Irmã Agnes recebeu três mensagens da Virgem Maria. Em 1982, sua surdez foi miraculosamente curada instantaneamente durante uma adoração eucarística — fato confirmado por seus médicos. A cura foi reconhecida como milagrosa. Irmã Agnes viveu uma vida de oração e discrição no convento.',
    summary: 'Uma estátua de Nossa Senhora chorou 101 vezes no Japão, enquanto uma religiosa surda recebia mensagens sobre oração e penitência.',
    fullStory: 'Entre 1973 e 1981, no convento das Servas da Eucaristia em Akita, Japão, uma estátua de madeira de Nossa Senhora começou a manifestar fenômenos inexplicáveis. Primeiro, a estátua exsudou um líquido fragrante das mãos. Depois, começou a chorar lágrimas humanas — fenômeno que se repetiu 101 vezes entre 4 de janeiro de 1975 e 15 de setembro de 1981, sempre testemunhado por múltiplas pessoas. Amostras das lágrimas foram analisadas em laboratório e confirmadas como sendo de origem humana (grupos sanguíneos O e B). Paralelamente, Irmã Agnes Sasagawa, religiosa surda do convento, recebeu três mensagens da Virgem. Na terceira e mais solene mensagem (13 de outubro de 1973 — aniversário do Milagre do Sol de Fátima), Maria alertou: "Se os homens não se arrependerem, o Pai infligirá um terrível castigo sobre toda a humanidade." O Bispo John Shojiro Ito de Niigata conduziu uma investigação de anos e, em 1984, reconheceu oficialmente o caráter sobrenatural dos acontecimentos. O Cardeal Ratzinger (futuro Papa Bento XVI) confirmou a aprovação.',
    message: 'Maria pede oração, penitência e reparação. Alerta sobre castigos caso a humanidade não se converta. Pede especialmente a oração do Rosário e a reparação pelos pecados. Afirma: "O Rosário é a arma mais poderosa."',
    liturgicalFeast: '15 de setembro (Nossa Senhora das Dores)',
    approved: true,
    image: '😭',
    imageSrc: akitaImg,
    color: 'from-secondary/20 to-secondary/5 border-secondary/30',
  },
].sort((a, b) => a.year - b.year);
