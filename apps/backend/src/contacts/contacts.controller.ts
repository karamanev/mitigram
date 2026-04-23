import { Controller, Get } from '@nestjs/common';
import { ContactsService } from './contacts.service';
import type { Contact } from '@mitigram/shared';

@Controller('contacts')
export class ContactsController {
  constructor(private readonly contacts: ContactsService) {}

  @Get()
  findAll(): Promise<Contact[]> {
    return this.contacts.findAll();
  }
}
