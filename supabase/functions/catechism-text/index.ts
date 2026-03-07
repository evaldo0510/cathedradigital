import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version',
};

// Map paragraph numbers to Vatican.va URL pages
// The Vatican website organizes paragraphs by sections
function getVaticanUrl(paragraph: number): string {
  // Part 1: A Profissão de Fé (§1-1065)
  if (paragraph <= 25) return 'prologue_1-25_po.html';
  if (paragraph <= 49) return 'p1s1c1_26-49_po.html';
  if (paragraph <= 73) return 'p1s1c2_50-73_po.html';
  if (paragraph <= 100) return 'p1s1c2_74-100_po.html';
  if (paragraph <= 141) return 'p1s1c3_101-141_po.html';
  if (paragraph <= 175) return 'p1s1c3_142-175_po.html';
  if (paragraph <= 184) return 'p1s1c3_176-184_po.html';
  if (paragraph <= 197) return 'p1s2c1_185-197_po.html';
  if (paragraph <= 231) return 'p1s2c1_198-231_po.html';
  if (paragraph <= 267) return 'p1s2c1_232-267_po.html';
  if (paragraph <= 324) return 'p1s2c1_268-324_po.html';
  if (paragraph <= 354) return 'p1s2c1_325-354_po.html';
  if (paragraph <= 384) return 'p1s2c1_355-384_po.html';
  if (paragraph <= 421) return 'p1s2c1_385-421_po.html';
  if (paragraph <= 483) return 'p1s2c2_422-483_po.html';
  if (paragraph <= 511) return 'p1s2c2_484-511_po.html';
  if (paragraph <= 570) return 'p1s2c2_512-570_po.html';
  if (paragraph <= 623) return 'p1s2c2_571-623_po.html';
  if (paragraph <= 658) return 'p1s2c2_624-658_po.html';
  if (paragraph <= 682) return 'p1s2c2_659-682_po.html';
  if (paragraph <= 747) return 'p1s2c3_683-747_po.html';
  if (paragraph <= 810) return 'p1s2c3_748-810_po.html';
  if (paragraph <= 870) return 'p1s2c3_811-870_po.html';
  if (paragraph <= 945) return 'p1s2c3_871-945_po.html';
  if (paragraph <= 975) return 'p1s2c3_946-975_po.html';
  if (paragraph <= 1019) return 'p1s2c3_976-1019_po.html';
  if (paragraph <= 1065) return 'p1s2c3_1020-1065_po.html';
  // Part 2
  if (paragraph <= 1112) return 'p2s1c1_1066-1112_po.html';
  if (paragraph <= 1134) return 'p2s1c1_1113-1134_po.html';
  if (paragraph <= 1209) return 'p2s1c2_1135-1209_po.html';
  if (paragraph <= 1274) return 'p2s2c1_1210-1274_po.html';
  if (paragraph <= 1321) return 'p2s2c1_1275-1321_po.html';
  if (paragraph <= 1419) return 'p2s2c1_1322-1419_po.html';
  if (paragraph <= 1498) return 'p2s2c1_1420-1498_po.html';
  if (paragraph <= 1532) return 'p2s2c1_1499-1532_po.html';
  if (paragraph <= 1600) return 'p2s2c2_1533-1600_po.html';
  if (paragraph <= 1666) return 'p2s2c2_1601-1666_po.html';
  if (paragraph <= 1690) return 'p2s2c2_1667-1690_po.html';
  // Part 3
  if (paragraph <= 1761) return 'p3s1c1_1691-1761_po.html';
  if (paragraph <= 1802) return 'p3s1c1_1762-1802_po.html';
  if (paragraph <= 1876) return 'p3s1c1_1803-1876_po.html';
  if (paragraph <= 1948) return 'p3s1c1_1877-1948_po.html';
  if (paragraph <= 1986) return 'p3s1c2_1949-1986_po.html';
  if (paragraph <= 2051) return 'p3s1c2_1987-2051_po.html';
  if (paragraph <= 2132) return 'p3s2c1_2052-2132_po.html';
  if (paragraph <= 2195) return 'p3s2c1_2133-2195_po.html';
  if (paragraph <= 2257) return 'p3s2c1_2196-2257_po.html';
  if (paragraph <= 2330) return 'p3s2c2_2258-2330_po.html';
  if (paragraph <= 2400) return 'p3s2c2_2331-2400_po.html';
  if (paragraph <= 2463) return 'p3s2c2_2401-2463_po.html';
  if (paragraph <= 2513) return 'p3s2c2_2464-2513_po.html';
  if (paragraph <= 2557) return 'p3s2c2_2514-2557_po.html';
  // Part 4
  if (paragraph <= 2619) return 'p4s1c1_2558-2619_po.html';
  if (paragraph <= 2649) return 'p4s1c1_2620-2649_po.html';
  if (paragraph <= 2696) return 'p4s1c2_2650-2696_po.html';
  if (paragraph <= 2758) return 'p4s1c3_2697-2758_po.html';
  if (paragraph <= 2802) return 'p4s2a1_2759-2802_po.html';
  if (paragraph <= 2865) return 'p4s2a2_2803-2865_po.html';
  return '';
}

