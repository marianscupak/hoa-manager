import { z } from 'zod';

const corsOriginsSchema = z
  .string()
  .min(1, 'CORS_ORIGINS is required')
  .transform((val) =>
    val
      .split(',')
      .map((s) => s.trim())
      .filter(Boolean),
  )
  .pipe(z.array(z.url('CORS_ORIGINS must be a comma-separated list of URLs')).min(1));

export const configSchema = z
  .object({
    DATABASE_URL: z.string().min(1, 'DATABASE_URL is required'),
    CORS_ORIGINS: corsOriginsSchema,
    JWT_SECRET: z
      .string()
      .min(32, 'JWT_SECRET must be at least 32 characters'),
    FRONTEND_URL: z.url('FRONTEND_URL must be a valid URL'),
    GOOGLE_CLIENT_ID: z.string().optional(),
    GOOGLE_CLIENT_SECRET: z.string().optional(),
    GOOGLE_REDIRECT_URI: z.url('GOOGLE_REDIRECT_URI must be a valid URL').optional(),
  })
  .refine(
    (c) => {
      const provided = [
        c.GOOGLE_CLIENT_ID,
        c.GOOGLE_CLIENT_SECRET,
        c.GOOGLE_REDIRECT_URI,
      ].filter(Boolean).length;
      return provided === 0 || provided === 3;
    },
    {
      message:
        'GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET and GOOGLE_REDIRECT_URI must all be set together (or all unset).',
    },
  );

export type Config = z.infer<typeof configSchema>;
