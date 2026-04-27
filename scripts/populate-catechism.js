import { createClient } from '@supabase/supabase-client';

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

const paragraphs = [
  {
    paragraph: 1,
    content: "Deus, infinitamente perfeito e bem-aventurado em Si mesmo, num desígnio de pura bondade, criou livremente o homem para o tornar participante da sua vida bem-aventurada. Por isso, sempre e em toda a parte, Ele está próximo do homem. Chama-o e ajuda-o a procurá-Lo, a conhecê-Lo e a amá-Lo com todas as suas forças. Convoca todos os homens, dispersos pelo pecado, para a unidade da sua família que é a Igreja. Para tal, enviou o seu Filho como Redentor e Salvador na plenitude dos tempos. N'Ele e por Ele, chama os homens a tornarem-se, no Espírito Santo, seus filhos adoptivos e, portanto, herdeiros da sua vida bem-aventurada."
  },
  {
    paragraph: 2,
    content: "Para que este convite se fizesse ouvir por toda a Terra, Cristo enviou os Apóstolos que escolhera, dando-lhes o mandato de anunciar o Evangelho: «Ide, pois, fazei discípulos de todas as nações, baptizando-os em nome do Pai e do Filho e do Espírito Santo, ensinando-os a cumprirem tudo quanto vos prescrevi. E eis que Eu estou convosco todos os dias até ao fim do mundo» (Mt 28, 19-20). Fortalecidos por esta missão, os Apóstolos «partiram a pregar por toda a parte e o Senhor cooperava com eles confirmando a Palavra com os sinais que a acompanhavam» (Mc 16, 20)."
  },
  {
    paragraph: 3,
    content: "Aqueles que, com a ajuda de Deus, aceitaram o convite de Cristo e livremente Lhe responderam, foram por sua vez impelidos, pelo amor do mesmo Cristo, a anunciar por toda a parte a Boa-Nova. Este tesouro, recebido dos Apóstolos, foi fielmente guardado pelos seus sucessores. Todos os fiéis de Cristo são chamados a transmiti-lo de geração em geração, anunciando a fé, vivendo-a em partilha fraterna e celebrando-a na liturgia e na oração."
  },
  {
    paragraph: 4,
    content: "Bem cedo se chamou catequese ao conjunto de esforços empreendidos na Igreja para fazer discípulos, para ajudar os homens a acreditar que Jesus é o Filho de Deus, a fim de, pela fé, terem a vida em seu nome, e para os educar e instruir nessa vida, construindo assim o Corpo de Cristo."
  },
  {
    paragraph: 5,
    content: "«A catequese é uma educação da fé das crianças, dos jovens e dos adultos, que compreende especialmente o ensino da doutrina cristã, ministrado em geral dum modo orgânico e sistemático, em ordem à iniciação na plenitude da vida cristã»."
  },
  {
    paragraph: 6,
    content: "Sem se confundir com eles, a catequese articula-se com um certo número de elementos da missão pastoral da Igreja que têm um aspecto catequético, preparam para a catequese ou dela derivam: o primeiro anúncio do Evangelho ou pregação missionária, para suscitar a fé; a busca das razões de acreditar; a experiência da vida cristã; a celebração dos sacramentos; a integração na comunidade eclesial; o testemunho apostólico e missionário."
  },
  {
    paragraph: 7,
    content: "«A catequese está intimamente ligada a toda a vida da Igreja. Dependem essencialmente dela não só a expansão geográfica e o crescimento numérico, mas também, e muito mais ainda, o crescimento interior da Igreja e a sua conformidade com o desígnio de Deus»."
  },
  {
    paragraph: 8,
    content: "Os períodos de renovação da Igreja são também tempos fortes de catequese. Assim, na grande época dos Padres da Igreja, vemos santos bispos consagrarem parte importante do seu ministério à catequese, como por exemplo São Cirilo de Jerusalém, São João Crisóstomo, Santo Ambrósio, Santo Agostinho e tantos outros Padres, cujas obras catequéticas continuam a ser modelo."
  },
  {
    paragraph: 9,
    content: "O ministério da catequese vai buscar energias sempre novas aos concílios. O Concílio de Trento constitui, a este respeito, um exemplo a sublinhar: nas suas constituições e decretos, deu prioridade à catequese; está na origem do Catecismo Romano que tem o seu nome e que constitui um trabalho de primeira ordem como compêndio da doutrina cristã; fez nascer na Igreja uma organização notável da catequese; e, graças a santos bispos e teólogos, como São Pedro Canísio, São Carlos Borromeo, São Toríbio de Mogrovejo e São Roberto Belarmino, levou à publicação de numerosos catecismos."
  },
  {
    paragraph: 10,
    content: "Não admira, pois, que, na sequência do II Concílio do Vaticano (que o Papa Paulo VI considerava como o grande catecismo dos tempos modernos), a catequese da Igreja tenha de novo chamado a atenção. O Directório catequético geral, de 1971; as sessões do Sínodo dos Bispos consagradas à evangelização (1974) e à catequese (1977): e as exortações apostólicas correspondentes — Evangelii nuntiandi(1975) e Catechesi tradendae(1979) — são disso bom testemunho. A assembleia extraordinária do Sínodo dos Bispos de 1985 pediu: «que seja redigido um catecismo ou compêndio de toda a doutrina católica, tanto no tocante à fé como no que respeita à moral». O Santo Padre João Paulo II fez seu este voto do Sínodo dos Bispos. Reconheceu que «tal desejo corresponde inteiramente a uma verdadeira necessidade da Igreja universal e das Igrejas particulares». E pôs todo o seu empenho cm que se concretizasse este desejo dos Padres sinodais."
  },
  {
    paragraph: 422,
    content: "«Quando chegou a plenitude dos tempos, Deus enviou o seu Filho, nascido de uma mulher e sujeito à Lei, para resgatar os que estavam sujeitos à Lei e nos tornar seus filhos adoptivos» (Gl 4, 4-5). Esta é a «Boa-Nova de Jesus Cristo, Filho de Deus»: Deus visitou o seu povo e cumpriu as promessas feitas a Abraão e à sua descendência fê-lo para além de toda a expectativa: enviou o seu «Filho muito-amado»."
  },
  {
    paragraph: 423,
    content: "Nós cremos e confessamos que Jesus de Nazaré, judeu nascido duma filha de Israel, em Belém, no tempo do rei Herodes o Grande e do imperador César Augusto, carpinteiro de profissão, morto crucificado em Jerusalém sob o procurador Pôncio Pilatos no reinado do imperador Tibério, é o Filho eterno de Deus feito homem; que Ele «saiu de Deus» (Jo 13, 3), «desceu do céu» (Jo 3,13; 6, 33) e «veio na carne», porque «o Verbo fez-Se carne e habitou entre nós. Nós vimos a sua glória, glória que Lhe vem do Pai como Filho Unigénito, cheio de graça e de verdade [...] Na verdade, foi da sua plenitude que todos nós recebemos, graça sobre graça» ( Jo 1, 14, 16)."
  },
  {
    paragraph: 424,
    content: "Movidos pela graça do Espírito Santo e atraídos pelo Pai, nós cremos e confessamos a respeito de Jesus: «Tu és o Cristo, o Filho de Deus vivo» (Mt 16, 16). Foi sobre o rochedo desta fé, confessada por Pedro, que Cristo edificou a sua Igreja."
  }
];

async function run() {
  for (const p of paragraphs) {
    console.log(`Inserting paragraph ${p.paragraph}...`);
    const { error } = await supabase
      .from('catechism_official')
      .upsert(p, { onConflict: 'paragraph' });
    if (error) console.error(`Error inserting ${p.paragraph}:`, error);
  }
  console.log('Done!');
}

run();
