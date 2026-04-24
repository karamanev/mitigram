import { __resetInjectables, __setInjectable } from '../../../../__mocks__/angular-core';
import { AdHocChipComponent } from './ad-hoc-chip.component';
import { InvitationStore } from '../../../store/invitation.store';

describe('AdHocChipComponent', () => {
  beforeEach(() => {
    __resetInjectables();
    __setInjectable(InvitationStore, new InvitationStore());
  });

  it('stores the input email value', () => {
    const component = new AdHocChipComponent();
    component.email = 'alice@example.com';

    expect(component.email).toBe('alice@example.com');
  });

  it('injects the invitation store', () => {
    const component = new AdHocChipComponent();

    expect((component as any).store).toBeInstanceOf(InvitationStore);
  });
});
