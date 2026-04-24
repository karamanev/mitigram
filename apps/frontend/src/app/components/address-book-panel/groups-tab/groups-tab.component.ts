import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { InvitationStore } from '../../../store/invitation.store';

@Component({
  selector: 'mitigram-groups-tab',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './groups-tab.component.html',
  styleUrl: './groups-tab.component.scss',
})
export class GroupsTabComponent {
  protected readonly store = inject(InvitationStore);
  protected readonly query = signal('');

  protected readonly filtered = computed(() => {
    const q = this.query().toLowerCase();
    if (!q) {
      return this.store.groups();
    }

    return this.store.groups().filter(g => g.name.toLowerCase().includes(q));
  });

  protected toggle(groupId: string): void {
    if (this.store.isGroupSelected(groupId)) {
      this.store.removeGroup(groupId);
    } else {
      const group = this.store.groups().find(g => g.id === groupId);
      if (group) {
        this.store.addGroup(group);
      }
    }
  }

  protected asString(event: Event): string {
    return (event.target as HTMLInputElement).value;
  }
}
