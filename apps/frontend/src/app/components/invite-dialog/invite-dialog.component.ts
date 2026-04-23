import {
  ChangeDetectionStrategy,
  Component,
  ElementRef,
  EventEmitter,
  HostListener,
  Input,
  OnInit,
  Output,
  inject,
  signal,
} from '@angular/core';
import { forkJoin } from 'rxjs';
import { InvitationStore } from '../../store/invitation.store';
import { ApiService } from '../../services/api.service';
import { AdHocEmailInputComponent } from '../ad-hoc-email-input/ad-hoc-email-input.component';
import { AddressBookPanelComponent } from '../address-book-panel/address-book-panel.component';
import { RecipientsPanelComponent } from '../recipients-panel/recipients-panel.component';
import { ReviewAndSendComponent } from '../review-and-send/review-and-send.component';

const FOCUSABLE_SELECTOR = [
  'a[href]',
  'button:not([disabled])',
  'input:not([disabled])',
  'select:not([disabled])',
  'textarea:not([disabled])',
  '[tabindex]:not([tabindex="-1"])',
].join(',');

@Component({
  selector: 'app-invite-dialog',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    AdHocEmailInputComponent,
    AddressBookPanelComponent,
    RecipientsPanelComponent,
    ReviewAndSendComponent,
  ],
  template: `
    <!-- Backdrop -->
    <div class="overlay" (click)="close()">
      <!-- Dialog — stop clicks bubbling to overlay -->
      <div class="dialog" role="dialog" aria-modal="true"
           aria-labelledby="dialog-title"
           (click)="$event.stopPropagation()">

        <!-- Header -->
        <header class="dialog__header">
          <h2 id="dialog-title" class="dialog__title">Invite counterparties</h2>
          <button class="btn btn--icon dialog__close"
                  aria-label="Close dialog"
                  (click)="close()">×</button>
        </header>

        <!-- Loading skeleton -->
        @if (loading()) {
          <div class="dialog__body">
            <div class="skeleton skeleton--input"></div>
            <div class="dialog__columns">
              <div class="dialog__zone-b">
                <div class="skeleton skeleton--title"></div>
                <div class="skeleton skeleton--tabs"></div>
                @for (i of skeletonRows; track i) {
                  <div class="skeleton skeleton--row"></div>
                }
              </div>
              <div class="dialog__zone-c">
                <div class="skeleton skeleton--title"></div>
                <div class="skeleton skeleton--empty"></div>
              </div>
            </div>
          </div>
          <footer class="dialog__footer">
            <span class="skeleton skeleton--count"></span>
            <span class="skeleton skeleton--btn"></span>
          </footer>
        } @else if (error()) {
          <div class="dialog__state dialog__state--error">
            {{ error() }}<br/>
            <button class="btn btn--ghost" style="margin-top:.75rem"
                    (click)="loadData()">Retry</button>
          </div>
        } @else if (showReview()) {
          <!-- Review panel fills the dialog body -->
          <app-review-and-send
            [instrumentId]="instrumentId"
            (back)="showReview.set(false)"
            (sent)="close()"
          />
        } @else {
          <!-- ── Main body ─────────────────────────────────────────────── -->
          <div class="dialog__body">

            <!-- Zone A: ad-hoc email input -->
            <div class="dialog__zone-a">
              <app-ad-hoc-email-input />
            </div>

            <!-- Zone B + Zone C side by side -->
            <div class="dialog__columns">
              <div class="dialog__zone-b">
                <app-address-book-panel />
              </div>
              <div class="dialog__zone-c">
                <app-recipients-panel />
              </div>
            </div>
          </div>

          <!-- Footer (req #5: live count) -->
          <footer class="dialog__footer">
            <span class="dialog__count">
              @if (store.finalEmails().length === 0) {
                No recipients yet
              } @else {
                {{ store.finalEmails().length }}
                unique email{{ store.finalEmails().length !== 1 ? 's' : '' }}
              }
            </span>
            <button
              class="btn btn--primary"
              [disabled]="store.finalEmails().length === 0"
              (click)="showReview.set(true)"
            >
              Send invitations
            </button>
          </footer>
        }
      </div>
    </div>
  `,
  styles: [`
    .overlay {
      position: fixed;
      inset: 0;
      background: var(--overlay);
      display: flex;
      align-items: center;
      justify-content: center;
      z-index: 1000;
      padding: 1rem;
    }

    .dialog {
      background: var(--bg-white);
      border-radius: 8px;
      box-shadow: 0 8px 40px rgba(0, 0, 0, 0.2);
      width: min(940px, 100%);
      height: min(680px, 90vh);
      display: flex;
      flex-direction: column;
      overflow: hidden;
    }

    /* Header */
    .dialog__header {
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding: 1rem 1.25rem;
      border-bottom: 1px solid var(--line);
      flex-shrink: 0;
    }

    .dialog__title {
      margin: 0;
      font-size: 1.1rem;
      font-weight: 600;
      color: var(--headline);
    }

    .dialog__close {
      font-size: 1.3rem;
      color: var(--text);
    }

    /* Skeleton loader */
    @keyframes shimmer {
      0%   { background-position: -600px 0; }
      100% { background-position:  600px 0; }
    }

    .skeleton {
      border-radius: 4px;
      background: linear-gradient(90deg, var(--bg-grey) 25%, var(--line) 50%, var(--bg-grey) 75%);
      background-size: 600px 100%;
      animation: shimmer 1.4s infinite linear;
    }
    .skeleton--input  { height: 36px; width: 100%; flex-shrink: 0; }
    .skeleton--title  { height: 12px; width: 80px; margin-bottom: 0.75rem; }
    .skeleton--tabs   { height: 28px; width: 160px; margin-bottom: 0.75rem; }
    .skeleton--row    { height: 38px; width: 100%; margin-bottom: 0.4rem; }
    .skeleton--empty  { height: 80px; width: 100%; margin-top: 0.5rem; }
    .skeleton--count  { height: 16px; width: 120px; display: inline-block; }
    .skeleton--btn    { height: 34px; width: 140px; display: inline-block; border-radius: 4px; }

    /* Loading / error state */
    .dialog__state {
      flex: 1;
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      color: var(--text);
      font-size: 0.9rem;
      text-align: center;
    }
    .dialog__state--error { color: var(--notification); }

    /* Main body */
    .dialog__body {
      flex: 1;
      display: flex;
      flex-direction: column;
      overflow: hidden;
      padding: 1rem 1.25rem 0;
      gap: 0.875rem;
    }

    /* Zone A: ad-hoc input — slim strip at top */
    .dialog__zone-a {
      flex-shrink: 0;
    }

    /* Zone B + C columns — side-by-side on wide, stacked on narrow */
    .dialog__columns {
      flex: 1;
      display: flex;
      gap: 0;
      overflow: hidden;
      border: 1px solid var(--line);
      border-radius: 6px;
    }

    .dialog__zone-b {
      flex: 0 0 45%;
      border-right: 1px solid var(--line);
      padding: 0.875rem;
      overflow: hidden;
      display: flex;
      flex-direction: column;
    }

    .dialog__zone-c {
      flex: 1;
      padding: 0.875rem;
      overflow: hidden;
      display: flex;
      flex-direction: column;
    }

    /* Narrow dialog: stack zones vertically and let each scroll */
    @media (max-width: 600px) {
      .dialog__columns {
        flex-direction: column;
        overflow-y: auto;
      }

      .dialog__zone-b {
        flex: 0 0 auto;
        border-right: none;
        border-bottom: 1px solid var(--line);
        max-height: 260px;
      }

      .dialog__zone-c {
        flex: 0 0 auto;
        max-height: 240px;
      }
    }

    /* Footer */
    .dialog__footer {
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding: 0.875rem 1.25rem;
      border-top: 1px solid var(--line);
      flex-shrink: 0;
    }

    .dialog__count {
      font-size: 0.875rem;
      color: var(--text);
      font-weight: 500;
    }
  `],
})
export class InviteDialogComponent implements OnInit {
  @Input({ required: true }) instrumentId!: string;
  @Output() readonly closed = new EventEmitter<void>();

