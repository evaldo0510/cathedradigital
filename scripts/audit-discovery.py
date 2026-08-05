import asyncio
import os
import re
from pathlib import Path

# Configurações de diretórios a escanear
SRC_DIR = Path("src")

# Categorias e padrões de módulos
DOMAINS = {
    "Sagrada Escritura": ["Bible", "Evangelho", "Salmo", "Scripture", "Testamento"],
    "Doutrina": ["Catechism", "Catequese", "Dogma", "Concilio", "Magisterium", "Papa", "Doctrine"],
    "Espiritualidade": ["Prayer", "Oracao", "Liturgia", "Rosary", "Rosario", "Novena", "Aparicao", "Mary", "Maria", "Devocional"],
    "Patrimônio da Igreja": ["Saint", "Santo", "Patristica", "Aquinas", "Doctor", "ChurchFather", "Writings", "Library"]
}

# Locais de integração (arquivos chave)
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
    
    # 1. Mapear todos os arquivos TSX que parecem ser "Páginas" ou "Módulos Principais"
    pages = list(SRC_DIR.glob("pages/**/*.tsx")) + list(SRC_DIR.glob("components/cathedra/*.tsx"))
    
    # Filtrar componentes pequenos (heurística simples: > 100 linhas ou termina em Page)
    potential_modules = []
    for p in pages:
        content = p.read_text()
        if len(content.splitlines()) > 50 or "Page" in p.name:
            potential_modules.append(p)

    # 2. Ler pontos de integração
    integration_contents = {}
    for key, paths in INTEGRATION_POINTS.items():
        text = ""
        for path in paths:
            p_obj = Path(path)
            if p_obj.exists():
                text += p_obj.read_text()
        integration_contents[key] = text

    # 3. Analisar cada módulo
    report = []
    for mod in potential_modules:
        mod_name = mod.stem
        content = mod.read_text()
        
        # Ignorar componentes de sistema
        if any(x in mod_name for x in ["Guard", "Skeleton", "Layout", "Provider", "Context", "ErrorBoundary"]):
            continue

        discovery = {}
        total_score = 0
        for key, text in integration_contents.items():
            # Busca simples pelo nome do módulo ou slug comum nos pontos de integração
            found = mod_name.lower() in text.lower() or mod.name.lower() in text.lower()
            discovery[key] = found
            if found: total_score += 1
            
        # Determinar Domínio
        domain = "Outros"
        for dom, keywords in DOMAINS.items():
            if any(k.lower() in mod_name.lower() or k.lower() in content.lower() for k in keywords):
                domain = dom
                break
        
        score_pct = (total_score / len(INTEGRATION_POINTS)) * 100
        
        report.append({
            "name": mod_name,
            "path": str(mod),
            "domain": domain,
            "discovery": discovery,
            "score": score_pct
        })

    return report

def generate_markdown(report):
    md = "# INVENTÁRIO DEFINITIVO E MAPA DE DESCOBERTA (FASE 9.1)\n\n"
    
    # Resumo Executivo
    total = len(report)
    fully_integrated = len([r for r in report if r['score'] >= 70])
    orphans = len([r for r in report if r['score'] == 0])
    
    md += "## 📊 Resumo da Auditoria\n"
    md += f"* **Total de Módulos Analisados:** {total}\n"
    md += f"* **Totalmente Integrados (>=70%):** {fully_integrated}\n"
    md += f"* **Módulos Órfãos (0% Discovery):** {orphans}\n"
    md += f"* **Média de Descoberta Global:** {sum(r['score'] for r in report)/total:.1f}%\n\n"

    # Mapa por Domínio
    md += "## 🗺️ Mapa do Conhecimento\n"
    for domain in list(DOMAINS.keys()) + ["Outros"]:
        dom_mods = [r for r in report if r['domain'] == domain]
        if not dom_mods: continue
        md += f"### {domain}\n"
        for m in sorted(dom_mods, key=lambda x: x['score'], reverse=True):
            status = "✅" if m['score'] > 50 else "⚠️" if m['score'] > 0 else "❌"
            md += f"* {status} **{m['name']}** ({m['score']:.0f}% discovery)\n"
        md += "\n"

    # Lista de Órfãos
    md += "## 🚨 Módulos Órfãos (Invisíveis)\n"
    orphan_list = [r for r in report if r['score'] == 0]
    for o in orphan_list:
        md += f"* `{o['path']}`\n"
    
    # Plano de Ação
    md += "\n## 🚀 Plano de Integração Prioritária\n"
    md += "1. **Dogmas e Concílios:** Conectar à estante de Doutrina e ao Nexus do Catecismo.\n"
    md += "2. **Obras de Aquino:** Criar entrada dedicada na Biblioteca Monástica.\n"
    md += "3. **Órfãos:** Mapear rotas e adicionar ao `RouteRegistry` e `ReaderContinuation`.\n"

    return md

if __name__ == "__main__":
    report = analyze_discovery()
    markdown = generate_markdown(report)
    Path("docs/audit/DISCOVERY_CERTIFICATION_V1.md").parent.mkdir(parents=True, exist_ok=True)
    Path("docs/audit/DISCOVERY_CERTIFICATION_V1.md").write_text(markdown)
    print("Relatório de Certificação de Descoberta gerado em docs/audit/DISCOVERY_CERTIFICATION_V1.md")
