/**
 * Unit tests for InvitationStore.
 *
 * Focuses on the core logic: finalEmails (dedup + exclusion) and
 * emailsWithSources (review panel hints).  No DOM, no TestBed — Angular
 * signals work fine in plain Node.
 *
 * Run: npm run test:unit  (from apps/frontend)
 */
import { InvitationStore } from './invitation.store';
import type { Contact, Group } from '@mitigram/shared';

// ── Fixtures ──────────────────────────────────────────────────────────────────

const alice: Contact = { id: 'c_alice', name: 'Alice', email: 'alice@example.com' };
const bob: Contact = { id: 'c_bob', name: 'Bob', email: 'bob@example.com' };
const carol: Contact = { id: 'c_carol', name: 'Carol', email: 'carol@example.com' };

const groupA: Group = {
  id: 'g_alpha',
  name: 'Alpha',
  members: [alice, bob],
};

const groupB: Group = {
  id: 'g_beta',
  name: 'Beta',
  members: [bob, carol], // bob overlaps with groupA
};

// ── Helpers ───────────────────────────────────────────────────────────────────

function makeStore(): InvitationStore {
  return new InvitationStore();
}

// ─────────────────────────────────────────────────────────────────────────────

describe('InvitationStore — initial state', () => {
  it('finalEmails is empty on creation', () => {
    expect(makeStore().finalEmails()).toEqual([]);
  });

  it('emailsWithSources is empty on creation', () => {
    expect(makeStore().emailsWithSources()).toEqual([]);
  });
});

// ─────────────────────────────────────────────────────────────────────────────

describe('InvitationStore — individual contacts (req #1)', () => {
  it('adds a contact email to finalEmails', () => {
    const store = makeStore();
    store.addIndividual(alice);
    expect(store.finalEmails()).toContain('alice@example.com');
  });

  it('adding the same contact twice results in one email entry', () => {
    const store = makeStore();
    store.addIndividual(alice);
    store.addIndividual(alice);
    expect(store.finalEmails()).toHaveLength(1);
  });

  it('removing a contact removes their email', () => {
    const store = makeStore();
    store.addIndividual(alice);
    store.removeIndividual(alice.id);
    expect(store.finalEmails()).toEqual([]);
  });

  it('isIndividualSelected reflects selection state', () => {
    const store = makeStore();
    expect(store.isIndividualSelected(alice.id)).toBe(false);
    store.addIndividual(alice);
    expect(store.isIndividualSelected(alice.id)).toBe(true);
    store.removeIndividual(alice.id);
    expect(store.isIndividualSelected(alice.id)).toBe(false);
  });
});

// ─────────────────────────────────────────────────────────────────────────────

describe('InvitationStore — groups (req #2)', () => {
  it('adds all group member emails to finalEmails', () => {
    const store = makeStore();
    store.addGroup(groupA);
    expect(store.finalEmails()).toEqual(
      expect.arrayContaining(['alice@example.com', 'bob@example.com']),
    );
    expect(store.finalEmails()).toHaveLength(2);
  });

  it('adding the same group twice results in one set of emails', () => {
    const store = makeStore();
    store.addGroup(groupA);
    store.addGroup(groupA);
    expect(store.finalEmails()).toHaveLength(2);
  });

  it('removing a group removes its emails', () => {
    const store = makeStore();
    store.addGroup(groupA);
    store.removeGroup(groupA.id);
    expect(store.finalEmails()).toEqual([]);
  });

  it('isGroupSelected reflects selection state', () => {
    const store = makeStore();
    expect(store.isGroupSelected(groupA.id)).toBe(false);
    store.addGroup(groupA);
    expect(store.isGroupSelected(groupA.id)).toBe(true);
  });
});

// ─────────────────────────────────────────────────────────────────────────────

describe('InvitationStore — group member exclusion (req #3)', () => {
  it('excluding a member removes their email from finalEmails', () => {
    const store = makeStore();
    store.addGroup(groupA); // alice + bob
    store.toggleGroupMember(groupA.id, bob.id); // exclude bob
    expect(store.finalEmails()).toEqual(['alice@example.com']);
  });

  it('re-including an excluded member restores their email', () => {
    const store = makeStore();
    store.addGroup(groupA);
    store.toggleGroupMember(groupA.id, bob.id); // exclude
    store.toggleGroupMember(groupA.id, bob.id); // re-include
    expect(store.finalEmails()).toContain('bob@example.com');
  });

  it('isMemberExcluded reflects exclusion state correctly', () => {
    const store = makeStore();
    store.addGroup(groupA);
    expect(store.isMemberExcluded(groupA.id, bob.id)).toBe(false);
    store.toggleGroupMember(groupA.id, bob.id);
    expect(store.isMemberExcluded(groupA.id, bob.id)).toBe(true);
  });

  it('excluding a member from one group does not exclude them from another', () => {
    // bob is in both groupA and groupB
    const store = makeStore();
    store.addGroup(groupA);
    store.addGroup(groupB);
    store.toggleGroupMember(groupA.id, bob.id); // exclude bob from groupA only

    // bob is still in groupB so his email must still appear
    expect(store.finalEmails()).toContain('bob@example.com');
  });

  it('excluding ALL members of a group results in zero emails from that group', () => {
    const store = makeStore();
    store.addGroup(groupA);
    store.toggleGroupMember(groupA.id, alice.id);
    store.toggleGroupMember(groupA.id, bob.id);
    expect(store.finalEmails()).toHaveLength(0);
  });
});

