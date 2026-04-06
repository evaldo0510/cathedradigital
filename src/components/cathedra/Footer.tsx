import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Icons, Logo } from '../../constants';
import { AppRoute } from '../../types';

const DIOCESES_BR = [
  // Arquidioceses de SP
  'Arquidiocese de São Paulo',
  'Arquidiocese de Campinas',
  'Arquidiocese de Aparecida',
  'Arquidiocese de Botucatu',
  'Arquidiocese de Ribeirão Preto',
  'Arquidiocese de Sorocaba',
  // Dioceses de SP
  'Diocese de Bauru',
  'Diocese de Campo Limpo',
  'Diocese de Caraguatatuba',
  'Diocese de Catanduva',
  'Diocese de Franca',
  'Diocese de Guarulhos',
  'Diocese de Itapetininga',
  'Diocese de Itapeva',
  'Diocese de Jaú',
  'Diocese de Jundiaí',
  'Diocese de Limeira',
  'Diocese de Lins',
  'Diocese de Marília',
  'Diocese de Mogi das Cruzes',
  'Diocese de Osasco',
  'Diocese de Ourinhos',
  'Diocese de Piracicaba',
  'Diocese de Presidente Prudente',
  'Diocese de Registro',
  'Diocese de Santo Amaro',
  'Diocese de Santo André',
  'Diocese de Santos',
  'Diocese de São Carlos',
  'Diocese de São José do Rio Preto',
  'Diocese de São José dos Campos',
  'Diocese de São Miguel Paulista',
  'Diocese de Taubaté',
  'Diocese de Votuporanga',
  // Outras Arquidioceses
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
  'Arquidiocese de Florianópolis',
  'Arquidiocese de Vitória',
  'Arquidiocese de Natal',
  'Arquidiocese de São Luís do Maranhão',
  // Outras Dioceses
  'Diocese de Joinville',
  'Diocese de Caxias do Sul',
  'Diocese de Juiz de Fora',
  'Diocese de Uberlândia',
  'Diocese de Maringá',
  'Diocese de Londrina',
];

const DIOCESE_URLS: Record<string, string> = {
  'Arquidiocese de São Paulo': 'https://www.arquisp.org.br',
  'Arquidiocese de Campinas': 'https://www.arquidiocesecampinas.com',
  'Arquidiocese de Aparecida': 'https://www.arquidiocesedeaparecida.org.br',
  'Arquidiocese de Botucatu': 'https://www.diocesedebotucatu.org.br',
  'Arquidiocese de Ribeirão Preto': 'https://www.dioceseribeirao.org.br',
  'Arquidiocese de Sorocaba': 'https://www.diocesedesorocaba.com.br',
  'Diocese de Bauru': 'https://www.diocesedebauru.com.br',
  'Diocese de Campo Limpo': 'https://www.diocesedecampolimpo.org.br',
  'Diocese de Caraguatatuba': 'https://www.diocesedecaraguatatuba.org.br',
  'Diocese de Catanduva': 'https://www.diocesedecatanduva.org.br',
  'Diocese de Franca': 'https://www.diocesedefranca.org.br',
  'Diocese de Guarulhos': 'https://www.diocesedeguarulhos.org.br',
  'Diocese de Itapetininga': 'https://www.diocesedeitapetininga.org.br',
  'Diocese de Itapeva': 'https://www.diocesedeitapeva.org.br',
  'Diocese de Jaú': 'https://www.diocesedejau.org.br',
  'Diocese de Jundiaí': 'https://www.diocesedejundiai.org.br',
  'Diocese de Limeira': 'https://www.diocesedelimeira.org.br',
  'Diocese de Lins': 'https://www.diocesedelins.org.br',
  'Diocese de Marília': 'https://www.diocesedemarilia.org.br',
  'Diocese de Mogi das Cruzes': 'https://www.diocesedemogi.org.br',
  'Diocese de Osasco': 'https://www.diocesedeosasco.com.br',
  'Diocese de Ourinhos': 'https://www.diocesedeourinhos.org.br',
  'Diocese de Piracicaba': 'https://www.diocesedepiracicaba.org.br',
  'Diocese de Presidente Prudente': 'https://www.diocesedepprudente.org.br',
  'Diocese de Registro': 'https://www.diocesederegistro.org.br',
  'Diocese de Santo Amaro': 'https://www.diocesesantoamaro.org.br',
  'Diocese de Santo André': 'https://www.diocesesantoandre.org.br',
  'Diocese de Santos': 'https://www.diocesedesantos.com.br',
  'Diocese de São Carlos': 'https://www.diocesesaocarlos.org.br',
  'Diocese de São José do Rio Preto': 'https://www.diocesesjriopreto.org.br',
  'Diocese de São José dos Campos': 'https://www.diocesedesjc.org.br',
  'Diocese de São Miguel Paulista': 'https://www.diocesedesaomiguel.org.br',
  'Diocese de Taubaté': 'https://www.diocesedetaubate.org.br',
  'Diocese de Votuporanga': 'https://www.diocesedevotuporanga.org.br',
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
  'Arquidiocese de Florianópolis': 'https://www.arquifln.org.br',
  'Arquidiocese de Vitória': 'https://www.aves.org.br',
  'Arquidiocese de Natal': 'https://www.arquidiocesedenatal.org.br',
  'Arquidiocese de São Luís do Maranhão': 'https://www.arquidiocesesaoluis.org.br',
};

