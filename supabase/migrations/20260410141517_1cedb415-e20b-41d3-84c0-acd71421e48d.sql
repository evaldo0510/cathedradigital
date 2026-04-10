-- Deepening Fundamentos (9f444a3e-9838-48b8-ae77-0b5a6829d4fa)
UPDATE journey_steps SET content = jsonb_build_object(
  'intro', 'Fundamentos invisíveis sustentam estruturas visíveis. Se a base da sua vida for a opinião alheia ou o sucesso passageiro, qualquer tempestade interior a fará desmoronar. Santo Agostinho dizia que "quem se constrói sobre si mesmo, constrói sobre a areia".',
  'reflection', 'A verdade não é algo que você possui, é algo que te possui. Onde você está fincando as estacas da sua alma hoje?',
  'journal_prompt', 'Se hoje você perdesse seu cargo, sua reputação e seus bens, o que restaria de essencial? Essa "sobra" é o seu verdadeiro fundamento ou apenas um vazio?',
  'practice', 'Escolha uma "verdade incômoda" sobre você que você tem evitado. Escreva-a e leve-a para a oração, pedindo a Deus que a transforme em rocha sólida de autoconhecimento.',
  'prayer', 'Senhor, arranca de mim tudo o que não é Teu. Se minha casa está sobre a areia, permite que ela caia agora, para que eu possa reconstruí-la sobre a Tua Verdade.'
) WHERE journey_id = '9f444a3e-9838-48b8-ae77-0b5a6829d4fa' AND step_order = 1;

UPDATE journey_steps SET content = jsonb_build_object(
  'intro', 'A busca por sentido não é um luxo intelectual, é a necessidade biológica e espiritual mais profunda da alma. Viktor Frankl descobriu que o homem pode suportar qualquer "como" se tiver um "porquê". Na fé, esse "porquê" é uma Pessoa.',
  'reflection', 'Sua vida não é um acidente estatístico, mas um pensamento eterno de Deus que se tornou carne. Você é necessário.',
  'journal_prompt', 'Qual é a ferida na sua história que parece mais "sem sentido"? Como essa dor poderia se tornar um serviço para outros que sofrem o mesmo?',
  'practice', 'Observe a beleza de algo simples (uma flor, o céu, um rosto). Não apenas olhe; tente perceber a intenção criadora por trás dessa beleza e sinta-se parte desse plano.',
  'prayer', 'Divino Escultor, que eu não resista aos Teus golpes. Dá-me a clareza para enxergar o sentido oculto em cada cansaço e a esperança em cada espera.'
) WHERE journey_id = '9f444a3e-9838-48b8-ae77-0b5a6829d4fa' AND step_order = 2;

-- Deepening Formação (051b209e-9985-44da-a832-ca884783cb98) steps 4-7
UPDATE journey_steps SET content = jsonb_build_object(
  'intro', 'O silêncio não é ausência de ruído, é presença de Si mesmo e de Deus. Falar demais é muitas vezes uma "hemorragia da alma", uma tentativa desesperada de preencher um vazio que só o Infinito pode ocupar.',
  'reflection', 'Quem fala muito, pouco ouve. E quem pouco ouve, não aprende a amar o que é real, mas apenas o que projeta.',
  'journal_prompt', 'Quantas vezes hoje você falou para se defender, para se exaltar ou para evitar um silêncio desconfortável? O que você teme ouvir se ficar calado?',
  'practice', 'Estabeleça um "jejum de palavras" por 30 minutos hoje. Se alguém falar com você, responda apenas o essencial. Use o silêncio para ouvir seus próprios pensamentos sem julgá-los.',
  'prayer', 'Senhor do Silêncio, ensina-me a arte de calar para que minha palavra tenha peso e minha escuta tenha amor. Que meu silêncio seja adoração.'
) WHERE journey_id = '051b209e-9985-44da-a832-ca884783cb98' AND step_order = 4;

