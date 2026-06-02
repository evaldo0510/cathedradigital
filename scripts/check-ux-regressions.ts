import fs from 'fs';
import path from 'path';

interface UXMetrics {
  route: string;
  viewport: string;
  totalPageHeight: number;
  heightToNextCTA: number;
  viewportHeight: number;
}

interface ValidationResult {
  route: string;
  viewport: string;
  hasCuts: boolean;
  hasOverlaps: boolean;
  smallTouchArea?: boolean;
  issues: string[];
}

interface ReportData {
  metrics: UXMetrics[];
  validations: ValidationResult[];
  timestamp: string;
}

const REPORT_DIR = path.join(process.cwd(), 'reports');
const CURRENT_REPORT_PATH = path.join(REPORT_DIR, 'mobile-ux-metrics.json');
const BASELINE_REPORT_PATH = path.join(REPORT_DIR, 'baseline-mobile-ux-metrics.json');

const REGRESSION_THRESHOLD_PERCENT = 15; // Alerta se as métricas piorarem > 15%

function checkRegressions() {
  if (!fs.existsSync(CURRENT_REPORT_PATH)) {
    console.log('Nenhum relatório atual encontrado para verificação.');
    return;
  }

  const currentData: ReportData = JSON.parse(fs.readFileSync(CURRENT_REPORT_PATH, 'utf8'));
  
  if (!fs.existsSync(BASELINE_REPORT_PATH)) {
    console.log('Gerando baseline inicial...');
    fs.writeFileSync(BASELINE_REPORT_PATH, JSON.stringify(currentData, null, 2));
    return;
  }

  const baselineData: ReportData = JSON.parse(fs.readFileSync(BASELINE_REPORT_PATH, 'utf8'));
  const alerts: string[] = [];

  console.log('--- Verificando Regressões Ergonômicas ---');

  currentData.metrics.forEach(m => {
    const b = baselineData.metrics.find(bm => bm.route === m.route && bm.viewport === m.viewport);
    if (!b) return;

    // Regressão no comprimento total (muito scroll)
    const heightDiff = ((m.totalPageHeight - b.totalPageHeight) / b.totalPageHeight) * 100;
    if (heightDiff > REGRESSION_THRESHOLD_PERCENT) {
      alerts.push(`🚨 REGRESSÃO: Aumento de ${heightDiff.toFixed(1)}% no scroll da página ${m.route} (${m.viewport}).`);
    }

    // Regressão na distância até o próximo CTA
    if (b.heightToNextCTA > 0 && m.heightToNextCTA > 0) {
      const ctaDiff = ((m.heightToNextCTA - b.heightToNextCTA) / b.heightToNextCTA) * 100;
      if (ctaDiff > REGRESSION_THRESHOLD_PERCENT) {
        alerts.push(`🚨 REGRESSÃO: O primeiro CTA da página ${m.route} em ${m.viewport} está ${ctaDiff.toFixed(1)}% mais longe do topo.`);
      }
    }
  });

  // Verificação de integridade
  currentData.validations.forEach(v => {
    if (v.issues.length > 0) {
      alerts.push(`⚠️ ERRO VISUAL: ${v.issues.length} problemas detectados em ${v.route} (${v.viewport}).`);
    }
  });

  if (alerts.length > 0) {
    console.error('\n!!! REGRESSÕES DE UX DETECTADAS !!!');
    alerts.forEach(a => console.error(a));
    
    // Gera arquivo para o comentário do PR
    const comment = `## 🤖 Alerta de Auditoria de UX Mobile\n\n${alerts.join('\n\n')}\n\nConsulte o relatório completo nos artefatos do build.`;
    fs.writeFileSync(path.join(REPORT_DIR, 'pr-ux-comment.md'), comment);
    
    // Em um CI real, poderíamos falhar o build aqui ou apenas marcar com um aviso
    // process.exit(1); 
  } else {
    console.log('✅ Nenhuma regressão de UX significativa detectada.');
    fs.writeFileSync(path.join(REPORT_DIR, 'pr-ux-comment.md'), '## ✅ Auditoria de UX Mobile\n\nNenhuma regressão detectada. O layout mobile continua otimizado.');
  }
}

checkRegressions();