  protected readonly store = inject(InvitationStore);
  private readonly api = inject(ApiService);
  private readonly host = inject<ElementRef<HTMLElement>>(ElementRef);

  protected readonly showReview = signal(false);
  protected readonly loading = signal(true);
  protected readonly error = signal<string | null>(null);
  protected readonly skeletonRows = [1, 2, 3, 4, 5, 6];

  ngOnInit(): void {
    this.store.reset();
    this.loadData();
  }

  protected loadData(): void {
    this.loading.set(true);
    this.error.set(null);

    forkJoin({
      contacts: this.api.getContacts(),
      groups: this.api.getGroups(),
    }).subscribe({
      next: ({ contacts, groups }) => {
        this.store.contacts.set(contacts);
        this.store.groups.set(groups);
        this.loading.set(false);
      },
      error: () => {
        this.error.set('Failed to load the address book.');
        this.loading.set(false);
      },
    });
  }

  protected close(): void {
    this.store.reset();
    this.closed.emit();
  }

  // ── Keyboard handling ────────────────────────────────────────────────────
  // Escape closes from anywhere; Tab is trapped inside the dialog so keyboard
  // users never land on page content behind the modal.

  @HostListener('document:keydown.escape')
  protected onEscape(): void {
    this.close();
  }

  @HostListener('keydown.tab', ['$event'])
  protected onTab(event: KeyboardEvent): void {
    this.trapFocus(event, false);
  }

  @HostListener('keydown.shift.tab', ['$event'])
  protected onShiftTab(event: KeyboardEvent): void {
    this.trapFocus(event, true);
  }

  private trapFocus(event: KeyboardEvent, reverse: boolean): void {
    const focusables = (
      Array.from(this.host.nativeElement.querySelectorAll(FOCUSABLE_SELECTOR)) as HTMLElement[]
    ).filter(el => el.offsetParent !== null);

    if (focusables.length === 0) return;

    const first = focusables[0];
    const last  = focusables[focusables.length - 1];
    const active = document.activeElement as HTMLElement | null;

    if (reverse && active === first) {
      event.preventDefault();
      last.focus();
    } else if (!reverse && active === last) {
      event.preventDefault();
      first.focus();
    }
  }
}
