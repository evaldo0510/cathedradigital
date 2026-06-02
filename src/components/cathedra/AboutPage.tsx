import React from 'react';
import { Icons } from '../../constants';
import { SOCIAL_LINKS } from '@/config/site-config';
import { trackEvent } from '@/lib/analytics';

const AboutPage: React.FC = () => (
  <div className="w-full space-y-spacing-3xl py-spacing-md animate-in fade-in slide-in-from-bottom-spacing-md duration-1000">
    {/* Hero Section */}
    <div className="text-center space-y-spacing-md">
      <div className="inline-flex items-center gap-spacing-xs px-spacing-md py-spacing-2xs bg-primary/[0.02] rounded-premium-full border border-primary/10">
        <Icons.Cross className="w-spacing-md h-spacing-md text-primary" />
        <span className="text-premium-xs font-black uppercase tracking-[0.2em] text-primary">Manifesto & Identidade</span>
      </div>
      <h1 className="text-premium-4xl md:text-premium-6xl font-serif font-bold text-foreground tracking-tight">Sobre a Cathedra Digital</h1>
      <p className="text-muted-foreground text-premium-lg">Unindo a tradição milenar da Igreja à vanguarda tecnológica para a glória de Deus.</p>
    </div>

    {/* Quick Navigation Anchors */}
    <nav className="flex flex-wrap justify-center gap-spacing-xs md:gap-spacing-xl py-spacing-md border-y border-primary/5 sticky top-spacing-0 bg-background/80 backdrop-blur-md z-20">
      {[
        { label: 'Missão', href: '#missao', icon: <Icons.Target className="w-spacing-md h-spacing-md" /> },
        { label: 'História', href: '#historia', icon: <Icons.History className="w-spacing-md h-spacing-md" /> },
        { label: 'Redes Sociais', href: '#redes-sociais', icon: <Icons.Instagram className="w-spacing-md h-spacing-md" /> },
      ].map((link) => (
        <a 
          key={link.href} 
          href={link.href}
          className="flex items-center gap-spacing-xs px-spacing-md py-spacing-xs text-premium-sm font-medium text-muted-foreground/60 hover:text-primary hover:bg-primary/[0.03] rounded-premium-full transition-all"
        >
          {link.icon}
          {link.label}
        </a>
      ))}
    </nav>

    {/* Big Quote */}
    <div className="relative py-spacing-2xl">
      <div className="absolute top-spacing-0 left-0 text-primary/5 -z-10">
        <Icons.Quote className="w-spacing-4xl h-spacing-4xl -rotate-12" />
      </div>
      <blockquote className="text-premium-2xl md:text-premium-4xl font-serif font-bold text-foreground italic text-center leading-relaxed">
        "A fé não foi feita para confundir. Foi feita para ser compreendida, vivida e transmitida."
      </blockquote>
    </div>

    <div className="grid grid-cols-1 md:grid-cols-2 gap-spacing-2xl items-start">
      {/* Missão Section */}
      <div id="missao" className="scroll-mt-spacing-4xl space-y-spacing-lg">
        <div className="flex items-center gap-spacing-sm">
          <div className="w-spacing-xl h-spacing-xl rounded-premium-full bg-primary/[0.02] border border-primary/10 flex items-center justify-center">
            <Icons.Target className="w-spacing-md h-spacing-md text-primary" />
          </div>
          <h2 className="text-premium-3xl font-serif font-bold text-foreground">Nossa Missão</h2>
        </div>
        <div className="space-y-spacing-md text-muted-foreground leading-relaxed text-premium-lg">
          <p>A Cathedra Digital nasceu de uma convicção profunda: a riqueza incomensurável da tradição católica — sua teologia, liturgia, moral e espiritualidade — deve ser acessível a todo fiel, sem diluição e sem complicação.</p>
          <p>Nosso objetivo primordial é fornecer uma plataforma de formação contínua, onde cada recurso é meticulosamente desenhado para conduzir o usuário da simples leitura à profunda compreensão, e da compreensão à vivência cristã autêntica.</p>
        </div>
      </div>

      {/* História Section */}
      <div id="historia" className="scroll-mt-spacing-4xl space-y-spacing-lg">
        <div className="flex items-center gap-spacing-sm">
          <div className="w-spacing-xl h-spacing-xl rounded-premium-full bg-primary/[0.02] border border-primary/10 flex items-center justify-center">
            <Icons.History className="w-spacing-md h-spacing-md text-primary" />
          </div>
          <h2 className="text-premium-3xl font-serif font-bold text-foreground">Nossa História</h2>
        </div>
        <div className="space-y-spacing-md text-muted-foreground leading-relaxed text-premium-lg">
          <p>O projeto Cathedra começou como uma busca pessoal por consolidar os tesouros da Igreja em uma interface digna da beleza de seu conteúdo. O que era um repositório de estudos transformou-se em um ecossistema digital completo.</p>
          <p>Desde a primeira linha de código, o foco foi a fidelidade ao Magistério. Passamos de uma simples ferramenta de busca para uma inteligência a serviço da Tradição, ajudando milhares de pessoas a redescobrirem a profundidade de sua fé no cotidiano digital.</p>
        </div>
      </div>
    </div>

    {/* Social Media Section */}
    <div id="redes-sociais" className="scroll-mt-spacing-4xl bg-primary/[0.01] rounded-[2.5rem] p-spacing-xl md:p-spacing-2xl border border-primary/5 shadow-premium">
      <div className="text-center space-y-spacing-xl">
        <div className="space-y-spacing-xs">
          <h2 className="text-premium-2xl font-serif font-bold text-foreground">Siga-nos nas Redes Sociais</h2>
          <p className="text-muted-foreground">Acompanhe reflexões diárias e atualizações da plataforma.</p>
        </div>
        
        <div className="flex flex-wrap justify-center gap-spacing-lg">
          {[
            { icon: <Icons.Instagram className="w-spacing-lg h-spacing-lg" />, label: 'Instagram', url: SOCIAL_LINKS.INSTAGRAM, color: 'hover:text-pink-600' },
            { icon: <Icons.Youtube className="w-spacing-lg h-spacing-lg" />, label: 'YouTube', url: SOCIAL_LINKS.YOUTUBE, color: 'hover:text-red-600' },
            { icon: <Icons.Twitter className="w-spacing-lg h-spacing-lg" />, label: 'X (Twitter)', url: SOCIAL_LINKS.TWITTER, color: 'hover:text-sky-500' },
            { icon: <Icons.Facebook className="w-spacing-lg h-spacing-lg" />, label: 'Facebook', url: SOCIAL_LINKS.FACEBOOK, color: 'hover:text-blue-600' },
            { icon: <Icons.Whatsapp className="w-spacing-lg h-spacing-lg" />, label: 'WhatsApp', url: SOCIAL_LINKS.WHATSAPP, color: 'hover:text-green-600' },
          ].map((social) => (
            <a
              key={social.label}
              href={social.url}
              target="_blank"
              rel="noopener noreferrer"
              aria-label={social.label}
              onClick={() => trackEvent('social_link_click', { platform: social.label, url: social.url })}
              className={`flex flex-col items-center gap-spacing-xs p-spacing-md rounded-premium-full bg-background border border-primary/5 shadow-premium-sm transition-all hover:shadow-premium hover:-translate-y-1 ${social.color} group`}
            >
              <div className="transition-transform duration-300 group-hover:scale-110">
                {social.icon}
              </div>
              <span className="text-premium-xs font-black uppercase tracking-widest text-muted-foreground group-hover:text-inherit">
                {social.label}
              </span>
            </a>
          ))}
        </div>
      </div>
    </div>

    {/* Pillars / Features */}
    <div className="space-y-spacing-2xl">
      <div className="text-center space-y-spacing-xs">
        <h2 className="text-premium-3xl font-serif font-bold text-foreground">Os Pilares da Cathedra</h2>
        <p className="text-muted-foreground">O que nos diferencia em cada detalhe.</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-spacing-lg">
        {[
          { icon: <Icons.Book className="w-spacing-xl h-spacing-xl" />, title: 'Escritura', desc: 'Os 73 livros da Bíblia Católica, com referências cruzadas e contexto teológico profundo.' },
          { icon: <Icons.Cross className="w-spacing-xl h-spacing-xl" />, title: 'Tradição', desc: 'Acesso integral ao Catecismo, Magistério, Concílios e toda a Doutrina da Igreja.' },
          { icon: <Icons.Heart className="w-spacing-xl h-spacing-xl" />, title: 'Oração', desc: 'Rosário, Via Sacra, Missal Romano e um devocionário completo para sua vida espiritual.' },
          { icon: <Icons.Star className="w-spacing-xl h-spacing-xl" />, title: 'Formação', desc: 'Trilhas de estudo progressivas, quizzes de conhecimento e a Suma Teológica de São Tomás.' },
        ].map(pillar => (
          <div key={pillar.title} className="bg-card border border-primary/5 rounded-premium p-spacing-lg space-y-spacing-md hover:border-primary/20 transition-all group shadow-premium">
            <div className="text-primary/40 bg-primary/[0.01] border border-primary/5 w-spacing-3xl h-spacing-3xl rounded-premium-full flex items-center justify-center transition-transform duration-500 group-hover:rotate-6 group-hover:text-primary group-hover:bg-primary/[0.03]">
              {pillar.icon}
            </div>
            <div className="space-y-spacing-xs">
              <h3 className="text-premium-xl font-serif font-bold text-foreground">{pillar.title}</h3>
              <p className="text-premium-sm text-muted-foreground leading-relaxed">{pillar.desc}</p>
            </div>
          </div>
        ))}
      </div>
    </div>

    {/* Creator Section */}
    <div className="pt-spacing-3xl border-t border-border/40">
      <div className="flex flex-col md:flex-row items-center gap-spacing-xl md:gap-spacing-3xl bg-primary/[0.01] rounded-[2.5rem] p-spacing-xl md:p-spacing-2xl border border-primary/5 shadow-premium">
        <div className="shrink-0">
          <div className="w-spacing-4xl h-spacing-4xl md:w-spacing-4xl md:h-spacing-4xl rounded-premium-full border-4 border-background p-spacing-xs relative bg-background shadow-premium overflow-hidden group">
            <div className="w-full h-full rounded-premium-full bg-primary/[0.02] flex items-center justify-center overflow-hidden border border-primary/10 group-hover:scale-105 transition-transform duration-700">
              <Icons.User className="w-spacing-4xl h-spacing-4xl text-muted-foreground/60" />
            </div>
            <div className="absolute bottom-spacing-xs right-spacing-xs bg-primary text-white p-spacing-sm rounded-premium shadow-premium border-4 border-background">
              <Icons.Feather className="w-spacing-md h-spacing-md" />
            </div>
          </div>
        </div>
        
        <div className="space-y-spacing-lg flex-1 text-center md:text-left">
          <div className="space-y-spacing-xs">
            <h2 className="text-premium-3xl md:text-premium-4xl font-serif font-bold text-foreground">O Idealizador</h2>
            <p className="text-premium-2xl font-bold text-primary">Evaldo.os</p>
          </div>
          
          <div className="space-y-spacing-md text-muted-foreground text-premium-lg leading-relaxed font-serif">
            <p>
              A Cathedra Digital foi concebida por <span className="text-foreground font-bold">Evaldo.os</span> como uma resposta ao chamado de evangelização na era digital. Unindo a paixão pela tecnologia de ponta com a veneração pela Tradição Católica de dois mil anos.
            </p>
            <p>
              "Nossa missão é fornecer as ferramentas mais avançadas para que cada católico possa aprofundar sua fé, estudar as escrituras e viver a liturgia com clareza, beleza e profundidade."
            </p>
          </div>

          <div className="flex flex-wrap items-center justify-center md:justify-start gap-spacing-sm pt-spacing-xs">
            {['Espiritualidade', 'Reflexão', 'Tecnologia', 'Tradição'].map(tag => (
              <span key={tag} className="px-spacing-md py-spacing-2xs bg-background border border-border rounded-premium-full text-premium-xs font-black uppercase tracking-widest text-muted-foreground">
                {tag}
              </span>
            ))}
          </div>
        </div>
      </div>
    </div>

    {/* Footer Quote */}
    <div className="py-spacing-3xl text-center space-y-spacing-md">
      <p className="text-premium-2xl font-serif font-bold text-foreground tracking-tight uppercase">Ad Maiorem Dei Gloriam</p>
      <div className="w-spacing-2xl h-spacing-3xs bg-primary/30 mx-auto rounded-premium" />
      <p className="text-muted-foreground italic">Para a maior glória de Deus.</p>
    </div>
  </div>
);

export default AboutPage;
