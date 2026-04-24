import { __resetInjectables, __setInjectable } from '../../../../__mocks__/angular-core';
import type { Contact } from '@mitigram/shared';
import { IndividualChipComponent } from './individual-chip.component';
import { InvitationStore } from '../../../store/invitation.store';

describe('IndividualChipComponent', () => {
  const contact: Contact = {
    id: 'alice',
    name: 'Alice',
    email: 'alice@example.com',
  };

  beforeEach(() => {
    __resetInjectables();
    __setInjectable(InvitationStore, new InvitationStore());
  });

  it('stores the input contact value', () => {
    const component = new IndividualChipComponent();
    component.contact = contact;

    expect(component.contact).toBe(contact);
  });

  it('injects the invitation store', () => {
    const component = new IndividualChipComponent();

    expect((component as any).store).toBeInstanceOf(InvitationStore);
  });
});
