import { Injectable, computed, signal } from '@angular/core';
import type { Contact, Group, GroupMember } from '@mitigram/shared';

export interface SelectedGroup {
  id: string;
  name: string;
  members: GroupMember[];
  excludedMemberIds: Set<string>;
}

export interface EmailSource {
  email: string;
  /** Human-readable hint shown in the review panel */
  hint: string;
}

@Injectable({ providedIn: 'root' })
export class InvitationStore {
  contacts = signal<Contact[]>([]);
  groups = signal<Group[]>([]);

  selectedIndividuals = signal<Contact[]>([]);
  selectedGroups = signal<SelectedGroup[]>([]);
  adHocEmails = signal<string[]>([]);

  finalEmails = computed<string[]>(() => {
    const set = new Set<string>();

    for (const contact of this.selectedIndividuals()) {
      set.add(contact.email);
    }

    for (const group of this.selectedGroups()) {
      for (const member of group.members) {
        if (!group.excludedMemberIds.has(member.id)) {
          set.add(member.email);
        }
      }
    }

    for (const email of this.adHocEmails()) {
      set.add(email);
    }

    return [...set];
  });

  crossSourceDuplicates = computed<string[]>(() => {
    const counts = new Map<string, number>();

    for (const contact of this.selectedIndividuals()) {
      counts.set(contact.email, (counts.get(contact.email) ?? 0) + 1);
    }
    for (const group of this.selectedGroups()) {
      for (const member of group.members) {
        if (!group.excludedMemberIds.has(member.id)) {
          counts.set(member.email, (counts.get(member.email) ?? 0) + 1);
        }
      }
    }
    for (const email of this.adHocEmails()) {
      counts.set(email, (counts.get(email) ?? 0) + 1);
    }

    return [...counts.entries()].filter(([, n]) => n > 1).map(([email]) => email);
  });

  emailsWithSources = computed<EmailSource[]>(() => {
    const result: EmailSource[] = [];
    const seen = new Set<string>();

    for (const contact of this.selectedIndividuals()) {
      if (!seen.has(contact.email)) {
        result.push({ email: contact.email, hint: contact.name });
        seen.add(contact.email);
      }
    }

    for (const group of this.selectedGroups()) {
      for (const member of group.members) {
        if (!group.excludedMemberIds.has(member.id) && !seen.has(member.email)) {
          result.push({ email: member.email, hint: `from group "${group.name}"` });
          seen.add(member.email);
        }
      }
    }

    for (const email of this.adHocEmails()) {
      if (!seen.has(email)) {
        result.push({ email, hint: 'ad-hoc' });
        seen.add(email);
      }
    }

    return result;
  });

  addIndividual(contact: Contact): void {
    if (this.selectedIndividuals().some(item => item.id === contact.id)) {
      return;
    }

    this.selectedIndividuals.update(list => [...list, contact]);
  }

  removeIndividual(contactId: string): void {
    this.selectedIndividuals.update(list => list.filter(contact => contact.id !== contactId));
  }

  isIndividualSelected(contactId: string): boolean {
    return this.selectedIndividuals().some(contact => contact.id === contactId);
  }

  addGroup(group: Group): void {
    if (this.selectedGroups().some(item => item.id === group.id)) {
      return;
    }

    this.selectedGroups.update(list => [
      ...list,
      { ...group, excludedMemberIds: new Set<string>() },
    ]);
  }

  removeGroup(groupId: string): void {
    this.selectedGroups.update(list => list.filter(group => group.id !== groupId));
  }

  isGroupSelected(groupId: string): boolean {
    return this.selectedGroups().some(group => group.id === groupId);
  }

  toggleGroupMember(groupId: string, memberId: string): void {
    this.selectedGroups.update(list =>
      list.map(group => {
        if (group.id !== groupId) {
          return group;
        }

        const excluded = new Set(group.excludedMemberIds);
        if (excluded.has(memberId)) {
          excluded.delete(memberId);
        } else {
          excluded.add(memberId);
        }

        return { ...group, excludedMemberIds: excluded };
      }),
    );
  }

  isMemberExcluded(groupId: string, memberId: string): boolean {
    return (
      this.selectedGroups()
        .find(group => group.id === groupId)
        ?.excludedMemberIds.has(memberId) ?? false
    );
  }

  addAdHocEmail(email: string): void {
    const normalizedEmail = email.toLowerCase().trim();
    if (!normalizedEmail || this.adHocEmails().includes(normalizedEmail)) {
      return;
    }

    this.adHocEmails.update(list => [...list, normalizedEmail]);
  }

  removeAdHocEmail(email: string): void {
    this.adHocEmails.update(list => list.filter(item => item !== email));
  }

  reset(): void {
    this.selectedIndividuals.set([]);
    this.selectedGroups.set([]);
    this.adHocEmails.set([]);
  }
}
