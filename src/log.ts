/**
 * In-memory ring buffer for the Error log screen.
 *
 * Kept deliberately small and dependency-free: entries live for the app
 * session only, which is enough to diagnose a failed load, a blocked action or
 * a database error. No data ever leaves the device.
 */

export type LogEntry = { at: number; tag: string; message: string };

const LIMIT = 200;
let entries: LogEntry[] = [];
const listeners = new Set<() => void>();

function emit() {
  for (const l of listeners) {
    try {
      l();
    } catch {
      /* a broken listener must never break logging */
    }
  }
}

export function logEvent(tag: string, message: string): void {
  const clean = String(message ?? '').slice(0, 500);
  entries = [{ at: Date.now(), tag, message: clean }, ...entries].slice(0, LIMIT);
  emit();
}

export function getLogs(): LogEntry[] {
  return entries;
}

export function clearLogs(): void {
  entries = [];
  emit();
}

export function subscribeLogs(fn: () => void): () => void {
  listeners.add(fn);
  return () => {
    listeners.delete(fn);
  };
}

export function formatClock(ts: number): string {
  const d = new Date(ts);
  const h = String(d.getHours()).padStart(2, '0');
  const m = String(d.getMinutes()).padStart(2, '0');
  const s = String(d.getSeconds()).padStart(2, '0');
  return `${h}:${m}:${s}`;
}
