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
  // ── Address-book data (populated by the dialog on open) ──────────────────
  contacts = signal<Contact[]>([]);
  groups    = signal<Group[]>([]);

  // ── Selection state ───────────────────────────────────────────────────────
  selectedIndividuals = signal<Contact[]>([]);
  selectedGroups      = signal<SelectedGroup[]>([]);
  adHocEmails         = signal<string[]>([]);

  // ── Derived ───────────────────────────────────────────────────────────────

  /** Flat, deduplicated email list — what gets POSTed to the API */
  finalEmails = computed<string[]>(() => {
    const set = new Set<string>();
    for (const c of this.selectedIndividuals()) set.add(c.email);
    for (const g of this.selectedGroups()) {
      for (const m of g.members) {
        if (!g.excludedMemberIds.has(m.id)) set.add(m.email);
      }
    }
    for (const e of this.adHocEmails()) set.add(e);
    return [...set];
  });

  /** Same emails with a source hint for the review panel (req #5) */
  emailsWithSources = computed<EmailSource[]>(() => {
    const result: EmailSource[] = [];
    const seen = new Set<string>();

    for (const c of this.selectedIndividuals()) {
      if (!seen.has(c.email)) {
        result.push({ email: c.email, hint: c.name });
        seen.add(c.email);
      }
    }
    for (const g of this.selectedGroups()) {
      for (const m of g.members) {
        if (!g.excludedMemberIds.has(m.id) && !seen.has(m.email)) {
          result.push({ email: m.email, hint: `from group "${g.name}"` });
          seen.add(m.email);
        }
      }
    }
    for (const e of this.adHocEmails()) {
      if (!seen.has(e)) {
        result.push({ email: e, hint: 'ad-hoc' });
        seen.add(e);
      }
    }
    return result;
  });

  // ── Individual actions ────────────────────────────────────────────────────

  addIndividual(contact: Contact): void {
    if (this.selectedIndividuals().some(c => c.id === contact.id)) return;
    this.selectedIndividuals.update(l => [...l, contact]);
  }

  removeIndividual(contactId: string): void {
    this.selectedIndividuals.update(l => l.filter(c => c.id !== contactId));
  }

  isIndividualSelected(contactId: string): boolean {
    return this.selectedIndividuals().some(c => c.id === contactId);
  }

  // ── Group actions ─────────────────────────────────────────────────────────

  addGroup(group: Group): void {
    if (this.selectedGroups().some(g => g.id === group.id)) return;
    this.selectedGroups.update(l => [
      ...l,
      { ...group, excludedMemberIds: new Set<string>() },
    ]);
  }

  removeGroup(groupId: string): void {
    this.selectedGroups.update(l => l.filter(g => g.id !== groupId));
  }

  isGroupSelected(groupId: string): boolean {
    return this.selectedGroups().some(g => g.id === groupId);
  }

  /** Toggle whether a member is excluded from a specific group's invitation */
  toggleGroupMember(groupId: string, memberId: string): void {
    this.selectedGroups.update(l =>
      l.map(g => {
        if (g.id !== groupId) return g;
        const excluded = new Set(g.excludedMemberIds);
        if (excluded.has(memberId)) excluded.delete(memberId);
        else excluded.add(memberId);
        return { ...g, excludedMemberIds: excluded };
      }),
    );
  }

  isMemberExcluded(groupId: string, memberId: string): boolean {
    return this.selectedGroups().find(g => g.id === groupId)
      ?.excludedMemberIds.has(memberId) ?? false;
  }

  // ── Ad-hoc email actions ──────────────────────────────────────────────────

  addAdHocEmail(email: string): void {
    const norm = email.toLowerCase().trim();
    if (!norm || this.adHocEmails().includes(norm)) return;
    this.adHocEmails.update(l => [...l, norm]);
  }

  removeAdHocEmail(email: string): void {
    this.adHocEmails.update(l => l.filter(e => e !== email));
  }

  // ── Lifecycle ─────────────────────────────────────────────────────────────

  reset(): void {
    this.selectedIndividuals.set([]);
    this.selectedGroups.set([]);
    this.adHocEmails.set([]);
  }
}
