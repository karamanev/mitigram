import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { InvitationStore } from '../../../store/invitation.store';

@Component({
  selector: 'mitigram-individuals-tab',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './individuals-tab.component.html',
  styleUrl: './individuals-tab.component.scss',
})
export class IndividualsTabComponent {
  protected readonly store = inject(InvitationStore);
  protected readonly query = signal('');

  protected readonly filtered = computed(() => {
    const q = this.query().toLowerCase();
    if (!q) {
      return this.store.contacts();
    }

    return this.store
      .contacts()
      .filter(c => c.name.toLowerCase().includes(q) || c.email.toLowerCase().includes(q));
  });

  protected toggle(contactId: string): void {
    if (this.store.isIndividualSelected(contactId)) {
      this.store.removeIndividual(contactId);
    } else {
      const contact = this.store.contacts().find(c => c.id === contactId);
      if (contact) {
        this.store.addIndividual(contact);
      }
    }
  }

  protected asString(event: Event): string {
    return (event.target as HTMLInputElement).value;
  }
}
