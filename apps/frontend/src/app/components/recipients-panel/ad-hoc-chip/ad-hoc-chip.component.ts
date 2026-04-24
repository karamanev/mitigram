import { ChangeDetectionStrategy, Component, Input, inject } from '@angular/core';
import { InvitationStore } from '../../../store/invitation.store';

@Component({
  selector: 'mitigram-ad-hoc-chip',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './ad-hoc-chip.component.html',
  styleUrl: './ad-hoc-chip.component.scss',
})
export class AdHocChipComponent {
  @Input({ required: true }) email!: string;
  protected readonly store = inject(InvitationStore);
}
