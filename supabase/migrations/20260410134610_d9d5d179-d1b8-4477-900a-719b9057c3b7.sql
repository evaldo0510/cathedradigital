-- Deepening Journey Contents (Part 3)
-- Aprofundando a Jornada de Coração (150f78d3-019b-40c0-962e-a83576309ea5)
UPDATE journey_steps SET content = jsonb_build_object(
  'intro', 'O coração não é apenas a sede dos sentimentos, é o centro de gravidade da alma. Para onde seu coração se inclina, sua vida inteira desmorona ou se ergue. São Tomás de Aquino diz que o amor é a primeira de todas as paixões, pois é ele que move a vontade para o objeto desejado.',
  'prayer', 'Senhor, purificai o centro do meu ser. Que meu coração não seja um mercado de afetos desordenados, mas um templo onde só Vós habitais como Rei.',
  'practice', 'Durante o dia de hoje, observe qual pensamento "puxa" seu coração com mais força (preocupação, desejo, vaidade). Sempre que notar essa inclinação, diga: "Senhor, meu coração é Vosso. Eu O ancorei em Ti."',
  'reflection', '"Onde está o teu tesouro, aí estará o teu coração". Se seu coração está inquieto, é porque seu tesouro está em algo que pode ser perdido. A clareza só vem quando o Absoluto ocupa o centro.',
  'journal_prompt', 'Se o seu coração fosse uma casa, quem teria a chave de todos os cômodos? Existe algum "porão" onde você não deixa Deus entrar por medo de ser julgado?'
) WHERE id = '12bea220-594b-4e61-952f-98f4fdca8436';

UPDATE journey_steps SET content = jsonb_build_object(
  'intro', 'A vulnerabilidade não é fraqueza; é a única fresta por onde a luz da graça pode penetrar a carapaça do nosso orgulho. Uma ferida escondida inflama; uma ferida entregue a Deus torna-se uma cicatriz de glória. O próprio Cristo ressuscitado manteve Suas chagas para nos mostrar que a dor pode ser redimida.',
  'prayer', 'Jesus, Divino Samaritano, não permitais que eu esconda minhas feridas de Vós. Derramai o óleo da Tua misericórdia e o vinho da Tua fortaleza sobre o que em mim está quebrado.',
  'practice', 'Não tente "parecer bem" diante de Deus hoje. Em sua oração, exponha a dor exata que você sente, sem as "palavras bonitas" da religiosidade. Deixe a dor ser ouvida por Aquele que a carregou na Cruz.',
  'reflection', 'É pelas rachaduras que a luz entra. Uma alma sem cicatrizes é uma alma que nunca se aventurou a amar de verdade.',
  'journal_prompt', 'Qual é a ferida que você mais protege hoje? Como essa proteção excessiva tem impedido você de receber a ajuda de Deus e dos outros?'
) WHERE id = '62d23419-0510-4f35-9098-8111d5a7a3c8';

-- Aprofundando a Jornada de Propósito de Vida (a1a1a1a1-3030-4000-8000-000000000001)
UPDATE journey_steps SET content = jsonb_build_object(
  'pch', 'Sua vida não é um acidente cósmico, mas um projeto deliberado do Amor Eterno. "Antes de te formar no ventre, eu te conhecia". O propósito não é algo que você "inventa", é algo que você "descobre" na medida em que se aproxima do Criador.',
  'verse', 'Jr 1,5',
  'lectio', 'Leia Jeremias 1,4-10. Perceba que a missão de Jeremias não dependia da sua capacidade ("Ah, Senhor, não sei falar"), mas da escolha de Deus. Onde você tem se achado pequeno demais para os planos de Deus?',
  'practice', 'Escreva as 3 situações em que você se sentiu "mais você mesmo", onde sentiu que estava fazendo o que nasceu para fazer. Note se nessas situações você estava servindo a algo maior que seu próprio ego.',
  'question', 'Se você soubesse que Deus garante o sucesso da sua missão, o que você teria coragem de começar hoje mesmo?',
  'reflection', 'Propósito não é sobre o que você ganha, é sobre quem você se torna e o que você deixa no mundo por amor.'
) WHERE id = '998b1157-ad77-4a35-a53b-7b6cb6fa67fc';

-- Aprofundando a Jornada de Primeiros Passos na Fé (a1b2c3d4-0001-4000-8000-000000000001)
UPDATE journey_steps SET content = jsonb_build_object(
  'bible_ref', 'Jo 3,16',
  'reflection', 'O Amor de Deus não é um prêmio para os bons, mas um resgate para os perdidos. Não é um sentimento vago, é uma Pessoa que se entregou na Cruz. "Deus amou o mundo de tal maneira..." — esse "tal maneira" é o limite do impossível.',
  'intro', 'Descobrir-se amado é a revolução copernicana da alma: o centro deixa de ser o meu pecado e passa a ser a Misericórdia dEle. Sem essa base, toda a religião vira apenas uma lista de deveres pesados.',
  'practice', 'Passe 10 minutos apenas repetindo interiormente: "Eu sou amado(a) por Deus agora, exatamente como estou". Se pensamentos de culpa surgirem, responda com a Cruz: "Seu amor é maior que minha falha".',
  'journal_prompt', 'Como seria sua vida se você realmente acreditasse, em cada célula do seu corpo, que é amado incondicionalmente pelo Criador do Universo?'
) WHERE id = '95b1090e-117c-4fd8-95ab-7b18071641cd';

UPDATE journey_steps SET content = jsonb_build_object(
  'instruction', 'Rezar não é informar Deus sobre coisas que Ele já sabe, mas permitir que Ele entre naquilo que você vive. É a respiração da alma. Sem oração, a alma sufoca no seu próprio egoísmo.',
  'prayer', 'Pai Nosso, que estais no céu... Reze esta oração hoje como se fosse a primeira vez. Pare em cada palavra. O que significa dizer "Nosso" e não apenas "Meu"?',
  'practice', 'Estabeleça um horário fixo de 5 minutos hoje para não fazer nada além de estar com Deus. Se não souber o que dizer, use a oração do publicano: "Senhor, tende piedade de mim, um pecador."',
  'reflection', 'A oração é o lugar onde a nossa fraqueza encontra a onipotência de Deus. É o diálogo que transforma o destino.',
  'journal_prompt', 'O que impede você de conversar com Deus como com um amigo? Medo, vergonha ou a sensação de que Ele está longe demais?'
) WHERE id = 'e6c6deb4-e34a-429d-b30b-b65a615964eb';
