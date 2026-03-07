import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version',
};

// Map book abbreviations to bolls.life book IDs
// Standard 66 books mapping
const BOOK_ID_MAP: Record<string, number> = {
  'gn': 1, 'ex': 2, 'lv': 3, 'nm': 4, 'dt': 5,
  'js': 6, 'jz': 7, 'rt': 8, '1sm': 9, '2sm': 10,
  '1rs': 11, '2rs': 12, '1cr': 13, '2cr': 14,
  'esd': 15, 'ne': 16, 'est': 17, 'jó': 18, 'sl': 19,
  'pr': 20, 'ecl': 21, 'ct': 22, 'is': 23, 'jr': 24,
  'lm': 25, 'ez': 26, 'dn': 27, 'os': 28, 'jl': 29,
  'am': 30, 'ab': 31, 'jn': 32, 'mq': 33, 'na': 34,
  'hab': 35, 'sf': 36, 'ag': 37, 'zc': 38, 'ml': 39,
  'mt': 40, 'mc': 41, 'lc': 42, 'jo': 43, 'at': 44,
  'rm': 45, '1cor': 46, '2cor': 47, 'gl': 48, 'ef': 49,
  'fl': 50, 'cl': 51, '1ts': 52, '2ts': 53,
  '1tm': 54, '2tm': 55, 'tt': 56, 'fm': 57, 'hb': 58,
  'tg': 59, '1pd': 60, '2pd': 61, '1jo': 62, '2jo': 63,
  '3jo': 64, 'jd': 65, 'ap': 66,
};

// Deuterocanonical books - these need special handling
// bolls.life doesn't include them in standard translations
// We'll use embedded content for key chapters
const DEUTEROCANONICAL_BOOKS = ['tb', 'jt', '1mc', '2mc', 'sb', 'eclo', 'br'];

