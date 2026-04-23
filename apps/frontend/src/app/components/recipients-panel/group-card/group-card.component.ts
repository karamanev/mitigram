import {
  ChangeDetectionStrategy,
  Component,
  Input,
  inject,
  signal,
} from '@angular/core';
import { InvitationStore, type SelectedGroup } from '../../../store/invitation.store';

@Component({
  selector: 'app-group-card',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="card">
      <div class="card__header">
        <button
          class="card__toggle"
          (click)="expanded.set(!expanded())"
          [attr.aria-expanded]="expanded()"
        >
          <span class="card__arrow">{{ expanded() ? '▾' : '▸' }}</span>
          <span class="card__name">{{ group.name }}</span>
          <span class="card__count">
            {{ activeCount() }}/{{ group.members.length }}
          </span>
        </button>
        <button
          class="btn btn--icon card__remove"
          (click)="store.removeGroup(group.id)"
          aria-label="Remove group {{ group.name }}"
        >×</button>
      </div>

      @if (expanded()) {
        <ul class="card__members">
          @for (member of group.members; track member.id) {
            <li class="card__member">
              <label class="card__member-label">
                <input
                  type="checkbox"
                  class="card__checkbox"
                  [checked]="!store.isMemberExcluded(group.id, member.id)"
                  (change)="store.toggleGroupMember(group.id, member.id)"
                />
                <span
                  class="card__member-name"
                  [class.card__member-name--excluded]="store.isMemberExcluded(group.id, member.id)"
                >{{ member.name }}</span>
                <span class="card__member-email">{{ member.email }}</span>
              </label>
            </li>
          }
        </ul>
      }
    </div>
  `,
  styles: [`
    .card {
      border: 1px solid var(--line);
      border-radius: 6px;
      overflow: hidden;
      background: #fff;
    }

    .card__header {
      display: flex;
      align-items: center;
      padding: 0.5rem 0.5rem 0.5rem 0.75rem;
      gap: 0.25rem;
    }

    .card__toggle {
      flex: 1;
      display: flex;
      align-items: center;
      gap: 0.5rem;
      background: none;
      border: none;
      cursor: pointer;
      padding: 0;
      text-align: left;
      color: inherit;
    }

    .card__arrow {
      font-size: 0.7rem;
      color: var(--text);
      width: 12px;
    }

    .card__name {
      font-weight: 500;
      color: var(--headline);
      font-size: 0.875rem;
    }

    .card__count {
      font-size: 0.75rem;
      color: var(--text);
      background: var(--bg-grey);
      padding: 0.1rem 0.4rem;
      border-radius: 10px;
    }

    .card__remove {
      flex-shrink: 0;
      font-size: 1rem;
      color: var(--text);
    }

    .card__members {
      list-style: none;
      margin: 0;
      padding: 0;
      border-top: 1px solid var(--line);
    }

    .card__member {
      border-bottom: 1px solid var(--bg-grey);

      &:last-child { border-bottom: none; }
    }

    .card__member-label {
      display: flex;
      align-items: center;
      gap: 0.5rem;
      padding: 0.4rem 0.75rem;
      cursor: pointer;

      &:hover { background: var(--bg-grey); }
    }

    .card__checkbox {
      accent-color: var(--primary);
      flex-shrink: 0;
    }

    .card__member-name {
      font-size: 0.8rem;
      color: var(--headline);
      flex: 1;

      &--excluded {
        color: var(--line);
        text-decoration: line-through;
      }
    }

    .card__member-email {
      font-size: 0.75rem;
      color: var(--text);
    }
  `],
})
export class GroupCardComponent {
  @Input({ required: true }) group!: SelectedGroup;
  protected readonly store = inject(InvitationStore);
  protected readonly expanded = signal(false);

  protected activeCount(): number {
    return this.group.members.filter(
      m => !this.store.isMemberExcluded(this.group.id, m.id),
    ).length;
  }
}
