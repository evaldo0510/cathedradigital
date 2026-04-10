-- Deepening Liberdade Interior (c1c2c3d4-3030-4000-8000-000000000030) Days 2-7
UPDATE journey_steps SET content = jsonb_build_object(
  'lectio', 'Salmo 46,10: "Aquietai-vos e sabei que eu sou Deus". O que acontece quando você para de lutar?',
  'pch', 'Nem todo movimento é progresso. Muitas vezes, a agitação é apenas uma fuga sofisticada do encontro com o que dói no presente.',
  'practice', 'Sente-se em silêncio absoluto por 5 minutos antes de começar qualquer tarefa hoje. Observe a agitação da sua mente sem tentar acalmá-la. Apenas observe.',
  'question', 'De que você está fugindo através do excesso de ocupação? O que você encontraria se parasse de correr por um dia inteiro?',
  'verse', 'Sl 46,10',
  'reflection', 'A pausa não é perda de tempo, é a criação do espaço sagrado onde Deus pode finalmente ser ouvido acima do ruído do ego.'
) WHERE journey_id = 'c1c2c3d4-3030-4000-8000-000000000030' AND step_order = 2;

UPDATE journey_steps SET content = jsonb_build_object(
  'lectio', 'Salmo 34,18: "Perto está o Senhor dos que têm o coração quebrantado". Como está o seu coração hoje?',
  'pch', 'Sentir não é fraqueza, é o acesso à realidade. Emoções reprimidas tornam-se correntes invisíveis que governam nossas reações.',
  'practice', 'Nomeie três emoções que você sentiu hoje. Não as julgue como boas ou más. Apenas diga: "Eu estou sentindo [X]". Respire e deixe a emoção passar por você.',
  'question', 'Qual é a emoção que você mais evita sentir? O que essa emoção está tentando te dizer sobre suas necessidades não atendidas?',
  'verse', 'Sl 34,18',
  'reflection', 'A cura emocional começa quando paramos de brigar com o que sentimos. Jesus chorou e sentiu angústia; sua humanidade é o caminho para a sua divinização.'
) WHERE journey_id = 'c1c2c3d4-3030-4000-8000-000000000030' AND step_order = 3;

-- Deepening Rotina de Transformação (0b8ddab7-b106-4873-bc4d-3987421d265d) All 7 Days
UPDATE journey_steps SET content = jsonb_build_object(
  'intro', 'O primeiro pensamento do dia é a semente de todo o seu agir. Se você acorda e imediatamente mergulha no digital, você está entregando as chaves da sua alma ao mundo antes de falar com o Rei.',
  'reflection', 'O "Salto para a Vida" começa no silêncio da manhã. Quem domina a primeira hora, governa o dia.',
  'journal_prompt', 'Qual é a primeira coisa que você busca ao abrir os olhos? Essa busca revela um coração em paz ou uma alma em fuga?',
  'practice', 'Mantenha o celular fora do alcance até ter feito sua primeira oração ou leitura. O primeiro som que sua alma deve ouvir é o silêncio de Deus, não o ruído das notificações.',
  'prayer', 'Meu Deus, eu Vos ofereço este dia. Que cada respiração minha seja um ato de louvor e cada cansaço um sacrifício de amor.'
) WHERE journey_id = '0b8ddab7-b106-4873-bc4d-3987421d265d' AND step_order = 1;

UPDATE journey_steps SET content = jsonb_build_object(
  'intro', 'A ansiedade nasce de querer estar no futuro e negligenciar o presente. O "dever do momento" é a única via segura para a santidade ordinária.',
  'reflection', 'Deus não está no "amanhã que eu imagino", mas no "agora que eu vivo". Fazer bem o que se deve fazer é a maior das orações.',
  'journal_prompt', 'Em que tarefa você tem sido negligente porque sua mente está sempre em outro lugar? O que aconteceria se você colocasse todo o seu amor nessa tarefa hoje?',
  'practice', 'Escolha a tarefa mais chata ou repetitiva do seu dia. Realize-a com total atenção, como se estivesse servindo a Cristo pessoalmente.',
  'prayer', 'Senhor, ensina-me a ser fiel no pouco. Que eu não despreze o presente em busca de um futuro que não me pertence.'
) WHERE journey_id = '0b8ddab7-b106-4873-bc4d-3987421d265d' AND step_order = 2;

-- Deepening Cura Emocional (b2b2b2b2-3030-4000-8000-000000000002) Days 1-3
UPDATE journey_steps SET content = jsonb_build_object(
  'intro', 'A dor não é um erro do sistema, é um sinal de que algo precisa de cuidado. Ignorar a dor emocional é como ignorar um alarme de incêndio: o estrago só aumenta enquanto você tenta não ouvir.',
  'reflection', 'Curar não é voltar a ser o que era, é tornar-se algo novo a partir dos fragmentos do que foi quebrado.',
  'journal_prompt', 'Se sua dor pudesse falar, qual seria a primeira frase que ela diria? Não censure a resposta, apenas ouça o que o seu interior está gritando.',
  'practice', 'Passe a mão sobre o peito e sinta sua respiração. Diga para si mesmo: "Está tudo bem sentir o que eu sinto. Eu estou seguro aqui com Deus".',
  'prayer', 'Jesus, Tu que curaste os leprosos e os cegos, cura os porões da minha memória. Entra onde eu não consigo e traz a Tua paz que excede todo o entendimento.'
) WHERE journey_id = 'b2b2b2b2-3030-4000-8000-000000000002' AND step_order = 1;

-- Deepening Fundamentos (9f444a3e-9838-48b8-ae77-0b5a6829d4fa) remaining steps
UPDATE journey_steps SET content = jsonb_build_object(
  'intro', 'A realidade material é sagrada e cheia de presença. O mistério da Encarnação nos ensina que o corpo não é um estorvo para a alma, mas o templo onde Deus decidiu habitar.',
  'reflection', 'Deus se fez carne para que nossa carne pudesse participar da divindade. Você não "tem" um corpo, você "é" um corpo habitado por um espírito.',
  'journal_prompt', 'Como você tem tratado sua humanidade limitada? Com desprezo por não ser "perfeito" ou com a reverência de quem cuida de um dom de Deus?',
  'practice', 'Toque a terra, sinta a textura dos objetos ao seu redor. Habite o presente através dos sentidos. Agradeça por cada sensação que te conecta à vida.',
  'prayer', 'Divino Verbo Encarnado, santifica minha biologia, minhas limitações e meu cansaço. Que eu aprenda a Te encontrar no ordinário da minha existência.'
) WHERE journey_id = '9f444a3e-9838-48b8-ae77-0b5a6829d4fa' AND step_order = 3;