const DEUTEROCANONICAL_CONTENT: Record<string, Record<number, {number: number; text: string}[]>> = {
  'tb': {
    1: [
      { number: 1, text: "Livro da história de Tobit, filho de Tobiel, filho de Ananiel, filho de Aduel, filho de Gabael, da descendência de Asiel, da tribo de Neftali." },
      { number: 2, text: "Ele foi deportado no tempo de Salmanasar, rei dos assírios, de Tisbe, que fica ao sul de Cedes de Neftali, na alta Galileia, acima de Asser, atrás do caminho que leva ao ocidente, à esquerda de Fogor." },
      { number: 3, text: "Eu, Tobit, andei nos caminhos da verdade e da justiça todos os dias da minha vida, e fiz muitas esmolas aos meus irmãos e compatriotas, deportados comigo para Nínive, na terra dos assírios." },
      { number: 4, text: "Quando eu ainda era jovem, na minha terra, na terra de Israel, toda a tribo de Neftali, meu pai, se separou da casa de Davi e de Jerusalém." },
      { number: 5, text: "Esta cidade fora escolhida entre todas as tribos de Israel para que todas elas aí oferecessem sacrifícios. O templo, morada de Deus, nela fora construído e consagrado para todas as gerações futuras." },
    ],
  },
  'sb': {
    1: [
      { number: 1, text: "Amai a justiça, vós que governais a terra. Pensai no Senhor com bondade e procurai-o com simplicidade de coração." },
      { number: 2, text: "Porque ele se deixa encontrar pelos que não o tentam e se manifesta aos que não desconfiam dele." },
      { number: 3, text: "Os pensamentos perversos afastam de Deus, e a onipotência, posta à prova, confunde os insensatos." },
      { number: 4, text: "Porque a sabedoria não entra numa alma que faz o mal, nem habita num corpo submetido ao pecado." },
      { number: 5, text: "Pois o espírito santo que nos educa foge da duplicidade, afasta-se dos pensamentos insensatos e retira-se quando a injustiça se aproxima." },
      { number: 6, text: "A sabedoria é um espírito amigo dos homens, mas não deixa impune quem blasfema, porque Deus é testemunha dos seus sentimentos, observa sem errar o seu coração e ouve o que diz a sua língua." },
      { number: 7, text: "Pois o Espírito do Senhor enche o universo e, como sustém todas as coisas, tem conhecimento de toda palavra." },
      { number: 8, text: "Portanto, quem diz coisas injustas não pode ficar oculto, e a justiça vingadora não o deixará escapar." },
      { number: 9, text: "Com efeito, os desígnios do ímpio serão examinados e as suas palavras chegarão até o Senhor, para convencê-lo das suas iniquidades." },
      { number: 10, text: "Pois o ouvido vigilante tudo ouve e o murmúrio dos que falam baixo não fica ignorado." },
      { number: 11, text: "Guardai-vos, pois, da murmuração inútil e preservai a vossa língua da maledicência, porque a palavra mais secreta não ficará sem efeito, e a boca mentirosa mata a alma." },
      { number: 12, text: "Não vos apresseis em buscar a morte com os desvios da vossa vida, nem procureis a ruína com as obras das vossas mãos." },
      { number: 13, text: "Porque Deus não fez a morte, nem se alegra com a ruína dos vivos." },
      { number: 14, text: "Pois ele criou todas as coisas para que subsistam; as criaturas do mundo são salutares, nelas não há veneno de morte, e o império da morte não reina sobre a terra." },
      { number: 15, text: "Porque a justiça é imortal." },
      { number: 16, text: "Mas os ímpios chamaram-na com gestos e palavras; tomando-a por amiga, consumiram-se e fizeram com ela aliança, porque são dignos de lhe pertencer." },
    ],
  },
  'eclo': {
    1: [
      { number: 1, text: "Toda sabedoria vem do Senhor e com ele permanece para sempre." },
      { number: 2, text: "A areia do mar, as gotas da chuva e os dias da eternidade, quem os pode contar?" },
      { number: 3, text: "A altura do céu, a extensão da terra, a profundidade do abismo, quem as pode explorar?" },
      { number: 4, text: "Antes de todas as coisas foi criada a sabedoria; a inteligência prudente existe desde a eternidade." },
      { number: 5, text: "A fonte da sabedoria é a palavra de Deus nas alturas, e os seus caminhos são os mandamentos eternos." },
      { number: 6, text: "A raiz da sabedoria, a quem foi revelada? As suas riquezas, quem as conhece?" },
      { number: 7, text: "A ciência da sabedoria, a quem foi manifestada? E a experiência dos seus caminhos, quem a compreendeu?" },
      { number: 8, text: "Só um é sábio, terrivelmente temível, sentado no seu trono." },
      { number: 9, text: "O Senhor a criou; viu-a e a contou, derramou-a sobre todas as suas obras." },
      { number: 10, text: "Ela está com todos os seres humanos, segundo a sua generosidade, e ele a dispensou aos que o amam." },
    ],
  },
  'br': {
    1: [
      { number: 1, text: "Este é o livro dos mandamentos de Deus e da lei que subsiste para sempre. Todos os que a praticam terão a vida; mas os que a abandonam morrerão." },
      { number: 2, text: "Volta, Jacó, e abraça-a; caminha para o esplendor, à luz que dela dimana." },
      { number: 3, text: "Não entregues a outro a tua glória, nem os teus privilégios a um povo estrangeiro." },
      { number: 4, text: "Felizes somos, ó Israel, porque nos foi dado conhecer o que agrada a Deus." },
    ],
  },
  'jt': {
    1: [
      { number: 1, text: "Era o décimo segundo ano do reinado de Nabucodonosor, que reinou sobre os assírios em Nínive, a grande cidade. Naqueles dias, Arfaxad reinava sobre os medos em Ecbátana." },
      { number: 2, text: "Ele construiu ao redor de Ecbátana muralhas de pedras talhadas, com três côvados de largura e seis de comprimento. Ergueu a muralha a setenta côvados de altura e cinquenta de largura." },
      { number: 3, text: "Às portas da cidade, levantou torres de cem côvados, com sessenta côvados de largura na base." },
      { number: 4, text: "As portas, que ergueu a setenta côvados de altura, tinham quarenta côvados de largura para a saída de um exército poderoso e a formação da infantaria." },
    ],
  },
  '1mc': {
    1: [
      { number: 1, text: "Aconteceu que Alexandre, filho de Filipe, macedônio, vindo da terra dos Cetim, derrotou Dario, rei dos persas e dos medos, e reinou em seu lugar, sendo o primeiro a reinar sobre a Grécia." },
      { number: 2, text: "Empreendeu muitas guerras, apoderou-se de muitas fortalezas e matou reis da terra." },
      { number: 3, text: "Avançou até os confins da terra e apoderou-se dos despojos de muitos povos. E a terra se calou diante dele." },
      { number: 4, text: "Reuniu um exército muito poderoso e dominou regiões, povos e príncipes, que se tornaram seus tributários." },
      { number: 5, text: "Depois disto caiu de cama e, sentindo que ia morrer," },
      { number: 6, text: "chamou os mais ilustres dos seus oficiais, que tinham sido educados com ele desde a juventude, e repartiu entre eles o seu reino, enquanto ainda vivia." },
    ],
  },
  '2mc': {
    1: [
      { number: 1, text: "Aos irmãos judeus do Egito, saudações! Os irmãos judeus de Jerusalém e da terra da Judeia desejam-vos paz e prosperidade." },
      { number: 2, text: "Que Deus vos cumule de benefícios e se lembre da aliança que fez com Abraão, Isaac e Jacó, seus servos fiéis." },
      { number: 3, text: "Que ele vos dê a todos um coração capaz de o adorar e cumprir a sua vontade, com grande ânimo e generosidade." },
      { number: 4, text: "Que ele vos abra o coração à sua lei e aos seus preceitos, e vos conceda a paz." },
      { number: 5, text: "Que ele ouça as vossas preces e se reconcilie convosco, e não vos abandone no tempo da adversidade." },
    ],
  },
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { abbrev, chapter, version = 'NVIPT' } = await req.json();
    
    const normalizedAbbrev = abbrev.toLowerCase();
    
    // Check if it's a deuterocanonical book
    if (DEUTEROCANONICAL_BOOKS.includes(normalizedAbbrev)) {
      const bookContent = DEUTEROCANONICAL_CONTENT[normalizedAbbrev];
      const chapterContent = bookContent?.[chapter];
      
      if (chapterContent) {
        return new Response(JSON.stringify({
          book: abbrev,
          chapter: chapter,
          verses: chapterContent,
        }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }
      
      return new Response(JSON.stringify({
        book: abbrev,
        chapter: chapter,
        verses: [{ number: 1, text: `Capítulo ${chapter} — conteúdo dos livros deuterocanônicos em expansão. Consulte a edição oficial da Bíblia CNBB.` }],
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }
    
    // Standard books - use bolls.life API
    const bookId = BOOK_ID_MAP[normalizedAbbrev];
    
    if (!bookId) {
      return new Response(JSON.stringify({ 
        error: `Livro não encontrado: ${abbrev}`,
        verses: [] 
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }
    
    // Use bolls.life API - free, no auth needed
    const url = `https://bolls.life/get-text/${version}/${bookId}/${chapter}/`;
    console.log('Fetching:', url);
    
    const response = await fetch(url);
    
    if (!response.ok) {
      const errorText = await response.text();
      console.error(`API error [${response.status}]:`, errorText);
      return new Response(JSON.stringify({ 
        error: `Texto não disponível (${response.status})`,
        verses: [] 
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }
    
    const data = await response.json();
    
    if (!Array.isArray(data) || data.length === 0) {
      return new Response(JSON.stringify({ 
        error: 'Capítulo não encontrado',
        verses: [] 
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }
    
    return new Response(JSON.stringify({
      book: abbrev,
      chapter: chapter,
      verses: data.map((v: any) => ({
        number: v.verse,
        text: v.text,
      })),
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('Bible text error:', error);
    return new Response(JSON.stringify({ 
      error: error.message,
      verses: [] 
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