UPDATE journey_steps SET content = jsonb_build_object(
  'intro', 'Negar a realidade é a raiz de todo sofrimento neurótico e espiritual. A santidade começa com a aceitação brutal de "quem eu sou" e de "onde estou". Deus só pode agir na verdade, nunca na máscara que criamos.',
  'reflection', 'A obediência à verdade é a única liberdade possível. Fora da realidade, só existe a fantasia que nos escraviza ao medo.',
  'journal_prompt', 'Qual é a verdade sobre sua situação atual que você tem "negociado"? O que aconteceria se você simplesmente parasse de lutar contra o que é inevitável?',
  'practice', 'Diga em voz alta uma verdade difícil sobre si mesmo hoje (ex: "eu sou invejoso", "eu sou preguiçoso"). Sinta o peso dessa verdade e, em seguida, a leveza de não precisar mais escondê-la.',
  'prayer', 'Luz do Mundo, ilumina os porões da minha alma. Que eu não tenha medo da minha própria sombra, pois é nela que Tu desejas habitar.'
) WHERE journey_id = '051b209e-9985-44da-a832-ca884783cb98' AND step_order = 5;

UPDATE journey_steps SET content = jsonb_build_object(
  'intro', 'A incapacidade de dizer "não" é muitas vezes falta de uma identidade sólida. Quando dizemos sim a tudo, estamos sendo escravos da aprovação alheia. A coragem do "não" é o que protege o nosso "sim" a Deus.',
  'reflection', 'Sua vida é definida pelos limites que você estabelece. Onde não há limite, não há forma; e onde não há forma, não há beleza.',
  'journal_prompt', 'Quem é a pessoa ou qual é a atividade que mais drena sua energia porque você não consegue dizer não? O que você está sacrificando no altar do agradar aos outros?',
  'practice', 'Diga um "não" consciente hoje a algo que rouba seu tempo de oração ou seu descanso necessário. Não se justifique excessivamente; apenas sustente sua decisão.',
  'prayer', 'Fortaleza de Israel, dá-me a coragem de não ser um "agradador de homens". Que meu único desejo seja agradar a Ti, custe o que custar à minha vaidade.'
) WHERE journey_id = '051b209e-9985-44da-a832-ca884783cb98' AND step_order = 6;

-- Deepening Cura (f0f35259-85b3-44fa-99c1-4f9ec87c9f4d)
UPDATE journey_steps SET content = jsonb_build_object(
  'intro', 'Psicologicamente, a cura começa no momento em que a dor deixa de ser um inimigo a ser evitado e se torna um mestre a ser ouvido. Olhar para a própria ferida é o ato mais corajoso que um homem pode realizar.',
  'reflection', 'Deus não cura o que nós escondemos. A ferida que não é exposta à luz continua a inflamar o presente.',
  'journal_prompt', 'O que em você ainda grita por atenção através do mau humor, da ansiedade ou do cansaço crônico? Que parte da sua história você ainda se recusa a visitar?',
  'practice', 'Passe 10 minutos em frente a um espelho, olhando-se nos olhos. Sem críticas. Apenas reconhecendo a pessoa que sobreviveu a tudo o que você passou. Diga: "Eu te vejo".',
  'prayer', 'Médico das Almas, entra onde eu não consigo entrar. Toca as cicatrizes que eu sinto vergonha de carregar e transforma minha dor em compaixão.'
) WHERE journey_id = 'f0f35259-85b3-44fa-99c1-4f9ec87c9f4d' AND step_order = 1;

UPDATE journey_steps SET content = jsonb_build_object(
  'intro', 'O ressentimento é o veneno que bebemos esperando que o outro morra. Perdoar não é um sentimento, é uma decisão de cancelar a dívida que o outro tem com você, para que você possa finalmente sair da prisão do passado.',
  'reflection', 'O perdão é a faxina da alma. Sem ele, o ar interior torna-se irrespirável.',
  'journal_prompt', 'Quem é a pessoa que ainda vive "de graça" na sua mente, roubando sua paz? Qual é o custo emocional de continuar cobrando essa dívida?',
  'practice', 'Escreva uma carta para alguém que te feriu, dizendo tudo o que você sentiu. Não envie. Depois, escreva no final: "Eu te libero da obrigação de me reparar. Eu entrego essa justiça a Deus". Rasgue a carta.',
  'prayer', 'Cordeiro de Deus, que tirais o pecado do mundo, tira de mim o peso da vingança. Ensina-me a perdoar como Tu me perdoas: sem medidas e sem cobranças.'
) WHERE journey_id = 'f0f35259-85b3-44fa-99c1-4f9ec87c9f4d' AND step_order = 2;

