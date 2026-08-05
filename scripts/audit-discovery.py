import os
from pathlib import Path

SRC_DIR = Path("src")
DOMAINS = {
    "Sagrada Escritura": ["Bible", "Evangelho", "Salmo", "Scripture", "Testamento"],
    "Doutrina": ["Catechism", "Catequese", "Dogma", "Concilio", "Magisterium", "Papa", "Doctrine"],
    "Espiritualidade": ["Prayer", "Oracao", "Liturgia", "Rosary", "Rosario", "Novena", "Aparicao", "Mary", "Maria", "Devocional"],
    "Patrimônio da Igreja": ["Saint", "Santo", "Patristica", "Aquinas", "Doctor", "ChurchFather", "Writings", "Library"]
}
INTEGRATION_POINTS = {
    "Home": ["src/pages/HomeUnified.tsx", "src/pages/Index.tsx"],
    "Biblioteca": ["src/pages/acervo/AcervoHomePage.tsx", "src/pages/biblioteca/BibliotecaInteligentePage.tsx"],
    "Logos": ["src/components/cathedra/LogosAI.tsx", "src/components/cathedra/GlobalLogosAI.tsx"],
    "Nexus": ["src/components/nexus/NexusPanel.tsx", "src/lib/nexus/nexusGraphMerge.ts"],
    "Reader": ["src/components/reader/ReaderContinuation.tsx", "src/components/reader/ReaderShell.tsx"],
    "Jornada": ["src/components/cathedra/JornadasPage.tsx", "src/hooks/useSpiritualJourney.ts"],
    "BottomNav": ["src/components/cathedra/BottomNav.tsx", "src/components/cathedra/Sidebar.tsx"]
}

def analyze_discovery():
    inventory = []
    pages = list(SRC_DIR.glob("pages/**/*.tsx")) + list(SRC_DIR.glob("components/cathedra/*.tsx"))
    potential_modules = []
    for p in pages:
        content = p.read_text(errors='ignore')
        if len(content.splitlines()) > 50 or "Page" in p.name:
            potential_modules.append(p)
    integration_contents = {}
    for key, paths in INTEGRATION_POINTS.items():
        text = ""
        for path in paths:
            p_obj = Path(path)
            if p_obj.exists():
                text += p_obj.read_text(errors='ignore')
        integration_contents[key] = text
    report = []
    for mod in potential_modules:
        mod_name = mod.stem
        content = mod.read_text(errors='ignore')
        if any(x in mod_name for x in ["Guard", "Skeleton", "Layout", "Provider", "Context", "ErrorBoundary"]):
            continue
        discovery = {}
        total_score = 0
        for key, text in integration_contents.items():
            found = mod_name.lower() in text.lower() or mod.name.lower() in text.lower()
            discovery[key] = found
            if found: total_score += 1
        domain = "Outros"
        for dom, keywords in DOMAINS.items():
            if any(k.lower() in mod_name.lower() or k.lower() in content.lower() for k in keywords):
                domain = dom
                break
        score_pct = (total_score / len(INTEGRATION_POINTS)) * 100
        report.append({"name": mod_name, "path": str(mod), "domain": domain, "discovery": discovery, "score": score_pct})
    return report

def generate_markdown(report):
    md = "# INVENTÁRIO DEFINITIVO E MAPA DE DESCOBERTA (FASE 9.1)\n\n"
    total = len(report)
    fully_integrated = len([r for r in report if r['score'] >= 70])
    orphans = len([r for r in report if r['score'] == 0])
    md += "## 📊 Resumo da Auditoria\n"
    md += f"* **Total de Módulos Analisados:** {total}\n"
    md += f"* **Totalmente Integrados (>=70%):** {fully_integrated}\n"
    md += f"* **Módulos Órfãos (0% Discovery):** {orphans}\n"
    md += f"* **Média de Descoberta Global:** {sum(r['score'] for r in report)/total:.1f}%\n\n"
    md += "## 🗺️ Mapa do Conhecimento\n"
    for domain in list(DOMAINS.keys()) + ["Outros"]:
        dom_mods = [r for r in report if r['domain'] == domain]
        if not dom_mods: continue
        md += f"### {domain}\n"
        for m in sorted(dom_mods, key=lambda x: x['score'], reverse=True):
            status = "✅" if m['score'] > 50 else "⚠️" if m['score'] > 0 else "❌"
            md += f"* {status} **{m['name']}** ({m['score']:.0f}% discovery)\n"
        md += "\n"
    md += "## 🚨 Módulos Órfãos (Invisíveis)\n"
    orphan_list = [r for r in report if r['score'] == 0]
    for o in orphan_list:
        md += f"* \n"
    return md

if __name__ == '__main__':
    rep = analyze_discovery()
    md = generate_markdown(rep)
    output = Path("docs/audit/DISCOVERY_CERTIFICATION_V1.md")
    output.parent.mkdir(parents=True, exist_ok=True)
    output.write_text(md)
    print(f"Relatório gerado em {output}")
