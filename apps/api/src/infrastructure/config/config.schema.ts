import { z } from 'zod';

export const configSchema = z.object({
  DATABASE_URL: z.string().min(1, 'DATABASE_URL is required'),
  CORS_ORIGINS: z
    .string()
    .min(1, 'CORS_ORIGINS is required')
    .transform((val) => val.split(',')),
});

export type Config = z.infer<typeof configSchema>;