-- Deepening Liberdade Interior (c1c2c3d4-3030-4000-8000-000000000030) - Example Day 1
UPDATE journey_steps SET content = jsonb_build_object(
  'lectio', 'Leia Mateus 6,25-34. Note a palavra que faz seu coração acelerar ou se acalmar. Por que essa palavra específica?',
  'pch', 'A pressa é a forma mais comum de ateísmo prático: agimos como se tudo dependesse de nós e nada de Deus. A pressa revela onde a nossa confiança ainda não chegou.',
  'practice', 'Hoje, faça uma tarefa comum (lavar louça, caminhar, comer) na metade da velocidade habitual. Sinta a resistência da sua mente em "perder tempo". Não ceda à pressa.',
  'question', 'Qual é a área da sua vida que você tenta controlar através da ansiedade? O que aconteceria se você soltasse o leme por apenas uma hora?',
  'verse', 'Mt 6,25-34',
  'reflection', 'A liberdade começa quando percebemos que não somos os donos do resultado, mas apenas os servidores do momento presente. Soltar é o primeiro ato de poder real.'
) WHERE journey_id = 'c1c2c3d4-3030-4000-8000-000000000030' AND step_order = 1;

-- Deepening Mística (b25b02f4-0533-483f-9a7b-c2e866e6f25d)
UPDATE journey_steps SET content = jsonb_build_object(
  'intro', 'A mística não é para os extraordinários, mas para os que desejam viver o ordinário com uma profundidade infinita. É a passagem da "conversa sobre Deus" para a "conversa com Deus", de coração a coração.',
  'reflection', 'Onde termina a sua razão, começa a sua adoração. O mistério não é algo obscuro, mas algo tão luminoso que cega os olhos do ego.',
  'journal_prompt', 'Quando foi a última vez que você sentiu que o tempo parou? O que estava acontecendo? Essa fresta de eternidade é o convite para a vida mística.',
  'practice', 'Pratique a "Oração de Recolhimento" por 15 minutos: feche os olhos, ignore os pensamentos que passam como nuvens e foque apenas na Presença que habita o seu centro.',
  'prayer', 'Amado da minha alma, atrai-me para o Teu silêncio. Que eu não busque consolos, mas o Deus das consolações. Habita em mim como eu desejo habitar em Ti.'
) WHERE journey_id = 'b25b02f4-0533-483f-9a7b-c2e866e6f25d' AND step_order = 1;

-- Deepening Coração (150f78d3-019b-40c0-962e-a83576309ea5)
UPDATE journey_steps SET content = jsonb_build_object(
  'intro', 'O coração é o centro de gravidade da alma. Se ele estiver ancorado no que passa, você viverá em constante naufrágio. Se estiver ancorado no Eterno, nenhuma tempestade poderá roubar sua paz profunda.',
  'reflection', 'Amamos o que conhecemos, mas só conhecemos verdadeiramente o que amamos. Para onde seu coração tem "viajado" nas horas de folga?',
  'journal_prompt', 'Liste os três maiores desejos que habitam seu coração hoje. Eles são janelas para o céu ou correntes que te prendem ao chão?',
  'practice', 'Faça um "exame dos afetos": ao final do dia, identifique qual emoção predominou e o que ela diz sobre quem está ocupando o trono do seu coração.',
  'prayer', 'Mestre, ordena meus amores. Que eu ame as criaturas por Tua causa, e a Ti acima de tudo. Cria em mim um coração puro e renova em mim um espírito firme.'
) WHERE journey_id = '150f78d3-019b-40c0-962e-a83576309ea5' AND step_order = 1;

-- Update Journey descriptions for more impact
UPDATE journeys SET description = 'Um mergulho radical na arquitetura da alma. Descubra como desconstruir as prisões mentais e reconstruir uma vida de liberdade autêntica, fundamentada na Verdade que liberta.' WHERE id = 'c1c2c3d4-3030-4000-8000-000000000030';
UPDATE journeys SET description = 'Muito além de uma carreira ou função. Descubra o chamado eterno gravado no seu ser e alinhe seus talentos com a vontade de Deus para uma vida de significado absoluto.' WHERE id = 'a1a1a1a1-3030-4000-8000-000000000001';
UPDATE journeys SET description = 'Acolha suas feridas não como fardos, mas como portais para a misericórdia. Um processo profundo de cura emocional à luz da fé e da psicologia integral.' WHERE id = 'b2b2b2b2-3030-4000-8000-000000000002';
UPDATE journeys SET description = 'Silencie o ruído, organize o caos interior e encontre a clareza necessária para decidir com sabedoria. Uma jornada de discernimento e ordem mental.' WHERE id = 'c3c3c3c3-3030-4000-8000-000000000003';
