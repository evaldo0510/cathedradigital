-- Deepening Journey Contents
-- Aprofundando a Jornada de Formação (051b209e-9985-44da-a832-ca884783cb98)
UPDATE journey_steps SET content = jsonb_build_object(
  'intro', 'A vontade é o motor da alma, mas ela atrofia quando evitamos o conflito necessário com a nossa própria mediocridade. Psicologicamente, a vontade fraca não é falta de desejo, é o acúmulo de pequenas traições diárias contra a própria consciência.',
  'prayer', 'Senhor, dai-me a coragem de não adiar o que já sei que deve ser feito. Que meu "sim" seja um ato de amor e meu "não" uma barreira contra o caos.',
  'practice', 'Identifique a tarefa que você mais teme ou evita hoje. Realize-a nos primeiros 15 minutos do seu dia. Não negocie com a preguiça; apenas execute com a precisão de quem serve a Deus.',
  'reflection', 'A inércia é o túmulo da virtude. Onde não há decisão, o tempo não passa, ele apenas nos consome. Decidir é o primeiro ato de liberdade de um filho de Deus.',
  'journal_prompt', 'Em qual área da sua vida você tem usado o "discernimento" como uma máscara para esconder o medo de decidir? O que aconteceria se você decidisse hoje?'
) WHERE id = 'fd0ff1dd-4856-4f51-b2a8-d914ed6a4d19';

UPDATE journey_steps SET content = jsonb_build_object(
  'intro', 'Desordem emocional não é apenas excesso de sentimento; é o amor colocado no lugar errado. Quando amamos o transitório como se fosse eterno, a alma entra em colapso sob o peso da ansiedade.',
  'prayer', 'Divino Mestre, ordenai meus afetos para que eu ame as coisas criadas por Vossa causa, e a Vós acima de todas as coisas.',
  'practice', 'Escolha um espaço físico que reflita sua desordem interior (uma gaveta, um e-mail, uma mesa). Organize-o com intenção litúrgica, orando: "Assim como arrumo este espaço, peço que o Senhor arrume minha alma."',
  'reflection', 'Paz é a tranquilidade da ordem. Se você sente que sua vida é um caos, olhe para a hierarquia dos seus amores. O que está ocupando o trono que pertence a Deus?',
  'journal_prompt', 'Se Deus olhasse para a sua agenda e seus gastos hoje, quem Ele diria que é o senhor da sua vida? Onde está o desajuste entre o que você diz amar e o que você realmente prioriza?'
) WHERE id = 'd6c3dab7-7d22-4195-92f3-472f6de6bc16';

UPDATE journey_steps SET content = jsonb_build_object(
  'intro', 'Hábitos são a estrutura invisível da santidade. Eles retiram da vontade o peso da decisão constante e tornam a virtude uma segunda natureza. Sem trilhos, o trem da alma descarrila na primeira emoção forte.',
  'prayer', 'Espírito Santo, concedei-me a perseverança dos pequenos passos. Que minha fidelidade no pouco me prepare para as grandes entregas.',
  'practice', 'Não tente mudar tudo hoje. Escolha um "micro-hábito" espiritual (ex: 3 minutos de ação de graças ao acordar) e comprometa-se a fazê-lo mecanicamente, independente de como se sente.',
  'reflection', 'Nós somos o que repetimos. A santidade não é feita de atos heróicos isolados, mas de uma rotina transfigurada pela graça. O hábito é a liturgia do cotidiano.',
  'journal_prompt', 'Qual vício de comportamento (mesmo pequeno) tem sido o "vazamento" de energia da sua alma? Qual hábito oposto você pode plantar no lugar dele hoje?'
) WHERE id = 'f9ed5e91-2888-4f7e-8499-85f71ffe2101';

-- Aprofundando a Jornada de Rotina de Transformação (0b8ddab7-b106-4873-bc4d-3987421d265d)
UPDATE journey_steps SET content = jsonb_build_object(
  'intro', 'O primeiro pensamento do dia é a semente de todo o seu agir. Quando acordamos e imediatamente buscamos distrações, estamos entregando as chaves da nossa alma ao mundo, antes mesmo de falarmos com o Criador.',
  'prayer', 'Meu Deus, eu Vos ofereço este dia, cada batida do meu coração, cada respiração e cada cansaço. Que tudo seja para a Vossa glória e para a salvação das almas.',
  'practice', 'Mantenha o celular fora do quarto ou desligado até que você tenha feito sua primeira oração. O primeiro som que sua alma deve ouvir é o silêncio de Deus, não o ruído das notificações.',
  'reflection', 'Como você começa o dia determina quem será o dono do seu tempo. O "Salto para a Vida" começa no momento em que você abre os olhos e escolhe a adoração em vez da distração.',
  'journal_prompt', 'O que você sente quando acorda e o silêncio lhe confronta? Essa agitação matinal é sinal de quê na sua vida espiritual?'
) WHERE id = '182be334-906b-447c-8bb7-7be26c2ed328';

