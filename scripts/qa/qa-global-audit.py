import asyncio, json, os, re
from pathlib import Path
from playwright.async_api import async_playwright

OUT = Path("/tmp/browser/qa"); (OUT / "shots").mkdir(parents=True, exist_ok=True)

ROUTES = [
    ("/", "Home / Átrio"), ("/hoje", "Hoje"), ("/bible", "Bíblia"), ("/catechism", "Catecismo"),
    ("/magisterium", "Magistério"), ("/biblioteca", "Biblioteca"), ("/santos", "Santos"),
    ("/glossario", "Glossário"), ("/temas", "Temas"), ("/itineraria", "Itinerária"),
    ("/liturgia", "Liturgia"), ("/missal", "Missal"), ("/breviary", "Breviário"),
    ("/oracao", "Orações"), ("/jornadas", "Jornadas"), ("/papas", "Papas"),
    ("/aparicoes", "Aparições"), ("/dogmas", "Dogmas"), ("/buscar", "Busca"),
    ("/calendar", "Calendário litúrgico"), ("/pricing", "Planos"), ("/about", "Sobre"),
    ("/conta/perfil", "Conta · Perfil"), ("/conta/favoritos", "Conta · Favoritos"),
    ("/conta/diario", "Conta · Diário"), ("/diario", "Diário"), ("/profile", "Perfil"),
    ("/logos", "Logos AI"), ("/aquinas", "Aquinas"), ("/guia-modulos", "Guia de módulos"),
]
VIEWPORTS = [("mobile", 360, 800), ("tablet", 768, 1024), ("desktop", 1440, 900)]

PROBE = """
() => {
  const out = {issues: [], meta: {}};
  const de = document.documentElement;
  const vw = window.innerWidth;
  out.meta.scrollW = de.scrollWidth;
  if (de.scrollWidth > vw + 2) {
    const bad = [];
    document.querySelectorAll('body *').forEach(el => {
      const r = el.getBoundingClientRect();
      if (r.width > 0 && (r.right > vw + 2 || r.left < -2) && bad.length < 6) {
        const cs = getComputedStyle(el);
        if (cs.position === 'fixed') return;
        bad.push({tag: el.tagName.toLowerCase(), cls: (el.className||'').toString().slice(0,90), right: Math.round(r.right)});
      }
    });
    out.issues.push({code: 'overflow-x', detail: `scrollWidth ${de.scrollWidth} > viewport ${vw}`, nodes: bad});
  }
  const h1 = [...document.querySelectorAll('main h1, h1')];
  if (h1.length === 0) out.issues.push({code: 'missing-h1', detail: 'Nenhum H1 na página'});
  if (h1.length > 1) out.issues.push({code: 'multiple-h1', detail: `${h1.length} H1: ` + h1.map(h=>h.textContent.trim().slice(0,30)).join(' | ')});
  const mains = document.querySelectorAll('main');
  if (mains.length === 0) out.issues.push({code: 'missing-main', detail: 'Sem landmark <main>'});
  if (mains.length > 1) out.issues.push({code: 'multiple-main', detail: `${mains.length} elementos <main>`});
  const broken = [...document.images].filter(i => i.complete && i.naturalWidth === 0);
  if (broken.length) out.issues.push({code: 'broken-image', detail: `${broken.length} imagem(ns) sem carregar`, nodes: broken.slice(0,5).map(i=>({src: i.currentSrc || i.src}))});
  const noalt = [...document.images].filter(i => !i.hasAttribute('alt'));
  if (noalt.length) out.issues.push({code: 'img-sem-alt', detail: `${noalt.length} <img> sem atributo alt`, nodes: noalt.slice(0,5).map(i=>({src:(i.currentSrc||i.src).slice(0,120)}))});
  const nameless = [...document.querySelectorAll('button, a[role=button]')].filter(b => {
    if (b.getAttribute('aria-label') || b.getAttribute('title')) return false;
    if ((b.textContent||'').trim().length) return false;
    return b.getBoundingClientRect().width > 0;
  });
  if (nameless.length) out.issues.push({code: 'botao-sem-nome', detail: `${nameless.length} botão(ões) sem nome acessível`, nodes: nameless.slice(0,5).map(b=>({cls:(b.className||'').toString().slice(0,90)}))});
  if (vw <= 480) {
    const small = [...document.querySelectorAll('button, a, [role=button], input, select')].filter(el => {
      const r = el.getBoundingClientRect();
      return r.width > 0 && r.height > 0 && (r.height < 40 || r.width < 40);
    });
    if (small.length) out.issues.push({code: 'tap-target', detail: `${small.length} alvo(s) de toque < 40px`, nodes: small.slice(0,5).map(el=>({tag:el.tagName.toLowerCase(), txt:(el.textContent||'').trim().slice(0,25), h: Math.round(el.getBoundingClientRect().height), w: Math.round(el.getBoundingClientRect().width)}))});
  }
  const skel = document.querySelectorAll('[class*=skeleton],[class*=Skeleton],[data-skeleton],[class*=animate-pulse]');
  if (skel.length) out.issues.push({code: 'skeleton-preso', detail: `${skel.length} skeleton(s) ainda visíveis após carga`});
  const txt = (document.body.innerText || '');
  out.meta.textLen = txt.trim().length;
  if (txt.trim().length < 200) out.issues.push({code: 'tela-vazia', detail: `Apenas ${txt.trim().length} caracteres de texto renderizados`});
  const ph = txt.match(/lorem ipsum|TODO|FIXME|placeholder text|em breve\\.\\.\\./gi);
  if (ph) out.issues.push({code: 'placeholder-editorial', detail: 'Texto placeholder: ' + [...new Set(ph)].join(', ')});
  const heroes = document.querySelectorAll('[data-editorial-hero],[class*=EditorialHero]');
  out.meta.hero = heroes.length;
  out.meta.breadcrumb = document.querySelectorAll('nav[aria-label*=readcrumb], [class*=readcrumb]').length;
  return out;
}
"""

