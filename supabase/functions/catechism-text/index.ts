import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.38.4";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version',
  'Content-Type': 'application/json',
};

// In-memory cache for AI-generated paragraphs (per instance lifetime)
const aiCache: Record<number, string> = {};

// Key paragraphs in Portuguese (embedded for instant access)
const PT_PARAGRAPHS: Record<number, string> = {
  1: 'Deus, infinitamente perfeito e bem-aventurado em si mesmo, num desígnio de pura bondade, criou livremente o homem para o tornar participante da sua vida bem-aventurada. É por isso que, em todo o tempo e em todo o lugar, Ele está perto do homem. Chama-o e ajuda-o a procurá Lo, a conhecê Lo e a amá Lo com todas as suas forças. Convoca todos os homens, dispersos pelo pecado, para a unidade da sua família, a Igreja. Para isso, enviou o seu Filho como Redentor e Salvador, quando chegou a plenitude dos tempos. N\'Ele e por Ele, chama os homens a tornarem-se, no Espírito Santo, seus filhos adotivos e, portanto, herdeiros da sua vida bem-aventurada.',
  2: 'Para que este apelo ressoasse por toda a terra, Cristo enviou os Apóstolos que tinha escolhido, dando-lhes o mandato de anunciar o Evangelho: «Ide, pois, fazei discípulos de todos os povos, batizando-os em nome do Pai, do Filho e do Espírito Santo, ensinando-os a cumprir tudo quanto vos tenho mandado. E sabei que Eu estarei sempre convosco até ao fim dos tempos» (Mt 28,19-20).',
  3: 'Os que, com a ajuda de Deus, acolheram o chamamento de Cristo e lhe responderam livremente foram, por sua vez, levados pelo amor de Cristo a anunciar por toda a parte a Boa-Nova. Este tesouro, recebido dos Apóstolos, foi fielmente guardado pelos seus sucessores. Todos os fiéis de Cristo são chamados a transmiti-lo de geração em geração, anunciando a fé, vivendo-a na comunhão fraterna e celebrando-a na liturgia e na oração.',
  4: 'O Catecismo, que aqui vos apresentamos, é uma exposição da fé da Igreja e da doutrina católica, atestadas e esclarecidas pela Sagrada Escritura, pela Tradição apostólica e pelo Magistério da Igreja. Apresento-o como um instrumento válido e legítimo ao serviço da comunhão eclesial e como norma segura para o ensino da fé.',
  5: 'Este Catecismo destina-se principalmente aos responsáveis pela catequese: em primeiro lugar, aos bispos, como doutores da fé e pastores da Igreja. É-lhes oferecido como instrumento no cumprimento da sua missão de ensinar o Povo de Deus.',
  6: 'O presente Catecismo não se destina a substituir os catecismos locais devidamente aprovados pelas autoridades eclesiásticas. Destina-se a encorajar e ajudar a elaboração de novos catecismos locais, que guardem cuidadosamente a unidade da fé e a fidelidade à doutrina católica.',
  7: 'Este Catecismo compreende quatro partes, que se referem às quatro leis fundamentais da vida em Cristo: a profissão de fé, a celebração do mistério cristão, a vida em Cristo, e a oração cristã.',
  8: 'A primeira parte, «A profissão de fé», é uma exposição dos artigos do Credo: o que a fé cristã nos ensina a crer.',
  9: 'A segunda parte, «A celebração do mistério cristão», apresenta os elementos essenciais da liturgia e dos sacramentos: o que a fé cristã nos ensina a celebrar.',
  10: 'A terceira parte, «A vida em Cristo», apresenta a moral cristã: o que a fé cristã nos ensina a viver.',
  11: 'A quarta parte, «A oração cristã», apresenta a oração e, em especial, a oração do Pai-Nosso: o que a fé cristã nos ensina a rezar.',
  12: 'Que nos trará a leitura deste Catecismo? A leitura do Catecismo da Igreja Católica pode oferecer uma apresentação orgânica e sintética do conteúdo essencial e fundamental da doutrina católica tanto em matéria de fé como de moral, à luz do Concílio Vaticano II e do conjunto da Tradição da Igreja.',
  13: 'O Catecismo está organizado em torno de quatro pilares fundamentais: a profissão de fé batismal (o Símbolo), os sacramentos da fé, a vida da fé (os mandamentos), a oração do crente (o Pai-Nosso).',
  14: 'O Catecismo da Igreja Católica, que foi aprovado em 25 de Junho de 1992 e cuja publicação foi ordenada pela autoridade apostólica, é uma exposição da fé da Igreja e da doutrina católica.',
  15: 'A fim de melhor guardar o depósito da fé, o Catecismo retoma frequentemente o Catecismo Romano, publicado na sequência do Concílio de Trento.',
  16: 'A grande tradição catequética recorda a importância de familiarizar os fiéis com certos aspetos essenciais da doutrina cristã: os artigos da fé, os sacramentos, o Decálogo, a oração do Pai-Nosso.',
  17: 'O presente Catecismo é um instrumento válido e legítimo ao serviço da comunhão eclesial e como norma segura para o ensino da fé. Sirva ele para a renovação a que o Espírito Santo chama incessantemente a Igreja de Deus.',
  18: 'Este Catecismo é oferecido a todos os fiéis que desejam aprofundar o conhecimento das riquezas insondáveis da salvação. Quer prestar apoio aos esforços ecuménicos animados pelo santo desejo da unidade de todos os cristãos.',
  19: 'O presente Catecismo é destinado a toda a Igreja. Há-de servir de ponto de referência para os catecismos ou compêndios que sejam compostos nos diversos países.',
  20: 'O presente Catecismo não se destina a substituir os catecismos locais devidamente aprovados. É oferecido para encorajar e ajudar a elaboração de novos catecismos locais que tenham em conta as diversas situações e culturas.',
  21: 'Para assegurar a integridade e a ortodoxia do seu conteúdo, este Catecismo foi objeto de uma ampla consulta de todos os bispos católicos, das suas Conferências Episcopais ou Sínodos, dos institutos de teologia e de catequética.',
  22: 'Este documento é oferecido a toda a Igreja como instrumento de comunhão e como norma segura para o ensino da fé.',
  23: 'Aqueles que, pelo seu cargo e carisma na Igreja, têm a missão de ensinar, encontrarão neste Catecismo um instrumento para apresentar a doutrina cristã de modo orgânico e vivo.',
  24: 'Os numerosos testemunhos e desenvolvimentos apresentados no Catecismo mostram a riqueza da doutrina e convidam a aprofundar os temas tratados.',
  25: 'A estrutura deste Catecismo articula-se num plano orgânico que ajuda a compreender a harmonia interna da fé cristã.',
  26: 'Quando professamos a nossa fé, começamos por dizer: «Creio», ou «Cremos». A fé é a resposta do homem a Deus, que a ele Se revela e Se oferece.',
  27: 'O desejo de Deus é um sentimento inscrito no coração do homem, porque o homem foi criado por Deus e para Deus. Deus não cessa de atrair o homem para Si e só em Deus é que o homem encontra a verdade e a felicidade que procura sem descanso.',
  28: 'De muitos modos, na sua história e até hoje, os homens exprimiram a sua busca de Deus em crenças e comportamentos religiosos (orações, sacrifícios, cultos, meditações, etc.). Apesar das ambiguidades de que podem enfermar, estas formas de expressão são tão universais que bem podemos chamar ao homem um ser religioso.',
  29: 'Mas esta «relação íntima e vital que une o homem a Deus» pode ser esquecida, desconhecida e até explicitamente rejeitada pelo homem. Tais atitudes podem ter origens diversas: a revolta contra o mal existente no mundo, a ignorância ou a indiferença religiosas, as preocupações do mundo e das riquezas, o mau exemplo dos crentes.',
  30: '«Exulte o coração dos que procuram o Senhor» (Sl 105, 3). Se o homem pode esquecer ou rejeitar Deus, Deus é que nunca deixa de chamar todo o homem a que O procure, para que encontre a vida e a felicidade.',
  31: 'Criado à imagem de Deus, chamado a conhecer e a amar a Deus, o homem que procura Deus descobre certos «caminhos» de acesso ao conhecimento de Deus. Também se lhes chama «provas da existência de Deus».',
  32: 'O mundo: A partir do movimento e do devir, da contingência, da ordem e da beleza do mundo, pode chegar-se ao conhecimento de Deus como origem e fim do universo.',
  33: 'O homem: Com a sua abertura à verdade e à beleza, com o seu sentido do bem moral, com a sua liberdade e a voz da sua consciência, com a sua ânsia de infinito e de felicidade, o homem interroga-se sobre a existência de Deus.',
  34: 'O mundo e o homem atestam que não têm em si mesmos, nem o seu primeiro princípio, nem o seu fim último, mas que participam do Ser-em-si, sem princípio nem fim.',
  35: 'As faculdades do homem tornam-no capaz de conhecer a existência de um Deus pessoal. Mas, para que o homem possa entrar na sua intimidade, Deus quis revelar-Se ao homem.',
  36: '«A Santa Igreja, nossa Mãe, atesta e ensina que Deus, princípio e fim de todas as coisas, pode ser conhecido, com certeza, pela luz natural da razão humana, a partir das coisas criadas».',
  37: 'Nas condições históricas em que se encontra, porém, o homem experimenta muitas dificuldades para chegar ao conhecimento de Deus pela simples luz da razão.',
  38: 'É por isso que o homem precisa de ser iluminado pela revelação de Deus, não somente sobre o que ultrapassa o seu entendimento, mas também sobre as verdades religiosas e morais.',
  39: 'Ao defender a capacidade da razão humana para conhecer Deus, a Igreja exprime a sua confiança na possibilidade de falar de Deus a todos os homens e com todos os homens.',
  40: 'Todavia, ao mesmo tempo que afirma a capacidade natural de conhecer Deus, a Igreja reconhece que a Revelação de Deus é absolutamente necessária.',
  41: 'A Igreja ensina que o Deus único e verdadeiro, nosso Criador e Senhor, pode ser conhecido com certeza pelas suas obras, graças à luz natural da razão humana.',
  42: 'Deus transcende toda a criatura. É preciso, pois, purificar sem cessar a nossa linguagem no que ela tem de limitado, de imaginário, de imperfeito.',
  43: 'As nossas palavras humanas ficam sempre aquém do mistério de Deus. Quando falamos de Deus, a nossa linguagem exprime-se de modo humano, mas atinge realmente o próprio Deus.',
  44: 'O homem é por natureza e por vocação um ser religioso. Vindo de Deus e caminhando para Deus, o homem não vive uma vida plenamente humana se não viver livremente a sua relação com Deus.',
  45: 'O homem é feito para viver em comunhão com Deus, no qual encontra a sua felicidade.',
  46: 'Quando escuta a mensagem das criaturas e a voz da sua consciência, o homem pode atingir a certeza da existência de Deus, causa e fim de tudo.',
  47: 'A Igreja ensina que o Deus único e verdadeiro pode ser conhecido com certeza a partir das suas obras, graças à luz natural da razão humana.',
  48: 'Podemos realmente nomear Deus, partindo das múltiplas perfeições das criaturas, semelhanças do Deus infinitamente perfeito, embora a nossa linguagem limitada não esgote o mistério.',
  49: '«Sem o Criador, a criatura esvai-se». Eis a razão pela qual os crentes sabem que são impelidos pelo amor de Cristo a levar a luz do Deus vivo aos que O ignoram ou O rejeitam.',
  50: 'Mediante a razão natural, o homem pode conhecer Deus com certeza a partir das suas obras. Mas existe outra ordem de conhecimento que o homem de modo algum pode atingir pelas suas próprias forças: a da Revelação divina.',
  51: '«Aprouve a Deus, na sua bondade e sabedoria, revelar-Se a Si mesmo e dar a conhecer o mistério da sua vontade, pelo qual os homens, por meio de Cristo, Verbo feito carne, têm acesso ao Pai no Espírito Santo e se tornam participantes da natureza divina» (Dei Verbum, 2).',
  52: 'Deus, que «habita uma luz inacessível» (1Tm 6,16), quer comunicar a sua própria vida divina aos homens, por Ele livremente criados, para fazer deles, no seu Filho único, filhos adotivos.',
  53: 'O desígnio divino da Revelação realiza-se simultaneamente «por ações e por palavras intimamente relacionadas entre si» e que mutuamente se esclarecem.',
  54: '«Deus, que cria e conserva todas as coisas pelo Verbo, oferece aos homens, nas coisas criadas, um testemunho perene de Si mesmo; além disso, decidindo abrir o caminho da salvação sobrenatural, manifestou-Se a Si mesmo aos nossos primeiros pais, desde o princípio».',
  55: 'Esta revelação não foi interrompida pelo pecado dos nossos primeiros pais. Deus, com efeito, «depois da sua queda, ergueu-os à esperança da salvação, com a promessa da redenção; e velou incessantemente pelo género humano, para dar a vida eterna a todos os que, pela perseverança no bem, procuram a salvação».',
  56: 'Depois da queda do homem, Deus reergue a humanidade com a promessa da redenção. Deus elege Abraão e conclui com ele e os seus descendentes uma aliança destinada a preparar o povo de Deus ao acolhimento do Messias.',
  57: 'Israel é o povo sacerdotal de Deus, aquele que porta o nome do Senhor. É o povo ao qual os profetas falam em nome de Deus.',
  58: 'A aliança com Noé permanece em vigor enquanto durar o tempo dos povos, até à proclamação universal do Evangelho. A Bíblia venera algumas grandes figuras dos «povos», como Abel o Justo, o rei Melquisedeque e o justo Job.',
  59: 'Para reunir a humanidade dispersa, Deus escolhe Abraão chamando-o «da sua terra, da sua parentela e da casa de seu pai» (Gn 12,1), fazendo dele a raiz do povo que será portador da promessa feita aos patriarcas.',
  60: 'O povo nascido de Abraão será o depositário da promessa feita aos patriarcas, o povo eleito, chamado a preparar o dia em que Deus reunirá todos os seus filhos na unidade da Igreja.',
  61: 'Os patriarcas, os profetas e outros grandes personagens do Antigo Testamento foram e são venerados como santos em todas as tradições litúrgicas da Igreja.',
  62: 'Depois dos patriarcas, Deus formou Israel como seu povo, salvando-o da escravidão do Egito. Deus estabeleceu com ele a aliança do Sinai e, por Moisés, deu-lhe a sua Lei.',
  63: 'Israel é o povo sacerdotal de Deus. «De entre todos os povos, sois o meu tesouro particular, pois me pertence toda a terra. Vós sereis para mim um reino de sacerdotes e um povo consagrado» (Ex 19,5-6).',
  64: 'Pelos profetas, Deus forma o seu povo na esperança da salvação, à espera de uma aliança nova e eterna, destinada a todos os homens, que será gravada no coração deles.',
  65: 'Jesus Cristo é a plenitude de toda a Revelação. Cristo, o Filho de Deus, é a Palavra eterna do Pai. Ele é a totalidade da Revelação de Deus ao homem.',
  66: 'A economia cristã, sendo a Nova e definitiva Aliança, não passará jamais; e já não se deve esperar nenhuma revelação pública nova antes da manifestação gloriosa de Nosso Senhor Jesus Cristo.',
  67: 'No decurso dos séculos houve revelações chamadas «privadas», algumas das quais foram reconhecidas pela autoridade da Igreja. Mas elas não pertencem ao depósito da fé.',
  68: 'Por amor, Deus revelou-se e deu-se ao homem. Deu assim uma resposta definitiva e sobreabundante às questões que o homem coloca a si próprio sobre o sentido e o fim da sua vida.',
  69: 'Deus revelou-se ao homem comunicando-lhe progressivamente o seu mistério em ações e em palavras.',
  70: 'Para além do testemunho natural que Deus dá de Si mesmo nas coisas criadas, manifestou-Se a Si mesmo a nossos primeiros pais.',
  71: 'Deus conclui com Noé uma aliança eterna entre Ele e todos os seres vivos. Enquanto durar a terra, sementeira e colheita, frio e calor, verão e inverno, dia e noite não cessarão.',
  72: 'Deus escolhe Abraão e conclui com ele uma aliança especial. Prometeu-lhe ser o pai de uma grande nação.',
  73: 'Deus revela mais a sua lei por Moisés no Sinai e faz de Israel o seu povo eleito. Esta aliança é o núcleo de toda a revelação veterotestamentária.',
  74: 'A Revelação divina completa-se em Jesus Cristo, o Filho encarnado de Deus. Ele é a Palavra viva de Deus.',
  75: 'Cristo Jesus, o Filho único de Deus, é a Palavra eterna, a imagem perfeita do Pai invisível, a expressão plena de toda a Revelação.',
  76: 'De acordo com o desígnio apostólico, o Evangelho sagrado foi transmitido de dois modos: pelos Apóstolos que o pregaram, e por Apóstolos e outros que, sob a inspiração do Espírito Santo, o consignaram por escrito.',
  77: 'A fim de que o Evangelho fosse sempre guardado íntegro e vivo na Igreja, os Apóstolos deixaram como seus sucessores os bispos, transmitindo-lhes o seu próprio poder de ensino.',
  78: 'Esta transmissão viva, realizada no Espírito Santo, é chamada a Tradição, distinta da Sagrada Escritura, embora intimamente ligada a ela.',
  79: 'A Tradição sagrada e a Sagrada Escritura estão intimamente ligadas e comunicam uma com a outra. Derivando ambas da mesma fonte divina, formam de certo modo uma só coisa e tendem ao mesmo fim.',
  80: 'Tradição sagrada e Sagrada Escritura formam um só depósito sagrado da Palavra de Deus, confiado à Igreja.',
  100: 'A função de interpretar autenticamente a Palavra de Deus escrita ou transmitida foi confiada só ao Magistério vivo da Igreja, cuja autoridade é exercida em nome de Jesus Cristo.',
  101: 'Para redigir os livros sagrados, Deus escolheu homens de quem se serviu, usando das suas faculdades e forças, para que, agindo Ele mesmo neles e por eles, pusessem por escrito, como verdadeiros autores, tudo o que Ele queria e só isso.',
  102: 'Todos os livros da Escritura, tanto do Antigo como do Novo Testamento, com todas as suas partes, são sagrados e canónicos, porque escritos sob a inspiração do Espírito Santo.',
  103: 'A Igreja venerou sempre as Sagradas Escrituras como venera o próprio Corpo do Senhor.',
  104: 'A Igreja encerra nos Livros Sagrados e na Tradição viva a revelação que lhe foi confiada.',
  105: 'Deus é o autor da Sagrada Escritura. A verdade divinamente revelada, que os livros da Sagrada Escritura contêm e exprimem, foi posta por escrito sob a inspiração do Espírito Santo.',
  106: 'Deus inspirou os autores humanos dos livros sagrados. Para compor os Livros Sagrados, Deus escolheu certos homens que, usando de todas as suas faculdades e forças, Ele utilizou para que, agindo Ele mesmo neles e por eles, pusessem por escrito como verdadeiros autores tudo o que Ele queria e só isso.',
  107: 'Os livros inspirados ensinam a verdade. Uma vez que tudo o que os autores inspirados afirmam deve ser tido como afirmado pelo Espírito Santo, devemos professsar que os livros da Escritura ensinam solidamente, com fidelidade e sem erro, a verdade que Deus fez consignar nos livros sagrados para nossa salvação.',
  108: 'A fé cristã, contudo, não é uma «religião do Livro». O Cristianismo é a religião da «Palavra» de Deus, não de uma palavra escrita e muda, mas do Verbo encarnado e vivo.',
  109: 'Na Sagrada Escritura, Deus fala ao homem à maneira humana. Para interpretar bem a Escritura, é portanto necessário estar atento ao que os autores humanos queriam verdadeiramente afirmar e ao que Deus quis manifestar através das suas palavras.',
  110: 'Para descobrir a intenção dos autores sagrados, é necessário ter em conta as condições do seu tempo e da sua cultura, os géneros literários em uso nessa época, as maneiras de sentir, de dizer e de narrar então correntes.',
  111: 'Para descobrir o sentido dos textos sagrados, é necessário, além disso, ter em conta com não menor atenção o conteúdo e a unidade de toda a Escritura.',
  112: 'Por fim, mas não menos importante, é necessário ler a Escritura dentro da Tradição viva de toda a Igreja.',
  113: 'Compete ao exegeta esforçar-se por compreender mais profundamente, segundo a intenção do Espírito Santo, o sentido da Escritura.',
  114: 'Segundo uma tradição antiga, há dois sentidos da Escritura: o sentido literal e o sentido espiritual, este último subdividido em sentido alegórico, moral e anagógico.',
  115: 'O sentido literal é o sentido significado pelas palavras da Escritura e descoberto pela exegese que segue as regras da justa interpretação.',
  116: 'O sentido espiritual é aquele que é significado pelas realidades e acontecimentos de que trata a Escritura.',
  117: 'O sentido alegórico: Podemos adquirir uma compreensão mais profunda dos acontecimentos, reconhecendo a sua significação em Cristo. Assim, a passagem do Mar Vermelho é um sinal da vitória de Cristo e, por isso, do Batismo.',
  118: 'O sentido moral: Os acontecimentos narrados na Escritura devem conduzir-nos a agir com retidão. «Foram escritos para nossa instrução» (1 Cor 10,11).',
  119: 'O sentido anagógico: Podemos ver as realidades e os acontecimentos na sua significação eterna, que nos conduz à nossa Pátria. Assim, a Igreja na terra é signo da Jerusalém celeste.',
  120: 'O cânone das Escrituras. A Tradição apostólica fez a Igreja discernir quais os escritos que devem ser considerados como Escritura Sagrada.',
  121: 'O Antigo Testamento é uma parte indispensável da Sagrada Escritura. Os seus livros são divinamente inspirados e conservam valor perene.',
  122: 'Os cristãos veneram o Antigo Testamento como verdadeira Palavra de Deus.',
  123: 'Os cristãos lêem o Antigo Testamento à luz de Cristo morto e ressuscitado. Esta leitura tipológica manifesta o conteúdo inesgotável do Antigo Testamento.',
  124: 'O Evangelho é o coração de toda a Escritura «por ser o testemunho principal da vida e da doutrina do Verbo encarnado, nosso Salvador».',
  125: 'Os Evangelhos têm uma origem apostólica, porque são transmitidos por pessoas que conviveram com Jesus ou as receberam dos que conviveram com Ele.',
  126: 'A formação dos Evangelhos deu-se em três etapas: vida e ensinamento de Jesus, tradição oral, evangelhos escritos.',
  127: 'Os quatro Evangelhos têm origem apostólica e têm preeminência no Cânone, por serem o testemunho principal da vida e da doutrina do Verbo encarnado.',
  128: 'A Igreja mantém com firmeza e com toda a constância que os quatro Evangelhos, cuja historicidade afirma sem hesitar, transmitem fielmente o que Jesus, Filho de Deus, durante a sua vida entre os homens, realmente fez e ensinou para a sua eterna salvação.',
  129: 'As Escrituras judaicas (Antigo Testamento) e os escritos cristãos (Novo Testamento) estão em relação íntima. O Novo Testamento está oculto no Antigo, e o Antigo está à luz do Novo.',
  130: 'O Antigo Testamento é a preparação e o anúncio da Nova Aliança. Contém a história da criação, da queda e da promessa de redenção.',
  131: '«Que todos ganhem amor muito grande pela Sagrada Escritura, porque a ignorância das Escrituras é ignorância de Cristo».',
  132: 'A Igreja exorta e fortemente recomenda a todos os fiéis que aprendam a «sublime ciência de Jesus Cristo» (Fl 3,8) pela leitura frequente das divinas Escrituras.',
  133: '«A Sagrada Escritura é o alimento da alma, a fonte pura e perene da vida espiritual».',
  134: 'Todo o conjunto da Sagrada Escritura é uma só Livro, e esse único Livro é Cristo.',
  135: 'A Sagrada Escritura contém a Palavra de Deus e, por ser inspirada, é verdadeiramente Palavra de Deus.',
  142: 'Pela sua Revelação, «Deus invisível, na riqueza do seu amor, fala aos homens como a amigos e convive com eles, para os convidar e admitir à comunhão consigo».',
  143: 'Pela fé, o homem submete completamente a sua inteligência e a sua vontade a Deus. Com todo o seu ser, o homem dá o seu assentimento a Deus revelador. A Sagrada Escritura chama «obediência da fé» a esta resposta do homem a Deus que revela.',
  144: 'A obediência da fé é confiar-se, totalmente livre, a Deus. Abraão, nosso pai na fé, é o primeiro modelo desta obediência.',
  145: 'A Carta aos Hebreus, no famoso «elogio da fé», exalta a fé de Abraão: «Pela fé, Abraão obedeceu ao chamamento de partir para uma terra que havia de receber como herança, e saiu sem saber para onde ia».',
  146: 'A Virgem Maria realiza de modo mais perfeito a obediência da fé. Na fé, Maria acolheu o anúncio e a promessa trazidos pelo anjo Gabriel, acreditando que «para Deus nada é impossível».',
  147: 'O Novo Testamento apresenta Maria como o modelo mais perfeito de fé tanto no Antigo como no Novo Testamento.',
  148: 'A fé é um ato humano. O assentimento dado por fé não é um movimento cego da razão. É um assentimento inteligente e livre ao qual todo o crente é chamado.',
  149: 'A fé é um dom gratuito de Deus. Para dar a resposta da fé, o homem precisa do auxílio e da graça interior do Espírito Santo.',
  150: 'A fé é, antes de mais, uma adesão pessoal do homem a Deus; ao mesmo tempo e inseparavelmente, é o assentimento livre a toda a verdade que Deus revelou.',
  185: 'Quem diz «Creio» diz «Eu adiro àquilo que nós cremos». A comunhão na fé precisa duma linguagem comum da fé, normativa para todos e que una na mesma confissão de fé.',
  198: 'A nossa profissão de fé começa por Deus, porque Deus é o «Primeiro e o Último» (Is 44,6), o Princípio e o Fim de tudo.',
  199: 'O Símbolo dos Apóstolos começa por Deus-Pai, porque o Pai é a primeira Pessoa divina da Santíssima Trindade.',
  232: 'Os cristãos são batizados «em nome do Pai e do Filho e do Espírito Santo» (Mt 28,19). Antes disso, respondem «Creio» à tríplice pergunta que os convida a confessar a sua fé no Pai, no Filho e no Espírito Santo. A fé de todos os cristãos assenta sobre a Trindade.',
  234: 'O mistério da Santíssima Trindade é o mistério central da fé e da vida cristã. É o mistério de Deus em Si mesmo. É, portanto, a fonte de todos os outros mistérios da fé e a luz que os ilumina.',
  268: 'De todos os atributos divinos, só a omnipotência de Deus é mencionada no Símbolo. Confessá-la tem grande importância para a nossa vida.',
  290: '«No princípio, Deus criou o céu e a terra» (Gn 1, 1). Três coisas são afirmadas nestas primeiras palavras da Escritura: o Deus eterno pôs um princípio a tudo o que existe fora d\'Ele. Só Ele é Criador. A totalidade do que existe depende d\'Aquele que lhe dá o ser.',
  355: '«Deus criou o ser humano à sua imagem, à imagem de Deus o criou; homem e mulher os criou» (Gn 1,27). O homem ocupa um lugar único na criação: é «à imagem de Deus».',
  385: 'Deus é infinitamente bom e todas as suas obras são boas. Todavia, ninguém escapa à experiência do sofrimento, dos males na natureza – que aparecem como ligados aos limites próprios das criaturas – e sobretudo ao problema do mal moral.',
  422: '«Quando chegou a plenitude dos tempos, Deus enviou o seu Filho, nascido de uma mulher, nascido sujeito à Lei, para resgatar os que estavam sujeitos à Lei, a fim de recebermos a adoção de filhos» (Gl 4,4-5).',
  456: 'Com o Credo Niceno-Constantinopolitano, respondemos, confessando: «E por nós, homens, e para nossa salvação, desceu dos Céus e, pelo Espírito Santo, Se encarnou no seio da Virgem Maria e Se fez homem».',
  460: '«O Verbo fez-Se homem para nos tornar Deus»: «Tal é a razão pela qual o Verbo Se fez homem, e o Filho de Deus Se fez Filho do homem: para que o homem, entrando em comunhão com o Verbo e recebendo assim a filiação divina, se tornasse filho de Deus» (Santo Ireneu).',
  464: 'O acontecimento único e totalmente singular da Encarnação do Filho de Deus não significa que Jesus Cristo seja em parte Deus e em parte homem, nem que seja resultado duma mistura confusa do divino com o humano. Ele fez-Se verdadeiramente homem, permanecendo verdadeiramente Deus.',
  512: 'O Credo, no que se refere à vida de Cristo, limita-se a mencionar os mistérios da Encarnação (conceção e nascimento) e da Páscoa (paixão, crucifixão, morte, sepultura, descida aos infernos, ressurreição, ascensão).',
  571: 'O mistério pascal da Cruz e da Ressurreição de Cristo está no centro da Boa-Nova que os Apóstolos, e após eles a Igreja, devem anunciar ao mundo. O desígnio salvador de Deus cumpriu-se «de uma vez por todas» (Hb 9,26) pela morte redentora do seu Filho Jesus Cristo.',
  631: 'Jesus «desceu às regiões inferiores da terra. Aquele que desceu é o mesmo que subiu acima de todos os céus» (Ef 4,9-10). O Símbolo dos Apóstolos confessa, num mesmo artigo, a descida de Cristo aos infernos e a sua ressurreição dos mortos ao terceiro dia.',
  638: '«Nós vos anunciamos a Boa-Nova: a promessa feita a nossos pais, Deus a cumpriu para nós, seus filhos, ressuscitando Jesus» (At 13,32-33). A Ressurreição de Jesus é a verdade culminante da nossa fé em Cristo.',
  683: 'Ninguém pode dizer «Jesus é Senhor» a não ser no Espírito Santo (1 Cor 12,3). «Deus enviou aos nossos corações o Espírito de seu Filho, que clama: Abba, Pai!» (Gl 4,6).',
  687: 'O Espírito Santo age com o Pai e o Filho desde o princípio até à consumação do desígnio da nossa salvação.',
  731: 'No dia de Pentecostes (no termo das sete semanas pascais), a Páscoa de Cristo cumpre-se com a efusão do Espírito Santo, que é manifestado, dado e comunicado como Pessoa divina.',
  748: '«Lumen Gentium – Luz dos povos é Cristo»: o presente Concílio ardentemente deseja que, ao anunciar o Evangelho a toda a criatura, ilumine todos os homens com a claridade de Cristo, que resplandece no rosto da Igreja.',
  811: 'Esta é a única Igreja de Cristo que, no Símbolo, confessamos una, santa, católica e apostólica. Estas quatro características, inseparavelmente ligadas entre si, indicam traços essenciais da Igreja e da sua missão.',
  946: 'A comunhão dos santos é precisamente a Igreja. «Pois que todos os crentes formam um só corpo, o bem de uns é comunicado aos outros... É, pois, necessário crer que existe uma comunhão de bens na Igreja.»',
  988: '«O Credo cristão – profissão da nossa fé em Deus Pai, Filho e Espírito Santo, e na sua ação criadora, salvadora e santificadora – culmina na proclamação da ressurreição dos mortos, no fim dos tempos, e na vida eterna».',
  1066: 'No Símbolo da fé, a Igreja confessa o mistério da Santíssima Trindade e o seu «desígnio benevolente» sobre toda a criação.',
  1113: 'Toda a vida litúrgica da Igreja gravita em torno do sacrifício eucarístico e dos sacramentos. Na Igreja, há sete sacramentos: Batismo, Confirmação ou Crisma, Eucaristia, Penitência, Unção dos Enfermos, Ordem, Matrimônio.',
  1210: 'Os sacramentos da Nova Lei foram instituídos por Cristo e são sete: o Batismo, a Confirmação, a Eucaristia, a Penitência, a Unção dos Enfermos, a Ordem e o Matrimônio.',
  1213: 'O santo Batismo é o fundamento de toda a vida cristã, o pórtico da vida no Espírito e a porta que abre o acesso aos outros sacramentos.',
  1257: 'O Senhor mesmo afirma que o Batismo é necessário para a salvação. Por isso, mandou aos seus discípulos que anunciassem o Evangelho e batizassem todas as nações.',
  1322: 'A sagrada Eucaristia completa a iniciação cristã. Os que foram elevados à dignidade do sacerdócio real pelo Batismo e configurados mais profundamente com Cristo pela Confirmação participam, por meio da Eucaristia, com toda a comunidade, no próprio sacrifício do Senhor.',
  1324: 'A Eucaristia é «fonte e cume de toda a vida cristã». «Os restantes sacramentos, assim como todos os ministérios eclesiásticos e obras de apostolado, estão vinculados à sagrada Eucaristia e a ela se ordenam. Com efeito, a santíssima Eucaristia contém todo o tesouro espiritual da Igreja, isto é, o próprio Cristo, a nossa Páscoa».',
  1325: 'A Eucaristia contém todo o tesouro espiritual da Igreja, isto é, o próprio Cristo, a nossa Páscoa e pão vivo que, pela sua Carne vivificada e vivificante pelo Espírito Santo, dá vida aos homens.',
  1373: 'Cristo Jesus, que morreu, ou melhor, que ressuscitou, Aquele que está à direita de Deus, Aquele que intercede por nós – está presente de múltiplas maneiras na sua Igreja.',
  1422: 'Os que se aproximam do sacramento da Penitência obtêm da misericórdia de Deus o perdão da ofensa a Ele feita e, ao mesmo tempo, reconciliam-se com a Igreja.',
  1499: 'A Unção dos Enfermos não é sacramento apenas para os que estão no último momento da vida. O tempo oportuno para a receber é certamente o momento em que o fiel começa a estar em perigo de morte.',
  1533: 'O Batismo, a Confirmação e a Eucaristia são os sacramentos da iniciação cristã. Baseiam e desenvolvem a vocação comum de todos os discípulos de Cristo: vocação à santidade e à missão de evangelizar o mundo.',
  1601: 'A aliança matrimonial, pela qual o homem e a mulher constituem entre si uma comunhão íntima de vida e de amor, foi fundada e dotada de leis próprias pelo Criador.',
  1691: 'Cristão, reconhece a tua dignidade. Uma vez que participas agora da natureza divina, não degeneres voltando à decadência da tua vida passada. Lembra-te de qual é a tua Cabeça e de qual é o Corpo de que és membro.',
  1730: 'Deus criou o homem racional, conferindo-lhe a dignidade de pessoa dotada de iniciativa e do domínio dos seus atos. «Quis Deus "deixar o homem entregue à sua própria decisão", para que busque espontaneamente o seu Criador.»',
  1776: 'No mais íntimo de si mesmo, o homem descobre uma lei que não se impôs a si próprio, mas à qual deve obedecer. Essa voz, que sempre o está a chamar ao amor do bem e fuga do mal, soa-lhe no momento oportuno, na intimidade do coração.',
  1803: 'A virtude é uma disposição habitual e firme para fazer o bem. Permite à pessoa não somente praticar atos bons, mas dar o melhor de si mesma.',
  1846: 'O Evangelho é a revelação, em Jesus Cristo, da misericórdia de Deus para com os pecadores. O anjo anuncia-o a José: «Tu lhe porás o nome de Jesus, pois Ele salvará o povo dos seus pecados» (Mt 1,21).',
  1849: 'O pecado é uma falta contra a razão, a verdade, a consciência reta; é uma falha ao amor verdadeiro para com Deus e para com o próximo, por causa dum apego perverso a certos bens.',
  1996: 'A nossa justificação vem da graça de Deus. A graça é o favor, o socorro gratuito que Deus nos dá para responder ao seu chamamento.',
  2052: '«Mestre, que devo fazer de bom para ter a vida eterna?» Ao jovem que lhe faz esta pergunta, Jesus responde, primeiro, invocando a necessidade de reconhecer Deus como «o único Bom».',
  2083: 'Jesus resumiu os deveres do homem para com Deus nesta palavra: «Amarás o Senhor teu Deus com todo o teu coração, com toda a tua alma e com todo o teu espírito» (Mt 22,37).',
  2196: 'Em resposta à pergunta sobre qual é o primeiro mandamento, Jesus disse: «O primeiro é: Ouve, Israel: o Senhor nosso Deus é o único Senhor. Amarás o Senhor teu Deus com todo o teu coração...»',
  2258: 'A vida humana é sagrada porque, desde a sua origem, ela supõe a ação criadora de Deus e permanece para sempre numa relação especial com o Criador, seu único fim.',
  2331: 'Deus é amor e vive em Si mesmo um mistério de comunhão pessoal de amor. Ao criar a humanidade do homem e da mulher à sua imagem, Deus inscreveu nela a vocação, e consequentemente a capacidade e a responsabilidade, para o amor e a comunhão.',
  2401: 'O sétimo mandamento proíbe tomar ou reter injustamente o bem alheio e causar prejuízo ao próximo nos seus bens, seja de que modo for.',
  2464: 'O oitavo mandamento proíbe falsear a verdade nas relações com outrem.',
  2514: 'São João distingue três espécies de cobiça ou concupiscência: a concupiscência da carne, a dos olhos e a soberba da vida.',
  2558: '«Grande é o mistério da fé». A Igreja professa-o no Símbolo dos Apóstolos e celebra-o na liturgia sacramental, para que a vida dos fiéis se conforme com Cristo no Espírito Santo.',
  2559: '«A oração é a elevação da alma a Deus ou o pedido a Deus dos bens convenientes». De onde é que nós falamos, quando rezamos? Da altura do nosso orgulho e da nossa vontade própria ou «das profundezas» (Sl 130,1) de um coração humilde e contrito?',
  2590: 'A oração é a elevação da alma a Deus ou o pedido a Deus dos bens convenientes.',
  2623: 'No dia de Pentecostes, o Espírito da Promessa foi derramado sobre os discípulos, que «se encontravam todos reunidos no mesmo lugar» (At 2,1), esperando-O «perseverando unanimemente na oração» (At 1,14).',
  2653: 'A Igreja «exorta com veemência todos os fiéis cristãos... a que aprendam "a sublime ciência de Jesus Cristo" (Fl 3,8) pela leitura frequente das divinas Escrituras».',
  2697: 'A oração é a vida do coração novo. Deve animar-nos a todo o momento.',
  2759: 'Um dia, Jesus estava a rezar num certo lugar. Quando acabou, um dos seus discípulos pediu-lhe: «Senhor, ensina-nos a orar» (Lc 11,1). É em resposta a este pedido que o Senhor confia aos seus discípulos e à sua Igreja a oração cristã fundamental.',
  2761: '«A oração dominical é verdadeiramente o resumo de todo o Evangelho». Quando o Senhor nos deu a fórmula de oração, acrescentou: «Pedi e recebereis» (Jo 16,24). A oração dominical é a mais perfeita das orações.',
  2803: 'As três primeiras petições têm por objeto a Glória do Pai: a santificação do Nome, a vinda do Reino e o cumprimento da Vontade divina.',
  2857: 'No Pai-Nosso, as três primeiras petições têm por objeto a Glória do Pai: a santificação do Nome, a vinda do Reino e o cumprimento da Vontade divina. As quatro últimas apresentam-Lhe os nossos desejos.',
  2865: 'Com o «Amém» final, exprimimos o nosso «fiat» relativamente a estas sete petições: «Assim seja».',
};

