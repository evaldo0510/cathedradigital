#!/usr/bin/env python3
"""
A11y report — axe-core em rotas críticas.
Rodado no CI (.github/workflows/a11y-axe.yml) e localmente.

Uso:
  BASE_URL=http://127.0.0.1:4173 python scripts/a11y-axe-report.py
"""
import asyncio
import json
import os
import sys
import urllib.request
from pathlib import Path
from playwright.async_api import async_playwright

BASE = os.environ.get("BASE_URL", "http://127.0.0.1:4173")
ROUTES = ["/", "/atrium", "/jornadas"]
VIEWPORTS = [("desktop", 1280, 900), ("mobile", 390, 844)]
RULES = ["color-contrast", "button-name", "link-name", "image-alt",
         "label", "aria-required-attr", "duplicate-id-aria",
         "html-has-lang", "landmark-one-main"]

OUT_DIR = Path("reports/a11y")
OUT_DIR.mkdir(parents=True, exist_ok=True)

AXE_URL = "https://cdn.jsdelivr.net/npm/axe-core@4.10.2/axe.min.js"
AXE_CACHE = OUT_DIR / "axe.min.js"
if not AXE_CACHE.exists():
    with urllib.request.urlopen(AXE_URL, timeout=30) as resp:
        AXE_CACHE.write_bytes(resp.read())
AXE_SRC = AXE_CACHE.read_text()


async def main() -> int:
    all_v: list[dict] = []
    per_route: dict[str, int] = {}
    async with async_playwright() as pw:
        browser = await pw.chromium.launch(headless=True)
        for vname, w, h in VIEWPORTS:
            ctx = await browser.new_context(viewport={"width": w, "height": h})
            page = await ctx.new_page()
            for route in ROUTES:
                key = f"{vname} {route}"
                try:
                    await page.goto(BASE + route, wait_until="domcontentloaded", timeout=20000)
                    await page.wait_for_timeout(1200)
                    await page.evaluate(AXE_SRC)
                    res = await page.evaluate(
                        """async (rules) => {
                            const r = await axe.run(document, { runOnly: rules });
                            return r.violations.flatMap(v => v.nodes.map(n => ({
                                id: v.id, impact: v.impact,
                                target: n.target?.[0],
                                html: (n.html||'').slice(0, 260),
                                summary: (n.failureSummary||'').split('\\n').slice(0,3).join(' | '),
                            })));
                        }""",
                        RULES,
                    )
                    for r in res:
                        r["route"] = route
                        r["viewport"] = vname
                    all_v.extend(res)
                    per_route[key] = len(res)
                    print(f"  {vname:8} {route:14} -> {len(res)} violations")
                except Exception as e:
                    print(f"  {vname:8} {route:14} -> ERROR {e}", file=sys.stderr)
                    per_route[key] = -1
            await ctx.close()
        await browser.close()

    (OUT_DIR / "violations.json").write_text(json.dumps(all_v, indent=2, ensure_ascii=False))
    summary_lines = [f"A11y axe report — base={BASE}", ""]
    for k, v in per_route.items():
        summary_lines.append(f"  {k}: {v}")
    summary_lines.append("")
    summary_lines.append(f"TOTAL: {len(all_v)}")
    by_impact: dict[str, int] = {}
    for v in all_v:
        by_impact[v.get("impact", "unknown")] = by_impact.get(v.get("impact", "unknown"), 0) + 1
    for k, v in sorted(by_impact.items()):
        summary_lines.append(f"  {k}: {v}")
    (OUT_DIR / "summary.txt").write_text("\n".join(summary_lines))
    print("\n".join(summary_lines))
    return 0


sys.exit(asyncio.run(main()))
