import { Page, ConsoleMessage } from '@playwright/test';
import fs from 'node:fs';
import path from 'node:path';

/**
 * Known-noise patterns we never want to fail on. Keep this list small,
 * specific, and commented — every entry is a debt note.
 */
export const KNOWN_CONSOLE_WARNINGS: RegExp[] = [
  /ResizeObserver loop (limit exceeded|completed with undelivered notifications)/i,
  /Download the React DevTools/i,
  /\[vite\] (connecting|connected|hmr)/i,
  /preloaded using link preload but not used/i,
  /Service Worker registered/i,
  /\[HMR\]/i,
];

export type CapturedConsole = {
  type: 'error' | 'pageerror';
  text: string;
  location?: string;
  at: string;
};

export interface ConsoleCapture {
  errors: CapturedConsole[];
  all: CapturedConsole[];
}

/**
 * Attaches console + pageerror listeners and returns a capture object.
 * Real errors land in `errors`; known noise goes only into `all` for the report.
 */
export function captureConsole(page: Page): ConsoleCapture {
  const capture: ConsoleCapture = { errors: [], all: [] };

  page.on('console', (msg: ConsoleMessage) => {
    if (msg.type() !== 'error') return;
    const text = msg.text();
    const loc = msg.location();
    const entry: CapturedConsole = {
      type: 'error',
      text,
      location: loc?.url ? `${loc.url}:${loc.lineNumber}` : undefined,
      at: new Date().toISOString(),
    };
    capture.all.push(entry);
    if (!KNOWN_CONSOLE_WARNINGS.some((rx) => rx.test(text))) {
      capture.errors.push(entry);
    }
  });

  page.on('pageerror', (err) => {
    const entry: CapturedConsole = {
      type: 'pageerror',
      text: err.message,
      at: new Date().toISOString(),
    };
    capture.all.push(entry);
    capture.errors.push(entry);
  });

  return capture;
}

/** Writes a JSON report under reports/console/ for the current spec/run. */
export function writeConsoleReport(slug: string, payload: Record<string, unknown>) {
  const dir = path.resolve(process.cwd(), 'reports/console');
  fs.mkdirSync(dir, { recursive: true });
  const ts = new Date().toISOString().replace(/[:.]/g, '-');
  const file = path.join(dir, `${slug}-${ts}.json`);
  fs.writeFileSync(file, JSON.stringify(payload, null, 2), 'utf-8');
  return file;
}
