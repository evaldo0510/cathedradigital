"""Generate Bible QA v2 PDF report from real test artifacts in /tmp/bible-qa."""
import json, os, glob
from pathlib import Path
from reportlab.lib.pagesizes import A4
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.lib.units import cm
from reportlab.lib import colors
from reportlab.platypus import (SimpleDocTemplate, Paragraph, Spacer, Table,
    TableStyle, Image, PageBreak)

ROOT = Path('/tmp/bible-qa')
OUT = Path('/mnt/documents/bible-qa-report_v2.pdf')
OUT.parent.mkdir(parents=True, exist_ok=True)

def load(p, default=None):
    try: return json.loads(Path(p).read_text())
    except Exception: return default

perf = load(ROOT/'perf/diff.json', {})
a11y = load(ROOT/'a11y/report.json', {})
e2e  = load(ROOT/'e2e/summary.json', {})

NAVY = colors.HexColor('#0B1F3A')
GOLD = colors.HexColor('#C8A96A')
MUTED = colors.HexColor('#555555')

styles = getSampleStyleSheet()
H1 = ParagraphStyle('H1', parent=styles['Title'], textColor=NAVY, fontSize=22, spaceAfter=6)
H2 = ParagraphStyle('H2', parent=styles['Heading2'], textColor=NAVY, fontSize=14, spaceBefore=14, spaceAfter=6)
H3 = ParagraphStyle('H3', parent=styles['Heading3'], textColor=GOLD, fontSize=11, spaceBefore=8, spaceAfter=4)
P  = ParagraphStyle('P', parent=styles['BodyText'], fontSize=9.5, leading=13, textColor=colors.HexColor('#222'))
SMALL = ParagraphStyle('S', parent=P, fontSize=8, textColor=MUTED)

story = []
story.append(Paragraph('Cathedra · Bíblia — Relatório QA v2', H1))
story.append(Paragraph('Reexecução real da suíte E2E após correções (aria-label no botão de diagnóstico e <b>min-h-11</b> nos Cards do Nexus).', P))
story.append(Spacer(1, 6))
story.append(Paragraph('Fonte: artefatos gerados por <i>tests/e2e/bible-{performance,bubbles-a11y,module-suite}.spec.ts</i> em <code>/tmp/bible-qa/</code>.', SMALL))

# Sumário executivo
story.append(Paragraph('Sumário executivo', H2))
total = e2e.get('total','—'); passed = e2e.get('passed','—'); failed = e2e.get('failed','—'); skipped = e2e.get('skipped','—')
findings = a11y.get('findings', [])
crit = sum(1 for f in findings if f['severity']=='critical')
ser  = sum(1 for f in findings if f['severity']=='serious')
mod  = sum(1 for f in findings if f['severity']=='moderate')

summary_tbl = Table([
    ['Categoria','v1 (anterior)','v2 (real, pós-fix)','Status'],
    ['E2E suíte (passos)', '5/7 + 2 falhas', f'{passed}/{total} passos · {failed} falha(s) · {skipped} skip', '⚠'],
    ['A11y críticos', '1', str(crit), '✓' if crit==0 else '⚠'],
    ['A11y sérios', '2', str(ser), '↓' if ser<=2 else '⚠'],
    ['A11y moderados', '1 (43px)', str(mod), '⚠ persiste em sub-botão'],
    ['Cache warm vs cold (bytes)', '~11.6 MB economizados', f"{perf.get('diff',{}).get('bytesDelta',0)/1_000_000:.2f} MB economizados", '✓'],
    ['Load delta warm', '371 ms', f"{perf.get('diff',{}).get('loadDeltaMs',0):.0f} ms", '✓'],
], colWidths=[5*cm, 4.2*cm, 5.5*cm, 2.2*cm])
summary_tbl.setStyle(TableStyle([
    ('BACKGROUND',(0,0),(-1,0), NAVY),
    ('TEXTCOLOR',(0,0),(-1,0), colors.white),
    ('FONTNAME',(0,0),(-1,0),'Helvetica-Bold'),
    ('FONTSIZE',(0,0),(-1,-1), 8.5),
    ('GRID',(0,0),(-1,-1), 0.25, colors.HexColor('#DDD')),
    ('VALIGN',(0,0),(-1,-1),'MIDDLE'),
    ('ROWBACKGROUNDS',(0,1),(-1,-1),[colors.white, colors.HexColor('#FAF7F0')]),
]))
story.append(summary_tbl)

