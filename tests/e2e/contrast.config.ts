/**
 * Re-export of the shared contrast configuration so existing Playwright
 * imports keep working. The single source of truth now lives in
 * `src/lib/contrast-config.ts` and is also consumed by the dev overlay.
 */
export * from '../../src/lib/contrast-config';
