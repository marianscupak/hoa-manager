import { createZodDto } from 'nestjs-zod';
import { z } from 'zod';

const RegisterSchema = z.object({
  email: z.email('Must be a valid email address').toLowerCase().trim(),
  fullName: z.string().min(1, 'Full name is required').trim(),
  password: z.string().min(8, 'Password must be at least 8 characters'),
});

export class RegisterDto extends createZodDto(RegisterSchema) {}

const VerifyEmailSchema = z.object({
  email: z.email('Must be a valid email address').toLowerCase().trim(),
  code: z.string().regex(/^\d{6}$/, 'The code has six digits'),
});

export class VerifyEmailDto extends createZodDto(VerifyEmailSchema) {}

const ResendVerificationSchema = z.object({
  email: z.email('Must be a valid email address').toLowerCase().trim(),
});

export class ResendVerificationDto extends createZodDto(
  ResendVerificationSchema,
) {}
