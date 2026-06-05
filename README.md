# Cathedra Digital

[![Pipeline de Governança](https://github.com/lovable/cathedra-digital/actions/workflows/governance.yml/badge.svg)](https://github.com/lovable/cathedra-digital/actions/workflows/governance.yml)
[![Design System Compliance](https://img.shields.io/badge/Compliance-85%25-emerald?labelColor=1a1a1a&logo=checkmarx&logoColor=b58b3a)](compliance-report.md)
[![Trend](https://img.shields.io/badge/Trend-Stable-blue)](compliance-report.md)

## Project info

**URL**: https://lovable.dev/projects/REPLACE_WITH_PROJECT_ID
**Test Report**: [Última Execução no CI](https://github.com/lovable/cathedra-digital/actions/workflows/governance.yml)

### Mobile E2E Tests
Tests use Playwright to validate swipe precision on mobile devices.

#### Environment Variables (CI/Local)
- `VITE_SWIPE_THRESHOLD`: Minimum pixels for a swipe (default: 80).
- `VITE_SWIPE_RATIO`: X/Y ratio to distinguish horizontal from diagonal (default: 2.5).
- `RETENTION_DAYS_HTML`: Retention for HTML reports in CI (default: 7).
- `RETENTION_DAYS_EVIDENCE`: Retention for traces/videos in CI (default: 3).

#### Commands
- `npm run test:e2e:headless`: Run mobile suite locally.
- `npm run test:e2e:sync-artifacts`: Sync failed CI tests locally (requires downloading `playwright-report` artifact).
