import {
  ChangeDetectionStrategy,
  Component,
  Input,
  inject,
} from '@angular/core';
import { InvitationStore } from '../../../store/invitation.store';

@Component({
  selector: 'app-ad-hoc-chip',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <span class="chip">
      <span class="chip__label">{{ email }}</span>
      <button
        class="chip__remove btn btn--icon"
        (click)="store.removeAdHocEmail(email)"
        aria-label="Remove {{ email }}"
      >×</button>
    </span>
  `,
  styles: [`
    /* Dashed border distinguishes ad-hoc from address-book contacts */
    .chip {
      display: inline-flex;
      align-items: center;
      gap: 0.35rem;
      padding: 0.3rem 0.5rem;
      background: #fff;
      border: 1px dashed var(--primary);
      border-radius: 16px;
      font-size: 0.8rem;
    }

    .chip__label {
      color: var(--text);
    }

    .chip__remove {
      padding: 0 0.2rem;
      font-size: 0.9rem;
      line-height: 1;
      color: var(--text);
    }
  `],
})
export class AdHocChipComponent {
  @Input({ required: true }) email!: string;
  protected readonly store = inject(InvitationStore);
}