// ─────────────────────────────────────────────────────────────────────────────

describe('InvitationStore — ad-hoc emails (req #4)', () => {
  it('adds an ad-hoc email to finalEmails', () => {
    const store = makeStore();
    store.addAdHocEmail('adhoc@example.com');
    expect(store.finalEmails()).toContain('adhoc@example.com');
  });

  it('normalises ad-hoc emails to lowercase', () => {
    const store = makeStore();
    store.addAdHocEmail('UPPER@EXAMPLE.COM');
    expect(store.finalEmails()).toContain('upper@example.com');
  });

  it('adding the same ad-hoc email twice results in one entry', () => {
    const store = makeStore();
    store.addAdHocEmail('dup@example.com');
    store.addAdHocEmail('dup@example.com');
    expect(store.finalEmails()).toHaveLength(1);
  });

  it('removing an ad-hoc email removes it from finalEmails', () => {
    const store = makeStore();
    store.addAdHocEmail('adhoc@example.com');
    store.removeAdHocEmail('adhoc@example.com');
    expect(store.finalEmails()).toEqual([]);
  });
});

// ─────────────────────────────────────────────────────────────────────────────

describe('InvitationStore — deduplication across sources', () => {
  it('individual + group sharing an email → one entry', () => {
    const store = makeStore();
    store.addIndividual(alice);
    store.addGroup(groupA); // also contains alice
    const emails = store.finalEmails();
    const aliceCount = emails.filter(e => e === 'alice@example.com').length;
    expect(aliceCount).toBe(1);
  });

  it('two groups sharing a member → one entry for that member', () => {
    const store = makeStore();
    store.addGroup(groupA); // alice + bob
    store.addGroup(groupB); // bob  + carol
    const emails = store.finalEmails();
    const bobCount = emails.filter(e => e === 'bob@example.com').length;
    expect(bobCount).toBe(1);
    expect(emails).toHaveLength(3); // alice, bob, carol
  });

  it('ad-hoc email matching a group member → one entry', () => {
    const store = makeStore();
    store.addGroup(groupA);
    store.addAdHocEmail('alice@example.com'); // already in groupA
    const emails = store.finalEmails();
    expect(emails.filter(e => e === 'alice@example.com')).toHaveLength(1);
  });

  it('all three sources combined — total count matches unique emails only', () => {
    const store = makeStore();
    store.addIndividual(alice);
    store.addGroup(groupA); // alice (dup) + bob
    store.addGroup(groupB); // bob (dup) + carol
    store.addAdHocEmail('new@example.com');
    store.addAdHocEmail('alice@example.com'); // dup
    // unique: alice, bob, carol, new → 4
    expect(store.finalEmails()).toHaveLength(4);
  });
});

// ─────────────────────────────────────────────────────────────────────────────

describe('InvitationStore — emailsWithSources (req #5)', () => {
  it('individual contact hint is the contact name', () => {
    const store = makeStore();
    store.addIndividual(alice);
    const src = store.emailsWithSources().find(e => e.email === 'alice@example.com');
    expect(src?.hint).toBe('Alice');
  });

  it('group member hint is the group name', () => {
    const store = makeStore();
    store.addGroup(groupA);
    const src = store.emailsWithSources().find(e => e.email === 'bob@example.com');
    expect(src?.hint).toBe('from group "Alpha"');
  });

  it('ad-hoc email hint is "ad-hoc"', () => {
    const store = makeStore();
    store.addAdHocEmail('x@example.com');
    const src = store.emailsWithSources().find(e => e.email === 'x@example.com');
    expect(src?.hint).toBe('ad-hoc');
  });

  it('when the same email appears in multiple sources the first source wins', () => {
    // alice added as individual first, then via group — individual hint wins
    const store = makeStore();
    store.addIndividual(alice);
    store.addGroup(groupA);
    const entries = store.emailsWithSources().filter(e => e.email === 'alice@example.com');
    expect(entries).toHaveLength(1);
    expect(entries[0].hint).toBe('Alice'); // individual, not group
  });

  it('excluded members do not appear in emailsWithSources', () => {
    const store = makeStore();
    store.addGroup(groupA);
    store.toggleGroupMember(groupA.id, bob.id);
    const emails = store.emailsWithSources().map(e => e.email);
    expect(emails).not.toContain('bob@example.com');
  });
});

// ─────────────────────────────────────────────────────────────────────────────

describe('InvitationStore — reset', () => {
  it('reset clears all selection state', () => {
    const store = makeStore();
    store.addIndividual(alice);
    store.addGroup(groupA);
    store.addAdHocEmail('x@example.com');

    store.reset();

    expect(store.finalEmails()).toEqual([]);
    expect(store.selectedIndividuals()).toEqual([]);
    expect(store.selectedGroups()).toEqual([]);
    expect(store.adHocEmails()).toEqual([]);
  });

  it('reset does not clear the address book data', () => {
    const store = makeStore();
    store.contacts.set([alice, bob]);
    store.groups.set([groupA]);

    store.reset();

    expect(store.contacts()).toHaveLength(2);
    expect(store.groups()).toHaveLength(1);
  });
});
