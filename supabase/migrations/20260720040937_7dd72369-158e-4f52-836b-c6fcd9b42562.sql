
-- Léxico Teológico — publicação editorial CAT-13.1
-- Popula os 13 verbetes com conteúdo teológico completo e vincula jornadas existentes.

-- ALIANÇA
UPDATE public.glossary SET
  definition = 'A Aliança é o pacto gratuito pelo qual Deus se compromete com o homem, chamando-o à comunhão de vida e amor. Culmina na Nova e Eterna Aliança selada no sangue de Cristo (cf. Lc 22,20).',
  interpretation = 'Do primeiro pacto com Noé (Gn 9) à Aliança com Abraão (Gn 15) e Moisés (Ex 24), a Escritura narra uma pedagogia divina que prepara o Povo eleito para o Verbo encarnado. Em Cristo, a Aliança já não se escreve em pedras, mas nos corações (cf. Jr 31,31-34; Hb 8,10). O Batismo introduz cada cristão nessa Aliança e a Eucaristia a renova sacramentalmente. Toda a vida moral do cristão é, portanto, resposta fiel a um Deus que primeiro amou.',
  practical_application = 'Renovar diariamente a consciência da Aliança batismal. Ao participar da Missa, unir a própria vida ao Sangue derramado. Cultivar a fidelidade nos pequenos compromissos como sinal do "sim" pessoal ao Deus que se aliou conosco.',
  bible_verses = ARRAY['Gn 15,18','Ex 24,8','Jr 31,31','Lc 22,20','Hb 8,6'],
  catechism_references = ARRAY['56','62','580','610','1116'],
  magisterium_references = ARRAY['Dei Verbum 3','Lumen Gentium 9','Ecclesia de Eucharistia 12'],
  saints_refs = ARRAY['abrao','moises','joao-batista'],
  fathers_refs = ARRAY['ireneu-de-lion','agostinho-de-hipona'],
  prayer_refs = ARRAY['renovacao-das-promessas-batismais','ato-de-fe'],
  journey_refs = ARRAY['a0a0a0a0-0005-4000-8000-000000000001'::uuid],
  status = 'published', published_at = now()
WHERE slug = 'alianca';

-- AMOR
UPDATE public.glossary SET
  definition = 'Amor (caritas, agape) é a virtude teologal pela qual amamos a Deus sobre todas as coisas por Ele mesmo e ao próximo como a nós mesmos por amor de Deus (CIC 1822). É dom infuso do Espírito Santo, forma de todas as virtudes.',
  interpretation = 'São João define Deus como Amor (1Jo 4,8) — não sentimento passageiro, mas doação trinitária eterna. O amor cristão é participação nessa vida: recebido no Batismo, alimentado na Eucaristia, purificado no sofrimento. Distingue-se do mero afeto porque quer verdadeiramente o bem do outro. São Paulo o descreve como paciente, benigno, sem inveja (1Cor 13). Sem caridade, mesmo os maiores dons são nada.',
  practical_application = 'Escolher o bem concreto do outro mesmo quando custa. Exercitar as obras de misericórdia corporais e espirituais. Rezar diariamente pedindo o dom da caridade: "Senhor, ensina-me a amar como Tu amas."',
  bible_verses = ARRAY['Dt 6,5','Mt 22,37-40','Jo 15,13','1Cor 13,1-13','1Jo 4,7-21'],
  catechism_references = ARRAY['1822','1823','1824','1825','1826','1827','1828','1829'],
  magisterium_references = ARRAY['Deus Caritas Est','Redemptor Hominis 10','Fratelli Tutti 91'],
  saints_refs = ARRAY['teresa-de-lisieux','joao-da-cruz','madre-teresa-de-calcuta'],
  fathers_refs = ARRAY['agostinho-de-hipona','joao-crisostomo'],
  prayer_refs = ARRAY['ato-de-caridade','oracao-de-sao-francisco'],
  journey_refs = ARRAY['150f78d3-019b-40c0-962e-a83576309ea5'::uuid],
  status = 'published', published_at = now()
WHERE slug = 'amor';