# Performance
story.append(Paragraph('1. Performance (cold vs warm)', H2))
cold = perf.get('cold',{}); warm = perf.get('warm',{}); diff = perf.get('diff',{})
perf_tbl = Table([
    ['Métrica','Cold','Warm','Δ'],
    ['TTFB (ms)', f"{cold.get('ttfbMs',0):.1f}", f"{warm.get('ttfbMs',0):.1f}", f"{diff.get('ttfbDeltaMs',0):.1f}"],
    ['DOMContentLoaded (ms)', f"{cold.get('domContentLoadedMs',0):.0f}", f"{warm.get('domContentLoadedMs',0):.0f}", f"{cold.get('domContentLoadedMs',0)-warm.get('domContentLoadedMs',0):.0f}"],
    ['Load (ms)', f"{cold.get('loadEventEndMs',0):.0f}", f"{warm.get('loadEventEndMs',0):.0f}", f"{diff.get('loadDeltaMs',0):.0f}"],
    ['FCP (ms)', f"{cold.get('fcpMs',0):.0f}", f"{warm.get('fcpMs',0):.0f}", f"{cold.get('fcpMs',0)-warm.get('fcpMs',0):.0f}"],
    ['Recursos (n)', str(cold.get('resources',{}).get('total','—')), str(warm.get('resources',{}).get('total','—')), str(diff.get('requestsDelta','—'))],
    ['Bytes transferidos', f"{cold.get('resources',{}).get('transferredBytes',0)/1_000_000:.2f} MB", f"{warm.get('resources',{}).get('transferredBytes',0)/1_000_000:.2f} MB", f"{diff.get('bytesDelta',0)/1_000_000:.2f} MB"],
    ['Book → 1º versículo (ms)', f"{cold.get('bookSelectToFirstVerseMs',0):.0f}", f"{warm.get('bookSelectToFirstVerseMs',0):.0f}", f"{cold.get('bookSelectToFirstVerseMs',0)-warm.get('bookSelectToFirstVerseMs',0):.0f}"],
], colWidths=[6*cm,3*cm,3*cm,3*cm])
perf_tbl.setStyle(TableStyle([
    ('BACKGROUND',(0,0),(-1,0), NAVY),('TEXTCOLOR',(0,0),(-1,0), colors.white),
    ('FONTNAME',(0,0),(-1,0),'Helvetica-Bold'),('FONTSIZE',(0,0),(-1,-1),8.5),
    ('GRID',(0,0),(-1,-1),0.25,colors.HexColor('#DDD')),
    ('ROWBACKGROUNDS',(0,1),(-1,-1),[colors.white, colors.HexColor('#FAF7F0')]),
]))
story.append(perf_tbl)
story.append(Paragraph(f"<b>Resultado:</b> cache quente economiza {diff.get('bytesDelta',0)/1_000_000:.2f} MB e {diff.get('loadDeltaMs',0):.0f} ms. Bíblia-text edge calls: <b>{cold.get('resources',{}).get('bibleTextCalls',0)}</b> em cold, <b>{warm.get('resources',{}).get('bibleTextCalls',0)}</b> em warm (servido inteiramente do IDB).", P))

# A11y
story.append(Paragraph('2. Acessibilidade das bolhas (axe-core + checks customizados)', H2))
story.append(Paragraph(f"Cards mapeados na execução: <b>{a11y.get('bubbleCount','—')}</b>. Achados:", P))
rows = [['Sev.','Regra','Descrição','Seletor']]
for f in findings:
    rows.append([f['severity'], f['rule'], f['description'][:70], f['selector'][:50]])
