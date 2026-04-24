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
type ErrorWithPayload = {
  error?: {
    message?: string;
    alreadyInvitedEmails?: string[];
  };
};

@Component({
  selector: 'mitigram-review-and-send',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './review-and-send.component.html',
  styleUrl: './review-and-send.component.scss',
})
export class ReviewAndSendComponent {
  @Input({ required: true }) instrumentId!: string;
  @Output() readonly back = new EventEmitter<void>();
  @Output() readonly sendStateChange = new EventEmitter<boolean>();
  @Output() readonly sent = new EventEmitter<void>();

  protected readonly store = inject(InvitationStore);
  private readonly api = inject(ApiService);
  protected readonly sendState = signal<SendState>('idle');
  protected readonly errorMessage = signal<string | null>(null);

  protected send(): void {
    this.sendState.set('sending');
    this.errorMessage.set(null);
    this.sendStateChange.emit(false);
    this.api.createInvitation(this.instrumentId, this.store.finalEmails()).subscribe({
      next: () => {
        this.sendState.set('success');
        this.sendStateChange.emit(true);
      },
      error: (error: ErrorWithPayload) => {
        this.sendState.set('error');
        this.errorMessage.set(
          this.getDuplicateToastMessage(error) ??
            error.error?.message ??
            'Failed to send. Please try again.',
        );
        this.sendStateChange.emit(false);
      },
    });
  }

  private getDuplicateToastMessage(error: ErrorWithPayload): string | null {
    const duplicates = error.error?.alreadyInvitedEmails;
    if (!duplicates?.length) {
      return null;
    }

    const labels = duplicates.map(email => this.getRecipientLabel(email));

    return labels.length === 1
      ? `Contact ${labels[0]} is already invited.`
      : `Contacts ${labels.join(', ')} are already invited.`;
  }

  private getRecipientLabel(email: string): string {
    const match = this.store.emailsWithSources().find(item => item.email === email);
    const hint = match?.hint;

    if (hint && hint !== 'ad-hoc' && !hint.startsWith('from group "')) {
      return hint;
    }

    return email;
  }
}
