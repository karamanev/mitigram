import {
  ChangeDetectionStrategy,
  Component,
  computed,
  inject,
  signal,
} from '@angular/core';
import { InvitationStore } from '../../../store/invitation.store';

@Component({
  selector: 'app-groups-tab',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="tab">
      <input
        class="tab__search"
        type="search"
        placeholder="Search groups…"
        [value]="query()"
        (input)="query.set(asString($event))"
        aria-label="Search groups"
      />

      @if (filtered().length === 0) {
        <p class="tab__empty">No groups found.</p>
      } @else {
        <ul class="tab__list">
          @for (group of filtered(); track group.id) {
            <li
              class="tab__item"
              [class.tab__item--selected]="store.isGroupSelected(group.id)"
              (click)="toggle(group.id)"
            >
              <span class="tab__icon">⊞</span>
              <span class="tab__info">
                <span class="tab__name">{{ group.name }}</span>
                <span class="tab__meta">{{ group.members.length }} members</span>
              </span>
              @if (store.isGroupSelected(group.id)) {
                <span class="tab__check" aria-label="Selected">✓</span>
              }
            </li>
          }
        </ul>
      }
    </div>
  `,
  styles: [`
    .tab { display: flex; flex-direction: column; height: 100%; }

    .tab__search {
      width: 100%;
      padding: 0.5rem 0.75rem;
      border: 1px solid var(--line);
      border-radius: 4px;
      font-size: 0.875rem;
      color: var(--text);
      outline: none;
      margin-bottom: 0.5rem;
      flex-shrink: 0;

      &:focus { border-color: var(--primary); }
    }

    .tab__empty {
      text-align: center;
      color: var(--text);
      padding: 1.5rem 0;
      font-size: 0.875rem;
    }

    .tab__list {
      list-style: none;
      margin: 0;
      padding: 0;
      overflow-y: auto;
      flex: 1;
    }

    .tab__item {
      display: flex;
      align-items: center;
      gap: 0.6rem;
      padding: 0.5rem;
      border-radius: 4px;
      cursor: pointer;
      user-select: none;

      &:hover { background: var(--bg-grey); }

      &--selected {
        background: var(--unread);
        &:hover { background: var(--unread); }
      }
    }

    .tab__icon {
      font-size: 1rem;
      color: var(--primary);
      flex-shrink: 0;
    }

    .tab__info {
      flex: 1;
      display: flex;
      flex-direction: column;
    }

    .tab__name {
      font-size: 0.8rem;
      font-weight: 500;
      color: var(--headline);
    }

    .tab__meta {
      font-size: 0.72rem;
      color: var(--text);
    }

    .tab__check {
      color: var(--primary);
      font-weight: 700;
      font-size: 0.875rem;
      flex-shrink: 0;
    }
  `],
})
export class GroupsTabComponent {
  protected readonly store = inject(InvitationStore);
  protected readonly query = signal('');

  protected readonly filtered = computed(() => {
    const q = this.query().toLowerCase();
    if (!q) return this.store.groups();
    return this.store.groups().filter(g => g.name.toLowerCase().includes(q));
  });

  protected toggle(groupId: string): void {
    if (this.store.isGroupSelected(groupId)) {
      this.store.removeGroup(groupId);
    } else {
      const group = this.store.groups().find(g => g.id === groupId);
      if (group) this.store.addGroup(group);
    }
  }

  protected asString(event: Event): string {
    return (event.target as HTMLInputElement).value;
  }
}
