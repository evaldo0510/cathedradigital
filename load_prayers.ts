import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.VITE_SUPABASE_URL!;
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY!;
const supabase = createClient(supabaseUrl, supabaseKey);

const prayers = [
  {
    slug: 'pai-nosso',
    title: 'Pai Nosso',
    subtitle: 'A Oração do Senhor',
    kicker: 'Oração Dominical',
    category: 'fundamentais',
    content: 'Pai nosso que estais nos céus, santificado seja o vosso nome, venha a nós o vosso reino, seja feita a vossa vontade assim na terra como no céu. O pão nosso de cada dia nos dai hoje, perdoai-nos as nossas ofensas assim como nós perdoamos a quem nos tem ofendido, e não nos deixeis cair em tentação, mas livrai-nos do mal. Amém.',
    estimated_seconds: 30,
    order_index: 1,
    is_published: true,
    content_status: 'complete',
    engine_version: 1
  },
  {
    slug: 'ave-maria',
    title: 'Ave Maria',
    subtitle: 'Saudação Angélica',
    kicker: 'Oração Mariana',
    category: 'fundamentais',
    content: 'Ave Maria, cheia de graça, o Senhor é convosco, bendita sois vós entre as mulheres e bendito é o fruto do vosso ventre, Jesus. Santa Maria, Mãe de Deus, rogai por nós pecadores, agora e na hora de nossa morte. Amém.',
    estimated_seconds: 20,
    order_index: 2,
    is_published: true,
    content_status: 'complete',
    engine_version: 1
  },
  {
    slug: 'gloria-ao-pai',
    title: 'Glória ao Pai',
    subtitle: 'Doxologia Menor',
    kicker: 'Louvor à Trindade',
    category: 'fundamentais',
    content: 'Glória ao Pai, e ao Filho, e ao Espírito Santo. Como era no princípio, agora e sempre. Amém.',
    estimated_seconds: 10,
    order_index: 3,
    is_published: true,
    content_status: 'complete',
    engine_version: 1
  },
  {
    slug: 'salve-rainha',
    title: 'Salve Rainha',
    subtitle: 'Antífona Mariana',
    kicker: 'Esperança nossa',
    category: 'marianas',
    content: 'Salve Rainha, Mãe de Misericórdia, vida, doçura, esperança nossa, salve! A vós bradamos, os degredados filhos de Eva. A vós suspiramos, gemendo e chorando neste vale de lágrimas. Eia, pois, advogada nossa, esses vossos olhos misericordiosos a nós volvei. E, depois deste desterro, mostrai-nos Jesus, bendito fruto do vosso ventre. Ó clemente, ó piedosa, ó doce sempre Virgem Maria. Rogai por nós, Santa Mãe de Deus, para que sejamos dignos das promessas de Cristo. Amém.',
    estimated_seconds: 60,
    order_index: 4,
    is_published: true,
    content_status: 'complete',
    engine_version: 1
  }
];

async function load() {
  console.log('Iniciando carga de orações...');
  for (const prayer of prayers) {
    const { data, error } = await supabase
      .from('prayers')
      .upsert(prayer, { onConflict: 'slug' })
      .select();
    
    if (error) {
      console.error(`Erro ao carregar ${prayer.slug}:`, error.message);
    } else {
      console.log(`Sucesso: ${prayer.slug}`);
    }
  }
}

load();
