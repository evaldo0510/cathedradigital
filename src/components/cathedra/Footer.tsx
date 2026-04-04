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
    { title: 'Santa Sé', url: 'https://www.vatican.va' },
    { title: 'Catecismo', url: 'https://www.vatican.va/archive/ccc/index_po.htm' },
    { title: 'Vatican News', url: 'https://www.vaticannews.va/pt.html' },
    { title: 'Dicastérios', url: 'https://www.vatican.va/content/romancuria/pt.html' },
  ];

  const cnbbLinks = [
    { title: 'CNBB', url: 'https://www.cnbb.org.br' },
    { title: 'Liturgia Diária', url: 'https://www.cnbb.org.br/liturgia' },
    { title: 'Documentos', url: 'https://www.cnbb.org.br/category/publicacoes' },
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
    await new Promise(resolve => setTimeout(resolve, 1500));
    alert(`E-mail ${email} cadastrado com sucesso!`);
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
    <footer className="bg-[#050505] text-zinc-400 border-t border-white/5 pt-8 pb-8 px-6 md:px-12 relative mt-auto overflow-x-hidden">
      <div className="absolute inset-0 pointer-events-none opacity-[0.03] bg-[url('https://www.transparenttextures.com/patterns/natural-paper.png')]" />
      <div className="absolute top-0 left-1/4 w-[500px] h-[500px] bg-primary/5 rounded-full blur-[120px] pointer-events-none" />
      
      <div className="max-w-7xl mx-auto relative z-10 space-y-10">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 pb-8 border-b border-white/5 items-center">
          <div className="lg:col-span-4 space-y-4">
            <div className="flex items-center gap-4">
              <Logo className="w-10 h-10 border border-white/10 p-2 rounded-xl bg-white/5" />
              <div>
                <h3 className="text-xl font-serif font-bold text-white tracking-tight">CATHEDRA</h3>
                <p className="text-[8px] font-black uppercase text-primary tracking-[0.3em] opacity-80">Digital Sanctuarium</p>
              </div>
            </div>
            <p className="text-xs font-serif italic text-zinc-500 max-w-sm">
              "Ex Umbris Et Imaginibus In Veritatem." Sabedoria milenar e tecnologia.
            </p>
            <div className="flex gap-4">
              {[
                { icon: <Icons.Instagram className="w-4 h-4" />, url: 'https://instagram.com' },
                { icon: <Icons.Facebook className="w-4 h-4" />, url: 'https://facebook.com' },
                { icon: <Icons.Whatsapp className="w-4 h-4" />, url: 'https://wa.me' },
              ].map((social, i) => (
                <a key={i} href={social.url} target="_blank" rel="noopener noreferrer" className="text-zinc-500 hover:text-primary transition-all p-1.5 rounded-lg bg-white/5 border border-white/10">
                  {social.icon}
                </a>
              ))}
            </div>
          </div>

          <div className="lg:col-span-8">
            <div className="bg-white/[0.02] border border-white/5 rounded-2xl p-6 backdrop-blur-md">
              <div className="flex flex-col md:flex-row items-center gap-6">
                <div className="flex-1 space-y-1 text-center md:text-left">
                  <h4 className="text-base font-serif text-white font-bold">Boletim Informativo</h4>
                  <p className="text-[11px] text-zinc-500">Reflexões teológicas semanais.</p>
                </div>
                <form onSubmit={handleSubscribe} className="w-full md:w-auto flex flex-col sm:flex-row gap-2">
                  <input 
                    type="email" 
                    required
                    placeholder="Seu e-mail" 
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    disabled={isSubmitting}
                    className="flex-1 sm:w-48 px-4 py-2 rounded-lg bg-white/5 border border-white/10 text-white text-xs focus:outline-none focus:border-primary/50"
                  />
                  <button 
                    disabled={isSubmitting}
                    className="px-6 py-2 rounded-lg bg-primary text-black font-black uppercase text-[8px] tracking-widest hover:bg-primary/90 transition-all"
                  >
                    {isSubmitting ? '...' : 'Inscrever'}
                  </button>
                </form>
              </div>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 lg:grid-cols-12 gap-8 py-4">
          <div className="lg:col-span-3 space-y-4">
            <div className="flex items-center gap-2 text-primary">
              <Icons.Star className="w-3 h-3 fill-current" />
              <h4 className="text-[9px] font-black uppercase tracking-[0.2em]">Missão</h4>
            </div>
            <p className="text-[11px] font-serif italic text-zinc-500 border-l border-primary/20 pl-3">
              Propagar o Depósito da Fé através da síntese entre a Tradição e a tecnologia.
            </p>
          </div>

          <div className="lg:col-span-9 grid grid-cols-2 md:grid-cols-3 gap-8">
            <div className="space-y-4">
              <h4 className="text-[10px] font-black uppercase tracking-[0.2em] text-white/90">Formação</h4>
              <nav className="flex flex-col gap-2">
                {[{ label: 'Bíblia', route: AppRoute.BIBLE }, { label: 'Catecismo', route: AppRoute.CATECHISM }, { label: 'Santos', route: AppRoute.SAINTS }, { label: 'Magistério', route: AppRoute.MAGISTERIUM }].map(item => (
                  <button key={item.label} onClick={() => navigate(item.route)} className="text-left text-[11px] hover:text-primary transition-colors text-zinc-500 font-medium">{item.label}</button>
                ))}
              </nav>
            </div>
            <div className="space-y-4">
              <h4 className="text-[10px] font-black uppercase tracking-[0.2em] text-white/90">Vida Interior</h4>
              <nav className="flex flex-col gap-2">
                {[{ label: 'Liturgia', route: AppRoute.DAILY_LITURGY }, { label: 'Missal', route: AppRoute.MISSAL }, { label: 'Rosário', route: AppRoute.ROSARY }, { label: 'Via Crucis', route: AppRoute.VIA_CRUCIS }].map(item => (
                  <button key={item.label} onClick={() => navigate(item.route)} className="text-left text-[11px] hover:text-primary transition-colors text-zinc-500 font-medium">{item.label}</button>
                ))}
              </nav>
            </div>
            <div className="space-y-4">
              <h4 className="text-[10px] font-black uppercase tracking-[0.2em] text-white/90">Recursos</h4>
              <nav className="flex flex-col gap-2">
                {[{ label: 'Colloquium IA', route: AppRoute.STUDY_MODE }, { label: 'Suma Teológica', route: AppRoute.AQUINAS_OPERA }, { label: 'Quiz', route: AppRoute.CERTAMEN }, { label: 'Sobre', route: AppRoute.ABOUT }].map(item => (
                  <button key={item.label} onClick={() => navigate(item.route)} className="text-left text-[11px] hover:text-primary transition-colors text-zinc-500 font-medium">{item.label}</button>
                ))}
              </nav>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 pt-8 border-t border-white/5">
          <div className="bg-white/[0.02] border border-white/5 rounded-xl p-4 space-y-4">
            <div className="flex items-center gap-3">
              <span className="text-lg">🏛️</span>
              <h4 className="text-[10px] font-bold text-white uppercase tracking-wider">Santa Sé</h4>
            </div>
            <div className="grid grid-cols-2 gap-2">
              {vaticanLinks.map((link, idx) => (
                <a key={idx} href={link.url} target="_blank" rel="noreferrer" className="text-[10px] text-zinc-500 hover:text-primary truncate">{link.title}</a>
              ))}
            </div>
          </div>

          <div className="bg-white/[0.02] border border-white/5 rounded-xl p-4 space-y-4">
            <div className="flex items-center gap-3">
              <span className="text-lg">🇧🇷</span>
              <h4 className="text-[10px] font-bold text-white uppercase tracking-wider">CNBB</h4>
            </div>
            <div className="grid grid-cols-2 gap-2">
              {cnbbLinks.map((link, idx) => (
                <a key={idx} href={link.url} target="_blank" rel="noreferrer" className="text-[10px] text-zinc-500 hover:text-primary truncate">{link.title}</a>
              ))}
            </div>
          </div>

          <div className="bg-white/[0.02] border border-white/5 rounded-xl p-4 space-y-4">
            <div className="flex items-center gap-3">
              <span className="text-lg">⛪</span>
              <h4 className="text-[10px] font-bold text-white uppercase tracking-wider">Diocese</h4>
            </div>
            <select
              value={selectedDiocese}
              onChange={e => handleDioceseChange(e.target.value)}
              className="w-full px-3 py-1.5 rounded-lg bg-white/5 border border-white/10 text-zinc-400 text-[10px] focus:outline-none appearance-none hover:bg-white/10"
            >
              <option value="" className="bg-[#0a0a0a]">Sua diocese...</option>
              {DIOCESES_BR.map(d => (
                <option key={d} value={d} className="bg-[#0a0a0a]">{d}</option>
              ))}
            </select>
          </div>
        </div>

        <div className="pt-8 border-t border-white/5 flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="flex items-center gap-6 text-[9px] font-bold uppercase tracking-[0.2em] text-zinc-600">
            <span>© {new Date().getFullYear()} CATHEDRA</span>
            <button onClick={() => navigate(AppRoute.ABOUT)} className="hover:text-primary">Privacidade</button>
            <button onClick={() => navigate(AppRoute.ABOUT)} className="hover:text-primary">Termos</button>
          </div>
          <button 
            onClick={scrollToTop}
            className="p-3 bg-white/5 border border-white/10 rounded-xl hover:bg-primary hover:text-black transition-all"
          >
            <Icons.ArrowDown className="w-4 h-4 rotate-180" />
          </button>
        </div>
      </div>
      <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-primary/30 to-transparent" />
    </footer>
  );
});

Footer.displayName = 'Footer';

export default Footer;