-- CRISTOLOGIA
UPDATE public.glossary SET
  definition = 'Cristologia é o tratado teológico que estuda a Pessoa e a obra de Jesus Cristo, verdadeiro Deus e verdadeiro homem, unidos hipostaticamente na única Pessoa do Verbo (Concílio de Calcedônia, 451).',
  interpretation = 'Toda a fé cristã se concentra em Cristo: Nele o Pai se revela plenamente (Jo 1,18; Hb 1,1-2) e o homem se conhece a si mesmo (GS 22). A Cristologia articula os dogmas trinitário, soteriológico e eclesiológico. Combate antigas heresias — arianismo, nestorianismo, monofisismo — afirmando a plena divindade e humanidade de Cristo, sem confusão nem separação. Do mistério da Encarnação brotam o valor eterno de cada gesto humano de Jesus e o sentido salvífico de sua Paixão, Morte e Ressurreição.',
  practical_application = 'Contemplar diariamente um mistério da vida de Cristo (Rosário, Lectio Divina dos Evangelhos). Conformar-se a Cristo é o coração da vida cristã — perguntar-se em cada decisão: "O que faria Jesus?"',
  bible_verses = ARRAY['Jo 1,1-18','Mt 16,16','Fl 2,6-11','Cl 1,15-20','Hb 1,1-4'],
  catechism_references = ARRAY['456','464','469','470','480','571'],
  magisterium_references = ARRAY['Symbolum Chalcedonense','Dominus Iesus','Redemptor Hominis'],
  saints_refs = ARRAY['tomas-de-aquino','atanasio','cirilo-de-alexandria'],
  fathers_refs = ARRAY['leao-magno','atanasio','cirilo-de-alexandria'],
  prayer_refs = ARRAY['anima-christi','credo-niceno-constantinopolitano'],
  journey_refs = ARRAY['b1b1b1b1-0004-4000-8000-000000000001'::uuid],
  status = 'published', published_at = now()
WHERE slug = 'cristologia';

-- ECLESIOLOGIA
UPDATE public.glossary SET
  definition = 'Eclesiologia é o tratado teológico sobre a Igreja: sua natureza, missão, estrutura sacramental e destino escatológico. Ela é Corpo Místico de Cristo (1Cor 12), Povo de Deus, Templo do Espírito e Sacramento universal de salvação (LG 1).',
  interpretation = 'A Igreja não é fruto de decisão humana, mas mistério nascido do lado aberto de Cristo na Cruz. Una, santa, católica e apostólica, subsiste na Igreja Católica governada pelo Sucessor de Pedro e pelos bispos em comunhão com ele (LG 8). Sua estrutura hierárquica serve à comunhão; sua liturgia antecipa a Jerusalém celeste. Peregrina no tempo, é ao mesmo tempo santa e sempre necessitada de purificação (Ecclesia semper reformanda).',
  practical_application = 'Amar a Igreja concreta — a paróquia, o pároco, os irmãos — sem idealizações. Participar ativamente da vida sacramental e da missão evangelizadora. Rezar pelo Papa, bispos e sacerdotes.',
  bible_verses = ARRAY['Mt 16,18','At 2,42','1Cor 12,12-27','Ef 5,25-27','Ap 21,2'],
  catechism_references = ARRAY['748','752','770','811','857'],
  magisterium_references = ARRAY['Lumen Gentium','Unitatis Redintegratio','Evangelii Gaudium'],
  saints_refs = ARRAY['inacio-de-antioquia','cipriano-de-cartago','joao-paulo-ii'],
  fathers_refs = ARRAY['cipriano-de-cartago','inacio-de-antioquia'],
  prayer_refs = ARRAY['credo-apostolico','oracao-pela-igreja'],
  journey_refs = ARRAY['b1b1b1b1-0002-4000-8000-000000000001'::uuid],
  status = 'published', published_at = now()
WHERE slug = 'eclesiologia';

