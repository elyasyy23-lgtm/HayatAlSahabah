/**
 * In-app update notice.
 *
 * The app reads a tiny JSON published next to the download page:
 *
 *   { "latestVersion": "1.0.1", "downloadUrl": "https://…/app.apk", "pageUrl": "https://…" }
 *
 * Nothing is invented here: while UPDATE_MANIFEST_URL is empty the check is a
 * no-op, so the app never shows a fake "new version" prompt and never blocks
 * the launch. Any network/parse failure is silent (updates must never break a
 * book the user is reading offline).
 *
 * This module stays free of react-native imports so the logic is testable in
 * plain Node (see scripts/verify-update.mjs).
 */

import { APP_VERSION } from './config';

/**
 * Public manifest URL — `version.json` under this app's folder on the owner's
 * central app site. The download + detail pages live on the same hub, so a
 * release is announced by editing only `latestVersion` in that file.
 */
export const UPDATE_MANIFEST_URL =
  'https://elyasyy23-lgtm.github.io/FocusBlocker/HayatAlSahabah/version.json';

/** Owner-approved wording, shown verbatim. */
export const UPDATE_MESSAGE_FA =
  'نسخه جدید برنامه منتشر شده است. لطفاً برای دریافت آخرین امکانات، برنامه را بروزرسانی کنید.';
export const UPDATE_MESSAGE_EN =
  'A new version of the app has been released. Please update to get the latest features.';

const TIMEOUT_MS = 8000;

export type UpdateInfo = {
  latestVersion: string;
  /** APK (or store) link opened by the "update" button. */
  downloadUrl: string;
  /** Optional human page — preferred over the raw file when present. */
  pageUrl: string | null;
};

/** The check only runs when a real https manifest was configured. */
export function updateCheckConfigured(url: string = UPDATE_MANIFEST_URL): boolean {
  return /^https:\/\/\S+$/i.test(url.trim());
}

/** "1.2.3" -> [1,2,3]; anything that is not dotted digits -> null. */
export function parseVersion(input: string): number[] | null {
  if (typeof input !== 'string') return null;
  const clean = input.trim().replace(/^v/i, '');
  if (!/^\d+(\.\d+)*$/.test(clean)) return null;
  return clean.split('.').map((p) => Number(p));
}

/** Numeric compare (1.10 > 1.9 — never lexical). */
export function isNewer(remote: string, local: string): boolean {
  const a = parseVersion(remote);
  const b = parseVersion(local);
  if (!a || !b) return false;
  const len = Math.max(a.length, b.length);
  for (let i = 0; i < len; i += 1) {
    const x = a[i] ?? 0;
    const y = b[i] ?? 0;
    if (x > y) return true;
    if (x < y) return false;
  }
  return false;
}

/** Only https links are accepted — a manifest cannot inject another scheme. */
function httpsOrNull(v: unknown): string | null {
  if (typeof v !== 'string') return null;
  const s = v.trim();
  return /^https:\/\/\S+$/i.test(s) ? s : null;
}

export function sanitizeManifest(raw: unknown): UpdateInfo | null {
  if (!raw || typeof raw !== 'object') return null;
  const obj = raw as Record<string, unknown>;
  const latestVersion = typeof obj.latestVersion === 'string' ? obj.latestVersion.trim() : '';
  if (!parseVersion(latestVersion)) return null;

  const downloadUrl = httpsOrNull(obj.downloadUrl) ?? httpsOrNull(obj.pageUrl);
  if (!downloadUrl) return null;

  return {
    latestVersion,
    downloadUrl,
    pageUrl: httpsOrNull(obj.pageUrl),
  };
}

/** Where the update button sends the user. */
export function updateTarget(info: UpdateInfo): string {
  return info.pageUrl || info.downloadUrl;
}

type FetchLike = (input: string, init?: { signal?: AbortSignal }) => Promise<{
  ok: boolean;
  json: () => Promise<unknown>;
}>;

/**
 * Never throws: any failure resolves to null so callers stay quiet.
 * A `?t=` cache-buster keeps proxies from serving a stale manifest.
 */
export async function fetchUpdateInfo(
  url: string = UPDATE_MANIFEST_URL,
  fetchImpl?: FetchLike,
): Promise<UpdateInfo | null> {
  if (!updateCheckConfigured(url)) return null;
  const doFetch = fetchImpl ?? ((globalThis as unknown as { fetch?: FetchLike }).fetch);
  if (!doFetch) return null;

  const controller = typeof AbortController === 'function' ? new AbortController() : null;
  const timer = controller ? setTimeout(() => controller.abort(), TIMEOUT_MS) : null;
  try {
    const sep = url.includes('?') ? '&' : '?';
    const res = await doFetch(`${url}${sep}t=${Date.now()}`, controller ? { signal: controller.signal } : undefined);
    if (!res || !res.ok) return null;
    return sanitizeManifest(await res.json());
  } catch {
    return null;
  } finally {
    if (timer) clearTimeout(timer);
  }
}

/** True only when the manifest really is a later build than this APK. */
export function shouldNotify(info: UpdateInfo | null, local: string = APP_VERSION): info is UpdateInfo {
  return !!info && isNewer(info.latestVersion, local);
}
