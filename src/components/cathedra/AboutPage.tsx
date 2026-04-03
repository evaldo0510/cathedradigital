import React from 'react';
import { Icons } from '../../constants';

const AboutPage: React.FC = () => (
  <div className="max-w-3xl mx-auto space-y-12">
    <div className="text-center space-y-3">
      <div className="inline-flex items-center gap-2 px-3 py-1 bg-primary/10 rounded-full">
        <Icons.Cross className="w-4 h-4 text-primary" />
        <span className="text-[9px] font-black uppercase tracking-[0.2em] text-primary">Manifesto</span>
      </div>
      <h1 className="text-3xl md:text-5xl font-serif font-bold text-foreground">Sobre a Cathedra Digital</h1>
    </div>

    <div className="space-y-8 font-serif text-foreground/90 leading-relaxed text-base md:text-lg">
      <blockquote className="text-2xl md:text-3xl font-bold text-foreground italic text-center border-l-4 border-primary pl-6 py-4">
        "A fé não foi feita para confundir. Foi feita para ser compreendida, vivida e transmitida."
      </blockquote>

      <div className="space-y-4">
        <h2 className="text-2xl font-bold text-foreground not-italic">Nossa Missão</h2>
        <p>A Cathedra Digital nasceu de uma convicção: a riqueza da tradição católica — sua teologia, liturgia, moral, espiritualidade e história — deve ser acessível a todos, sem diluição e sem complicação.</p>
        <p>Não somos um site de curiosidades religiosas. Somos uma plataforma de formação. Cada recurso foi pensado para conduzir o fiel da leitura à compreensão, da compreensão à reflexão, e da reflexão à vivência.</p>
      </div>

      <div className="space-y-4">
        <h2 className="text-2xl font-bold text-foreground not-italic">O que nos diferencia</h2>
        <ul className="space-y-3">
          {[
            'Bíblia conectada ao Catecismo e ao Magistério — nunca fragmentada.',
            'Textos oficiais integrais, não resumos ou paráfrases.',
            'Inteligência Artificial a serviço da Tradição, não contra ela.',
            'Experiência de estudo progressiva: do básico ao avançado.',
            'Design contemplativo que convida à reflexão, não à distração.',
          ].map((item, i) => (
            <li key={i} className="flex items-start gap-3">
              <div className="w-2 h-2 bg-primary rounded-full mt-2.5 shrink-0" />
              <span>{item}</span>
            </li>
          ))}
        </ul>
      </div>

      <div className="space-y-4">
        <h2 className="text-2xl font-bold text-foreground not-italic">Nossos Pilares</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {[
            { icon: <Icons.Book className="w-6 h-6" />, title: 'Escritura', desc: 'Os 73 livros da Bíblia Católica, com referências cruzadas e contexto.' },
            { icon: <Icons.Cross className="w-6 h-6" />, title: 'Tradição', desc: 'Catecismo, Magistério, Concílios e Doutrina Social da Igreja.' },
            { icon: <Icons.Heart className="w-6 h-6" />, title: 'Oração', desc: 'Rosário, Via Sacra, Missal e orações tradicionais.' },
            { icon: <Icons.Star className="w-6 h-6" />, title: 'Formação', desc: 'Trilhas de estudo, quizzes e São Tomás de Aquino.' },
          ].map(pillar => (
            <div key={pillar.title} className="bg-card border border-border rounded-2xl p-5 space-y-2">
              <div className="text-primary">{pillar.icon}</div>
              <h3 className="font-bold text-foreground not-italic">{pillar.title}</h3>
              <p className="text-sm text-muted-foreground">{pillar.desc}</p>
            </div>
          ))}
        </div>
      </div>

      <div className="bg-muted rounded-2xl p-8 text-center space-y-3">
        <p className="font-bold text-foreground not-italic text-xl">Ad Maiorem Dei Gloriam</p>
        <p className="text-muted-foreground italic text-sm">Para a maior glória de Deus.</p>
      </div>
    </div>
  </div>
);

export default AboutPage;
