import { DeepContent } from '@/types';
import guadalupeImg from '@/assets/aparicao-guadalupe.webp';
import lourdesImg from '@/assets/aparicao-lourdes.webp';
import fatimaImg from '@/assets/aparicao-fatima.webp';
import aparecidaImg from '@/assets/aparicao-aparecida.webp';
import laSaletteImg from '@/assets/aparicao-la-salette.webp';
import knockImg from '@/assets/aparicao-knock.webp';
import kibehoImg from '@/assets/aparicao-kibeho.webp';
import akitaImg from '@/assets/aparicao-akita.webp';

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

const baseEditorial = {
  textoBase: 'A Mãe de Deus convida seus filhos à conversão, à oração sincera e à reparação pelos pecados do mundo.',
  explicacao: 'Maria fala a Juan Diego quando ele estava angustiado com a doença de seu tio (cf. Sl 91,4). Ela assegura que sua presença materna é um escudo e que nada deve nos perturbar, pois ela cuida de nós como seus filhos mais queridos (cf. CIC §968).',
  interpretacaoProfunda: 'Cada aparição carrega uma teologia própria voltada para o contexto da época: misericórdia, penitência, reparação ou consagração.',
  aplicacaoPratica: 'Hoje, o convite de Maria é para a simplicidade na fé e a fidelidade ao Rosário, arma poderosa contra as trevas.',
  reflexaoFinal: 'Como posso tornar meu coração mais aberto ao convite materno de Maria para uma conversão diária?',
  exercicio: 'Reze um mistério do Rosário oferecendo-o pela intenção de conversão dos pecadores, como Maria pediu em tantas aparições.'
};

