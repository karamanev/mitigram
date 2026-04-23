import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma.service';
import type { Contact } from '@mitigram/shared';

@Injectable()
export class ContactsService {
  constructor(private readonly prisma: PrismaService) {}

  async findAll(): Promise<Contact[]> {
    const rows = await this.prisma.contact.findMany({
      orderBy: { name: 'asc' },
    });
    return rows.map(({ id, name, email }) => ({ id, name, email }));
  }
}
