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
          <button class="btn btn--primary" (click)="dialogOpen.set(true)">
            Invite counterparties
          </button>
        </div>
      </main>

      @if (dialogOpen()) {
        <app-invite-dialog
          instrumentId="LC-2024-001"
          (closed)="dialogOpen.set(false)"
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
      color: #fff;
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
      background: #fff;
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
}
