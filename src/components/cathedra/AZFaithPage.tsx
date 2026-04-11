import React, { useState, useMemo, useEffect } from 'react';
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
  { term: 'Anjo', definition: 'Mensageiro espiritual de Deus que atua na história da salvação.', reference: 'Hb 1,14', category: 'Seres Celestiais' },
  { term: 'Apocalipse', definition: 'Último livro da Bíblia, que revela a vitória final de Deus sobre o mal.', reference: 'Ap 1,1', category: 'Escatologia' },
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
    magisteriumReferences: ['Ad Gentes n. 14 (Iniciação Cristã)']
  },
  { term: 'Batista', definition: 'Aquele que batiza, título dado a João, o precursor de Jesus.', reference: 'Mt 3,1', category: 'Personagens Bíblicos' },
  { term: 'Babilônia', definition: 'Símbolo do exílio de Israel e do poder mundano oposto a Deus.', reference: 'Sl 137', category: 'Geografia Bíblica' },
  { term: 'Beatitude', definition: 'O estado de suprema felicidade e bem-aventurança na presença de Deus.', reference: 'Mt 5,3', category: 'Teologia' },
  { term: 'Bem-aventuranças', definition: 'O cerne da pregação de Jesus, descrevendo a felicidade do Reino de Deus.', reference: 'Mt 5,3-12', category: 'Ensinamentos' },
  { term: 'Cântico dos Cânticos', definition: 'Livro bíblico que celebra o amor humano como reflexo do amor divino.', reference: 'Ct 1,1', category: 'Livros Bíblicos' },
  { term: 'Caridade', definition: 'A virtude teologal pela qual amamos a Deus sobre todas as coisas e ao próximo como a nós mesmos.', reference: '1Cor 13', category: 'Virtudes' },
  { term: 'Cáritas', definition: 'O amor cristão traduzido em obras de misericórdia.', reference: '1Cor 13', category: 'Virtudes' },
  { term: 'Céu', definition: 'A morada eterna de Deus e dos que morrem na sua amizade.', reference: 'Ap 21,1-4', category: 'Escatologia' },
  { term: 'Cristo', definition: 'Título de Jesus que significa "Ungido", o Messias prometido.', reference: 'Mt 16,16', category: 'Cristologia' },
  { term: 'Deus', definition: 'O Criador e Senhor de todas as coisas, Pai de todos os homens.', reference: 'Gn 1,1; 1Jo 4,8', category: 'Teologia' },
  { term: 'Diácono', definition: 'Ministro ordenado para o serviço da caridade e da palavra.', reference: 'At 6,1-6', category: 'Ministérios' },
  { term: 'Discípulo', definition: 'Aquele que segue Jesus e aprende seus ensinamentos.', reference: 'Mt 28,19', category: 'Seguimento' },
  { term: 'Dogma', definition: 'Verdade de fé infalivelmente definida pela Igreja.', reference: 'Catecismo §88', category: 'Doutrina' },
  { term: 'Elias', definition: 'Um dos maiores profetas de Israel, arrebatado ao céu em um carro de fogo.', reference: '2Rs 2,11', category: 'Profetas' },
  { term: 'Esperança', definition: 'Virtude teologal pela qual desejamos o Reino dos céus e a vida eterna.', reference: 'Hb 10,23', category: 'Virtudes' },
  { term: 'Espírito Santo', definition: 'A terceira pessoa da Santíssima Trindade, o Paráclito prometido por Jesus.', reference: 'Jo 14,26', category: 'Teologia' },
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
  { term: 'Humildade', definition: 'Virtude que consiste no reconhecimento da própria pequenez diante de Deus.', reference: 'Tg 4,6', category: 'Virtudes' },
  { term: 'Ídolo', definition: 'Qualquer coisa que ocupe o lugar de Deus no coração do homem.', reference: 'Ex 20,3-5', category: 'Moral' },
  { 
    term: 'Igreja', 
    definition: 'O Povo de Deus reunido em Cristo, Corpo Místico de Cristo.', 
    reference: 'Mt 16,18', 
    category: 'Eclesiologia',
    deepInterpretation: 'A Igreja é o mistério da união dos homens com Deus e da unidade de todo o gênero humano.',
    practicalApplication: 'Ser Igreja hoje é viver em comunhão com o Papa e os Bispos, participando ativamente da paróquia.',
    bibleVerses: ['Mt 16,18 (Fundação)', 'Ef 1,22-23 (Corpo de Cristo)', '1Tm 3,15 (Coluna da verdade)'],
    catechismReferences: ['§748-959 (A Igreja no plano de Deus)'],
    magisteriumReferences: ['Lumen Gentium (Vaticano II)']
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
    magisteriumReferences: ['Dignitatis Humanae n. 11']
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
    magisteriumReferences: ['Marialis Cultus (Paulo VI)', 'Redemptoris Mater (João Paulo II)']
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
  { term: 'Orgulho', definition: 'O pecado de se considerar superior a Deus e aos outros.', reference: 'Pr 16,18', category: 'Moral' },
  { term: 'Parábola', definition: 'História contada por Jesus para ensinar verdades espirituais.', reference: 'Mt 13', category: 'Ensinamentos' },
  { term: 'Páscoa', definition: 'A passagem de Jesus da morte para a vida, fundamento da nossa fé.', reference: '1Cor 15,3-4', category: 'Liturgia' },
  { term: 'Pecado', definition: 'Uma ofensa a Deus, uma falta contra a razão, a verdade e a consciência reta.', reference: 'Rm 3,23', category: 'Moral' },
  { term: 'Pentecostes', definition: 'A descida do Espírito Santo sobre os apóstolos reunidos no Cenáculo.', reference: 'At 2,1-4', category: 'Liturgia' },
  { term: 'Perdão', definition: 'O ato de liberdade pelo qual deixamos ir a ofensa e abrimos espaço para a reconciliação com Deus e com o próximo.', reference: 'Mt 6,14-15', category: 'Moral',
    deepInterpretation: 'Perdoar é participar do próprio coração de Deus. "Perdoai-nos as nossas ofensas, assim como nós perdoamos a quem nos tem ofendido." O perdão não é esquecimento, mas liberdade.',
    practicalApplication: 'Pense em alguém que o magoou. Reze por essa pessoa hoje. Peça a graça de perdoar.',
    bibleVerses: ['Mt 18,21-22 (Setenta vezes sete)', 'Lc 23,34 (Pai, perdoai-lhes)', 'Cl 3,13 (Perdoai-vos mutuamente)'],
    catechismReferences: ['§2838-2845 (Perdoai-nos as nossas ofensas)'],
    magisteriumReferences: ['Dives in Misericordia (João Paulo II)']
  },
  { term: 'Profeta', definition: 'Aquele que fala em nome de Deus para o povo.', reference: 'Is 1,1', category: 'Ministérios' },
  { term: 'Purgatório', definition: 'Estado de purificação final dos que morrem na amizade de Deus.', reference: '2Mc 12,45', category: 'Escatologia' },
  { term: 'Quaresma', definition: 'Tempo de preparação de quarenta dias para a celebração da Páscoa.', reference: 'Mt 4,1-11', category: 'Liturgia' },
  { term: 'Querubim', definition: 'Classe de seres angelicais associados à presença e glória de Deus.', reference: 'Ez 10', category: 'Seres Celestiais' },
  { term: 'Reino de Deus', definition: 'A soberania de Deus que se manifesta na justiça, paz e alegria.', reference: 'Mc 1,15', category: 'Ensinamentos' },
  { term: 'Religião', definition: 'O conjunto de crenças e práticas que ligam o homem a Deus.', reference: 'Tg 1,27', category: 'Teologia' },
  { term: 'Ressurreição', definition: 'A vitória de Cristo sobre a morte e a promessa da nossa própria vida eterna.', reference: 'Jo 11,25-26', category: 'Escatologia' },
  { term: 'Romanos', definition: 'Uma das principais cartas de São Paulo, tratando da justificação pela fé.', reference: 'Rm 1,1', category: 'Livros Bíblicos' },
  { term: 'Sábado', definition: 'O dia de descanso consagrado a Deus no Antigo Testamento.', reference: 'Ex 20,8-11', category: 'Lei' },
  { term: 'Sacrifício', definition: 'Oferta feita a Deus como sinal de adoração e entrega.', reference: 'Hb 9,11-14', category: 'Teologia' },
  { term: 'Salvação', definition: 'A libertação do pecado e a vida eterna oferecidas por Cristo.', reference: 'At 4,12', category: 'Soteriologia' },
  { term: 'Sinagoga', definition: 'Lugar de reunião e oração para os judeus.', reference: 'Lc 4,16', category: 'Lugares Sagrados' },
  { term: 'Tabernáculo', definition: 'O lugar onde se guarda o Santíssimo Sacramento.', reference: 'Catecismo §1183', category: 'Objetos Sagrados' },
  { term: 'Teologia', definition: 'O estudo sistemático sobre Deus e as verdades da fé.', reference: 'Teologia', category: 'Ciência Sagrada' },
  { term: 'Trindade', definition: 'O mistério de um só Deus em três pessoas distintas: Pai, Filho e Espírito Santo.', reference: 'Mt 28,19', category: 'Teologia' },
  { term: 'Unção', definition: 'Gesto de consagrar algo ou alguém derramando óleo.', reference: 'Tg 5,14-15', category: 'Sacramentos' },
  { term: 'Urim e Tumim', definition: 'Objetos usados pelos sacerdotes de Israel para consultar a vontade de Deus.', reference: 'Ex 28,30', category: 'Objetos Sagrados' },
  { term: 'Vaticano', definition: 'O centro administrativo e espiritual da Igreja Católica.', reference: 'Eclesiologia', category: 'Eclesiologia' },
  { term: 'Verbo', definition: 'A Palavra eterna de Deus que se fez carne em Jesus Cristo.', reference: 'Jo 1,1-14', category: 'Cristologia' },
  { term: 'Vulgata', definition: 'A tradução da Bíblia para o latim feita por São Jerônimo.', reference: 'História da Igreja', category: 'Tradição' },
  { term: 'Xerxes', definition: 'Rei da Pérsia mencionado no livro de Ester.', reference: 'Et 1,1', category: 'Personagens Bíblicos' },
  { term: 'Yaveh', definition: 'O nome próprio de Deus revelado a Moisés no deserto.', reference: 'Ex 3,14', category: 'Teologia' },
  { term: 'Zacarias', definition: 'Pai de João Batista, que ficou mudo até o nascimento de seu filho.', reference: 'Lc 1,5-25', category: 'Personagens Bíblicos' },
  { term: 'Zaqueu', definition: 'O cobrador de impostos que subiu num sicômoro para ver Jesus e teve sua vida transformada.', reference: 'Lc 19,1-10', category: 'Personagens Bíblicos' },
  { term: 'Zelo', definition: 'Ardor e dedicação profunda às coisas de Deus.', reference: 'Sl 69,9', category: 'Espiritualidade' },
];

