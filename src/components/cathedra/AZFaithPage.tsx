import React, { useState, useMemo, useEffect, useRef } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Icons } from '../../constants';
import SEOHead from '@/components/SEOHead';
import { AppRoute } from '@/types';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Book, 
  Bookmark, 
  FileText, 
  Tag, 
  Loader2, 
  ChevronRight, 
  Hash, 
  Search, 
  X, 
  BookOpen, 
  Quote, 
  Info, 
  Zap,
  ArrowRight,
  Sparkles,
  Brain,
  Globe,
  Target
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

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
    magisteriumReferences: ['Dei Verbum n. 2-4 (Revelação)', 'Lumen Gentium n. 9 (O Povo de Deus)']
  },
  { term: 'Anjo', definition: 'Mensageiro espiritual de Deus que atua na história da salvação.', reference: 'Hb 1,14', category: 'Seres Celestiais' },
  { term: 'Apocalipse', definition: 'Último livro da Bíblia, que revela a vitória final de Deus sobre o mal.', reference: 'Ap 1,1', category: 'Escatologia' },
  { term: 'Arca da Aliança', definition: 'Símbolo da presença de Deus entre o povo de Israel no deserto.', reference: 'Êx 25,10-22', category: 'Objetos Sagrados' },
  { 
    term: 'Batismo', 
    definition: 'Sacramento do novo nascimento pela água e pelo Espírito Santo.', 
    reference: 'Mt 28,19; Jo 3,5', 
    category: 'Sacramentos',
    deepInterpretation: 'Pelo Batismo, somos libertos do pecado e regenerados como filhos de Deus, tornando-nos membros de Cristo e incorporados à Igreja. É a porta da vida espiritual e o fundamento de toda a vida cristã, imprimindo na alma um caráter espiritual indelével.',
    practicalApplication: 'Honrar nosso batismo significa viver como verdadeiros filhos de Deus no mundo, sendo sal da terra e luz do mundo, e participando ativamente da missão evangelizadora da Igreja.',
    bibleVerses: ['Jo 3,5 (Nascimento da água e Espírito)', 'Mt 28,19 (Mandato missionário)', 'Rm 6,3-4 (Morte e Ressurreição com Cristo)'],
    catechismReferences: ['§1213-1284 (O Sacramento do Batismo)', '§1267 (Membros do Corpo de Cristo)'],
    magisteriumReferences: ['Ad Gentes n. 14 (Iniciação Cristã)', 'Lumen Gentium n. 11 (O exercício do sacerdócio comum)']
  },
  { term: 'Bem-aventuranças', definition: 'O cerne da pregação de Jesus, descrevendo a felicidade do Reino de Deus.', reference: 'Mt 5,3-12', category: 'Ensinamentos' },
  { term: 'Céu', definition: 'A morada eterna de Deus e dos que morrem na sua amizade.', reference: 'Ap 21,1-4', category: 'Escatologia' },
  { term: 'Cristo', definition: 'Título de Jesus que significa "Ungido", o Messias prometido.', reference: 'Mt 16,16', category: 'Cristologia' },
  { term: 'Deus', definition: 'O Criador e Senhor de todas as coisas, Pai de todos os homens.', reference: 'Gn 1,1; 1Jo 4,8', category: 'Teologia' },
  { 
    term: 'Eucaristia', 
    definition: 'O sacramento do Corpo e Sangue de Cristo, fonte e ápice da vida cristã.', 
    reference: 'Lc 22,19-20', 
    category: 'Sacramentos',
    deepInterpretation: 'A Eucaristia é o próprio sacrifício do Corpo e do Sangue do Senhor Jesus, que Ele instituiu para perpetuar o sacrifício da cruz ao longo dos séculos. É o memorial de sua Morte e Ressurreição, o sinal da unidade e o vínculo da caridade.',
    practicalApplication: 'A participação frequente na Missa e a adoração eucarística nos transformam naquilo que recebemos, dando-nos força para amar e servir aos irmãos, especialmente os mais pobres.',
    bibleVerses: ['Jo 6,51-58 (O Pão da Vida)', '1Cor 11,23-26 (A Instituição)', 'Lc 24,30-35 (Emaús)'],
    catechismReferences: ['§1322-1419 (O Sacramento da Eucaristia)', '§1324 (Fonte e Ápice)'],
    magisteriumReferences: ['Sacrosanctum Concilium n. 47-48 (O Mistério Eucarístico)', 'Ecclesia de Eucharistia (João Paulo II)']
  },
  { term: 'Espírito Santo', definition: 'A terceira pessoa da Santíssima Trindade, o Paráclito prometido por Jesus.', reference: 'Jo 14,26', category: 'Teologia' },
  { 
    term: 'Fé', 
    definition: 'A virtude teologal pela qual cremos em Deus e em tudo o que Ele revelou.', 
    reference: 'Hb 11,1', 
    category: 'Virtudes',
    deepInterpretation: 'A fé é, antes de tudo, uma adesão pessoal do homem a Deus; é, ao mesmo tempo e inseparavelmente, o assentimento livre a toda a verdade que Deus revelou. É um dom sobrenatural de Deus, que exige a cooperação livre da vontade humana.',
    practicalApplication: 'Cultivar a fé através do estudo da Palavra, da oração constante e da prática da caridade, confiando em Deus mesmo nos momentos de escuridão e provação.',
    bibleVerses: ['Hb 11 (Os heróis da fé)', 'Rm 1,17 (O justo viverá pela fé)', 'Tg 2,14-26 (Fé e Obras)'],
    catechismReferences: ['§142-184 (A Resposta do homem a Deus)', '§1814-1816 (A virtude da Fé)'],
    magisteriumReferences: ['Lumen Fidei (Papa Francisco)', 'Fides et Ratio (João Paulo II)']
  },
  { term: 'Graça', definition: 'O dom gratuito de Deus que nos torna participantes da sua vida divina.', reference: 'Ef 2,8', category: 'Teologia' },
  { 
    term: 'Igreja', 
    definition: 'O Povo de Deus reunido em Cristo, Corpo Místico de Cristo.', 
    reference: 'Mt 16,18', 
    category: 'Eclesiologia',
    deepInterpretation: 'A Igreja é o mistério da união dos homens com Deus e da unidade de todo o gênero humano. Ela é una, santa, católica e apostólica. É visível em sua estrutura hierárquica e invisível em sua comunhão espiritual com Cristo, sua Cabeça.',
    practicalApplication: 'Ser Igreja hoje é viver em comunhão com o Papa e os Bispos, participando ativamente da paróquia e testemunhando a alegria do Evangelho em todos os ambientes.',
    bibleVerses: ['Mt 16,18 (Fundação)', 'Ef 1,22-23 (Corpo de Cristo)', '1Tm 3,15 (Coluna da verdade)'],
    catechismReferences: ['§748-959 (A Igreja no plano de Deus)', '§811-870 (As notas da Igreja)'],
    magisteriumReferences: ['Lumen Gentium (Vaticano II)', 'Dominus Iesus (Congregação para a Doutrina da Fé)']
  },
  { 
    term: 'Jesus', 
    definition: 'O Filho de Deus feito homem para a nossa salvação.', 
    reference: 'Mt 1,21', 
    category: 'Cristologia',
    deepInterpretation: 'Jesus Cristo é verdadeiro Deus e verdadeiro homem, na unidade de sua Pessoa divina. Ele é o único Mediador entre Deus e os homens. Sua vida, morte e ressurreição constituem o evento central da história humana e o fundamento da esperança cristã.',
    practicalApplication: 'Seguir a Jesus significa imitá-lo no amor, no serviço e na obediência ao Pai, buscando ter os mesmos sentimentos que Ele teve.',
    bibleVerses: ['Jo 1,1-14 (O Verbo encarnado)', 'Mt 16,16 (Confissão de Pedro)', 'Fl 2,5-11 (O hino cristológico)'],
    catechismReferences: ['§422-682 (Creio em Jesus Cristo)', '§464-469 (Verdadeiro Deus e verdadeiro Homem)'],
    magisteriumReferences: ['Dignitatis Humanae n. 11 (O exemplo de Cristo)', 'Jesus Christ the Bearer of the Water of Life']
  },
  { 
    term: 'Maria', 
    definition: 'A mãe de Jesus e mãe da Igreja, cheia de graça.', 
    reference: 'Lc 1,26-38', 
    category: 'Mariologia',
    deepInterpretation: 'Maria é a Mãe de Deus (Theotokos) por ter concebido pelo Espírito Santo o Filho de Deus feito homem. Ela é a primeira discípula, aquela que acreditou e colaborou plenamente com o plano da salvação. Sua Assunção aos céus é sinal de esperança para toda a Igreja.',
    practicalApplication: 'Consagrar-se a Maria é permitir que ela nos leve a Jesus, seguindo seu conselho nas Bodas de Caná: "Fazei tudo o que Ele vos disser".',
    bibleVerses: ['Lc 1,26-38 (Anunciação)', 'Jo 19,25-27 (Aos pés da cruz)', 'Ap 12,1 (A Mulher vestida de sol)'],
    catechismReferences: ['§484-511 (Maria, Mãe de Cristo)', '§963-975 (Maria, Mãe da Igreja)'],
    magisteriumReferences: ['Marialis Cultus (Paulo VI)', 'Redemptoris Mater (João Paulo II)']
  },
  { 
    term: 'Oração', 
    definition: 'O diálogo de amor entre o homem e Deus.', 
    reference: 'Mt 6,5-15', 
    category: 'Espiritualidade',
    deepInterpretation: 'A oração é a elevação da alma a Deus ou o pedido a Deus de bens convenientes. É um dom da graça e uma resposta decidida da nossa parte. Sempre pressupõe um esperto: a oração é um combate contra nós mesmos e contra as astúcias do Tentador.',
    practicalApplication: 'Estabelecer momentos fixos de oração diária, como o oferecimento do dia, o Rosário ou a Lectio Divina, cultivando a presença de Deus em meio às tarefas cotidianas.',
    bibleVerses: ['Mt 6,5-15 (O Pai Nosso)', 'Lc 18,1 (Orar sem cessar)', '1Ts 5,17 (Rezai sem interrupção)'],
    catechismReferences: ['§2558-2865 (A Oração Cristã)', '§2626-2643 (As formas de oração)'],
    magisteriumReferences: ['Novo Millennio Ineunte n. 32-34 (A arte da oração)', 'Verbum Domini (Bento XVI)']
  },
  { term: 'Pecado', definition: 'Uma ofensa a Deus, uma falta contra a razão, a verdade e a consciência reta.', reference: 'Rm 3,23', category: 'Moral' },
  { term: 'Reino de Deus', definition: 'A soberania de Deus que se manifesta na justiça, paz e alegria.', reference: 'Mc 1,15', category: 'Ensinamentos' },
  { term: 'Salvação', definition: 'A libertação do pecado e a vida eterna oferecidas por Cristo.', reference: 'At 4,12', category: 'Soteriologia' },
  { term: 'Trindade', definition: 'O mistério de um só Deus em três pessoas distintas: Pai, Filho e Espírito Santo.', reference: 'Mt 28,19', category: 'Teologia' },
  { term: 'Beatitude', definition: 'O estado de suprema felicidade e bem-aventurança na presença de Deus.', reference: 'Mt 5,3', category: 'Teologia' },
  { term: 'Caridade', definition: 'A virtude teologal pela qual amamos a Deus sobre todas as coisas e ao próximo como a nós mesmos.', reference: '1Cor 13', category: 'Virtudes' },
  { term: 'Dogma', definition: 'Verdade de fé infalivelmente definida pela Igreja.', reference: 'Catecismo §88', category: 'Doutrina' },
  { term: 'Esperança', definition: 'Virtude teologal pela qual desejamos o Reino dos céus e a vida eterna.', reference: 'Hb 10,23', category: 'Virtudes' },
  { term: 'Gênesis', definition: 'Primeiro livro da Bíblia, que narra as origens do mundo e da humanidade.', reference: 'Gn 1,1', category: 'Livros Bíblicos' },
  { term: 'Humildade', definition: 'Virtude que consiste no reconhecimento da própria pequenez diante de Deus.', reference: 'Tg 4,6', category: 'Virtudes' },
  { term: 'Ídolo', definition: 'Qualquer coisa que ocupe o lugar de Deus no coração do homem.', reference: 'Ex 20,3-5', category: 'Moral' },
  { term: 'Jerusalém', definition: 'A cidade santa, centro da vida religiosa de Israel e símbolo da Igreja triunfante.', reference: 'Sl 122', category: 'Geografia Bíblica' },
  { term: 'Lei', definition: 'Os mandamentos dados por Deus a Moisés para guiar o povo.', reference: 'Ex 20', category: 'Moral' },
  { term: 'Missa', definition: 'A celebração do sacrifício eucarístico da Igreja.', reference: '1Cor 11,23-26', category: 'Liturgia' },
  { term: 'Natal', definition: 'Celebração do nascimento de Jesus Cristo, o Verbo encarnado.', reference: 'Lc 2,1-20', category: 'Liturgia' },
  { term: 'Orgulho', definition: 'O pecado de se considerar superior a Deus e aos outros.', reference: 'Pr 16,18', category: 'Moral' },
  { term: 'Páscoa', definition: 'A passagem de Jesus da morte para a vida, fundamento da nossa fé.', reference: '1Cor 15,3-4', category: 'Liturgia' },
  { term: 'Quaresma', definition: 'Tempo de preparação de quarenta dias para a celebração da Páscoa.', reference: 'Mt 4,1-11', category: 'Liturgia' },
  { term: 'Ressurreição', definition: 'A vitória de Cristo sobre a morte e a promessa da nossa própria vida eterna.', reference: 'Jo 11,25-26', category: 'Escatologia' },
  { term: 'Sacrifício', definition: 'Oferta feita a Deus como sinal de adoração e entrega.', reference: 'Hb 9,11-14', category: 'Teologia' },
  { term: 'Tabernáculo', definition: 'O lugar onde se guarda o Santíssimo Sacramento.', reference: 'Catecismo §1183', category: 'Objetos Sagrados' },
  { term: 'Unção', definition: 'Gesto de consagrar algo ou alguém derramando óleo.', reference: 'Tg 5,14-15', category: 'Sacramentos' },
  { term: 'Verbo', definition: 'A Palavra eterna de Deus que se fez carne em Jesus Cristo.', reference: 'Jo 1,1-14', category: 'Cristologia' },
  { term: 'Zelo', definition: 'Ardor e dedicação profunda às coisas de Deus.', reference: 'Sl 69,9', category: 'Espiritualidade' },
  { term: 'Zaqueu', definition: 'O cobrador de impostos que subiu num sicômoro para ver Jesus e teve sua vida transformada.', reference: 'Lc 19,1-10', category: 'Personagens Bíblicos' },
  { term: 'Zacarias', definition: 'Pai de João Batista, que ficou mudo até o nascimento de seu filho.', reference: 'Lc 1,5-25', category: 'Personagens Bíblicos' },
  { term: 'Yaveh', definition: 'O nome próprio de Deus revelado a Moisés no deserto.', reference: 'Ex 3,14', category: 'Teologia' },
  { term: 'Xerxes', definition: 'Rei da Pérsia mencionado no livro de Ester.', reference: 'Et 1,1', category: 'Personagens Bíblicos' },
  { term: 'Vulgata', definition: 'A tradução da Bíblia para o latim feita por São Jerônimo.', reference: 'História da Igreja', category: 'Tradição' },
  { term: 'Vaticano', definition: 'O centro administrativo e espiritual da Igreja Católica.', reference: 'Eclesiologia', category: 'Eclesiologia' },
  { term: 'Urim e Tumim', definition: 'Objetos usados pelos sacerdotes de Israel para consultar a vontade de Deus.', reference: 'Ex 28,30', category: 'Objetos Sagrados' },
  { term: 'Teologia', definition: 'O estudo sistemático sobre Deus e as verdades da fé.', reference: 'Teologia', category: 'Ciência Sagrada' },
  { term: 'Sinagoga', definition: 'Lugar de reunião e oração para os judeus.', reference: 'Lc 4,16', category: 'Lugares Sagrados' },
  { term: 'Sábado', definition: 'O dia de descanso consagrado a Deus no Antigo Testamento.', reference: 'Ex 20,8-11', category: 'Lei' },
  { term: 'Romanos', definition: 'Uma das principais cartas de São Paulo, tratando da justificação pela fé.', reference: 'Rm 1,1', category: 'Livros Bíblicos' },
  { term: 'Religião', definition: 'O conjunto de crenças e práticas que ligam o homem a Deus.', reference: 'Tg 1,27', category: 'Teologia' },
  { term: 'Querubim', definition: 'Classe de seres angelicais associados à presença e glória de Deus.', reference: 'Ez 10', category: 'Seres Celestiais' },
  { term: 'Profeta', definition: 'Aquele que fala em nome de Deus para o povo.', reference: 'Is 1,1', category: 'Ministérios' },
  { term: 'Purgatório', definition: 'Estado de purificação final dos que morrem na amizade de Deus.', reference: '2Mc 12,45', category: 'Escatologia' },
  { term: 'Pentecostes', definition: 'A descida do Espírito Santo sobre os apóstolos reunidos no Cenáculo.', reference: 'At 2,1-4', category: 'Liturgia' },
  { term: 'Parábola', definition: 'História contada por Jesus para ensinar verdades espirituais.', reference: 'Mt 13', category: 'Ensinamentos' },
  { term: 'Noé', definition: 'O patriarca que construiu a arca para salvar sua família e os animais do dilúvio.', reference: 'Gn 6-9', category: 'Patriarcas' },
  { term: 'Moisés', definition: 'O grande profeta e legislador que libertou Israel do Egito.', reference: 'Ex 3', category: 'Patriarcas' },
  { term: 'Misticismo', definition: 'A busca pela união íntima e direta com o divino através da oração e contemplação.', reference: 'Espiritualidade', category: 'Espiritualidade' },
  { term: 'Liturgia', definition: 'O culto público e oficial da Igreja.', reference: 'Liturgia', category: 'Liturgia' },
  { term: 'Lázaro', definition: 'O amigo de Jesus que foi ressuscitado após quatro dias no túmulo.', reference: 'Jo 11', category: 'Personagens Bíblicos' },
  { term: 'Kerygma', definition: 'O anúncio fundamental da mensagem cristã: a morte e ressurreição de Jesus.', reference: 'At 2,22-24', category: 'Teologia' },
  { term: 'Job', definition: 'O homem justo que sofreu provações imensas mas manteve sua fé em Deus.', reference: 'Jó 1', category: 'Personagens Bíblicos' },
  { term: 'Isabel', definition: 'Mãe de João Batista e parente de Maria.', reference: 'Lc 1,5', category: 'Personagens Bíblicos' },
  { term: 'Imaculada Conceição', definition: 'O dogma de que Maria foi preservada do pecado original desde o primeiro instante de sua existência.', reference: 'Dogma', category: 'Mariologia' },
  { term: 'Heresia', definition: 'A negação ou dúvida obstinada de uma verdade que se deve crer com fé divina e católica.', reference: 'Doutrina', category: 'Moral' },
  { term: 'Gloria', definition: 'O resplendor da santidade e majestade de Deus.', reference: 'Ex 33,18-23', category: 'Teologia' },
  { term: 'Franciscano', definition: 'Relativo à ordem religiosa fundada por São Francisco de Assis.', reference: 'Tradição', category: 'Ordens Religiosas' },
  { term: 'Evangelização', definition: 'A missão de anunciar o Evangelho a todas as criaturas.', reference: 'Mc 16,15', category: 'Missão' },
  { term: 'Elias', definition: 'Um dos maiores profetas de Israel, arrebatado ao céu em um carro de fogo.', reference: '2Rs 2,11', category: 'Profetas' },
  { term: 'Discípulo', definition: 'Aquele que segue Jesus e aprende seus ensinamentos.', reference: 'Mt 28,19', category: 'Seguimento' },
  { term: 'Diácono', definition: 'Ministro ordenado para o serviço da caridade e da palavra.', reference: 'At 6,1-6', category: 'Ministérios' },
  { term: 'Cântico dos Cânticos', definition: 'Livro bíblico que celebra o amor humano como reflexo do amor divino.', reference: 'Ct 1,1', category: 'Livros Bíblicos' },
  { term: 'Cáritas', definition: 'O amor cristão traduzido em obras de misericórdia.', reference: '1Cor 13', category: 'Virtudes' },
  { term: 'Batista', definition: 'Aquele que batiza, título dado a João, o precursor de Jesus.', reference: 'Mt 3,1', category: 'Personagens Bíblicos' },
  { term: 'Babilônia', definition: 'Símbolo do exílio de Israel e do poder mundano oposto a Deus.', reference: 'Sl 137', category: 'Geografia Bíblica' },
  { term: 'Apóstolo', definition: 'Um dos doze escolhidos por Jesus para serem testemunhas de sua ressurreição.', reference: 'Lc 6,13', category: 'Ministérios' },
  { term: 'Amém', definition: 'Palavra hebraica que significa "assim seja" ou "verdadeiramente".', reference: 'Ap 3,14', category: 'Liturgia' },
];

