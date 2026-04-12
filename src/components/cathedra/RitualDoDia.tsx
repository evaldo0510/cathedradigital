import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Icons } from '@/constants';
import { supabase } from '@/integrations/supabase/client';
import { SAINTS_DATA } from '@/data/saints';
import SacredImage from './SacredImage';
import AudioContentPlayer from './AudioContentPlayer';
import { AppRoute } from '@/types';
import { Sparkles, BookOpen, ChevronRight } from 'lucide-react';

const DAILY_VERSES = [
  { text: 'Sede misericordiosos como vosso Pai é misericordioso.', ref: 'Lc 6,36' },
  { text: 'Eu sou o caminho, a verdade e a vida.', ref: 'Jo 14,6' },
  { text: 'Vinde a mim todos vós que estais cansados e eu vos aliviarei.', ref: 'Mt 11,28' },
  { text: 'Não tenhais medo, eu venci o mundo.', ref: 'Jo 16,33' },
  { text: 'Amai-vos uns aos outros como eu vos amei.', ref: 'Jo 15,12' },
  { text: 'Tudo posso naquele que me fortalece.', ref: 'Fl 4,13' },
  { text: 'O Senhor é meu pastor, nada me faltará.', ref: 'Sl 23,1' },
  { text: 'Buscai primeiro o Reino de Deus e a sua justiça.', ref: 'Mt 6,33' },
  { text: 'Porque Deus amou o mundo de tal maneira que deu o seu Filho unigénito.', ref: 'Jo 3,16' },
  { text: 'A fé é a certeza daquilo que esperamos e a prova das coisas que não vemos.', ref: 'Hb 11,1' },
  { text: 'Eu estou convosco todos os dias, até o fim do mundo.', ref: 'Mt 28,20' },
  { text: 'Lança sobre o Senhor o teu fardo e Ele te susterá.', ref: 'Sl 55,22' },
  { text: 'Em tudo dai graças, porque esta é a vontade de Deus.', ref: '1Ts 5,18' },
  { text: 'Sede fortes e corajosos; não temais, pois o Senhor estará convosco.', ref: 'Dt 31,6' },
  { text: 'O amor é paciente, o amor é bondoso.', ref: '1Cor 13,4' },
  { text: 'Confia no Senhor de todo o teu coração.', ref: 'Pr 3,5' },
  { text: 'Quem permanece em mim e eu nele, esse dá muito fruto.', ref: 'Jo 15,5' },
  { text: 'Eis que faço novas todas as coisas.', ref: 'Ap 21,5' },
  { text: 'A paz vos deixo, a minha paz vos dou.', ref: 'Jo 14,27' },
  { text: 'Pedi e recebereis, para que a vossa alegria seja completa.', ref: 'Jo 16,24' },
  { text: 'Felizes os puros de coração, porque verão a Deus.', ref: 'Mt 5,8' },
  { text: 'O Senhor é a minha luz e a minha salvação; de quem terei medo?', ref: 'Sl 27,1' },
  { text: 'Alegrai-vos no Senhor, sempre; outra vez digo: alegrai-vos!', ref: 'Fl 4,4' },
  { text: 'O Senhor está perto dos que têm o coração quebrantado.', ref: 'Sl 34,18' },
  { text: 'Não vos conformeis com este mundo, mas transformai-vos pela renovação da mente.', ref: 'Rm 12,2' },
  { text: 'Eu sou a videira, vós sois os ramos.', ref: 'Jo 15,5' },
  { text: 'Para Deus nada é impossível.', ref: 'Lc 1,37' },
  { text: 'O justo viverá pela fé.', ref: 'Rm 1,17' },
  { text: 'Os que esperam no Senhor renovarão as suas forças.', ref: 'Is 40,31' },
  { text: 'Sede, pois, imitadores de Deus, como filhos amados.', ref: 'Ef 5,1' },
  { text: 'Grandes coisas fez o Senhor por nós.', ref: 'Sl 126,3' },
];

const DAILY_REFLECTIONS = [
  'Hoje, acolha a misericórdia divina como dom gratuito. Deixe que ela transforme os seus julgamentos em compaixão.',
  'O caminho de Cristo não é uma estrada fácil, mas é a única que conduz à plenitude. Caminhe com confiança.',
  'Nos momentos de cansaço, lembre-se: Jesus não pede que sejamos fortes sozinhos. Ele carrega conosco o peso do dia.',
  'O medo paralisa, mas a fé liberta. Confie n\'Aquele que já venceu todas as batalhas por você.',
  'O amor verdadeiro não é sentimento passageiro; é decisão diária de entregar-se ao próximo como Cristo se entregou.',
  'Cada pequena vitória sobre si mesmo é um passo no caminho da santidade. Persevere nas coisas pequenas.',
  'Deus não espera perfeição; espera disponibilidade. Ofereça hoje o pouco que tem, e Ele multiplicará.',
  'A oração transforma mais o coração de quem reza do que a realidade ao redor. Comece por dentro.',
  'A gratidão é a memória do coração. Hoje, recorde três bênçãos que recebeu sem merecer.',
  'A paz de Cristo não é ausência de problemas, mas presença d\'Ele no meio da tempestade.',
];

