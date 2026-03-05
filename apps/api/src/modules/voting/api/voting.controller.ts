import { Controller } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';

@ApiTags('voting')
@Controller('voting')
export class VotingController {}
