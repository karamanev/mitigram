import {
  ChangeDetectionStrategy,
  Component,
  Input,
  inject,
} from '@angular/core';
import type { Contact } from '@mitigram/shared';
import { InvitationStore } from '../../../store/invitation.store';

@Component({
  selector: 'app-individual-chip',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <span class="chip">
      <span class="chip__name">{{ contact.name }}</span>
      <span class="chip__email">{{ contact.email }}</span>
      <button
        class="chip__remove btn btn--icon"
        (click)="store.removeIndividual(contact.id)"
        aria-label="Remove {{ contact.name }}"
      >×</button>
    </span>
  `,
  styles: [`
    .chip {
      display: inline-flex;
      align-items: center;
      gap: 0.35rem;
      padding: 0.3rem 0.5rem;
      background: var(--unread);
      border: 1px solid var(--primary);
      border-radius: 16px;
      font-size: 0.8rem;
    }

    .chip__name {
      font-weight: 500;
      color: var(--headline);
    }

    .chip__email {
      color: var(--text);
      font-size: 0.75rem;
    }

    .chip__remove {
      padding: 0 0.2rem;
      font-size: 0.9rem;
      line-height: 1;
      color: var(--primary-dark);
    }
  `],
})
export class IndividualChipComponent {
  @Input({ required: true }) contact!: Contact;
  protected readonly store = inject(InvitationStore);
}
