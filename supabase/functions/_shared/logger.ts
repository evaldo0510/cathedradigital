// Sprint A / CAT-001 — Logger correlacionado
// Uso:
//   const log = makeLogger('bible-search', cid);
//   log.info('start', { extra: 'meta' });
//   log.error('failure', { err });
//
// Todas as linhas emitem JSON com correlation_id — assegura rastreabilidade
// ponta a ponta entre client → edge → Postgres (via header x-correlation-id).

type Level = 'debug' | 'info' | 'warn' | 'error';

export interface CidLogger {
  cid: string;
  debug: (msg: string, meta?: Record<string, unknown>) => void;
  info: (msg: string, meta?: Record<string, unknown>) => void;
  warn: (msg: string, meta?: Record<string, unknown>) => void;
  error: (msg: string, meta?: Record<string, unknown>) => void;
}

function emit(level: Level, fn: string, cid: string, msg: string, meta?: Record<string, unknown>) {
  const line = {
    t: new Date().toISOString(),
    level,
    fn,
    correlation_id: cid,
    msg,
    ...(meta ?? {}),
  };
  const s = JSON.stringify(line);
  if (level === 'error') console.error(s);
  else if (level === 'warn') console.warn(s);
  else console.log(s);
}

export function makeLogger(fn: string, cid: string): CidLogger {
  return {
    cid,
    debug: (m, meta) => emit('debug', fn, cid, m, meta),
    info: (m, meta) => emit('info', fn, cid, m, meta),
    warn: (m, meta) => emit('warn', fn, cid, m, meta),
    error: (m, meta) => emit('error', fn, cid, m, meta),
  };
}
