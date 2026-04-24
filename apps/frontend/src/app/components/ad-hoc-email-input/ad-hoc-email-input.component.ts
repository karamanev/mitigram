import {
  type AfterViewInit,
  ChangeDetectionStrategy,
  Component,
  type ElementRef,
  ViewChild,
  inject,
  signal,
} from '@angular/core';
import { InvitationStore } from '../../store/invitation.store';
import { isValidEmail, normalizeEmail, parseEmailBatch } from './email-validation';

type FeedbackTone = 'error' | 'info' | 'success';

type ValidationFeedback = {
  tone: FeedbackTone;
  message: string;
};

@Component({
  selector: 'mitigram-ad-hoc-email-input',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './ad-hoc-email-input.component.html',
  styleUrl: './ad-hoc-email-input.component.scss',
})
export class AdHocEmailInputComponent implements AfterViewInit {
  @ViewChild('inputEl') private inputEl!: ElementRef<HTMLInputElement>;

  protected readonly store = inject(InvitationStore);
  protected readonly feedback = signal<ValidationFeedback | null>(null);

  ngAfterViewInit(): void {
    this.inputEl.nativeElement.focus();
  }

  protected onInput(): void {
    this.feedback.set(null);
  }

  protected onKeydown(event: KeyboardEvent, input: HTMLInputElement): void {
    if (event.key === 'Enter' || event.key === ',' || event.key === ';' || event.key === 'Tab') {
      event.preventDefault();
      this.tryAdd(input.value.replace(/[,;]$/, '').trim(), input);
    }
  }

  protected onPaste(event: ClipboardEvent, input: HTMLInputElement): void {
    const text = event.clipboardData?.getData('text') ?? '';
    const parsed = parseEmailBatch(text);
    if (parsed.valid.length === 0 && parsed.invalid.length === 0) {
      return;
    }

    event.preventDefault();
    input.value = '';

    let addedCount = 0;
    let alreadyIncludedCount = 0;

    for (const email of parsed.valid) {
      if (this.hasEmailAlreadyIncluded(email)) {
        alreadyIncludedCount += 1;
        continue;
      }

      this.store.addAdHocEmail(email);
      addedCount += 1;
    }

    const fragments: string[] = [];
    if (addedCount > 0) {
      fragments.push(`Added ${addedCount} email${addedCount === 1 ? '' : 's'}.`);
    }
    if (alreadyIncludedCount > 0) {
      fragments.push(
        `${alreadyIncludedCount} already included recipient${alreadyIncludedCount === 1 ? ' was' : 's were'} skipped.`,
      );
    }
    if (parsed.invalid.length > 0) {
      fragments.push(
        `${parsed.invalid.length} invalid entr${parsed.invalid.length === 1 ? 'y' : 'ies'}: ${parsed.invalid.join(', ')}.`,
      );
    }

    if (parsed.invalid.length > 0) {
      this.feedback.set({
        tone: 'error',
        message: fragments.join(' '),
      });
    } else if (alreadyIncludedCount > 0 && addedCount === 0) {
      this.feedback.set({
        tone: 'info',
        message: fragments.join(' '),
      });
    } else if (fragments.length > 0) {
      this.feedback.set({
        tone: 'success',
        message: fragments.join(' '),
      });
    } else {
      this.feedback.set(null);
    }
  }

  protected onBlur(input: HTMLInputElement): void {
    const val = input.value.trim();
    if (val) {
      this.tryAdd(val, input);
    }
  }

  private tryAdd(value: string, input: HTMLInputElement): void {
    const email = normalizeEmail(value);
    if (!email) {
      return;
    }

    if (!isValidEmail(email)) {
      this.feedback.set({
        tone: 'error',
        message: 'Enter a valid email address such as name@company.com.',
      });
      return;
    }

    const existingHint = this.getExistingEmailHint(email);
    if (existingHint) {
      this.feedback.set({
        tone: 'info',
        message:
          existingHint === 'ad-hoc'
            ? `${email} is already in the recipient list.`
            : `${email} is already included via ${existingHint}.`,
      });
      return;
    }

    this.store.addAdHocEmail(email);
    input.value = '';
    this.feedback.set({
      tone: 'success',
      message: `${email} added to recipients.`,
    });
  }

  private hasEmailAlreadyIncluded(email: string): boolean {
    return this.getExistingEmailHint(email) !== null;
  }

  private getExistingEmailHint(email: string): string | null {
    const match = this.store.emailsWithSources().find(item => item.email === email);
    return match?.hint ?? null;
  }
}
