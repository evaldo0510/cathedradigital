import React, { useState } from 'react';
import { Icons } from '../../constants';
import { motion, AnimatePresence } from 'framer-motion';
import guadalupeImg from '@/assets/aparicao-guadalupe.jpg';
import lourdesImg from '@/assets/aparicao-lourdes.jpg';
import fatimaImg from '@/assets/aparicao-fatima.jpg';
import aparecidaImg from '@/assets/aparicao-aparecida.jpg';

interface Apparition {
  id: string;
  title: string;
  location: string;
  country: string;
  year: number;
  date: string;
  seer: string;
  seerStory: string;
  summary: string;
  fullStory: string;
  message: string;
  liturgicalFeast: string;
  approved: boolean;
  image: string;
  color: string;
}

const APPARITIONS: Apparition[] = [
  {
    id: 'guadalupe',
    title: 'Nossa Senhora de Guadalupe',
    location: 'Tepeyac, Cidade do México',
    country: 'México',
    year: 1531,
    date: '9–12 de dezembro de 1531',
    seer: 'São Juan Diego Cuauhtlatoatzin',
    seerStory: 'Juan Diego era um indígena nahua, simples agricultor de 57 anos, recém-convertido ao cristianismo. Nascido em 1474 com o nome de Cuauhtlatoatzin ("águia que fala"), foi batizado por volta de 1524 pelos primeiros missionários franciscanos. Viúvo e humilde, caminhava regularmente até a igreja para receber instrução religiosa. Após as aparições, dedicou o resto de sua vida a cuidar da ermida construída no Tepeyac, onde a imagem milagrosa foi colocada. Foi canonizado pelo Papa João Paulo II em 2002.',
    summary: 'A Virgem apareceu a Juan Diego no monte Tepeyac, deixando sua imagem milagrosamente impressa em sua tilma.',
    fullStory: 'Em dezembro de 1531, a Virgem Maria apareceu ao indígena Juan Diego no monte Tepeyac, próximo à Cidade do México. Ela se apresentou como a "Mãe do verdadeiro Deus" e pediu que fosse construída uma igreja naquele local. O bispo Juan de Zumárraga pediu um sinal como prova. Em 12 de dezembro, a Virgem instruiu Juan Diego a colher rosas de Castela — flores impossíveis naquela estação e naquele terreno — e levá-las ao bispo em sua tilma (manto). Quando Juan Diego abriu a tilma diante do bispo, as rosas caíram e revelou-se a imagem milagrosa de Nossa Senhora impressa no tecido. A tilma, feita de fibra de agave (que normalmente se decompõe em 20 anos), permanece intacta após quase 500 anos. A imagem converteu milhões de indígenas ao cristianismo em poucos anos.',
    message: 'Maria se revela como Mãe de toda a humanidade, unindo os povos pela fé e pela compaixão. Sua mensagem é de consolo: "Não estou eu aqui, que sou tua Mãe?"',
    liturgicalFeast: '12 de dezembro',
    approved: true,
    image: '🌹',
    color: 'from-emerald-500/20 to-emerald-600/5 border-emerald-500/30',
  },
  {
    id: 'lourdes',
    title: 'Nossa Senhora de Lourdes',
    location: 'Gruta de Massabielle, Lourdes',
    country: 'França',
    year: 1858,
    date: '11 de fevereiro a 16 de julho de 1858',
    seer: 'Santa Bernadette Soubirous',
    seerStory: 'Bernadette Soubirous nasceu em 7 de janeiro de 1844 em Lourdes, filha de um moleiro empobrecido. A família vivia na miséria extrema, num antigo calabouço chamado "le cachot". Bernadette era uma menina frágil, asmática, semianalfabeta, que ainda não havia feito a Primeira Comunhão aos 14 anos. Após as 18 aparições, enfrentou interrogatórios severos das autoridades civis e eclesiásticas, mas manteve seu testemunho com firmeza inabalável. Entrou no convento das Irmãs da Caridade de Nevers em 1866, onde viveu em oração e sofrimento. Morreu em 16 de abril de 1879, aos 35 anos, pronunciando: "Santa Maria, Mãe de Deus, rogai por mim, pobre pecadora." Seu corpo permanece incorrupto. Foi canonizada em 1933.',
    summary: 'A Imaculada Conceição apareceu 18 vezes a Bernadette numa gruta, revelando uma fonte de água que se tornou centro mundial de peregrinação e curas.',
    fullStory: 'Entre fevereiro e julho de 1858, a Virgem Maria apareceu 18 vezes a Bernadette Soubirous na gruta de Massabielle, às margens do rio Gave. Na nona aparição, a Virgem instruiu Bernadette a cavar o chão da gruta, de onde brotou uma fonte de água que flui até hoje. Na décima sexta aparição, em 25 de março (festa da Anunciação), a Virgem revelou sua identidade: "Que soy era Immaculada Councepciou" (Eu sou a Imaculada Conceição) — confirmando o dogma proclamado pelo Papa Pio IX apenas quatro anos antes, em 1854. Desde então, Lourdes tornou-se o maior centro de peregrinação mariana do mundo, com milhões de peregrinos anuais. O Bureau Médico de Lourdes registrou 70 curas oficialmente reconhecidas como milagres pela Igreja.',
    message: 'Maria convida à penitência, à oração e à conversão. Pede que se reze o Rosário e que se faça procissões. A água da fonte simboliza a purificação e a graça divina.',
    liturgicalFeast: '11 de fevereiro',
    approved: true,
    image: '💧',
    color: 'from-blue-500/20 to-blue-600/5 border-blue-500/30',
  },
  {
    id: 'fatima',
    title: 'Nossa Senhora de Fátima',
    location: 'Cova da Iria, Fátima',
    country: 'Portugal',
    year: 1917,
    date: '13 de maio a 13 de outubro de 1917',
    seer: 'Lúcia dos Santos, Francisco e Jacinta Marto',
    seerStory: 'Os três pastorzinhos de Fátima eram primos. Lúcia de Jesus dos Santos tinha 10 anos; Francisco Marto, 9 anos; e Jacinta Marto, 7 anos. Eram crianças simples e analfabetas de famílias camponesas da aldeia de Aljustrel. Francisco, de temperamento contemplativo, foi descrito pela Virgem como precisando "rezar muitos rosários" para ir ao Céu. Morreu em 4 de abril de 1919, vítima da gripe espanhola, aos 10 anos. Jacinta, a mais jovem, sofreu intensamente antes de morrer em 20 de fevereiro de 1920, aos 9 anos, oferecendo seus sofrimentos pela conversão dos pecadores. Francisco e Jacinta foram canonizados pelo Papa Francisco em 2017. Lúcia tornou-se religiosa carmelita, vivendo até os 97 anos (†2005). É Serva de Deus em processo de beatificação.',
    summary: 'A Virgem apareceu a três crianças pastoras, revelando três segredos proféticos e realizando o Milagre do Sol diante de 70.000 pessoas.',
    fullStory: 'Em 1917, durante a Primeira Guerra Mundial, a Virgem Maria apareceu seis vezes a três pastorzinhos na Cova da Iria, Fátima. As aparições foram precedidas por três visitas do Anjo de Portugal em 1916. A Virgem revelou três segredos: a visão do inferno, a devoção ao Imaculado Coração de Maria e a consagração da Rússia, e o terceiro segredo (revelado em 2000, referente à perseguição da Igreja e ao atentado contra o Papa). Em cada aparição, Maria pediu a recitação diária do Rosário pela paz no mundo. Na última aparição, em 13 de outubro de 1917, ocorreu o "Milagre do Sol": cerca de 70.000 pessoas viram o sol "dançar" no céu, girar e parecer precipitar-se sobre a terra, secando instantaneamente as roupas e o chão encharcados pela chuva. O fenômeno foi testemunhado por crentes e céticos, e reportado por jornais seculares da época.',
    message: 'Maria pede oração (especialmente o Rosário), penitência, conversão e devoção ao seu Imaculado Coração. Alerta sobre as consequências do pecado e promete: "Por fim, o meu Imaculado Coração triunfará."',
    liturgicalFeast: '13 de maio',
    approved: true,
    image: '☀️',
    color: 'from-amber-500/20 to-amber-600/5 border-amber-500/30',
  },
  {
    id: 'aparecida',
    title: 'Nossa Senhora Aparecida',
    location: 'Rio Paraíba do Sul, Aparecida',
    country: 'Brasil',
    year: 1717,
    date: 'Outubro de 1717',
    seer: 'Pescadores Domingos Garcia, João Alves e Filipe Pedroso',
    seerStory: 'Os três pescadores eram homens simples da vila de Guaratinguetá, na capitania de São Paulo. Domingos Garcia, João Alves e Filipe Pedroso saíram para pescar no rio Paraíba do Sul em preparação para uma recepção ao Conde de Assumar, governador da capitania. Após horas sem conseguir nenhum peixe, lançaram suas redes mais uma vez perto do Porto de Itaguaçu. João Alves recolheu primeiro o corpo de uma pequena imagem de terracota, e na jogada seguinte, a cabeça. Após reunirem a imagem de Nossa Senhora da Conceição — enegrecida pelo tempo submersa na água —, as redes encheram-se de peixes em abundância. A devoção à imagem cresceu entre as famílias da região, que começaram a rezar diante dela. Milagres passaram a ser atribuídos à intercessão da Virgem Aparecida.',
    summary: 'Uma imagem de Nossa Senhora da Conceição foi miraculosamente encontrada por pescadores no rio Paraíba do Sul, tornando-se Padroeira do Brasil.',
    fullStory: 'Em outubro de 1717, três pescadores lançaram suas redes no rio Paraíba do Sul, perto de Guaratinguetá. Após horas sem sucesso, encontraram primeiro o corpo, depois a cabeça de uma pequena imagem de terracota de Nossa Senhora da Conceição, enegrecida pelas águas e pelo tempo. Imediatamente após a descoberta, as redes se encheram de peixes em abundância. A imagem, de apenas 36 centímetros, foi levada para a casa de Filipe Pedroso, onde vizinhos começaram a rezar diante dela. Milagres passaram a ser relatados: a cura de doentes, a libertação de escravos (cujas correntes se quebraram diante da imagem), e muitas outras graças. Uma primeira capela foi construída em 1745, seguida de uma igreja maior em 1834. O grandioso Santuário Nacional de Aparecida, a segunda maior basílica católica do mundo (após São Pedro), foi inaugurado em 1980. Nossa Senhora Aparecida foi proclamada Padroeira do Brasil pelo Papa Pio XI em 1930. A festa de 12 de outubro é feriado nacional.',
    message: 'Maria se faz presente de modo simples e humilde, entre pescadores comuns, mostrando que Deus age através dos pequenos e dos pobres. Sua imagem escura abraça a diversidade do povo brasileiro.',
    liturgicalFeast: '12 de outubro',
    approved: true,
    image: '🐟',
    color: 'from-sky-500/20 to-sky-600/5 border-sky-500/30',
  },
];