const Footer: React.FC = React.memo(() => {
  const navigate = useNavigate();
  const [selectedDiocese, setSelectedDiocese] = useState(() => localStorage.getItem('cathedra_diocese') || '');
  const [email, setEmail] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const vaticanLinks = [
    { title: 'Santa Sé (Vatican)', url: 'https://www.vatican.va' },
    { title: 'Catecismo Oficial', url: 'https://www.vatican.va/archive/ccc/index_po.htm' },
    { title: 'Vatican News', url: 'https://www.vaticannews.va/pt.html' },
    { title: 'Dicastérios', url: 'https://www.vatican.va/content/romancuria/pt.html' },
  ];

  const cnbbLinks = [
    { title: 'CNBB Oficial', url: 'https://www.cnbb.org.br' },
    { title: 'Liturgia Diária CNBB', url: 'https://www.cnbb.org.br/liturgia' },
    { title: 'Documentos e Publicações', url: 'https://www.cnbb.org.br/category/publicacoes' },
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
    <footer className="mt-auto w-full border-t border-primary/10 pt-6 lg:pt-12 pb-28 lg:pb-12 px-4 sm:px-6 md:px-12 bg-foreground/[0.03] backdrop-blur-sm relative overflow-hidden">
      <div className="absolute inset-0 pointer-events-none opacity-[0.02]" />
      
      <div className="max-w-7xl mx-auto relative z-10">

        {/* ─── Mobile Footer (compact) ─── */}
        <div className="lg:hidden">
          <div className="flex items-center gap-3 mb-4">
            <Logo className="w-8 h-8 border border-primary/20 p-1 rounded-lg bg-primary/5" />
            <div>
              <h3 className="text-base font-serif font-bold text-foreground tracking-tight">CATHEDRA</h3>
              <p className="text-[7px] font-black uppercase text-primary tracking-[0.3em]">Digital Sanctuarium</p>
            </div>
          </div>

          {/* Compact links row */}
          <div className="grid grid-cols-2 gap-x-4 gap-y-2 mb-4">
            <div>
              <h4 className="text-[9px] font-black uppercase tracking-wider text-primary mb-1.5">🏛️ Santa Sé</h4>
              {vaticanLinks.slice(0, 2).map(link => (
                <a key={link.title} href={link.url} target="_blank" rel="noopener noreferrer" className="block text-[10px] text-muted-foreground dark:text-muted-foreground/80 hover:text-foreground hover:text-primary py-0.5 truncate">
                  {link.title}
                </a>
              ))}
            </div>
            <div>
              <h4 className="text-[9px] font-black uppercase tracking-wider text-primary mb-1.5">🇧🇷 CNBB</h4>
              {cnbbLinks.slice(0, 2).map(link => (
                <a key={link.title} href={link.url} target="_blank" rel="noopener noreferrer" className="block text-[10px] text-muted-foreground dark:text-muted-foreground/80 hover:text-primary py-0.5 truncate">
                  {link.title}
                </a>
              ))}
            </div>
          </div>

          {/* Diocese + Newsletter compact */}
          <div className="grid grid-cols-2 gap-3 mb-4">
            <select 
              value={selectedDiocese}
              onChange={(e) => handleDioceseChange(e.target.value)}
              className="w-full bg-foreground/5 border border-foreground/10 rounded-lg px-2 py-1.5 text-[10px] text-foreground focus:outline-none focus:border-primary/50 cursor-pointer appearance-none"
            >
              <option value="">Sua Diocese</option>
              {DIOCESES_BR.map(d => (
                <option key={d} value={d}>{d}</option>
              ))}
            </select>
            <form onSubmit={handleSubscribe} className="relative">
              <input 
                type="email" 
                placeholder="Seu e-mail" 
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="w-full bg-foreground/5 border border-foreground/10 rounded-lg pl-2 pr-8 py-1.5 text-[10px] focus:outline-none focus:border-primary/50"
              />
              <button type="submit" disabled={isSubmitting} className="absolute right-1 top-1 bottom-1 px-1.5 bg-primary text-primary-foreground rounded text-xs">
                →
              </button>
            </form>
          </div>

          {/* Links + Social + bottom bar */}
          <div className="flex flex-col gap-3 pt-3 border-t border-foreground/10 dark:border-foreground/15">
            <div className="flex items-center gap-4">
              {[{ label: 'Sobre', route: AppRoute.ABOUT }, { label: 'Termos', route: AppRoute.TERMS }, { label: 'Privacidade', route: AppRoute.PRIVACY }].map(item => (
                <button 
                  key={item.label} 
                  onClick={() => navigate(item.route)} 
                  className="text-[8px] font-black uppercase tracking-widest text-muted-foreground dark:text-muted-foreground/80 hover:text-primary transition-colors"
                >
                  {item.label}
                </button>
              ))}
            </div>
            <div className="flex items-center justify-between">
              <p className="text-[7px] font-black uppercase tracking-widest text-muted-foreground/50 dark:text-muted-foreground/70">
                © {new Date().getFullYear()} CATHEDRA •{' '}
                <span onClick={() => navigate(AppRoute.ADMIN)} className="cursor-default hover:text-primary/60 transition-colors select-none">
                  evaldo.os
                </span>
              </p>
              <div className="flex items-center gap-2">
                {[
                  { icon: <Icons.Instagram className="w-3 h-3" />, url: 'https://instagram.com' },
                  { icon: <Icons.Youtube className="w-3 h-3" />, url: 'https://youtube.com' },
                  { icon: <Icons.Whatsapp className="w-3 h-3" />, url: 'https://wa.me' },
                ].map((social, i) => (
                  <a key={i} href={social.url} target="_blank" rel="noopener noreferrer" className="text-muted-foreground dark:text-foreground/70 hover:text-primary p-1.5 rounded bg-foreground/5 dark:bg-foreground/10 border border-foreground/10 dark:border-foreground/20 transition-colors">
                    {social.icon}
                  </a>
                ))}
                <button onClick={scrollToTop} className="p-1.5 bg-foreground/5 dark:bg-foreground/10 hover:bg-primary hover:text-primary-foreground rounded border border-foreground/10 dark:border-foreground/20 ml-1 transition-colors">
                  <Icons.ArrowDown className="w-3 h-3 rotate-180" />
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* ─── Desktop Footer (full) ─── */}
        <div className="hidden lg:block">
          <div className="grid grid-cols-4 gap-12 mb-16">
            {/* Brand Column */}
            <div className="flex flex-col gap-6">
              <div className="flex items-center gap-4">
                <Logo className="w-12 h-12 border border-primary/20 p-2 rounded-xl bg-primary/5" />
                <div>
                  <h3 className="text-xl font-serif font-bold text-foreground tracking-tight">CATHEDRA</h3>
                  <p className="text-[9px] font-black uppercase text-primary tracking-[0.3em]">Digital Sanctuarium</p>
                </div>
              </div>
              <p className="text-sm text-muted-foreground leading-relaxed max-w-xs">
                Uma plataforma dedicada ao estudo, oração e vivência da fé católica, 
                unindo a tradição milenar à tecnologia moderna.
              </p>
              <div className="flex gap-3">
                {[
                  { icon: <Icons.Instagram className="w-4 h-4" />, url: 'https://instagram.com' },
                  { icon: <Icons.Youtube className="w-4 h-4" />, url: 'https://youtube.com' },
                  { icon: <Icons.Whatsapp className="w-4 h-4" />, url: 'https://wa.me' },
                ].map((social, i) => (
                  <a key={i} href={social.url} target="_blank" rel="noopener noreferrer" className="text-muted-foreground dark:text-foreground/70 hover:text-primary transition-all p-2 rounded-lg bg-foreground/5 dark:bg-foreground/10 border border-foreground/10 dark:border-foreground/20 hover:border-primary/30">
                    {social.icon}
                  </a>
                ))}
              </div>
            </div>

            {/* Links Column - Vatican */}
            <div>
              <h4 className="text-[11px] font-black uppercase tracking-[0.2em] text-primary mb-6 flex items-center gap-2">
                <span className="text-lg">🏛️</span> Santa Sé
              </h4>
              <ul className="flex flex-col gap-4">
                {vaticanLinks.map(link => (
                  <li key={link.title}>
                    <a href={link.url} target="_blank" rel="noopener noreferrer" className="text-sm text-muted-foreground dark:text-muted-foreground/80 hover:text-primary transition-colors flex items-center gap-2 group">
                      <span className="w-1 h-1 rounded-full bg-primary/30 group-hover:bg-primary transition-colors" />
                      {link.title}
                    </a>
                  </li>
                ))}
              </ul>
            </div>

            {/* Links Column - CNBB */}
            <div>
              <h4 className="text-[11px] font-black uppercase tracking-[0.2em] text-primary mb-6 flex items-center gap-2">
                <span className="text-lg">🇧🇷</span> CNBB
              </h4>
              <ul className="flex flex-col gap-4">
                {cnbbLinks.map(link => (
                  <li key={link.title}>
                    <a href={link.url} target="_blank" rel="noopener noreferrer" className="text-sm text-muted-foreground dark:text-muted-foreground/80 hover:text-primary transition-colors flex items-center gap-2 group">
                      <span className="w-1 h-1 rounded-full bg-primary/30 group-hover:bg-primary transition-colors" />
                      {link.title}
                    </a>
                  </li>
                ))}
              </ul>
            </div>

            {/* Newsletter / Diocese Column */}
            <div className="flex flex-col gap-8">
              <div>
                <h4 className="text-[11px] font-black uppercase tracking-[0.2em] text-primary mb-4">Sua Diocese</h4>
                <select 
                  value={selectedDiocese}
                  onChange={(e) => handleDioceseChange(e.target.value)}
                  className="w-full bg-foreground/5 border border-foreground/10 rounded-xl px-4 py-2.5 text-sm text-foreground focus:outline-none focus:border-primary/50 transition-colors cursor-pointer appearance-none"
                >
                  <option value="">Selecione sua Diocese</option>
                  {DIOCESES_BR.map(d => (
                    <option key={d} value={d}>{d}</option>
                  ))}
                </select>
                {dioceseUrl && (
                  <a href={dioceseUrl} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-2 mt-3 text-xs text-primary hover:underline">
                    Acessar portal <Icons.ExternalLink className="w-3 h-3" />
                  </a>
                )}
              </div>
              <div>
                <h4 className="text-[11px] font-black uppercase tracking-[0.2em] text-primary mb-4">Boletim Informativo</h4>
                <p className="text-xs text-muted-foreground mb-4 leading-relaxed">
                  Receba reflexões teológicas e atualizações da plataforma em seu e-mail.
                </p>
                <form onSubmit={handleSubscribe} className="relative">
                  <input 
                    type="email" 
                    placeholder="Seu melhor e-mail" 
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    className="w-full bg-foreground/5 border border-foreground/10 rounded-xl pl-4 pr-12 py-2.5 text-sm focus:outline-none focus:border-primary/50 transition-colors"
                  />
                  <button 
                    type="submit" 
                    disabled={isSubmitting}
                    className="absolute right-1 top-1 bottom-1 px-3 bg-primary text-primary-foreground rounded-lg hover:scale-105 transition-all disabled:opacity-50"
                  >
                    {isSubmitting ? (
                      <div className="w-4 h-4 border-2 border-primary-foreground border-t-transparent rounded-full animate-spin" />
                    ) : (
                      <Icons.ArrowDown className="w-4 h-4 -rotate-90" />
                    )}
                  </button>
                </form>
              </div>
            </div>
          </div>

          {/* Bottom Bar */}
          <div className="pt-8 border-t border-foreground/10 dark:border-foreground/15 flex flex-row items-center justify-between gap-6">
            <p className="text-[9px] font-black uppercase tracking-[0.3em] text-muted-foreground/60 dark:text-muted-foreground/70">
              © {new Date().getFullYear()} CATHEDRA • OMNIA AD MAIOREM DEI GLORIAM •{' '}
              <span onClick={() => navigate(AppRoute.ADMIN)} className="cursor-default hover:text-primary/60 transition-colors select-none">
                evaldo.os
              </span>
            </p>
            <div className="flex items-center gap-8">
              <nav className="flex items-center gap-6">
                {[{ label: 'Sobre', route: AppRoute.ABOUT }, { label: 'Privacidade', route: AppRoute.PRIVACY }, { label: 'Termos', route: AppRoute.TERMS }].map(item => (
                  <button 
                    key={item.label} 
                    onClick={() => navigate(item.route)} 
                    className="text-[9px] font-black uppercase tracking-[0.2em] text-muted-foreground dark:text-muted-foreground/80 hover:text-primary transition-colors"
                  >
                    {item.label}
                  </button>
                ))}
              </nav>
              <button onClick={scrollToTop} className="p-2.5 bg-foreground/5 dark:bg-foreground/10 hover:bg-primary hover:text-primary-foreground rounded-lg transition-all border border-foreground/10 dark:border-foreground/20 group">
                <Icons.ArrowDown className="w-4 h-4 rotate-180" />
              </button>
            </div>
          </div>
        </div>

      </div>
    </footer>
  );
});

Footer.displayName = 'Footer';

export default Footer;