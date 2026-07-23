#!/usr/bin/env python3
"""
Atualiza reports/a11y/baseline.json com os resultados atuais de
reports/a11y/violations.json.

Uso (após rodar `npm run a11y:local` ou o CI ter gerado violations.json):
  python scripts/a11y-update-baseline.py           # requer confirmação
  python scripts/a11y-update-baseline.py --yes     # não interativo (CI/scripts)

Só rode isto quando a regressão for INTENCIONAL e aprovada.
"""
import json
import sys
from collections import Counter
from datetime import date
from pathlib import Path

REPORT = Path("reports/a11y/violations.json")
BASELINE = Path("reports/a11y/baseline.json")

if not REPORT.exists():
    print(f"❌ {REPORT} não existe. Rode `npm run a11y:local` (ou o CI) antes.")
    sys.exit(2)

violations = json.loads(REPORT.read_text())
prev = json.loads(BASELINE.read_text()) if BASELINE.exists() else {}

routes = Counter()
impacts = Counter()
for v in violations:
    routes[f"{v.get('viewport','?')} {v.get('route','?')}"] += 1
    impacts[v.get("impact") or "unknown"] += 1

new_baseline = {
    "_meta": {
        "description": "Baseline estrito de violações axe (color-contrast + core ARIA) por rota × viewport. Qualquer valor observado > baseline reprova o CI (exit 1). Atualizar apenas via PR dedicado com justificativa.",
        "generated_at": date.today().isoformat(),
        "rules": (prev.get("_meta") or {}).get("rules") or [
            "color-contrast", "button-name", "link-name", "image-alt",
            "label", "aria-required-attr", "duplicate-id-aria",
            "html-has-lang", "landmark-one-main",
        ],
        "policy": "strict-zero-regression",
    },
    "routes": dict(sorted(routes.items())),
    "totals": {
        "critical": impacts.get("critical", 0),
        "serious": impacts.get("serious", 0),
        "moderate": impacts.get("moderate", 0),
        "minor": impacts.get("minor", 0),
        "total": len(violations),
    },
}

print("Baseline atual:")
print(json.dumps(prev.get("routes", {}), indent=2, ensure_ascii=False))
print(f"  totals: {prev.get('totals', {})}")
print("\nBaseline novo (do violations.json atual):")
print(json.dumps(new_baseline["routes"], indent=2, ensure_ascii=False))
print(f"  totals: {new_baseline['totals']}")

if "--yes" not in sys.argv and "-y" not in sys.argv:
    resp = input("\nSobrescrever baseline.json? [y/N] ").strip().lower()
    if resp not in ("y", "yes", "s", "sim"):
        print("Cancelado.")
        sys.exit(1)

BASELINE.write_text(json.dumps(new_baseline, indent=2, ensure_ascii=False) + "\n")
print(f"\n✅ {BASELINE} atualizado.")
