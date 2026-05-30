import React from 'react';
import { Icons } from '../../constants';
import { SOCIAL_LINKS } from '@/config/site-config';
import { trackEvent } from '@/lib/analytics';

const AboutPage: React.FC = () => (
  <div className="w-full space-y-16 py-md animate-in fade-in slide-in-from-bottom-md duration-1000">
    {/* Hero Section */}
    <div className="text-center space-y-4">
      <div className="inline-flex items-center gap-xs px-md py-2xs bg-primary/[0.02] rounded-full border border-primary/10">
        <Icons.Cross className="w-md h-md text-primary" />
        <span className="text-premium-tiny font-black uppercase tracking-[0.2em] text-primary">Manifesto & Identidade</span>
      </div>
      <h1 className="text-4xl md:text-6xl font-serif font-bold text-foreground tracking-tight">Sobre a Cathedra Digital</h1>
      <p className="text-muted-foreground text-lg max-w-2xl mx-auto">Unindo a tradição milenar da Igreja à vanguarda tecnológica para a glória de Deus.</p>
    </div>

    {/* Quick Navigation Anchors */}
    <nav className="flex flex-wrap justify-center gap-xs md:gap-xl py-md border-y border-primary/5 sticky top-0 bg-background/80 backdrop-blur-md z-20">
      {[
        { label: 'Missão', href: '#missao', icon: <Icons.Target className="w-md h-md" /> },
        { label: 'História', href: '#historia', icon: <Icons.History className="w-md h-md" /> },
        { label: 'Redes Sociais', href: '#redes-sociais', icon: <Icons.Instagram className="w-md h-md" /> },
      ].map((link) => (
        <a 
          key={link.href} 
          href={link.href}
          className="flex items-center gap-xs px-md py-xs text-sm font-medium text-muted-foreground/60 hover:text-primary hover:bg-primary/[0.03] rounded-full transition-all"
        >
          {link.icon}
          {link.label}
        </a>
      ))}
    </nav>

    {/* Big Quote */}
    <div className="relative py-2xl">
      <div className="absolute top-0 left-0 text-primary/5 -z-10">
        <Icons.Quote className="w-4xl h-4xl -rotate-12" />
      </div>
      <blockquote className="text-2xl md:text-4xl font-serif font-bold text-foreground italic text-center leading-relaxed">
        "A fé não foi feita para confundir. Foi feita para ser compreendida, vivida e transmitida."
      </blockquote>
    </div>

    <div className="grid grid-cols-1 md:grid-cols-2 gap-2xl items-start">
      {/* Missão Section */}
      <div id="missao" className="scroll-mt-4xl space-y-6">
        <div className="flex items-center gap-sm">
          <div className="w-xl h-xl rounded-full bg-primary/[0.02] border border-primary/10 flex items-center justify-center">
            <Icons.Target className="w-md h-md text-primary" />
          </div>
          <h2 className="text-3xl font-serif font-bold text-foreground">Nossa Missão</h2>
        </div>
        <div className="space-y-4 text-muted-foreground leading-relaxed text-lg">
          <p>A Cathedra Digital nasceu de uma convicção profunda: a riqueza incomensurável da tradição católica — sua teologia, liturgia, moral e espiritualidade — deve ser acessível a todo fiel, sem diluição e sem complicação.</p>
          <p>Nosso objetivo primordial é fornecer uma plataforma de formação contínua, onde cada recurso é meticulosamente desenhado para conduzir o usuário da simples leitura à profunda compreensão, e da compreensão à vivência cristã autêntica.</p>
        </div>
      </div>

      {/* História Section */}
      <div id="historia" className="scroll-mt-4xl space-y-6">
        <div className="flex items-center gap-sm">
          <div className="w-xl h-xl rounded-full bg-primary/[0.02] border border-primary/10 flex items-center justify-center">
            <Icons.History className="w-md h-md text-primary" />
          </div>
          <h2 className="text-3xl font-serif font-bold text-foreground">Nossa História</h2>
        </div>
        <div className="space-y-4 text-muted-foreground leading-relaxed text-lg">
          <p>O projeto Cathedra começou como uma busca pessoal por consolidar os tesouros da Igreja em uma interface digna da beleza de seu conteúdo. O que era um repositório de estudos transformou-se em um ecossistema digital completo.</p>
          <p>Desde a primeira linha de código, o foco foi a fidelidade ao Magistério. Passamos de uma simples ferramenta de busca para uma inteligência a serviço da Tradição, ajudando milhares de pessoas a redescobrirem a profundidade de sua fé no cotidiano digital.</p>
        </div>
      </div>
    </div>

    {/* Social Media Section */}
    <div id="redes-sociais" className="scroll-mt-4xl bg-primary/[0.01] rounded-[2.5rem] p-xl md:p-2xl border border-primary/5 shadow-premium">
      <div className="text-center space-y-8">
        <div className="space-y-2">
          <h2 className="text-2xl font-serif font-bold text-foreground">Siga-nos nas Redes Sociais</h2>
          <p className="text-muted-foreground">Acompanhe reflexões diárias e atualizações da plataforma.</p>
        </div>
        
        <div className="flex flex-wrap justify-center gap-lg">
          {[
            { icon: <Icons.Instagram className="w-lg h-lg" />, label: 'Instagram', url: SOCIAL_LINKS.INSTAGRAM, color: 'hover:text-pink-600' },
            { icon: <Icons.Youtube className="w-lg h-lg" />, label: 'YouTube', url: SOCIAL_LINKS.YOUTUBE, color: 'hover:text-red-600' },
            { icon: <Icons.Twitter className="w-lg h-lg" />, label: 'X (Twitter)', url: SOCIAL_LINKS.TWITTER, color: 'hover:text-sky-500' },
            { icon: <Icons.Facebook className="w-lg h-lg" />, label: 'Facebook', url: SOCIAL_LINKS.FACEBOOK, color: 'hover:text-blue-600' },
            { icon: <Icons.Whatsapp className="w-lg h-lg" />, label: 'WhatsApp', url: SOCIAL_LINKS.WHATSAPP, color: 'hover:text-green-600' },
          ].map((social) => (
            <a
              key={social.label}
              href={social.url}
              target="_blank"
              rel="noopener noreferrer"
              aria-label={social.label}
              onClick={() => trackEvent('social_link_click', { platform: social.label, url: social.url })}
              className={`flex flex-col items-center gap-xs p-md rounded-full bg-background border border-primary/5 shadow-sm transition-all hover:shadow-premium hover:-translate-y-1 ${social.color} group`}
            >
              <div className="transition-transform duration-300 group-hover:scale-110">
                {social.icon}
              </div>
              <span className="text-premium-tiny font-black uppercase tracking-widest text-muted-foreground group-hover:text-inherit">
                {social.label}
              </span>
            </a>
          ))}
        </div>
      </div>
    </div>

    {/* Pillars / Features */}
    <div className="space-y-12">
      <div className="text-center space-y-2">
        <h2 className="text-3xl font-serif font-bold text-foreground">Os Pilares da Cathedra</h2>
        <p className="text-muted-foreground">O que nos diferencia em cada detalhe.</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-lg">
        {[
          { icon: <Icons.Book className="w-xl h-xl" />, title: 'Escritura', desc: 'Os 73 livros da Bíblia Católica, com referências cruzadas e contexto teológico profundo.' },
          { icon: <Icons.Cross className="w-xl h-xl" />, title: 'Tradição', desc: 'Acesso integral ao Catecismo, Magistério, Concílios e toda a Doutrina da Igreja.' },
          { icon: <Icons.Heart className="w-xl h-xl" />, title: 'Oração', desc: 'Rosário, Via Sacra, Missal Romano e um devocionário completo para sua vida espiritual.' },
          { icon: <Icons.Star className="w-xl h-xl" />, title: 'Formação', desc: 'Trilhas de estudo progressivas, quizzes de conhecimento e a Suma Teológica de São Tomás.' },
        ].map(pillar => (
          <div key={pillar.title} className="bg-card border border-primary/5 rounded-premium p-lg space-y-4 hover:border-primary/20 transition-all group shadow-premium">
            <div className="text-primary/40 bg-primary/[0.01] border border-primary/5 w-3xl h-3xl rounded-full flex items-center justify-center transition-transform duration-500 group-hover:rotate-6 group-hover:text-primary group-hover:bg-primary/[0.03]">
              {pillar.icon}
            </div>
            <div className="space-y-2">
              <h3 className="text-xl font-serif font-bold text-foreground">{pillar.title}</h3>
              <p className="text-sm text-muted-foreground leading-relaxed">{pillar.desc}</p>
            </div>
          </div>
        ))}
      </div>
    </div>

    {/* Creator Section */}
    <div className="pt-3xl border-t border-border/40">
      <div className="flex flex-col md:flex-row items-center gap-xl md:gap-3xl bg-primary/[0.01] rounded-[2.5rem] p-xl md:p-2xl border border-primary/5 shadow-premium">
        <div className="shrink-0">
          <div className="w-48 h-48 md:w-64 md:h-64 rounded-full border-4 border-background p-xs relative bg-background shadow-premium overflow-hidden group">
            <div className="w-full h-full rounded-full bg-primary/[0.02] flex items-center justify-center overflow-hidden border border-primary/10 group-hover:scale-105 transition-transform duration-700">
              <Icons.User className="w-4xl h-4xl text-muted-foreground/60" />
            </div>
            <div className="absolute bottom-xs right-xs bg-primary text-white p-sm rounded-premium shadow-premium border-4 border-background">
              <Icons.Feather className="w-md h-md" />
            </div>
          </div>
        </div>
        
        <div className="space-y-6 flex-1 text-center md:text-left">
          <div className="space-y-2">
            <h2 className="text-3xl md:text-4xl font-serif font-bold text-foreground">O Idealizador</h2>
            <p className="text-2xl font-bold text-primary">Evaldo.os</p>
          </div>
          
          <div className="space-y-4 text-muted-foreground text-lg leading-relaxed font-serif">
            <p>
              A Cathedra Digital foi concebida por <span className="text-foreground font-bold">Evaldo.os</span> como uma resposta ao chamado de evangelização na era digital. Unindo a paixão pela tecnologia de ponta com a veneração pela Tradição Católica de dois mil anos.
            </p>
            <p>
              "Nossa missão é fornecer as ferramentas mais avançadas para que cada católico possa aprofundar sua fé, estudar as escrituras e viver a liturgia com clareza, beleza e profundidade."
            </p>
          </div>

          <div className="flex flex-wrap items-center justify-center md:justify-start gap-sm pt-xs">
            {['Espiritualidade', 'Reflexão', 'Tecnologia', 'Tradição'].map(tag => (
              <span key={tag} className="px-md py-2xs bg-background border border-border rounded-full text-premium-tiny font-black uppercase tracking-widest text-muted-foreground">
                {tag}
              </span>
            ))}
          </div>
        </div>
      </div>
    </div>

    {/* Footer Quote */}
    <div className="py-3xl text-center space-y-4">
      <p className="text-2xl font-serif font-bold text-foreground tracking-tight uppercase">Ad Maiorem Dei Gloriam</p>
      <div className="w-2xl h-3xs bg-primary/30 mx-auto rounded-premium" />
      <p className="text-muted-foreground italic">Para a maior glória de Deus.</p>
    </div>
  </div>
);

export default AboutPage;
