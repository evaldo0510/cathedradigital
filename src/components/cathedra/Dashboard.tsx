import React from 'react';
import { AppRoute, User } from '../../types';
import { Icons } from '../../constants';
import SacredImage from './SacredImage';
import ContentCard from './ContentCard';

interface DashboardProps {
  onSearch: (t: string) => void;
  user: User | null;
  onNavigate: (r: AppRoute) => void;
}

const Dashboard: React.FC<DashboardProps> = ({ onNavigate }) => {
  return (
    <div className="space-y-16 md:space-y-32 animate-in fade-in duration-1000 pb-24 md:pb-48">
      {/* HERO SECTION */}
      <section className="relative min-h-[60vh] md:min-h-[80vh] flex flex-col justify-center items-center text-center px-4 overflow-hidden rounded-[2.5rem] md:rounded-[4rem] bg-[#1f2937] shadow-[0_35px_70px_-15px_rgba(0,0,0,0.1)] group">
        <div className="absolute inset-0 opacity-10 grayscale mix-blend-overlay">
          <SacredImage src="https://images.unsplash.com/photo-1548610762-656391d1ad4d?auto=format&fit=crop&q=80&w=1600" alt="Product Background" className="w-full h-full" priority />
        </div>
        <div className="absolute inset-0 bg-gradient-to-b from-[#1f2937]/40 via-[#1f2937]/80 to-[#1f2937]" />

        <div className="relative z-10 space-y-6 md:space-y-10 max-w-4xl px-4">
          <div className="inline-flex items-center gap-2 px-3 py-1 bg-white/5 border border-white/10 rounded-full">
            <div className="w-1.5 h-1.5 rounded-full bg-[#d4af37] animate-pulse" />
            <span className="text-[8px] md:text-[10px] font-black uppercase tracking-[0.2em] text-white/60">Versão 4.5 PRO Disponível</span>
          </div>

          <h1 className="text-3xl sm:text-5xl md:text-8xl font-serif font-bold text-white tracking-tight leading-tight px-2">
            A Inteligência <br className="hidden sm:block" />
            <span className="text-[#d4af37] italic font-normal">da Fé Católica.</span>
          </h1>

          <p className="text-lg md:text-2xl text-[#6b7280] font-serif italic max-w-2xl mx-auto leading-relaxed px-4 opacity-80">
            Escritura, Tradição e Magistério unificados em uma plataforma de alta performance com IA Exegética.
          </p>

          <div className="flex flex-col sm:flex-row gap-4 justify-center pt-4 md:pt-8 w-full max-w-xs sm:max-w-none mx-auto">
            <button onClick={() => onNavigate(AppRoute.BIBLE)} className="px-8 md:px-10 py-4 md:py-5 bg-[#d4af37] text-[#1f2937] rounded-2xl font-black uppercase text-[10px] md:text-xs tracking-widest shadow-2xl hover:bg-white transition-all transform hover:-translate-y-1">
              Começar Agora
            </button>
            <button onClick={() => onNavigate(AppRoute.STUDY_MODE)} className="px-8 md:px-10 py-4 md:py-5 bg-white/5 backdrop-blur-md text-white border border-white/10 rounded-2xl font-black uppercase text-[10px] md:text-xs tracking-widest hover:bg-white/10 transition-all">
              Testar IA
            </button>
          </div>
        </div>
      </section>

      {/* CORE FEATURES GRID */}
      <section className="max-w-7xl mx-auto px-4 md:px-6 space-y-12 md:space-y-16">
        <div className="text-center space-y-4">
          <h2 className="text-3xl md:text-5xl font-serif font-bold text-[#1f2937]">O Ecossistema da Verdade</h2>
          <p className="text-[#6b7280] font-serif italic text-lg">Tudo o que você precisa para uma formação sólida.</p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 md:gap-8">
          <ContentCard icon={<Icons.Book className="w-8 md:w-10 h-8 md:h-10" />} title="Scriptuarium" description="Bíblia Sagrada com comentários patrísticos e análise linguística." action="Abrir" onClick={() => onNavigate(AppRoute.BIBLE)} />
          <ContentCard icon={<Icons.Cross className="w-8 md:w-10 h-8 md:h-10" />} title="Codex Fidei" description="O Catecismo da Igreja Católica organizado por nexos teológicos." action="Estudar" onClick={() => onNavigate(AppRoute.CATECHISM)} />
          <ContentCard icon={<Icons.History className="w-8 md:w-10 h-8 md:h-10" />} title="Magisterium" description="Acesso total a Encíclicas, Concílios e Documentos da Santa Sé." action="Explorar" onClick={() => onNavigate(AppRoute.MAGISTERIUM)} />
        </div>
      </section>

      {/* IA SHOWCASE */}
      <section className="bg-[#f5f6f7] py-16 md:py-24 rounded-[3rem] md:rounded-[4rem] border border-[#e5e7eb] mx-4 md:mx-6 overflow-hidden">
        <div className="max-w-7xl mx-auto px-6 md:px-8 grid lg:grid-cols-2 gap-12 md:gap-16 items-center">
          <div className="space-y-6 md:space-y-8 text-center lg:text-left">
            <span className="text-[8px] md:text-[10px] font-black uppercase tracking-widest text-[#d4af37]">Inteligência Artificial</span>
            <h2 className="text-3xl md:text-6xl font-serif font-bold text-[#1f2937] leading-tight">Conecte séculos de <br /> sabedoria em segundos.</h2>
            <p className="text-lg md:text-xl text-[#6b7280] font-serif leading-relaxed italic opacity-90">
              Nossa IA não apenas responde, ela correlaciona. Encontre o nexo exato entre um versículo bíblico e a definição dogmática de um Concílio.
            </p>
            <ul className="space-y-4 text-left inline-block lg:block">
              {['Investigação Exegética Profunda', 'Síntese Escolástica (Estilo Tomista)', 'Nexus Theologicus Automático'].map(f => (
                <li key={f} className="flex items-center gap-3 text-[#1f2937] font-bold text-sm md:text-base">
                  <div className="w-1.5 h-1.5 bg-[#d4af37] rounded-full shrink-0" />
                  {f}
                </li>
              ))}
            </ul>
            <div className="pt-4">
              <button onClick={() => onNavigate(AppRoute.STUDY_MODE)} className="px-8 py-4 bg-[#1f2937] text-white rounded-xl font-black uppercase text-[10px] tracking-widest hover:bg-[#d4af37] hover:text-[#1f2937] transition-all shadow-xl w-full sm:w-auto">
                Abrir Scriptorium IA
              </button>
            </div>
          </div>
          <div className="relative group hidden sm:block">
            <div className="absolute -inset-4 bg-[#d4af37]/10 rounded-[3rem] blur-2xl group-hover:bg-[#d4af37]/20 transition-all" />
            <div className="relative bg-white p-8 md:p-10 rounded-[2.5rem] md:rounded-[3rem] shadow-[0_35px_70px_-15px_rgba(0,0,0,0.1)] border border-[#e5e7eb]">
              <div className="space-y-6">
                <div className="flex items-center gap-3 border-b border-[#e5e7eb] pb-4">
                  <Icons.Feather className="w-5 h-5 text-[#d4af37]" />
                  <span className="text-xs font-black uppercase opacity-40">Simulação de Nexus</span>
                </div>
                <p className="text-[#6b7280] italic text-sm md:text-base">"Como a Eucaristia é prefigurada no Antigo Testamento?"</p>
                <div className="p-5 md:p-6 bg-[#f5f6f7] rounded-2xl border border-[#e5e7eb]">
                  <p className="text-xs md:text-sm font-serif leading-relaxed">
                    O Maná no deserto (Êxodo 16) e o sacrifício de Melquisedeque (Gênesis 14) convergem para a instituição da Ceia...
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};

export default Dashboard;