UPDATE journey_steps SET content = jsonb_build_object(
  'intro', 'A santidade não está no extraordinário, mas na perfeição com que realizamos o dever comum. O "dever do momento" é a única janela de tempo onde podemos realmente encontrar Deus.',
  'prayer', 'Jesus, ajudai-me a estar presente onde meus pés estão. Que eu faça cada pequena coisa com um amor infinito.',
  'practice', 'Escolha uma tarefa manual ou repetitiva hoje (lavar louça, dirigir, digitar um relatório) e faça-a com total consciência, oferecendo cada movimento como uma oração silenciosa.',
  'reflection', 'A ansiedade é o desejo de estar no futuro; a depressão é o peso de viver no passado. A paz é o fruto de aceitar o agora como a vontade de Deus para você.',
  'journal_prompt', 'Em qual tarefa do seu dia você costuma "fugir" mentalmente? O que aconteceria se você aceitasse essa tarefa como o seu altar de sacrifício hoje?'
) WHERE id = '8d9e9e9e-2020-4000-8000-000000000002';

-- Aprofundando a Jornada de Cura Emocional (b2b2b2b2-3030-4000-8000-000000000002)
UPDATE journey_steps SET content = jsonb_build_object(
  'pch', 'Deus não tem medo das suas feridas; Ele tem sede da sua verdade. Reconhecer a dor não é vitimismo, é realismo espiritual. A cura não pode entrar em uma sala onde a porta está trancada pela negação.',
  'verse', 'Sl 34,18',
  'lectio', 'Medite no Salmo 34. Sinta o peso da palavra "perto". O Senhor não está apenas olhando de longe; Ele está "perto" do coração quebrado.',
  'practice', 'Escreva uma lista das suas 3 maiores dores atuais. Não use eufemismos. Chame a dor pelo nome. Depois, em silêncio, imagine Jesus sentado ao seu lado, lendo essa lista com você.',
  'question', 'Qual dor você tem tentado "curar" sozinho por medo de que Deus a ache pequena ou indigna de atenção?',
  'reflection', 'A dor que não é transformada em oração acaba sendo transmitida em agressão ou somatizada em cansaço crônico.'
) WHERE id = '8f3f79a3-bd01-47c3-afe4-172187266e41';

UPDATE journey_steps SET content = jsonb_build_object(
  'pch', 'Acolher a própria fragilidade é o ato mais corajoso de um cristão. O "jugo suave" de Cristo é o reconhecimento de que não fomos feitos para carregar o peso do mundo, mas para sermos carregados por Ele.',
  'verse', 'Mt 11,28',
  'lectio', 'Leia Mateus 11,25-30. Jesus agradece ao Pai por revelar essas coisas aos "pequeninos". Você aceita ser pequeno diante de Deus?',
  'practice', 'Hoje, quando sentir cansaço ou frustração, não se culpe. Simplesmente pare por 1 minuto, respire fundo e diga: "Senhor, eu acolho minha limitação. Descanso em Ti."',
  'question', 'Quem você está tentando impressionar com a sua suposta força? O que mudaria se você aceitasse seu cansaço?',
  'reflection', 'O orgulho nos faz acreditar que a cura depende da nossa intensidade. A humildade nos ensina que ela depende da nossa disponibilidade.'
) WHERE id = '7229c52f-8e64-48b4-ad8c-978f30cb3bb9';

-- Aprofundando a Jornada de Liberdade Interior (c1c2c3d4-3030-4000-8000-000000000030)
-- Nota: Vou assumir que existem IDs específicos para esta jornada também.
-- Vou atualizar mais alguns passos de Cura Emocional já que tenho os IDs.

UPDATE journey_steps SET content = jsonb_build_object(
  'pch', 'Deus pergunta "Onde estás?" no Éden não por falta de informação, mas para provocar o despertar da consciência. Nomear a dor é tirar o poder que o oculto exerce sobre nós.',
  'verse', 'Gn 3,9',
  'lectio', 'Gênesis 3,8-13. Veja como o medo faz Adão se esconder. Deus o chama para fora do arbusto. Nomear é sair do esconderijo.',
  'practice', 'Dê um nome específico ao que você sente (não apenas "mal", mas "inveja", "rejeição", "medo do fracasso"). Escreva: "Eu sinto [X] e entrego isso agora ao Senhor."',
  'question', 'Do que você está se escondendo atrás da sua rotina agitada? Qual verdade você tem medo de nomear?',
  'reflection', 'O que não é nomeado não pode ser curado. O silêncio sobre a própria sombra é o banquete do inimigo.'
) WHERE id = '228114be-1c58-4279-bd86-90f0aa69b48d';

UPDATE journey_steps SET content = jsonb_build_object(
  'pch', 'Jesus chorou diante da morte de Lázaro e da dor de Suas amigas. Lágrimas não são sinal de falta de fé; são a linguagem da alma que ainda sabe amar em um mundo quebrado.',
  'verse', 'Jo 11,35',
  'lectio', 'João 11,32-44. Jesus se "comoveu profundamente". Ele não ofereceu uma solução técnica imediata; Ele primeiro compartilhou a dor.',
  'practice', 'Se você tem lágrimas presas, procure um momento de solidão. Leia o Salmo 42 em voz alta. Permita que a Palavra de Deus dê voz ao seu choro reprimido.',
  'question', 'Quais lágrimas você engoliu para parecer "espiritual" ou "maduro"? O que aconteceria se você chorasse diante do seu Pai?',
  'reflection', 'As lágrimas lavam as lentes da alma para que possamos enxergar a Ressurreição que vem depois do sepulcro.'
) WHERE id = '8d54eebc-3e64-4de2-b654-e644df39afdf';
