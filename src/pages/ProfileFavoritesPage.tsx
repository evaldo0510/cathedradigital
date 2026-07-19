/**
 * ProfileFavoritesPage — lista os favoritos do usuário (bíblia + orações + trechos)
 * agrupados por tipo, com botão para remover.
 */

import { useMemo } from "react";
import { Link, useNavigate } from "react-router-dom";
import { ArrowLeft, Star, Trash2 } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { useDevotionalFavorites } from "@/hooks/useDevotionalFavorites";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

const TYPE_LABEL: Record<string, string> = {
  bible_verse: "Versículos",
  rosary_mystery_set: "Rosário",
  viacrucis_station: "Via Crucis",
  breviary_hour: "Breviário",
  prayer: "Orações",
  litany: "Ladainhas",
  missal_part: "Missal",
};

export default function ProfileFavoritesPage() {
  const { user, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const { items, loading, remove } = useDevotionalFavorites();

  const grouped = useMemo(() => {
    const m = new Map<string, typeof items>();
    for (const it of items) {
      const arr = m.get(it.content_type) ?? [];
      arr.push(it);
      m.set(it.content_type, arr);
    }
    return Array.from(m.entries());
  }, [items]);

  if (!authLoading && !user) {
    return (
      <div className="mx-auto max-w-2xl p-6 text-center">
        <p className="text-muted-foreground">Faça login para ver seus favoritos.</p>
        <Button className="mt-4" onClick={() => navigate("/login")}>
          Entrar
        </Button>
      </div>
    );
  }

  const handleRemove = async (contentType: string, contentId: string | null) => {
    if (!contentId) return;
    try {
      await remove({ contentType, contentId });
      toast.success("Removido dos favoritos");
    } catch {
      toast.error("Erro ao remover");
    }
  };

  return (
    <div className="mx-auto max-w-3xl px-4 py-6 md:py-10">
      <div className="mb-6 flex items-center gap-3">
        <Button variant="ghost" size="icon" onClick={() => navigate(-1)} aria-label="Voltar">
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <div>
          <p className="text-[11px] font-bold uppercase tracking-[0.2em] text-primary">
            Cathedra · Perfil
          </p>
          <h1 className="font-serif text-3xl font-bold">Meus Favoritos</h1>
        </div>
      </div>

      {loading && <p className="text-muted-foreground">Carregando…</p>}

      {!loading && items.length === 0 && (
        <div className="rounded-2xl border border-dashed border-border p-10 text-center">
          <Star className="mx-auto mb-3 h-8 w-8 text-muted-foreground" />
          <p className="text-muted-foreground">
            Você ainda não favoritou nada. Toque na estrela em uma oração ou versículo para salvar aqui.
          </p>
        </div>
      )}

      {grouped.map(([type, list]) => (
        <section key={type} className="mb-8">
          <h2 className="mb-3 text-xs font-black uppercase tracking-[0.25em] text-primary/70">
            {TYPE_LABEL[type] ?? type}
          </h2>
          <ul className="space-y-2">
            {list.map((it) => (
              <li
                key={it.id}
                className="flex items-start gap-3 rounded-xl border border-border bg-card p-4"
              >
                <div className="min-w-0 flex-1">
                  {it.url ? (
                    <Link to={it.url} className="block">
                      <p className="font-serif text-lg font-semibold hover:text-primary">
                        {it.title ?? "(sem título)"}
                      </p>
                    </Link>
                  ) : (
                    <p className="font-serif text-lg font-semibold">
                      {it.title ?? "(sem título)"}
                    </p>
                  )}
                  {it.content && (
                    <p className="mt-1 line-clamp-2 text-sm text-muted-foreground">{it.content}</p>
                  )}
                </div>
                <button
                  type="button"
                  aria-label="Remover favorito"
                  onClick={() => handleRemove(it.content_type, it.content_id)}
                  className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-muted-foreground hover:bg-muted hover:text-destructive"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </li>
            ))}
          </ul>
        </section>
      ))}
    </div>
  );
}
