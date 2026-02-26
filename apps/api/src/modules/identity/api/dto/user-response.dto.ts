import { createZodDto } from 'nestjs-zod';
import { z } from 'zod';

const CreateUserResponseSchema = z.object({
  id: z.uuid(),
});

export class CreateUserResponseDto extends createZodDto(
  CreateUserResponseSchema,
) {}

const UserResponseSchema = z.object({
  id: z.uuid(),
  email: z.email(),
});

export class UserResponseDto extends createZodDto(UserResponseSchema) {}
