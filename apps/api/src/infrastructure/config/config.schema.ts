import { z } from 'zod';

export const configSchema = z.object({
  DATABASE_URL: z.string().min(1, 'DATABASE_URL is required'),
});

export type Config = z.infer<typeof configSchema>;
