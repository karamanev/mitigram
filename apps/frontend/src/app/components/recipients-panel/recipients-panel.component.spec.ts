import { __resetInjectables, __setInjectable } from '../../../__mocks__/angular-core';
import { RecipientsPanelComponent } from './recipients-panel.component';
import { InvitationStore } from '../../store/invitation.store';

describe('RecipientsPanelComponent', () => {
  let store: InvitationStore;

  beforeEach(() => {
    __resetInjectables();
    store = new InvitationStore();
    __setInjectable(InvitationStore, store);
  });

  it('reports empty when no recipients are selected', () => {
    const component = new RecipientsPanelComponent();

    expect((component as any).isEmpty()).toBe(true);
  });

  it('reports non-empty when individuals, groups, or ad-hoc emails exist', () => {
    const component = new RecipientsPanelComponent();
    store.addAdHocEmail('alice@example.com');

    expect((component as any).isEmpty()).toBe(false);
  });
});
