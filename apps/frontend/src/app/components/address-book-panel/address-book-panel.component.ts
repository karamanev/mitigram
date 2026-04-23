import { ChangeDetectionStrategy, Component, signal } from '@angular/core';
import { IndividualsTabComponent } from './individuals-tab/individuals-tab.component';
import { GroupsTabComponent } from './groups-tab/groups-tab.component';

type Tab = 'individuals' | 'groups';

@Component({
  selector: 'app-address-book-panel',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [IndividualsTabComponent, GroupsTabComponent],
  template: `
    <div class="panel">
      <h3 class="panel__title">Address Book</h3>
      <div class="panel__tabs" role="tablist">
        <button
          class="panel__tab"
          [class.panel__tab--active]="activeTab() === 'individuals'"
          role="tab"
          [attr.aria-selected]="activeTab() === 'individuals'"
          (click)="activeTab.set('individuals')"
        >Individuals</button>
        <button
          class="panel__tab"
          [class.panel__tab--active]="activeTab() === 'groups'"
          role="tab"
          [attr.aria-selected]="activeTab() === 'groups'"
          (click)="activeTab.set('groups')"
        >Groups</button>
      </div>

      <div class="panel__body">
        @if (activeTab() === 'individuals') {
          <app-individuals-tab />
        } @else {
          <app-groups-tab />
        }
      </div>
    </div>
  `,
  styles: [`
    :host { display: flex; flex-direction: column; height: 100%; }

    .panel {
      display: flex;
      flex-direction: column;
      height: 100%;
    }

    .panel__title {
      margin: 0 0 0.75rem;
      font-size: 0.8rem;
      font-weight: 600;
      text-transform: uppercase;
      letter-spacing: 0.05em;
      color: var(--text);
    }

    .panel__tabs {
      display: flex;
      border-bottom: 2px solid var(--line);
      margin-bottom: 0.75rem;
      flex-shrink: 0;
    }

    .panel__tab {
      padding: 0.4rem 0.875rem;
      background: none;
      border: none;
      border-bottom: 2px solid transparent;
      margin-bottom: -2px;
      cursor: pointer;
      font-size: 0.875rem;
      color: var(--text);
      transition: color 0.15s, border-color 0.15s;

      &:hover { color: var(--headline); }

      &--active {
        color: var(--primary);
        border-bottom-color: var(--primary);
        font-weight: 600;
      }
    }

    .panel__body {
      flex: 1;
      overflow: hidden;
      display: flex;
      flex-direction: column;
    }
  `],
})
export class AddressBookPanelComponent {
  protected readonly activeTab = signal<Tab>('individuals');
}
