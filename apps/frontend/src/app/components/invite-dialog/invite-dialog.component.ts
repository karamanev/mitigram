import {
  ChangeDetectionStrategy,
  Component,
  ElementRef,
  EventEmitter,
  HostListener,
  Input,
  type OnInit,
  Output,
  inject,
  signal,
} from '@angular/core';
import { animate, style, transition, trigger } from '@angular/animations';
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
  selector: 'mitigram-invite-dialog',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  animations: [
    trigger('step', [
      transition(':enter', [
        style({ opacity: 0, transform: 'translateY(10px)' }),
        animate('300ms 30ms cubic-bezier(0.22, 1, 0.36, 1)'),
      ]),
      transition(':leave', [
        style({ position: 'absolute', inset: '0', overflow: 'hidden' }),
        animate('180ms ease-in', style({ opacity: 0 })),
      ]),
    ]),
  ],
  imports: [
    AdHocEmailInputComponent,
    AddressBookPanelComponent,
    RecipientsPanelComponent,
    ReviewAndSendComponent,
  ],
  templateUrl: './invite-dialog.component.html',
  styleUrl: './invite-dialog.component.scss',
})
export class InviteDialogComponent implements OnInit {
  @Input({ required: true }) instrumentId!: string;
  @Output() readonly closed = new EventEmitter<void>();

  protected readonly store = inject(InvitationStore);
  private readonly api = inject(ApiService);
  private readonly host = inject<ElementRef<HTMLElement>>(ElementRef);

  protected readonly showReview = signal(false);
  protected readonly reviewSuccess = signal(false);
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
    this.reviewSuccess.set(false);
    this.showReview.set(false);
    this.store.reset();
    this.closed.emit();
  }

  protected openReview(): void {
    this.reviewSuccess.set(false);
    this.showReview.set(true);
  }

  protected handleReviewBack(): void {
    this.reviewSuccess.set(false);
    this.showReview.set(false);
  }

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
    const focusables = Array.from(
      this.host.nativeElement.querySelectorAll<HTMLElement>(FOCUSABLE_SELECTOR),
    ).filter(el => el.offsetParent !== null);

    if (focusables.length === 0) {
      return;
    }

    const first = focusables[0];
    const last = focusables[focusables.length - 1];
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