if len(rows)==1: rows.append(['—','—','Nenhum achado','—'])
a_tbl = Table(rows, colWidths=[1.8*cm,3.2*cm,7*cm,4*cm])
a_tbl.setStyle(TableStyle([
    ('BACKGROUND',(0,0),(-1,0), NAVY),('TEXTCOLOR',(0,0),(-1,0), colors.white),
    ('FONTNAME',(0,0),(-1,0),'Helvetica-Bold'),('FONTSIZE',(0,0),(-1,-1),7.5),
    ('GRID',(0,0),(-1,-1),0.25,colors.HexColor('#DDD')),('VALIGN',(0,0),(-1,-1),'TOP'),
]))
story.append(a_tbl)
story.append(Paragraph("<b>Notas sobre as correções aplicadas neste ciclo:</b>", H3))
story.append(Paragraph("• <b>Botão <code>.top-20</code> (diagnóstico):</b> agora possui <code>aria-label=\"Abrir diagnóstico cirúrgico da Bíblia\"</code> e <code>min-h-11 min-w-11</code>. Não aparece mais em achados <i>button-name</i> nem em <i>target-size</i>.", P))
story.append(Paragraph("• <b>Card do Nexus (motion.div clicável):</b> recebeu <code>min-h-11</code>. O achado <i>target-size 183x43</i> remanescente <b>não é do Card</b> — é do <i>sub-botão</i> dentro de <code>[data-testid^=\"nexus-bubbles-\"]</code> (BubbleTag/TagBubble), que continua com altura 43px. Ação recomendada (próxima iteração): aplicar <code>min-h-11</code> também no <code>BubbleTag</code>.", P))
story.append(Paragraph("• <b>button-name crítico</b> em <code>.active:text-secondary</code>: botão distinto, fora do escopo desta iteração — recomendado adicionar <code>aria-label</code>.", P))

# E2E
story.append(PageBreak())
story.append(Paragraph('3. Suíte E2E consolidada do módulo', H2))
rows = [['#','Passo','Status','Detalhe']]
for i,s in enumerate(e2e.get('steps',[]),1):
    rows.append([str(i), s.get('name','')[:48], s.get('status',''), s.get('detail','')[:60]])
e_tbl = Table(rows, colWidths=[0.8*cm, 6*cm, 1.8*cm, 7.5*cm])
e_tbl.setStyle(TableStyle([
    ('BACKGROUND',(0,0),(-1,0), NAVY),('TEXTCOLOR',(0,0),(-1,0), colors.white),
    ('FONTNAME',(0,0),(-1,0),'Helvetica-Bold'),('FONTSIZE',(0,0),(-1,-1),8),
    ('GRID',(0,0),(-1,-1),0.25,colors.HexColor('#DDD')),('VALIGN',(0,0),(-1,-1),'TOP'),
]))
story.append(e_tbl)
story.append(Paragraph('<b>Falha real detectada:</b> uma chamada HTTP retorna 406 — capturada via probe Playwright:', H3))
story.append(Paragraph('<code>GET https://&lt;projeto&gt;.supabase.co/rest/v1/<b>telemetry_settings</b>?select=value&amp;key=eq.thresholds → 406</code>', P))
story.append(Paragraph('Observação importante: <b>não existe</b> a rota/tabela <i>bible_reading_chapters</i> mencionada em relatórios anteriores (busca por <code>rg "bible_reading"</code> em <code>src/</code> retornou 0 ocorrências). O erro 406 real vem de <code>telemetry_settings</code>, provavelmente uma chamada PostgREST com <code>.single()</code>/<code>Accept: application/vnd.pgrst.object+json</code> sem linha correspondente. Correção sugerida: usar <code>.maybeSingle()</code> ou aceitar array (<code>select=value</code> sem header de objeto único).', P))

# Evidências
story.append(PageBreak())
story.append(Paragraph('4. Evidências (screenshots reais)', H2))
shots = sorted(glob.glob(str(ROOT/'**/screenshots/*.png'), recursive=True))
for sp in shots:
    rel = sp.replace(str(ROOT)+'/', '')
    story.append(Paragraph(f"<b>{rel}</b>", H3))
    try:
        img = Image(sp)
        ratio = img.imageWidth / img.imageHeight
        w = 15*cm
        h = w/ratio
        if h > 18*cm:
            h = 18*cm; w = h*ratio
        img._restrictSize(w, h)
        story.append(img)
    except Exception as e:
        story.append(Paragraph(f"(não foi possível incluir: {e})", SMALL))
    story.append(Spacer(1,6))

# Logs
story.append(PageBreak())
story.append(Paragraph('5. Trecho do log de execução', H2))
log = (ROOT/'logs/run.log')
if log.exists():
    txt = log.read_text(errors='ignore').splitlines()
    keep = [l for l in txt if any(k in l for k in (' passed',' failed','✓','✘','Error:','406','PASS','FAIL','Running'))][:60]
    for l in keep:
        story.append(Paragraph(f"<font face='Courier' size='7'>{l[:140].replace('<','&lt;')}</font>", SMALL))

doc = SimpleDocTemplate(str(OUT), pagesize=A4, leftMargin=1.6*cm, rightMargin=1.6*cm, topMargin=1.6*cm, bottomMargin=1.6*cm, title='Cathedra Bible QA v2')
doc.build(story)
print('OK', OUT, OUT.stat().st_size)
