import { ChangeDetectionStrategy, Component, signal } from '@angular/core';
import { IndividualsTabComponent } from './individuals-tab/individuals-tab.component';
import { GroupsTabComponent } from './groups-tab/groups-tab.component';

type Tab = 'individuals' | 'groups';

@Component({
  selector: 'mitigram-address-book-panel',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [IndividualsTabComponent, GroupsTabComponent],
  templateUrl: './address-book-panel.component.html',
  styleUrl: './address-book-panel.component.scss',
})
export class AddressBookPanelComponent {
  protected readonly activeTab = signal<Tab>('individuals');
}
