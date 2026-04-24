import { ChangeDetectionStrategy, Component, Input, inject } from '@angular/core';
import type { Contact } from '@mitigram/shared';
import { InvitationStore } from '../../../store/invitation.store';

@Component({
  selector: 'mitigram-individual-chip',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './individual-chip.component.html',
  styleUrl: './individual-chip.component.scss',
})
export class IndividualChipComponent {
  @Input({ required: true }) contact!: Contact;
  protected readonly store = inject(InvitationStore);
}
