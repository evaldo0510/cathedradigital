/**
 * Utilitários de imagem para logos de parceiros.
 *
 * Camadas de defesa:
 * 1. Extensão + MIME declarado pelo browser (rejeição rápida).
 * 2. Detecção de tipo por **assinatura binária** (magic bytes) — nunca
 *    confiamos apenas no MIME declarado, que é trivialmente falsificável.
 * 3. Para SVG: parsing XML + remoção de `<script>`, atributos `on*`,
 *    `javascript:` em `href`/`xlink:href` e `<foreignObject>`.
 * 4. Redimensionamento client-side para 512×512 (contain) preservando
 *    transparência e exportando WebP (fallback PNG).
 *
 * Todo o processamento é 100% client-side.
 */

export const LOGO_MAX_BYTES = 2 * 1024 * 1024; // 2 MB
export const LOGO_TARGET_SIZE = 512;
export const LOGO_ACCEPT = 'image/png,image/jpeg,image/webp,image/svg+xml';

type Kind = 'png' | 'jpeg' | 'webp' | 'gif' | 'svg' | 'unknown';

export type LogoErrorCode =
  | 'invalid_extension'
  | 'declared_mime_not_allowed'
  | 'too_large'
  | 'empty_file'
  | 'signature_mismatch'
  | 'unsupported_kind'
  | 'svg_invalid'
  | 'svg_script_blocked'
  | 'decode_failed'
  | 'encode_failed';

export class LogoValidationError extends Error {
  code: LogoErrorCode;
  constructor(code: LogoErrorCode, message: string) {
    super(message);
    this.code = code;
    this.name = 'LogoValidationError';
  }
}

const ALLOWED_MIME = new Set(['image/png', 'image/jpeg', 'image/webp', 'image/svg+xml']);

/**
 * Detecção rápida por MIME declarado + tamanho. Não é definitiva —
 * `processLogo` valida assinatura binária e sanitiza SVG antes de aceitar.
 */
export function validateLogoFile(file: File): LogoValidationError | null {
  if (file.size === 0) {
    return new LogoValidationError('empty_file', 'Arquivo vazio.');
  }
  if (!ALLOWED_MIME.has(file.type)) {
    return new LogoValidationError(
      'declared_mime_not_allowed',
      `Formato "${file.type || 'desconhecido'}" não aceito. Envie PNG, JPG, WebP ou SVG.`,
    );
  }
  if (file.size > LOGO_MAX_BYTES) {
    return new LogoValidationError(
      'too_large',
      `Arquivo excede o limite de ${(LOGO_MAX_BYTES / 1024 / 1024).toFixed(0)} MB (recebido: ${(file.size / 1024 / 1024).toFixed(2)} MB).`,
    );
  }
  return null;
}

/**
 * Identifica o tipo real pelos primeiros bytes.
 * PNG  : 89 50 4E 47 0D 0A 1A 0A
 * JPEG : FF D8 FF
 * WEBP : "RIFF"...."WEBP"
 * GIF  : "GIF87a" / "GIF89a"
 * SVG  : detecção textual (heurística).
 */
export function detectKindBySignature(bytes: Uint8Array): Kind {
  if (bytes.length >= 8 &&
      bytes[0] === 0x89 && bytes[1] === 0x50 && bytes[2] === 0x4e && bytes[3] === 0x47 &&
      bytes[4] === 0x0d && bytes[5] === 0x0a && bytes[6] === 0x1a && bytes[7] === 0x0a) {
    return 'png';
  }
  if (bytes.length >= 3 && bytes[0] === 0xff && bytes[1] === 0xd8 && bytes[2] === 0xff) {
    return 'jpeg';
  }
  if (bytes.length >= 12 &&
      bytes[0] === 0x52 && bytes[1] === 0x49 && bytes[2] === 0x46 && bytes[3] === 0x46 &&
      bytes[8] === 0x57 && bytes[9] === 0x45 && bytes[10] === 0x42 && bytes[11] === 0x50) {
    return 'webp';
  }
  if (bytes.length >= 6 &&
      bytes[0] === 0x47 && bytes[1] === 0x49 && bytes[2] === 0x46 &&
      bytes[3] === 0x38 && (bytes[4] === 0x37 || bytes[4] === 0x39) && bytes[5] === 0x61) {
    return 'gif';
  }
  // SVG: parse textual dos primeiros 512 bytes ignorando BOM/whitespace
  const head = new TextDecoder('utf-8', { fatal: false })
    .decode(bytes.subarray(0, Math.min(bytes.length, 512)))
    .replace(/^\uFEFF/, '')
    .trimStart()
    .toLowerCase();
  if (head.startsWith('<?xml') || head.startsWith('<svg')) {
    return 'svg';
  }
  return 'unknown';
}

const KIND_TO_MIME: Record<Exclude<Kind, 'unknown'>, string> = {
  png: 'image/png',
  jpeg: 'image/jpeg',
  webp: 'image/webp',
  gif: 'image/gif',
  svg: 'image/svg+xml',
};

/**
 * Sanitiza SVG: parse XML, remove `<script>`, `<foreignObject>`,
 * atributos `on*` e URLs `javascript:` em `href`/`xlink:href`.
 * Lança `LogoValidationError('svg_script_blocked')` se conteúdo ativo for
 * detectado, para que o usuário veja mensagem específica.
 */