-- ESCATOLOGIA
UPDATE public.glossary SET
  definition = 'Escatologia (do grego eschata, "as últimas coisas") é o tratado teológico sobre o destino final do homem e do cosmos: morte, juízo, céu, purgatório, inferno e ressurreição dos mortos (CIC 1020-1050).',
  interpretation = 'A esperança cristã não é otimismo vago, mas certeza fundada na Ressurreição de Cristo, primícia dos que dormem (1Cor 15,20). A morte, consequência do pecado, é vencida em Cristo; o juízo particular acontece no instante da morte, e o Juízo Final na Parusia. O céu é a plena comunhão de vida e amor com a Trindade; o purgatório, purificação para os que morrem em graça mas ainda imperfeitos; o inferno, autoexclusão eterna livre da comunhão com Deus. Toda a liturgia é já "antegozo" do banquete escatológico.',
  practical_application = 'Viver cada dia à luz da eternidade — memento mori sadio, não mórbido. Oferecer sufrágios pelos falecidos. Cultivar a esperança viva mesmo nas provas: "Nosso lugar de cidadania está nos céus" (Fl 3,20).',
  bible_verses = ARRAY['Mt 25,31-46','1Cor 15,20-28','1Ts 4,13-18','Ap 21,1-4','Ap 22,20'],
  catechism_references = ARRAY['1020','1023','1030','1033','1038'],
  magisterium_references = ARRAY['Spe Salvi','Lumen Gentium 48','Benedictus Deus (1336)'],
  saints_refs = ARRAY['catarina-de-genova','faustina-kowalska'],
  fathers_refs = ARRAY['agostinho-de-hipona','gregorio-magno'],
  prayer_refs = ARRAY['oracao-pelas-almas','requiem-aeternam'],
  journey_refs = ARRAY['d1d1d1d1-0005-4000-8000-000000000001'::uuid],
  status = 'published', published_at = now()
WHERE slug = 'escatologia';

-- EUCARISTIA
UPDATE public.glossary SET
  definition = 'A Eucaristia é o sacramento no qual, sob as espécies do pão e do vinho, se torna verdadeira, real e substancialmente presente o Corpo, Sangue, Alma e Divindade de Jesus Cristo. Fonte e ápice de toda a vida cristã (LG 11).',
  interpretation = 'Instituída na Última Ceia (Lc 22,19-20), é ao mesmo tempo Sacrifício (memorial do Calvário atualizado incruentamente), Presença Real (transubstanciação) e Comunhão (banquete que une à Trindade e à Igreja). Cada Missa faz presente o único Sacrifício de Cristo. A adoração eucarística prolonga a Missa, permitindo permanecer diante do Senhor realmente presente. Sem a Eucaristia, a Igreja não existiria; com ela, o cristão recebe o penhor da vida eterna.',
  practical_application = 'Preparar-se para a Comunhão com o sacramento da Confissão. Fazer ação de graças silenciosa após comungar. Visitar o Santíssimo semanalmente. Participar da Missa dominical com plena consciência do mistério.',
  bible_verses = ARRAY['Mt 26,26-28','Jo 6,51-58','1Cor 11,23-26','Lc 24,30-31'],
  catechism_references = ARRAY['1322','1324','1333','1373','1376','1413'],
  magisterium_references = ARRAY['Ecclesia de Eucharistia','Sacrosanctum Concilium 47','Sacramentum Caritatis','Mysterium Fidei'],
  saints_refs = ARRAY['tomas-de-aquino','pedro-julio-eymard','joao-maria-vianney'],
  fathers_refs = ARRAY['justino-martir','joao-crisostomo','ambrosio-de-milao'],
  prayer_refs = ARRAY['anima-christi','adoro-te-devote','oracao-de-comunhao-espiritual'],
  journey_refs = ARRAY['9f444a3e-9838-48b8-ae77-0b5a6829d4fa'::uuid],
  status = 'published', published_at = now()
WHERE slug = 'eucaristia';

-- GRAÇA
UPDATE public.glossary SET
  definition = 'A Graça é o favor gratuito de Deus, o dom sobrenatural pelo qual Ele nos comunica sua própria vida infundida pelo Espírito Santo em nossa alma, para curá-la do pecado e santificá-la (CIC 1996-1999).',
  interpretation = 'Distingue-se a graça santificante — estado habitual que nos torna filhos de Deus — das graças atuais, intervenções pontuais que iluminam ou fortalecem. Toda a vida sobrenatural é obra da graça: preveniente (que precede a decisão livre), operante (que age em nós) e cooperante (com a qual colaboramos). A graça não anula a natureza: eleva-a, sara-a, torna-a capaz do divino. O merecimento humano diante de Deus é, ele mesmo, dom da graça (cf. Concílio de Trento).',
  practical_application = 'Viver em estado de graça, recorrendo à Confissão quando necessário. Multiplicar os canais de graça: sacramentos, oração, escuta da Palavra. Pedir a graça específica de que se precisa — "Vigia, ora, pede."',
  bible_verses = ARRAY['Jo 1,16','Rm 5,20-21','2Cor 12,9','Ef 2,8-9','Tt 3,7'],
  catechism_references = ARRAY['1996','1997','1998','1999','2000','2001'],
  magisterium_references = ARRAY['Concílio de Trento — Decreto sobre a Justificação','Humani Generis','Veritatis Splendor 22'],
  saints_refs = ARRAY['agostinho-de-hipona','tomas-de-aquino','teresa-de-lisieux'],
  fathers_refs = ARRAY['agostinho-de-hipona','joao-cassiano'],
  prayer_refs = ARRAY['veni-creator-spiritus','oracao-a-nossa-senhora-das-gracas'],
  journey_refs = ARRAY['f0f35259-85b3-44fa-99c1-4f9ec87c9f4d'::uuid],
  status = 'published', published_at = now()
