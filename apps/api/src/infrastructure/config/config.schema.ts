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
  .pipe(
    z
      .array(z.url('CORS_ORIGINS must be a comma-separated list of URLs'))
      .min(1),
  );

const optionalNonEmpty = z.preprocess(
  (v) => (v === '' ? undefined : v),
  z.string().min(1).optional(),
);

const optionalUrl = z.preprocess(
  (v) => (v === '' ? undefined : v),
  z.url().optional(),
);

const optionalEmail = z.preprocess(
  (v) => (v === '' ? undefined : v),
  z.email().optional(),
);

/**
 * Winston's npm levels, most severe first. Nothing set a level before, so the
 * library default of `info` applied everywhere and the `debug` calls in the
 * schedulers never emitted in any environment.
 */
const LOG_LEVELS = [
  'error',
  'warn',
  'info',
  'http',
  'verbose',
  'debug',
  'silly',
] as const;

export const configSchema = z
  .object({
    DATABASE_URL: z.string().min(1, 'DATABASE_URL is required'),
    LOG_LEVEL: z.enum(LOG_LEVELS).default('info'),
    CORS_ORIGINS: corsOriginsSchema,
    JWT_SECRET: z.string().min(32, 'JWT_SECRET must be at least 32 characters'),
    FRONTEND_URL: z.url('FRONTEND_URL must be a valid URL'),
    GOOGLE_CLIENT_ID: z.string().optional(),
    GOOGLE_CLIENT_SECRET: z.string().optional(),
    GOOGLE_REDIRECT_URI: z
      .url('GOOGLE_REDIRECT_URI must be a valid URL')
      .optional(),
    R2_UPLOADS_ENDPOINT: optionalUrl,
    R2_UPLOADS_BUCKET: optionalNonEmpty,
    R2_UPLOADS_ACCESS_KEY_ID: optionalNonEmpty,
    R2_UPLOADS_SECRET_ACCESS_KEY: optionalNonEmpty,
    BREVO_API_KEY: optionalNonEmpty,
    EMAIL_FROM: optionalEmail,
    EMAIL_FROM_NAME: optionalNonEmpty,
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
  )
  .refine(
    (c) => {
      const provided = [
        c.R2_UPLOADS_ENDPOINT,
        c.R2_UPLOADS_BUCKET,
        c.R2_UPLOADS_ACCESS_KEY_ID,
        c.R2_UPLOADS_SECRET_ACCESS_KEY,
      ].filter(Boolean).length;
      return provided === 0 || provided === 4;
    },
    {
      message:
        'R2_UPLOADS_ENDPOINT, R2_UPLOADS_BUCKET, R2_UPLOADS_ACCESS_KEY_ID and R2_UPLOADS_SECRET_ACCESS_KEY must all be set together (or all unset).',
    },
  )
  .refine(
    (c) => {
      const provided = [c.BREVO_API_KEY, c.EMAIL_FROM].filter(Boolean).length;
      return provided === 0 || provided === 2;
    },
    {
      message:
        'BREVO_API_KEY and EMAIL_FROM must both be set together (or both unset).',
    },
  );

export type Config = z.infer<typeof configSchema>;
