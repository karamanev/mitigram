import { __resetInjectables, __setInjectable } from '../../../../__mocks__/angular-core';
import type { SelectedGroup } from '../../../store/invitation.store';
import { InvitationStore } from '../../../store/invitation.store';
import { GroupCardComponent } from './group-card.component';

describe('GroupCardComponent', () => {
  const group: SelectedGroup = {
    id: 'group-alpha',
    name: 'Alpha',
    members: [
      { id: 'alice', name: 'Alice', email: 'alice@example.com' },
      { id: 'bob', name: 'Bob', email: 'bob@example.com' },
    ],
    excludedMemberIds: new Set<string>(),
  };

  let store: InvitationStore;

  beforeEach(() => {
    __resetInjectables();
    store = new InvitationStore();
    store.selectedGroups.set([group]);
    __setInjectable(InvitationStore, store);
  });

  it('starts collapsed', () => {
    const component = new GroupCardComponent();
    component.group = group;

    expect((component as any).expanded()).toBe(false);
  });

  it('counts only active group members', () => {
    store.toggleGroupMember(group.id, 'bob');
    const component = new GroupCardComponent();
    component.group = group;

    expect((component as any).activeCount()).toBe(1);
  });
});
