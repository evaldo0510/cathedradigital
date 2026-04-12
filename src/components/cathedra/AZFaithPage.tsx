import React, { useState, useMemo, useEffect, useRef } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import SEOHead from '@/components/SEOHead';
import { AppRoute } from '@/types';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Book, Bookmark, Search, X, BookOpen, Quote, Brain, Globe, Target, Compass, 
  ArrowRight, Sparkles, Hash, ChevronRight, Heart
} from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import BibleVersePopover from './BibleVersePopover';
import CatechismPopover from './CatechismPopover';
import MagisteriumPopover from './MagisteriumPopover';
import { parseBibleReferences } from '@/lib/bibleRefParser';
import AZFaithQuiz from './AZFaithQuiz';

interface FaithTerm {
  term: string;
  definition: string;
  reference?: string;
  category?: string;
  deepInterpretation?: string;
  practicalApplication?: string;
  bibleVerses?: string[];
  catechismReferences?: string[];
  magisteriumReferences?: string[];
  journey_id?: string;
}

const FAITH_TERMS: FaithTerm[] = [
  { term: 'Abraão', definition: 'O pai da fé, chamado por Deus para sair de sua terra e ir para uma nova pátria.', reference: 'Gn 12,1-4', category: 'Patriarcas' },
  { term: 'Adão', definition: 'O primeiro homem criado por Deus, cuja queda trouxe o pecado ao mundo.', reference: 'Gn 2,7; 3,1-24', category: 'Criação' },
  { 
    term: 'Aliança', 
    definition: 'Compromisso solene entre Deus e o seu povo, renovado plenamente em Jesus Cristo.', 
    reference: 'Jr 31,31-34', 
    category: 'Teologia',
    deepInterpretation: 'A Aliança não é apenas um contrato legal, mas uma relação de amor esponsal. No Antigo Testamento, Deus estabelece alianças com Noé, Abraão, Moisés e Davi, cada uma expandindo o círculo da família de Deus. A Nova e Eterna Aliança é selada no Sangue de Cristo, unindo Deus e a humanidade de forma inseparável.',
    practicalApplication: 'Viver a aliança hoje significa renovar diariamente nossa fidelidade a Deus através da oração e do cumprimento dos mandamentos, não por obrigação, mas por amor àquele que nos amou primeiro.',
    bibleVerses: ['Gn 9,8-17 (Noé)', 'Gn 15 (Abraão)', 'Êx 19-24 (Moisés)', 'Lc 22,20 (Jesus)'],
    catechismReferences: ['§54-64 (As etapas da Revelação)', '§762 (A preparação da Igreja na AT)'],
    magisteriumReferences: ['Dei Verbum n. 2-4 (Revelação)', 'Lumen Gentium n. 9 (O Povo de Deus)'],
    journey_id: 'a0a0a0a0-0005-4000-8000-000000000001'
  },
  { term: 'Amém', definition: 'Palavra hebraica que significa "assim seja" ou "verdadeiramente".', reference: 'Ap 3,14', category: 'Liturgia' },
  { term: 'Amor', definition: 'Doação de si segundo Deus. A caridade que se dá sem esperar retorno, raiz de todas as virtudes.', reference: '1Cor 13', category: 'Virtudes',
    deepInterpretation: 'O amor cristão (ágape) não é sentimento, mas decisão. Deus é amor (1Jo 4,8). Toda a Lei se resume no mandamento do amor: amar a Deus sobre todas as coisas e ao próximo como a si mesmo.',
    practicalApplication: 'Pratique um ato de caridade anônimo hoje. Perdoe alguém que o magoou. Doe seu tempo a quem precisa.',
    bibleVerses: ['1Cor 13,4-7 (Hino do Amor)', '1Jo 4,7-8 (Deus é Amor)', 'Jo 15,12-13 (Mandamento novo)'],
    catechismReferences: ['§1822-1829 (A Caridade)', '§1604 (O Amor conjugal)'],
    magisteriumReferences: ['Deus Caritas Est (Bento XVI)', 'Amoris Laetitia (Papa Francisco)'],
    journey_id: 'a0a0a0a0-0001-4000-8000-000000000001'
  },
  { term: 'Anjo', definition: 'Mensageiro espiritual de Deus que atua na história da salvação.', reference: 'Hb 1,14', category: 'Seres Celestiais',
    deepInterpretation: 'Os anjos são criaturas puramente espirituais, dotadas de inteligência e vontade. Servem como mensageiros de Deus e guardiães dos homens. A palavra "anjo" vem do grego "angelos", que significa mensageiro.',
    practicalApplication: 'Reze ao seu Anjo da Guarda diariamente. Peça sua proteção e orientação nas decisões do dia.',
    bibleVerses: ['Hb 1,14 (Espíritos a serviço)', 'Sl 91,11-12 (Anjos guardiães)', 'Lc 1,26-28 (O Anjo Gabriel)'],
    catechismReferences: ['§328-336 (A existência dos anjos)', '§350-352 (Os anjos na vida da Igreja)'],
    magisteriumReferences: ['Lumen Gentium n. 49-50'],
  },
  { term: 'Apocalipse', definition: 'Último livro da Bíblia, que revela a vitória final de Deus sobre o mal.', reference: 'Ap 1,1', category: 'Escatologia',
    deepInterpretation: 'O Apocalipse não é um livro de terror, mas de esperança. Revela que, apesar das tribulações, Cristo já venceu. A história caminha para a consumação gloriosa do Reino de Deus.',
    practicalApplication: 'Nas dificuldades da vida, lembre-se: o final da história já está escrito, e é a vitória do Bem.',
    bibleVerses: ['Ap 1,1 (Revelação de Jesus Cristo)', 'Ap 21,1-4 (Novo céu e nova terra)', 'Ap 22,20 (Maranathá)'],
    catechismReferences: ['§668-677 (A vinda gloriosa de Cristo)', '§1038-1041 (O Juízo Final)'],
    magisteriumReferences: ['Spe Salvi (Bento XVI)'],
  },
  { term: 'Apóstolo', definition: 'Um dos doze escolhidos por Jesus para serem testemunhas de sua ressurreição.', reference: 'Lc 6,13', category: 'Ministérios' },
  { term: 'Arca da Aliança', definition: 'Símbolo da presença de Deus entre o povo de Israel no deserto.', reference: 'Êx 25,10-22', category: 'Objetos Sagrados' },
  { term: 'Arrependimento', definition: 'O movimento interior de conversão, reconhecendo o pecado e voltando-se para Deus.', reference: 'At 3,19', category: 'Moral',
    deepInterpretation: 'O arrependimento bíblico (metanoia) é mais do que remorso: é uma mudança radical de direção, do pecado para Deus. É o primeiro passo do caminho de volta ao Pai.',
    practicalApplication: 'Faça um exame de consciência hoje. Identifique uma área da sua vida que precisa de conversão.',
    bibleVerses: ['Lc 15,11-32 (O Filho Pródigo)', 'Sl 51 (Miserere)', 'At 3,19 (Conversão)'],
    catechismReferences: ['§1430-1433 (A penitência interior)', '§1451 (A contrição)'],
    magisteriumReferences: ['Reconciliatio et Paenitentia (João Paulo II)'],
    journey_id: 'a0a0a0a0-0004-4000-8000-000000000001'
  },
  { 
    term: 'Batismo', 
    definition: 'Sacramento do novo nascimento pela água e pelo Espírito Santo.', 
    reference: 'Mt 28,19; Jo 3,5', 
    category: 'Sacramentos',
    deepInterpretation: 'Pelo Batismo, somos libertos do pecado e regenerados como filhos de Deus, tornando-nos membros de Cristo e incorporados à Igreja.',
    practicalApplication: 'Honrar nosso batismo significa viver como verdadeiros filhos de Deus no mundo.',
    bibleVerses: ['Jo 3,5 (Nascimento da água e Espírito)', 'Mt 28,19 (Mandato missionário)', 'Rm 6,3-4 (Morte e Ressurreição com Cristo)'],
    catechismReferences: ['§1213-1284 (O Sacramento do Batismo)'],
    magisteriumReferences: ['Ad Gentes n. 14 (Iniciação Cristã)'],
    journey_id: 'b1b1b1b1-0001-4000-8000-000000000001'
  },
  { term: 'Batista', definition: 'Aquele que batiza, título dado a João, o precursor de Jesus.', reference: 'Mt 3,1', category: 'Personagens Bíblicos' },
  { term: 'Babilônia', definition: 'Símbolo do exílio de Israel e do poder mundano oposto a Deus.', reference: 'Sl 137', category: 'Geografia Bíblica' },
  { term: 'Beatitude', definition: 'O estado de suprema felicidade e bem-aventurança na presença de Deus.', reference: 'Mt 5,3', category: 'Teologia',
    deepInterpretation: 'A beatitude não é apenas felicidade humana, mas a participação na própria vida de Deus. É o fim último para o qual fomos criados: ver Deus face a face.',
    practicalApplication: 'Cultive a alegria interior mesmo nas dificuldades, sabendo que a verdadeira felicidade está em Deus.',
    bibleVerses: ['Mt 5,3-12 (As Bem-aventuranças)', '1Jo 3,2 (Seremos semelhantes a Ele)', 'Sl 16,11 (Alegria plena)'],
    catechismReferences: ['§1716-1729 (A vocação à beatitude)'],
    magisteriumReferences: ['Gaudete et Exsultate n. 63-94 (Papa Francisco)'],
  },
  { term: 'Bem-aventuranças', definition: 'O cerne da pregação de Jesus, descrevendo a felicidade do Reino de Deus.', reference: 'Mt 5,3-12', category: 'Ensinamentos',
    deepInterpretation: 'As Bem-aventuranças são o autorretrato de Jesus. Cada uma delas revela uma face do seu coração e um caminho concreto de santidade para nós.',
    practicalApplication: 'Escolha uma Bem-aventurança por semana e viva-a intencionalmente no seu cotidiano.',
    bibleVerses: ['Mt 5,3-12 (Sermão da Montanha)', 'Lc 6,20-26 (Versão lucana)', 'Sl 1,1-2 (Feliz o homem)'],
    catechismReferences: ['§1716-1717 (As Bem-aventuranças)', '§1723 (A beatitude prometida)'],
    magisteriumReferences: ['Gaudete et Exsultate n. 63-94 (Papa Francisco)', 'Veritatis Splendor n. 16 (João Paulo II)'],
  },
  { term: 'Cântico dos Cânticos', definition: 'Livro bíblico que celebra o amor humano como reflexo do amor divino.', reference: 'Ct 1,1', category: 'Livros Bíblicos' },
  { term: 'Caridade', definition: 'A virtude teologal pela qual amamos a Deus sobre todas as coisas e ao próximo como a nós mesmos.', reference: '1Cor 13', category: 'Virtudes',
    deepInterpretation: 'A caridade é a "forma de todas as virtudes". Sem ela, as demais virtudes são vazias. É o amor sobrenatural que Deus derrama em nossos corações pelo Espírito Santo.',
    practicalApplication: 'Faça hoje um ato de caridade que custe algo a você: tempo, conforto ou orgulho.',
    bibleVerses: ['1Cor 13,1-13 (Hino da Caridade)', '1Jo 4,16 (Deus é amor)', 'Mt 25,35-40 (O que fizestes ao menor)'],
    catechismReferences: ['§1822-1829 (A Caridade)', '§1844 (A caridade, forma das virtudes)'],
    magisteriumReferences: ['Deus Caritas Est (Bento XVI)', 'Caritas in Veritate (Bento XVI)'],
  },
  { term: 'Cáritas', definition: 'O amor cristão traduzido em obras de misericórdia.', reference: '1Cor 13', category: 'Virtudes' },
  { term: 'Céu', definition: 'A morada eterna de Deus e dos que morrem na sua amizade.', reference: 'Ap 21,1-4', category: 'Escatologia',
    deepInterpretation: 'O céu não é um lugar geográfico, mas o estado de comunhão perfeita com Deus. É a plenitude de tudo o que o coração humano deseja: amor, verdade, beleza e paz sem fim.',
    practicalApplication: 'Viva cada dia como preparação para a eternidade. Pergunte-se: "Isso que faço hoje me aproxima do Céu?"',
    bibleVerses: ['Ap 21,1-4 (Novo céu e nova terra)', 'Jo 14,2-3 (Na casa do meu Pai)', '1Cor 2,9 (O que Deus preparou)'],
    catechismReferences: ['§1023-1029 (O Céu)', '§1024 (A visão beatífica)'],
    magisteriumReferences: ['Spe Salvi n. 10-12 (Bento XVI)', 'Lumen Gentium n. 48-51'],
  },
  { term: 'Cristo', definition: 'Título de Jesus que significa "Ungido", o Messias prometido.', reference: 'Mt 16,16', category: 'Cristologia',
    deepInterpretation: 'Cristo (do grego Christós) é a tradução do hebraico Mashiach (Messias). Jesus é o Ungido por excelência: Profeta, Sacerdote e Rei. Nele se cumprem todas as promessas do Antigo Testamento.',
    practicalApplication: 'Reconheça Cristo como o centro da sua vida. Deixe que Ele seja Senhor de todas as áreas.',
    bibleVerses: ['Mt 16,16 (Tu és o Cristo)', 'At 2,36 (Senhor e Cristo)', 'Jo 1,41 (Encontramos o Messias)'],
    catechismReferences: ['§436-440 (Cristo)', '§453 (O nome Cristo)'],
    magisteriumReferences: ['Redemptor Hominis (João Paulo II)'],
  },
  { term: 'Deus', definition: 'O Criador e Senhor de todas as coisas, Pai de todos os homens.', reference: 'Gn 1,1; 1Jo 4,8', category: 'Teologia',
    deepInterpretation: 'Deus é o Ser absoluto, infinitamente perfeito, que existe por si mesmo. Ele é ao mesmo tempo totalmente transcendente e intimamente presente em cada criatura. Deus é Amor.',
    practicalApplication: 'Dedique 10 minutos em silêncio hoje para simplesmente estar na presença de Deus.',
    bibleVerses: ['Gn 1,1 (No princípio Deus criou)', '1Jo 4,8 (Deus é amor)', 'Ex 3,14 (Eu Sou aquele que Sou)'],
    catechismReferences: ['§198-231 (Eu creio em Deus)', '§268-278 (Deus Todo-Poderoso)'],
    magisteriumReferences: ['Dei Verbum n. 2-6 (Vaticano II)', 'Fides et Ratio (João Paulo II)'],
  },
  { term: 'Diácono', definition: 'Ministro ordenado para o serviço da caridade e da palavra.', reference: 'At 6,1-6', category: 'Ministérios' },
  { term: 'Discípulo', definition: 'Aquele que segue Jesus e aprende seus ensinamentos.', reference: 'Mt 28,19', category: 'Seguimento',
    deepInterpretation: 'Ser discípulo não é apenas aprender doutrinas, mas seguir uma Pessoa. O discípulo de Jesus é chamado a transformar toda a sua vida segundo o exemplo do Mestre.',
    practicalApplication: 'Pergunte-se hoje: "Em que aspecto da minha vida ainda não sigo Jesus como discípulo?"',
    bibleVerses: ['Mt 28,19-20 (Ide e fazei discípulos)', 'Lc 14,27 (Carregar a cruz)', 'Jo 13,35 (Pelo amor vos conhecerão)'],
    catechismReferences: ['§520 (Cristo modelo do discípulo)', '§767 (A Igreja, comunidade de discípulos)'],
    magisteriumReferences: ['Evangelii Gaudium n. 119-121 (Papa Francisco)'],
  },
  { term: 'Dogma', definition: 'Verdade de fé infalivelmente definida pela Igreja.', reference: 'Catecismo §88', category: 'Doutrina',
    deepInterpretation: 'Os dogmas não são limitações à fé, mas luzes que iluminam o caminho. São verdades reveladas por Deus e proclamadas solenemente pela Igreja para proteger o depósito da fé.',
    practicalApplication: 'Estude um dogma da fé católica por semana. Descubra como cada verdade ilumina sua vida.',
    bibleVerses: ['1Tm 6,20 (Guardar o depósito)', 'Jd 1,3 (Fé transmitida uma vez)', '2Tm 1,14 (Guardar pelo Espírito Santo)'],
    catechismReferences: ['§88-90 (Os dogmas da fé)', '§84-87 (Magistério da Igreja)'],
    magisteriumReferences: ['Dei Verbum n. 10 (Vaticano II)'],
  },
  { term: 'Elias', definition: 'Um dos maiores profetas de Israel, arrebatado ao céu em um carro de fogo.', reference: '2Rs 2,11', category: 'Profetas' },
  { term: 'Esperança', definition: 'Virtude teologal pela qual desejamos o Reino dos céus e a vida eterna.', reference: 'Hb 10,23', category: 'Virtudes',
    deepInterpretation: 'A esperança cristã não é otimismo vago, mas certeza fundada nas promessas de Deus. É a âncora da alma que nos mantém firmes nas tempestades da vida.',
    practicalApplication: 'Em momentos de desânimo, leia as promessas de Deus na Escritura. A esperança se alimenta da Palavra.',
    bibleVerses: ['Hb 10,23 (Firmes na esperança)', 'Rm 8,24-25 (Esperamos com perseverança)', 'Hb 6,19 (Âncora da alma)'],
    catechismReferences: ['§1817-1821 (A Esperança)', '§1818 (A resposta ao desejo de felicidade)'],
    magisteriumReferences: ['Spe Salvi (Bento XVI)'],
  },
  { term: 'Espírito Santo', definition: 'A terceira pessoa da Santíssima Trindade, o Paráclito prometido por Jesus.', reference: 'Jo 14,26', category: 'Teologia',
    deepInterpretation: 'O Espírito Santo é o Amor entre o Pai e o Filho, que derrama em nós os dons divinos. Ele é quem vivifica a Igreja, inspira a oração e nos santifica.',
    practicalApplication: 'Invoque o Espírito Santo antes de cada decisão importante. Reze: "Vinde, Espírito Santo, enchei os corações."',
    bibleVerses: ['Jo 14,26 (O Paráclito)', 'At 2,1-4 (Pentecostes)', 'Rm 8,26 (O Espírito intercede por nós)'],
    catechismReferences: ['§683-747 (Creio no Espírito Santo)', '§1830-1832 (Dons e frutos do Espírito)'],
    magisteriumReferences: ['Dominum et Vivificantem (João Paulo II)'],
  },
  { 
    term: 'Eucaristia', 
    definition: 'O sacramento do Corpo e Sangue de Cristo, fonte e ápice da vida cristã.', 
    reference: 'Lc 22,19-20', 
    category: 'Sacramentos',
    deepInterpretation: 'A Eucaristia é o próprio sacrifício do Corpo e do Sangue do Senhor Jesus, que Ele instituiu para perpetuar o sacrifício da cruz ao longo dos séculos.',
    practicalApplication: 'A participação frequente na Missa e a adoração eucarística nos transformam naquilo que recebemos.',
    bibleVerses: ['Jo 6,51-58 (O Pão da Vida)', '1Cor 11,23-26 (A Instituição)', 'Lc 24,30-35 (Emaús)'],
    catechismReferences: ['§1322-1419 (O Sacramento da Eucaristia)', '§1324 (Fonte e Ápice)'],
    magisteriumReferences: ['Sacrosanctum Concilium n. 47-48', 'Ecclesia de Eucharistia (João Paulo II)'],
    journey_id: 'e7a1b2c3-d4e5-4000-8000-000000000002'
  },
  { term: 'Evangelização', definition: 'A missão de anunciar o Evangelho a todas as criaturas.', reference: 'Mc 16,15', category: 'Missão' },
  { 
    term: 'Fé', 
    definition: 'A virtude teologal pela qual cremos em Deus e em tudo o que Ele revelou.', 
    reference: 'Hb 11,1', 
    category: 'Virtudes',
    deepInterpretation: 'A fé é, antes de tudo, uma adesão pessoal do homem a Deus; é, ao mesmo tempo, o assentimento livre a toda a verdade que Deus revelou.',
    practicalApplication: 'Cultivar a fé através do estudo da Palavra, da oração constante e da prática da caridade.',
    bibleVerses: ['Hb 11 (Os heróis da fé)', 'Rm 1,17 (O justo viverá pela fé)', 'Tg 2,14-26 (Fé e Obras)'],
    catechismReferences: ['§142-184 (A Resposta do homem a Deus)', '§1814-1816 (A virtude da Fé)'],
    magisteriumReferences: ['Lumen Fidei (Papa Francisco)', 'Fides et Ratio (João Paulo II)'],
    journey_id: 'a0a0a0a0-0002-4000-8000-000000000001'
  },
  { term: 'Franciscano', definition: 'Relativo à ordem religiosa fundada por São Francisco de Assis.', reference: 'Tradição', category: 'Ordens Religiosas' },
  { term: 'Gênesis', definition: 'Primeiro livro da Bíblia, que narra as origens do mundo e da humanidade.', reference: 'Gn 1,1', category: 'Livros Bíblicos' },
  { term: 'Gloria', definition: 'O resplendor da santidade e majestade de Deus.', reference: 'Ex 33,18-23', category: 'Teologia' },
  { 
    term: 'Graça', 
    definition: 'O dom gratuito de Deus que nos torna participantes da sua vida divina.', 
    reference: 'Ef 2,8', 
    category: 'Teologia',
    deepInterpretation: 'A graça é o favor imerecido de Deus, a ajuda gratuita que Ele nos dá para responder ao seu chamado. É a participação na vida de Deus.',
    practicalApplication: 'Reconheça os dons gratuitos de Deus na sua vida. Peça a graça de cooperar com Ele.',
    bibleVerses: ['Ef 2,8-9 (Salvos pela graça)', 'Jo 1,16 (Graça sobre graça)', '2Cor 12,9 (A graça basta)'],
    catechismReferences: ['§1996-2005 (A Graça)', '§2000 (Graça santificante)'],
    magisteriumReferences: ['Gaudete et Exsultate (Papa Francisco)'],
    journey_id: 'e7a1b2c3-d4e5-4000-8000-000000000001'
  },
  { term: 'Heresia', definition: 'A negação ou dúvida obstinada de uma verdade que se deve crer com fé divina e católica.', reference: 'Doutrina', category: 'Moral' },
  { term: 'Humildade', definition: 'Virtude que consiste no reconhecimento da própria pequenez diante de Deus.', reference: 'Tg 4,6', category: 'Virtudes',
    deepInterpretation: 'A humildade é a verdade sobre nós mesmos: somos criaturas amadas por Deus. Não é rebaixamento, mas reconhecimento de que tudo o que somos e temos vem de Deus.',
    practicalApplication: 'Pratique um ato de humildade hoje: peça desculpas, sirva sem ser visto, ou reconheça um erro.',
    bibleVerses: ['Tg 4,6 (Deus resiste aos soberbos)', 'Lc 1,52 (Derrubou os poderosos)', 'Fl 2,3-4 (Considerar os outros superiores)'],
    catechismReferences: ['§2540 (A humildade contra a inveja)', '§2559 (A humildade, fundamento da oração)'],
    magisteriumReferences: ['Gaudete et Exsultate n. 98-99 (Papa Francisco)'],
  },
  { term: 'Ídolo', definition: 'Qualquer coisa que ocupe o lugar de Deus no coração do homem.', reference: 'Ex 20,3-5', category: 'Moral',
    deepInterpretation: 'Ídolos modernos incluem dinheiro, poder, fama, prazer e até a própria imagem. Tudo o que amamos mais do que a Deus se torna um ídolo que escraviza.',
    practicalApplication: 'Examine: o que ocupa o primeiro lugar no seu coração? Se não é Deus, identifique o ídolo e renuncie a ele.',
    bibleVerses: ['Ex 20,3-5 (Não terás outros deuses)', '1Jo 5,21 (Guardai-vos dos ídolos)', 'Mt 6,24 (Não podeis servir a dois senhores)'],
    catechismReferences: ['§2110-2128 (O primeiro mandamento)', '§2113 (A idolatria)'],
    magisteriumReferences: ['Evangelii Gaudium n. 55-56 (Papa Francisco)'],
  },
  { 
    term: 'Igreja', 
    definition: 'O Povo de Deus reunido em Cristo, Corpo Místico de Cristo.', 
    reference: 'Mt 16,18', 
    category: 'Eclesiologia',
    deepInterpretation: 'A Igreja é o mistério da união dos homens com Deus e da unidade de todo o gênero humano.',
    practicalApplication: 'Ser Igreja hoje é viver em comunhão com o Papa e os Bispos, participando ativamente da paróquia.',
    bibleVerses: ['Mt 16,18 (Fundação)', 'Ef 1,22-23 (Corpo de Cristo)', '1Tm 3,15 (Coluna da verdade)'],
    catechismReferences: ['§748-959 (A Igreja no plano de Deus)'],
    magisteriumReferences: ['Lumen Gentium (Vaticano II)'],
    journey_id: 'b1b1b1b1-0002-4000-8000-000000000001'
  },
  { term: 'Imaculada Conceição', definition: 'O dogma de que Maria foi preservada do pecado original desde o primeiro instante de sua existência.', reference: 'Dogma', category: 'Mariologia' },
  { term: 'Isabel', definition: 'Mãe de João Batista e parente de Maria.', reference: 'Lc 1,5', category: 'Personagens Bíblicos' },
  { term: 'Jerusalém', definition: 'A cidade santa, centro da vida religiosa de Israel e símbolo da Igreja triunfante.', reference: 'Sl 122', category: 'Geografia Bíblica' },
  { 
    term: 'Jesus', 
    definition: 'O Filho de Deus feito homem para a nossa salvação.', 
    reference: 'Mt 1,21', 
    category: 'Cristologia',
    deepInterpretation: 'Jesus Cristo é verdadeiro Deus e verdadeiro homem, na unidade de sua Pessoa divina.',
    practicalApplication: 'Seguir a Jesus significa imitá-lo no amor, no serviço e na obediência ao Pai.',
    bibleVerses: ['Jo 1,1-14 (O Verbo encarnado)', 'Mt 16,16 (Confissão de Pedro)', 'Fl 2,5-11 (O hino cristológico)'],
    catechismReferences: ['§422-682 (Creio em Jesus Cristo)'],
    magisteriumReferences: ['Dignitatis Humanae n. 11'],
    journey_id: 'b1b1b1b1-0004-4000-8000-000000000001'
  },
  { term: 'Job', definition: 'O homem justo que sofreu provações imensas mas manteve sua fé em Deus.', reference: 'Jó 1', category: 'Personagens Bíblicos' },
  { term: 'Kerygma', definition: 'O anúncio fundamental da mensagem cristã: a morte e ressurreição de Jesus.', reference: 'At 2,22-24', category: 'Teologia' },
  { term: 'Lázaro', definition: 'O amigo de Jesus que foi ressuscitado após quatro dias no túmulo.', reference: 'Jo 11', category: 'Personagens Bíblicos' },
  { term: 'Lei', definition: 'Os mandamentos dados por Deus a Moisés para guiar o povo.', reference: 'Ex 20', category: 'Moral' },
  { term: 'Liturgia', definition: 'O culto público e oficial da Igreja.', reference: 'Liturgia', category: 'Liturgia' },
  { 
    term: 'Maria', 
    definition: 'A mãe de Jesus e mãe da Igreja, cheia de graça.', 
    reference: 'Lc 1,26-38', 
    category: 'Mariologia',
    deepInterpretation: 'Maria é a Mãe de Deus (Theotokos) por ter concebido pelo Espírito Santo o Filho de Deus feito homem.',
    practicalApplication: 'Consagrar-se a Maria é permitir que ela nos leve a Jesus.',
    bibleVerses: ['Lc 1,26-38 (Anunciação)', 'Jo 19,25-27 (Aos pés da cruz)', 'Ap 12,1 (A Mulher vestida de sol)'],
    catechismReferences: ['§484-511 (Maria, Mãe de Cristo)', '§963-975 (Maria, Mãe da Igreja)'],
    magisteriumReferences: ['Marialis Cultus (Paulo VI)', 'Redemptoris Mater (João Paulo II)'],
    journey_id: 'b1b1b1b1-0003-4000-8000-000000000001'
  },
  { term: 'Missa', definition: 'A celebração do sacrifício eucarístico da Igreja.', reference: '1Cor 11,23-26', category: 'Liturgia' },
  { term: 'Misticismo', definition: 'A busca pela união íntima e direta com o divino através da oração e contemplação.', reference: 'Espiritualidade', category: 'Espiritualidade' },
  { term: 'Moisés', definition: 'O grande profeta e legislador que libertou Israel do Egito.', reference: 'Ex 3', category: 'Patriarcas' },
  { term: 'Natal', definition: 'Celebração do nascimento de Jesus Cristo, o Verbo encarnado.', reference: 'Lc 2,1-20', category: 'Liturgia' },
  { term: 'Noé', definition: 'O patriarca que construiu a arca para salvar sua família e os animais do dilúvio.', reference: 'Gn 6-9', category: 'Patriarcas' },
  { 
    term: 'Oração', 
    definition: 'O diálogo de amor entre o homem e Deus.', 
    reference: 'Mt 6,5-15', 
    category: 'Espiritualidade',
    deepInterpretation: 'A oração é a elevação da alma a Deus ou o pedido a Deus de bens convenientes. É um dom da graça e uma resposta decidida da nossa parte.',
    practicalApplication: 'Estabelecer momentos fixos de oração diária, como o oferecimento do dia, o Rosário ou a Lectio Divina.',
    bibleVerses: ['Mt 6,5-15 (O Pai Nosso)', 'Lc 18,1 (Orar sem cessar)', '1Ts 5,17 (Rezai sem interrupção)'],
    catechismReferences: ['§2558-2865 (A Oração Cristã)'],
    magisteriumReferences: ['Novo Millennio Ineunte n. 32-34', 'Verbum Domini (Bento XVI)'],
    journey_id: 'e7a1b2c3-d4e5-4000-8000-000000000003'
  },
  { term: 'Orgulho', definition: 'O pecado de se considerar superior a Deus e aos outros.', reference: 'Pr 16,18', category: 'Moral',
    deepInterpretation: 'O orgulho é o primeiro pecado e a raiz de todos os outros. Foi o pecado de Lúcifer e de Adão. É colocar-se no lugar de Deus, achando que não precisamos Dele.',
    practicalApplication: 'Identifique uma área onde seu orgulho o impede de pedir ajuda ou de se reconciliar.',
    bibleVerses: ['Pr 16,18 (O orgulho precede a ruína)', 'Is 14,12-15 (A queda de Lúcifer)', 'Lc 18,9-14 (O fariseu e o publicano)'],
    catechismReferences: ['§1866 (O orgulho, pecado capital)', '§2540 (Orgulho e inveja)'],
    magisteriumReferences: ['Gaudete et Exsultate n. 97 (Papa Francisco)'],
  },
  { term: 'Parábola', definition: 'História contada por Jesus para ensinar verdades espirituais.', reference: 'Mt 13', category: 'Ensinamentos',
    deepInterpretation: 'As parábolas são a pedagogia de Jesus: histórias simples que escondem verdades profundas. Quem tem ouvidos para ouvir, ouve. Elas revelam o mistério do Reino àqueles que buscam com o coração.',
    practicalApplication: 'Leia uma parábola hoje e pergunte-se: "Em qual personagem eu me reconheço?"',
    bibleVerses: ['Mt 13,1-23 (O Semeador)', 'Lc 15,11-32 (O Filho Pródigo)', 'Mt 25,1-13 (As Dez Virgens)'],
    catechismReferences: ['§546 (O convite ao Reino pelas parábolas)'],
    magisteriumReferences: ['Verbum Domini n. 74 (Bento XVI)'],
  },
  { term: 'Páscoa', definition: 'A passagem de Jesus da morte para a vida, fundamento da nossa fé.', reference: '1Cor 15,3-4', category: 'Liturgia',
    deepInterpretation: 'A Páscoa cristã é o cumprimento da Páscoa judaica: a passagem definitiva da escravidão do pecado para a liberdade dos filhos de Deus, através da morte e ressurreição de Cristo.',
    practicalApplication: 'Viva cada domingo como uma mini-Páscoa: celebre a vitória de Cristo sobre a morte.',
    bibleVerses: ['1Cor 15,3-4 (Cristo morreu e ressuscitou)', 'Ex 12 (A primeira Páscoa)', 'Jo 20,1-10 (O túmulo vazio)'],
    catechismReferences: ['§1163-1167 (O Tríduo Pascal)', '§571-573 (O mistério pascal)'],
    magisteriumReferences: ['Sacrosanctum Concilium n. 5-6 (Vaticano II)'],
  },
  { term: 'Pecado', definition: 'Uma ofensa a Deus, uma falta contra a razão, a verdade e a consciência reta.', reference: 'Rm 3,23', category: 'Moral',
    deepInterpretation: 'O pecado não é apenas uma transgressão de regras, mas uma ruptura na relação com Deus, consigo mesmo e com os outros. É escolher o "eu" em vez de Deus.',
    practicalApplication: 'Faça um exame de consciência honesto. Identifique não apenas atos, mas atitudes e omissões.',
    bibleVerses: ['Rm 3,23 (Todos pecaram)', 'Gn 3 (O pecado original)', '1Jo 1,8-9 (Se confessarmos)'],
    catechismReferences: ['§1846-1876 (O Pecado)', '§1849 (Definição de pecado)'],
    magisteriumReferences: ['Reconciliatio et Paenitentia (João Paulo II)'],
  },
  { term: 'Pentecostes', definition: 'A descida do Espírito Santo sobre os apóstolos reunidos no Cenáculo.', reference: 'At 2,1-4', category: 'Liturgia',
    deepInterpretation: 'Pentecostes é o nascimento da Igreja. O Espírito Santo transforma homens medrosos em apóstolos corajosos. É a força que continua agindo hoje em cada batizado.',
    practicalApplication: 'Peça os dons do Espírito Santo para sua missão de hoje: sabedoria, fortaleza, conselho.',
    bibleVerses: ['At 2,1-4 (A descida do Espírito)', 'Jo 20,22 (Recebei o Espírito Santo)', 'At 1,8 (Sereis minhas testemunhas)'],
    catechismReferences: ['§731-741 (O Espírito e a Igreja)', '§1302-1305 (Confirmação)'],
    magisteriumReferences: ['Dominum et Vivificantem (João Paulo II)'],
  },
  { term: 'Perdão', definition: 'O ato de liberdade pelo qual deixamos ir a ofensa e abrimos espaço para a reconciliação com Deus e com o próximo.', reference: 'Mt 6,14-15', category: 'Moral',
    deepInterpretation: 'Perdoar é participar do próprio coração de Deus. "Perdoai-nos as nossas ofensas, assim como nós perdoamos a quem nos tem ofendido." O perdão não é esquecimento, mas liberdade.',
    practicalApplication: 'Pense em alguém que o magoou. Reze por essa pessoa hoje. Peça a graça de perdoar.',
    bibleVerses: ['Mt 18,21-22 (Setenta vezes sete)', 'Lc 23,34 (Pai, perdoai-lhes)', 'Cl 3,13 (Perdoai-vos mutuamente)'],
    catechismReferences: ['§2838-2845 (Perdoai-nos as nossas ofensas)'],
    magisteriumReferences: ['Dives in Misericordia (João Paulo II)'],
    journey_id: 'a0a0a0a0-0003-4000-8000-000000000001'
  },
  { term: 'Profeta', definition: 'Aquele que fala em nome de Deus para o povo.', reference: 'Is 1,1', category: 'Ministérios' },
  { term: 'Purgatório', definition: 'Estado de purificação final dos que morrem na amizade de Deus.', reference: '2Mc 12,45', category: 'Escatologia',
    deepInterpretation: 'O Purgatório não é castigo, mas purificação amorosa. É a misericórdia de Deus que nos prepara para contemplá-Lo face a face, removendo tudo o que ainda nos impede da comunhão plena.',
    practicalApplication: 'Reze pelos fiéis defuntos. Ofereça sacrifícios e Missas por aqueles que se purificam.',
    bibleVerses: ['2Mc 12,45-46 (Oração pelos mortos)', '1Cor 3,13-15 (Purificado pelo fogo)', 'Mt 12,32 (Perdão no outro mundo)'],
    catechismReferences: ['§1030-1032 (A purificação final)', '§1472 (As penas do pecado)'],
    magisteriumReferences: ['Spe Salvi n. 45-48 (Bento XVI)'],
  },
  { term: 'Quaresma', definition: 'Tempo de preparação de quarenta dias para a celebração da Páscoa.', reference: 'Mt 4,1-11', category: 'Liturgia' },
  { term: 'Querubim', definition: 'Classe de seres angelicais associados à presença e glória de Deus.', reference: 'Ez 10', category: 'Seres Celestiais' },
  { term: 'Reino de Deus', definition: 'A soberania de Deus que se manifesta na justiça, paz e alegria.', reference: 'Mc 1,15', category: 'Ensinamentos',
    deepInterpretation: 'O Reino de Deus não é um lugar, mas o reinado de Deus no coração dos homens. Já começou com Jesus e se consumará na glória. Cada ato de amor, justiça e verdade é uma semente deste Reino.',
    practicalApplication: 'Faça do seu ambiente de trabalho, família e comunidade um pedaço do Reino de Deus.',
    bibleVerses: ['Mc 1,15 (O Reino está próximo)', 'Mt 13,31-32 (O grão de mostarda)', 'Lc 17,21 (O Reino está no meio de vós)'],
    catechismReferences: ['§541-556 (O anúncio do Reino)', '§2816-2821 (Venha o vosso Reino)'],
    magisteriumReferences: ['Redemptoris Missio n. 12-20 (João Paulo II)'],
  },
  { term: 'Religião', definition: 'O conjunto de crenças e práticas que ligam o homem a Deus.', reference: 'Tg 1,27', category: 'Teologia' },
  { term: 'Ressurreição', definition: 'A vitória de Cristo sobre a morte e a promessa da nossa própria vida eterna.', reference: 'Jo 11,25-26', category: 'Escatologia',
    deepInterpretation: 'A Ressurreição de Cristo é o evento central da fé cristã. Sem ela, nossa fé seria vã. Ela garante que a morte não é o fim e que participaremos da vida gloriosa de Cristo.',
    practicalApplication: 'Viva como ressuscitado: não tema a morte, não se desespere nas provações, tenha esperança inabalável.',
    bibleVerses: ['Jo 11,25-26 (Eu sou a Ressurreição)', '1Cor 15,14 (Se Cristo não ressuscitou)', 'Rm 6,4 (Vida nova)'],
    catechismReferences: ['§638-658 (A Ressurreição de Cristo)', '§988-1004 (A ressurreição da carne)'],
    magisteriumReferences: ['Lumen Gentium n. 48-51'],
  },
  { term: 'Romanos', definition: 'Uma das principais cartas de São Paulo, tratando da justificação pela fé.', reference: 'Rm 1,1', category: 'Livros Bíblicos' },
  { term: 'Sábado', definition: 'O dia de descanso consagrado a Deus no Antigo Testamento.', reference: 'Ex 20,8-11', category: 'Lei' },
  { term: 'Sacrifício', definition: 'Oferta feita a Deus como sinal de adoração e entrega.', reference: 'Hb 9,11-14', category: 'Teologia',
    deepInterpretation: 'O sacrifício de Cristo na Cruz é o único e perfeito sacrifício que reconcilia a humanidade com Deus. Todos os sacrifícios do AT eram prefigurações deste ato supremo de amor.',
    practicalApplication: 'Ofereça seu trabalho, sofrimento e alegrias de hoje como sacrifício espiritual unido ao de Cristo.',
    bibleVerses: ['Hb 9,11-14 (O sacrifício perfeito)', 'Rm 12,1 (Sacrifício vivo)', 'Is 53,4-5 (O Servo Sofredor)'],
    catechismReferences: ['§606-618 (O sacrifício redentor de Cristo)', '§2099-2100 (O sacrifício na oração)'],
    magisteriumReferences: ['Ecclesia de Eucharistia n. 11-13 (João Paulo II)'],
  },
  { term: 'Salvação', definition: 'A libertação do pecado e a vida eterna oferecidas por Cristo.', reference: 'At 4,12', category: 'Soteriologia',
    deepInterpretation: 'A salvação é dom gratuito de Deus em Cristo. Não é conquista humana, mas acolhimento do amor que salva. Inclui não apenas a alma, mas a pessoa inteira em todas as suas dimensões.',
    practicalApplication: 'Agradeça a Deus pela salvação recebida. Compartilhe esta Boa Nova com alguém hoje.',
    bibleVerses: ['At 4,12 (Não há outro nome)', 'Jo 3,16 (Deus amou o mundo)', 'Ef 2,8-9 (Salvos pela graça)'],
    catechismReferences: ['§430-435 (Jesus, Salvador)', '§599-618 (Cristo morreu por nós)'],
    magisteriumReferences: ['Redemptoris Missio (João Paulo II)'],
  },
  { term: 'Sinagoga', definition: 'Lugar de reunião e oração para os judeus.', reference: 'Lc 4,16', category: 'Lugares Sagrados' },
  { term: 'Tabernáculo', definition: 'O lugar onde se guarda o Santíssimo Sacramento.', reference: 'Catecismo §1183', category: 'Objetos Sagrados' },
  { term: 'Teologia', definition: 'O estudo sistemático sobre Deus e as verdades da fé.', reference: 'Teologia', category: 'Ciência Sagrada' },
  { term: 'Trindade', definition: 'O mistério de um só Deus em três pessoas distintas: Pai, Filho e Espírito Santo.', reference: 'Mt 28,19', category: 'Teologia',
    deepInterpretation: 'A Trindade é o mistério central da fé cristã. Deus não é solidão, mas comunhão de amor: o Pai que ama, o Filho que é amado, e o Espírito Santo que é o Amor entre ambos.',
    practicalApplication: 'Viva a comunhão trinitária no seu dia: ame como o Pai, sirva como o Filho, inspire como o Espírito.',
    bibleVerses: ['Mt 28,19 (Em nome do Pai, Filho e Espírito)', '2Cor 13,13 (A bênção trinitária)', 'Jo 14,16-17 (O Pai enviará o Espírito)'],
    catechismReferences: ['§232-267 (A Santíssima Trindade)', '§253-256 (As Pessoas divinas)'],
    magisteriumReferences: ['Dominum et Vivificantem (João Paulo II)', 'Lumen Fidei n. 28 (Papa Francisco)'],
  },
  { term: 'Unção', definition: 'Gesto de consagrar algo ou alguém derramando óleo.', reference: 'Tg 5,14-15', category: 'Sacramentos' },
  { term: 'Urim e Tumim', definition: 'Objetos usados pelos sacerdotes de Israel para consultar a vontade de Deus.', reference: 'Ex 28,30', category: 'Objetos Sagrados' },
  { term: 'Vaticano', definition: 'O centro administrativo e espiritual da Igreja Católica.', reference: 'Eclesiologia', category: 'Eclesiologia' },
  { term: 'Verbo', definition: 'A Palavra eterna de Deus que se fez carne em Jesus Cristo.', reference: 'Jo 1,1-14', category: 'Cristologia',
    deepInterpretation: 'O Logos (Verbo) é a segunda Pessoa da Trindade. Ele é a Palavra criadora de Deus, pela qual todas as coisas foram feitas. Na Encarnação, o infinito se fez finito para nos salvar.',
    practicalApplication: 'Leia o Prólogo de João (Jo 1,1-14) meditando em cada frase. Deixe o Verbo habitar em você.',
    bibleVerses: ['Jo 1,1-14 (No princípio era o Verbo)', 'Hb 1,1-3 (Deus falou pelo Filho)', 'Cl 1,15-17 (Imagem do Deus invisível)'],
    catechismReferences: ['§241-242 (O Filho, o Verbo)', '§456-460 (O Verbo se fez carne)'],
    magisteriumReferences: ['Verbum Domini (Bento XVI)'],
  },
  { term: 'Vulgata', definition: 'A tradução da Bíblia para o latim feita por São Jerônimo.', reference: 'História da Igreja', category: 'Tradição' },
  { term: 'Xerxes', definition: 'Rei da Pérsia mencionado no livro de Ester.', reference: 'Et 1,1', category: 'Personagens Bíblicos' },
  { term: 'Yaveh', definition: 'O nome próprio de Deus revelado a Moisés no deserto.', reference: 'Ex 3,14', category: 'Teologia',
    deepInterpretation: '"Eu Sou aquele que Sou" — o nome de Deus revela que Ele é o Ser absoluto, sempre presente, sempre fiel. YHWH é o Deus que está conosco, em todas as circunstâncias.',
    practicalApplication: 'Invoque o nome de Deus nos momentos difíceis. Ele é "Eu Sou" — presente no seu agora.',
    bibleVerses: ['Ex 3,14 (Eu Sou aquele que Sou)', 'Jo 8,58 (Antes de Abraão, Eu Sou)', 'Ap 1,8 (O Alfa e Ômega)'],
    catechismReferences: ['§203-213 (Deus revela seu nome)', '§206 (Eu Sou)'],
    magisteriumReferences: ['Dei Verbum n. 2 (Vaticano II)'],
  },
  { term: 'Zacarias', definition: 'Pai de João Batista, que ficou mudo até o nascimento de seu filho.', reference: 'Lc 1,5-25', category: 'Personagens Bíblicos' },
  { term: 'Zaqueu', definition: 'O cobrador de impostos que subiu num sicômoro para ver Jesus e teve sua vida transformada.', reference: 'Lc 19,1-10', category: 'Personagens Bíblicos',
    deepInterpretation: 'Zaqueu é o retrato de todo pecador que busca Jesus. Apesar da multidão e dos obstáculos, ele encontra um jeito de ver o Mestre — e Jesus o vê primeiro. A conversão nasce do encontro pessoal.',
    practicalApplication: 'Qual é o seu "sicômoro"? O que você precisa fazer para se encontrar com Jesus hoje?',
    bibleVerses: ['Lc 19,1-10 (A conversão de Zaqueu)', 'Lc 5,27-32 (A vocação de Levi)', 'Mt 9,13 (Misericórdia quero)'],
    catechismReferences: ['§545 (Jesus e os pecadores)', '§1443 (A conversão e o perdão)'],
    magisteriumReferences: ['Evangelii Gaudium n. 3 (Papa Francisco)'],
  },
  { term: 'Zelo', definition: 'Ardor e dedicação profunda às coisas de Deus.', reference: 'Sl 69,9', category: 'Espiritualidade',
    deepInterpretation: 'O zelo santo é o fogo do amor de Deus que arde no coração do crente, impulsionando-o à missão. É diferente do fanatismo: nasce do amor, não do medo.',
    practicalApplication: 'Renove o seu zelo: faça algo concreto pela evangelização hoje, mesmo que pequeno.',
    bibleVerses: ['Sl 69,9 (O zelo da tua casa me consome)', 'Rm 12,11 (Fervorosos no espírito)', 'Ap 3,15-16 (Nem frio nem quente)'],
    catechismReferences: ['§2442 (Zelo pela justiça)'],
    magisteriumReferences: ['Evangelii Nuntiandi (Paulo VI)'],
  },
];

