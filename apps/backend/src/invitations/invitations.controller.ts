import { Body, Controller, HttpCode, Param, Post } from '@nestjs/common';
import { InvitationsService } from './invitations.service';
import { CreateInvitationDto } from './dto/create-invitation.dto';
import type { Invitation } from '@mitigram/shared';

@Controller('instruments')
export class InvitationsController {
  constructor(private readonly invitations: InvitationsService) {}

  @Post(':id/invitations')
  @HttpCode(201)
  create(
    @Param('id') instrumentId: string,
    @Body() dto: CreateInvitationDto,
  ): Promise<Invitation> {
    return this.invitations.create(instrumentId, dto);
  }
}
