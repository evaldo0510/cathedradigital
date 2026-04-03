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
  const [selectedDiocese, setSelectedDiocese] = useState('');

  const vaticanLinks = [
    { title: 'Santa Sé (Vatican.va)', url: 'https://www.vatican.va', desc: 'Site oficial do Vaticano' },
    { title: 'Catecismo Online', url: 'https://www.vatican.va/archive/ccc/index_po.htm', desc: 'CIC em português' },
    { title: 'Nova Vulgata', url: 'https://www.vatican.va/archive/bible/nova_vulgata/documents/nova-vulgata_index_lt.html', desc: 'Bíblia em latim' },
    { title: 'Vatican News', url: 'https://www.vaticannews.va/pt.html', desc: 'Notícias do Papa e da Igreja' },
    { title: 'Libreria Editrice', url: 'https://www.libreriaeditricevaticana.va', desc: 'Publicações oficiais' },
    { title: 'Dicastérios', url: 'https://www.vatican.va/content/romancuria/pt.html', desc: 'Cúria Romana' },
  ];

  const cnbbLinks = [
    { title: 'CNBB', url: 'https://www.cnbb.org.br', desc: 'Conferência Nacional dos Bispos do Brasil' },
    { title: 'Liturgia Diária', url: 'https://www.cnbb.org.br/liturgia', desc: 'Leituras e evangelho do dia' },
    { title: 'Documentos CNBB', url: 'https://www.cnbb.org.br/category/publicacoes', desc: 'Publicações e orientações' },
    { title: 'Campanhas', url: 'https://www.cnbb.org.br/category/campanhas', desc: 'Campanhas nacionais da Igreja' },
  ];

  const scrollToTop = () => {
    document.getElementById('main-content')?.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const dioceseUrl = DIOCESE_URLS[selectedDiocese];

  return (
    <footer className="bg-foreground text-background/40 border-t border-background/5 pt-20 pb-10 px-6 relative overflow-hidden mt-auto">
      <div className="absolute inset-0 pointer-events-none opacity-[0.02] bg-[url('https://www.transparenttextures.com/patterns/natural-paper.png')]" />

      <div className="max-w-7xl mx-auto relative z-10">
        {/* MISSÃO, VISÃO, VALORES */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-10 mb-20 pb-14 border-b border-background/5">
          <div className="space-y-5">
            <div className="flex items-center gap-3 text-primary">
              <Icons.Star className="w-4 h-4 fill-current" />
              <h4 className="text-[9px] font-black uppercase tracking-[0.4em]">Missão</h4>
            </div>
            <p className="text-base font-serif italic text-background/50 leading-relaxed">
              "Propagar o Depósito da Fé através da síntese entre a Tradição e a tecnologia, iluminando a inteligência dos fiéis."
            </p>
          </div>
          <div className="space-y-5 md:border-x border-background/5 md:px-10">
            <div className="flex items-center gap-3 text-primary">
              <Icons.Globe className="w-4 h-4" />
              <h4 className="text-[9px] font-black uppercase tracking-[0.4em]">Visão</h4>
            </div>
            <p className="text-base font-serif italic text-background/50 leading-relaxed">
              "Tornar-se a referência global em curadoria teológica digital, unindo erudição escolástica e acessibilidade moderna."
            </p>
          </div>
          <div className="space-y-5">
            <div className="flex items-center gap-3 text-primary">
              <Icons.Cross className="w-4 h-4" />
              <h4 className="text-[9px] font-black uppercase tracking-[0.4em]">Valores</h4>
            </div>
            <ul className="space-y-2.5">
              {['Fidelidade ao Magistério', 'Rigor Intelectual', 'Excelência Técnica', 'Caridade na Verdade'].map(v => (
                <li key={v} className="flex items-center gap-3 text-sm font-serif text-background/30">
                  <div className="w-1 h-1 rounded-full bg-accent shadow-[0_0_6px_hsl(var(--accent))]" />
                  {v}
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* SITEMAP + INSTITUTIONAL LINKS */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-10 mb-20">
          {/* Brand column */}
          <div className="lg:col-span-2 space-y-6">
            <div className="flex items-center gap-4">
              <Logo className="w-14 h-14 border border-background/10 p-2 rounded-2xl bg-background/5 shadow-2xl" />
              <div>
                <h3 className="text-xl font-serif font-bold text-background tracking-widest leading-none">CATHEDRA</h3>
                <p className="text-[8px] font-black uppercase text-primary mt-1 tracking-[0.3em]">Digital Sanctuarium</p>
              </div>
            </div>
            <p className="text-sm font-serif italic text-background/25 leading-relaxed max-w-sm">
              "Ex Umbris Et Imaginibus In Veritatem." <br />
              Unindo a sabedoria milenar à Inteligência Teológica para o crescimento espiritual e intelectual.
            </p>
            <div className="flex gap-3 opacity-30">
              <div className="px-3 py-1 border border-background/20 rounded-full text-[7px] font-black uppercase tracking-widest">v4.5 PRO</div>
              <div className="px-3 py-1 border border-background/20 rounded-full text-[7px] font-black uppercase tracking-widest">SSL Secure</div>
            </div>
          </div>

          {/* Navigation links */}
          <div className="space-y-5">
            <h4 className="text-[9px] font-black uppercase tracking-[0.4em] text-background/80 border-l-2 border-accent pl-4">Formação</h4>
            <nav className="flex flex-col gap-2.5">
              {[
                { label: 'Bíblia Sagrada', route: AppRoute.BIBLE },
                { label: 'Catecismo (CIC)', route: AppRoute.CATECHISM },
                { label: 'Santos', route: AppRoute.SAINTS },
                { label: 'Magistério', route: AppRoute.MAGISTERIUM },
                { label: 'Trilhas de Estudo', route: AppRoute.TRILHAS },
              ].map(item => (
                <button key={item.label} onClick={() => navigate(item.route)} className="text-left text-xs hover:text-primary transition-colors font-bold opacity-50 hover:opacity-100 uppercase tracking-wide">
                  {item.label}
                </button>
              ))}
            </nav>
          </div>

          <div className="space-y-5">
            <h4 className="text-[9px] font-black uppercase tracking-[0.4em] text-background/80 border-l-2 border-primary pl-4">Vida Interior</h4>
            <nav className="flex flex-col gap-2.5">
              {[
                { label: 'Liturgia Diária', route: AppRoute.DAILY_LITURGY },
                { label: 'Missal Romano', route: AppRoute.MISSAL },
                { label: 'Santo Rosário', route: AppRoute.ROSARY },
                { label: 'Via Crucis', route: AppRoute.VIA_CRUCIS },
                { label: 'Favoritos', route: AppRoute.FAVORITES },
              ].map(item => (
                <button key={item.label} onClick={() => navigate(item.route)} className="text-left text-xs hover:text-primary transition-colors font-bold opacity-50 hover:opacity-100 uppercase tracking-wide">
                  {item.label}
                </button>
              ))}
            </nav>
          </div>

          <div className="space-y-5">
            <h4 className="text-[9px] font-black uppercase tracking-[0.4em] text-background/80 border-l-2 border-primary/40 pl-4">Recursos</h4>
            <nav className="flex flex-col gap-2.5">
              {[
                { label: 'Colloquium IA', route: AppRoute.STUDY_MODE },
                { label: 'Suma Teológica', route: AppRoute.AQUINAS_OPERA },
                { label: 'Certamen (Quiz)', route: AppRoute.CERTAMEN },
                { label: 'Sobre / Manifesto', route: AppRoute.ABOUT },
              ].map(item => (
                <button key={item.label} onClick={() => navigate(item.route)} className="text-left text-xs hover:text-primary transition-colors font-bold opacity-50 hover:opacity-100 uppercase tracking-wide">
                  {item.label}
                </button>
              ))}
            </nav>
          </div>
        </div>

        {/* INSTITUTIONAL LINKS: VATICAN, CNBB, DIOCESE */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-10 mb-16 pt-14 border-t border-background/5">
          {/* Vatican */}
          <div className="space-y-5">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center">
                <span className="text-sm">🏛️</span>
              </div>
              <div>
                <h4 className="text-[9px] font-black uppercase tracking-[0.3em] text-background/70">Santa Sé</h4>
                <p className="text-[8px] text-background/30">Vaticano</p>
              </div>
            </div>
            <div className="space-y-2">
              {vaticanLinks.map((link, idx) => (
                <a key={idx} href={link.url} target="_blank" rel="noreferrer"
                  className="flex items-center justify-between gap-2 px-3 py-2.5 rounded-xl hover:bg-background/5 transition-all group">
                  <div className="min-w-0">
                    <p className="text-[10px] font-bold text-background/60 group-hover:text-primary transition-colors uppercase tracking-wide truncate">{link.title}</p>
                    <p className="text-[9px] text-background/25 truncate">{link.desc}</p>
                  </div>
                  <Icons.ExternalLink className="w-3 h-3 text-background/20 group-hover:text-primary shrink-0 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-all" />
                </a>
              ))}
            </div>
          </div>

          {/* CNBB */}
          <div className="space-y-5">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center">
                <span className="text-sm">🇧🇷</span>
              </div>
              <div>
                <h4 className="text-[9px] font-black uppercase tracking-[0.3em] text-background/70">CNBB</h4>
                <p className="text-[8px] text-background/30">Conferência dos Bispos do Brasil</p>
              </div>
            </div>
            <div className="space-y-2">
              {cnbbLinks.map((link, idx) => (
                <a key={idx} href={link.url} target="_blank" rel="noreferrer"
                  className="flex items-center justify-between gap-2 px-3 py-2.5 rounded-xl hover:bg-background/5 transition-all group">
                  <div className="min-w-0">
                    <p className="text-[10px] font-bold text-background/60 group-hover:text-primary transition-colors uppercase tracking-wide truncate">{link.title}</p>
                    <p className="text-[9px] text-background/25 truncate">{link.desc}</p>
                  </div>
                  <Icons.ExternalLink className="w-3 h-3 text-background/20 group-hover:text-primary shrink-0 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-all" />
                </a>
              ))}
            </div>
          </div>

          {/* Diocese */}
          <div className="space-y-5">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center">
                <span className="text-sm">⛪</span>
              </div>
              <div>
                <h4 className="text-[9px] font-black uppercase tracking-[0.3em] text-background/70">Minha Diocese</h4>
                <p className="text-[8px] text-background/30">Escolha a sua diocese</p>
              </div>
            </div>
            <div className="space-y-3">
              <select
                value={selectedDiocese}
                onChange={e => setSelectedDiocese(e.target.value)}
                className="w-full px-4 py-3 rounded-xl bg-background/5 border border-background/10 text-background/70 text-xs focus:outline-none focus:border-primary/50 transition-colors appearance-none cursor-pointer"
              >
                <option value="" className="bg-foreground text-background/60">Selecione sua diocese...</option>
                {DIOCESES_BR.map(d => (
                  <option key={d} value={d} className="bg-foreground text-background/60">{d}</option>
                ))}
              </select>
              {selectedDiocese && (
                <div className="p-4 rounded-xl bg-background/5 border border-background/10 space-y-3">
                  <div className="flex items-center gap-2">
                    <Icons.Globe className="w-4 h-4 text-primary" />
                    <p className="text-xs font-bold text-background/70">{selectedDiocese}</p>
                  </div>
                  {dioceseUrl ? (
                    <a href={dioceseUrl} target="_blank" rel="noreferrer"
                      className="inline-flex items-center gap-2 text-[10px] font-bold text-primary hover:text-background transition-colors uppercase tracking-widest">
                      Visitar site oficial
                      <Icons.ExternalLink className="w-3 h-3" />
                    </a>
                  ) : (
                    <p className="text-[10px] text-background/30 italic">Site não cadastrado. Pesquise no Google pela sua diocese.</p>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* BOTTOM BAR */}
        <div className="pt-8 border-t border-background/5 flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="text-center md:text-left space-y-2">
            <p className="text-[8px] text-background/15 font-bold uppercase tracking-[0.2em]">
              © {new Date().getFullYear()} CATHEDRA DIGITAL • AD MAIOREM DEI GLORIAM
            </p>
            <div className="flex items-center gap-4 justify-center md:justify-start">
              {[
                { label: 'Manifesto', action: () => navigate(AppRoute.ABOUT) },
                { label: 'Termos de Uso', action: () => {} },
                { label: 'Privacidade', action: () => {} },
                { label: 'Suporte', action: () => {} },
              ].map((item, idx) => (
                <React.Fragment key={item.label}>
                  {idx > 0 && <div className="w-0.5 h-0.5 rounded-full bg-background/10" />}
                  <button onClick={item.action} className="text-[8px] text-background/20 font-black uppercase hover:text-primary transition-colors tracking-wide">
                    {item.label}
                  </button>
                </React.Fragment>
              ))}
            </div>
          </div>
          <div className="flex items-center gap-6">
            <div className="hidden md:flex flex-col items-end">
              <p className="text-[7px] font-black uppercase text-background/15 tracking-widest">Desenvolvimento</p>
              <p className="text-[9px] font-serif italic text-background/25">Ex Umbris In Veritatem</p>
            </div>
            <button onClick={scrollToTop} className="p-3 rounded-full bg-background/5 border border-background/10 hover:border-primary/50 shadow-xl transition-all group hover:scale-110">
              <Icons.ArrowDown className="w-4 h-4 rotate-180 text-primary group-hover:-translate-y-1 transition-transform" />
            </button>
          </div>
        </div>
      </div>
    </footer>
  );
});

Footer.displayName = 'Footer';

export default Footer;
