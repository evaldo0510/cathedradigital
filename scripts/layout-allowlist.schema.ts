import { z } from 'zod';

export const LayoutAllowlistSchema = z.array(z.string().min(1)).describe('List of file paths or directories allowed to use restricted layout utilities');

export type LayoutAllowlist = z.infer<typeof LayoutAllowlistSchema>;