WHERE slug = 'graca';

-- MARIOLOGIA
UPDATE public.glossary SET
  definition = 'Mariologia é o tratado teológico sobre a Bem-Aventurada Virgem Maria, Mãe de Deus (Theotókos), Imaculada Conceição, sempre Virgem, Assunta ao Céu e Mãe da Igreja.',
  interpretation = 'Maria não é fim em si mesma: toda mariologia autêntica é cristológica e eclesiológica. Nela contemplamos o que a Igreja é chamada a ser — Virgem fiel, Mãe fecunda, discípula perfeita. Os quatro dogmas marianos (Maternidade divina, Virgindade perpétua, Imaculada Conceição, Assunção) protegem a verdade sobre Cristo e sobre a redenção. A devoção mariana, expressa no Rosário e na consagração, é caminho seguro para Jesus: "Ad Iesum per Mariam" (São Luís Maria de Montfort).',
  practical_application = 'Rezar o Rosário diariamente ou ao menos uma dezena. Consagrar-se a Jesus por Maria. Aprender de Maria o silêncio contemplativo ("guardava todas essas coisas no coração" — Lc 2,19).',
  bible_verses = ARRAY['Lc 1,26-38','Lc 1,46-55','Jo 2,1-11','Jo 19,25-27','Ap 12,1'],
  catechism_references = ARRAY['484','490','495','966','969','971'],
  magisterium_references = ARRAY['Lumen Gentium VIII','Redemptoris Mater','Marialis Cultus','Munificentissimus Deus'],
  saints_refs = ARRAY['luis-maria-grignion-de-montfort','maximiliano-kolbe','joao-paulo-ii'],
  fathers_refs = ARRAY['ireneu-de-lion','joao-damasceno'],
  prayer_refs = ARRAY['rosario','ave-maria','sub-tuum-praesidium','magnificat'],
  journey_refs = ARRAY['c7119247-9778-4560-81bb-c0349ca4bb40'::uuid],
  status = 'published', published_at = now()
WHERE slug = 'mariologia';

-- PNEUMATOLOGIA
UPDATE public.glossary SET
  definition = 'Pneumatologia é o tratado teológico sobre o Espírito Santo, terceira Pessoa da Santíssima Trindade, "Senhor que dá a vida", que procede do Pai e do Filho (Filioque) e é adorado e glorificado com o Pai e o Filho.',
  interpretation = 'O Espírito é o Amor pessoal entre o Pai e o Filho, derramado nos corações dos fiéis (Rm 5,5). Age na criação, na inspiração das Escrituras, na Encarnação, na Igreja e em cada alma. Distribui carismas para o bem comum (1Cor 12), gera a santidade e conduz a Igreja a toda verdade (Jo 16,13). Sete dons (sabedoria, entendimento, conselho, fortaleza, ciência, piedade, temor de Deus) e doze frutos manifestam sua ação. Ignorar o Espírito Santo é reduzir a fé a moralismo.',
  practical_application = 'Invocar o Espírito Santo antes de decisões, orações e leitura da Palavra. Cultivar sensibilidade aos seus impulsos ("Suave hóspede da alma"). Rezar diariamente ao menos um Veni Creator ou Veni Sancte Spiritus.',
  bible_verses = ARRAY['Gn 1,2','Jo 14,26','Jo 16,13','At 2,1-4','Rm 8,14-17','Gl 5,22-23'],
  catechism_references = ARRAY['687','689','691','731','736','1830'],
  magisterium_references = ARRAY['Dominum et Vivificantem','Lumen Gentium 4','Ad Gentes 4'],
  saints_refs = ARRAY['basilio-magno','serafim-de-sarov','joao-xxiii'],
  fathers_refs = ARRAY['basilio-magno','gregorio-de-nazianzo'],
  prayer_refs = ARRAY['veni-creator-spiritus','veni-sancte-spiritus','sequencia-de-pentecostes'],
  journey_refs = ARRAY['a1b2c3d4-0003-4000-8000-000000000003'::uuid],
  status = 'published', published_at = now()