const RitualDoDia: React.FC = () => {
  const navigate = useNavigate();
  const [officialSaint, setOfficialSaint] = useState<any>(null);

  const dayOfYear = useMemo(() => {
    const now = new Date();
    const start = new Date(now.getFullYear(), 0, 0);
    return Math.floor((now.getTime() - start.getTime()) / 86400000);
  }, []);

  const verse = DAILY_VERSES[dayOfYear % DAILY_VERSES.length];
  const reflection = DAILY_REFLECTIONS[dayOfYear % DAILY_REFLECTIONS.length];

  // Fetch saint of the day
  useEffect(() => {
    const fetchSaint = async () => {
      try {
        const response = await supabase.functions.invoke('saint-of-the-day');
        if (response.data && !response.error) {
          setOfficialSaint(response.data);
        }
      } catch {
        // Fallback to local data
      }
    };
    fetchSaint();
  }, []);

  const saint = useMemo(() => {
    const now = new Date();
    const month = now.getMonth() + 1;
    const day = now.getDate();

    if (officialSaint && officialSaint.name && officialSaint.name !== 'Santo do Dia' && officialSaint.name !== 'Menu') {
      const localMatch = SAINTS_DATA.find(s =>
        s.feastMonth === month && s.feastDayNum === day &&
        (officialSaint.name.toLowerCase().includes(s.name.toLowerCase()) || s.name.toLowerCase().includes(officialSaint.name.toLowerCase()))
      );
      return {
        name: officialSaint.name,
        image: localMatch?.image || officialSaint.image,
        bio: officialSaint.description || localMatch?.bio || '',
        title: localMatch?.title || 'Santo do Dia',
      };
    }

    const localSaint = SAINTS_DATA.find(s => s.feastMonth === month && s.feastDayNum === day);
    if (localSaint) {
      return { name: localSaint.name, image: localSaint.image, bio: localSaint.bio, title: localSaint.title };
    }

    const fallback = SAINTS_DATA[dayOfYear % SAINTS_DATA.length];
    return { name: fallback.name, image: fallback.image, bio: fallback.bio, title: fallback.title };
  }, [officialSaint, dayOfYear]);

  const audioText = `Santo do dia: ${saint.name}. ${saint.bio?.slice(0, 200) || ''}. Versículo: ${verse.text} — ${verse.ref}. Reflexão: ${reflection}`;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.8, ease: [0.25, 0.46, 0.45, 0.94] }}
      className="relative overflow-hidden rounded-3xl border border-secondary/30 bg-gradient-to-br from-secondary/5 via-card to-primary/5 shadow-lg"
    >
      {/* Decorative glow */}
      <div className="absolute -top-20 -right-20 w-60 h-60 bg-secondary/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute -bottom-16 -left-16 w-48 h-48 bg-primary/10 rounded-full blur-3xl pointer-events-none" />

      <div className="relative z-10 p-6 md:p-8 space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-secondary" />
            <span className="text-[10px] font-black uppercase tracking-[0.3em] text-secondary">
              Ritual do Dia
            </span>
          </div>
          <span className="text-[10px] font-medium text-muted-foreground">
            {new Date().toLocaleDateString('pt-BR', { weekday: 'long', day: 'numeric', month: 'long' })}
          </span>
        </div>

        {/* Saint */}
        <button
          onClick={() => navigate(AppRoute.SAINTS)}
          className="w-full flex items-center gap-4 group text-left"
        >
          <div className="w-16 h-16 md:w-20 md:h-20 rounded-2xl overflow-hidden border-2 border-secondary/20 shadow-md shrink-0">
            <SacredImage
              src={saint.image}
              alt={saint.name}
              className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
            />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-[9px] font-black uppercase tracking-[0.2em] text-secondary/80 mb-0.5">{saint.title}</p>
            <h3 className="text-lg font-bold text-foreground leading-tight group-hover:text-primary transition-colors truncate">
              {saint.name}
            </h3>
            <p className="text-[11px] text-muted-foreground mt-1 line-clamp-2 leading-relaxed">
              {saint.bio?.slice(0, 120)}...
            </p>
          </div>
          <ChevronRight className="w-4 h-4 text-muted-foreground/40 group-hover:text-primary transition-colors shrink-0" />
        </button>

        {/* Divider */}
        <div className="h-px bg-gradient-to-r from-transparent via-border to-transparent" />

        {/* Bible Verse */}
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <BookOpen className="w-3.5 h-3.5 text-primary" />
            <span className="text-[9px] font-black uppercase tracking-[0.2em] text-primary">Versículo do Dia</span>
          </div>
          <blockquote className="text-base md:text-lg font-serif italic text-foreground leading-relaxed pl-4 border-l-2 border-secondary/30">
            "{verse.text}"
          </blockquote>
          <p className="text-[10px] font-black text-secondary/70 tracking-wide pl-4">— {verse.ref}</p>
        </div>

        {/* Divider */}
        <div className="h-px bg-gradient-to-r from-transparent via-border to-transparent" />

        {/* Reflection */}
        <div className="space-y-2">
          <span className="text-[9px] font-black uppercase tracking-[0.2em] text-muted-foreground">✦ Reflexão</span>
          <p className="text-sm text-foreground/80 leading-relaxed">
            {reflection}
          </p>
        </div>

        {/* Audio Button */}
        <div className="pt-2">
          <AudioContentPlayer
            text={audioText}
            title="Ouvir o Ritual do Dia"
            variant="default"
            className="w-full rounded-2xl h-12 bg-primary text-primary-foreground font-bold text-xs uppercase tracking-widest shadow-md hover:shadow-lg transition-shadow"
          />
        </div>
      </div>
    </motion.div>
  );
};

export default RitualDoDia;
