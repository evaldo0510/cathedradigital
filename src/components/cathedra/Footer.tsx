import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Icons, Logo } from '../../constants';
import { AppRoute } from '../../types';

const DIOCESES_BR = [
  'Arquidiocese de São Paulo',
  'Arquidiocese do Rio de Janeiro',
  'Arquidiocese de Brasília',
  'Arquidiocese de Belo Horizonte',
  'Arquidiocese de Salvador',
  'Arquidiocese de Fortaleza',
  'Arquidiocese de Porto Alegre',
  'Arquidiocese de Curitiba',
  'Arquidiocese de Recife e Olinda',
  'Arquidiocese de Goiânia',
  'Arquidiocese de Belém do Pará',
  'Arquidiocese de Manaus',
  'Arquidiocese de Campinas',
  'Arquidiocese de Florianópolis',
  'Arquidiocese de Vitória',
  'Arquidiocese de Natal',
  'Arquidiocese de São Luís do Maranhão',
  'Arquidiocese de Aparecida',
  'Diocese de Santos',
  'Diocese de Joinville',
  'Diocese de Caxias do Sul',
  'Diocese de Juiz de Fora',
  'Diocese de Uberlândia',
  'Diocese de Maringá',
  'Diocese de Londrina',
];

const DIOCESE_URLS: Record<string, string> = {
  'Arquidiocese de São Paulo': 'https://www.arquisp.org.br',
  'Arquidiocese do Rio de Janeiro': 'https://arqrio.org',
  'Arquidiocese de Brasília': 'https://www.arquidiocesedebrasilia.org.br',
  'Arquidiocese de Belo Horizonte': 'https://www.arquidiocesebh.org.br',
  'Arquidiocese de Salvador': 'https://www.arquidiocesesalvador.org.br',
  'Arquidiocese de Fortaleza': 'https://www.arquidiocesedefortaleza.org.br',
  'Arquidiocese de Porto Alegre': 'https://www.arquidiocesepoa.org.br',
  'Arquidiocese de Curitiba': 'https://www.arquidiocesedecuritiba.org.br',
  'Arquidiocese de Recife e Olinda': 'https://www.arquidioceseolindarecife.org',
  'Arquidiocese de Goiânia': 'https://www.arquidiocesedegoiania.org.br',
  'Arquidiocese de Belém do Pará': 'https://www.arquidiocesedebelem.com.br',
  'Arquidiocese de Manaus': 'https://www.arquidiocesdemanaus.org.br',
  'Arquidiocese de Campinas': 'https://www.arquidiocesecampinas.com',
  'Arquidiocese de Florianópolis': 'https://www.arquifln.org.br',
  'Arquidiocese de Vitória': 'https://www.aves.org.br',
  'Arquidiocese de Natal': 'https://www.arquidiocesedenatal.org.br',
  'Arquidiocese de São Luís do Maranhão': 'https://www.arquidiocesesaoluis.org.br',
  'Arquidiocese de Aparecida': 'https://www.arquidiocesedeaparecida.org.br',
};

