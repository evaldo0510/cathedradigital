import React, { useEffect, useState } from 'react';

interface Props {
  /** valor original recebido em ?date= (inválido) */
  received: string | null;
  /** valor com o qual a URL foi reescrita (YYYY-MM-DD) */
  replacedWith: string;
  /** em ms; após esse tempo o aviso é escondido do fluxo visual (mantém no DOM para SR) */
  autoDismissMs?: number;
}

/**
 * Mensagem acessível exibida quando `?date=` chegou inválido/fora do
 * intervalo e a URL foi corrigida para o valor clamped. Usa `role="status"`
 * + `aria-live="polite"` para não interromper leitores de tela.
 */
export const SanctorumClampNotice: React.FC<Props> = ({
  received,
  replacedWith,
  autoDismissMs = 8000,
}) => {
  const [visible, setVisible] = useState(true);
  useEffect(() => {
    if (!autoDismissMs) return;
    const t = window.setTimeout(() => setVisible(false), autoDismissMs);
    return () => window.clearTimeout(t);
  }, [autoDismissMs]);

  return (
    <div
      role="status"
      aria-live="polite"
      data-testid="sanctorum-clamp-notice"
      className={
        visible
          ? 'mx-auto max-w-3xl rounded-premium-md border border-primary/30 bg-primary/5 px-spacing-md py-spacing-xs text-premium-xs font-serif italic text-foreground'
          : 'sr-only'
      }
    >
      A data recebida{received ? ` (“${received}”)` : ''} é inválida ou está fora do
      intervalo suportado. Exibindo <strong>{replacedWith}</strong>.
    </div>
  );
};

export default SanctorumClampNotice;