WHERE slug = 'pneumatologia';

-- SACRAMENTO
UPDATE public.glossary SET
  definition = 'Sacramento é sinal sensível e eficaz da graça, instituído por Cristo e confiado à Igreja, pelo qual nos é dispensada a vida divina (CIC 1131). São sete: Batismo, Confirmação, Eucaristia, Penitência, Unção dos Enfermos, Ordem e Matrimônio.',
  interpretation = 'Cada sacramento é ação de Cristo através da Igreja — Ele é o principal celebrante. Produz o que significa (ex opere operato): não depende da santidade do ministro, mas da fidelidade do rito à instituição de Cristo, exigindo do fiel a disposição interior. Os sacramentos da iniciação (Batismo, Confirmação, Eucaristia) fundamentam a vida cristã; os de cura (Penitência, Unção) restauram; os de serviço (Ordem, Matrimônio) constroem a Igreja. A vida sacramental é a arquitetura sobrenatural do cristão.',
  practical_application = 'Frequentar regularmente a Confissão (mensalmente ao menos). Preparar-se conscientemente para cada sacramento. Redescobrir o Batismo como identidade fundamental — sinal da cruz consciente, água benta ao entrar em casa.',
  bible_verses = ARRAY['Mt 28,19','Jo 20,22-23','Tg 5,14-15','1Cor 11,23-26'],
  catechism_references = ARRAY['1131','1210','1213','1420','1533'],
  magisterium_references = ARRAY['Sacrosanctum Concilium','Concílio de Trento — Sessão VII','Ecclesia de Eucharistia'],
  saints_refs = ARRAY['tomas-de-aquino','joao-maria-vianney'],
  fathers_refs = ARRAY['ambrosio-de-milao','cirilo-de-jerusalem'],
  prayer_refs = ARRAY['ato-de-contricao','oracao-antes-da-confissao'],
  journey_refs = ARRAY['9f444a3e-9838-48b8-ae77-0b5a6829d4fa'::uuid],
  status = 'published', published_at = now()
WHERE slug = 'sacramento';

-- SOTERIOLOGIA
UPDATE public.glossary SET
  definition = 'Soteriologia é o tratado teológico sobre a salvação — a obra pela qual Cristo, por sua Encarnação, Vida, Paixão, Morte e Ressurreição, redimiu o gênero humano do pecado e da morte, restaurando-nos à comunhão com Deus.',
  interpretation = 'A salvação é obra da Trindade: o Pai envia, o Filho realiza, o Espírito aplica. Cristo é único Mediador (1Tm 2,5). Sua morte é sacrifício expiatório, satisfação vicária e vitória sobre o mal. A Ressurreição é o selo definitivo. A salvação aplicada a cada pessoa é a justificação (dom gratuito recebido pela fé, sacramentos e vida em graça) que floresce em santificação. Deus quer que todos se salvem (1Tm 2,4), sem forçar a liberdade humana. Cristo é o único Nome pelo qual podemos ser salvos (At 4,12).',
  practical_application = 'Contemplar o Crucifixo — não como imagem trágica, mas como vitória do Amor. Meditar semanalmente a Paixão (Via Sacra). Viver com gratidão: fui resgatado a um preço altíssimo (1Cor 6,20).',
  bible_verses = ARRAY['Is 53,4-6','Rm 3,23-25','Rm 5,6-11','2Cor 5,18-21','1Pd 1,18-19'],
  catechism_references = ARRAY['456','599','613','617','1992'],
  magisterium_references = ARRAY['Dominus Iesus','Redemptoris Missio','Concílio de Trento — Justificação'],
  saints_refs = ARRAY['anselmo-de-cantuaria','paulo-da-cruz','faustina-kowalska'],
  fathers_refs = ARRAY['ireneu-de-lion','atanasio','agostinho-de-hipona'],
  prayer_refs = ARRAY['via-sacra','coroa-da-divina-misericordia','stabat-mater'],
  journey_refs = ARRAY['d1d1d1d1-0005-4000-8000-000000000001'::uuid],
  status = 'published', published_at = now()
