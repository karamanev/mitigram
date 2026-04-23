import { execSync } from 'child_process';
import * as path from 'path';

const BACKEND_DIR = path.join(__dirname, '..', 'apps', 'backend');

export default async function globalSetup(): Promise<void> {
  try {
    // Ensure the SQLite schema is current and the seed data is present.
    // Both operations are idempotent; safe to run even if the backend is up.
    execSync('npx prisma db push --skip-generate', { cwd: BACKEND_DIR, stdio: 'pipe' });
    execSync('npm run db:seed', { cwd: BACKEND_DIR, stdio: 'pipe' });
    console.log('[playwright] database ready');
  } catch (err) {
    // Non-fatal: the DB may already be up to date, or the backend holds a
    // write lock. The seed is idempotent — if it ran once, tests can proceed.
    const msg = err instanceof Error ? err.message.split('\n')[0] : String(err);
    console.warn(`[playwright] db setup warning (proceeding): ${msg}`);
  }
}
