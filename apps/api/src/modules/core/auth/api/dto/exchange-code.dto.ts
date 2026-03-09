import { createZodDto } from 'nestjs-zod';
import { z } from 'zod';

const ExchangeCodeSchema = z.object({
  code: z.string().min(1, 'Code is required'),
});

export class ExchangeCodeDto extends createZodDto(ExchangeCodeSchema) {}
