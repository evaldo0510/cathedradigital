import { MobileSheet } from "./MobileSheet";
import { cn } from "@/lib/utils";
import type { DevotionalIndexItem } from "./DevotionalReaderContext";

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  items: DevotionalIndexItem[];
}

export function DevotionalIndexSheet({ open, onOpenChange, title, items }: Props) {
  return (
    <MobileSheet open={open} onOpenChange={onOpenChange} title={title} size="auto">
      <ul className="flex flex-col gap-1 py-2">
        {items.length === 0 && (
          <li className="py-6 text-center text-sm text-stitch-on-surface-variant">
            Sem seções para este leitor.
          </li>
        )}
        {items.map((item) => (
          <li key={item.id}>
            <button
              type="button"
              onClick={() => {
                item.onSelect();
                onOpenChange(false);
              }}
              className={cn(
                "flex w-full items-start gap-3 rounded-xl px-3 py-3 text-left transition-colors",
                "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-stitch-secondary",
                item.active
                  ? "bg-stitch-primary/10 text-stitch-primary"
                  : "hover:bg-stitch-surface-container text-stitch-on-surface",
              )}
              aria-current={item.active ? "true" : undefined}
            >
              <div className="flex-1 min-w-0">
                <p className="font-[var(--font-stitch-display)] text-[15px] leading-tight truncate">
                  {item.label}
                </p>
                {item.hint && (
                  <p className="mt-0.5 text-[12px] text-stitch-on-surface-variant truncate">
                    {item.hint}
                  </p>
                )}
              </div>
              {item.active && (
                <span className="mt-1 inline-block h-2 w-2 rounded-full bg-stitch-primary" aria-hidden />
              )}
            </button>
          </li>
        ))}
      </ul>
    </MobileSheet>
  );
}