async def run():
    results = []
    async with async_playwright() as p:
        b = await p.chromium.launch(headless=True)
        for vname, w, h in VIEWPORTS:
            ctx = await b.new_context(viewport={"width": w, "height": h})
            page = await ctx.new_page()
            await page.goto("http://localhost:8080")
            sk = os.environ.get("LOVABLE_BROWSER_SUPABASE_STORAGE_KEY"); sj = os.environ.get("LOVABLE_BROWSER_SUPABASE_SESSION_JSON")
            if sk and sj:
                await page.evaluate(f"window.localStorage.setItem({json.dumps(sk)}, {json.dumps(sj)})")
            for route, label in ROUTES:
                errs, net = [], []
                page.on("console", lambda m: errs.append(m.text[:200]) if m.type == "error" else None)
                page.on("response", lambda r: net.append((r.status, r.url[:140])) if r.status >= 400 else None)
                rec = {"route": route, "label": label, "viewport": vname, "issues": [], "meta": {}}
                try:
                    await page.goto(f"http://localhost:8080{route}", wait_until="domcontentloaded", timeout=30000)
                    await page.wait_for_timeout(3500)
                    probe = await page.evaluate(PROBE)
                    rec["issues"] = probe["issues"]; rec["meta"] = probe["meta"]
                    rec["url"] = page.url
                    if vname == "mobile":
                        shot = OUT / "shots" / (route.strip("/").replace("/", "_") or "home") 
                        await page.screenshot(path=str(shot) + ".png")
                except Exception as e:
                    rec["issues"].append({"code": "erro-carregamento", "detail": str(e)[:200]})
                if errs:
                    rec["issues"].append({"code": "console-error", "detail": " || ".join(list(dict.fromkeys(errs))[:3])})
                bad_net = [n for n in net if "favicon" not in n[1]]
                if bad_net:
                    rec["issues"].append({"code": "rede-4xx-5xx", "detail": " || ".join(f"{s} {u}" for s, u in list(dict.fromkeys(bad_net))[:3])})
                page.remove_listener("console", page.listeners("console")[-1]) if False else None
                results.append(rec)
                print(vname, route, len(rec["issues"]), flush=True)
            await ctx.close()
        await b.close()
    (OUT / "results.json").write_text(json.dumps(results, ensure_ascii=False, indent=1))

asyncio.run(run())
