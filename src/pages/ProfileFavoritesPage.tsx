/**
 * ProfileFavoritesPage — lista os favoritos do usuário (bíblia + orações + trechos)
 * agrupados por tipo, com busca por texto e filtro por categoria.
 */

import { useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { ArrowLeft, Search, Star, Trash2, X } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { useDevotionalFavorites } from "@/hooks/useDevotionalFavorites";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

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

  const [query, setQuery] = useState("");
  const [typeFilter, setTypeFilter] = useState<string>("all");

  const availableTypes = useMemo(() => {
    const set = new Set<string>();
    for (const it of items) set.add(it.content_type);
    return Array.from(set);
  }, [items]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return items.filter((it) => {
      if (typeFilter !== "all" && it.content_type !== typeFilter) return false;
      if (!q) return true;
      const hay = `${it.title ?? ""}\n${it.content ?? ""}`.toLowerCase();
      return hay.includes(q);
    });
  }, [items, query, typeFilter]);

  const grouped = useMemo(() => {
    const m = new Map<string, typeof items>();
    for (const it of filtered) {
      const arr = m.get(it.content_type) ?? [];
      arr.push(it);
      m.set(it.content_type, arr);
    }
    return Array.from(m.entries());
  }, [filtered]);

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

  const hasItems = items.length > 0;
  const hasFilters = query.trim() !== "" || typeFilter !== "all";

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

      {!loading && !hasItems && (
        <div className="rounded-2xl border border-dashed border-border p-10 text-center">
          <Star className="mx-auto mb-3 h-8 w-8 text-muted-foreground" aria-hidden />
          <p className="text-muted-foreground">
            Você ainda não favoritou nada. Toque na estrela em uma oração ou versículo para salvar aqui.
          </p>
        </div>
      )}

      {!loading && hasItems && (
        <>
          {/* Busca */}
          <div className="mb-4">
            <label htmlFor="fav-search" className="sr-only">
              Buscar nos favoritos por título ou trecho
            </label>
            <div className="relative">
              <Search
                className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground"
                aria-hidden
              />
              <Input
                id="fav-search"
                type="search"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Buscar por título ou trecho…"
                className="pl-9 pr-9"
                data-testid="favorites-search"
              />
              {query && (
                <button
                  type="button"
                  onClick={() => setQuery("")}
                  aria-label="Limpar busca"
                  className="absolute right-2 top-1/2 inline-flex h-7 w-7 -translate-y-1/2 items-center justify-center rounded-full text-muted-foreground hover:bg-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
                >
                  <X className="h-4 w-4" />
                </button>
              )}
            </div>
          </div>

          {/* Filtros por tipo */}
          <div
            role="group"
            aria-label="Filtrar por categoria"
            className="mb-6 flex flex-wrap gap-2"
          >
            {[["all", "Todos"] as const, ...availableTypes.map(
              (t) => [t, TYPE_LABEL[t] ?? t] as const,
            )].map(([value, label]) => {
              const active = typeFilter === value;
              return (
                <button
                  key={value}
                  type="button"
                  onClick={() => setTypeFilter(value)}
                  aria-pressed={active}
                  data-testid={`favorites-filter-${value}`}
                  className={cn(
                    "rounded-full border px-3 py-1.5 text-xs font-bold uppercase tracking-wider transition-colors",
                    "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2",
                    active
                      ? "border-primary bg-primary text-primary-foreground"
                      : "border-border bg-card text-muted-foreground hover:text-primary",
                  )}
                >
                  {label}
                </button>
              );
            })}
          </div>

          {/* Contador acessível */}
          <p
            className="mb-4 text-xs text-muted-foreground"
            aria-live="polite"
            data-testid="favorites-count"
          >
            {filtered.length} de {items.length} favoritos
            {hasFilters && (
              <>
                {" · "}
                <button
                  type="button"
                  onClick={() => {
                    setQuery("");
                    setTypeFilter("all");
                  }}
                  className="underline hover:text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
                >
                  limpar filtros
                </button>
              </>
            )}
          </p>

          {filtered.length === 0 && (
            <div className="rounded-2xl border border-dashed border-border p-10 text-center">
              <p className="text-muted-foreground">
                Nenhum favorito corresponde à busca.
              </p>
            </div>
          )}
        </>
      )}

      {grouped.map(([type, list]) => (
        <section key={type} className="mb-8" aria-label={TYPE_LABEL[type] ?? type}>
          <h2 className="mb-3 text-xs font-black uppercase tracking-[0.25em] text-primary/70">
            {TYPE_LABEL[type] ?? type}
          </h2>
          <ul className="space-y-2">
            {list.map((it) => (
              <li
                key={it.id}
                className="flex items-start gap-3 rounded-xl border border-border bg-card p-4"
                data-testid="favorite-item"
              >
                <div className="min-w-0 flex-1">
                  {it.url ? (
                    <Link
                      to={it.url}
                      className="block rounded focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
                    >
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
                  aria-label={`Remover ${it.title ?? "favorito"} dos favoritos`}
                  onClick={() => handleRemove(it.content_type, it.content_id)}
                  className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-muted-foreground hover:bg-muted hover:text-destructive focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-destructive"
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
