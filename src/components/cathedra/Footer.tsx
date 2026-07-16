import { Button } from '@/components/ui/button';
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Icons } from '../../constants';
import { AppRoute } from '../../types';
import { useLang } from '@/hooks/useLang';
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
             <div className="flex items-center gap-spacing-lg">
               <Icons.Logo className="w-spacing-2xl h-spacing-2xl flex-shrink-0" variant="blue" />
               <div>
                 <h3 className="text-premium-2xl font-serif font-bold text-foreground tracking-tight">CATHEDRA</h3>
                 <p className="text-premium-small font-black uppercase text-primary tracking-[0.4em]">Digital Sanctuarium</p>
               </div>
            </div>
            <p className="text-premium-base text-muted-foreground leading-relaxed">
              {lang === 'pt' 
                ? 'Uma plataforma dedicada ao estudo, oração e vivência da fé católica, unindo a tradição milenar à tecnologia moderna.'
                : 'A platform dedicated to the study, prayer, and living of the Catholic faith, uniting ancient tradition with modern technology.'}
            </p>
            <div className="flex gap-spacing-sm">
              {[
                { icon: <Icons.Instagram />, platform: 'Instagram', url: SOCIAL_LINKS.INSTAGRAM },
                { icon: <Icons.Youtube />, platform: 'Youtube', url: SOCIAL_LINKS.YOUTUBE },
                { icon: <Icons.Whatsapp />, platform: 'Whatsapp', url: SOCIAL_LINKS.WHATSAPP },

              ].map((social, i) => (
                <Button key={i} variant="ghost" size="icon" asChild className="text-muted-foreground dark:text-foreground/70 hover:text-primary transition-all rounded-premium-full bg-foreground/5 dark:bg-foreground/10 border border-foreground/10 dark:border-foreground/20 hover:border-primary/30 w-spacing-xl h-spacing-xl p-spacing-0 flex items-center justify-center">
                  <a href={social.url} target="_blank" rel="noopener noreferrer" onClick={() => handleSocialClick(social.platform, social.url)} aria-label={social.platform}>
                    {social.icon}
                  </a>
                </Button>
              ))}
            </div>
          </div>

          <div>
            <h4 className="text-premium-small font-black uppercase tracking-[0.2em] text-primary mb-spacing-lg flex items-center gap-spacing-xs">
              <span className="text-premium-lg">🏛️</span> Santa Sé
            </h4>
            <ul className="flex flex-col gap-spacing-md" role="list">
              {vaticanLinks.map(link => (
                <li key={link.title}>
                  <Button variant="link" asChild className="text-premium-sm text-muted-foreground dark:text-muted-foreground/80 hover:text-primary transition-colors flex items-center justify-start p-spacing-0 h-auto gap-spacing-xs group decoration-transparent">
                    <a href={link.url} target="_blank" rel="noopener noreferrer">
                      <span className="w-spacing-2xs h-spacing-2xs rounded-premium-full bg-primary/30 group-hover:bg-primary transition-colors" />
                      {link.title}
                    </a>
                  </Button>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h4 className="text-premium-small font-black uppercase tracking-[0.2em] text-primary mb-spacing-lg flex items-center gap-spacing-xs">
              <span className="text-premium-lg">🇧🇷</span> CNBB
            </h4>
            <ul className="flex flex-col gap-spacing-md" role="list">
              {cnbbLinks.map(link => (
                <li key={link.title}>
                  <Button variant="link" asChild className="text-premium-sm text-muted-foreground dark:text-muted-foreground/80 hover:text-primary transition-colors flex items-center justify-start p-spacing-0 h-auto gap-spacing-xs group decoration-transparent">
                    <a href={link.url} target="_blank" rel="noopener noreferrer">
                      <span className="w-spacing-2xs h-spacing-2xs rounded-premium-full bg-primary/30 group-hover:bg-primary transition-colors" />
                      {link.title}
                    </a>
                  </Button>
                </li>
              ))}
            </ul>
          </div>

          <div className="flex flex-col gap-spacing-xl">
            <div>
              <h4 className="text-premium-small font-black uppercase tracking-[0.2em] text-primary mb-spacing-md">{lang === 'pt' ? 'Sua Diocese' : 'Your Diocese'}</h4>
              <select 
                value={selectedDiocese}
                onChange={(e) => handleDioceseChange(e.target.value)}
                aria-label={lang === 'pt' ? 'Selecione sua Diocese' : 'Select your Diocese'}
                className="w-full bg-foreground/5 border border-foreground/10 rounded-premium-full px-spacing-md py-spacing-xs text-premium-sm text-foreground focus:outline-none focus:border-primary/50 transition-colors cursor-pointer appearance-none"
              >
                <option value="">{lang === 'pt' ? 'Selecione sua Diocese' : 'Select your Diocese'}</option>
                {DIOCESES_BR.map(d => (
                  <option key={d} value={d}>{d}</option>
                ))}
              </select>
              {dioceseUrl && (
                <Button variant="link" size="sm" asChild className="inline-flex items-center gap-spacing-xs mt-spacing-sm p-spacing-0 h-auto text-premium-xs text-primary hover:underline">
                  <a href={dioceseUrl} target="_blank" rel="noopener noreferrer">
                    {lang === 'pt' ? 'Acessar portal' : 'Access portal'} <Icons.ExternalLink className="w-spacing-sm h-spacing-sm opacity-100" />
                  </a>
                </Button>
              )}
            </div>
            <div>
              <h4 className="text-premium-small font-black uppercase tracking-[0.2em] text-primary mb-spacing-md">{lang === 'pt' ? 'Boletim Informativo' : 'Newsletter'}</h4>
              <p className="text-premium-xs text-muted-foreground mb-spacing-md leading-relaxed">
                {lang === 'pt' 
                  ? 'Receba reflexões teológicas e atualizações da plataforma em seu e-mail.'
                  : 'Receive theological reflections and platform updates in your email.'}
              </p>
              <form onSubmit={handleSubscribe} className="relative">
                <input 
                  type="email" 
                  placeholder={lang === 'pt' ? "Seu melhor e-mail" : "Your best email"}
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  className="w-full bg-foreground/5 border border-foreground/10 rounded-premium-full pl-spacing-md pr-spacing-3xl py-spacing-sm text-premium-sm focus:outline-none focus:border-primary/50 transition-colors"
                />
                <Button 
                  type="submit" 
                  disabled={isSubmitting}
                  aria-label={lang === 'pt' ? 'Inscrever no boletim informativo' : 'Subscribe to newsletter'}
                  className="absolute right-spacing-xs top-spacing-xs bottom-spacing-xs px-spacing-md bg-primary text-primary-foreground rounded-premium-full hover:scale-105 transition-all disabled:opacity-50 min-w-[44px] min-h-[44px] flex items-center justify-center"
                >
                  {isSubmitting ? (
                    <div className="w-spacing-md h-spacing-md border-2 border-primary-foreground border-t-transparent rounded-premium animate-spin" />
                  ) : (
                    <Icons.ArrowDown className="-rotate-90 opacity-100 text-primary-foreground" />
                  )}
                </Button>
              </form>
            </div>
          </div>
        </div>

        <div className="pt-spacing-3xl border-t border-foreground/10 dark:border-foreground/15 flex flex-col md:flex-row items-center justify-between gap-spacing-xl">
          <div className="flex flex-col items-center md:items-start gap-spacing-md">
            <p className="text-premium-small font-black uppercase tracking-[0.4em] text-muted-foreground/60 dark:text-muted-foreground/70">
              © {new Date().getFullYear()} CATHEDRA • OMNIA AD MAIOREM DEI GLORIAM
            </p>
            <p className="text-premium-base font-bold text-muted-foreground/80 dark:text-muted-foreground/90 flex items-center gap-spacing-xs tracking-widest">
              {lang === 'pt' ? 'Criado por' : 'Created by'}
              <Button 
                onClick={() => navigate(AppRoute.ADMIN)} 
                className="cursor-pointer select-none text-primary hover:text-primary/80 transition-colors font-black"
              >
                Evaldo.os
              </Button>
            </p>
          </div>
          <div className="flex items-center gap-spacing-xl">
            <nav className="flex items-center" aria-label="Links institucionais">
              {APP_ROUTES.filter(r => r.category === 'user' && !r.showInMenu).map((item, index, array) => (
                <React.Fragment key={item.label}>
                  <Button 
                    onClick={() => navigate(item.path)} 
                    className="text-premium-small font-black uppercase tracking-[0.2em] text-muted-foreground dark:text-muted-foreground/80 hover:text-primary transition-colors focus-visible:ring-2 focus-visible:ring-primary outline-none px-spacing-sm py-spacing-2xs rounded"
                    aria-label={item.label}
                  >
                    {item.label}
                  </Button>

                  {index < array.length - 1 && (
                    <span className="mx-spacing-sm text-muted-foreground/60 font-light select-none">|</span>
                  )}
                </React.Fragment>
              ))}

            </nav>
            <Button 
              onClick={scrollToTop} 
              className="p-spacing-xs bg-foreground/5 dark:bg-foreground/10 hover:bg-primary hover:text-primary-foreground rounded-premium-full transition-all border border-foreground/10 dark:border-foreground/20 group focus-visible:ring-2 focus-visible:ring-primary outline-none"
              aria-label="Voltar ao topo"
            >
              <Icons.ArrowDown className="rotate-180 opacity-100 group-hover:text-primary-foreground" />
            </Button>

          </div>
        </div>
      </div>
    </footer>
  );
});

Footer.displayName = 'Footer';

export default Footer;