async function generateWithAI(paragraph: number, supabaseUrl: string, serviceKey: string): Promise<string> {
  try {
    const resp = await fetch(`${supabaseUrl}/functions/v1/colloquium`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${serviceKey}`,
      },
      body: JSON.stringify({
        messages: [{
          role: 'user',
          content: `Reproduza fielmente e APENAS o texto do parágrafo §${paragraph} do Catecismo da Igreja Católica em português. Não acrescente comentários, explicações ou introduções. Apenas o texto oficial do parágrafo.`
        }],
        stream: true, // Colloquium is set to stream: true
        model: 'google/gemini-1.5-flash' // Faster model
      }),
    });
    
    if (!resp.ok) return '';
    
    const fullText = await resp.text();
    let generated = '';
    
    const lines = fullText.split('\n');
    for (const line of lines) {
      if (line.startsWith('data: ') && !line.includes('[DONE]')) {
        try {
          const parsed = JSON.parse(line.slice(6));
          const delta = parsed.choices?.[0]?.delta?.content;
          if (delta) generated += delta;
        } catch { /* skip */ }
      }
    }
    
    const cleaned = generated.trim().replace(/^§\d+\s*[-–]\s*/, '').trim();
    return cleaned;
  } catch (e) {
    console.error(`AI generation failed for §${paragraph}:`, e);
    return '';
  }
}

serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response(null, { headers: corsHeaders });

  try {
    const { paragraph } = await req.json();
    if (!paragraph || paragraph < 1 || paragraph > 2865) {
      return new Response(JSON.stringify({ error: 'Parágrafo inválido' }), { status: 400, headers: corsHeaders });
    }

    // 1. Static check (instant)
    if (PT_PARAGRAPHS[paragraph]) {
      return new Response(JSON.stringify({ paragraph, content: PT_PARAGRAPHS[paragraph] }), { headers: corsHeaders });
    }

    // 2. Database check (fast)
    const supabaseUrl = Deno.env.get('SUPABASE_URL') || '';
    const serviceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') || '';
    const supabase = createClient(supabaseUrl, serviceKey);

    const { data: cached } = await supabase
      .from('catechism_cache')
      .select('content')
      .eq('paragraph', paragraph)
      .single();

    if (cached) {
      return new Response(JSON.stringify({ paragraph, content: cached.content }), { headers: corsHeaders });
    }

    // 3. AI Generation (slowest, but only once)
    const aiText = await generateWithAI(paragraph, supabaseUrl, serviceKey);
    if (aiText && aiText.length > 20) {
      // Save to cache
      await supabase.from('catechism_cache').insert({ paragraph, content: aiText });
      return new Response(JSON.stringify({ paragraph, content: aiText }), { headers: corsHeaders });
    }

    return new Response(JSON.stringify({ 
      paragraph, 
      content: `Parágrafo §${paragraph} — Catecismo da Igreja Católica. Conteúdo em processamento.` 
    }), { headers: corsHeaders });

  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), { status: 500, headers: corsHeaders });
  }
});
