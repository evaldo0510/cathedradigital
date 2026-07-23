import React from 'react';
import { Link } from 'react-router-dom';
import { Icons } from '../../constants';

/**
 * Manifesto da Cathedra — página de identidade fundacional.
 * Segue a estética institucional (mesma linguagem de AboutPage),
 * mas com respiração maior: uma linha por afirmação, tipografia serif ampla.
 */
const ManifestoPage: React.FC = () => (
  <div className="w-full max-w-3xl mx-auto space-y-spacing-3xl py-spacing-xl animate-in fade-in slide-in-from-bottom-4 duration-1000">
    {/* Cabeçalho */}
    <header className="text-center space-y-spacing-md">
      <div className="inline-flex items-center gap-spacing-xs px-spacing-md py-spacing-2xs bg-primary/[0.02] rounded-premium-full border border-primary/10">
        <Icons.Feather className="w-spacing-md h-spacing-md text-primary" />
        <span className="text-premium-xs font-black uppercase tracking-[0.2em] text-primary">Manifesto</span>
      </div>
      <h1 className="text-premium-4xl md:text-premium-6xl font-serif font-bold text-foreground tracking-tight">
        Manifesto da Cathedra
      </h1>
      <p className="text-muted-foreground text-premium-lg">
        A convicção que sustenta cada linha, cada verbete, cada oração.
      </p>
    </header>

    {/* Corpo do manifesto — linhas contemplativas */}
    <section className="space-y-spacing-lg text-center font-serif">
      {[
        'A verdade não é apenas estudada.',
        'Ela é contemplada.',
        'Ela é vivida.',
        'Ela transforma.',
      ].map((line, i) => (
        <p
          key={i}
          className="text-premium-2xl md:text-premium-3xl font-bold text-foreground leading-relaxed"
        >
          {line}
        </p>
      ))}

      <div className="w-spacing-2xl h-spacing-3xs bg-primary/30 mx-auto rounded-premium my-spacing-2xl" />

      <p className="text-premium-xl md:text-premium-2xl text-muted-foreground italic leading-loose max-w-2xl mx-auto">
        A Cathedra Digital nasceu para unir <span className="text-foreground font-semibold">Escritura</span>,{' '}
        <span className="text-foreground font-semibold">Tradição</span>,{' '}
        <span className="text-foreground font-semibold">Liturgia</span>,{' '}
        <span className="text-foreground font-semibold">Oração</span> e{' '}
        <span className="text-foreground font-semibold">Inteligência Artificial</span> em uma única
        experiência de formação católica.
      </p>
    </section>

    {/* Convicções */}
    <section className="space-y-spacing-lg pt-spacing-2xl border-t border-border/40">
      <h2 className="text-premium-2xl font-serif font-bold text-foreground text-center">
        No que acreditamos
      </h2>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-spacing-lg">
        {[
          {
            icon: <Icons.Book className="w-spacing-lg h-spacing-lg" />,
            title: 'Fidelidade ao Magistério',
            desc: 'Cada texto passa por revisão editorial rigorosa. Nada é diluído, nada é adaptado ao gosto do tempo.',
          },
          {
            icon: <Icons.Heart className="w-spacing-lg h-spacing-lg" />,
            title: 'A oração no centro',
            desc: 'Antes de ser plataforma de estudo, a Cathedra é um lugar para rezar. A tecnologia serve à contemplação.',
          },
          {
            icon: <Icons.Star className="w-spacing-lg h-spacing-lg" />,
            title: 'Beleza como catequese',
            desc: 'Tipografia, imagem e silêncio evangelizam. Uma interface digna do conteúdo que ela carrega.',
          },
          {
            icon: <Icons.Cross className="w-spacing-lg h-spacing-lg" />,
            title: 'Interconexão viva',
            desc: 'Bíblia, Catecismo, Santos e Liturgia falam entre si. Não são silos — são uma só Tradição.',
          },
        ].map((c) => (
          <div
            key={c.title}
            className="bg-card border border-primary/5 rounded-premium p-spacing-lg space-y-spacing-sm shadow-premium"
          >
            <div className="text-primary/60">{c.icon}</div>
            <h3 className="text-premium-lg font-serif font-bold text-foreground">{c.title}</h3>
            <p className="text-premium-sm text-muted-foreground leading-relaxed">{c.desc}</p>
          </div>
        ))}
      </div>
    </section>

    {/* Rodapé */}
    <footer className="py-spacing-2xl text-center space-y-spacing-md">
      <p className="text-premium-xl font-serif font-bold text-foreground tracking-tight uppercase">
        Ad Maiorem Dei Gloriam
      </p>
      <div className="w-spacing-2xl h-spacing-3xs bg-primary/30 mx-auto rounded-premium" />
      <p className="text-muted-foreground italic">Para a maior glória de Deus.</p>
      <div className="pt-spacing-md flex flex-wrap justify-center gap-spacing-sm">
        <Link
          to="/about"
          className="px-spacing-md py-spacing-xs text-premium-sm font-medium text-primary hover:underline"
        >
          Sobre a Cathedra
        </Link>
        <Link
          to="/legal"
          className="px-spacing-md py-spacing-xs text-premium-sm font-medium text-primary hover:underline"
        >
          Centro Legal
        </Link>
      </div>
    </footer>
  </div>
);

export default ManifestoPage;
