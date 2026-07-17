import React from 'react';
import { Link, NavLink, useLocation, useNavigate } from 'react-router-dom';
import { Search, RotateCcw, User, Church, BookOpen, Flame, Compass, ArrowLeft, Info } from 'lucide-react';

/**
 * Cathedra 2.0 — Casca do Protótipo Navegável (baixa fidelidade).
 * Isolado sob /prototype-2.0. Não interfere no app atual.
 * Baseado em docs/cathedra-2.0/05-WIREFRAMES.md.
 */

const BASE = '/prototype-2.0';

const NAV = [
  { to: `${BASE}/atrio`, icon: Church, label: 'Átrio' },
  { to: `${BASE}/estudar`, icon: BookOpen, label: 'Estudar' },
  { to: `${BASE}/rezar`, icon: Flame, label: 'Rezar' },
  { to: `${BASE}/formar-se`, icon: Compass, label: 'Formar-se' },
  { to: `${BASE}/minha-jornada`, icon: User, label: 'Jornada' },
];

interface Props {
  title?: string;
  back?: string;
  liturgicalColor?: string; // hsl
  children: React.ReactNode;
  hideNav?: boolean;
  showNexusToggle?: boolean;
}

export const PrototypeShell: React.FC<Props> = ({
  title,
  back,
  liturgicalColor = 'hsl(120 30% 35%)', // verde Tempo Comum
  children,
  hideNav = false,
  showNexusToggle = false,
}) => {
  const navigate = useNavigate();
  const location = useLocation();

  return (
    <div className="min-h-dvh bg-background text-foreground flex flex-col font-sans">
      {/* Header */}
      <header className="sticky top-0 z-20 bg-background/95 backdrop-blur border-b border-border">
        <div className="flex items-center justify-between h-12 px-3 max-w-2xl mx-auto w-full">
          <div className="flex items-center gap-2 min-w-0">
            {back && (
              <button
                onClick={() => navigate(back)}
                className="p-1.5 -ml-1.5 rounded hover:bg-muted"
                aria-label="Voltar"
              >
                <ArrowLeft size={18} />
              </button>
            )}
            <span className="font-serif text-base truncate">{title ?? 'Cathedra'}</span>
          </div>
          <div className="flex items-center gap-1">
            <Link to={`${BASE}/pesquisar`} state={{ from: location.pathname }} className="p-1.5 rounded hover:bg-muted" aria-label="Buscar">
              <Search size={18} />
            </Link>
            <Link to={`${BASE}/leitor?ref=jo15`} className="p-1.5 rounded hover:bg-muted" aria-label="Retomar">
              <RotateCcw size={18} />
            </Link>
            <Link to={`${BASE}/minha-jornada`} className="p-1.5 rounded hover:bg-muted" aria-label="Perfil">
              <User size={18} />
            </Link>
          </div>
        </div>
        {/* linha litúrgica ambiente */}
        <div style={{ background: liturgicalColor }} className="h-[2px] w-full opacity-70" />
      </header>

      {/* Conteúdo */}
      <main className="flex-1 max-w-2xl mx-auto w-full px-4 pt-4 pb-24">
        {children}
      </main>

      {/* Bottom nav */}
      {!hideNav && (
        <nav className="fixed bottom-0 inset-x-0 z-20 bg-background/95 backdrop-blur border-t border-border">
          <ul className="grid grid-cols-5 max-w-2xl mx-auto">
            {NAV.map(({ to, icon: Icon, label }) => (
              <li key={to}>
                <NavLink
                  to={to}
                  className={({ isActive }) =>
                    `flex flex-col items-center justify-center gap-0.5 py-2 text-[10px] ${
                      isActive ? 'text-primary font-semibold' : 'text-muted-foreground'
                    }`
                  }
                >
                  <Icon size={18} />
                  <span>{label}</span>
                </NavLink>
              </li>
            ))}
          </ul>
        </nav>
      )}

      {/* Marca protótipo */}
      <Link
        to={BASE}
        className="fixed top-14 right-2 z-30 flex items-center gap-1 px-2 py-0.5 rounded-full bg-primary/10 text-primary text-[10px] font-medium hover:bg-primary/20"
        title="Voltar ao índice do protótipo"
      >
        <Info size={10} /> Protótipo 2.0
      </Link>
    </div>
  );
};

export default PrototypeShell;
