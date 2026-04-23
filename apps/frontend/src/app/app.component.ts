import { ChangeDetectionStrategy, Component, signal } from '@angular/core';
import { InviteDialogComponent } from './components/invite-dialog/invite-dialog.component';

@Component({
  selector: 'app-root',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [InviteDialogComponent],
  template: `
    <div class="page">
      <header class="topbar">
        <span class="topbar__brand">Mitigram</span>
      </header>

      <main class="content">
        <div class="instrument-card">
          <div class="instrument-card__left">
            <span class="instrument-card__ref">LC-2024-001</span>
            <span class="instrument-card__type">Letter of Credit · EUR 1,200,000</span>
            <span class="instrument-card__status">Active</span>
          </div>
          <button class="btn btn--primary" (click)="openDialog()">
            Invite counterparties
          </button>
        </div>
      </main>

      @if (dialogOpen()) {
        <app-invite-dialog
          instrumentId="LC-2024-001"
          (closed)="closeDialog()"
        />
      }
    </div>
  `,
  styles: [`
    .page {
      min-height: 100vh;
      background: var(--bg-grey);
    }

    /* ── Top navigation bar ─────────────────────────────────────── */
    .topbar {
      height: 56px;
      background: var(--menu-dark);
      padding: 0 2rem;
      display: flex;
      align-items: center;
    }

    .topbar__brand {
      color: var(--text-inverse);
      font-weight: 700;
      font-size: 1.2rem;
      letter-spacing: 0.03em;
    }

    /* ── Page content ───────────────────────────────────────────── */
    .content {
      max-width: 960px;
      margin: 2rem auto;
      padding: 0 1.5rem;
    }

    /* ── Instrument card ────────────────────────────────────────── */
    .instrument-card {
      background: var(--bg-white);
      border: 1px solid var(--line);
      border-radius: 8px;
      padding: 1.5rem;
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 1.5rem;
    }

    .instrument-card__left {
      display: flex;
      flex-direction: column;
      gap: 0.3rem;
    }

    .instrument-card__ref {
      font-size: 1.1rem;
      font-weight: 600;
      color: var(--headline);
    }

    .instrument-card__type {
      font-size: 0.875rem;
      color: var(--text);
    }

    .instrument-card__status {
      font-size: 0.8rem;
      font-weight: 500;
      color: var(--primary);
    }
  `],
})
export class AppComponent {
  protected readonly dialogOpen = signal(false);
  private previouslyFocused: HTMLElement | null = null;

  protected openDialog(): void {
    this.previouslyFocused = document.activeElement as HTMLElement | null;
    this.dialogOpen.set(true);
  }

  protected closeDialog(): void {
    this.dialogOpen.set(false);
    // Restore focus on the next tick so the trigger exists again in the DOM.
    queueMicrotask(() => this.previouslyFocused?.focus());
  }
}
