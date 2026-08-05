/**
 * Validador leve de JSON-LD (Schema.org) — sem dependências externas.
 * Verifica @context, @type e campos obrigatórios mínimos por tipo suportado.
 * Retorna lista de erros humanamente legíveis (vazia = válido).
 */
export type JsonLd = Record<string, any>;

const REQUIRED_BY_TYPE: Record<string, string[]> = {
  Article: ['headline', 'author', 'publisher', 'datePublished'],
  NewsArticle: ['headline', 'author', 'publisher', 'datePublished'],
  BlogPosting: ['headline', 'author', 'publisher', 'datePublished'],
  Event: ['name', 'startDate', 'location'],
  LiturgicalService: ['name'],
  FAQPage: ['mainEntity'],
  DefinedTerm: ['name', 'description'],
  BreadcrumbList: ['itemListElement'],
  Organization: ['name', 'url'],
  WebSite: ['name', 'url'],
  Product: ['name'],
};

function isPlainObject(v: unknown): v is JsonLd {
  return !!v && typeof v === 'object' && !Array.isArray(v);
}

export function validateJsonLd(node: JsonLd, path = '$'): string[] {
  const errs: string[] = [];
  if (!isPlainObject(node)) {
    return [`${path}: JSON-LD não é objeto`];
  }
  if (node['@context'] !== 'https://schema.org') {
    errs.push(`${path}: @context deve ser "https://schema.org" (recebido: ${JSON.stringify(node['@context'])})`);
  }
  const type = node['@type'];
  if (!type || typeof type !== 'string') {
    errs.push(`${path}: @type ausente ou não é string`);
  } else {
    const required = REQUIRED_BY_TYPE[type];
    if (required) {
      for (const key of required) {
        const val = node[key];
        if (val === undefined || val === null || val === '') {
          errs.push(`${path}: @type=${type} exige "${key}"`);
        }
      }
    }
    if (type === 'FAQPage') {
      const arr = node.mainEntity;
      if (!Array.isArray(arr) || arr.length === 0) {
        errs.push(`${path}: FAQPage.mainEntity deve ser array não vazio`);
      } else {
        arr.forEach((q, i) => {
          if (!isPlainObject(q) || q['@type'] !== 'Question') {
            errs.push(`${path}.mainEntity[${i}]: deve ser {@type: "Question"}`);
          } else {
            if (!q.name) errs.push(`${path}.mainEntity[${i}]: Question exige "name"`);
            const a = q.acceptedAnswer;
            if (!isPlainObject(a) || a['@type'] !== 'Answer' || !a.text) {
              errs.push(`${path}.mainEntity[${i}].acceptedAnswer: exige {@type:"Answer", text}`);
            }
          }
        });
      }
    }
  }
  return errs;
}

export function validateJsonLdList(nodes: JsonLd[] | JsonLd, label = 'jsonld'): string[] {
  const list = Array.isArray(nodes) ? nodes : [nodes];
  const all: string[] = [];
  list.forEach((n, i) => {
    all.push(...validateJsonLd(n, `${label}[${i}]`));
  });
  return all;
}
