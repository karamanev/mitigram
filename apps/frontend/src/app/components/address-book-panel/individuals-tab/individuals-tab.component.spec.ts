import { __resetInjectables, __setInjectable } from '../../../../__mocks__/angular-core';
import type { Contact } from '@mitigram/shared';
import { IndividualsTabComponent } from './individuals-tab.component';
import { InvitationStore } from '../../../store/invitation.store';

describe('IndividualsTabComponent', () => {
  const alice: Contact = { id: 'alice', name: 'Alice Adams', email: 'alice@example.com' };
  const bob: Contact = { id: 'bob', name: 'Bob Brown', email: 'bob@desk.example.com' };

  let store: InvitationStore;

  beforeEach(() => {
    __resetInjectables();
    store = new InvitationStore();
    store.contacts.set([alice, bob]);
    __setInjectable(InvitationStore, store);
  });

  it('returns all contacts when the query is empty', () => {
    const component = new IndividualsTabComponent();

    expect((component as any).filtered()).toEqual([alice, bob]);
  });

  it('filters contacts by matching name or email', () => {
    const component = new IndividualsTabComponent();
    (component as any).query.set('desk');

    expect((component as any).filtered()).toEqual([bob]);
  });

  it('adds a contact when toggling an unselected item', () => {
    const component = new IndividualsTabComponent();

    (component as any).toggle(alice.id);

    expect(store.isIndividualSelected(alice.id)).toBe(true);
  });

  it('removes a contact when toggling a selected item', () => {
    store.addIndividual(alice);
    const component = new IndividualsTabComponent();

    (component as any).toggle(alice.id);

    expect(store.isIndividualSelected(alice.id)).toBe(false);
  });

  it('reads the string value from an input event', () => {
    const component = new IndividualsTabComponent();
    const event = { target: { value: 'Alice' } } as unknown as Event;

    expect((component as any).asString(event)).toBe('Alice');
  });
});
