import { configSchema } from '@/infrastructure/config/config.schema';

const BASE_ENV = {
  DATABASE_URL: 'postgresql://user:pass@localhost:5432/hoa',
  CORS_ORIGINS: 'http://localhost:5173',
  JWT_SECRET: 'a'.repeat(32),
  FRONTEND_URL: 'http://localhost:5173',
};

describe('configSchema Brevo email group', () => {
  it('parses when the Brevo group is entirely absent', () => {
    const result = configSchema.safeParse(BASE_ENV);
    expect(result.success).toBe(true);
  });

  it('parses when BREVO_API_KEY and EMAIL_FROM are both set', () => {
    const result = configSchema.safeParse({
      ...BASE_ENV,
      BREVO_API_KEY: 'xkeysib-test',
      EMAIL_FROM: 'noreply@example.cz',
    });
    expect(result.success).toBe(true);
  });

  it('rejects BREVO_API_KEY without EMAIL_FROM', () => {
    const result = configSchema.safeParse({
      ...BASE_ENV,
      BREVO_API_KEY: 'xkeysib-test',
    });
    expect(result.success).toBe(false);
  });

  it('rejects EMAIL_FROM without BREVO_API_KEY', () => {
    const result = configSchema.safeParse({
      ...BASE_ENV,
      EMAIL_FROM: 'noreply@example.cz',
    });
    expect(result.success).toBe(false);
  });

  it('rejects a non-email EMAIL_FROM', () => {
    const result = configSchema.safeParse({
      ...BASE_ENV,
      BREVO_API_KEY: 'xkeysib-test',
      EMAIL_FROM: 'not-an-email',
    });
    expect(result.success).toBe(false);
  });

  it('treats empty strings in the Brevo group as unset', () => {
    const result = configSchema.safeParse({
      ...BASE_ENV,
      BREVO_API_KEY: '',
      EMAIL_FROM: '',
      EMAIL_FROM_NAME: '',
    });
    expect(result.success).toBe(true);
  });
});
