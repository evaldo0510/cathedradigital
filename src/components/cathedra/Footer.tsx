import { Button } from '@/components/ui/button';
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Icons } from '../../constants';
import { AppRoute } from '../../types';
import { useLang } from '@/hooks/useLang';
import { useIsAdmin } from '@/hooks/useIsAdmin';
import { useIsMobile } from '@/hooks/use-mobile';
import { SOCIAL_LINKS, EXTERNAL_URLS } from '@/config/site-config';
import { trackEvent } from '@/lib/analytics';
import { APP_ROUTES } from '@/config/routes';

const DIOCESES_BR = [
  'Arquidiocese de São Paulo',
  'Arquidiocese de Campinas',
  'Arquidiocese de Aparecida',
  'Arquidiocese de Botucatu',
  'Arquidiocese de Ribeirão Preto',
  'Arquidiocese de Sorocaba',
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

// Tokens visuais Logos 2030 — noir + dourado como acento
const GOLD = '#c9a84c';
const GOLD_SOFT = 'rgba(201,168,76,0.35)';
const GOLD_HAIR = 'rgba(201,168,76,0.18)';
const FONT_DISPLAY = "'Cormorant Garamond', ui-serif, Georgia, serif";
const FONT_BODY = "'Karla', ui-sans-serif, system-ui, sans-serif";

const EYEBROW_STYLE: React.CSSProperties = {
  color: GOLD,
  fontFamily: FONT_BODY,
  fontSize: '10px',
  fontWeight: 500,
  letterSpacing: '0.34em',
  textTransform: 'uppercase',
};

interface FooterSectionProps {
  title: string;
  id: string;
  isMobile: boolean;
  openId: string | null;
  onToggle: (id: string) => void;
  children: React.ReactNode;
}

const FooterSection: React.FC<FooterSectionProps> = ({ title, id, isMobile, openId, onToggle, children }) => {
  const isOpen = !isMobile || openId === id;

  if (!isMobile) {
    return (
      <section aria-labelledby={`footer-h-${id}`}>
        <h4 id={`footer-h-${id}`} className="mb-spacing-lg" style={EYEBROW_STYLE}>
          — {title}
        </h4>
        {children}
      </section>
    );
  }

  return (
    <section aria-labelledby={`footer-h-${id}`} className="border-t" style={{ borderColor: GOLD_HAIR }}>
      <button
        type="button"
        onClick={() => onToggle(id)}
        aria-expanded={isOpen}
        aria-controls={`footer-p-${id}`}
        className="flex w-full items-center justify-between min-h-[44px] py-3 text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#c9a84c] rounded-none"
      >
        <span id={`footer-h-${id}`} style={EYEBROW_STYLE}>{title}</span>
        <Icons.ArrowDown
          className={`w-4 h-4 transition-transform ${isOpen ? 'rotate-180' : ''}`}
          style={{ color: GOLD }}
        />
      </button>
      <div id={`footer-p-${id}`} hidden={!isOpen} className="pb-spacing-lg">
        {children}
      </div>
    </section>
  );
};

const Footer: React.FC = React.memo(() => {
  const navigate = useNavigate();
  const { lang } = useLang();
  const { isAdmin } = useIsAdmin();
  const isMobile = useIsMobile();
  const [openId, setOpenId] = useState<string | null>(null);
  const [selectedDiocese, setSelectedDiocese] = useState(() => localStorage.getItem('cathedra_diocese') || '');
  const [email, setEmail] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const toggleSection = (id: string) => setOpenId(prev => (prev === id ? null : id));

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
    } else {
      window.scrollTo({ top: 0, behavior: 'smooth' });
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

  const linkItem =
    'group inline-flex items-center gap-3 min-h-[44px] py-2 text-left text-muted-foreground hover:text-[#c9a84c] focus-visible:text-[#c9a84c] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#c9a84c] transition-colors';

  return (
    <footer
      className="mt-auto w-full bg-background text-foreground border-t footer-reading-auto-hide"
      style={{
        borderColor: GOLD_HAIR,
        contentVisibility: 'auto',
        containIntrinsicSize: '0 520px',
      }}
      aria-label={lang === 'pt' ? 'Rodapé' : 'Footer'}
    >
      <div className="mx-auto w-full max-w-[1280px] px-spacing-xl md:px-spacing-2xl lg:px-spacing-3xl pt-spacing-3xl md:pt-spacing-4xl pb-spacing-2xl">
        {/* Faixa principal — 4 colunas equilibradas */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-spacing-2xl md:gap-spacing-3xl lg:gap-spacing-4xl">
          {/* Coluna 1 — Marca */}
          <div className="flex flex-col gap-spacing-lg md:col-span-2 lg:col-span-1">
            <div className="flex flex-col gap-2">
              <div className="flex items-baseline gap-2">
                <span aria-hidden="true" style={{ color: GOLD, fontSize: 10 }}>●</span>
                <span
                  style={{
                    fontFamily: FONT_DISPLAY,
                    fontWeight: 500,
                    fontSize: 'clamp(1.75rem, 2.4vw, 2.25rem)',
                    letterSpacing: '0.14em',
                    lineHeight: 1,
                  }}
                >
                  CATHEDRA
                </span>
              </div>
              <span
                className="pl-4"
                style={{
                  color: GOLD,
                  fontFamily: FONT_BODY,
                  fontSize: 10,
                  fontWeight: 500,
                  letterSpacing: '0.4em',
                  textTransform: 'uppercase',
                }}
              >
                Digital Sanctuarium
              </span>
            </div>

            <p
              className="max-w-prose"
              style={{
                fontFamily: FONT_DISPLAY,
                fontStyle: 'italic',
                fontSize: '1.0625rem',
                color: 'hsl(var(--muted-foreground))',
                lineHeight: 1.65,
              }}
            >
              {lang === 'pt'
                ? 'Uma plataforma dedicada ao estudo, oração e vivência da fé católica — unindo tradição milenar e tecnologia contemporânea.'
                : 'A platform dedicated to the study, prayer, and living of the Catholic faith — uniting ancient tradition with modern technology.'}
            </p>

            <div className="flex gap-3 pt-1">
              {[
                { icon: <Icons.Instagram />, platform: 'Instagram', url: SOCIAL_LINKS.INSTAGRAM },
                { icon: <Icons.Youtube />, platform: 'Youtube', url: SOCIAL_LINKS.YOUTUBE },
                { icon: <Icons.Whatsapp />, platform: 'Whatsapp', url: SOCIAL_LINKS.WHATSAPP },
              ].map((social, i) => (
                <a
                  key={i}
                  href={social.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  onClick={() => handleSocialClick(social.platform, social.url)}
                  aria-label={social.platform}
                  className="inline-flex items-center justify-center w-11 h-11 rounded-none transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#c9a84c]"
                  style={{ border: `1px solid ${GOLD_SOFT}`, color: GOLD }}
                  onMouseEnter={(e) => { e.currentTarget.style.background = GOLD; e.currentTarget.style.color = '#0a0a0a'; }}
                  onMouseLeave={(e) => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = GOLD; }}
                >
                  {social.icon}
                </a>
              ))}
            </div>
          </div>

          {/* Coluna 2 — Santa Sé */}
          <FooterSection
            title="Santa Sé"
            id="vatican"
            isMobile={isMobile}
            openId={openId}
            onToggle={toggleSection}
          >
            <ul className="flex flex-col" role="list">
              {vaticanLinks.map(link => (
                <li key={link.title}>
                  <a
                    href={link.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className={linkItem}
                    style={{ fontFamily: FONT_BODY, fontSize: '0.9375rem' }}
                  >
                    <span
                      aria-hidden="true"
                      className="w-1 h-1 shrink-0 transition-colors"
                      style={{ background: GOLD_SOFT }}
                    />
                    <span>{link.title}</span>
                  </a>
                </li>
              ))}
            </ul>
          </FooterSection>

          {/* Coluna 3 — CNBB */}
          <FooterSection
            title="CNBB"
            id="cnbb"
            isMobile={isMobile}
            openId={openId}
            onToggle={toggleSection}
          >
            <ul className="flex flex-col" role="list">
              {cnbbLinks.map(link => (
                <li key={link.title}>
                  <a
                    href={link.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className={linkItem}
                    style={{ fontFamily: FONT_BODY, fontSize: '0.9375rem' }}
                  >
                    <span
                      aria-hidden="true"
                      className="w-1 h-1 shrink-0 transition-colors"
                      style={{ background: GOLD_SOFT }}
                    />
                    <span>{link.title}</span>
                  </a>
                </li>
              ))}
            </ul>
          </FooterSection>

          {/* Coluna 4 — Diocese + Boletim */}
          <FooterSection
            title={lang === 'pt' ? 'Comunhão' : 'Communion'}
            id="communion"
            isMobile={isMobile}
            openId={openId}
            onToggle={toggleSection}
          >
            <div className="flex flex-col gap-spacing-xl">
              <div>
                <label
                  htmlFor="footer-diocese"
                  className="block mb-2"
                  style={{ ...EYEBROW_STYLE, fontSize: 9, letterSpacing: '0.3em' }}
                >
                  {lang === 'pt' ? 'Sua Diocese' : 'Your Diocese'}
                </label>
                <select
                  id="footer-diocese"
                  value={selectedDiocese}
                  onChange={(e) => handleDioceseChange(e.target.value)}
                  className="w-full bg-transparent px-0 py-2 text-foreground focus:outline-none focus-visible:ring-2 focus-visible:ring-[#c9a84c] transition-colors cursor-pointer appearance-none min-h-[44px]"
                  style={{
                    borderBottom: `1px solid ${GOLD_SOFT}`,
                    fontFamily: FONT_DISPLAY,
                    fontStyle: 'italic',
                    fontSize: '1rem',
                  }}
                >
                  <option value="">{lang === 'pt' ? 'Selecione sua Diocese' : 'Select your Diocese'}</option>
                  {DIOCESES_BR.map(d => (
                    <option key={d} value={d}>{d}</option>
                  ))}
                </select>
                {dioceseUrl && (
                  <a
                    href={dioceseUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-2 mt-3 min-h-[44px] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#c9a84c]"
                    style={{ color: GOLD, fontFamily: FONT_BODY, fontSize: 12, letterSpacing: '0.12em', textTransform: 'uppercase' }}
                  >
                    {lang === 'pt' ? 'Acessar portal' : 'Access portal'}
                    <Icons.ExternalLink className="w-3 h-3" />
                  </a>
                )}
              </div>

              <div>
                <label
                  htmlFor="footer-email"
                  className="block mb-2"
                  style={{ ...EYEBROW_STYLE, fontSize: 9, letterSpacing: '0.3em' }}
                >
                  {lang === 'pt' ? 'Boletim' : 'Newsletter'}
                </label>
                <p
                  className="mb-3"
                  style={{
                    fontFamily: FONT_DISPLAY,
                    fontStyle: 'italic',
                    fontSize: '0.9375rem',
                    color: 'hsl(var(--muted-foreground))',
                    lineHeight: 1.6,
                  }}
                >
                  {lang === 'pt'
                    ? 'Reflexões teológicas em seu e-mail.'
                    : 'Theological reflections in your email.'}
                </p>
                <form onSubmit={handleSubscribe} className="flex items-stretch gap-2">
                  <input
                    id="footer-email"
                    type="email"
                    placeholder={lang === 'pt' ? 'Seu e-mail' : 'Your email'}
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    aria-label={lang === 'pt' ? 'Seu e-mail' : 'Your email'}
                    className="flex-1 min-w-0 bg-transparent px-0 py-2 pr-2 focus:outline-none focus-visible:ring-2 focus-visible:ring-[#c9a84c] transition-colors min-h-[44px]"
                    style={{
                      borderBottom: `1px solid ${GOLD_SOFT}`,
                      fontFamily: FONT_DISPLAY,
                      fontStyle: 'italic',
                      fontSize: '1rem',
                      color: 'hsl(var(--foreground))',
                    }}
                  />
                  <button
                    type="submit"
                    disabled={isSubmitting}
                    aria-label={lang === 'pt' ? 'Inscrever no boletim informativo' : 'Subscribe to newsletter'}
                    className="inline-flex items-center justify-center min-w-[44px] min-h-[44px] px-3 rounded-none transition-colors disabled:opacity-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#c9a84c]"
                    style={{ border: `1px solid ${GOLD}`, color: GOLD, background: 'transparent' }}
                    onMouseEnter={(e) => { if (!isSubmitting) { e.currentTarget.style.background = GOLD; e.currentTarget.style.color = '#0a0a0a'; } }}
                    onMouseLeave={(e) => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = GOLD; }}
                  >
                    {isSubmitting ? (
                      <div className="w-4 h-4 border-2 border-t-transparent rounded-full animate-spin" style={{ borderColor: GOLD, borderTopColor: 'transparent' }} />
                    ) : (
                      <Icons.ArrowDown className="-rotate-90 w-4 h-4" />
                    )}
                  </button>
                </form>
              </div>
            </div>
          </FooterSection>
        </div>

        {/* Régua editorial */}
        <div
          className="mt-spacing-3xl md:mt-spacing-4xl mb-spacing-xl h-px w-full"
          style={{ background: `linear-gradient(90deg, transparent, ${GOLD_HAIR} 20%, ${GOLD_HAIR} 80%, transparent)` }}
          aria-hidden="true"
        />

        {/* Faixa inferior */}
        <div className="flex flex-col gap-spacing-lg md:flex-row md:items-center md:justify-between">
          <div className="flex flex-col gap-2">
            <p
              style={{
                color: 'hsl(var(--muted-foreground))',
                fontFamily: FONT_BODY,
                fontSize: 10,
                fontWeight: 500,
                letterSpacing: '0.32em',
                textTransform: 'uppercase',
              }}
            >
              © {new Date().getFullYear()} <span style={{ color: GOLD }}>●</span> Cathedra <span style={{ color: GOLD }}>·</span> Omnia ad maiorem Dei gloriam
            </p>
            <p
              className="flex items-center gap-2"
              style={{
                fontFamily: FONT_DISPLAY,
                fontStyle: 'italic',
                fontSize: '0.9375rem',
                color: 'hsl(var(--muted-foreground))',
              }}
            >
              {lang === 'pt' ? 'Criado por' : 'Created by'}
              <button
                type="button"
                onClick={() => navigate(AppRoute.ADMIN)}
                className="cursor-pointer select-none bg-transparent p-0 h-auto focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#c9a84c] transition-colors"
                style={{ color: GOLD, fontFamily: FONT_DISPLAY, fontStyle: 'italic', fontSize: '0.9375rem' }}
              >
                Evaldo.os
              </button>
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-x-1 gap-y-2">
            <nav
              aria-label={lang === 'pt' ? 'Links institucionais' : 'Institutional links'}
              className="flex flex-wrap items-center gap-x-1 gap-y-1"
            >
              {APP_ROUTES.filter(r => r.category === 'user' && !r.showInMenu).map((item, index, array) => (
                <React.Fragment key={item.label}>
                  <Button
                    variant="ghost"
                    onClick={() => navigate(item.path)}
                    className="text-muted-foreground hover:text-[#c9a84c] transition-colors focus-visible:ring-2 focus-visible:ring-[#c9a84c] outline-none min-h-[44px] px-3 py-2 rounded-none bg-transparent hover:bg-transparent"
                    style={{ fontFamily: FONT_BODY, fontSize: 10, fontWeight: 500, letterSpacing: '0.28em', textTransform: 'uppercase' }}
                    aria-label={item.label}
                  >
                    {item.label}
                  </Button>
                  {(index < array.length - 1 || isAdmin) && (
                    <span aria-hidden="true" className="select-none" style={{ color: GOLD, opacity: 0.45 }}>·</span>
                  )}
                </React.Fragment>
              ))}
              {isAdmin && (
                <Button
                  variant="ghost"
                  data-testid="footer-admin-link"
                  onClick={() => navigate('/admin/seo')}
                  className="text-muted-foreground hover:text-[#c9a84c] transition-colors focus-visible:ring-2 focus-visible:ring-[#c9a84c] outline-none min-h-[44px] px-3 py-2 rounded-none bg-transparent hover:bg-transparent"
                  style={{ fontFamily: FONT_BODY, fontSize: 10, fontWeight: 500, letterSpacing: '0.28em', textTransform: 'uppercase' }}
                  aria-label="Painel administrativo"
                >
                  Admin
                </Button>
              )}
            </nav>

            <button
              type="button"
              onClick={scrollToTop}
              aria-label={lang === 'pt' ? 'Voltar ao topo' : 'Back to top'}
              className="ml-2 inline-flex items-center justify-center w-11 h-11 rounded-none transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#c9a84c]"
              style={{ border: `1px solid ${GOLD_SOFT}`, color: GOLD, background: 'transparent' }}
              onMouseEnter={(e) => { e.currentTarget.style.background = GOLD; e.currentTarget.style.color = '#0a0a0a'; }}
              onMouseLeave={(e) => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = GOLD; }}
            >
              <Icons.ArrowDown className="rotate-180 w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    </footer>
  );
});

Footer.displayName = 'Footer';

export default Footer;
