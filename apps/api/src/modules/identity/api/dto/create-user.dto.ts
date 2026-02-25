import { createZodDto } from 'nestjs-zod';
import { z } from 'zod';

const CreateUserSchema = z.object({
  email: z.string().email('Must be a valid email address'),
});

export class CreateUserDto extends createZodDto(CreateUserSchema) {}
