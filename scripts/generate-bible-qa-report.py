#!/usr/bin/env python3
"""Gera /mnt/documents/bible-qa-report.pdf consolidando resultados de
performance, acessibilidade e E2E do módulo da Bíblia."""

from __future__ import annotations
import json
from datetime import datetime
from pathlib import Path

from reportlab.lib.pagesizes import A4
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.lib.units import cm
from reportlab.lib import colors
from reportlab.platypus import (
    SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle, PageBreak, Image,
)

ROOT = Path("/tmp/bible-qa")
OUT = Path("/mnt/documents/bible-qa-report.pdf")
OUT.parent.mkdir(parents=True, exist_ok=True)

def load(p: Path, default):
    try:
        return json.loads(p.read_text())
    except Exception:
        return default

perf = load(ROOT / "perf/diff.json", {"cold": {}, "warm": {}, "diff": {}})
a11y = load(ROOT / "a11y/report.json", {"findings": [], "bubbleCount": 0})
e2e = load(ROOT / "e2e/summary.json", {"total": 0, "passed": 0, "failed": 0, "skipped": 0, "steps": []})

styles = getSampleStyleSheet()
H1 = ParagraphStyle("H1", parent=styles["Heading1"], textColor=colors.HexColor("#0B1F3A"), spaceAfter=12)
H2 = ParagraphStyle("H2", parent=styles["Heading2"], textColor=colors.HexColor("#0B1F3A"), spaceAfter=8)
P = styles["BodyText"]
Small = ParagraphStyle("Small", parent=styles["BodyText"], fontSize=8, textColor=colors.HexColor("#444"))
Mono = ParagraphStyle("Mono", parent=styles["Code"], fontSize=7, leading=9)

doc = SimpleDocTemplate(
    str(OUT), pagesize=A4,
    leftMargin=2*cm, rightMargin=2*cm, topMargin=1.8*cm, bottomMargin=1.8*cm,
    title="Relatório de QA — Módulo da Bíblia",
)
story = []

# ── Capa ──
story.append(Paragraph("Relatório de QA — Módulo da Bíblia", H1))
story.append(Paragraph(f"Gerado em {datetime.now().strftime('%d/%m/%Y %H:%M')}", Small))
story.append(Spacer(1, 0.4*cm))

# Sumário executivo
exec_rows = [
    ["Suíte", "Status", "Detalhes"],
    ["Performance (cold vs warm)",
     "OK" if perf.get("cold") and perf.get("warm") else "—",
     f"LCP cold: {perf['cold'].get('lcpMs') or 'n/d'} ms · warm: {perf['warm'].get('lcpMs') or 'n/d'} ms · "
     f"Δ bytes: {perf['diff'].get('bytesDelta', 0)/1024:.0f} KB"],
    ["Acessibilidade das bolhas",
     f"{sum(1 for f in a11y['findings'] if f['severity'] in ('critical','serious'))} bloqueadoras / {len(a11y['findings'])} totais",
     f"{a11y.get('bubbleCount', 0)} bolha(s) amostrada(s)"],
    ["E2E consolidado",
     f"{e2e['passed']}/{e2e['total']} passos OK",
     f"{e2e['failed']} falha(s) · {e2e['skipped']} skip"],
]
t = Table(exec_rows, colWidths=[5.5*cm, 4.5*cm, 7*cm])
t.setStyle(TableStyle([
    ("BACKGROUND", (0,0), (-1,0), colors.HexColor("#0B1F3A")),
    ("TEXTCOLOR", (0,0), (-1,0), colors.white),
    ("FONTNAME", (0,0), (-1,0), "Helvetica-Bold"),
    ("FONTSIZE", (0,0), (-1,-1), 9),
    ("VALIGN", (0,0), (-1,-1), "TOP"),
    ("GRID", (0,0), (-1,-1), 0.3, colors.HexColor("#C8A96A")),
    ("ROWBACKGROUNDS", (0,1), (-1,-1), [colors.white, colors.HexColor("#FAF6EE")]),
    ("LEFTPADDING", (0,0), (-1,-1), 5),
    ("RIGHTPADDING", (0,0), (-1,-1), 5),
]))
story.append(Paragraph("Sumário executivo", H2))
story.append(t)
story.append(PageBreak())

# ── Seção 1: Performance ──
story.append(Paragraph("1. Performance — cold vs warm", H1))
cold = perf.get("cold", {})
warm = perf.get("warm", {})
diff = perf.get("diff", {})

def fmt(v, unit=""):
    if v is None: return "n/d"
    if isinstance(v, float): return f"{v:.1f}{unit}"
    return f"{v}{unit}"

