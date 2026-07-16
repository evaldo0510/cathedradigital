/**
 * Helpers para leitura de query params com aliases de compatibilidade.
 *
 * Regra: existe SEMPRE um nome canônico interno (o primeiro da lista).
 * Aliases são apenas tolerância de entrada — nunca devem ser emitidos pelo app.
 * Centralizar a leitura aqui evita divergências como a corrigida em STAB-002B
 * (Catecismo lia `?p=` e ignorava `?paragraph=`).
 */

export function getCanonicalQueryParam(
  searchParams: URLSearchParams,
  names: readonly string[],
): string | null {
  for (const name of names) {
    const value = searchParams.get(name);
    if (value != null) return value;
  }
  return null;
}

/** Catecismo: canônico `p`, alias `paragraph`. */
export function getParagraphParam(searchParams: URLSearchParams): string | null {
  return getCanonicalQueryParam(searchParams, ['p', 'paragraph']);
}
