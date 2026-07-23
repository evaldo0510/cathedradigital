import React from 'react';
import { Link } from 'react-router-dom';
import { Icons } from '../../constants';

interface LegalDoc {
  path: string;
  label: string;
  desc: string;
  icon: React.ReactNode;
}

const DOCS: LegalDoc[] = [
  {
    path: '/legal/privacy',
    label: 'Política de Privacidade',
    desc: 'Quais dados coletamos, por quê, por quanto tempo e quais são os seus direitos como titular.',
    icon: <Icons.Lock className="w-spacing-lg h-spacing-lg" />,
  },
  {
    path: '/legal/lgpd',
    label: 'LGPD — Lei Geral de Proteção de Dados',
    desc: 'Como a Cathedra cumpre a Lei nº 13.709/2018: bases legais, DPO, incidentes e canal do titular.',
    icon: <Icons.Shield className="w-spacing-lg h-spacing-lg" />,
  },
  {
    path: '/terms',
    label: 'Termos de Uso',
    desc: 'Direitos, deveres, propriedade intelectual e regras de utilização da plataforma.',
    icon: <Icons.Book className="w-spacing-lg h-spacing-lg" />,
  },
  {
    path: '/transparencia',
    label: 'Transparência',
    desc: 'Relatório de uso de recursos, apostolado apoiado e destinação dos aportes.',
    icon: <Icons.Eye className="w-spacing-lg h-spacing-lg" />,
  },
];

const LegalCenterPage: React.FC = () => (
  <div className="w-full max-w-4xl mx-auto space-y-spacing-2xl py-spacing-xl animate-in fade-in slide-in-from-bottom-4 duration-700">
    <header className="text-center space-y-spacing-md">
      <div className="inline-flex items-center gap-spacing-xs px-spacing-md py-spacing-2xs bg-primary/[0.02] rounded-premium-full border border-primary/10">
        <Icons.Shield className="w-spacing-md h-spacing-md text-primary" />
        <span className="text-premium-xs font-black uppercase tracking-[0.2em] text-primary">
          Centro Legal
        </span>
      </div>
      <h1 className="text-premium-4xl md:text-premium-5xl font-serif font-bold text-foreground tracking-tight">
        Centro Legal & Privacidade
      </h1>
      <p className="text-muted-foreground text-premium-lg max-w-2xl mx-auto">
        Todos os documentos institucionais da Cathedra Digital em um só lugar — clareza, respeito ao usuário
        e conformidade com a legislação brasileira.
      </p>
    </header>

    <section className="grid grid-cols-1 md:grid-cols-2 gap-spacing-lg">
      {DOCS.map((doc) => (
        <Link
          key={doc.path}
          to={doc.path}
          className="group bg-card border border-primary/5 rounded-premium p-spacing-lg space-y-spacing-sm hover:border-primary/30 hover:shadow-premium transition-all"
        >
          <div className="flex items-center gap-spacing-sm">
            <div className="w-spacing-2xl h-spacing-2xl rounded-premium-full bg-primary/[0.03] border border-primary/10 flex items-center justify-center text-primary/70 group-hover:text-primary transition-colors">
              {doc.icon}
            </div>
            <h2 className="text-premium-lg font-serif font-bold text-foreground group-hover:text-primary transition-colors">
              {doc.label}
            </h2>
          </div>
          <p className="text-premium-sm text-muted-foreground leading-relaxed">{doc.desc}</p>
          <div className="pt-spacing-xs text-premium-xs font-black uppercase tracking-widest text-primary/70 group-hover:text-primary flex items-center gap-spacing-2xs">
            Ler documento
            <Icons.ArrowRight className="w-spacing-sm h-spacing-sm transition-transform group-hover:translate-x-1" />
          </div>
        </Link>
      ))}
    </section>

    <section className="bg-primary/[0.01] rounded-premium border border-primary/5 p-spacing-lg space-y-spacing-sm text-center">
      <h2 className="text-premium-lg font-serif font-bold text-foreground">Canal do titular de dados</h2>
      <p className="text-muted-foreground text-premium-sm max-w-2xl mx-auto">
        Para exercer qualquer direito previsto na LGPD (acesso, correção, portabilidade, exclusão),
        fale com nosso encarregado (DPO).
      </p>
      <Link
        to="/contato"
        className="inline-flex items-center gap-spacing-xs px-spacing-md py-spacing-xs bg-primary text-primary-foreground rounded-premium-full text-premium-sm font-semibold hover:opacity-90 transition-opacity"
      >
        <Icons.Mail className="w-spacing-md h-spacing-md" />
        Falar com o DPO
      </Link>
    </section>
  </div>
);

export default LegalCenterPage;
