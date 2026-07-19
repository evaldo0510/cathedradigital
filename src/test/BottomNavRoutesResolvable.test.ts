import { describe, it, expect } from "vitest";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";

/**
 * Garantia estática: todo destino de navegação (bottom nav mobile,
 * bottom nav cathedra via APP_ROUTES e todos os <Navigate to="..."/>)
 * precisa ter uma rota concreta declarada em App.tsx.
 *
 * Sem isso o usuário cai no NotFound (curinga "*"), como aconteceu com /rezar.
 */

const read = (p: string) => readFileSync(resolve(process.cwd(), p), "utf8");

function extractRoutePaths(appSrc: string): Set<string> {
  const paths = new Set<string>();
  // <Route path="/foo" ...>  — captura o valor entre aspas
  const re = /<Route\s+[^>]*path=["']([^"']+)["']/g;
  let m: RegExpExecArray | null;
  while ((m = re.exec(appSrc)) !== null) {
    paths.add(m[1]);
  }
  return paths;
}

function extractNavigateTargets(appSrc: string): string[] {
  const targets: string[] = [];
  const re = /<Navigate\s+[^>]*to=["']([^"']+)["']/g;
  let m: RegExpExecArray | null;
  while ((m = re.exec(appSrc)) !== null) {
    targets.push(m[1]);
  }
  return targets;
}

function extractMobileNavPaths(mobileSrc: string): string[] {
  const out: string[] = [];
  // { to: "/foo", label: ...
  const re = /\{\s*to:\s*["']([^"']+)["']/g;
  let m: RegExpExecArray | null;
  while ((m = re.exec(mobileSrc)) !== null) {
    out.push(m[1]);
  }
  return out;
}

function extractCathedraNavPaths(routesSrc: string): string[] {
  // Bottom nav cathedra usa os 3 primeiros itens de APP_ROUTES onde
  // showInMenu: true e category in ('core','spiritual'). Reproduzimos aqui.
  const items: Array<{ path: string; showInMenu: boolean; category: string }> =
    [];
  const re =
    /\{\s*path:\s*['"]([^'"]+)['"][^}]*showInMenu:\s*(true|false)[^}]*category:\s*['"]([^'"]+)['"]/g;
  let m: RegExpExecArray | null;
  while ((m = re.exec(routesSrc)) !== null) {
    items.push({
      path: m[1],
      showInMenu: m[2] === "true",
      category: m[3],
    });
  }
  return items
    .filter((r) => r.showInMenu && ["core", "spiritual"].includes(r.category))
    .slice(0, 3)
    .map((r) => r.path);
}

/**
 * Uma rota do App resolve o alvo se:
 * - o path bate exatamente,
 * - existe uma versão parametrizada mais específica (ex.: /jornadas + /jornadas/:id).
 * Para navegação principal só o match exato conta (usuário clicou no botão).
 */
function isExactRouteMatch(target: string, appPaths: Set<string>): boolean {
  return appPaths.has(target);
}

describe("Bottom nav e redirects — sem 404", () => {
  const appSrc = read("src/App.tsx");
  const routePaths = extractRoutePaths(appSrc);
  const navigateTargets = extractNavigateTargets(appSrc);

  it("extrai o mapa de rotas do App.tsx", () => {
    // sanity: rotas conhecidas presentes
    expect(routePaths.has("/")).toBe(true);
    expect(routePaths.has("/bible")).toBe(true);
    expect(routePaths.has("/catechism")).toBe(true);
    expect(routePaths.has("*")).toBe(true);
  });

  it("todos os itens da MobileBottomNav apontam para rotas existentes", () => {
    const mobileSrc = read("src/components/mobile/MobileBottomNav.tsx");
    const targets = extractMobileNavPaths(mobileSrc);
    expect(targets.length).toBeGreaterThan(0);

    const missing = targets.filter((t) => !isExactRouteMatch(t, routePaths));
    expect(
      missing,
      `Itens da MobileBottomNav sem rota correspondente: ${missing.join(", ")}`
    ).toEqual([]);
  });

  it("todos os itens principais da BottomNav (cathedra) apontam para rotas existentes", () => {
    const routesConfigSrc = read("src/config/routes.ts");
    const targets = extractCathedraNavPaths(routesConfigSrc);
    expect(targets.length).toBeGreaterThan(0);

    const missing = targets.filter((t) => !isExactRouteMatch(t, routePaths));
    expect(
      missing,
      `Itens da BottomNav (cathedra) sem rota correspondente: ${missing.join(
        ", "
      )}`
    ).toEqual([]);
  });

  it("todo <Navigate to=...> resolve para uma rota concreta (sem redirect quebrado)", () => {
    expect(navigateTargets.length).toBeGreaterThan(0);

    const broken = navigateTargets.filter((t) => {
      if (t.startsWith("http")) return false; // externo
      // ignora targets dinâmicos com template
      if (t.includes("${") || t.includes(":")) return false;
      // aceita rota exata OU prefixo que exista como rota (ex.: redirect para /admin/telemetry)
      if (isExactRouteMatch(t, routePaths)) return false;
      // aceita se existe uma rota curinga que cobre esse prefixo (ex.: /admin/*)
      const coveredByWildcard = Array.from(routePaths).some((p) => {
        if (!p.endsWith("/*")) return false;
        const base = p.slice(0, -2); // remove "/*"
        return t === base || t.startsWith(`${base}/`);
      });
      if (coveredByWildcard) return false;
      // aceita se existe alguma rota que comece com esse path
      const hasPrefix = Array.from(routePaths).some(
        (p) => p === t || p.startsWith(`${t}/`)
      );
      return !hasPrefix;
    });

    expect(
      broken,
      `Redirects <Navigate> apontando para rotas inexistentes: ${broken.join(
        ", "
      )}`
    ).toEqual([]);
  });

  it("aliases legados críticos estão redirecionados", () => {
    // Regressão explícita para o bug do /rezar reportado pelo usuário.
    const requiredAliases = [
      "/rezar",
      "/prayers",
      "/prayer",
      "/formacao",
      "/pesquisar",
      "/journeys",
      "/library",
    ];
    const missing = requiredAliases.filter((a) => !routePaths.has(a));
    expect(
      missing,
      `Aliases legados esperados como redirect não foram encontrados no App.tsx: ${missing.join(
        ", "
      )}`
    ).toEqual([]);
  });
});