/* Featured terms shown as highlight bubbles */
const FEATURED_TERMS = ['Amor', 'Fé', 'Graça', 'Eucaristia', 'Trindade', 'Perdão'];

const AZFaithPage: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedLetter, setSelectedLetter] = useState<string | null>('A');
  const [selectedTerm, setSelectedTerm] = useState<FaithTerm | null>(null);
  const [quizMode, setQuizMode] = useState(false);

  const detailRef = useRef<HTMLDivElement>(null);
  const alphabet = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'.split('');
  
  useEffect(() => {
    if (selectedTerm && window.innerWidth < 768) {
      setTimeout(() => {
        detailRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }, 100);
    }
  }, [selectedTerm]);



  const letterStatus = useMemo(() => {
    const status: Record<string, boolean> = {};
    alphabet.forEach(l => {
      status[l] = FAITH_TERMS.some(t => t.term.toUpperCase().startsWith(l));
    });
    return status;
  }, []);

  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const q = params.get('q');
    if (q) {
      setSearchQuery(q);
      setSelectedLetter(null);
      
      const exactMatch = FAITH_TERMS.find(t => t.term.toLowerCase() === q.toLowerCase());
      if (exactMatch) {
        setSelectedTerm(exactMatch);
      }
    }
  }, [location.search]);


  const filteredTerms = useMemo(() => {
    let result = FAITH_TERMS;
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      result = result.filter(t =>
        t.term.toLowerCase().includes(q) ||
        t.definition.toLowerCase().includes(q) ||
        t.category?.toLowerCase().includes(q)
      );
    } else if (selectedLetter) {
      result = result.filter(t => t.term.toUpperCase().startsWith(selectedLetter));
    }
    return result.sort((a, b) => a.term.localeCompare(b.term));
  }, [searchQuery, selectedLetter]);

  const handleLetterClick = (letter: string) => {
    setSelectedLetter(letter);
    setSearchQuery('');
    setSelectedTerm(null);
  };

  const handleTermClick = (term: FaithTerm) => {
    setSelectedTerm(selectedTerm?.term === term.term ? null : term);
  };

  return (
    <>
      <SEOHead
        title="A–Z da Fé | Cathedra"
        description="Explore o índice alfabético de termos bíblicos e teológicos."
        path="/az-faith"
      />

      <div className="max-w-5xl mx-auto pb-24 px-4 md:px-0 animate-in fade-in duration-500">
        {/* Header */}
        <header className="text-center space-y-3 pt-6 mb-8">
          <div className="inline-flex items-center gap-2 px-3 py-1 bg-primary/5 rounded-full border border-primary/10">
            <BookOpen className="w-3.5 h-3.5 text-primary" />
            <span className="text-[9px] font-black uppercase tracking-[0.2em] text-primary">Índice Alfabético</span>
          </div>
          <h1 className="text-3xl md:text-4xl font-black tracking-tight text-foreground">A–Z da Fé</h1>
          <Button
            variant={quizMode ? 'default' : 'outline'}
            onClick={() => setQuizMode(!quizMode)}
            className="rounded-2xl gap-2 font-bold text-xs uppercase tracking-widest mt-2"
          >
            <Brain className="w-4 h-4" />
            {quizMode ? 'Voltar ao Índice' : '🧠 Testar Conhecimento'}
          </Button>
        </header>

        {quizMode ? (
          <AZFaithQuiz terms={FAITH_TERMS} onClose={() => setQuizMode(false)} />
        ) : (
        <>
        {/* Search */}
        <div className="relative max-w-lg mx-auto mb-6">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <input
            type="text"
            placeholder="Buscar..."
            value={searchQuery}
            onChange={(e) => {
              setSearchQuery(e.target.value);
              if (e.target.value) setSelectedLetter(null);
            }}
            className="w-full pl-11 pr-10 py-3 bg-card border border-border rounded-2xl focus:outline-none focus:ring-2 focus:ring-primary/30 text-sm"
          />
          {searchQuery && (
            <button onClick={() => setSearchQuery('')} className="absolute right-4 top-1/2 -translate-y-1/2">
              <X className="w-4 h-4 text-muted-foreground" />
            </button>
          )}
        </div>

        {/* Featured Bubbles */}
        <div className="flex justify-center gap-3 mb-6 flex-wrap">
          {FEATURED_TERMS.map(name => {
            const term = FAITH_TERMS.find(t => t.term === name);
            if (!term) return null;
            const isActive = selectedTerm?.term === name;
            return (
              <motion.button
                key={name}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => handleTermClick(term)}
                className={`px-5 py-2 rounded-full text-sm font-bold border transition-all
                  ${isActive
                    ? 'bg-primary text-primary-foreground border-primary shadow-lg'
                    : 'bg-primary/5 text-primary border-primary/20 hover:bg-primary/10'
                  }`}
              >
                🫧 {name}
              </motion.button>
            );
          })}
        </div>

        {/* Alphabet Bar */}
        <div className="flex justify-center gap-1.5 flex-wrap mb-8 px-2">
          {alphabet.map(letter => {
            const has = letterStatus[letter];
            const isActive = selectedLetter === letter;
            return (
              <button
                key={letter}
                onClick={() => has && handleLetterClick(letter)}
                disabled={!has}
                className={`w-8 h-8 rounded-lg text-xs font-black transition-all
                  ${isActive
                    ? 'bg-primary text-primary-foreground shadow-md'
                    : has
                      ? 'bg-card border border-border text-foreground hover:border-primary/40 hover:text-primary'
                      : 'opacity-15 cursor-not-allowed'
                  }`}
              >
                {letter}
              </button>
            );
          })}
        </div>

        {/* Main Content: List + Detail */}
        <div className="grid grid-cols-1 md:grid-cols-12 gap-6 min-h-[400px]">
          {/* Term List */}
          <div className="md:col-span-4 space-y-1 max-h-[60vh] overflow-y-auto pr-2 scrollbar-thin">
            {filteredTerms.length === 0 && (
              <p className="text-center text-muted-foreground text-sm py-8 italic">Nenhum termo encontrado.</p>
            )}
            {filteredTerms.map(t => {
              const isActive = selectedTerm?.term === t.term;
              return (
                <button
                  key={t.term}
                  onClick={() => handleTermClick(t)}
                  className={`w-full text-left px-4 py-3 rounded-xl transition-all flex items-center justify-between group
                    ${isActive
                      ? 'bg-primary/10 border border-primary/20 text-foreground'
                      : 'hover:bg-muted/50 text-foreground/80'
                    }`}
                >
                  <span className="font-semibold text-sm truncate">{t.term}</span>
                  <ChevronRight className={`w-4 h-4 shrink-0 transition-transform ${isActive ? 'text-primary rotate-90' : 'text-muted-foreground/40 group-hover:text-muted-foreground'}`} />
                </button>
              );
            })}
          </div>

          {/* Detail Panel */}
          <div className="md:col-span-8" ref={detailRef}>
            <AnimatePresence mode="wait">
              {!selectedTerm ? (
                <motion.div
                  key="empty"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="h-full flex flex-col items-center justify-center text-center p-8 bg-muted/10 rounded-3xl border border-dashed border-border/40"
                >
                  <Sparkles className="h-10 w-10 text-primary/30 mb-4" />
                  <h3 className="text-xl font-bold text-foreground mb-2">Selecione um termo</h3>
                  <p className="text-muted-foreground text-sm">Escolha um termo da lista para explorar sua profundidade teológica.</p>
                </motion.div>
              ) : (
                <motion.div
                  key={selectedTerm.term}
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  transition={{ type: 'spring', damping: 25, stiffness: 250 }}
                  className="bg-card border border-border rounded-3xl p-6 md:p-8 space-y-6 shadow-sm"
                >
                  {/* Term Header */}
                  <div>
                    <Badge variant="secondary" className="bg-primary/10 text-primary border-none text-[9px] uppercase tracking-[0.15em] font-black mb-2">
                      {selectedTerm.category || 'Conceito'}
                    </Badge>
                    <h2 className="text-3xl md:text-4xl font-black text-foreground tracking-tight">
                      🫧 {selectedTerm.term}
                    </h2>
                  </div>

                  {/* Definition */}
                  <div className="space-y-1">
                    <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Definição</p>
                    <p className="text-foreground/90 leading-relaxed text-base font-medium italic">
                      {selectedTerm.definition}
                    </p>
                  </div>

                  {/* Bible */}
                  {(selectedTerm.bibleVerses || selectedTerm.reference) && (
                    <div className="bg-blue-500/5 border border-blue-500/10 rounded-2xl p-4 space-y-2">
                      <div className="flex items-center gap-2">
                        <Book className="w-4 h-4 text-blue-600" />
                        <p className="text-[10px] font-black uppercase tracking-widest text-blue-600">📖 Bíblia</p>
                      </div>
                      <div className="flex flex-wrap gap-2">
                        {(selectedTerm.bibleVerses || [selectedTerm.reference!]).map((v, idx) => {
                          const segments = parseBibleReferences(v);
                          const bibleSeg = segments.find(s => s.type === 'bibleRef');
                          if (bibleSeg && bibleSeg.abbr) {
                            return (
                              <BibleVersePopover
                                 key={`${v}-${idx}`}
                                abbr={bibleSeg.abbr}
                                chapter={bibleSeg.chapter!}
                                verse={bibleSeg.verse}
                                label={v}
                                onNavigate={(abbr, chapter) => navigate(`${AppRoute.BIBLE}?book=${abbr}&chapter=${chapter}`)}
                              />
                            );
                          }
                          return (
                            <Badge key={idx} variant="outline" className="bg-blue-500/5 text-blue-700 dark:text-blue-400 border-blue-500/20 rounded-full text-xs font-semibold">
                              {v}
                            </Badge>
                          );
                        })}
                      </div>
                    </div>
                  )}

                  {/* Catechism */}
                  {selectedTerm.catechismReferences && (
                    <div className="bg-amber-500/5 border border-amber-500/10 rounded-2xl p-4 space-y-2">
                      <div className="flex items-center gap-2">
                        <Bookmark className="w-4 h-4 text-amber-600" />
                        <p className="text-[10px] font-black uppercase tracking-widest text-amber-600">📘 Catecismo</p>
                      </div>
                      <div className="flex flex-wrap gap-2">
                        {selectedTerm.catechismReferences.map((r, idx) => {
                          const paraMatch = r.match(/§(\d+)/);
                          if (paraMatch) {
                            return (
                              <CatechismPopover
                                key={`${r}-${idx}`}
                                paragraph={parseInt(paraMatch[1])}
                                onNavigate={(p) => navigate(`${AppRoute.CATECHISM}?p=${p}`)}
                              />
...
                            <MagisteriumPopover
                              key={`${m}-${idx}`}
                              documentName={docName}
                              label={m}
                              onNavigate={(search) => navigate(`${AppRoute.MAGISTERIUM}?search=${encodeURIComponent(search)}`)}
                            />
                          );
                        })}
                      </div>
                    </div>
                  )}

                  {/* Practical Application */}
                  {selectedTerm.practicalApplication && (
                    <div className="bg-primary/5 border border-primary/10 rounded-2xl p-4 space-y-2">
                      <div className="flex items-center gap-2">
                        <Target className="w-4 h-4 text-primary" />
                        <p className="text-[10px] font-black uppercase tracking-widest text-primary">🧠 Aplicação</p>
                      </div>
                      <p className="text-foreground/80 leading-relaxed text-sm font-medium">
                        {selectedTerm.practicalApplication}
                      </p>
                    </div>
                  )}

                  {/* Deep Interpretation */}
                  {selectedTerm.deepInterpretation && (
                    <div className="bg-muted/30 rounded-2xl p-4 space-y-2">
                      <div className="flex items-center gap-2">
                        <Quote className="w-4 h-4 text-muted-foreground" />
                        <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Interpretação</p>
                      </div>
                      <p className="text-foreground/70 leading-relaxed text-sm italic font-serif">
                        {selectedTerm.deepInterpretation}
                      </p>
                    </div>
                  )}

                  {/* Action Buttons */}
                  <div className="flex flex-col gap-3 pt-2">
                    <Button
                      onClick={() => navigate(`${AppRoute.STUDY_MODE}?topic=${encodeURIComponent(selectedTerm.term)}`)}
                      variant="outline"
                      className="w-full rounded-2xl h-12 gap-2 font-bold text-xs uppercase tracking-widest border-primary/20 text-primary hover:bg-primary/10"
                    >
                      <Brain className="w-4 h-4" />
                      🤖 Refletir com Logos
                    </Button>

                    {selectedTerm.journey_id ? (
                      <Button
                        onClick={() => navigate(`/jornadas/${selectedTerm.journey_id}`)}
                        className="w-full rounded-2xl h-12 gap-2 font-bold text-xs uppercase tracking-widest bg-primary text-primary-foreground hover:bg-primary/90"
                      >
                        <Compass className="w-4 h-4" />
                        🚀 Viver isso — Jornada Prática
                      </Button>
                    ) : (
                      <Button
                        onClick={() => navigate(`${AppRoute.LECTIO_DIVINA}`)}
                        variant="outline"
                        className="w-full rounded-2xl h-12 gap-2 font-bold text-xs uppercase tracking-widest border-border text-foreground/70 hover:bg-muted/50"
                      >
                        <Heart className="w-4 h-4" />
                        🚀 Viver isso
                      </Button>
                    )}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
        </>
        )}
      </div>
    </>
  );
};

export default AZFaithPage;
