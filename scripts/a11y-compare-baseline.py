#!/usr/bin/env python3
"""
Compara reports/a11y/violations.json contra reports/a11y/baseline.json.
Exit 1 estrito em QUALQUER regressão:
  - contagem por rota×viewport > baseline
  - contagem por impacto (critical/serious/moderate/minor) > baseline
  - total > baseline

Uso: python scripts/a11y-compare-baseline.py
"""
import json
import sys
from collections import Counter
from pathlib import Path

REPORT = Path("reports/a11y/violations.json")
BASELINE = Path("reports/a11y/baseline.json")

if not REPORT.exists():
    print(f"::error::{REPORT} not found — rode a11y-axe-report.py antes.")
    sys.exit(2)
if not BASELINE.exists():
    print(f"::error::{BASELINE} not found.")
    sys.exit(2)

violations = json.loads(REPORT.read_text())
baseline = json.loads(BASELINE.read_text())

base_routes = baseline.get("routes", {})
base_totals = baseline.get("totals", {})

# Observed per route×viewport
observed_routes = Counter()
for v in violations:
    observed_routes[f"{v.get('viewport','?')} {v.get('route','?')}"] += 1

observed_impact = Counter(v.get("impact") or "unknown" for v in violations)
observed_total = len(violations)

regressions: list[str] = []

# Route×viewport regressions (também flagga rotas novas não presentes no baseline)
all_keys = set(base_routes) | set(observed_routes)
for k in sorted(all_keys):
    base = int(base_routes.get(k, 0))
    obs = int(observed_routes.get(k, 0))
    marker = "✅" if obs <= base else "❌"
    print(f"  {marker} {k}: obs={obs} baseline={base}")
    if obs > base:
        regressions.append(f"{k}: {obs} > baseline {base} (+{obs-base})")

# Impact regressions
for impact in ("critical", "serious", "moderate", "minor"):
    base = int(base_totals.get(impact, 0))
    obs = int(observed_impact.get(impact, 0))
    marker = "✅" if obs <= base else "❌"
    print(f"  {marker} impact[{impact}]: obs={obs} baseline={base}")
    if obs > base:
        regressions.append(f"impact[{impact}]: {obs} > baseline {base} (+{obs-base})")

# Total
base_total = int(base_totals.get("total", 0))
marker = "✅" if observed_total <= base_total else "❌"
print(f"  {marker} TOTAL: obs={observed_total} baseline={base_total}")
if observed_total > base_total:
    regressions.append(f"TOTAL: {observed_total} > baseline {base_total} (+{observed_total-base_total})")

if regressions:
    print("\n::error::A11y baseline regression detected (STRICT MODE):")
    for r in regressions:
        print(f"::error::  - {r}")
    print("\nSe a regressão for intencional, atualize reports/a11y/baseline.json em PR dedicado com justificativa.")
    sys.exit(1)

print("\n✅ Sem regressões vs. baseline.")
sys.exit(0)
