import { Module } from '@nestjs/common';
import { ContactsModule } from './contacts/contacts.module';
import { GroupsModule } from './groups/groups.module';
import { InvitationsModule } from './invitations/invitations.module';

@Module({
  imports: [ContactsModule, GroupsModule, InvitationsModule],
})
export class AppModule {}