const AparicoesPage: React.FC = () => {
  const [selectedApparition, setSelectedApparition] = useState<Apparition | null>(null);
  const [activeTab, setActiveTab] = useState<'historia' | 'vidente' | 'mensagem'>('historia');

  if (selectedApparition) {
    return (
      <div className="max-w-4xl mx-auto space-y-6">
        {/* Back + Header */}
        <div className="flex items-center gap-4">
          <button onClick={() => setSelectedApparition(null)} className="p-2 rounded-xl bg-card border border-border hover:bg-primary/10 transition-all">
            <Icons.ArrowDown className="w-5 h-5 rotate-90 text-foreground" />
          </button>
          <div className="flex-1 min-w-0">
            <span className="text-[9px] font-black uppercase tracking-[0.2em] text-primary">{selectedApparition.country} • {selectedApparition.year}</span>
            <h1 className="text-xl md:text-2xl font-serif font-bold text-foreground">{selectedApparition.title}</h1>
            <p className="text-sm text-muted-foreground">{selectedApparition.location}</p>
          </div>
          <span className="text-4xl">{selectedApparition.image}</span>
        </div>

        {/* Quick facts */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {[
            { label: 'Data', value: selectedApparition.date },
            { label: 'Vidente(s)', value: selectedApparition.seer.split(',')[0] },
            { label: 'Festa Litúrgica', value: selectedApparition.liturgicalFeast },
            { label: 'Status', value: selectedApparition.approved ? 'Aprovada pela Igreja' : 'Em análise' },
          ].map(fact => (
            <div key={fact.label} className="p-3 rounded-xl bg-card border border-border">
              <p className="text-[9px] font-black uppercase tracking-widest text-primary mb-1">{fact.label}</p>
              <p className="text-xs font-semibold text-foreground">{fact.value}</p>
            </div>
          ))}
        </div>

        {/* Tabs */}
        <div className="flex gap-1 p-1 bg-muted rounded-xl">
          {[
            { id: 'historia' as const, label: 'A Aparição', icon: <Icons.Book className="w-3.5 h-3.5" /> },
            { id: 'vidente' as const, label: 'O Vidente', icon: <Icons.Users className="w-3.5 h-3.5" /> },
            { id: 'mensagem' as const, label: 'A Mensagem', icon: <Icons.Heart className="w-3.5 h-3.5" /> },
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-lg text-xs font-bold transition-all ${
                activeTab === tab.id ? 'bg-card text-foreground shadow-sm' : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              {tab.icon}
              <span className="hidden sm:inline">{tab.label}</span>
            </button>
          ))}
        </div>

        {/* Tab content */}
        <AnimatePresence mode="wait">
          <motion.div
            key={activeTab}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.2 }}
            className="bg-card border border-border rounded-2xl p-6 md:p-8"
          >
            {activeTab === 'historia' && (
              <div className="space-y-4">
                <h2 className="text-lg font-serif font-bold text-foreground">A História da Aparição</h2>
                <p className="font-serif text-foreground/90 leading-[1.9] text-base">{selectedApparition.fullStory}</p>
              </div>
            )}
            {activeTab === 'vidente' && (
              <div className="space-y-4">
                <h2 className="text-lg font-serif font-bold text-foreground">
                  {selectedApparition.seer}
                </h2>
                <p className="font-serif text-foreground/90 leading-[1.9] text-base">{selectedApparition.seerStory}</p>
              </div>
            )}
            {activeTab === 'mensagem' && (
              <div className="space-y-6">
                <h2 className="text-lg font-serif font-bold text-foreground">A Mensagem de Maria</h2>
                <blockquote className="border-l-4 border-primary pl-4 py-2">
                  <p className="font-serif italic text-foreground/90 leading-[1.9] text-base">{selectedApparition.message}</p>
                </blockquote>
              </div>
            )}
          </motion.div>
        </AnimatePresence>
      </div>
    );
  }

  // Overview
  return (
    <div className="max-w-5xl mx-auto space-y-8">
      {/* Header */}
      <div className="text-center space-y-3">
        <div className="inline-flex items-center gap-2 px-3 py-1 bg-primary/10 rounded-full">
          <Icons.Heart className="w-4 h-4 text-primary" />
          <span className="text-[9px] font-black uppercase tracking-[0.2em] text-primary">Aparições Marianas</span>
        </div>
        <h1 className="text-3xl md:text-5xl font-serif font-bold text-foreground">Aparições de Nossa Senhora</h1>
        <p className="text-muted-foreground font-serif italic max-w-2xl mx-auto">
          As principais manifestações da Mãe de Deus ao longo da história, aprovadas pela Igreja Católica.
        </p>
      </div>

      {/* Timeline intro */}
      <div className="flex items-center justify-center gap-8 text-center">
        {APPARITIONS.map((a, i) => (
          <React.Fragment key={a.id}>
            <div className="flex flex-col items-center gap-1">
              <span className="text-2xl">{a.image}</span>
              <span className="text-[10px] font-black text-primary">{a.year}</span>
            </div>
            {i < APPARITIONS.length - 1 && (
              <div className="hidden sm:block w-12 h-px bg-border" />
            )}
          </React.Fragment>
        ))}
      </div>

      {/* Apparition cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        {APPARITIONS.map((apparition, index) => (
          <motion.button
            key={apparition.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.1 }}
            onClick={() => { setSelectedApparition(apparition); setActiveTab('historia'); }}
            className={`text-left p-6 rounded-2xl bg-gradient-to-br ${apparition.color} border hover:scale-[1.02] transition-all group`}
          >
            <div className="flex items-start justify-between mb-4">
              <div>
                <span className="text-[10px] font-black text-primary uppercase tracking-widest">{apparition.country} • {apparition.year}</span>
                <h2 className="text-lg md:text-xl font-serif font-bold text-foreground mt-1 group-hover:text-primary transition-colors">
                  {apparition.title}
                </h2>
              </div>
              <span className="text-3xl">{apparition.image}</span>
            </div>
            <p className="text-sm text-muted-foreground mb-3 line-clamp-2">{apparition.summary}</p>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-muted-foreground">
                <Icons.Users className="w-3.5 h-3.5" />
                <span className="text-[10px] font-bold">{apparition.seer.split(',')[0]}</span>
              </div>
              <span className="text-[10px] font-black uppercase tracking-widest text-primary">Ler com profundidade →</span>
            </div>
          </motion.button>
        ))}
      </div>

      {/* Catechism reference */}
      <div className="bg-card border border-border rounded-2xl p-6 text-center space-y-3">
        <Icons.Cross className="w-6 h-6 text-primary mx-auto" />
        <h3 className="font-serif font-bold text-foreground">Fundamentação no Catecismo</h3>
        <p className="text-sm text-muted-foreground max-w-xl mx-auto">
          O Catecismo da Igreja Católica (§67) ensina que as revelações privadas "não pertencem ao depósito da fé",
          mas podem "ajudar a viver" a fé em determinada época. As aparições aprovadas são um convite à conversão e à oração.
        </p>
      </div>
    </div>
  );
};

export default AparicoesPage;