const Footer: React.FC = React.memo(() => {
  const navigate = useNavigate();
  const [selectedDiocese, setSelectedDiocese] = useState(() => localStorage.getItem('cathedra_diocese') || '');
  const [email, setEmail] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const vaticanLinks = [
    { title: 'Santa Sé (Vatican.va)', url: 'https://www.vatican.va', desc: 'Site oficial do Vaticano' },
    { title: 'Catecismo Online', url: 'https://www.vatican.va/archive/ccc/index_po.htm', desc: 'CIC em português' },
    { title: 'Vatican News', url: 'https://www.vaticannews.va/pt.html', desc: 'Notícias do Papa e da Igreja' },
    { title: 'Dicastérios', url: 'https://www.vatican.va/content/romancuria/pt.html', desc: 'Cúria Romana' },
  ];

  const cnbbLinks = [
    { title: 'CNBB', url: 'https://www.cnbb.org.br', desc: 'Conferência Nacional dos Bispos do Brasil' },
    { title: 'Liturgia Diária', url: 'https://www.cnbb.org.br/liturgia', desc: 'Leituras e evangelho do dia' },
    { title: 'Documentos CNBB', url: 'https://www.cnbb.org.br/category/publicacoes', desc: 'Publicações e orientações' },
  ];

  const scrollToTop = () => {
    const mainContent = document.getElementById('main-content');
    if (mainContent) {
      mainContent.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  const handleSubscribe = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 1500));
    alert(`E-mail ${email} cadastrado com sucesso! Bem-vindo à nossa comunidade.`);
    setEmail('');
    setIsSubmitting(false);
  };

  const handleDioceseChange = (val: string) => {
    setSelectedDiocese(val);
    if (val) localStorage.setItem('cathedra_diocese', val);
    else localStorage.removeItem('cathedra_diocese');
  };

  const dioceseUrl = DIOCESE_URLS[selectedDiocese];

  return (
    <footer className="bg-[#050505] text-zinc-400 border-t border-white/5 pt-16 md:pt-32 pb-12 px-6 md:px-12 relative mt-auto overflow-x-hidden">
      {/* Background Texture */}
      <div className="absolute inset-0 pointer-events-none opacity-[0.03] bg-[url('https://www.transparenttextures.com/patterns/natural-paper.png')]" />
      
      {/* Background Accent Gradients */}
      <div className="absolute top-0 left-1/4 w-[500px] h-[500px] bg-primary/5 rounded-full blur-[120px] pointer-events-none" />
      <div className="absolute bottom-0 right-1/4 w-[500px] h-[500px] bg-accent/5 rounded-full blur-[120px] pointer-events-none" />

      <div className="max-w-7xl mx-auto relative z-10 space-y-24">
        {/* TOP SECTION: BRAND & NEWSLETTER */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-16 pb-20 border-b border-white/5">
          <div className="lg:col-span-5 space-y-8">
            <div className="flex items-center gap-5">
              <Logo className="w-16 h-16 border border-white/10 p-2.5 rounded-2xl bg-white/5 shadow-2xl backdrop-blur-sm" />
              <div>
                <h3 className="text-3xl font-serif font-bold text-white tracking-tight leading-none">CATHEDRA</h3>
                <p className="text-[10px] font-black uppercase text-primary mt-2 tracking-[0.4em] opacity-80">Digital Sanctuarium</p>
              </div>
            </div>
            <p className="text-lg font-serif italic text-zinc-500 leading-relaxed max-w-md">
              "Ex Umbris Et Imaginibus In Veritatem." <br />
              Unindo a sabedoria milenar à Inteligência Teológica para o crescimento espiritual e intelectual.
            </p>
            <div className="flex gap-6">
              {[
                { icon: <Icons.Instagram className="w-5 h-5" />, url: 'https://instagram.com/cathedra.digital' },
                { icon: <Icons.Facebook className="w-5 h-5" />, url: 'https://facebook.com/cathedradigital' },
                { icon: <Icons.Whatsapp className="w-5 h-5" />, url: 'https://wa.me/5511999999999' },
              ].map((social, i) => (
                <a key={i} href={social.url} target="_blank" rel="noopener noreferrer" className="text-zinc-500 hover:text-primary transition-all p-2.5 rounded-xl bg-white/5 border border-white/10 hover:border-primary/50 group">
                  <div className="group-hover:scale-110 transition-transform">{social.icon}</div>
                </a>
              ))}
            </div>
            <div className="flex gap-4">
              <div className="px-4 py-1.5 border border-white/10 rounded-full text-[10px] font-bold uppercase tracking-widest text-zinc-500 bg-white/5">
                Version 4.5 PRO
              </div>

              <div className="px-4 py-1.5 border border-white/10 rounded-full text-[10px] font-bold uppercase tracking-widest text-zinc-500 bg-white/5">
                Enterprise SSL
              </div>
            </div>
          </div>

          <div className="lg:col-span-7 flex flex-col justify-center">
            <div className="bg-white/[0.02] border border-white/5 rounded-3xl p-8 backdrop-blur-md">
              <div className="flex flex-col md:flex-row items-center gap-8">
                <div className="flex-1 space-y-2 text-center md:text-left">
                  <h4 className="text-xl font-serif text-white font-bold">Boletim Informativo</h4>
                  <p className="text-sm text-zinc-500">Receba reflexões teológicas e atualizações da plataforma semanalmente.</p>
                </div>
                <form onSubmit={handleSubscribe} className="w-full md:w-auto flex flex-col sm:flex-row gap-3">
                  <div className="relative flex-1 sm:w-64">
                    <input 
                      type="email" 
                      required
                      placeholder="Seu melhor e-mail" 
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      disabled={isSubmitting}
                      className="w-full px-6 py-3.5 rounded-xl bg-white/5 border border-white/10 text-white text-sm focus:outline-none focus:border-primary/50 transition-all placeholder:text-zinc-600 disabled:opacity-50"
                    />
                    {isSubmitting && (
                      <div className="absolute right-4 top-1/2 -translate-y-1/2">
                        <div className="w-4 h-4 border-2 border-primary border-t-transparent rounded-full animate-spin" />
                      </div>
                    )}
                  </div>
                  <button 
                    disabled={isSubmitting}
                    className="px-8 py-3.5 rounded-xl bg-primary text-black font-black uppercase text-[10px] tracking-widest hover:bg-primary/90 transition-all shadow-lg shadow-primary/20 whitespace-nowrap disabled:opacity-50 active:scale-95"
                  >
                    {isSubmitting ? 'Enviando...' : 'Inscrever-se'}
                  </button>
                </form>
              </div>
            </div>
          </div>
        </div>

        {/* MIDDLE SECTION: MISSION & SITEMAP */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-12 gap-16 mb-20">
          {/* Mission/Vision/Values Group */}
          <div className="lg:col-span-6 grid grid-cols-1 sm:grid-cols-2 gap-10">
            <div className="space-y-6">
              <div className="flex items-center gap-3 text-primary">
                <div className="p-2 rounded-lg bg-primary/10">
                  <Icons.Star className="w-4 h-4 fill-current" />
                </div>
                <h4 className="text-[11px] font-black uppercase tracking-[0.3em]">Nossa Missão</h4>
              </div>
              <p className="text-sm font-serif italic text-zinc-500 leading-relaxed border-l-2 border-primary/20 pl-4">
                "Propagar o Depósito da Fé através da síntese entre a Tradição e a tecnologia, iluminando a inteligência dos fiéis."
              </p>
            </div>
            <div className="space-y-6">
              <div className="flex items-center gap-3 text-accent">
                <div className="p-2 rounded-lg bg-accent/10">
                  <Icons.Cross className="w-4 h-4" />
                </div>
                <h4 className="text-[11px] font-black uppercase tracking-[0.3em]">Nossos Valores</h4>
              </div>
              <ul className="space-y-3">
                {['Fidelidade ao Magistério', 'Rigor Intelectual', 'Caridade na Verdade'].map(v => (
                  <li key={v} className="flex items-center gap-3 text-xs font-medium text-zinc-500">
                    <div className="w-1.5 h-1.5 rounded-full bg-accent/40" />
                    {v}
                  </li>
                ))}
              </ul>
            </div>
          </div>

          {/* Navigation links columns */}
          <div className="lg:col-span-6 grid grid-cols-2 sm:grid-cols-3 gap-10">
            <div className="space-y-6">
              <h4 className="text-[11px] font-black uppercase tracking-[0.3em] text-white/90">Formação</h4>
              <nav className="flex flex-col gap-3">
                {[
                  { label: 'Bíblia Sagrada', route: AppRoute.BIBLE },
                  { label: 'Catecismo (CIC)', route: AppRoute.CATECHISM },
                  { label: 'Santos', route: AppRoute.SAINTS },
                  { label: 'Magistério', route: AppRoute.MAGISTERIUM },
                ].map(item => (
                  <button key={item.label} onClick={() => navigate(item.route)} className="text-left text-xs hover:text-primary transition-colors font-medium text-zinc-500 hover:pl-2 duration-300">
                    {item.label}
                  </button>
                ))}
              </nav>
            </div>

            <div className="space-y-6">
              <h4 className="text-[11px] font-black uppercase tracking-[0.3em] text-white/90">Vida Interior</h4>
              <nav className="flex flex-col gap-3">
                {[
                  { label: 'Liturgia Diária', route: AppRoute.DAILY_LITURGY },
                  { label: 'Missal Romano', route: AppRoute.MISSAL },
                  { label: 'Santo Rosário', route: AppRoute.ROSARY },
                  { label: 'Via Crucis', route: AppRoute.VIA_CRUCIS },
                  { label: 'Confissão', route: AppRoute.POENITENTIA },
                  { label: 'Ordo Missae', route: AppRoute.ORDO_MISSAE },
                ].map(item => (
                  <button key={item.label} onClick={() => navigate(item.route)} className="text-left text-xs hover:text-primary transition-colors font-medium text-zinc-500 hover:pl-2 duration-300">
                    {item.label}
                  </button>
                ))}
              </nav>
            </div>

            <div className="space-y-6">
              <h4 className="text-[11px] font-black uppercase tracking-[0.3em] text-white/90">Recursos</h4>
              <nav className="flex flex-col gap-3">
                {[
                  { label: 'Colloquium IA', route: AppRoute.STUDY_MODE },
                  { label: 'Suma Teológica', route: AppRoute.AQUINAS_OPERA },
                  { label: 'Certamen (Quiz)', route: AppRoute.CERTAMEN },
                  { label: 'Sobre', route: AppRoute.ABOUT },
                ].map(item => (
                  <button key={item.label} onClick={() => navigate(item.route)} className="text-left text-xs hover:text-primary transition-colors font-medium text-zinc-500 hover:pl-2 duration-300">
                    {item.label}
                  </button>
                ))}
              </nav>
            </div>
          </div>
        </div>

        {/* BOTTOM SECTION: INSTITUTIONAL & DIOCESE */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-16 pt-16 border-t border-white/5">
          {/* Institutional Cards */}
          <div className="bg-white/[0.02] border border-white/5 rounded-2xl p-6 space-y-6">
            <div className="flex items-center gap-4">
              <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center text-xl">🏛️</div>
              <div>
                <h4 className="text-xs font-bold text-white uppercase tracking-wider">Santa Sé</h4>
                <p className="text-[10px] text-zinc-500">Vaticano Official</p>
              </div>
            </div>
            <div className="space-y-2">
              {vaticanLinks.map((link, idx) => (
                <a key={idx} href={link.url} target="_blank" rel="noreferrer"
                  className="flex items-center justify-between group p-2 hover:bg-white/5 rounded-lg transition-all">
                  <span className="text-[11px] font-medium text-zinc-400 group-hover:text-primary transition-colors">{link.title}</span>
                  <Icons.ExternalLink className="w-3.5 h-3.5 opacity-0 group-hover:opacity-100 transition-opacity text-primary" />
                </a>
              ))}
            </div>
          </div>

          <div className="bg-white/[0.02] border border-white/5 rounded-2xl p-6 space-y-6">
            <div className="flex items-center gap-4">
              <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center text-xl">🇧🇷</div>
              <div>
                <h4 className="text-xs font-bold text-white uppercase tracking-wider">CNBB</h4>
                <p className="text-[10px] text-zinc-500">Bispos do Brasil</p>
              </div>
            </div>
            <div className="space-y-2">
              {cnbbLinks.map((link, idx) => (
                <a key={idx} href={link.url} target="_blank" rel="noreferrer"
                  className="flex items-center justify-between group p-2 hover:bg-white/5 rounded-lg transition-all">
                  <span className="text-[11px] font-medium text-zinc-400 group-hover:text-primary transition-colors">{link.title}</span>
                  <Icons.ExternalLink className="w-3.5 h-3.5 opacity-0 group-hover:opacity-100 transition-opacity text-primary" />
                </a>
              ))}
            </div>
          </div>

          <div className="bg-white/[0.02] border border-white/5 rounded-2xl p-6 space-y-6">
            <div className="flex items-center gap-4">
              <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center text-xl">⛪</div>
              <div>
                <h4 className="text-xs font-bold text-white uppercase tracking-wider">Minha Diocese</h4>
                <p className="text-[10px] text-zinc-500">Informações Locais</p>
              </div>
            </div>
            <div className="space-y-4">
              <select
                value={selectedDiocese}
                onChange={e => handleDioceseChange(e.target.value)}
                className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-zinc-400 text-xs focus:outline-none focus:border-primary/50 transition-all cursor-pointer appearance-none hover:bg-white/10"
              >
                <option value="" className="bg-[#0a0a0a]">Selecione sua diocese...</option>
                {DIOCESES_BR.map(d => (
                  <option key={d} value={d} className="bg-[#0a0a0a]">{d}</option>
                ))}
              </select>
              {selectedDiocese && (
                <div className="p-4 rounded-xl bg-primary/5 border border-primary/10 animate-in fade-in slide-in-from-top-2 duration-300">
                   <div className="flex items-center justify-between">
                     <p className="text-[11px] font-bold text-primary truncate max-w-[180px]">{selectedDiocese}</p>
                     {dioceseUrl && (
                        <a href={dioceseUrl} target="_blank" rel="noreferrer" className="text-[10px] font-black text-white hover:text-primary transition-colors uppercase tracking-widest bg-primary/20 px-2 py-1 rounded">
                          Site
                        </a>
                     )}
                   </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* COPYRIGHT BAR */}
        <div className="pt-10 border-t border-white/5 flex flex-col md:flex-row items-center justify-between gap-8">
          <div className="flex flex-col items-center md:items-start gap-4">
            <p className="text-[10px] font-bold text-zinc-600 uppercase tracking-[0.2em]">
              © {new Date().getFullYear()} CATHEDRA DIGITAL • AD MAIOREM DEI GLORIAM
            </p>
            <div className="flex flex-wrap items-center justify-center gap-x-6 gap-y-2">
              {[
                { label: 'Termos', route: AppRoute.ABOUT },
                { label: 'Privacidade', route: AppRoute.ABOUT },
                { label: 'Manifesto', route: AppRoute.ABOUT },
                { label: 'Suporte', onClick: () => window.location.href = 'mailto:suporte@cathedra.digital' }
              ].map((item) => (
                <button 
                  key={item.label} 
                  onClick={item.onClick || (() => navigate(item.route!))}
                  className="text-[10px] text-zinc-500 font-bold uppercase hover:text-white transition-colors tracking-wide"
                >
                  {item.label}
                </button>
              ))}
            </div>
          </div>
          
          <div className="flex items-center gap-8">
            <div className="hidden md:flex flex-col items-end gap-1">
              <p className="text-[9px] font-black text-zinc-700 uppercase tracking-widest">Soli Deo Gloria</p>
              <div className="h-0.5 w-12 bg-primary/30 rounded-full" />
            </div>
            <button 
              onClick={scrollToTop} 
              className="p-4 rounded-full bg-white/5 border border-white/10 hover:border-primary/50 text-primary transition-all group hover:scale-110 shadow-2xl backdrop-blur-sm"
              title="Voltar ao topo"
            >
              <Icons.ArrowDown className="w-5 h-5 rotate-180 group-hover:-translate-y-1 transition-transform" />
            </button>
          </div>
        </div>
      </div>
    </footer>
  );
});

Footer.displayName = 'Footer';

export default Footer;