perf_rows = [
    ["Métrica", "Cold (antes)", "Warm (depois)", "Δ"],
    ["TTFB (ms)", fmt(cold.get("ttfbMs")), fmt(warm.get("ttfbMs")), fmt(diff.get("ttfbDeltaMs"))],
    ["DOMContentLoaded (ms)", fmt(cold.get("domContentLoadedMs")), fmt(warm.get("domContentLoadedMs")), "—"],
    ["Load event end (ms)", fmt(cold.get("loadEventEndMs")), fmt(warm.get("loadEventEndMs")), fmt(diff.get("loadDeltaMs"))],
    ["FCP (ms)", fmt(cold.get("fcpMs")), fmt(warm.get("fcpMs")), "—"],
    ["LCP (ms)", fmt(cold.get("lcpMs")), fmt(warm.get("lcpMs")), fmt(diff.get("lcpDeltaMs"))],
    ["CLS", fmt(cold.get("cls")), fmt(warm.get("cls")), "—"],
    ["Requisições (total)", str(cold.get("resources",{}).get("total","—")),
     str(warm.get("resources",{}).get("total","—")), str(diff.get("requestsDelta","—"))],
    ["Chamadas /bible-text",
     str(cold.get("resources",{}).get("bibleTextCalls","—")),
     str(warm.get("resources",{}).get("bibleTextCalls","—")),
     str(diff.get("bibleTextCallsDelta","—"))],
    ["Bytes transferidos (KB)",
     f"{cold.get('resources',{}).get('transferredBytes',0)/1024:.0f}",
     f"{warm.get('resources',{}).get('transferredBytes',0)/1024:.0f}",
     f"{diff.get('bytesDelta',0)/1024:.0f}"],
    ["Tempo até 1º versículo (ms)",
     fmt(cold.get("bookSelectToFirstVerseMs")),
     fmt(warm.get("bookSelectToFirstVerseMs")), "—"],
]
pt = Table(perf_rows, colWidths=[5.5*cm, 3.8*cm, 3.8*cm, 3.9*cm])
pt.setStyle(TableStyle([
    ("BACKGROUND", (0,0), (-1,0), colors.HexColor("#0B1F3A")),
    ("TEXTCOLOR", (0,0), (-1,0), colors.white),
    ("FONTNAME", (0,0), (-1,0), "Helvetica-Bold"),
    ("FONTSIZE", (0,0), (-1,-1), 8.5),
    ("GRID", (0,0), (-1,-1), 0.3, colors.HexColor("#C8A96A")),
    ("ROWBACKGROUNDS", (0,1), (-1,-1), [colors.white, colors.HexColor("#FAF6EE")]),
    ("ALIGN", (1,1), (-1,-1), "RIGHT"),
]))
story.append(pt)
story.append(Spacer(1, 0.4*cm))
story.append(Paragraph(
    "Cold = primeiro acesso sem cache. Warm = segundo acesso reaproveitando o cache "
    "do navegador, IndexedDB e React Query. A diferença mostra o ganho efetivo do cache.",
    Small))
story.append(PageBreak())

# ── Seção 2: Acessibilidade ──
story.append(Paragraph("2. Acessibilidade das bolhas", H1))
story.append(Paragraph(
    f"Bolhas amostradas no capítulo: <b>{a11y.get('bubbleCount', 0)}</b>. "
    "A auditoria cobre rótulos ARIA, foco por teclado, tamanho de alvo e regras axe-core "
    "WCAG 2.0 A/AA escopadas ao &lt;main&gt;.", P))
story.append(Spacer(1, 0.3*cm))

severity_color = {
    "critical": colors.HexColor("#B71C1C"),
    "serious":  colors.HexColor("#E65100"),
    "moderate": colors.HexColor("#F9A825"),
    "minor":    colors.HexColor("#558B2F"),
}

if a11y["findings"]:
    rows = [["Severidade", "Regra", "Descrição", "Seletor"]]
    for f in a11y["findings"]:
        rows.append([
            f["severity"].upper(),
            f["rule"],
            Paragraph(f.get("description","")[:160], Small),
            Paragraph((f.get("selector") or "—")[:80], Mono),
        ])
    at = Table(rows, colWidths=[2.2*cm, 3.5*cm, 7.5*cm, 4*cm])
    style = [
        ("BACKGROUND", (0,0), (-1,0), colors.HexColor("#0B1F3A")),
        ("TEXTCOLOR", (0,0), (-1,0), colors.white),
        ("FONTNAME", (0,0), (-1,0), "Helvetica-Bold"),
        ("FONTSIZE", (0,0), (-1,-1), 8),
        ("GRID", (0,0), (-1,-1), 0.3, colors.HexColor("#C8A96A")),
        ("VALIGN", (0,0), (-1,-1), "TOP"),
    ]
    for i, f in enumerate(a11y["findings"], start=1):
        style.append(("TEXTCOLOR", (0,i), (0,i), severity_color.get(f["severity"], colors.black)))
        style.append(("FONTNAME", (0,i), (0,i), "Helvetica-Bold"))
    at.setStyle(TableStyle(style))
    story.append(at)