export function sanitizeSvg(svgText: string): string {
  const parser = new DOMParser();
  const doc = parser.parseFromString(svgText, 'image/svg+xml');
  const parseError = doc.querySelector('parsererror');
  if (parseError || !doc.documentElement || doc.documentElement.nodeName.toLowerCase() !== 'svg') {
    throw new LogoValidationError('svg_invalid', 'SVG malformado — o arquivo não pôde ser interpretado.');
  }

  let hadActiveContent = false;

  const walk = (node: Element) => {
    // Remoção de elementos perigosos
    const tag = node.nodeName.toLowerCase();
    if (tag === 'script' || tag === 'foreignobject') {
      node.remove();
      hadActiveContent = true;
      return;
    }

    // Copiar attributes primeiro (removeAttribute muda a coleção viva)
    const attrs = Array.from(node.attributes);
    for (const attr of attrs) {
      const nameLower = attr.name.toLowerCase();
      const valTrim = attr.value.trim().toLowerCase();

      if (nameLower.startsWith('on')) {
        node.removeAttribute(attr.name);
        hadActiveContent = true;
        continue;
      }
      if ((nameLower === 'href' || nameLower === 'xlink:href' || nameLower === 'src')
          && (valTrim.startsWith('javascript:') || valTrim.startsWith('data:text/html'))) {
        node.removeAttribute(attr.name);
        hadActiveContent = true;
        continue;
      }
    }

    for (const child of Array.from(node.children)) walk(child);
  };

  walk(doc.documentElement);

  if (hadActiveContent) {
    throw new LogoValidationError(
      'svg_script_blocked',
      'SVG contém conteúdo ativo (scripts, eventos ou URLs perigosas) e foi rejeitado.',
    );
  }

  return new XMLSerializer().serializeToString(doc);
}

export interface ProcessedLogo {
  blob: Blob;
  extension: 'webp' | 'png' | 'svg';
  contentType: string;
  detectedKind: Kind;
}

export async function processLogo(file: File): Promise<ProcessedLogo> {
  const buf = new Uint8Array(await file.arrayBuffer());
  const kind = detectKindBySignature(buf);

  if (kind === 'unknown') {
    throw new LogoValidationError(
      'signature_mismatch',
      `A assinatura binária do arquivo não corresponde a uma imagem aceita. Envie um PNG, JPG, WebP, GIF ou SVG legítimo.`,
    );
  }

  // Coerência entre MIME declarado e tipo real (GIF só é aceito via signature, não como MIME declarado)
  const declared = file.type.toLowerCase();
  if (kind !== 'gif' && declared && declared !== KIND_TO_MIME[kind]) {
    throw new LogoValidationError(
      'signature_mismatch',
      `O arquivo diz ser "${declared}" mas o conteúdo real é ${kind.toUpperCase()}. Renomeie/exporte-o corretamente e tente de novo.`,
    );
  }

  if (kind === 'svg') {
    const raw = new TextDecoder('utf-8').decode(buf);
    const clean = sanitizeSvg(raw); // lança se detectar script
    const blob = new Blob([clean], { type: 'image/svg+xml' });
    return { blob, extension: 'svg', contentType: 'image/svg+xml', detectedKind: 'svg' };
  }

  // Raster: PNG/JPEG/WebP/GIF → decodifica, redimensiona, exporta WebP
  const decodeSource = new Blob([buf], { type: KIND_TO_MIME[kind] });
  const bitmap = await createImageBitmap(decodeSource).catch(() => null);
  if (!bitmap) {
    throw new LogoValidationError('decode_failed', 'Imagem corrompida — não foi possível decodificá-la.');
  }

  const scale = Math.min(LOGO_TARGET_SIZE / bitmap.width, LOGO_TARGET_SIZE / bitmap.height, 1);
  const targetW = Math.max(1, Math.round(bitmap.width * scale));
  const targetH = Math.max(1, Math.round(bitmap.height * scale));

  const canvas = document.createElement('canvas');
  canvas.width = targetW;
  canvas.height = targetH;
  const ctx = canvas.getContext('2d', { alpha: true });
  if (!ctx) throw new LogoValidationError('encode_failed', 'Canvas indisponível neste navegador.');
  ctx.imageSmoothingEnabled = true;
  ctx.imageSmoothingQuality = 'high';
  ctx.drawImage(bitmap, 0, 0, targetW, targetH);
  bitmap.close?.();

  const webp = await canvasToBlob(canvas, 'image/webp', 0.9);
  if (webp) return { blob: webp, extension: 'webp', contentType: 'image/webp', detectedKind: kind };

  const png = await canvasToBlob(canvas, 'image/png');
  if (png) return { blob: png, extension: 'png', contentType: 'image/png', detectedKind: kind };

  throw new LogoValidationError('encode_failed', 'Falha ao codificar a imagem processada.');
}

function canvasToBlob(canvas: HTMLCanvasElement, type: string, quality?: number): Promise<Blob | null> {
  return new Promise(resolve => canvas.toBlob(blob => resolve(blob), type, quality));
}

export function objectUrlFromBlob(blob: Blob): string {
  return URL.createObjectURL(blob);
}
