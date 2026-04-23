import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { InvitationStore } from '../../store/invitation.store';
import { IndividualChipComponent } from './individual-chip/individual-chip.component';
import { AdHocChipComponent } from './ad-hoc-chip/ad-hoc-chip.component';
import { GroupCardComponent } from './group-card/group-card.component';

@Component({
  selector: 'app-recipients-panel',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [IndividualChipComponent, AdHocChipComponent, GroupCardComponent],
  template: `
    <div class="panel">
      <h3 class="panel__title">Recipients</h3>

      @if (isEmpty()) {
        <div class="panel__empty">
          <p>No recipients yet.</p>
          <p>Pick contacts or groups from the address book, or type an email above.</p>
        </div>
      } @else {
        <div class="panel__content">

          <!-- Individual contacts (req #1) -->
          @if (store.selectedIndividuals().length > 0) {
            <div class="panel__section">
              <span class="panel__section-label">Individuals</span>
              <div class="panel__chips">
                @for (contact of store.selectedIndividuals(); track contact.id) {
                  <app-individual-chip [contact]="contact" />
                }
              </div>
            </div>
          }

          <!-- Ad-hoc emails (req #4) -->
          @if (store.adHocEmails().length > 0) {
            <div class="panel__section">
              <span class="panel__section-label">Ad-hoc</span>
              <div class="panel__chips">
                @for (email of store.adHocEmails(); track email) {
                  <app-ad-hoc-chip [email]="email" />
                }
              </div>
            </div>
          }

          <!-- Groups with per-member exclusion (req #2 + #3) -->
          @if (store.selectedGroups().length > 0) {
            <div class="panel__section">
              <span class="panel__section-label">Groups</span>
              <div class="panel__groups">
                @for (group of store.selectedGroups(); track group.id) {
                  <app-group-card [group]="group" />
                }
              </div>
            </div>
          }
        </div>
      }
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
      flex-shrink: 0;
    }

    .panel__empty {
      flex: 1;
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      text-align: center;
      color: var(--text);
      padding: 1rem;

      p { margin: 0.25rem 0; font-size: 0.875rem; }
      p:first-child { font-weight: 500; color: var(--headline); }
    }

    .panel__content {
      flex: 1;
      overflow-y: auto;
      display: flex;
      flex-direction: column;
      gap: 1rem;
    }

    .panel__section-label {
      display: block;
      font-size: 0.7rem;
      font-weight: 600;
      text-transform: uppercase;
      letter-spacing: 0.05em;
      color: var(--text);
      margin-bottom: 0.4rem;
    }

    .panel__chips {
      display: flex;
      flex-wrap: wrap;
      gap: 0.4rem;
    }

    .panel__groups {
      display: flex;
      flex-direction: column;
      gap: 0.4rem;
    }
  `],
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