else:
    story.append(Paragraph("Nenhuma falha detectada.", P))

# Screenshots
story.append(Spacer(1, 0.4*cm))
story.append(Paragraph("Evidências (screenshots):", H2))
for shot in sorted((ROOT/"a11y/screenshots").glob("*.png")):
    try:
        story.append(Paragraph(shot.name, Small))
        story.append(Image(str(shot), width=14*cm, height=8*cm, kind="proportional"))
        story.append(Spacer(1, 0.3*cm))
    except Exception as e:
        story.append(Paragraph(f"[erro ao incluir {shot.name}: {e}]", Small))

story.append(PageBreak())

# ── Seção 3: E2E + validação de texto ──
story.append(Paragraph("3. Suíte E2E — texto, versículos e bolhas", H1))
story.append(Paragraph(
    f"Total: {e2e['total']} passos · "
    f"<font color='#1B5E20'><b>{e2e['passed']} OK</b></font> · "
    f"<font color='#B71C1C'><b>{e2e['failed']} falha(s)</b></font> · "
    f"{e2e['skipped']} skip", P))
story.append(Spacer(1, 0.3*cm))

rows = [["#", "Passo", "Status", "Detalhe"]]
for i, s in enumerate(e2e.get("steps", []), start=1):
    rows.append([
        str(i),
        Paragraph(s["name"], Small),
        s["status"].upper(),
        Paragraph((s.get("detail") or "")[:200], Small),
    ])
et = Table(rows, colWidths=[1*cm, 6*cm, 2*cm, 8.2*cm])
estyle = [
    ("BACKGROUND", (0,0), (-1,0), colors.HexColor("#0B1F3A")),
    ("TEXTCOLOR", (0,0), (-1,0), colors.white),
    ("FONTNAME", (0,0), (-1,0), "Helvetica-Bold"),
    ("FONTSIZE", (0,0), (-1,-1), 8),
    ("GRID", (0,0), (-1,-1), 0.3, colors.HexColor("#C8A96A")),
    ("VALIGN", (0,0), (-1,-1), "TOP"),
]
status_color = {"PASS": colors.HexColor("#1B5E20"), "FAIL": colors.HexColor("#B71C1C"), "SKIP": colors.HexColor("#616161")}
for i, s in enumerate(e2e.get("steps", []), start=1):
    estyle.append(("TEXTCOLOR", (2,i), (2,i), status_color.get(s["status"].upper(), colors.black)))
    estyle.append(("FONTNAME", (2,i), (2,i), "Helvetica-Bold"))
et.setStyle(TableStyle(estyle))
story.append(et)

story.append(Spacer(1, 0.4*cm))
story.append(Paragraph("Evidências (screenshots):", H2))
for shot in sorted((ROOT/"e2e/screenshots").glob("*.png")):
    try:
        story.append(Paragraph(shot.name, Small))
        story.append(Image(str(shot), width=14*cm, height=8*cm, kind="proportional"))
        story.append(Spacer(1, 0.3*cm))
    except Exception as e:
        story.append(Paragraph(f"[erro ao incluir {shot.name}: {e}]", Small))

# ── Anexo ──
story.append(PageBreak())
story.append(Paragraph("Anexo — Fontes brutas dos dados", H1))
story.append(Paragraph("Os arquivos abaixo ficam disponíveis em <code>/tmp/bible-qa/</code>:", P))
files = []
for sub in ("perf","a11y","e2e"):
    for p in sorted((ROOT/sub).rglob("*")):
        if p.is_file():
            files.append([sub, str(p.relative_to(ROOT))])
if files:
    ft = Table([["Suíte", "Arquivo"]] + files, colWidths=[2.5*cm, 14*cm])
    ft.setStyle(TableStyle([
        ("BACKGROUND", (0,0), (-1,0), colors.HexColor("#0B1F3A")),
        ("TEXTCOLOR", (0,0), (-1,0), colors.white),
        ("FONTNAME", (0,0), (-1,0), "Helvetica-Bold"),
        ("FONTSIZE", (0,0), (-1,-1), 8),
        ("GRID", (0,0), (-1,-1), 0.3, colors.HexColor("#C8A96A")),
    ]))
    story.append(ft)

doc.build(story)
print(f"OK → {OUT}")
