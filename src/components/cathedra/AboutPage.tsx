import React from 'react';
import { Icons } from '../../constants';

const AboutPage: React.FC = () => (
  <div className="max-w-4xl mx-auto space-y-16 py-8 px-4 md:px-0 animate-in fade-in slide-in-from-bottom-4 duration-1000">
    {/* Hero Section */}
    <div className="text-center space-y-4">
      <div className="inline-flex items-center gap-2 px-4 py-1.5 bg-primary/10 rounded-full border border-primary/20">
        <Icons.Cross className="w-4 h-4 text-primary" />
        <span className="text-[10px] font-black uppercase tracking-[0.2em] text-primary">Manifesto & Identidade</span>
      </div>
      <h1 className="text-4xl md:text-6xl font-serif font-bold text-foreground tracking-tight">Sobre a Cathedra Digital</h1>
      <p className="text-muted-foreground text-lg max-w-2xl mx-auto">Unindo a tradição milenar da Igreja à vanguarda tecnológica para a glória de Deus.</p>
    </div>

    {/* Quick Navigation Anchors */}
    <nav className="flex flex-wrap justify-center gap-2 md:gap-8 py-4 border-y border-border/50 sticky top-0 bg-background/95 backdrop-blur-sm z-20">
      {[
        { label: 'Missão', href: '#missao', icon: <Icons.Target className="w-4 h-4" /> },
        { label: 'História', href: '#historia', icon: <Icons.History className="w-4 h-4" /> },
        { label: 'Redes Sociais', href: '#redes-sociais', icon: <Icons.Instagram className="w-4 h-4" /> },
      ].map((link) => (
        <a 
          key={link.href} 
          href={link.href}
          className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-muted-foreground hover:text-primary hover:bg-primary/5 rounded-full transition-all"
        >
          {link.icon}
          {link.label}
        </a>
      ))}
    </nav>

    {/* Big Quote */}
    <div className="relative py-12">
      <div className="absolute top-0 left-0 text-primary/5 -z-10">
        <Icons.Quote className="w-32 h-32 -rotate-12" />
      </div>
      <blockquote className="text-2xl md:text-4xl font-serif font-bold text-foreground italic text-center leading-relaxed">
        "A fé não foi feita para confundir. Foi feita para ser compreendida, vivida e transmitida."
      </blockquote>
    </div>

    <div className="grid grid-cols-1 md:grid-cols-2 gap-12 items-start">
      {/* Missão Section */}
      <div id="missao" className="scroll-mt-24 space-y-6">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
            <Icons.Target className="w-5 h-5 text-primary" />
          </div>
          <h2 className="text-3xl font-serif font-bold text-foreground">Nossa Missão</h2>
        </div>
        <div className="space-y-4 text-muted-foreground leading-relaxed text-lg">
          <p>A Cathedra Digital nasceu de uma convicção profunda: a riqueza incomensurável da tradição católica — sua teologia, liturgia, moral e espiritualidade — deve ser acessível a todo fiel, sem diluição e sem complicação.</p>
          <p>Nosso objetivo primordial é fornecer uma plataforma de formação contínua, onde cada recurso é meticulosamente desenhado para conduzir o usuário da simples leitura à profunda compreensão, e da compreensão à vivência cristã autêntica.</p>
        </div>
      </div>

      {/* História Section */}
      <div id="historia" className="scroll-mt-24 space-y-6">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
            <Icons.History className="w-5 h-5 text-primary" />
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
    <div id="redes-sociais" className="scroll-mt-24 bg-muted/40 rounded-3xl p-8 md:p-12 border border-border/50">
      <div className="text-center space-y-8">
        <div className="space-y-2">
          <h2 className="text-2xl font-serif font-bold text-foreground">Siga-nos nas Redes Sociais</h2>
          <p className="text-muted-foreground">Acompanhe reflexões diárias e atualizações da plataforma.</p>
        </div>
        
        <div className="flex flex-wrap justify-center gap-6">
          {[
            { icon: <Icons.Instagram className="w-6 h-6" />, label: 'Instagram', url: 'https://instagram.com/cathedra.digital', color: 'hover:text-pink-600' },
            { icon: <Icons.Youtube className="w-6 h-6" />, label: 'YouTube', url: 'https://youtube.com/@cathedradigital', color: 'hover:text-red-600' },
            { icon: <Icons.Twitter className="w-6 h-6" />, label: 'X (Twitter)', url: 'https://twitter.com/cathedradigital', color: 'hover:text-sky-500' },
            { icon: <Icons.Facebook className="w-6 h-6" />, label: 'Facebook', url: 'https://facebook.com/cathedradigital', color: 'hover:text-blue-600' },
            { icon: <Icons.Whatsapp className="w-6 h-6" />, label: 'WhatsApp', url: 'https://wa.me/seulink', color: 'hover:text-green-600' },
          ].map((social) => (
            <a
              key={social.label}
              href={social.url}
              target="_blank"
              rel="noopener noreferrer"
              className={`flex flex-col items-center gap-2 p-4 rounded-2xl bg-background border border-border shadow-sm transition-all hover:shadow-md hover:-translate-y-1 ${social.color} group`}
            >
              <div className="transition-transform duration-300 group-hover:scale-110">
                {social.icon}
              </div>
              <span className="text-[10px] font-black uppercase tracking-widest text-muted-foreground group-hover:text-inherit">
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

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {[
          { icon: <Icons.Book className="w-8 h-8" />, title: 'Escritura', desc: 'Os 73 livros da Bíblia Católica, com referências cruzadas e contexto teológico profundo.' },
          { icon: <Icons.Cross className="w-8 h-8" />, title: 'Tradição', desc: 'Acesso integral ao Catecismo, Magistério, Concílios e toda a Doutrina da Igreja.' },
          { icon: <Icons.Heart className="w-8 h-8" />, title: 'Oração', desc: 'Rosário, Via Sacra, Missal Romano e um devocionário completo para sua vida espiritual.' },
          { icon: <Icons.Star className="w-8 h-8" />, title: 'Formação', desc: 'Trilhas de estudo progressivas, quizzes de conhecimento e a Suma Teológica de São Tomás.' },
        ].map(pillar => (
          <div key={pillar.title} className="bg-card border border-border rounded-3xl p-6 space-y-4 hover:border-primary/30 transition-colors group">
            <div className="text-primary bg-primary/5 w-16 h-16 rounded-2xl flex items-center justify-center transition-transform duration-500 group-hover:rotate-6">
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
    <div className="pt-16 border-t border-border/40">
      <div className="flex flex-col md:flex-row items-center gap-10 md:gap-16 bg-muted/20 rounded-[2.5rem] p-8 md:p-12 border border-border/30">
        <div className="shrink-0">
          <div className="w-48 h-48 md:w-64 md:h-64 rounded-full border-4 border-background p-2 relative bg-background shadow-2xl overflow-hidden group">
            <div className="w-full h-full rounded-full bg-muted flex items-center justify-center overflow-hidden border border-border group-hover:scale-105 transition-transform duration-700">
              <Icons.User className="w-24 h-24 text-muted-foreground/30" />
            </div>
            <div className="absolute bottom-2 right-2 bg-primary text-white p-3 rounded-full shadow-lg border-4 border-background">
              <Icons.Feather className="w-5 h-5" />
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

          <div className="flex flex-wrap items-center justify-center md:justify-start gap-3 pt-2">
            {['Espiritualidade', 'Reflexão', 'Tecnologia', 'Tradição'].map(tag => (
              <span key={tag} className="px-4 py-1.5 bg-background border border-border rounded-full text-[10px] font-black uppercase tracking-widest text-muted-foreground">
                {tag}
              </span>
            ))}
          </div>
        </div>
      </div>
    </div>

    {/* Footer Quote */}
    <div className="py-16 text-center space-y-4">
      <p className="text-2xl font-serif font-bold text-foreground tracking-tight uppercase">Ad Maiorem Dei Gloriam</p>
      <div className="w-12 h-0.5 bg-primary/30 mx-auto rounded-full" />
      <p className="text-muted-foreground italic">Para a maior glória de Deus.</p>
    </div>
  </div>
);

export default AboutPage;
