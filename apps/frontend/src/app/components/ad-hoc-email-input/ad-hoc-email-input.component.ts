import { AfterViewInit, ChangeDetectionStrategy, Component, ElementRef, ViewChild, inject, signal } from '@angular/core';
import { InvitationStore } from '../../store/invitation.store';

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

// Extracts email-shaped tokens from arbitrary pasted text.
// Handles comma/semicolon lists, Outlook-style "Name <email>" strings, etc.
const PASTE_EMAIL_RE = /[^\s<>(),;]+@[^\s<>(),;]+\.[^\s<>(),;]+/g;

@Component({
  selector: 'app-ad-hoc-email-input',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="zone">
      <label class="zone__label" for="adhoc-input">Add by email</label>
      <input
        id="adhoc-input"
        #inputEl
        class="zone__input"
        [class.zone__input--error]="invalid()"
        type="email"
        placeholder="email@example.com — Enter, comma, semicolon or Tab; paste a list"
        (keydown)="onKeydown($event, inputEl)"
        (paste)="onPaste($event, inputEl)"
        (blur)="onBlur(inputEl)"
      />
      @if (invalid()) {
        <p class="zone__error">Please enter a valid email address.</p>
      }
    </div>
  `,
  styles: [`
    .zone__label {
      display: block;
      font-size: 0.75rem;
      font-weight: 600;
      text-transform: uppercase;
      letter-spacing: 0.05em;
      color: var(--text);
      margin-bottom: 0.4rem;
    }

    .zone__input {
      width: 100%;
      padding: 0.5rem 0.75rem;
      border: 1px solid var(--line);
      border-radius: 4px;
      font-size: 0.875rem;
      color: var(--text);
      outline: none;
      transition: border-color 0.15s;

      &:focus { border-color: var(--primary); }
      &::placeholder { color: var(--line); }
    }
    .zone__input--error { border-color: var(--notification); }

    .zone__error {
      margin: 0.3rem 0 0;
      font-size: 0.75rem;
      color: var(--notification);
    }
  `],
})
export class AdHocEmailInputComponent implements AfterViewInit {
  @ViewChild('inputEl') private inputEl!: ElementRef<HTMLInputElement>;

  protected readonly store = inject(InvitationStore);
  protected readonly invalid = signal(false);

  ngAfterViewInit(): void {
    // Focus the email input as soon as the dialog finishes loading
    this.inputEl.nativeElement.focus();
  }

  protected onKeydown(event: KeyboardEvent, input: HTMLInputElement): void {
    if (event.key === 'Enter' || event.key === ',' || event.key === ';' || event.key === 'Tab') {
      event.preventDefault();
      this.tryAdd(input.value.replace(/[,;]$/, '').trim(), input);
    } else {
      this.invalid.set(false);
    }
  }

  protected onPaste(event: ClipboardEvent, input: HTMLInputElement): void {
    const text = event.clipboardData?.getData('text') ?? '';
    const candidates = text.match(PASTE_EMAIL_RE) ?? [];

    if (candidates.length === 0) return;

    event.preventDefault();

    let anyInvalid = false;
    for (const candidate of candidates) {
      if (EMAIL_RE.test(candidate)) {
        this.store.addAdHocEmail(candidate);
      } else {
        anyInvalid = true;
      }
    }

    if (anyInvalid) {
      this.invalid.set(true);
    } else {
      this.invalid.set(false);
      input.value = '';
    }
  }

  protected onBlur(input: HTMLInputElement): void {
    const val = input.value.trim();
    if (val) this.tryAdd(val, input);
  }

  private tryAdd(value: string, input: HTMLInputElement): void {
    if (!value) return;
    if (!EMAIL_RE.test(value)) {
      this.invalid.set(true);
      return;
    }
    this.invalid.set(false);
    this.store.addAdHocEmail(value);
    input.value = '';
  }
}
