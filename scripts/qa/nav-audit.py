"""
nav-audit.py — Auditoria Global de Navegação do Cathedra.

Objetivo: garantir que TODO elemento navegável (link, card, CTA, item de menu,
sugestão do Nexus, ReaderContinuation, EditorialClosure, bottom nav, drawer,
breadcrumb) abra exatamente o recurso indicado.

Fases:
  1. COLETA   — percorre rotas-semente em desktop e mobile, abre drawer/menus,
                e coleta todo href interno com sua região de origem.
  2. ROTA     — confronta cada href com a tabela canônica extraída de App.tsx
                (scripts/qa/extract-routes.mjs) → detecta rota inexistente.
  3. DESTINO  — visita cada destino único e detecta 404, tela vazia,
                redirecionamento inesperado e erro de runtime.

Saídas: docs/qa/NAV_AUDIT.md e docs/qa/NAV_AUDIT.json

Uso: python3 scripts/qa/nav-audit.py [--base http://localhost:8080] [--fast]
"""

import argparse, asyncio, json, re, subprocess, sys
from pathlib import Path
from urllib.parse import urlparse

from playwright.async_api import async_playwright

ROOT = Path(__file__).resolve().parents[2]
OUT_DIR = ROOT / "docs" / "qa"
TMP = Path("/tmp/browser/nav")
TMP.mkdir(parents=True, exist_ok=True)

# Rotas-semente: uma por família de navegação. O crawler expande a partir daqui.
SEEDS = [
    "/", "/hoje", "/bible", "/catechism", "/magisterium", "/biblioteca",
    "/santos", "/glossario", "/temas", "/itineraria", "/liturgia", "/missal",
    "/breviary", "/oracao", "/jornadas", "/nexus", "/buscar", "/papas",
    "/aparicoes", "/dogmas", "/calendar", "/acervo",
    "/biblioteca/acervo/santos-padres", "/guia-modulos", "/pricing", "/sobre",
    "/contato",
]

# Rotas que não devem ser visitadas na fase 3 (side effects, auth, externo).
SKIP_VISIT = re.compile(
    r"^/(auth|login|logout|reset-password|onboarding|upgrade|checkout|admin|\.lovable)"
)

# Regiões de navegação rastreadas — mapeadas por seletor ancestral.
REGION_MAP = [
    ("bottom-nav", "[data-nav='bottom'], nav[aria-label*='inferior' i], .bottom-nav"),
    ("drawer", "[role='dialog'] nav, [data-sidebar], aside nav"),
    ("breadcrumb", "nav[aria-label*='breadcrumb' i], [data-breadcrumb]"),
    ("nexus", "[data-nexus], [data-testid*='nexus'], [aria-label*='nexus' i]"),
    ("reader-continuation", "[data-reader-continuation], [data-testid='reader-continuation']"),
    ("editorial-closure", "[data-editorial-closure]"),
    ("header", "header"),
    ("footer", "footer"),
    ("main", "main"),
]

COLLECT_JS = """
(regionMap) => {
  const seen = [];
  const anchors = [...document.querySelectorAll('a[href]')];
  for (const a of anchors) {
    const href = a.getAttribute('href');
    if (!href) continue;
    const r = a.getBoundingClientRect();
    let region = 'other';
    for (const [name, sel] of regionMap) {
      try { if (a.closest(sel)) { region = name; break; } } catch (e) {}
    }
    seen.push({
      href,
      label: (a.textContent || a.getAttribute('aria-label') || '').trim().slice(0, 80),
      region,
      visible: r.width > 0 && r.height > 0,
      target: a.getAttribute('target') || '',
    });
  }
  return seen;
}
"""

PROBE_JS = """
() => {
  const main = document.querySelector('main') || document.body;
  const h1 = document.querySelector('h1');
  const text = (main.innerText || '').replace(/\\s+/g, ' ').trim();
  return {
    h1: h1 ? h1.textContent.trim().slice(0, 120) : null,
    textLen: text.length,
    sample: text.slice(0, 160),
    is404: /^404$/.test((h1 && h1.textContent.trim()) || ''),
    hasSkeleton: !!document.querySelector('[data-skeleton], .animate-pulse'),
  };
}
"""


