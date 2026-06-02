#!/usr/bin/env bun
import { readFileSync, existsSync } from 'fs';
import { join } from 'path';

/**
 * GENERATE LAYOUT REGRESSION COMMENT
 * Parses Playwright test results and formats a PR comment with a detailed HTML table.
 */

const REGRESSION_REPORT_PATH = 'test-results/visual-regression-consolidated.json';
const METRICS_REPORT_PATH = 'reports/mobile-ux-metrics.json';
const ARTIFACT_URL_BASE = process.env.GITHUB_SERVER_URL + '/' + process.env.GITHUB_REPOSITORY + '/actions/runs/' + process.env.GITHUB_RUN_ID;

console.log('### 📸 Layout & UX Regression Audit\n');

// 1. Visual Regressions
if (existsSync(REGRESSION_REPORT_PATH)) {
  try {
    const report = JSON.parse(readFileSync(REGRESSION_REPORT_PATH, 'utf8'));
    const specs = report.suites?.[0]?.specs || [];
    const failures = specs.filter(spec => !spec.ok);

    if (failures.length > 0) {
      console.log(`⚠️ **${failures.length} Divergências Visuais Detectadas**\n`);
      console.log('| Componente | Breakpoint | Diferença | Artefatos |');
      console.log('| :--- | :--- | :--- | :--- |');
      
      failures.forEach(failure => {
        const title = failure.title;
        const match = title.match(/Consistency: (.*) @ (.*)/);
        const pageName = match ? match[1] : title;
        const bpName = match ? match[2] : 'N/A';
        
        let diffPercent = 'N/A';
        if (failure.tests?.[0]?.results?.[0]?.errors?.[0]?.message) {
          const msg = failure.tests[0].results[0].errors[0].message;
          const diffMatch = msg.match(/([0-9.]+)%|([0-9.]+) pixels/);
          if (diffMatch) diffPercent = diffMatch[0];
        }

        console.log(`| \`${pageName}\` | \`${bpName}\` | **${diffPercent}** | [Download](${ARTIFACT_URL_BASE}) |`);
      });
      console.log('\n');
    } else {
      console.log('✅ Nenhuma regressão visual detectada.\n');
    }
  } catch (e) {
    console.log('⚠️ Erro ao processar relatório visual: ' + (e as Error).message);
  }
}

// 2. UX Metrics (Total Length & Height to CTA)
if (existsSync(METRICS_REPORT_PATH)) {
  try {
    const data = JSON.parse(readFileSync(METRICS_REPORT_PATH, 'utf8'));
    console.log('#### 📏 Métricas de Ergonomia Mobile\n');
    console.log('| Rota | Viewport | Comprimento (px) | Altura até CTA | Status |');
    console.log('| :--- | :--- | :--- | :--- | :--- |');
    
    data.metrics.forEach((m: any) => {
      const status = m.totalPageHeight > 5000 ? '⚠️ Longa' : '✅ Ok';
      console.log(`| \`${m.route}\` | \`${m.viewport}\` | ${m.totalPageHeight} | ${m.heightToNextCTA === -1 ? 'N/A' : m.heightToNextCTA} | ${status} |`);
    });
    console.log('\n');

    const catechismValidations = data.validations.filter((v: any) => v.route === '/catechism');
    if (catechismValidations.length > 0) {
      console.log('#### 🔍 Integridade do Catecismo\n');
      catechismValidations.forEach((v: any) => {
        const icon = v.issues.length === 0 ? '✅' : '⚠️';
        console.log(`- ${icon} **${v.viewport}**: ${v.issues.length === 0 ? 'Sem problemas' : v.issues.join(', ')}`);
      });
    }
  } catch (e) {
    console.log('⚠️ Erro ao processar métricas de UX: ' + (e as Error).message);
  }
}

console.log('\n> [!TIP]\n> Relatório HTML detalhado disponível nos artefatos do CI.');


