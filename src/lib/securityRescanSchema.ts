import { z } from 'zod';

export const RescanFindingSchema = z.object({
  internal_id: z.string(),
  title: z.string(),
  resolution: z.string(),
});

export const RescanWarningSchema = z.object({
  id: z.string(),
  count: z.number().int().nonnegative(),
  level: z.string(),
  note: z.string(),
});

export const RescanSummarySchema = z.object({
  critical: z.number().int().nonnegative(),
  high: z.number().int().nonnegative(),
  warn: z.number().int().nonnegative(),
  info: z.number().int().nonnegative(),
  total: z.number().int().nonnegative(),
});

export const RescanReportSchema = z.object({
  scan_id: z.string(),
  scanned_at: z.string(),
  trigger: z.string(),
  summary: RescanSummarySchema,
  fixed_findings: z.array(RescanFindingSchema).default([]),
  remaining_warnings: z.array(RescanWarningSchema).default([]),
  ci_gate: z.object({
    policy: z.string(),
    thresholds: z.object({
      critical: z.number().int().nonnegative(),
      high: z.number().int().nonnegative(),
    }),
  }),
});

export type RescanReport = z.infer<typeof RescanReportSchema>;

export const RescanHistoryEntrySchema = z.object({
  scan_id: z.string(),
  scanned_at: z.string(),
  trigger: z.string(),
  summary: RescanSummarySchema,
  gate: z.object({
    status: z.enum(['ok', 'blocked', 'unknown']),
    blocked: z.boolean(),
    blocking: z.array(z.string()).default([]),
  }),
  report_url: z.string(),
  commit: z.string().nullable().optional(),
  pr: z.union([z.string(), z.number()]).nullable().optional(),
});

export const RescanHistorySchema = z.object({
  current: z.string(),
  runs: z.array(RescanHistoryEntrySchema),
});

export type RescanHistory = z.infer<typeof RescanHistorySchema>;
export type RescanHistoryEntry = z.infer<typeof RescanHistoryEntrySchema>;
