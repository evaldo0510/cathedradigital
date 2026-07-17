import { Button } from '@/components/ui/button';
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Icons } from '../../constants';
import { AppRoute } from '../../types';
import { useLang } from '@/hooks/useLang';
import { useIsAdmin } from '@/hooks/useIsAdmin';
import { SOCIAL_LINKS, EXTERNAL_URLS } from '@/config/site-config';
import { trackEvent } from '@/lib/analytics';
import { APP_ROUTES } from '@/config/routes';



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
  const { t, lang } = useLang();
  const { isAdmin } = useIsAdmin();
  const [selectedDiocese, setSelectedDiocese] = useState(() => localStorage.getItem('cathedra_diocese') || '');
  const [email, setEmail] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);


  const vaticanLinks = [
    { title: 'Santa Sé (Vatican)', url: EXTERNAL_URLS.VATICAN },
    { title: lang === 'pt' ? 'Catecismo Oficial' : 'Official Catechism', url: EXTERNAL_URLS.CATECHISM_OFFICIAL },
    { title: 'Vatican News', url: EXTERNAL_URLS.VATICAN_NEWS },
    { title: lang === 'pt' ? 'Dicastérios' : 'Dicasteries', url: `${EXTERNAL_URLS.VATICAN}/content/romancuria/pt.html` },
  ];

  const cnbbLinks = [
    { title: 'CNBB Oficial', url: EXTERNAL_URLS.CNBB },
    { title: lang === 'pt' ? 'Liturgia Diária CNBB' : 'CNBB Daily Liturgy', url: `${EXTERNAL_URLS.CNBB}/liturgia` },
    { title: lang === 'pt' ? 'Documentos e Publicações' : 'Documents & Publications', url: `${EXTERNAL_URLS.CNBB}/category/publicacoes` },
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
    trackEvent('newsletter_signup', { email });
    await new Promise(resolve => setTimeout(resolve, 1500));
    alert(lang === 'pt' ? `E-mail ${email} cadastrado com sucesso!` : `Email ${email} registered successfully!`);
    setEmail('');
    setIsSubmitting(false);
  };

  const handleDioceseChange = (val: string) => {
    setSelectedDiocese(val);
    if (val) localStorage.setItem('cathedra_diocese', val);
    else localStorage.removeItem('cathedra_diocese');
  };

  const handleSocialClick = (platform: string, url: string) => {
    trackEvent('social_link_click', { platform, url });
  };

  const dioceseUrl = DIOCESE_URLS[selectedDiocese];

  return (
    <footer className="mt-auto w-full border-t border-border/10 pt-spacing-4xl lg:pt-spacing-4xl pb-spacing-4xl lg:pb-spacing-4xl bg-background relative overflow-hidden contain-layout footer-reading-auto-hide" style={{ contentVisibility: 'auto', containIntrinsicSize: '0 520px' }} aria-label="Rodapé">
      <div className="absolute inset-0 pointer-events-none opacity-[0.01]" />
      
      <div className="w-full relative z-10 px-spacing-xl md:px-spacing-2xl">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-spacing-3xl lg:gap-spacing-4xl mb-spacing-4xl">
          
          <div className="flex flex-col gap-spacing-xl">
             <div className="flex flex-col gap-2">
               <div className="flex items-baseline gap-2">
                 <span className="text-[10px]" style={{ color: '#c9a84c' }} aria-hidden="true">●</span>
                 <span
                   style={{
                     fontFamily: "'Playfair Display', serif",
                     fontWeight: 500,
                     fontSize: 'clamp(1.5rem, 2.5vw, 2rem)',
                     letterSpacing: '0.14em',
                     color: 'hsl(var(--foreground))',
                     lineHeight: 1,
                   }}
                 >
                   CATHEDRA
                 </span>
               </div>
               <span
                 className="pl-4"
                 style={{
                   color: '#c9a84c',
                   fontFamily: 'Inter, sans-serif',
                   fontSize: '9px',
                   letterSpacing: '0.4em',
                   textTransform: 'uppercase',
                 }}
               >
                 Digital Sanctuarium
               </span>
            </div>
            <p
              style={{
                fontFamily: "'Playfair Display', serif",
                fontStyle: 'italic',
                fontSize: '0.95rem',
                color: 'hsl(var(--muted-foreground))',
                lineHeight: 1.65,
              }}
            >
              {lang === 'pt' 
                ? 'Uma plataforma dedicada ao estudo, oração e vivência da fé católica — unindo a tradição milenar à tecnologia moderna.'
                : 'A platform dedicated to the study, prayer, and living of the Catholic faith, uniting ancient tradition with modern technology.'}
            </p>
            <div className="flex gap-3">
              {[
                { icon: <Icons.Instagram />, platform: 'Instagram', url: SOCIAL_LINKS.INSTAGRAM },
                { icon: <Icons.Youtube />, platform: 'Youtube', url: SOCIAL_LINKS.YOUTUBE },
                { icon: <Icons.Whatsapp />, platform: 'Whatsapp', url: SOCIAL_LINKS.WHATSAPP },
              ].map((social, i) => (
                <Button
                  key={i}
                  variant="ghost"
                  size="icon"
                  asChild
                  className="rounded-none w-11 h-11 p-0 flex items-center justify-center transition-all"
                  style={{ border: '1px solid rgba(201,168,76,0.35)', color: '#c9a84c' }}
                >
                  <a
                    href={social.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    onClick={() => handleSocialClick(social.platform, social.url)}
                    aria-label={social.platform}
                    onMouseEnter={(e) => { e.currentTarget.style.background = '#c9a84c'; e.currentTarget.style.color = '#0a0a0a'; }}
                    onMouseLeave={(e) => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = '#c9a84c'; }}
                  >
                    {social.icon}
                  </a>
                </Button>
              ))}
            </div>
          </div>

          <div>
            <h4
              className="mb-spacing-lg"
              style={{ color: '#c9a84c', fontFamily: 'Inter, sans-serif', fontSize: '10px', letterSpacing: '0.32em', textTransform: 'uppercase' }}
            >
              — Santa Sé
            </h4>
            <ul className="flex flex-col gap-3" role="list">
              {vaticanLinks.map(link => (
                <li key={link.title}>
                  <Button variant="link" asChild className="text-premium-sm text-muted-foreground hover:text-[#c9a84c] transition-colors flex items-center justify-start p-0 h-auto gap-2 group decoration-transparent">
                    <a href={link.url} target="_blank" rel="noopener noreferrer">
                      <span className="w-1 h-1 rounded-none bg-[#c9a84c]/40 group-hover:bg-[#c9a84c] transition-colors" />
                      {link.title}
                    </a>
                  </Button>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h4
              className="mb-spacing-lg"
              style={{ color: '#c9a84c', fontFamily: 'Inter, sans-serif', fontSize: '10px', letterSpacing: '0.32em', textTransform: 'uppercase' }}
            >
              — CNBB
            </h4>
            <ul className="flex flex-col gap-3" role="list">
              {cnbbLinks.map(link => (
                <li key={link.title}>
                  <Button variant="link" asChild className="text-premium-sm text-muted-foreground hover:text-[#c9a84c] transition-colors flex items-center justify-start p-0 h-auto gap-2 group decoration-transparent">
                    <a href={link.url} target="_blank" rel="noopener noreferrer">
                      <span className="w-1 h-1 rounded-none bg-[#c9a84c]/40 group-hover:bg-[#c9a84c] transition-colors" />
                      {link.title}
                    </a>
                  </Button>
                </li>
              ))}
            </ul>
          </div>

          <div className="flex flex-col gap-spacing-xl">
            <div>
              <h4
                className="mb-spacing-md"
                style={{ color: '#c9a84c', fontFamily: 'Inter, sans-serif', fontSize: '10px', letterSpacing: '0.32em', textTransform: 'uppercase' }}
              >
                — {lang === 'pt' ? 'Sua Diocese' : 'Your Diocese'}
              </h4>
              <select 
                value={selectedDiocese}
                onChange={(e) => handleDioceseChange(e.target.value)}
                aria-label={lang === 'pt' ? 'Selecione sua Diocese' : 'Select your Diocese'}
                className="w-full bg-transparent px-0 py-2 text-premium-sm text-foreground focus:outline-none transition-colors cursor-pointer appearance-none"
                style={{ borderBottom: '1px solid rgba(201,168,76,0.4)', fontFamily: "'Playfair Display', serif", fontStyle: 'italic' }}
              >
                <option value="">{lang === 'pt' ? 'Selecione sua Diocese' : 'Select your Diocese'}</option>
                {DIOCESES_BR.map(d => (
                  <option key={d} value={d}>{d}</option>
                ))}
              </select>
              {dioceseUrl && (
                <Button variant="link" size="sm" asChild className="inline-flex items-center gap-2 mt-3 p-0 h-auto text-premium-xs hover:underline" style={{ color: '#c9a84c' }}>
                  <a href={dioceseUrl} target="_blank" rel="noopener noreferrer">
                    {lang === 'pt' ? 'Acessar portal' : 'Access portal'} <Icons.ExternalLink className="w-3 h-3" />
                  </a>
                </Button>
              )}
            </div>
            <div>
              <h4
                className="mb-spacing-md"
                style={{ color: '#c9a84c', fontFamily: 'Inter, sans-serif', fontSize: '10px', letterSpacing: '0.32em', textTransform: 'uppercase' }}
              >
                — {lang === 'pt' ? 'Boletim' : 'Newsletter'}
              </h4>
              <p
                className="mb-3"
                style={{ fontFamily: "'Playfair Display', serif", fontStyle: 'italic', fontSize: '0.85rem', color: 'hsl(var(--muted-foreground))', lineHeight: 1.6 }}
              >
                {lang === 'pt' 
                  ? 'Reflexões teológicas e atualizações da plataforma em seu e-mail.'
                  : 'Theological reflections and platform updates in your email.'}
              </p>
              <form onSubmit={handleSubscribe} className="relative flex items-stretch gap-0">
                <input 
                  type="email" 
                  placeholder={lang === 'pt' ? "Seu e-mail" : "Your email"}
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  className="flex-1 bg-transparent px-0 py-2 pr-3 text-premium-sm focus:outline-none transition-colors"
                  style={{ borderBottom: '1px solid rgba(201,168,76,0.4)', fontFamily: "'Playfair Display', serif", fontStyle: 'italic' }}
                />
                <Button 
                  type="submit" 
                  disabled={isSubmitting}
                  aria-label={lang === 'pt' ? 'Inscrever no boletim informativo' : 'Subscribe to newsletter'}
                  className="rounded-none bg-transparent transition-all disabled:opacity-50 min-w-[44px] min-h-[44px] px-3 flex items-center justify-center"
                  style={{ border: '1px solid #c9a84c', color: '#c9a84c' }}
                  onMouseEnter={(e) => { if (!isSubmitting) { e.currentTarget.style.background = '#c9a84c'; e.currentTarget.style.color = '#0a0a0a'; }}}
                  onMouseLeave={(e) => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = '#c9a84c'; }}
                >
                  {isSubmitting ? (
                    <div className="w-4 h-4 border-2 border-[#c9a84c] border-t-transparent rounded-full animate-spin" />
                  ) : (
                    <Icons.ArrowDown className="-rotate-90" />
                  )}
                </Button>
              </form>
            </div>
          </div>
        </div>



        <div className="pt-spacing-3xl flex flex-col md:flex-row items-center justify-between gap-spacing-xl" style={{ borderTop: '1px solid rgba(201,168,76,0.25)' }}>
          <div className="flex flex-col items-center md:items-start gap-3">
            <p
              style={{ color: 'hsl(var(--muted-foreground))', fontFamily: 'Inter, sans-serif', fontSize: '10px', letterSpacing: '0.32em', textTransform: 'uppercase' }}
            >
              © {new Date().getFullYear()} <span style={{ color: '#c9a84c' }}>●</span> Cathedra <span style={{ color: '#c9a84c' }}>·</span> Omnia ad maiorem Dei gloriam
            </p>
            <p
              className="flex items-center gap-2"
              style={{ fontFamily: "'Playfair Display', serif", fontStyle: 'italic', fontSize: '0.85rem', color: 'hsl(var(--muted-foreground))' }}
            >
              {lang === 'pt' ? 'Criado por' : 'Created by'}
              <Button 
                onClick={() => navigate(AppRoute.ADMIN)} 
                className="cursor-pointer select-none p-0 h-auto bg-transparent hover:bg-transparent transition-colors"
                style={{ color: '#c9a84c', fontFamily: "'Playfair Display', serif", fontStyle: 'italic' }}
              >
                Evaldo.os
              </Button>
            </p>
          </div>
          <div className="flex items-center gap-6">
            <nav className="flex items-center" aria-label="Links institucionais">
              {APP_ROUTES.filter(r => r.category === 'user' && !r.showInMenu).map((item, index, array) => (
                <React.Fragment key={item.label}>
                  <Button 
                    variant="ghost"
                    onClick={() => navigate(item.path)} 
                    className="text-muted-foreground hover:text-[#c9a84c] transition-colors focus-visible:ring-2 focus-visible:ring-[#c9a84c] outline-none px-2 py-1 rounded-none bg-transparent hover:bg-transparent"
                    style={{ fontFamily: 'Inter, sans-serif', fontSize: '10px', letterSpacing: '0.28em', textTransform: 'uppercase' }}
                    aria-label={item.label}
                  >
                    {item.label}
                  </Button>
                  {index < array.length - 1 && (
                    <span className="mx-1 select-none" style={{ color: '#c9a84c', opacity: 0.5 }}>·</span>
                  )}
                </React.Fragment>
              ))}
            </nav>
            <Button 
              onClick={scrollToTop} 
              className="p-2 bg-transparent rounded-none transition-all focus-visible:ring-2 focus-visible:ring-[#c9a84c] outline-none"
              style={{ border: '1px solid rgba(201,168,76,0.4)', color: '#c9a84c' }}
              onMouseEnter={(e) => { e.currentTarget.style.background = '#c9a84c'; e.currentTarget.style.color = '#0a0a0a'; }}
              onMouseLeave={(e) => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = '#c9a84c'; }}
              aria-label="Voltar ao topo"
            >
              <Icons.ArrowDown className="rotate-180 w-4 h-4" />
            </Button>
          </div>
        </div>
      </div>
    </footer>
  );
});

Footer.displayName = 'Footer';

export default Footer;