export const APPARITIONS: Apparition[] = [
  {
    id: 'guadalupe',
    title: 'Nossa Senhora de Guadalupe',
    location: 'Tepeyac, Cidade do México',
    country: 'México',
    year: 1531,
    date: '9–12 de dezembro de 1531',
    seer: 'São Juan Diego Cuauhtlatoatzin',
    seerStory: 'Juan Diego era um indígena nahua, simples agricultor, recém-convertido. Após as aparições, dedicou a vida a cuidar da ermida no Tepeyac. Canonizado em 2002.',
    summary: 'A Virgem apareceu a Juan Diego no monte Tepeyac, deixando sua imagem milagrosamente impressa em sua tilma.',
    fullStory: 'Em dezembro de 1531, a Virgem Maria apareceu ao indígena Juan Diego no monte Tepeyac. Ela se apresentou como a "Mãe do verdadeiro Deus". Ao abrir a tilma diante do bispo Zumárraga, revelou-se a imagem milagrosa de Nossa Senhora. A tilma permanece intacta quase 500 anos depois.',
    message: 'Maria se revela como Mãe de toda a humanidade. "Não estou eu aqui, que sou tua Mãe?"',
    liturgicalFeast: '12 de dezembro',
    approved: true,
    image: '🌹',
    imageSrc: guadalupeImg,
    color: 'from-primary/20 to-primary/5 border-primary/30',
    ...baseEditorial
  },
  {
    id: 'la-salette',
    title: 'Nossa Senhora de La Salette',
    location: 'La Salette-Fallavaux, Alpes',
    country: 'França',
    year: 1846,
    date: '19 de setembro de 1846',
    seer: 'Mélanie Calvat e Maximin Giraud',
    seerStory: 'Mélanie e Maximin eram pastorzinhos pobres e quase analfabetos. Após a aparição, ambos mantiveram a veracidade do testemunho sob severo escrutínio.',
    summary: 'A Virgem apareceu chorando a dois pastorzinhos, lamentando a profanação do domingo e o abandono da oração.',
    fullStory: 'Em 19 de setembro de 1846, na montanha de La Salette, a "Bela Senhora" apareceu chorando a duas crianças, lamentando a profanação do domingo, a blasfêmia e o abandono da oração.',
    message: 'Maria chora pela indiferença de seus filhos. Pede a santificação do domingo, a oração e a conversão.',
    liturgicalFeast: '19 de setembro',
    approved: true,
    image: '😢',
    imageSrc: laSaletteImg,
    color: 'from-violet-500/20 to-violet-600/5 border-violet-500/30',
    ...baseEditorial
  },
  {
    id: 'lourdes',
    title: 'Nossa Senhora de Lourdes',
    location: 'Gruta de Massabielle, Lourdes',
    country: 'França',
    year: 1858,
    date: '11 de fevereiro a 16 de julho de 1858',
    seer: 'Santa Bernadette Soubirous',
    seerStory: 'Bernadette era uma menina pobre, doente e humilde. Após as 18 aparições, tornou-se religiosa, vivendo em oração e sofrimento até sua morte em 1879.',
    summary: 'A Imaculada Conceição apareceu 18 vezes a Bernadette, revelando uma fonte de água que se tornou centro de peregrinação.',
    fullStory: 'Entre fevereiro e julho de 1858, a Virgem apareceu 18 vezes a Bernadette. Na 16ª aparição, revelou: "Eu sou a Imaculada Conceição". A fonte surgida no local tornou-se fonte de inúmeras curas.',
    message: 'Maria convida à penitência, à oração e à conversão.',
    liturgicalFeast: '11 de fevereiro',
    approved: true,
    image: '💧',
    imageSrc: lourdesImg,
    color: 'from-primary/20 to-primary/5 border-primary/30',
    ...baseEditorial
  },
  {
    id: 'knock',
    title: 'Nossa Senhora de Knock',
    location: 'Knock, Condado de Mayo',
    country: 'Irlanda',
    year: 1879,
    date: '21 de agosto de 1879',
    seer: '15 testemunhas (homens, mulheres e crianças)',
    seerStory: 'Quinze testemunhas, incluindo crianças e idosos, presenciaram a aparição silenciosa na parede da igreja sob chuva intensa por duas horas.',
    summary: 'Aparição silenciosa de Nossa Senhora, São José e São João Evangelista na parede de uma igreja.',
    fullStory: 'Na noite de 21 de agosto de 1879, 15 pessoas viram Maria, São José e São João Evangelista perto da parede da igreja local. A aparição foi silenciosa, focada na centralidade do Cordeiro (Eucaristia).',
    message: 'Silêncio contemplativo, foco na Eucaristia.',
    liturgicalFeast: '21 de agosto',
    approved: true,
    image: '🙏',
    imageSrc: knockImg,
    color: 'from-blue-500/20 to-blue-600/5 border-blue-500/30',
    ...baseEditorial
  },
  {
    id: 'fatima',
    title: 'Nossa Senhora de Fátima',
    location: 'Cova da Iria, Fátima',
    country: 'Portugal',
    year: 1917,
    date: '13 de maio a 13 de outubro de 1917',
    seer: 'Lúcia dos Santos, Francisco e Jacinta Marto',
    seerStory: 'Três pastorinhos de Aljustrel receberam mensagens sobre a paz, o inferno e a conversão do mundo.',
    summary: 'A Senhora mais brilhante que o sol apareceu seis vezes, pedindo o Rosário pela paz mundial.',
    fullStory: 'De maio a outubro de 1917, Maria apareceu a Lúcia, Francisco e Jacinta. Apresentou-se como a Senhora do Rosário e culminou com o Milagre do Sol em 13 de outubro, testemunhado por milhares.',
    message: 'Oração, penitência, devoção ao Imaculado Coração de Maria e o Rosário como arma de paz.',
    liturgicalFeast: '13 de maio',
    approved: true,
    image: '🕊️',
    imageSrc: fatimaImg,
    color: 'from-red-500/20 to-red-600/5 border-red-500/30',
    ...baseEditorial
  },
  {
    id: 'aparecida',
    title: 'Nossa Senhora Aparecida',
    location: 'Rio Paraíba do Sul, São Paulo',
    country: 'Brasil',
    year: 1717,
    date: 'Outubro de 1717',
    seer: 'Três pescadores: João Alves, Filipe Pedroso e Domingos Garcia',
    seerStory: 'Pescadores humildes encontraram a imagem de Nossa Senhora da Conceição após uma pesca milagrosa que trouxe abundância de peixes.',
    summary: 'A imagem da Padroeira do Brasil foi encontrada nas águas do rio Paraíba do Sul.',
    fullStory: 'Em 1717, três pescadores encontraram primeiro o corpo da estátua e depois a cabeça. Após a pesca milagrosa, tornaram-se devotos da imagem, que viria a ser a Padroeira do Brasil.',
    message: 'Maria aparece para manifestar a presença de Deus no meio da necessidade, unindo um povo em torno de seu Filho.',
    liturgicalFeast: '12 de outubro',
    approved: true,
    image: '🎣',
    imageSrc: aparecidaImg,
    color: 'from-amber-500/20 to-amber-600/5 border-amber-500/30',
    ...baseEditorial
  },
  {
    id: 'kibeho',
    title: 'Nossa Senhora de Kibeho',
    location: 'Kibeho, Província de Gikongoro',
    country: 'Ruanda',
    year: 1981,
    date: '28 de novembro de 1981 a 28 de novembro de 1989',
    seer: 'Alphonsine Mumureke, Nathalie Mukamazimpaka e Marie Claire Mukangango',
    seerStory: 'Três jovens estudantes tiveram visões proféticas de Maria e Jesus alertando sobre conflitos e pedindo conversão.',
    summary: 'A "Mãe do Verbo" apareceu em Ruanda antes do genocídio, pedindo oração e penitência.',
    fullStory: 'De 1981 a 1989, Maria apareceu em Kibeho. Pediu conversão urgente e profetizou sofrimentos para a nação ruandesa, alertando sobre a importância do arrependimento e oração profunda.',
    message: 'A "Mãe do Verbo" convida à conversão profunda, à oração pelo mundo e ao Rosário das Sete Dores.',
    liturgicalFeast: '28 de novembro',
    approved: true,
    image: '✨',
    imageSrc: kibehoImg,
    color: 'from-emerald-500/20 to-emerald-600/5 border-emerald-500/30',
    ...baseEditorial
  },
  {
    id: 'akita',
    title: 'Nossa Senhora de Akita',
    location: 'Yuzawadai, Akita',
    country: 'Japão',
    year: 1973,
    date: '6 de julho de 1973 a 15 de setembro de 1981',
    seer: 'Irmã Agnes Katsuko Sasagawa',
    seerStory: 'Agnes Sasagawa, religiosa surda, presenciou lágrimas em uma estátua e recebeu mensagens sobre a necessidade de reparação.',
    summary: 'Uma estátua de Nossa Senhora chorou 101 vezes no Japão, pedindo oração, penitência e reparação.',
    fullStory: 'Entre 1973 e 1981, uma estátua de Nossa Senhora em um convento japonês chorou 101 vezes. A Irmã Agnes, surda, recebeu mensagens urgentes sobre a conversão da humanidade.',
    message: 'Maria pede oração, penitência e reparação. "O Rosário é a arma mais poderosa."',
    liturgicalFeast: '15 de setembro',
    approved: true,
    image: '😭',
    imageSrc: akitaImg,
    color: 'from-secondary/20 to-secondary/5 border-secondary/30',
    ...baseEditorial
  },
].sort((a, b) => a.year - b.year);
