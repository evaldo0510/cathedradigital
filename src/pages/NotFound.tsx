import { useLocation, useNavigate, Link } from "react-router-dom";
import { useEffect } from "react";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Home, Compass } from "lucide-react";

const NotFound = () => {
  const location = useLocation();
  const navigate = useNavigate();

  useEffect(() => {
    console.error("404: rota inexistente →", location.pathname);
  }, [location.pathname]);

  return (
    <main
      role="main"
      className="min-h-dvh flex items-center justify-center bg-background px-6 py-12"
    >
      <div className="max-w-md w-full text-center space-y-6">
        <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-secondary/10 border border-secondary/20 mx-auto">
          <Compass className="w-7 h-7 text-secondary" aria-hidden="true" />
        </div>

        <div className="space-y-2">
          <p className="text-[11px] font-black uppercase tracking-[0.4em] text-secondary/70">
            Página não encontrada
          </p>
          <h1 className="font-display text-5xl text-primary tracking-tight">404</h1>
          <p className="text-sm font-serif text-muted-foreground leading-relaxed">
            A rota{" "}
            <code className="px-1.5 py-0.5 rounded bg-muted text-primary/80 text-xs">
              {location.pathname}
            </code>{" "}
            não existe ou foi movida.
          </p>
        </div>

        <div className="flex flex-col sm:flex-row gap-3 justify-center pt-2">
          <Button
            variant="outline"
            onClick={() => navigate(-1)}
            className="min-h-11"
          >
            <ArrowLeft className="w-4 h-4 mr-2" aria-hidden="true" />
            Voltar
          </Button>
          <Button asChild className="min-h-11">
            <Link to="/">
              <Home className="w-4 h-4 mr-2" aria-hidden="true" />
              Ir para o Átrio
            </Link>
          </Button>
        </div>

        <nav aria-label="Atalhos" className="pt-6 border-t border-primary/5">
          <p className="text-[10px] uppercase tracking-widest text-muted-foreground mb-3">
            Talvez você procure
          </p>
          <ul className="flex flex-wrap gap-2 justify-center text-xs">
            {[
              { to: "/bible", label: "Bíblia" },
              { to: "/oracao", label: "Rezar" },
              { to: "/jornadas", label: "Formar-se" },
              { to: "/buscar", label: "Pesquisar" },
              { to: "/hoje", label: "Minha Jornada" },
            ].map((l) => (
              <li key={l.to}>
                <Link
                  to={l.to}
                  className="px-3 py-1.5 rounded-full border border-primary/10 hover:border-secondary/40 hover:bg-secondary/5 transition-colors text-primary/70"
                >
                  {l.label}
                </Link>
              </li>
            ))}
          </ul>
        </nav>
      </div>
    </main>
  );
};

export default NotFound;
