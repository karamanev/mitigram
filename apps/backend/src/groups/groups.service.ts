import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma.service';
import type { Group } from '@mitigram/shared';

@Injectable()
export class GroupsService {
  constructor(private readonly prisma: PrismaService) {}

  async findAll(): Promise<Group[]> {
    const rows = await this.prisma.group.findMany({
      orderBy: { name: 'asc' },
      include: {
        members: {
          include: { contact: true },
        },
      },
    });

    return rows.map((g) => ({
      id: g.id,
      name: g.name,
      members: g.members.map((m) => ({
        id: m.contact.id,
        name: m.contact.name,
        email: m.contact.email,
      })),
    }));
  }
}