def load_routes():
    out = TMP / "routes.json"
    subprocess.run(
        ["node", "scripts/qa/extract-routes.mjs", "--out", str(out)],
        cwd=ROOT, check=True, capture_output=True,
    )
    data = json.loads(out.read_text())
    patterns = []
    for p in data["routes"]:
        if p == "*":
            continue
        body = re.escape(p).replace(r"\:", ":")
        body = re.sub(r":[a-zA-Z_]+", "[^/]+", body)
        patterns.append((p, re.compile(f"^{body}/?$")))
    return patterns


def match_route(path, patterns):
    for pattern, rx in patterns:
        if rx.match(path):
            return pattern
    return None


def normalize(href):
    """Retorna (path, full) para hrefs internos; None para externos/âncoras."""
    if not href or href.startswith(("#", "mailto:", "tel:", "javascript:")):
        return None
    if href.startswith(("http://", "https://")):
        host = urlparse(href).hostname or ""
        if "localhost" not in host and "127.0.0.1" not in host:
            return None
        href = urlparse(href).path + (f"?{urlparse(href).query}" if urlparse(href).query else "")
    if not href.startswith("/"):
        return None
    path = href.split("?")[0].split("#")[0]
    return path or "/", href


async def settle(page):
    try:
        await page.wait_for_load_state("networkidle", timeout=6000)
    except Exception:
        pass
    await page.wait_for_timeout(500)


async def open_menus(page):
    """Abre drawer/menu para expor links escondidos atrás de toggles."""
    selectors = [
        "button[aria-label*='menu' i]",
        "button[aria-label*='navega' i]",
        "[data-sidebar='trigger']",
    ]
    for sel in selectors:
        try:
            el = page.locator(sel).first
            if await el.count() and await el.is_visible():
                await el.click(timeout=2000)
                await page.wait_for_timeout(400)
                return True
        except Exception:
            pass
    return False


async def collect(page, route, viewport, links, base):
    try:
        await page.goto(base + route, wait_until="domcontentloaded", timeout=25000)
    except Exception as exc:
        return {"route": route, "viewport": viewport, "error": str(exc)[:120]}
    await settle(page)

    found = await page.evaluate(COLLECT_JS, REGION_MAP)
    if viewport == "mobile":
        if await open_menus(page):
            found += await page.evaluate(COLLECT_JS, REGION_MAP)

    for item in found:
        norm = normalize(item["href"])
        if not norm:
            continue
        path, full = norm
        key = (path, item["region"])
        rec = links.setdefault(key, {
            "path": path, "href": full, "region": item["region"],
            "labels": set(), "origins": set(), "viewports": set(),
        })
        if item["label"]:
            rec["labels"].add(item["label"])
        rec["origins"].add(route)
        rec["viewports"].add(viewport)
    return None


async def visit(page, path, base):
    url = base + path
    errors = []
    handler = lambda m: errors.append(m.text[:160]) if m.type == "error" else None
    page.on("console", handler)
    try:
        resp = await page.goto(url, wait_until="domcontentloaded", timeout=25000)
    except Exception as exc:
        page.remove_listener("console", handler)
        return {"path": path, "issue": "navegacao-falhou", "detail": str(exc)[:140]}
    await settle(page)
    probe = await page.evaluate(PROBE_JS)
    final = urlparse(page.url).path
    page.remove_listener("console", handler)

    result = {
        "path": path, "final": final, "status": resp.status if resp else None,
        "h1": probe["h1"], "textLen": probe["textLen"], "sample": probe["sample"],
        "console_errors": errors[:3],
    }
    # Severidade:
    #   P0  — o link não entrega o recurso prometido (404, vazio, erro, skeleton).
    #   INFO — comportamento intencional (alias de rota, AuthGuard).
    if probe["is404"]:
        result["issue"], result["severity"] = "404", "P0"
    elif final == "/auth" and path != "/auth":
        result["issue"], result["severity"] = "auth-guard", "INFO"
    elif probe["textLen"] < 40:
        result["issue"], result["severity"] = "tela-vazia", "P0"
    elif "ALGO DEU ERRADO" in probe["sample"].upper() or "TENTAR NOVAMENTE" in probe["sample"].upper():
        result["issue"], result["severity"] = "conteudo-nao-carrega", "P0"
    elif probe["hasSkeleton"] and probe["textLen"] < 200:
        result["issue"], result["severity"] = "skeleton-eterno", "P0"
    elif final != path and not final.startswith(path):
        result["issue"], result["severity"] = "alias-redirect", "INFO"
    return result


