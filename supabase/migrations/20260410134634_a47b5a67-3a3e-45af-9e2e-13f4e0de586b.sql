-- Deepening Journey Contents (Part 4)
-- Aprofundando a Jornada de Rotina Espiritual (a1b2c3d4-1111-4000-8000-000000000001)
UPDATE journey_steps SET content = jsonb_build_object(
  'intro', 'A rotina não é uma prisão, é a arquitetura da liberdade. Sem uma estrutura de oração, a alma torna-se refém dos estados de ânimo e das urgências do mundo. O despertar interior começa com a decisão de dar a Deus as primícias do tempo.',
  'prayer', 'Senhor, ensinai-me a disciplina do amor. Que minha rotina não seja um peso morto, mas um ritmo de vida que me mantém conectado à Vossa graça a cada segundo.',
  'practice', 'Defina um "âncoras de oração": um gesto simples ou uma frase curta que você dirá toda vez que atravessar uma porta ou beber água hoje. Transforme o automático em sagrado.',
  'reflection', 'A perseverança na rotina é a maior prova de amor. É fácil rezar no entusiasmo; o mérito está em rezar no cansaço e no deserto.',
  'journal_prompt', 'O que no seu dia a dia mais "drena" sua energia espiritual? Como você pode blindar sua rotina contra esse dreno hoje?'
) WHERE id = '8197c079-be7b-4fe0-b6b6-52fca2c2ad2d';

-- Aprofundando a Jornada de Discernimento Vocacional (b1b2c3d4-3333-4000-8000-000000000003)
UPDATE journey_steps SET content = jsonb_build_object(
  'intro', 'Vocação não é apenas uma escolha de carreira; é a descoberta de quem você foi feito para ser aos olhos de Deus. É o lugar onde seu desejo mais profundo e a necessidade do mundo se encontram sob o olhar do Pai.',
  'prayer', 'Jesus, mestre da minha vida, não permitais que eu escolha apenas por medo ou conveniência. Dai-me a visão para enxergar o sinal que Tu já plantaste no meu coração.',
  'practice', 'Reveja sua história de vida e identifique 3 momentos em que você sentiu uma paz que o mundo não pode dar. O que você estava fazendo nesses momentos? Ali pode estar o rastro da sua vocação.',
  'reflection', 'Deus não nos chama para o que não podemos fazer, mas para o que só podemos fazer com a ajuda dEle. O chamado é sempre um convite à confiança absoluta.',
  'journal_prompt', 'Se o dinheiro e o julgamento dos outros não existissem, como você serviria a Deus e ao próximo com alegria?'
) WHERE id = 'c1c2c3d4-3301-4000-8000-000000000001';

-- Aprofundando a Jornada de Teologia do Corpo (b1b2c3d4-4444-4000-8000-000000000004)
UPDATE journey_steps SET content = jsonb_build_object(
  'intro', 'O corpo não é apenas uma "embalagem" para a alma; ele é o sinal visível do mistério invisível de Deus. Através do corpo, a pessoa se torna um dom. São João Paulo II ensina que "o corpo, e somente ele, é capaz de tornar visível o que é invisível: o espiritual e o divino".',
  'prayer', 'Criador do corpo e da alma, ensinai-me a respeitar meu corpo como templo do Espírito Santo. Que meu olhar seja puro e minha presença seja um dom para os outros.',
  'practice', 'Hoje, ao realizar qualquer ato físico (comer, caminhar, abraçar), faça-o com a consciência de que seu corpo é uma linguagem de amor. Evite o tratamento puramente funcional do seu próprio corpo.',
  'reflection', 'A pureza não é o medo do corpo, mas o reconhecimento da sua dignidade sagrada. O corpo revela a pessoa e a pessoa revela a Deus.',
  'journal_prompt', 'Como você tem tratado o seu corpo? Como objeto de prazer, como fardo ou como templo do Deus Vivo?'
) WHERE id = 'd1d2d3d4-4401-4000-8000-000000000001';
