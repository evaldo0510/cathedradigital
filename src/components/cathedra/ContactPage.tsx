import React from 'react';
import { Link } from 'react-router-dom';
import { Icons } from '../../constants';
import { SOCIAL_LINKS } from '@/config/site-config';

interface Channel {
  icon: React.ReactNode;
  title: string;
  desc: string;
  actionLabel: string;
  href: string;
  external?: boolean;
}

const CHANNELS: Channel[] = [
  {
    icon: <Icons.Mail className="w-spacing-lg h-spacing-lg" />,
    title: 'Suporte e dúvidas gerais',
    desc: 'Ajuda com conta, assinatura PRO, dúvidas sobre a plataforma e conteúdo editorial.',
    actionLabel: 'contato@cathedradigital.com.br',
    href: 'mailto:contato@cathedradigital.com.br',
    external: true,
  },
  {
    icon: <Icons.Shield className="w-spacing-lg h-spacing-lg" />,
    title: 'Encarregado de dados (DPO / LGPD)',
    desc: 'Exercício de direitos como titular, dúvidas de privacidade, incidentes de segurança.',
    actionLabel: 'dpo@cathedradigital.com.br',
    href: 'mailto:dpo@cathedradigital.com.br',
    external: true,
  },
  {
    icon: <Icons.Users className="w-spacing-lg h-spacing-lg" />,
    title: 'Parcerias institucionais',
    desc: 'Dioceses, paróquias, comunidades, apostolados e empresas que desejam caminhar conosco.',
    actionLabel: 'Ver página de Parceiros',
    href: '/partners',
  },
  {
    icon: <Icons.Feather className="w-spacing-lg h-spacing-lg" />,
    title: 'Imprensa e conteúdo editorial',
    desc: 'Entrevistas, reportagens e uso de material editorial da Cathedra em publicações.',
    actionLabel: 'imprensa@cathedradigital.com.br',
    href: 'mailto:imprensa@cathedradigital.com.br',
    external: true,
  },
];

const ContactPage: React.FC = () => (
  <div className="w-full max-w-4xl mx-auto space-y-spacing-2xl py-spacing-xl animate-in fade-in slide-in-from-bottom-4 duration-700">
    <header className="text-center space-y-spacing-md">
      <div className="inline-flex items-center gap-spacing-xs px-spacing-md py-spacing-2xs bg-primary/[0.02] rounded-premium-full border border-primary/10">
        <Icons.Mail className="w-spacing-md h-spacing-md text-primary" />
        <span className="text-premium-xs font-black uppercase tracking-[0.2em] text-primary">Contato</span>
      </div>
      <h1 className="text-premium-4xl md:text-premium-5xl font-serif font-bold text-foreground tracking-tight">
        Fale com a Cathedra
      </h1>
      <p className="text-muted-foreground text-premium-lg max-w-2xl mx-auto">
        Escolha o canal certo — respondemos em até 3 dias úteis. Para direitos LGPD, o prazo é de até
        15 dias corridos, conforme orientação da ANPD.
      </p>
    </header>

    <section className="grid grid-cols-1 md:grid-cols-2 gap-spacing-lg">
      {CHANNELS.map((ch) => {
        const inner = (
          <>
            <div className="flex items-center gap-spacing-sm">
              <div className="w-spacing-2xl h-spacing-2xl rounded-premium-full bg-primary/[0.03] border border-primary/10 flex items-center justify-center text-primary/70">
                {ch.icon}
              </div>
              <h2 className="text-premium-lg font-serif font-bold text-foreground">{ch.title}</h2>
            </div>
            <p className="text-premium-sm text-muted-foreground leading-relaxed">{ch.desc}</p>
            <div className="pt-spacing-xs text-premium-sm font-semibold text-primary group-hover:underline break-all">
              {ch.actionLabel}
            </div>
          </>
        );
        const cls =
          'group bg-card border border-primary/5 rounded-premium p-spacing-lg space-y-spacing-sm hover:border-primary/30 hover:shadow-premium transition-all block';
        return ch.external ? (
          <a key={ch.title} href={ch.href} className={cls} rel="noopener noreferrer">
            {inner}
          </a>
        ) : (
          <Link key={ch.title} to={ch.href} className={cls}>
            {inner}
          </Link>
        );
      })}
    </section>

    <section className="bg-primary/[0.01] rounded-premium border border-primary/5 p-spacing-lg space-y-spacing-md text-center">
      <h2 className="text-premium-lg font-serif font-bold text-foreground">Redes sociais</h2>
      <p className="text-muted-foreground text-premium-sm">
        Reflexões diárias e atualizações da plataforma.
      </p>
      <div className="flex flex-wrap justify-center gap-spacing-md">
        {[
          { icon: <Icons.Instagram className="w-spacing-md h-spacing-md" />, label: 'Instagram', url: SOCIAL_LINKS.INSTAGRAM },
          { icon: <Icons.Youtube className="w-spacing-md h-spacing-md" />, label: 'YouTube', url: SOCIAL_LINKS.YOUTUBE },
          { icon: <Icons.Twitter className="w-spacing-md h-spacing-md" />, label: 'X', url: SOCIAL_LINKS.TWITTER },
          { icon: <Icons.Whatsapp className="w-spacing-md h-spacing-md" />, label: 'WhatsApp', url: SOCIAL_LINKS.WHATSAPP },
        ].map((s) => (
          <a
            key={s.label}
            href={s.url}
            target="_blank"
            rel="noopener noreferrer"
            aria-label={s.label}
            className="inline-flex items-center gap-spacing-2xs px-spacing-md py-spacing-xs bg-background border border-primary/10 rounded-premium-full text-premium-sm text-muted-foreground hover:text-primary hover:border-primary/30 transition-all"
          >
            {s.icon}
            {s.label}
          </a>
        ))}
      </div>
    </section>
  </div>
);

export default ContactPage;
