import * as React from "react";
import { cn } from "@/lib/utils";
import { motion, AnimatePresence, HTMLMotionProps } from "framer-motion";
import { useReadingSettings } from "@/contexts/ReadingSettingsContext";
import { Icons } from "@/constants";

interface CathedraOverlayProps {
  isOpen: boolean;
  onClose: () => void;
  children: React.ReactNode;
  className?: string;
  showClose?: boolean;
}

export const CathedraOverlay: React.FC<CathedraOverlayProps> = ({
  isOpen,
  onClose,
  children,
  className,
  showClose = true,
}) => {
  const { settings } = useReadingSettings();

  React.useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [isOpen]);

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[150] flex items-center justify-center p-lg md:p-2xl">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="absolute inset-0 bg-background/60 backdrop-blur-xl"
          />
          
          <motion.div
            initial={settings.reduceAnimations ? { opacity: 0 } : { opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
            className={cn(
              "relative w-full max-w-4xl bg-card border border-primary/5 rounded-premium shadow-premium p-xl md:p-3xl max-h-[90dvh] overflow-y-auto",
              className
            )}
          >
            {showClose && (
              <button
                onClick={onClose}
                className="absolute top-xl right-xl p-sm rounded-full hover:bg-primary/5 text-primary/40 hover:text-primary transition-premium"
              >
                <Icons.X className="w-lg h-lg" />
              </button>
            )}
            {children}
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};
