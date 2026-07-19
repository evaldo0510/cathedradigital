import type { ReactNode } from "react";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from "@/components/ui/sheet";
import { cn } from "@/lib/utils";

interface MobileSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title?: string;
  description?: string;
  /** Altura relativa da viewport. */
  size?: "auto" | "half" | "full";
  /** Mostra a alça superior (handle) para arrastar. */
  showHandle?: boolean;
  children: ReactNode;
  /** Footer sticky (ex.: botão "Aplicar filtros"). */
  footer?: ReactNode;
  className?: string;
}

const sizeMap: Record<NonNullable<MobileSheetProps["size"]>, string> = {
  auto: "max-h-[85vh]",
  half: "h-[60vh]",
  full: "h-[100dvh]",
};

/**
 * MobileSheet — bottom-sheet padrão do Cathedra 3.0 mobile.
 * Envolve o Sheet do shadcn para garantir handle, safe-area, e footer sticky.
 */
export function MobileSheet({
  open,
  onOpenChange,
  title,
  description,
  size = "auto",
  showHandle = true,
  children,
  footer,
  className,
}: MobileSheetProps) {
  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent
        side="bottom"
        className={cn(
          "flex flex-col gap-0 rounded-t-2xl border-t border-stitch-outline-variant",
          "bg-stitch-surface p-0 text-stitch-on-surface",
          sizeMap[size],
          className,
        )}
        style={{ paddingBottom: "var(--stitch-mobile-safe-bottom)" }}
      >
        {showHandle && (
          <div className="flex justify-center pt-2 pb-1">
            <span
              aria-hidden="true"
              className="h-1 w-10 rounded-full bg-stitch-outline-variant"
            />
          </div>
        )}

        {(title || description) && (
          <SheetHeader className="px-[var(--stitch-margin-mobile)] pt-2 pb-3 text-left">
            {title && (
              <SheetTitle
                className={cn(
                  "font-[var(--font-stitch-display)] text-[22px] leading-tight",
                  "text-stitch-primary",
                )}
              >
                {title}
              </SheetTitle>
            )}
            {description && (
              <SheetDescription
                className={cn(
                  "font-[var(--font-stitch-body)] text-[15px] leading-snug",
                  "text-stitch-on-surface-variant",
                )}
              >
                {description}
              </SheetDescription>
            )}
          </SheetHeader>
        )}

        <div className="flex-1 overflow-y-auto px-[var(--stitch-margin-mobile)] pb-4">
          {children}
        </div>

        {footer && (
          <div
            className={cn(
              "sticky bottom-0 border-t border-stitch-outline-variant/60",
              "bg-stitch-surface/95 px-[var(--stitch-margin-mobile)] py-3 backdrop-blur-md",
            )}
          >
            {footer}
          </div>
        )}
      </SheetContent>
    </Sheet>
  );
}
