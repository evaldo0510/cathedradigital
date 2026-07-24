/**
 * Utilitários de imagem para logos de parceiros.
 * - Validação de MIME e tamanho.
 * - Redimensionamento client-side para 512×512 (contain) preservando transparência.
 * - Exportação como WebP (fallback PNG quando o navegador não suporta encode WebP).
 *
 * Todo o processamento é 100% client-side — nenhuma dependência externa.
 */

export const LOGO_MAX_BYTES = 2 * 1024 * 1024; // 2 MB
export const LOGO_TARGET_SIZE = 512;
export const LOGO_ACCEPT = 'image/png,image/jpeg,image/webp,image/svg+xml';
const ALLOWED_MIME = new Set([
  'image/png',
  'image/jpeg',
  'image/webp',
  'image/svg+xml',
]);

export type LogoValidationError =
  | { code: 'invalid_type'; message: string }
  | { code: 'too_large'; message: string }
  | { code: 'decode_failed'; message: string };

export function validateLogoFile(file: File): LogoValidationError | null {
  if (!ALLOWED_MIME.has(file.type)) {
    return { code: 'invalid_type', message: 'Formato aceito: PNG, JPG, WebP ou SVG.' };
  }
  if (file.size > LOGO_MAX_BYTES) {
    return { code: 'too_large', message: `Arquivo excede ${(LOGO_MAX_BYTES / 1024 / 1024).toFixed(0)} MB.` };
  }
  return null;
}

/**
 * Redimensiona a imagem para no máximo 512×512 (contain, fundo transparente)
 * e devolve um Blob WebP (ou PNG como fallback). SVG passa direto.
 */
export async function processLogo(file: File): Promise<{ blob: Blob; extension: string; contentType: string }> {
  if (file.type === 'image/svg+xml') {
    return { blob: file, extension: 'svg', contentType: 'image/svg+xml' };
  }

  const bitmap = await createImageBitmap(file).catch(() => null);
  if (!bitmap) {
    throw new Error('Não foi possível decodificar a imagem.');
  }

  const { width, height } = bitmap;
  const scale = Math.min(LOGO_TARGET_SIZE / width, LOGO_TARGET_SIZE / height, 1);
  const targetW = Math.round(width * scale);
  const targetH = Math.round(height * scale);

  const canvas = document.createElement('canvas');
  canvas.width = targetW;
  canvas.height = targetH;
  const ctx = canvas.getContext('2d', { alpha: true });
  if (!ctx) throw new Error('Canvas indisponível.');
  ctx.imageSmoothingEnabled = true;
  ctx.imageSmoothingQuality = 'high';
  ctx.drawImage(bitmap, 0, 0, targetW, targetH);
  bitmap.close?.();

  const webp = await canvasToBlob(canvas, 'image/webp', 0.9);
  if (webp) return { blob: webp, extension: 'webp', contentType: 'image/webp' };

  const png = await canvasToBlob(canvas, 'image/png');
  if (png) return { blob: png, extension: 'png', contentType: 'image/png' };

  throw new Error('Falha ao codificar a imagem processada.');
}

function canvasToBlob(canvas: HTMLCanvasElement, type: string, quality?: number): Promise<Blob | null> {
  return new Promise(resolve => canvas.toBlob(blob => resolve(blob), type, quality));
}

export function objectUrlFromBlob(blob: Blob): string {
  return URL.createObjectURL(blob);
}
