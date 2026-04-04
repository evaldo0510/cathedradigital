import React, { useState, useMemo } from 'react';
import { motion } from 'framer-motion';
import { Icons } from '../../constants';
import StaggeredList from './StaggeredList';

interface SaintWork {
  title: string;
  url?: string; // URL to read online
}

interface Saint {
  id: string;
  name: string;
  title: string;
  feastDay: string;
  feastMonth: number;
  feastDayNum: number;
  born: string;
  died: string;
  patronOf: string[];
  bio: string;
  works: SaintWork[];
  quotes: string[];
  category: 'apostle' | 'martyr' | 'doctor' | 'virgin' | 'confessor' | 'pope' | 'founder' | 'mystic';
  image?: string;
}

const SAINTS_DATA: Saint[] = [
  {
    id: 'thomas-aquinas', name: 'São Tomás de Aquino', title: 'Doctor Angelicus',
    feastDay: '28 de Janeiro', feastMonth: 1, feastDayNum: 28,
    born: '1225, Roccasecca', died: '1274, Fossanova',
    patronOf: ['Estudantes', 'Universidades', 'Filósofos'],
    bio: 'Frade dominicano, teólogo e filósofo italiano. Considerado o maior teólogo da Igreja Católica, autor da Suma Teológica, obra monumental que sintetiza a filosofia aristotélica com a teologia cristã.',
    works: [
      { title: 'Suma Teológica', url: 'https://sumateologica.files.wordpress.com/2017/04/suma-teolc3b3gica.pdf' },
      { title: 'Suma contra os Gentios', url: 'https://www.ecatholic2000.com/cts/untitled-111.shtml' },
      { title: 'De Ente et Essentia', url: 'https://www.corpusthomisticum.org/ode.html' },
      { title: 'Catena Aurea', url: 'https://www.ecatholic2000.com/catena/untitled-encyclopediaproject.shtml' },
    ],
    quotes: ['"O temor é o princípio da sabedoria."', '"A graça não destrói a natureza, mas a aperfeiçoa."'],
    category: 'doctor'
  },
  {
    id: 'agostinho', name: 'Santo Agostinho de Hipona', title: 'Doctor Gratiae',
    feastDay: '28 de Agosto', feastMonth: 8, feastDayNum: 28,
    born: '354, Tagaste', died: '430, Hipona',
    patronOf: ['Teólogos', 'Cervejeiros', 'Impressores'],
    bio: 'Bispo de Hipona e um dos mais importantes Padres da Igreja. Sua conversão, narrada nas Confissões, é um dos relatos mais célebres da literatura cristã. Combateu o maniqueísmo, donatismo e pelagianismo.',
    works: [
      { title: 'Confissões', url: 'https://www.augustinus.it/portoghese/confessioni/index.htm' },
      { title: 'A Cidade de Deus', url: 'https://www.augustinus.it/portoghese/cdd/index.htm' },
      { title: 'De Trinitate', url: 'https://www.augustinus.it/latino/trinita/index.htm' },
      { title: 'Enchiridion', url: 'https://www.newadvent.org/fathers/1302.htm' },
    ],
    quotes: ['"Fizeste-nos para Ti, Senhor, e o nosso coração está inquieto enquanto não descansar em Ti."', '"Ama e faz o que quiseres."'],
    category: 'doctor'
  },
  {
    id: 'francisco-assis', name: 'São Francisco de Assis', title: 'Il Poverello',
    feastDay: '4 de Outubro', feastMonth: 10, feastDayNum: 4,
    born: '1181, Assis', died: '1226, Porciúncula',
    patronOf: ['Animais', 'Ecologia', 'Itália', 'Comerciantes'],
    bio: 'Fundador da Ordem dos Frades Menores (Franciscanos). Renunciou à riqueza para viver em pobreza radical, pregando o Evangelho com simplicidade. Recebeu os estigmas de Cristo no Monte Alverna.',
    works: [
      { title: 'Cântico das Criaturas', url: 'https://www.franciscanos.org.br/?p=cantico-das-criaturas' },
      { title: 'Regra dos Frades Menores', url: 'https://www.franciscanos.org.br/?p=regra-bulada' },
      { title: 'Testamento', url: 'https://www.franciscanos.org.br/?p=testamento' },
    ],
    quotes: ['"Senhor, fazei-me instrumento da vossa paz."', '"Pregai o Evangelho em todo tempo; se necessário, usai palavras."'],
    category: 'founder'
  },
  {
    id: 'teresa-avila', name: 'Santa Teresa de Ávila', title: 'Doctor Ecclesiae',
    feastDay: '15 de Outubro', feastMonth: 10, feastDayNum: 15,
    born: '1515, Ávila', died: '1582, Alba de Tormes',
    patronOf: ['Escritores', 'Espanha', 'Pessoas doentes do coração'],
    bio: 'Carmelita descalça, mística e reformadora. Primeira mulher declarada Doutora da Igreja. Suas obras sobre a vida interior e a oração mística são referência na espiritualidade cristã.',
    works: [
      { title: 'O Castelo Interior', url: 'https://www.documentacatholicaomnia.eu/03d/1515-1582,_Teresa_de_Jesus,_Castelo_Interior,_PT.pdf' },
      { title: 'Caminho de Perfeição', url: 'https://www.documentacatholicaomnia.eu/03d/1515-1582,_Teresa_de_Jesus,_Caminho_de_Perfeicao,_PT.pdf' },
      { title: 'Livro da Vida', url: 'https://www.documentacatholicaomnia.eu/03d/1515-1582,_Teresa_de_Jesus,_Livro_da_Vida,_PT.pdf' },
      { title: 'Fundações' },
    ],
    quotes: ['"Nada te perturbe, nada te espante. Tudo passa. Deus não muda."', '"Entre as panelas também anda o Senhor."'],
    category: 'mystic'
  },
  {
    id: 'joao-cruz', name: 'São João da Cruz', title: 'Doctor Mysticus',
    feastDay: '14 de Dezembro', feastMonth: 12, feastDayNum: 14,
    born: '1542, Fontiveros', died: '1591, Úbeda',
    patronOf: ['Poetas', 'Místicos', 'Contemplativos'],
    bio: 'Carmelita descalço, poeta e místico espanhol. Junto com Santa Teresa, reformou a Ordem do Carmo. Seus poemas e tratados sobre a "noite escura da alma" são obras-primas da mística cristã.',
    works: [
      { title: 'Noite Escura', url: 'https://www.documentacatholicaomnia.eu/03d/1542-1591,_Ioannes_a_Cruce,_Noite_Escura,_PT.pdf' },
      { title: 'Subida do Monte Carmelo', url: 'https://www.documentacatholicaomnia.eu/03d/1542-1591,_Ioannes_a_Cruce,_Subida_do_Monte_Carmelo,_PT.pdf' },
      { title: 'Cântico Espiritual', url: 'https://www.documentacatholicaomnia.eu/03d/1542-1591,_Ioannes_a_Cruce,_Cantico_Espiritual,_PT.pdf' },
      { title: 'Chama Viva de Amor' },
    ],
    quotes: ['"No entardecer da vida, seremos julgados pelo amor."', '"Para chegar ao que não sabes, deves ir por onde não sabes."'],
    category: 'mystic'
  },
  {
    id: 'padre-pio', name: 'São Padre Pio', title: 'de Pietrelcina',
    feastDay: '23 de Setembro', feastMonth: 9, feastDayNum: 23,
    born: '1887, Pietrelcina', died: '1968, San Giovanni Rotondo',
    patronOf: ['Voluntários', 'Adolescentes', 'Estressados'],
    bio: 'Frade capuchinho italiano que portou os estigmas de Cristo por 50 anos. Celebrava a Missa com profunda devoção, confessava até 16 horas por dia e possuía dons místicos extraordinários.',
    works: [
      { title: 'Epistolário (Cartas)', url: 'https://www.padrepio.catholicwebservices.com/ENGLISH/Letters.htm' },
    ],
    quotes: ['"Rezai, esperai e não vos preocupeis."', '"A oração é a melhor arma que possuímos."'],
    category: 'mystic'
  },
  {
    id: 'teresinha', name: 'Santa Teresinha do Menino Jesus', title: 'Doctor Amoris',
    feastDay: '1 de Outubro', feastMonth: 10, feastDayNum: 1,
    born: '1873, Alençon', died: '1897, Lisieux',
    patronOf: ['Missões', 'França', 'Floristas', 'Aviadores'],
    bio: 'Carmelita descalça francesa, conhecida como "A Pequena Flor". Apesar de ter morrido aos 24 anos, sua "Pequena Via" de amor e confiança revolucionou a espiritualidade moderna. Doutora da Igreja.',
    works: [
      { title: 'História de uma Alma', url: 'https://www.documentacatholicaomnia.eu/03d/1873-1897,_Theresia_a_Iesu_Infante,_Historia_de_uma_Alma,_PT.pdf' },
      { title: 'Poesias' },
      { title: 'Cartas' },
      { title: 'Peças de Teatro' },
    ],
    quotes: ['"Minha vocação é o Amor!"', '"Quero passar meu Céu fazendo o bem na Terra."'],
    category: 'doctor'
  },
  {
    id: 'joao-paulo-ii', name: 'São João Paulo II', title: 'Magno',
    feastDay: '22 de Outubro', feastMonth: 10, feastDayNum: 22,
    born: '1920, Wadowice', died: '2005, Vaticano',
    patronOf: ['Jornada Mundial da Juventude', 'Famílias'],
    bio: 'Papa polonês, o segundo pontificado mais longo da história. Viajou por 129 países, canonizou mais santos que todos os papas anteriores juntos. Sua Teologia do Corpo é marco na doutrina da Igreja.',
    works: [
      { title: 'Teologia do Corpo', url: 'https://www.vatican.va/content/john-paul-ii/pt/audiences/1979.index.html' },
      { title: 'Fides et Ratio', url: 'https://www.vatican.va/content/john-paul-ii/pt/encyclicals/documents/hf_jp-ii_enc_14091998_fides-et-ratio.html' },
      { title: 'Evangelium Vitae', url: 'https://www.vatican.va/content/john-paul-ii/pt/encyclicals/documents/hf_jp-ii_enc_25031995_evangelium-vitae.html' },
      { title: 'Redemptor Hominis', url: 'https://www.vatican.va/content/john-paul-ii/pt/encyclicals/documents/hf_jp-ii_enc_04031979_redemptor-hominis.html' },
    ],
    quotes: ['"Não tenhais medo!"', '"A liberdade não consiste em fazer o que se quer, mas em ter o direito de fazer o que se deve."'],
    category: 'pope'
  },
  {
    id: 'pedro', name: 'São Pedro Apóstolo', title: 'Princeps Apostolorum',
    feastDay: '29 de Junho', feastMonth: 6, feastDayNum: 29,
    born: 'Betsaida, Galileia', died: '64 d.C., Roma',
    patronOf: ['Papas', 'Pescadores', 'Relojoeiros'],
    bio: 'Primeiro entre os Apóstolos, recebeu de Cristo as chaves do Reino dos Céus. Primeiro Bispo de Roma e primeiro Papa. Martirizado crucificado de cabeça para baixo por não se considerar digno de morrer como seu Mestre.',
    works: [
      { title: '1ª Epístola de São Pedro', url: 'https://www.bibliaonline.com.br/acf/1pe/1' },
      { title: '2ª Epístola de São Pedro', url: 'https://www.bibliaonline.com.br/acf/2pe/1' },
    ],
    quotes: ['"Senhor, Tu sabes tudo; Tu sabes que eu Te amo."'],
    category: 'apostle'
  },
  {
    id: 'paulo', name: 'São Paulo Apóstolo', title: 'Apostolus Gentium',
    feastDay: '29 de Junho', feastMonth: 6, feastDayNum: 29,
    born: 'Tarso, Cilícia', died: '67 d.C., Roma',
    patronOf: ['Missionários', 'Teólogos', 'Escritores'],
    bio: 'O Apóstolo dos Gentios. Antes perseguidor dos cristãos como Saulo, foi convertido no caminho de Damasco. Realizou três grandes viagens missionárias e escreveu 13 epístolas do Novo Testamento.',
    works: [
      { title: 'Epístola aos Romanos', url: 'https://www.bibliaonline.com.br/acf/rm/1' },
      { title: 'Epístolas aos Coríntios', url: 'https://www.bibliaonline.com.br/acf/1co/1' },
      { title: 'Epístola aos Gálatas', url: 'https://www.bibliaonline.com.br/acf/gl/1' },
      { title: 'Epístola aos Efésios', url: 'https://www.bibliaonline.com.br/acf/ef/1' },
    ],
    quotes: ['"Já não sou eu que vivo, mas é Cristo que vive em mim."', '"Se Deus é por nós, quem será contra nós?"'],
    category: 'apostle'
  },
  {
    id: 'maria', name: 'Santíssima Virgem Maria', title: 'Theotokos — Mãe de Deus',
    feastDay: '1 de Janeiro (Solenidade)', feastMonth: 1, feastDayNum: 1,
    born: 'Nazaré / Jerusalém (tradição)', died: 'Assunção ao Céu',
    patronOf: ['Humanidade', 'Igreja Católica', 'Todas as nações'],
    bio: 'Mãe de Jesus Cristo e Mãe da Igreja. Concebida sem pecado original (Imaculada Conceição), deu seu "Fiat" ao anjo Gabriel e cooperou de modo singular na obra da Redenção. Assumpta ao Céu em corpo e alma.',
    works: [
      { title: 'Magnificat' },
    ],
    quotes: ['"Eis aqui a serva do Senhor; faça-se em mim segundo a tua palavra."', '"Fazei tudo o que Ele vos disser."'],
    category: 'virgin'
  },
  {
    id: 'jose', name: 'São José', title: 'Custodis Redemptoris',
    feastDay: '19 de Março', feastMonth: 3, feastDayNum: 19,
    born: 'Belém (tradição)', died: 'Nazaré (tradição)',
    patronOf: ['Igreja Universal', 'Trabalhadores', 'Pais', 'Boa morte'],
    bio: 'Esposo da Virgem Maria e pai adotivo de Jesus. Homem justo e silencioso, protegeu a Sagrada Família com fé, obediência e trabalho. Padroeiro da Igreja Universal desde 1870.',
    works: [],
    quotes: ['"(As Escrituras não registram nenhuma palavra de São José — seu silêncio é sua maior eloquência.)"'],
    category: 'confessor'
  },
  {
    id: 'bento-nursia', name: 'São Bento de Núrsia', title: 'Patriarcha Monachorum',
    feastDay: '11 de Julho', feastMonth: 7, feastDayNum: 11,
    born: '480, Núrsia', died: '547, Monte Cassino',
    patronOf: ['Europa', 'Monges', 'Agricultores', 'Engenheiros'],
    bio: 'Pai do monaquismo ocidental e padroeiro da Europa. Fundou o Mosteiro de Monte Cassino e escreveu a Regra que moldou a civilização europeia. Seu lema "Ora et Labora" sintetiza a espiritualidade beneditina.',
    works: [
      { title: 'Regra de São Bento', url: 'https://www.documentacatholicaomnia.eu/03d/0480-0547,_Benedictus_Nursinus,_Regula,_LT.pdf' },
    ],
    quotes: ['"Ora et Labora — Reza e Trabalha."', '"Nada antepor ao amor de Cristo."'],
    category: 'founder'
  },
  {
    id: 'domingos-gusmao', name: 'São Domingos de Gusmão', title: 'Fundador dos Pregadores',
    feastDay: '8 de Agosto', feastMonth: 8, feastDayNum: 8,
    born: '1170, Caleruega', died: '1221, Bolonha',
    patronOf: ['Astrônomos', 'Cientistas', 'Ordem dos Pregadores'],
    bio: 'Fundador da Ordem dos Pregadores (Dominicanos). Combateu a heresia albigense com a pregação e a oração. A tradição lhe atribui a devoção do Santo Rosário, recebida da Virgem Maria.',
    works: [
      { title: 'Constituições da Ordem dos Pregadores' },
    ],
    quotes: ['"Tende caridade, guardai a humildade, possuí a pobreza voluntária."', '"Falava com Deus ou de Deus."'],
    category: 'founder'
  },
  {
    id: 'inacio-loyola', name: 'Santo Inácio de Loyola', title: 'Fundador da Companhia de Jesus',
    feastDay: '31 de Julho', feastMonth: 7, feastDayNum: 31,
    born: '1491, Azpeitia', died: '1556, Roma',
    patronOf: ['Soldados', 'Educadores', 'Retiros Espirituais'],
    bio: 'Militar basco convertido após ferimento em batalha. Fundou a Companhia de Jesus (Jesuítas), que se tornou a maior ordem religiosa da Igreja. Seus Exercícios Espirituais são método fundamental de discernimento.',
    works: [
      { title: 'Exercícios Espirituais', url: 'https://www.documentacatholicaomnia.eu/03d/1491-1556,_Ignatius_Loyolensis,_Exercitia_Spiritualia,_PT.pdf' },
      { title: 'Autobiografia (Relato do Peregrino)', url: 'https://www.newadvent.org/cathen/07639c.htm' },
      { title: 'Constituições da Companhia de Jesus' },
    ],
    quotes: ['"Ad Maiorem Dei Gloriam — Para a Maior Glória de Deus."', '"Em tudo amar e servir."'],
    category: 'founder'
  },
  {
    id: 'francisco-sales', name: 'São Francisco de Sales', title: 'Doctor Caritatis',
    feastDay: '24 de Janeiro', feastMonth: 1, feastDayNum: 24,
    born: '1567, Thorens-Glières', died: '1622, Lyon',
    patronOf: ['Jornalistas', 'Escritores', 'Surdos'],
    bio: 'Bispo de Genebra e Doutor da Igreja. Mestre da espiritualidade acessível aos leigos, ensinou que a santidade é possível em qualquer estado de vida. Fundou a Ordem da Visitação com Santa Joana de Chantal.',
    works: [
      { title: 'Introdução à Vida Devota (Filoteia)', url: 'https://www.documentacatholicaomnia.eu/03d/1567-1622,_Franciscus_Salesius,_Introducao_a_Vida_Devota,_PT.pdf' },
      { title: 'Tratado do Amor de Deus (Teótimo)', url: 'https://www.documentacatholicaomnia.eu/03d/1567-1622,_Franciscus_Salesius,_Tratado_Do_Amor_De_Deus,_PT.pdf' },
      { title: 'Cartas Espirituais' },
    ],
    quotes: ['"Sede o que sois e sede-o bem, para honrar o Mestre cuja obra sois."', '"Nada por força, tudo por amor."'],
    category: 'doctor'
  },
  {
    id: 'catarina-sena', name: 'Santa Catarina de Sena', title: 'Doctor Ecclesiae',
    feastDay: '29 de Abril', feastMonth: 4, feastDayNum: 29,
    born: '1347, Siena', died: '1380, Roma',
    patronOf: ['Europa', 'Itália', 'Enfermeiras', 'Bombeiros'],
    bio: 'Dominicana terciária, mística e Doutora da Igreja. Persuadiu o Papa Gregório XI a retornar de Avinhão a Roma. Suas cartas e seu Diálogo são obras-primas da espiritualidade e da literatura italiana.',
    works: [
      { title: 'O Diálogo (Livro da Divina Doutrina)', url: 'https://www.documentacatholicaomnia.eu/03d/1347-1380,_Catharina_Senensis,_Dialogo_della_Divina_Provvidenza,_IT.pdf' },
      { title: 'Cartas', url: 'https://www.newadvent.org/cathen/03447a.htm' },
    ],
    quotes: ['"Sede quem Deus quis que fôsseis e incendiareis o mundo."', '"Tudo vem do amor, tudo é ordenado à salvação do homem."'],
    category: 'mystic'
  },
  {
    id: 'alfonso-liguori', name: 'Santo Afonso de Ligório', title: 'Doctor Zelantissimus',
    feastDay: '1 de Agosto', feastMonth: 8, feastDayNum: 1,
    born: '1696, Marianella', died: '1787, Pagani',
    patronOf: ['Confessores', 'Moralistas', 'Teólogos moralistas'],
    bio: 'Bispo, fundador dos Redentoristas e Doutor da Igreja. Maior moralista da história da Igreja. Suas obras sobre moral, oração e devoção mariana são referência obrigatória na formação sacerdotal.',
    works: [
      { title: 'As Glórias de Maria', url: 'https://www.documentacatholicaomnia.eu/03d/1696-1787,_Alphonsus_Maria_de_Ligorio,_Glorias_de_Maria,_PT.pdf' },
      { title: 'Prática do Amor a Jesus Cristo', url: 'https://www.documentacatholicaomnia.eu/03d/1696-1787,_Alphonsus_Maria_de_Ligorio,_Pratica_do_Amor_a_Jesus_Cristo,_PT.pdf' },
      { title: 'Preparação para a Morte' },
      { title: 'Teologia Moral' },
    ],
    quotes: ['"Quem reza se salva; quem não reza se condena."', '"Maria é a porta do Céu."'],
    category: 'doctor'
  },
  {
    id: 'luis-montfort', name: 'São Luís Maria de Montfort', title: 'Apóstolo de Maria',
    feastDay: '28 de Abril', feastMonth: 4, feastDayNum: 28,
    born: '1673, Montfort-sur-Meu', died: '1716, Saint-Laurent-sur-Sèvre',
    patronOf: ['Pregadores', 'Devotos de Maria'],
    bio: 'Sacerdote francês e grande apóstolo da devoção mariana. Sua Consagração Total a Jesus por Maria influenciou profundamente a espiritualidade de São João Paulo II, que adotou o lema "Totus Tuus".',
    works: [
      { title: 'Tratado da Verdadeira Devoção à Santíssima Virgem', url: 'https://www.documentacatholicaomnia.eu/03d/1673-1716,_Ludovicus_Maria_Grignion_de_Montfort,_Tratado_da_Verdadeira_Devocao,_PT.pdf' },
      { title: 'O Segredo de Maria' },
      { title: 'O Segredo Admirável do Santíssimo Rosário' },
    ],
    quotes: ['"Totus Tuus — Todo Teu, Maria."', '"Por Maria a Jesus."'],
    category: 'confessor'
  },
  {
    id: 'atanasio', name: 'Santo Atanásio', title: 'Doctor Incarnationis',
    feastDay: '2 de Maio', feastMonth: 5, feastDayNum: 2,
    born: '296, Alexandria', died: '373, Alexandria',
    patronOf: ['Ortodoxia', 'Teólogos'],
    bio: 'Bispo de Alexandria e Doutor da Igreja. Defensor incansável da divindade de Cristo contra a heresia ariana. Exilado cinco vezes por imperadores arianos, jamais cedeu. "Athanasius contra mundum."',
    works: [
      { title: 'Sobre a Encarnação do Verbo', url: 'https://www.newadvent.org/fathers/2802.htm' },
      { title: 'Contra os Arianos', url: 'https://www.newadvent.org/fathers/2816.htm' },
      { title: 'Vida de Santo Antão', url: 'https://www.newadvent.org/fathers/2811.htm' },
    ],
    quotes: ['"O Verbo se fez homem para que nós nos tornássemos Deus."'],
    category: 'doctor'
  },
  {
    id: 'joao-crisostomo', name: 'São João Crisóstomo', title: 'Boca de Ouro',
    feastDay: '13 de Setembro', feastMonth: 9, feastDayNum: 13,
    born: '349, Antioquia', died: '407, Comana Pôntica',
    patronOf: ['Pregadores', 'Oradores', 'Educadores'],
    bio: 'Patriarca de Constantinopla e Doutor da Igreja. O maior pregador da Igreja Oriental, cujo sobrenome "Crisóstomo" significa "Boca de Ouro". Suas homilias são modelo de eloquência e profundidade.',
    works: [
      { title: 'Homilias sobre o Evangelho de São Mateus', url: 'https://www.newadvent.org/fathers/200101.htm' },
      { title: 'Sobre o Sacerdócio', url: 'https://www.newadvent.org/fathers/1901.htm' },
      { title: 'Homilias sobre Romanos', url: 'https://www.newadvent.org/fathers/210201.htm' },
    ],
    quotes: ['"A liturgia é o Céu na Terra."', '"Se fores a bigorna, suporta; se fores o martelo, golpeia."'],
    category: 'doctor'
  },
  {
    id: 'jeronimo', name: 'São Jerônimo', title: 'Doctor Maximus in Scripturis',
    feastDay: '30 de Setembro', feastMonth: 9, feastDayNum: 30,
    born: '347, Estridão', died: '420, Belém',
    patronOf: ['Bibliotecários', 'Tradutores', 'Estudantes da Bíblia'],
    bio: 'Padre da Igreja e Doutor. Traduziu a Bíblia para o latim (Vulgata), versão oficial da Igreja por mais de mil anos. Eremita em Belém, seus comentários bíblicos são de valor inestimável.',
    works: [
      { title: 'Vulgata (tradução da Bíblia)', url: 'https://www.sacred-texts.com/bib/vul/' },
      { title: 'Cartas', url: 'https://www.newadvent.org/fathers/3001.htm' },
      { title: 'Comentário sobre Isaías' },
    ],
    quotes: ['"Ignorar as Escrituras é ignorar a Cristo."', '"Bom, melhor, ótimo. Não descanse até que seu bom se torne melhor e seu melhor se torne ótimo."'],
    category: 'doctor'
  },
  {
    id: 'bernardo-claraval', name: 'São Bernardo de Claraval', title: 'Doctor Mellifluus',
    feastDay: '20 de Agosto', feastMonth: 8, feastDayNum: 20,
    born: '1090, Fontaine-lès-Dijon', died: '1153, Claraval',
    patronOf: ['Apicultores', 'Gibraltar', 'Cistercienses'],
    bio: 'Abade cisterciense e Doutor da Igreja. "O último dos Padres". Reformador, pregador da Segunda Cruzada, conselheiro de papas e reis. Seus sermões sobre o Cântico dos Cânticos são cume da mística medieval.',
    works: [
      { title: 'Sermões sobre o Cântico dos Cânticos', url: 'https://www.newadvent.org/fathers/3801.htm' },
      { title: 'Sobre o Amor de Deus', url: 'https://www.newadvent.org/fathers/3804.htm' },
      { title: 'Sobre a Consideração' },
    ],
    quotes: ['"Mede a tua vida não pelo seu comprimento, mas pela sua profundidade."', '"Maria é a estrela do mar."'],
    category: 'doctor'
  },
  {
    id: 'faustina', name: 'Santa Faustina Kowalska', title: 'Apóstola da Divina Misericórdia',
    feastDay: '5 de Outubro', feastMonth: 10, feastDayNum: 5,
    born: '1905, Głogowiec', died: '1938, Cracóvia',
    patronOf: ['Divina Misericórdia'],
    bio: 'Religiosa polonesa que recebeu revelações de Jesus sobre a Divina Misericórdia. Seu Diário é um dos mais lidos da mística moderna. A devoção à Divina Misericórdia se espalhou por todo o mundo.',
    works: [
      { title: 'Diário: A Misericórdia Divina na Minha Alma', url: 'https://www.saint-faustina.org/diary-full-text/' },
    ],
    quotes: ['"Jesus, eu confio em Vós!"', '"A humanidade não encontrará a paz enquanto não se voltar com confiança para a Minha Misericórdia."'],
    category: 'mystic'
  },
  {
    id: 'josemaria', name: 'São Josemaria Escrivá', title: 'Fundador do Opus Dei',
    feastDay: '26 de Junho', feastMonth: 6, feastDayNum: 26,
    born: '1902, Barbastro', died: '1975, Roma',
    patronOf: ['Opus Dei', 'Santificação do trabalho'],
    bio: 'Sacerdote espanhol fundador do Opus Dei. Pregou a chamada universal à santidade e a santificação do trabalho ordinário. Sua mensagem antecipou ensinamentos do Concílio Vaticano II.',
    works: [
      { title: 'Caminho', url: 'https://www.escrivaworks.org/book/the_way.htm' },
      { title: 'Sulco', url: 'https://www.escrivaworks.org/book/furrow.htm' },
      { title: 'Forja', url: 'https://www.escrivaworks.org/book/the_forge.htm' },
      { title: 'É Cristo que Passa', url: 'https://www.escrivaworks.org/book/christ_is_passing_by.htm' },
    ],
    quotes: ['"Santificai o trabalho, santificai-vos no trabalho, santificai os outros com o trabalho."', '"Há algo de santo, de divino, escondido nas situações mais comuns."'],
    category: 'founder'
  },
  {
    id: 'rita-cascia', name: 'Santa Rita de Cássia', title: 'Santa dos Impossíveis',
    feastDay: '22 de Maio', feastMonth: 5, feastDayNum: 22,
    born: '1381, Roccaporena', died: '1457, Cássia',
    patronOf: ['Causas impossíveis', 'Esposas maltratadas', 'Mães'],
    bio: 'Religiosa agostiniana italiana. Após a morte violenta do marido e dos filhos, entrou para o convento. Recebeu um espinho da coroa de Cristo na testa. Invocada como a santa das causas impossíveis.',
    works: [],
    quotes: ['"Aceitar a cruz é encontrar a felicidade."'],
    category: 'mystic'
  },
  {
    id: 'antonio-padua', name: 'Santo Antônio de Pádua', title: 'Doctor Evangelicus',
    feastDay: '13 de Junho', feastMonth: 6, feastDayNum: 13,
    born: '1195, Lisboa', died: '1231, Pádua',
    patronOf: ['Coisas perdidas', 'Pobres', 'Portugal', 'Brasil'],
    bio: 'Frade franciscano português, Doutor da Igreja. Pregador extraordinário, seus sermões comoviam multidões. Conhecido como "Martelo dos Hereges" pela solidez doutrinária. Santo mais popular do mundo.',
    works: [
      { title: 'Sermões Dominicais', url: 'https://www.newadvent.org/cathen/01556a.htm' },
    ],
    quotes: ['"As ações falam mais alto que as palavras; que as vossas palavras ensinem e as vossas ações falem."', '"O Santo em quem tudo o que se pede se alcança."'],
    category: 'doctor'
  },
  {
    id: 'maximiliano-kolbe', name: 'São Maximiliano Kolbe', title: 'Mártir da Caridade',
    feastDay: '14 de Agosto', feastMonth: 8, feastDayNum: 14,
    born: '1894, Zduńska Wola', died: '1941, Auschwitz',
    patronOf: ['Prisioneiros', 'Dependentes químicos', 'Jornalistas', 'Movimento pró-vida'],
    bio: 'Frade franciscano polonês que ofereceu sua vida no lugar de outro prisioneiro em Auschwitz. Fundou a Milícia da Imaculada e utilizou os meios de comunicação modernos para evangelizar.',
    works: [
      { title: 'Escritos de São Maximiliano Kolbe' },
    ],
    quotes: ['"O ódio não é uma força criativa. Só o amor é criativo."', '"A Imaculada é a Esposa do Espírito Santo."'],
    category: 'martyr'
  },
  {
    id: 'madre-teresa', name: 'Santa Teresa de Calcutá', title: 'Mãe dos Pobres',
    feastDay: '5 de Setembro', feastMonth: 9, feastDayNum: 5,
    born: '1910, Escópia', died: '1997, Calcutá',
    patronOf: ['Missionárias da Caridade', 'Voluntários'],
    bio: 'Religiosa albanesa-indiana, fundadora das Missionárias da Caridade. Dedicou sua vida aos mais pobres entre os pobres nas ruas de Calcutá. Nobel da Paz em 1979. Viveu uma longa "noite escura" da fé.',
    works: [
      { title: 'Venha, Seja Minha Luz (Cartas)' },
    ],
    quotes: ['"Se julgas as pessoas, não tens tempo para amá-las."', '"Não é preciso fazer grandes coisas, mas coisas pequenas com grande amor."'],
    category: 'founder'
  },
];

