import { createZodDto } from 'nestjs-zod';
import { z } from 'zod';

const CreateUserSchema = z.object({
  email: z.string().email('Must be a valid email address').toLowerCase().trim(),
  fullName: z.string().min(1, 'Full name is required').trim(),
});

export class CreateUserDto extends createZodDto(CreateUserSchema) {}