async def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--base", default="http://localhost:8080")
    ap.add_argument("--fast", action="store_true", help="só desktop, sem fase 3 completa")
    args = ap.parse_args()
    base = args.base.rstrip("/")

    patterns = load_routes()
    links = {}
    seed_errors = []

    viewports = [("desktop", 1440, 900)] if args.fast else [("desktop", 1440, 900), ("mobile", 390, 844)]

    async with async_playwright() as pw:
        browser = await pw.chromium.launch(headless=True)
        for name, w, h in viewports:
            ctx = await browser.new_context(viewport={"width": w, "height": h})
            page = await ctx.new_page()
            for route in SEEDS:
                err = await collect(page, route, name, links, base)
                if err:
                    seed_errors.append(err)
                print(f"[coleta:{name}] {route} → {len(links)} links", flush=True)
            await ctx.close()

        # Fase 2 — rota inexistente
        dead_routes, targets = [], {}
        for (path, region), rec in links.items():
            matched = match_route(path, patterns)
            entry = {
                "path": path, "region": region,
                "labels": sorted(rec["labels"])[:3],
                "origins": sorted(rec["origins"])[:4],
            }
            if not matched:
                dead_routes.append(entry)
            else:
                targets.setdefault(path, entry)

        # Fase 3 — destino real
        ctx = await browser.new_context(viewport={"width": 1440, "height": 900})
        page = await ctx.new_page()
        visits = []
        for path in sorted(targets):
            if SKIP_VISIT.match(path):
                continue
            res = await visit(page, path, base)
            visits.append(res)
            flag = res.get("issue", "ok")
            print(f"[destino] {path} → {flag}", flush=True)
        await ctx.close()
        await browser.close()

    broken = [v for v in visits if v.get("severity") == "P0"]
    info = [v for v in visits if v.get("severity") == "INFO"]
    report = {
        "base": base,
        "viewports": [v[0] for v in viewports],
        "seeds": SEEDS,
        "links_unicos": len(links),
        "destinos_visitados": len(visits),
        "rotas_inexistentes": dead_routes,
        "destinos_com_problema": broken,
        "comportamento_intencional": info,
        "seed_errors": seed_errors,
    }
    OUT_DIR.mkdir(parents=True, exist_ok=True)
    (OUT_DIR / "NAV_AUDIT.json").write_text(json.dumps(report, indent=2, ensure_ascii=False))

    total_p0 = len(dead_routes) + len(broken)
    lines = [
        "# Auditoria Global de Navegação — Cathedra",
        "",
        f"- Viewports: {', '.join(v[0] for v in viewports)}",
        f"- Links internos únicos coletados: **{len(links)}**",
        f"- Destinos visitados: **{len(visits)}**",
        f"- Rotas inexistentes: **{len(dead_routes)}**",
        f"- Destinos com problema: **{len(broken)}**",
        f"- Comportamento intencional (alias / AuthGuard): {len(info)}",
        "",
        f"**Resultado: {'CERTIFIED' if total_p0 == 0 else f'BLOQUEADO ({total_p0} P0)'}**",
        "",
    ]
    if dead_routes:
        lines += ["## P0 · Links para rotas inexistentes", "",
                  "| Rota apontada | Região | Rótulo | Origem |", "|---|---|---|---|"]
        for d in sorted(dead_routes, key=lambda x: x["path"]):
            lines.append(
                f"| `{d['path']}` | {d['region']} | {' / '.join(d['labels']) or '—'} | {', '.join(d['origins'])} |"
            )
        lines.append("")
    if broken:
        lines += ["## P0 · Destinos que não entregam o recurso", "",
                  "| Rota | Problema | Detalhe |", "|---|---|---|"]
        for b in sorted(broken, key=lambda x: x["path"]):
            detail = b.get("detail") or b.get("sample") or b.get("final") or ""
            lines.append(f"| `{b['path']}` | {b['issue']} | {str(detail)[:90]} |")
        lines.append("")
    if info:
        lines += ["## INFO · Redirecionamentos intencionais", "",
                  "| Rota | Destino final | Tipo |", "|---|---|---|"]
        for b in sorted(info, key=lambda x: x["path"]):
            lines.append(f"| `{b['path']}` | `{b['final']}` | {b['issue']} |")
        lines.append("")
    (OUT_DIR / "NAV_AUDIT.md").write_text("\n".join(lines))

    print(f"\nRelatório: docs/qa/NAV_AUDIT.md ({len(dead_routes)} rotas mortas, {len(broken)} destinos P0)")
    return 1 if total_p0 else 0


if __name__ == "__main__":
    sys.exit(asyncio.run(main()))
