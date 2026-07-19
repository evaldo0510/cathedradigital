import { useState } from "react";
import { Bell, MoreVertical } from "lucide-react";
import {
  MobileTopBar,
  MobileBottomNav,
  MobileSheet,
  MobileReaderChrome,
} from "@/components/mobile";
import { Button } from "@/components/ui/button";

/**
 * Vitrine das primitivas mobile (Etapa M1).
 * Acessar em /dev/mobile e visualizar com viewport ≤ 430px.
 */
const MobileShowcase = () => {
  const [sheetOpen, setSheetOpen] = useState(false);
  const [focusMode, setFocusMode] = useState(false);

  return (
    <div className="min-h-screen bg-stitch-background pb-32">
      {/* 1. MobileTopBar padrão */}
      <MobileTopBar
        kicker="Cathedra · Vitrine"
        title="Fundação Mobile"
        showBack
        actions={
          <button
            type="button"
            aria-label="Notificações"
            className="inline-flex h-11 w-11 items-center justify-center rounded-full text-stitch-on-surface hover:bg-stitch-surface-container"
          >
            <Bell className="h-5 w-5" />
          </button>
        }
      />

      <main className="mx-auto max-w-[430px] space-y-8 px-5 py-8">
        <section className="space-y-3">
          <h2 className="font-[var(--font-stitch-display)] text-2xl text-stitch-primary">
            Primitivas M1
          </h2>
          <p className="font-[var(--font-stitch-body)] text-[15px] text-stitch-on-surface-variant">
            Componentes de fundação para as próximas etapas mobile.
            Consumem apenas tokens <code>stitch-*</code> e respeitam
            safe-area.
          </p>
        </section>

        <section className="space-y-3">
          <p className="font-[var(--font-stitch-label)] text-[11px] font-bold uppercase tracking-[0.08em] text-stitch-secondary">
            Bottom Sheet
          </p>
          <Button
            onClick={() => setSheetOpen(true)}
            className="w-full bg-stitch-primary text-stitch-on-primary hover:bg-stitch-primary/90"
          >
            Abrir MobileSheet
          </Button>
        </section>

        <section className="space-y-3">
          <p className="font-[var(--font-stitch-label)] text-[11px] font-bold uppercase tracking-[0.08em] text-stitch-secondary">
            Reader Chrome
          </p>
          <div className="overflow-hidden rounded-xl border border-stitch-outline-variant">
            <MobileReaderChrome
              kicker="Bíblia · João"
              title="O Verbo se fez carne"
              meta="Cap. 1 · §14"
              onToggleFocus={() => setFocusMode((v) => !v)}
              onOpenTypography={() => {}}
              onShare={() => {}}
              isFocusMode={focusMode}
              extraActions={
                <button
                  type="button"
                  aria-label="Mais opções"
                  className="inline-flex h-11 w-11 items-center justify-center rounded-full text-stitch-on-surface hover:bg-stitch-surface-container"
                >
                  <MoreVertical className="h-5 w-5" />
                </button>
              }
            />
            <div className="bg-stitch-surface p-6">
              <p className="font-[var(--font-stitch-body)] text-[17px] leading-relaxed text-stitch-on-surface">
                No princípio era o Verbo, e o Verbo estava com Deus, e o Verbo
                era Deus.
              </p>
            </div>
          </div>
        </section>

        <section className="space-y-2 rounded-xl border border-stitch-outline-variant/60 bg-stitch-surface-container-low p-4">
          <p className="font-[var(--font-stitch-label)] text-[11px] font-bold uppercase tracking-[0.08em] text-stitch-secondary">
            Notas de QA
          </p>
          <ul className="space-y-1 font-[var(--font-stitch-body)] text-[14px] text-stitch-on-surface-variant">
            <li>• Área de toque mínima 44×44px em todos os ícones.</li>
            <li>• BottomNav esconde em rotas de auth e reader com foco.</li>
            <li>• Sheet respeita safe-area do iPhone.</li>
          </ul>
        </section>
      </main>

      <MobileSheet
        open={sheetOpen}
        onOpenChange={setSheetOpen}
        title="Filtros Avançados"
        description="Refine sua busca por fontes, período e território."
        size="auto"
        footer={
          <div className="flex gap-2">
            <Button
              variant="outline"
              className="flex-1"
              onClick={() => setSheetOpen(false)}
            >
              Cancelar
            </Button>
            <Button
              className="flex-1 bg-stitch-primary text-stitch-on-primary hover:bg-stitch-primary/90"
              onClick={() => setSheetOpen(false)}
            >
              Aplicar
            </Button>
          </div>
        }
      >
        <div className="space-y-4 py-2">
          {["Fontes", "Período", "Território", "Ordenação"].map((label) => (
            <div
              key={label}
              className="rounded-lg border border-stitch-outline-variant/60 bg-stitch-surface p-3"
            >
              <p className="font-[var(--font-stitch-label)] text-[12px] font-bold uppercase tracking-[0.06em] text-stitch-secondary">
                {label}
              </p>
              <p className="mt-1 font-[var(--font-stitch-body)] text-[15px] text-stitch-on-surface">
                Todos
              </p>
            </div>
          ))}
        </div>
      </MobileSheet>

      <MobileBottomNav />
    </div>
  );
};

export default MobileShowcase;
