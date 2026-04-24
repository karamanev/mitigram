import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { InvitationStore } from '../../store/invitation.store';
import { IndividualChipComponent } from './individual-chip/individual-chip.component';
import { AdHocChipComponent } from './ad-hoc-chip/ad-hoc-chip.component';
import { GroupCardComponent } from './group-card/group-card.component';

@Component({
  selector: 'mitigram-recipients-panel',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [IndividualChipComponent, AdHocChipComponent, GroupCardComponent],
  templateUrl: './recipients-panel.component.html',
  styleUrl: './recipients-panel.component.scss',
})
export class RecipientsPanelComponent {
  protected readonly store = inject(InvitationStore);

  protected isEmpty(): boolean {
    return (
      this.store.selectedIndividuals().length === 0 &&
      this.store.selectedGroups().length === 0 &&
      this.store.adHocEmails().length === 0
    );
  }
}
