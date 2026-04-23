import {
  ChangeDetectionStrategy,
  Component,
  EventEmitter,
  Input,
  Output,
  inject,
  signal,
} from '@angular/core';
import { InvitationStore } from '../../store/invitation.store';
import { ApiService } from '../../services/api.service';

type SendState = 'idle' | 'sending' | 'success' | 'error';

@Component({
  selector: 'app-review-and-send',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="review">
      <div class="review__header">
        <button class="btn btn--icon review__back" (click)="back.emit()">
          ← Back
        </button>
        <h3 class="review__title">Review invitation</h3>
      </div>

      @if (sendState() === 'success') {
        <div class="review__success">
          <span class="review__success-icon">✓</span>
          <p>Invitations sent successfully!</p>
          <button class="btn btn--primary" (click)="sent.emit()">Close</button>
        </div>
      } @else {
        <p class="review__subtitle">
          {{ store.finalEmails().length }} unique email{{ store.finalEmails().length !== 1 ? 's' : '' }} will be invited:
        </p>

        <ul class="review__list">
          @for (item of store.emailsWithSources(); track item.email) {
            <li class="review__item">
              <span class="review__email">{{ item.email }}</span>
              <span class="review__hint">{{ item.hint }}</span>
            </li>
          }
        </ul>

        @if (sendState() === 'error') {
          <p class="review__error">Failed to send. Please try again.</p>
        }

        <div class="review__actions">
          <button
            class="btn btn--ghost"
            [disabled]="sendState() === 'sending'"
            (click)="back.emit()"
          >Back</button>
          <button
            class="btn btn--primary"
            [disabled]="sendState() === 'sending'"
            (click)="send()"
          >
            {{ sendState() === 'sending' ? 'Sending…' : 'Confirm & send' }}
          </button>
        </div>
      }
    </div>
  `,
  styles: [`
    .review {
      display: flex;
      flex-direction: column;
      padding: 1.25rem 1.5rem;
      flex: 1;
      overflow: hidden;
    }

    .review__header {
      display: flex;
      align-items: center;
      gap: 0.75rem;
      margin-bottom: 0.75rem;
    }

    .review__back {
      font-size: 0.875rem;
      color: var(--primary);
    }

    .review__title {
      margin: 0;
      font-size: 1rem;
      color: var(--headline);
      font-weight: 600;
    }

    .review__subtitle {
      margin: 0 0 0.75rem;
      font-size: 0.875rem;
      color: var(--text);
    }

    .review__list {
      list-style: none;
      margin: 0 0 1rem;
      padding: 0;
      overflow-y: auto;
      flex: 1;
      border: 1px solid var(--line);
      border-radius: 4px;
    }

    .review__item {
      display: flex;
      align-items: baseline;
      justify-content: space-between;
      gap: 1rem;
      padding: 0.5rem 0.75rem;
      border-bottom: 1px solid var(--bg-grey);

      &:last-child { border-bottom: none; }
    }

    .review__email {
      font-size: 0.875rem;
      color: var(--headline);
      font-weight: 500;
    }

    .review__hint {
      font-size: 0.75rem;
      color: var(--text);
      white-space: nowrap;
    }

    .review__error {
      color: var(--notification);
      font-size: 0.875rem;
      margin: 0 0 0.75rem;
    }

    .review__actions {
      display: flex;
      justify-content: flex-end;
      gap: 0.75rem;
      padding-top: 0.75rem;
      border-top: 1px solid var(--line);
    }

    .review__success {
      flex: 1;
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      gap: 1rem;
      text-align: center;

      p {
        margin: 0;
        font-size: 1rem;
        color: var(--headline);
        font-weight: 500;
      }
    }

    .review__success-icon {
      font-size: 3rem;
      color: var(--primary);
    }
  `],
})
export class ReviewAndSendComponent {
  @Input({ required: true }) instrumentId!: string;
  @Output() readonly back = new EventEmitter<void>();
  @Output() readonly sent = new EventEmitter<void>();

  protected readonly store = inject(InvitationStore);
  private readonly api = inject(ApiService);
  protected readonly sendState = signal<SendState>('idle');

  protected send(): void {
    this.sendState.set('sending');
    this.api.createInvitation(this.instrumentId, this.store.finalEmails()).subscribe({
      next: () => this.sendState.set('success'),
      error: () => this.sendState.set('error'),
    });
  }
}