/* Featured terms shown as highlight bubbles */
const FEATURED_TERMS = ['Amor', 'Fé', 'Graça', 'Perdão'];

const AZFaithPage: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedLetter, setSelectedLetter] = useState<string | null>('A');
  const [selectedTerm, setSelectedTerm] = useState<FaithTerm | null>(null);

  const alphabet = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'.split('');

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
        </header>

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
          <div className="md:col-span-8">
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
                        {selectedTerm.bibleVerses ? selectedTerm.bibleVerses.map(v => (
                          <Badge key={v} variant="outline" className="bg-blue-500/5 text-blue-700 dark:text-blue-400 border-blue-500/20 rounded-full text-xs font-semibold">
                            {v}
                          </Badge>
                        )) : (
                          <Badge variant="outline" className="bg-blue-500/5 text-blue-700 dark:text-blue-400 border-blue-500/20 rounded-full text-xs font-semibold">
                            {selectedTerm.reference}
                          </Badge>
                        )}
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
                        {selectedTerm.catechismReferences.map(r => (
                          <Badge key={r} variant="outline" className="bg-amber-500/5 text-amber-700 dark:text-amber-400 border-amber-500/20 rounded-full text-xs font-semibold">
                            {r}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Magisterium */}
                  {selectedTerm.magisteriumReferences && (
                    <div className="bg-emerald-500/5 border border-emerald-500/10 rounded-2xl p-4 space-y-2">
                      <div className="flex items-center gap-2">
                        <Globe className="w-4 h-4 text-emerald-600" />
                        <p className="text-[10px] font-black uppercase tracking-widest text-emerald-600">📜 Magistério</p>
                      </div>
                      <div className="flex flex-wrap gap-2">
                        {selectedTerm.magisteriumReferences.map(m => (
                          <Badge key={m} variant="outline" className="bg-emerald-500/5 text-emerald-700 dark:text-emerald-400 border-emerald-500/20 rounded-full text-xs font-semibold">
                            {m}
                          </Badge>
                        ))}
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
      </div>
    </>
  );
};

export default AZFaithPage;