const AZFaithPage: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [selectedLetter, setSelectedLetter] = useState<string | null>('A');
  const [selectedTerm, setSelectedTerm] = useState<FaithTerm | null>(null);

  const categories = useMemo(() => {
    const cats = new Set(FAITH_TERMS.map(t => t.category).filter(Boolean) as string[]);
    return Array.from(cats).sort();
  }, []);

  const letterStatus = useMemo(() => {
    const status: Record<string, boolean> = {};
    'ABCDEFGHIJKLMNOPQRSTUVWXYZ'.split('').forEach(l => {
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
      setSelectedCategory(null);
    }
  }, [location.search]);
  
  const alphabet = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'.split('');
  const scrollRef = useRef<HTMLDivElement>(null);

  const filteredTerms = useMemo(() => {
    let result = FAITH_TERMS;
    
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      result = result.filter(t => 
        t.term.toLowerCase().includes(q) || 
        t.definition.toLowerCase().includes(q) ||
        t.category?.toLowerCase().includes(q)
      );
    } else if (selectedCategory) {
      result = result.filter(t => t.category === selectedCategory);
    } else if (selectedLetter) {
      result = result.filter(t => t.term.toUpperCase().startsWith(selectedLetter));
    }
    
    return result.sort((a, b) => a.term.localeCompare(b.term));
  }, [searchQuery, selectedLetter, selectedCategory]);

  const handleLetterClick = (letter: string) => {
    setSelectedLetter(letter);
    setSearchQuery('');
    setSelectedCategory(null);
    setSelectedTerm(null);
  };

  const handleCategoryClick = (category: string | null) => {
    setSelectedCategory(category);
    setSearchQuery('');
    setSelectedLetter(null);
    setSelectedTerm(null);
  };

  const handleTermClick = (term: FaithTerm) => {
    setSelectedTerm(selectedTerm?.term === term.term ? null : term);
    if (window.innerWidth < 768) {
      setTimeout(() => {
        document.getElementById('term-content')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }, 100);
    }
  };

  return (
    <>
      <SEOHead 
        title="A–Z da Fé | Cathedra" 
        description="Explore o índice alfabético de termos bíblicos e teológicos da Bíblia Ave Maria através de um sistema intuitivo de bolhas."
        path="/az-faith"
      />
      
      <div className="max-w-5xl mx-auto space-y-10 pb-24 animate-in fade-in slide-in-from-bottom-4 duration-500 px-4 md:px-0">
        {/* Header */}
        <header className="text-center space-y-4 pt-6">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 bg-primary/5 rounded-full border border-primary/10 mb-2">
            <BookOpen className="w-4 h-4 text-primary" />
            <span className="text-[10px] font-black uppercase tracking-widest text-primary">Índice Alfabético da Fé</span>
          </div>
          <h1 className="text-4xl md:text-5xl font-extrabold tracking-tight bg-gradient-to-r from-primary via-primary/80 to-primary/60 bg-clip-text text-transparent">
            A–Z da Fé
          </h1>
          <p className="text-muted-foreground text-lg max-w-2xl mx-auto font-medium">
            Navegue pelos conceitos fundamentais da doutrina católica através do nosso sistema de temas integrados.
          </p>
        </header>

        {/* Search & Alphabet Integration */}
        <div className="space-y-6">
          <div className="relative group max-w-xl mx-auto">
            <div className="absolute -inset-1 bg-gradient-to-r from-primary/20 to-transparent blur opacity-25 group-focus-within:opacity-100 transition duration-1000" />
            <div className="relative">
              <Search className="absolute left-5 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground group-focus-within:text-primary transition-colors" />
              <input
                type="text"
                placeholder="Buscar por termo, definição ou categoria..."
                value={searchQuery}
                onChange={(e) => {
                  setSearchQuery(e.target.value);
                  if (e.target.value) setSelectedLetter(null);
                }}
                className="w-full pl-14 pr-6 py-4 bg-card/50 backdrop-blur-md border border-border/60 rounded-[2rem] focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary/40 transition-all text-base shadow-sm"
              />
              {searchQuery && (
                <button 
                  onClick={() => setSearchQuery('')}
                  className="absolute right-5 top-1/2 -translate-y-1/2 p-1 hover:bg-muted rounded-full transition-colors"
                >
                  <X className="w-5 h-5 text-muted-foreground" />
                </button>
              )}
            </div>
          </div>

          <div className="flex flex-col gap-4">
            <div className="flex flex-wrap justify-center gap-1.5 max-w-4xl mx-auto px-2">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => handleCategoryClick(null)}
                className={`rounded-full px-4 h-9 text-[10px] font-black uppercase tracking-widest ${!selectedCategory && !selectedLetter && !searchQuery ? 'bg-primary text-primary-foreground' : ''}`}
              >
                Tudo
              </Button>
              {categories.slice(0, 10).map(cat => (
                <Button
                  key={cat}
                  variant="ghost"
                  size="sm"
                  onClick={() => handleCategoryClick(cat)}
                  className={`rounded-full px-4 h-9 text-[10px] font-black uppercase tracking-widest ${selectedCategory === cat ? 'bg-primary text-primary-foreground' : 'bg-muted/30 text-muted-foreground'}`}
                >
                  {cat}
                </Button>
              ))}
            </div>

            <div className="relative group">
              <div className="absolute -inset-1 bg-gradient-to-r from-primary/5 to-transparent blur opacity-50 transition duration-1000" />
              <div className="relative flex flex-wrap justify-center gap-1.5 p-2 bg-card/30 backdrop-blur-sm rounded-3xl border border-border/40 max-w-4xl mx-auto overflow-hidden">
                {alphabet.map(letter => {
                  const hasTerms = letterStatus[letter];
                  const isSelected = selectedLetter === letter;
                  return (
                    <motion.button
                      key={letter}
                      whileHover={hasTerms ? { scale: 1.1, y: -2 } : {}}
                      whileTap={hasTerms ? { scale: 0.9 } : {}}
                      onClick={() => hasTerms && handleLetterClick(letter)}
                      disabled={!hasTerms}
                      className={`w-9 h-9 flex items-center justify-center rounded-xl text-xs font-black transition-all duration-300 border
                        ${isSelected 
                          ? 'bg-primary text-primary-foreground border-primary shadow-lg shadow-primary/20 ring-2 ring-primary/10' 
                          : hasTerms 
                            ? 'bg-card/50 text-foreground border-border/80 hover:border-primary/40 hover:text-primary hover:bg-white dark:hover:bg-slate-900 shadow-sm' 
                            : 'opacity-10 grayscale cursor-not-allowed border-transparent'}`}
                    >
                      {letter}
                    </motion.button>
                  );
                })}
              </div>
            </div>
          </div>
        </div>

        {/* Term Bubbles */}
        <div className="relative group">
          <div className="absolute -inset-2 bg-gradient-to-b from-primary/5 to-transparent blur-2xl opacity-50" />
          <div className="relative flex flex-wrap justify-center gap-3 p-6 min-h-[100px]">
            <AnimatePresence mode="popLayout">
              {filteredTerms.map((t, idx) => {
                const isSelected = selectedTerm?.term === t.term;
                return (
                  <motion.button
                    layout
                    key={t.term}
                    initial={{ opacity: 0, scale: 0.8 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.8 }}
                    transition={{ duration: 0.2, delay: idx * 0.02 }}
                    whileHover={{ scale: 1.05, y: -2 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={() => handleTermClick(t)}
                    className={`
                      px-6 py-3 rounded-full text-sm font-bold transition-all duration-300
                      flex items-center gap-2 border shadow-sm
                      ${isSelected 
                        ? 'bg-primary text-primary-foreground border-primary shadow-primary/40 ring-4 ring-primary/10 z-10' 
                        : 'bg-card/40 backdrop-blur-md text-muted-foreground border-border/60 hover:border-primary/40 hover:text-primary hover:bg-white dark:hover:bg-slate-900'
                      }
                    `}
                  >
                    <Hash className={`h-3.5 w-3.5 ${isSelected ? 'text-primary-foreground' : 'text-primary/40'}`} />
                    {t.term}
                  </motion.button>
                );
              })}
            </AnimatePresence>
            {filteredTerms.length === 0 && (
              <div className="w-full text-center py-12 text-muted-foreground font-medium italic">
                Nenhum termo encontrado para este filtro.
              </div>
            )}
          </div>
        </div>

        {/* Content Hub Area */}
        <div id="term-content" className="min-h-[400px]">
          <AnimatePresence mode="wait">
            {!selectedTerm ? (
              <motion.div
                key="empty"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                className="min-h-[400px] flex flex-col items-center justify-center text-center p-8 bg-muted/10 rounded-[3rem] border border-dashed border-border/40 relative overflow-hidden"
              >
                <div className="absolute inset-0 bg-gradient-to-br from-primary/5 to-transparent opacity-50" />
                <div className="relative z-10 space-y-8">
                  <div className="w-24 h-24 rounded-full bg-primary/10 flex items-center justify-center mx-auto border border-primary/20 shadow-xl animate-bounce duration-3000">
                    <Sparkles className="h-10 w-10 text-primary" />
                  </div>
                  <div className="space-y-4">
                    <h3 className="text-3xl font-black text-foreground tracking-tight">Tesouros da Fé</h3>
                    <p className="text-muted-foreground max-w-sm mx-auto text-lg">
                      Selecione um termo para mergulhar em sua profundidade teológica.
                    </p>
                  </div>
                  <Button 
                    variant="outline" 
                    onClick={() => {
                      const random = FAITH_TERMS[Math.floor(Math.random() * FAITH_TERMS.length)];
                      setSelectedTerm(random);
                      if (window.innerWidth < 768) {
                        document.getElementById('term-content')?.scrollIntoView({ behavior: 'smooth' });
                      }
                    }}
                    className="rounded-full border-primary/20 hover:bg-primary/10 px-8 h-12 gap-3"
                  >
                    <Zap className="w-5 h-5 text-primary" />
                    <span>Descobrir termo aleatório</span>
                  </Button>
                </div>
              </motion.div>
            ) : (
              <motion.div
                key={selectedTerm.term}
                initial={{ opacity: 0, scale: 0.95, y: 20 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95, y: -20 }}
                transition={{ type: "spring", damping: 25, stiffness: 200 }}
                className="space-y-8"
              >
                {/* Hero Card for Selected Term */}
                <div className="bg-gradient-to-br from-card via-card to-primary/5 border border-border/60 rounded-[3rem] p-8 md:p-12 shadow-2xl relative overflow-hidden group">
                  <div className="absolute top-0 right-0 w-64 h-64 bg-primary/5 rounded-full blur-3xl -mr-20 -mt-20 group-hover:bg-primary/10 transition-colors duration-1000" />
                  
                  <div className="relative flex flex-col md:flex-row md:items-center justify-between gap-8 mb-10">
                    <div className="space-y-4">
                      <div className="flex items-center gap-3">
                        <span className="h-1.5 w-12 bg-primary rounded-full shadow-[0_0_10px_rgba(var(--primary),0.5)]" />
                        <Badge variant="secondary" className="bg-primary/10 text-primary border-none px-4 py-1 text-[10px] uppercase tracking-[0.2em] font-black">
                          {selectedTerm.category || 'Conceito de Fé'}
                        </Badge>
                      </div>
                      <h2 className="text-5xl md:text-7xl font-black tracking-tighter leading-none text-foreground">
                        {selectedTerm.term}
                      </h2>
                    </div>
                    <Button 
                      onClick={() => navigate(`${AppRoute.STUDY_MODE}?topic=${encodeURIComponent(selectedTerm.term)}`)}
                      className="rounded-full bg-primary hover:bg-primary/90 text-primary-foreground shadow-xl shadow-primary/20 h-14 px-8 gap-3 group/ai"
                    >
                      <Brain className="h-5 w-5 transition-transform group-hover/ai:scale-110" />
                      <span className="font-bold tracking-tight">Colloquium IA</span>
                    </Button>
                  </div>

                  <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 items-start">
                    <div className="lg:col-span-7 space-y-8">
                      <div className="relative">
                        <Quote className="absolute -left-6 -top-4 h-12 w-12 text-primary/10 -z-10" />
                        <p className="text-2xl md:text-3xl text-foreground/90 leading-snug font-medium italic">
                          {selectedTerm.definition}
                        </p>
                      </div>
                      
                      {selectedTerm.deepInterpretation && (
                        <div className="p-8 bg-primary/5 rounded-[2.5rem] border border-primary/10 space-y-4 shadow-inner relative group/interpret">
                          <div className="flex items-center gap-2 text-primary">
                            <Sparkles className="h-5 w-5 animate-pulse" />
                            <h4 className="text-xs font-black uppercase tracking-widest">Interpretação Profunda</h4>
                          </div>
                          <p className="text-muted-foreground leading-relaxed text-lg italic font-serif">
                            {selectedTerm.deepInterpretation}
                          </p>
                        </div>
                      )}
                    </div>

                    <div className="lg:col-span-5 space-y-6">
                      {selectedTerm.practicalApplication && (
                        <div className="bg-card/40 backdrop-blur-sm border border-border/40 rounded-[2rem] p-6 space-y-4">
                          <div className="flex items-center gap-2 text-secondary">
                            <Target className="h-5 w-5" />
                            <h4 className="text-xs font-black uppercase tracking-widest">Vida Prática</h4>
                          </div>
                          <p className="text-foreground/80 leading-relaxed font-medium">
                            {selectedTerm.practicalApplication}
                          </p>
                        </div>
                      )}

                      <div className="grid grid-cols-1 gap-4">
                        <div className="flex flex-col gap-3">
                          <div className="flex items-center gap-2 text-muted-foreground">
                            <BookOpen className="h-4 w-4" />
                            <h4 className="text-[10px] font-black uppercase tracking-widest">Fontes & Referências</h4>
                          </div>
                          <div className="flex flex-wrap gap-2">
                            {selectedTerm.bibleVerses?.map(v => (
                              <Badge key={v} variant="outline" className="bg-blue-500/5 text-blue-600 border-blue-500/20 px-3 py-1 rounded-full font-bold">
                                <Book className="mr-1.5 h-3 w-3" /> {v}
                              </Badge>
                            ))}
                            {selectedTerm.catechismReferences?.map(r => (
                              <Badge key={r} variant="outline" className="bg-amber-500/5 text-amber-600 border-amber-500/20 px-3 py-1 rounded-full font-bold">
                                <Bookmark className="mr-1.5 h-3 w-3" /> {r}
                              </Badge>
                            ))}
                            {selectedTerm.magisteriumReferences?.map(m => (
                              <Badge key={m} variant="outline" className="bg-emerald-500/5 text-emerald-600 border-emerald-500/20 px-3 py-1 rounded-full font-bold">
                                <Globe className="mr-1.5 h-3 w-3" /> {m}
                              </Badge>
                            ))}
                            {!selectedTerm.bibleVerses && selectedTerm.reference && (
                              <Badge variant="outline" className="bg-primary/5 text-primary border-primary/20 px-3 py-1 rounded-full font-bold">
                                <Info className="mr-1.5 h-3 w-3" /> {selectedTerm.reference}
                              </Badge>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Additional Content Tabs - To be integrated with real data if needed */}
                <div className="pt-8">
                  <div className="flex items-center justify-between mb-8 px-4">
                    <h3 className="text-2xl font-bold flex items-center gap-3">
                      <Zap className="h-6 w-6 text-primary" />
                      Conteúdos Conectados
                    </h3>
                    <Button variant="ghost" className="text-muted-foreground hover:text-primary gap-2 font-bold uppercase tracking-widest text-[10px]">
                      Ver tudo <ArrowRight className="h-4 w-4" />
                    </Button>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <ContentTypeCard 
                      title="Estudo Bíblico" 
                      description={`Aprofunde sua visão sobre ${selectedTerm.term} nas Escrituras.`}
                      icon={<Book className="h-8 w-8" />}
                      color="blue"
                    />
                    <ContentTypeCard 
                      title="Doutrina da Fé" 
                      description={`O que o Catecismo ensina especificamente sobre ${selectedTerm.term}.`}
                      icon={<Bookmark className="h-8 w-8" />}
                      color="amber"
                    />
                    <ContentTypeCard 
                      title="Voz dos Papas" 
                      description={`Documentos pontifícios que citam ou explicam ${selectedTerm.term}.`}
                      icon={<FileText className="h-8 w-8" />}
                      color="emerald"
                    />
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </>
  );
};

interface ContentTypeCardProps {
  title: string;
  description: string;
  icon: React.ReactNode;
  color: 'blue' | 'amber' | 'emerald';
}

const ContentTypeCard = ({ title, description, icon, color }: ContentTypeCardProps) => {
  const colors = {
    blue: "from-blue-500/20 text-blue-600 border-blue-500/20",
    amber: "from-amber-500/20 text-amber-600 border-amber-500/20",
    emerald: "from-emerald-500/20 text-emerald-600 border-emerald-500/20"
  };

  return (
    <Card className="rounded-[2.5rem] border-border/40 bg-card/40 backdrop-blur-md hover:border-primary/40 transition-all duration-500 group cursor-pointer overflow-hidden shadow-sm hover:shadow-xl">
      <CardContent className="p-8 space-y-4">
        <div className={`w-16 h-16 rounded-2xl bg-gradient-to-br ${colors[color]} to-transparent flex items-center justify-center transition-transform duration-500 group-hover:scale-110 group-hover:rotate-3`}>
          {icon}
        </div>
        <CardTitle className="text-xl font-bold group-hover:text-primary transition-colors">{title}</CardTitle>
        <CardDescription className="text-base font-medium leading-relaxed">{description}</CardDescription>
        <div className="pt-2 flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-primary opacity-0 group-hover:opacity-100 transition-all duration-500 -translate-x-2 group-hover:translate-x-0">
          Explorar Agora <ArrowRight className="h-3 w-3" />
        </div>
      </CardContent>
    </Card>
  );
};

export default AZFaithPage;
