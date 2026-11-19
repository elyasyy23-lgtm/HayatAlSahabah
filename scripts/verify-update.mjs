/**
 * Offline verification of the in-app update notice (no device, no network).
 *
 * Node strips the TypeScript types itself (node:module stripTypeScriptTypes),
 * so the exact production logic in src/update.ts is what gets tested — no
 * copy of the code lives here.
 *
 *   node scripts/verify-update.mjs
 */
import { stripTypeScriptTypes } from 'node:module';
import { readFileSync, writeFileSync, mkdirSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const outDir = join(process.env.TMPDIR || '/data/data/com.termux/files/usr/tmp', 'zyvo', 'updtest');
mkdirSync(outDir, { recursive: true });

const strip = (rel) => stripTypeScriptTypes(readFileSync(join(root, rel), 'utf8'));
writeFileSync(join(outDir, 'config.mjs'), strip('src/config.ts'));
writeFileSync(
  join(outDir, 'update.mjs'),
  strip('src/update.ts').replace(/from '\.\/config'/g, "from './config.mjs'"),
);

const U = await import(pathToFileURL(join(outDir, 'update.mjs')).href);
const C = await import(pathToFileURL(join(outDir, 'config.mjs')).href);

let pass = 0;
const fails = [];
const ok = (name, cond, extra) => {
  if (cond) {
    pass += 1;
  } else {
    fails.push(name + (extra === undefined ? '' : ` → ${JSON.stringify(extra)}`));
  }
};

/* ---------- version parsing / compare ---------- */
ok('parse 1.0.0', JSON.stringify(U.parseVersion('1.0.0')) === '[1,0,0]');
ok('parse v1.2', JSON.stringify(U.parseVersion('v1.2')) === '[1,2]');
ok('parse spaces', JSON.stringify(U.parseVersion(' 2.1.4 ')) === '[2,1,4]');
ok('parse junk -> null', U.parseVersion('1.0.0-beta') === null);
ok('parse empty -> null', U.parseVersion('') === null);
ok('parse non-string -> null', U.parseVersion(42) === null);

ok('1.0.1 > 1.0.0', U.isNewer('1.0.1', '1.0.0') === true);
ok('1.0.0 !> 1.0.0', U.isNewer('1.0.0', '1.0.0') === false);
ok('1.0.0 > 0.9.9', U.isNewer('1.0.0', '0.9.9') === true);
ok('1.10.0 > 1.9.0 (numeric)', U.isNewer('1.10.0', '1.9.0') === true);
ok('1.9.0 !> 1.10.0', U.isNewer('1.9.0', '1.10.0') === false);
ok('1.0 !> 1.0.0 (padding)', U.isNewer('1.0', '1.0.0') === false);
ok('1.0.0.1 > 1.0.0', U.isNewer('1.0.0.1', '1.0.0') === true);
ok('bad remote -> false', U.isNewer('latest', '1.0.0') === false);
ok('bad local -> false', U.isNewer('1.0.1', 'x') === false);

/* ---------- manifest validation ---------- */
const good = U.sanitizeManifest({
  latestVersion: '1.0.1',
  downloadUrl: 'https://example.com/app.apk',
  pageUrl: 'https://example.com/app.html',
});
ok('good manifest accepted', !!good && good.latestVersion === '1.0.1');
ok('good keeps both urls', !!good && good.pageUrl === 'https://example.com/app.html');
ok('target prefers page', U.updateTarget(good) === 'https://example.com/app.html');
ok(
  'target falls back to apk',
  U.updateTarget({ latestVersion: '1.0.1', downloadUrl: 'https://e.com/a.apk', pageUrl: null }) ===
    'https://e.com/a.apk',
);
ok('http url rejected', U.sanitizeManifest({ latestVersion: '1.0.1', downloadUrl: 'http://e.com/a.apk' }) === null);
ok('js scheme rejected', U.sanitizeManifest({ latestVersion: '1.0.1', downloadUrl: 'javascript:alert(1)' }) === null);
ok('no url rejected', U.sanitizeManifest({ latestVersion: '1.0.1' }) === null);
ok('bad version rejected', U.sanitizeManifest({ latestVersion: 'soon', downloadUrl: 'https://e.com/a.apk' }) === null);
ok('garbage rejected', U.sanitizeManifest('nope') === null);
ok('null rejected', U.sanitizeManifest(null) === null);
ok(
  'page-only manifest ok',
  U.sanitizeManifest({ latestVersion: '1.0.1', pageUrl: 'https://e.com/p' })?.downloadUrl === 'https://e.com/p',
);

/* ---------- configuration gate ---------- */
ok('empty url not configured', U.updateCheckConfigured('') === false);
ok('https configured', U.updateCheckConfigured('https://e.com/version.json') === true);
ok('http not configured', U.updateCheckConfigured('http://e.com/version.json') === false);
ok('default constant matches config gate', U.updateCheckConfigured() === U.updateCheckConfigured(U.UPDATE_MANIFEST_URL));
// The shipped manifest must point at this app's own folder on the owner's
// CENTRAL app site (one hub for every app) — never at a raw repo file or
// another app's section.
const manifestUrl = U.UPDATE_MANIFEST_URL.trim();
ok(
  'manifest url is the central app-site manifest',
  manifestUrl === 'https://elyasyy23-lgtm.github.io/FocusBlocker/HayatAlSahabah/version.json'
);
ok(
  'manifest is http-verified https and app-scoped',
  U.updateCheckConfigured(manifestUrl) && manifestUrl.endsWith('/HayatAlSahabah/version.json')
);
ok('share url is this app’s central page', C.SHARE_URL === 'https://elyasyy23-lgtm.github.io/FocusBlocker/hayatsahabah.html');
ok('version matches app version', C.APP_VERSION === '1.0.0');
ok('persian notice is the approved text', U.UPDATE_MESSAGE_FA === 'نسخه جدید برنامه منتشر شده است. لطفاً برای دریافت آخرین امکانات، برنامه را بروزرسانی کنید.');
ok('english twin present', U.UPDATE_MESSAGE_EN.length > 20);

/* ---------- fetch behaviour ---------- */
const jsonRes = (body, okFlag = true) => ({ ok: okFlag, json: async () => body });
const badJsonRes = () => ({ ok: true, json: async () => { throw new Error('bad json'); } });

ok('unconfigured -> null, no fetch', (await U.fetchUpdateInfo('', async () => jsonRes({}))) === null);
ok('no fetch impl -> null', (await U.fetchUpdateInfo('https://e.com/v.json', undefined)) === null);

let seenUrl = '';
const info = await U.fetchUpdateInfo('https://e.com/v.json', async (url) => {
  seenUrl = url;
  return jsonRes({ latestVersion: '1.0.1', downloadUrl: 'https://e.com/a.apk' });
});
ok('happy path returns info', !!info && info.latestVersion === '1.0.1');
ok('cache buster appended', /^https:\/\/e\.com\/v\.json\?t=\d+$/.test(seenUrl), seenUrl);
let seenUrl2 = '';
await U.fetchUpdateInfo('https://e.com/v.json?x=1', async (url) => {
  seenUrl2 = url;
  return jsonRes({ latestVersion: '1.0.1', downloadUrl: 'https://e.com/a.apk' });
});
ok('cache buster uses & when query exists', seenUrl2.includes('.json?x=1&t='), seenUrl2);

ok('http 500 -> null', (await U.fetchUpdateInfo('https://e.com/v.json', async () => jsonRes({}, false))) === null);
ok('bad json -> null', (await U.fetchUpdateInfo('https://e.com/v.json', async () => badJsonRes())) === null);
ok('throwing fetch -> null', (await U.fetchUpdateInfo('https://e.com/v.json', async () => { throw new Error('offline'); })) === null);
ok(
  'invalid payload -> null',
  (await U.fetchUpdateInfo('https://e.com/v.json', async () => jsonRes({ latestVersion: 'x' }))) === null,
);

/* ---------- notify decision ---------- */
ok('notify on newer', U.shouldNotify({ latestVersion: '1.0.1', downloadUrl: 'https://e.com/a.apk', pageUrl: null }) === true);
ok('silent on same', U.shouldNotify({ latestVersion: '1.0.0', downloadUrl: 'https://e.com/a.apk', pageUrl: null }) === false);
ok('silent on older', U.shouldNotify({ latestVersion: '0.9.9', downloadUrl: 'https://e.com/a.apk', pageUrl: null }) === false);
ok('silent on null', U.shouldNotify(null) === false);

/* ---------- report ---------- */
console.log(fails.length === 0 ? `update-check: ${pass}/${pass} checks passed` : `update-check: ${pass} passed, ${fails.length} FAILED`);
for (const f of fails) console.log('  ✗ ' + f);
process.exit(fails.length === 0 ? 0 : 1);
