import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma.service';
import { CreateInvitationDto } from './dto/create-invitation.dto';
import type { Invitation } from '@mitigram/shared';

@Injectable()
export class InvitationsService {
  constructor(private readonly prisma: PrismaService) {}

  async create(
    instrumentId: string,
    dto: CreateInvitationDto,
  ): Promise<Invitation> {
    const row = await this.prisma.invitation.create({
      data: {
        instrumentId,
        emails: JSON.stringify(dto.emails),
      },
    });

    return {
      id: row.id,
      instrumentId: row.instrumentId,
      emails: JSON.parse(row.emails) as string[],
      sentAt: row.sentAt.toISOString(),
    };
  }
}
