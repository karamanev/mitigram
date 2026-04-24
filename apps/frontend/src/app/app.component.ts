import { ChangeDetectionStrategy, Component, signal } from '@angular/core';
import { InviteDialogComponent } from './components/invite-dialog/invite-dialog.component';

@Component({
  selector: 'mitigram-root',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [InviteDialogComponent],
  templateUrl: './app.component.html',
  styleUrl: './app.component.scss',
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
    queueMicrotask(() => this.previouslyFocused?.focus());
  }
}
