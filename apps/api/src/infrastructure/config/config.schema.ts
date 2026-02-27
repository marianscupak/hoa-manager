import { z } from 'zod';

export const configSchema = z.object({
  DATABASE_URL: z.string().min(1, 'DATABASE_URL is required'),
  CORS_ORIGINS: z
    .string()
    .min(1, 'CORS_ORIGINS is required')
    .transform((val) => val.split(',')),
  GOOGLE_CLIENT_ID: z.string().optional(),
  GOOGLE_CLIENT_SECRET: z.string().optional(),
  GOOGLE_REDIRECT_URI: z.string().optional(),
  FRONTEND_URL: z.string().optional(),
  JWT_SECRET: z.string().optional(),
});

export type Config = z.infer<typeof configSchema>;
