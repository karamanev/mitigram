import { __resetInjectables, __setInjectable } from '../../../../__mocks__/angular-core';
import type { Group } from '@mitigram/shared';
import { GroupsTabComponent } from './groups-tab.component';
import { InvitationStore } from '../../../store/invitation.store';

describe('GroupsTabComponent', () => {
  const alpha: Group = {
    id: 'group-alpha',
    name: 'Alpha Team',
    members: [{ id: '1', name: 'Alice', email: 'alice@example.com' }],
  };
  const beta: Group = {
    id: 'group-beta',
    name: 'Beta Desk',
    members: [{ id: '2', name: 'Bob', email: 'bob@example.com' }],
  };

  let store: InvitationStore;

  beforeEach(() => {
    __resetInjectables();
    store = new InvitationStore();
    store.groups.set([alpha, beta]);
    __setInjectable(InvitationStore, store);
  });

  it('returns all groups when the query is empty', () => {
    const component = new GroupsTabComponent();

    expect((component as any).filtered()).toEqual([alpha, beta]);
  });

  it('filters groups by case-insensitive name matches', () => {
    const component = new GroupsTabComponent();
    (component as any).query.set('desk');

    expect((component as any).filtered()).toEqual([beta]);
  });

  it('adds a group when toggling an unselected item', () => {
    const component = new GroupsTabComponent();

    (component as any).toggle(alpha.id);

    expect(store.isGroupSelected(alpha.id)).toBe(true);
  });

  it('removes a group when toggling a selected item', () => {
    store.addGroup(alpha);
    const component = new GroupsTabComponent();

    (component as any).toggle(alpha.id);

    expect(store.isGroupSelected(alpha.id)).toBe(false);
  });

  it('reads the string value from an input event', () => {
    const component = new GroupsTabComponent();
    const event = { target: { value: 'Alpha' } } as unknown as Event;

    expect((component as any).asString(event)).toBe('Alpha');
  });
});