WHERE slug = 'soteriologia';

-- TRANSUBSTANCIAÇÃO
UPDATE public.glossary SET
  definition = 'Transubstanciação é a conversão de toda a substância do pão no Corpo de Cristo, e de toda a substância do vinho no seu Sangue, permanecendo apenas as espécies (aparências) do pão e do vinho (Concílio de Trento, Sessão XIII).',
  interpretation = 'Termo cunhado pelo Magistério para expressar com rigor filosófico o mistério afirmado por Cristo — "Isto é o meu Corpo" (Mt 26,26). Não é mera presença simbólica nem coexistência (consubstanciação): é conversão real, substancial, plena. Enquanto os sentidos percebem pão, a substância é Cristo inteiro — Corpo, Sangue, Alma e Divindade. Este mistério exige a fé: "Não vejo, não toco, não sinto, / mas em Vós, ó Verbo, creio" (Adoro te devote). É o coração da fé eucarística católica.',
  practical_application = 'Adorar a Eucaristia com fé firme, mesmo sem sentir. Ao passar diante de uma igreja, saudar interiormente o Senhor sacramentado. Fazer visitas ao Santíssimo. Cultivar reverência: genuflexão, silêncio, postura.',
  bible_verses = ARRAY['Mt 26,26-28','Jo 6,51-58','1Cor 11,27-29'],
  catechism_references = ARRAY['1373','1374','1376','1377','1378'],
  magisterium_references = ARRAY['Concílio de Trento — Sessão XIII, cân. 2','Mysterium Fidei','Ecclesia de Eucharistia 15'],
  saints_refs = ARRAY['tomas-de-aquino','pedro-julio-eymard','carlos-acutis'],
  fathers_refs = ARRAY['ambrosio-de-milao','joao-crisostomo'],
  prayer_refs = ARRAY['adoro-te-devote','tantum-ergo','panis-angelicus'],
  journey_refs = ARRAY['9f444a3e-9838-48b8-ae77-0b5a6829d4fa'::uuid],
  status = 'published', published_at = now()
WHERE slug = 'transubstanciacao';

-- TRINDADE
UPDATE public.glossary SET
  definition = 'A Santíssima Trindade é o mistério central da fé e da vida cristã: um só Deus em três Pessoas — Pai, Filho e Espírito Santo — distintas realmente entre si, iguais na natureza divina, consubstanciais, coeternas e onipotentes (CIC 253-256).',
  interpretation = 'Não é contradição racional, mas verdade que transcende a razão, revelada por Cristo. Não há três Deuses; há uma só essência divina possuída plenamente por três Pessoas realmente distintas pelas relações de origem: o Pai não é gerado, o Filho é eternamente gerado pelo Pai, o Espírito procede do Pai e do Filho. Toda a economia da salvação é obra trinitária: criação, redenção e santificação. O sinal da cruz, feito com fé, é confissão trinitária. O céu será contemplação eterna da Trindade.',
  practical_application = 'Fazer o sinal da cruz com fé — não por hábito. Rezar diariamente o Glória. Meditar que a alma em graça é habitação da Trindade (Jo 14,23) — "Deus mora em mim."',
  bible_verses = ARRAY['Mt 28,19','Jo 14,23','Jo 16,13-15','2Cor 13,13','1Jo 5,7'],
  catechism_references = ARRAY['232','253','255','258','261'],
  magisterium_references = ARRAY['Symbolum Nicaeno-Constantinopolitanum','Concílio IV de Latrão','De Trinitate (Santo Agostinho)'],
  saints_refs = ARRAY['agostinho-de-hipona','tomas-de-aquino','isabel-da-trindade'],
  fathers_refs = ARRAY['atanasio','basilio-magno','gregorio-de-nazianzo','agostinho-de-hipona'],
  prayer_refs = ARRAY['gloria-ao-pai','credo-niceno-constantinopolitano','oracao-da-beata-isabel-da-trindade'],
  journey_refs = ARRAY['a1b2c3d4-0003-4000-8000-000000000003'::uuid],
  status = 'published', published_at = now()
WHERE slug = 'trindade';