// Extract a specific paragraph from the Vatican.va HTML content
function extractParagraph(html: string, paragraph: number): string | null {
  // The Vatican pages use bold numbers like **27.** or patterns with the paragraph number
  // Try to find the paragraph text
  const paraStr = `${paragraph}.`;
  
  // Look for patterns like "**27.**" or just "27." in the text
  const patterns = [
    new RegExp(`\\*\\*${paragraph}\\.\\*\\*\\s*(.+?)(?=\\*\\*\\d+\\.\\*\\*|Resumindo|$)`, 's'),
    new RegExp(`\\b${paragraph}\\.\\s+(.+?)(?=\\b\\d{1,4}\\.\\s|Resumindo|$)`, 's'),
  ];
  
  for (const pattern of patterns) {
    const match = html.match(pattern);
    if (match && match[1]) {
      let text = match[1].trim();
      // Clean up markdown artifacts
      text = text.replace(/\*\*/g, '');
      text = text.replace(/\[.*?\]\(.*?\)/g, '');
      text = text.replace(/!\[.*?\]\(.*?\)/g, '');
      text = text.replace(/\|.*?\|/g, '');
      text = text.replace(/\n{3,}/g, '\n\n');
      text = text.replace(/>\s*/g, '');
      text = text.trim();
      // Limit length
      if (text.length > 50) {
        return text.substring(0, 3000);
      }
    }
  }
  
  return null;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { paragraph } = await req.json();
    
    if (!paragraph || paragraph < 1 || paragraph > 2865) {
      return new Response(JSON.stringify({ error: 'Parágrafo inválido', content: '' }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const urlPath = getVaticanUrl(paragraph);
    
    if (urlPath) {
      try {
        const vaticanUrl = `https://www.vatican.va/archive/cathechism_po/index_new/${urlPath}`;
        console.log('Fetching from Vatican:', vaticanUrl);
        
        const resp = await fetch(vaticanUrl, {
          headers: {
            'Accept': 'text/html,application/xhtml+xml',
            'User-Agent': 'CathedraApp/1.0'
          }
        });
        
        if (resp.ok) {
          const html = await resp.text();
          
          // Parse the HTML to find the specific paragraph
          // Vatican HTML uses patterns like: <b>27.</b> followed by paragraph text
          const paraPattern = new RegExp(
            `<b>${paragraph}[.\\s]*</b>([\\s\\S]*?)(?=<b>\\d{1,4}[.\\s]*</b>|<hr|Resumindo|<\\/td>)`,
            'i'
          );
          
          let match = html.match(paraPattern);
          let content = '';
          
          if (match && match[1]) {
            content = match[1]
              .replace(/<br\s*\/?>/gi, '\n')
              .replace(/<blockquote[^>]*>/gi, '\n')
              .replace(/<\/blockquote>/gi, '\n')
              .replace(/<i>/gi, '').replace(/<\/i>/gi, '')
              .replace(/<b>/gi, '').replace(/<\/b>/gi, '')
              .replace(/<a[^>]*>/gi, '').replace(/<\/a>/gi, '')
              .replace(/<sup[^>]*>.*?<\/sup>/gi, '')
              .replace(/<[^>]+>/g, '')
              .replace(/&nbsp;/g, ' ')
              .replace(/&laquo;/g, '«')
              .replace(/&raquo;/g, '»')
              .replace(/&quot;/g, '"')
              .replace(/&amp;/g, '&')
              .replace(/&#(\d+);/g, (_, code) => String.fromCharCode(parseInt(code)))
              .replace(/\n{3,}/g, '\n\n')
              .trim();
          }
          
          // Also try a simpler pattern
          if (!content || content.length < 30) {
            const simplePattern = new RegExp(
              `${paragraph}\\.\\s*([\\s\\S]*?)(?=\\d{1,4}\\.\\s|Resumindo|$)`,
              ''
            );
            const simpleMatch = html.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').match(simplePattern);
            if (simpleMatch && simpleMatch[1] && simpleMatch[1].trim().length > 30) {
              content = simpleMatch[1].trim().substring(0, 3000);
            }
          }
          
          if (content && content.length > 30) {
            return new Response(JSON.stringify({
              paragraph,
              content,
            }), {
              headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            });
          }
        }
      } catch (fetchError) {
        console.error('Vatican fetch error:', fetchError);
      }
    }

    // Comprehensive fallback with key paragraphs embedded
    const KEY_PARAGRAPHS: Record<number, string> = {
      1: 'Deus, infinitamente perfeito e bem-aventurado em si mesmo, num desígnio de pura bondade, criou livremente o homem para o tornar participante da sua vida bem-aventurada. É por isso que, em todo o tempo e em todo o lugar, Ele está perto do homem. Chama-o e ajuda-o a procurá-Lo, a conhecê-Lo e a amá-Lo com todas as suas forças. Convoca todos os homens, dispersos pelo pecado, para a unidade da sua família, a Igreja. Para isso, enviou o seu Filho como Redentor e Salvador, quando chegou a plenitude dos tempos. N\'Ele e por Ele, chama os homens a tornarem-se, no Espírito Santo, seus filhos adotivos e, portanto, herdeiros da sua vida bem-aventurada.',
      2: 'Para que este apelo ressoasse por toda a terra, Cristo enviou os Apóstolos que tinha escolhido, dando-lhes o mandato de anunciar o Evangelho: «Ide, pois, fazei discípulos de todos os povos, batizando-os em nome do Pai, do Filho e do Espírito Santo, ensinando-os a cumprir tudo quanto vos tenho mandado. E sabei que Eu estarei sempre convosco até ao fim dos tempos» (Mt 28,19-20). Fortalecidos com esta missão, os Apóstolos «saíram a pregar por toda a parte, e o Senhor cooperava com eles, confirmando a Palavra com os sinais que a acompanhavam» (Mc 16,20).',
      3: 'Os que, com a ajuda de Deus, acolheram o chamamento de Cristo e lhe responderam livremente foram, por sua vez, levados pelo amor de Cristo a anunciar por toda a parte a Boa-Nova. Este tesouro, recebido dos Apóstolos, foi fielmente guardado pelos seus sucessores. Todos os fiéis de Cristo são chamados a transmiti-lo de geração em geração, anunciando a fé, vivendo-a na comunhão fraterna e celebrando-a na liturgia e na oração.',
      27: 'O desejo de Deus é um sentimento inscrito no coração do homem, porque o homem foi criado por Deus e para Deus. Deus não cessa de atrair o homem para Si e só em Deus é que o homem encontra a verdade e a felicidade que procura sem descanso. A razão mais sublime da dignidade humana consiste na sua vocação à comunhão com Deus.',
      185: 'Quem diz «Creio» diz «Eu adiro àquilo que nós cremos». A comunhão na fé precisa duma linguagem comum da fé, normativa para todos e que una na mesma confissão de fé.',
      199: 'O Símbolo dos Apóstolos, chamado assim porque é considerado, com razão, como o resumo fiel da fé dos Apóstolos. É o antigo símbolo batismal da Igreja de Roma. A sua grande autoridade advém deste facto: «É o Símbolo guardado pela Igreja romana, aquela onde Pedro, o primeiro dos Apóstolos, teve a sua cátedra e para onde levou a sentença comum».',
      232: 'Os cristãos são batizados «em nome do Pai e do Filho e do Espírito Santo» (Mt 28,19). Antes disso, respondem «Creio» à tríplice pergunta que os convida a confessar a sua fé no Pai, no Filho e no Espírito Santo. A fé de todos os cristãos assenta sobre a Trindade.',
      422: '«Quando chegou a plenitude dos tempos, Deus enviou o seu Filho, nascido de uma mulher, nascido sujeito à Lei, para resgatar os que estavam sujeitos à Lei, a fim de recebermos a adoção de filhos» (Gl 4,4-5). Esta é «a Boa-Nova de Jesus Cristo, Filho de Deus» (Mc 1,1): Deus visitou o seu povo, cumpriu as promessas feitas a Abraão e à sua descendência; e fê-lo para além de toda a expectativa: enviou o seu «Filho muito amado» (Mc 1,11).',
      460: '«O Verbo fez-Se homem para nos tornar Deus»: «Tal é a razão pela qual o Verbo Se fez homem, e o Filho de Deus Se fez Filho do homem: para que o homem, entrando em comunhão com o Verbo e recebendo assim a filiação divina, se tornasse filho de Deus» (Santo Ireneu). «Pois o Filho de Deus fez-Se homem para nos fazer Deus» (Santo Atanásio). «O Filho Unigénito de Deus, querendo tornar-nos participantes da sua divindade, assumiu a nossa natureza para que, tendo-Se feito homem, fizesse dos homens deuses» (São Tomás de Aquino).',
      683: 'Ninguém pode dizer «Jesus é Senhor» a não ser no Espírito Santo (1 Cor 12,3). «Deus enviou aos nossos corações o Espírito de seu Filho, que clama: Abba, Pai!» (Gl 4,6). Este conhecimento de fé só é possível no Espírito Santo. Para estar em contacto com Cristo é preciso primeiro ter sido tocado pelo Espírito Santo.',
      1066: 'No Símbolo da fé, a Igreja confessa o mistério da Santíssima Trindade e o seu «desígnio benevolente» sobre toda a criação: o Pai realiza o «mistério da sua vontade», dando o seu Filho bem-amado e o seu Espírito Santo, para a salvação do mundo e para a glória do seu nome. É este o mistério de Cristo, revelado e realizado na história segundo um plano, uma «disposição» sabiamente ordenada, a que São Paulo chama «a economia do Mistério» e que a tradição patrística chamará «a economia do Verbo encarnado» ou «a economia da salvação».',
      1210: 'Os sacramentos da Nova Lei foram instituídos por Cristo e são sete, a saber: o Batismo, a Confirmação, a Eucaristia, a Penitência, a Unção dos Enfermos, a Ordem e o Matrimônio. Os sete sacramentos tocam todas as etapas e todos os momentos importantes da vida do cristão: dão nascimento e crescimento, cura e missão à vida de fé dos cristãos.',
      1324: 'A Eucaristia é «fonte e cume de toda a vida cristã». «Os restantes sacramentos, assim como todos os ministérios eclesiásticos e obras de apostolado, estão vinculados à sagrada Eucaristia e a ela se ordenam. Com efeito, a santíssima Eucaristia contém todo o tesouro espiritual da Igreja, isto é, o próprio Cristo, a nossa Páscoa».',
      1325: '"A Eucaristia contém todo o tesouro espiritual da Igreja, isto é, o próprio Cristo, a nossa Páscoa e pão vivo que, pela sua Carne vivificada e vivificante pelo Espírito Santo, dá vida aos homens." É ela que significa e realiza a comunhão de vida com Deus e a unidade do povo de Deus, pelas quais a Igreja existe.',
      1691: 'Cristão, reconhece a tua dignidade. Uma vez que participas agora da natureza divina, não degeneres voltando à decadência da tua vida passada. Lembra-te de qual é a tua Cabeça e de qual é o Corpo de que és membro. Lembra-te de que foste arrancado do poder das trevas e transferido para a luz e o Reino de Deus.',
      2052: '«Mestre, que devo fazer de bom para ter a vida eterna?» Ao jovem que lhe faz esta pergunta, Jesus responde, primeiro, invocando a necessidade de reconhecer Deus como «o único Bom», como o Bem por excelência e como a fonte de todo o bem. Depois declara-lhe: «Se queres entrar na vida, observa os mandamentos».',
      2558: '«Grande é o mistério da fé». A Igreja professa-o no Símbolo dos Apóstolos (parte primeira) e celebra-o na liturgia sacramental (parte segunda), para que a vida dos fiéis se conforme com Cristo no Espírito Santo, para glória de Deus Pai (parte terceira). Este mistério exige, pois, que os fiéis creiam nele, o celebrem e vivam dele numa relação viva e pessoal com o Deus vivo e verdadeiro. Essa relação é a oração.',
      2559: '«A oração é a elevação da alma a Deus ou o pedido a Deus dos bens convenientes». De onde é que nós falamos, quando rezamos? Da altura do nosso orgulho e da nossa vontade própria ou «das profundezas» (Sl 130,1) de um coração humilde e contrito? É aquele que se humilha que será exaltado.',
      2759: 'Um dia, Jesus estava a rezar num certo lugar. Quando acabou, um dos seus discípulos pediu-lhe: «Senhor, ensina-nos a orar» (Lc 11,1). É em resposta a este pedido que o Senhor confia aos seus discípulos e à sua Igreja a oração cristã fundamental.',
    };

    const content = KEY_PARAGRAPHS[paragraph] || 
      `Parágrafo §${paragraph} do Catecismo da Igreja Católica. O conteúdo completo está sendo carregado do repositório oficial da Santa Sé (vatican.va). Se este texto não carregar automaticamente, consulte a edição oficial em vatican.va/archive/cathechism_po.`;

    return new Response(JSON.stringify({
      paragraph,
      content,
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error) {
    return new Response(JSON.stringify({ error: error.message, content: '' }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
