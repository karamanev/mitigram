import {
  ChangeDetectionStrategy,
  Component,
  computed,
  inject,
  signal,
} from '@angular/core';
import { InvitationStore } from '../../../store/invitation.store';

@Component({
  selector: 'app-individuals-tab',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="tab">
      <input
        class="tab__search"
        type="search"
        placeholder="Search contacts…"
        [value]="query()"
        (input)="query.set(asString($event))"
        aria-label="Search contacts"
      />

      @if (filtered().length === 0) {
        <p class="tab__empty">No contacts found.</p>
      } @else {
        <ul class="tab__list">
          @for (contact of filtered(); track contact.id) {
            <li
              class="tab__item"
              [class.tab__item--selected]="store.isIndividualSelected(contact.id)"
              (click)="toggle(contact.id)"
            >
              <span class="tab__avatar">{{ contact.name[0] }}</span>
              <span class="tab__info">
                <span class="tab__name">{{ contact.name }}</span>
                <span class="tab__email">{{ contact.email }}</span>
              </span>
              @if (store.isIndividualSelected(contact.id)) {
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
      padding: 0.5rem 0.5rem;
      border-radius: 4px;
      cursor: pointer;
      user-select: none;

      &:hover { background: var(--bg-grey); }

      &--selected {
        background: var(--unread);

        &:hover { background: var(--unread); }
      }
    }

    .tab__avatar {
      width: 28px;
      height: 28px;
      border-radius: 50%;
      background: var(--primary);
      color: #fff;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 0.8rem;
      font-weight: 600;
      flex-shrink: 0;
    }

    .tab__info {
      flex: 1;
      display: flex;
      flex-direction: column;
      min-width: 0;
    }

    .tab__name {
      font-size: 0.8rem;
      font-weight: 500;
      color: var(--headline);
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
    }

    .tab__email {
      font-size: 0.72rem;
      color: var(--text);
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
    }

    .tab__check {
      color: var(--primary);
      font-weight: 700;
      font-size: 0.875rem;
      flex-shrink: 0;
    }
  `],
})
export class IndividualsTabComponent {
  protected readonly store = inject(InvitationStore);
  protected readonly query = signal('');

  protected readonly filtered = computed(() => {
    const q = this.query().toLowerCase();
    if (!q) return this.store.contacts();
    return this.store.contacts().filter(
      c => c.name.toLowerCase().includes(q) || c.email.toLowerCase().includes(q),
    );
  });

  protected toggle(contactId: string): void {
    if (this.store.isIndividualSelected(contactId)) {
      this.store.removeIndividual(contactId);
    } else {
      const contact = this.store.contacts().find(c => c.id === contactId);
      if (contact) this.store.addIndividual(contact);
    }
  }

  protected asString(event: Event): string {
    return (event.target as HTMLInputElement).value;
  }
}
