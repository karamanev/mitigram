import { ChangeDetectionStrategy, Component, Input, inject, signal } from '@angular/core';
import { InvitationStore, type SelectedGroup } from '../../../store/invitation.store';

@Component({
  selector: 'mitigram-group-card',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './group-card.component.html',
  styleUrl: './group-card.component.scss',
})
export class GroupCardComponent {
  @Input({ required: true }) group!: SelectedGroup;
  protected readonly store = inject(InvitationStore);
  protected readonly expanded = signal(false);

  protected activeCount(): number {
    return this.group.members.filter(m => !this.store.isMemberExcluded(this.group.id, m.id)).length;
  }
}