const CATEGORY_LABELS: Record<string, string> = {
  apostle: 'Apóstolo', martyr: 'Mártir', doctor: 'Doutor(a) da Igreja',
  virgin: 'Virgem', confessor: 'Confessor', pope: 'Papa', founder: 'Fundador(a)', mystic: 'Místico(a)'
};

const CATEGORY_COLORS: Record<string, string> = {
  apostle: 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300',
  martyr: 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300',
  doctor: 'bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-300',
  virgin: 'bg-sky-100 text-sky-800 dark:bg-sky-900/30 dark:text-sky-300',
  confessor: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-300',
  pope: 'bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-300',
  founder: 'bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-300',
  mystic: 'bg-violet-100 text-violet-800 dark:bg-violet-900/30 dark:text-violet-300',
};

const MONTH_NAMES = ['Janeiro','Fevereiro','Março','Abril','Maio','Junho','Julho','Agosto','Setembro','Outubro','Novembro','Dezembro'];

const Saints: React.FC = () => {
  const [selectedSaint, setSelectedSaint] = useState<Saint | null>(null);
  const [search, setSearch] = useState('');
  const [filterCategory, setFilterCategory] = useState<string>('all');
  const [viewMode, setViewMode] = useState<'grid' | 'calendar'>('grid');
  const [calendarMonth, setCalendarMonth] = useState(new Date().getMonth());

  const categories = useMemo(() => {
    const cats = new Set(SAINTS_DATA.map(s => s.category));
    return Array.from(cats).sort();
  }, []);

  const filtered = useMemo(() => {
    return SAINTS_DATA.filter(s => {
      const matchSearch = search === '' || s.name.toLowerCase().includes(search.toLowerCase()) || s.title.toLowerCase().includes(search.toLowerCase());
      const matchCat = filterCategory === 'all' || s.category === filterCategory;
      return matchSearch && matchCat;
    });
  }, [search, filterCategory]);

  const calendarSaints = useMemo(() => {
    return SAINTS_DATA.filter(s => s.feastMonth === calendarMonth + 1).sort((a, b) => a.feastDayNum - b.feastDayNum);
  }, [calendarMonth]);

  if (selectedSaint) {
    return (
      <div className="max-w-4xl mx-auto space-y-8 page-enter">
        <button onClick={() => setSelectedSaint(null)} className="flex items-center gap-2 text-stone-500 hover:text-stone-900 dark:hover:text-stone-200 transition-colors group">
          <Icons.ArrowDown className="w-4 h-4 rotate-90 group-hover:-translate-x-1 transition-transform" />
          <span className="text-xs font-black uppercase tracking-widest">Voltar ao Sanctorum</span>
        </button>

        <div className="bg-white dark:bg-stone-900 rounded-3xl border border-stone-100 dark:border-stone-800 overflow-hidden">
          <div className="bg-gradient-to-br from-stone-900 to-stone-800 p-10 md:p-14 text-white relative overflow-hidden">
            <div className="absolute inset-0 opacity-5 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNDAiIGhlaWdodD0iNDAiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+PGNpcmNsZSBjeD0iMjAiIGN5PSIyMCIgcj0iMSIgZmlsbD0id2hpdGUiLz48L3N2Zz4=')]" />
            <div className="relative">
              <span className={`inline-block px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest mb-4 ${CATEGORY_COLORS[selectedSaint.category]}`}>
                {CATEGORY_LABELS[selectedSaint.category]}
              </span>
              <h1 className="text-4xl md:text-5xl font-serif font-bold mb-2">{selectedSaint.name}</h1>
              <p className="text-lg text-[#d4af37] font-serif italic">{selectedSaint.title}</p>
            </div>
          </div>

          <div className="p-8 md:p-12 space-y-10">
            {/* Info cards */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="bg-stone-50 dark:bg-stone-800/50 rounded-2xl p-5">
                <p className="text-[9px] font-black uppercase tracking-widest text-stone-400 mb-1">Festa Litúrgica</p>
                <p className="font-serif font-bold text-stone-900 dark:text-stone-100">{selectedSaint.feastDay}</p>
              </div>
              <div className="bg-stone-50 dark:bg-stone-800/50 rounded-2xl p-5">
                <p className="text-[9px] font-black uppercase tracking-widest text-stone-400 mb-1">Nascimento</p>
                <p className="font-serif font-bold text-stone-900 dark:text-stone-100">{selectedSaint.born}</p>
              </div>
              <div className="bg-stone-50 dark:bg-stone-800/50 rounded-2xl p-5">
                <p className="text-[9px] font-black uppercase tracking-widest text-stone-400 mb-1">Falecimento</p>
                <p className="font-serif font-bold text-stone-900 dark:text-stone-100">{selectedSaint.died}</p>
              </div>
            </div>

            {/* Patron */}
            <div>
              <h3 className="text-[10px] font-black uppercase tracking-widest text-stone-400 mb-3">Padroeiro(a) de</h3>
              <div className="flex flex-wrap gap-2">
                {selectedSaint.patronOf.map(p => (
                  <span key={p} className="px-3 py-1.5 bg-[#d4af37]/10 text-[#d4af37] rounded-full text-xs font-bold">{p}</span>
                ))}
              </div>
            </div>

            {/* Biography */}
            <div>
              <h3 className="text-[10px] font-black uppercase tracking-widest text-stone-400 mb-3">Biografia</h3>
              <p className="text-stone-700 dark:text-stone-300 leading-relaxed font-serif text-lg">{selectedSaint.bio}</p>
            </div>

            {/* Works */}
            {selectedSaint.works.length > 0 && (
              <div>
                <h3 className="text-[10px] font-black uppercase tracking-widest text-stone-400 mb-3">Obras Principais</h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {selectedSaint.works.map(w => (
                    w.url ? (
                      <a
                        key={w.title}
                        href={w.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-3 p-4 bg-primary/5 border border-primary/15 rounded-xl hover:bg-primary/10 hover:border-primary/30 transition-all group"
                      >
                        <Icons.Book className="w-4 h-4 text-primary flex-shrink-0" />
                        <span className="font-serif text-foreground group-hover:text-primary transition-colors flex-1">{w.title}</span>
                        <Icons.ExternalLink className="w-3.5 h-3.5 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0" />
                      </a>
                    ) : (
                      <div key={w.title} className="flex items-center gap-3 p-4 bg-muted/50 rounded-xl">
                        <Icons.Book className="w-4 h-4 text-muted-foreground flex-shrink-0" />
                        <span className="font-serif text-muted-foreground">{w.title}</span>
                      </div>
                    )
                  ))}
                </div>
              </div>
            )}

            {/* Quotes */}
            {selectedSaint.quotes.length > 0 && (
              <div>
                <h3 className="text-[10px] font-black uppercase tracking-widest text-stone-400 mb-3">Citações Célebres</h3>
                <div className="space-y-4">
                  {selectedSaint.quotes.map((q, i) => (
                    <blockquote key={i} className="border-l-4 border-[#d4af37] pl-6 py-2 text-stone-600 dark:text-stone-400 font-serif italic text-lg">
                      {q}
                    </blockquote>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-10 page-enter">
      {/* Header */}
      <div className="text-center space-y-4">
        <p className="text-[10px] font-black uppercase tracking-[0.3em] text-[#d4af37]">Sanctorum</p>
        <h1 className="text-4xl md:text-6xl font-serif font-bold text-stone-900 dark:text-stone-100">Vidas dos Santos</h1>
        <p className="text-stone-500 font-serif italic max-w-xl mx-auto">Heróis da fé que iluminam o caminho da santidade através dos séculos.</p>
      </div>

      {/* Controls */}
      <div className="flex flex-col md:flex-row gap-4 items-start md:items-center">
        <div className="relative flex-1 w-full">
          <Icons.Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-stone-400" />
          <input
            type="text" placeholder="Buscar santo..."
            value={search} onChange={e => setSearch(e.target.value)}
            className="w-full pl-11 pr-4 py-3 rounded-2xl border border-stone-200 dark:border-stone-700 bg-white dark:bg-stone-900 text-stone-900 dark:text-stone-100 text-sm focus:outline-none focus:border-[#d4af37]"
          />
        </div>
        <div className="flex gap-2 flex-wrap">
          <select
            value={filterCategory} onChange={e => setFilterCategory(e.target.value)}
            className="px-4 py-3 rounded-2xl border border-stone-200 dark:border-stone-700 bg-white dark:bg-stone-900 text-stone-900 dark:text-stone-100 text-sm focus:outline-none focus:border-[#d4af37]"
          >
            <option value="all">Todas as categorias</option>
            {categories.map(c => <option key={c} value={c}>{CATEGORY_LABELS[c]}</option>)}
          </select>
          <div className="flex rounded-2xl border border-stone-200 dark:border-stone-700 overflow-hidden">
            <button onClick={() => setViewMode('grid')} className={`px-4 py-3 text-xs font-bold transition-colors ${viewMode === 'grid' ? 'bg-stone-900 text-white dark:bg-[#d4af37] dark:text-stone-900' : 'bg-white dark:bg-stone-900 text-stone-500'}`}>
              <Icons.Layout className="w-4 h-4" />
            </button>
            <button onClick={() => setViewMode('calendar')} className={`px-4 py-3 text-xs font-bold transition-colors ${viewMode === 'calendar' ? 'bg-stone-900 text-white dark:bg-[#d4af37] dark:text-stone-900' : 'bg-white dark:bg-stone-900 text-stone-500'}`}>
              <Icons.History className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {viewMode === 'grid' ? (
        <>
          {filtered.length === 0 ? (
            <div className="text-center py-20 text-stone-400">
              <Icons.Search className="w-10 h-10 mx-auto mb-4 opacity-30" />
              <p className="font-serif italic">Nenhum santo encontrado.</p>
            </div>
          ) : (
            <StaggeredList className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filtered.map(saint => (
                <button
                  key={saint.id}
                  onClick={() => setSelectedSaint(saint)}
                  className="text-left bg-card border border-border rounded-3xl p-8 hover:border-primary/50 hover:shadow-xl hover:-translate-y-1 transition-all duration-300 group"
                >
                  <div className="flex items-start justify-between mb-4">
                    <span className={`px-2.5 py-1 rounded-full text-[9px] font-black uppercase tracking-widest ${CATEGORY_COLORS[saint.category]}`}>
                      {CATEGORY_LABELS[saint.category]}
                    </span>
                    <Icons.ArrowDown className="w-4 h-4 text-muted-foreground -rotate-90 group-hover:text-primary transition-colors" />
                  </div>
                  <h3 className="text-xl font-serif font-bold text-foreground mb-1 group-hover:text-primary transition-colors">{saint.name}</h3>
                  <p className="text-sm text-primary font-serif italic mb-4">{saint.title}</p>
                  <p className="text-sm text-muted-foreground line-clamp-3 mb-5 leading-relaxed">{saint.bio}</p>
                  <div className="flex items-center gap-2 text-xs text-muted-foreground">
                    <Icons.Star className="w-3.5 h-3.5" />
                    <span>{saint.feastDay}</span>
                  </div>
                </button>
              ))}
            </StaggeredList>
          )}
        </>
      ) : (
        /* Calendar View */
        <div className="space-y-6">
          <div className="flex items-center justify-center gap-6">
            <button onClick={() => setCalendarMonth(m => m === 0 ? 11 : m - 1)} className="p-3 rounded-xl hover:bg-stone-100 dark:hover:bg-stone-800 transition-colors">
              <Icons.ArrowDown className="w-5 h-5 rotate-90 text-stone-600 dark:text-stone-400" />
            </button>
            <h2 className="text-2xl font-serif font-bold text-stone-900 dark:text-stone-100 w-48 text-center">{MONTH_NAMES[calendarMonth]}</h2>
            <button onClick={() => setCalendarMonth(m => m === 11 ? 0 : m + 1)} className="p-3 rounded-xl hover:bg-stone-100 dark:hover:bg-stone-800 transition-colors">
              <Icons.ArrowDown className="w-5 h-5 -rotate-90 text-stone-600 dark:text-stone-400" />
            </button>
          </div>

          {calendarSaints.length === 0 ? (
            <div className="text-center py-16 text-stone-400">
              <p className="font-serif italic">Nenhuma festa litúrgica cadastrada neste mês.</p>
            </div>
          ) : (
            <div className="space-y-4">
              {calendarSaints.map(saint => (
                <button
                  key={saint.id}
                  onClick={() => setSelectedSaint(saint)}
                  className="w-full flex items-center gap-6 p-6 bg-white dark:bg-stone-900 border border-stone-100 dark:border-stone-800 rounded-2xl hover:border-[#d4af37]/50 hover:shadow-lg transition-all text-left group"
                >
                  <div className="flex-shrink-0 w-16 h-16 bg-stone-900 dark:bg-[#d4af37]/10 rounded-2xl flex flex-col items-center justify-center">
                    <span className="text-2xl font-black text-[#d4af37]">{saint.feastDayNum}</span>
                    <span className="text-[8px] font-black uppercase tracking-widest text-stone-400 dark:text-[#d4af37]/60">{MONTH_NAMES[calendarMonth].substring(0, 3)}</span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="font-serif font-bold text-stone-900 dark:text-stone-100 group-hover:text-[#d4af37] transition-colors">{saint.name}</h3>
                    <p className="text-sm text-[#d4af37] font-serif italic">{saint.title}</p>
                    <p className="text-xs text-stone-400 mt-1 line-clamp-1">{saint.bio}</p>
                  </div>
                  <span className={`hidden sm:inline-block px-2.5 py-1 rounded-full text-[9px] font-black uppercase tracking-widest flex-shrink-0 ${CATEGORY_COLORS[saint.category]}`}>
                    {CATEGORY_LABELS[saint.category]}
                  </span>
                </button>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default Saints;
