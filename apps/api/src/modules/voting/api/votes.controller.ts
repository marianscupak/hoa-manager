import { Controller } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';

@ApiTags('votes')
@Controller('votes')
export class VotesController {}
