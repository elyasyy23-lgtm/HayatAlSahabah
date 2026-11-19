/**
 * App Standard Template audit — offline, no device, no network.
 *
 * Proves the owner-supplied values shipped in src/config.ts are EXACT
 * (nothing shortened, invented or replaced by a placeholder), that the
 * wallet is a genuinely valid TRON address, that Support/Donate copy
 * buttons copy the right constant, and that the drawer keeps all 9
 * template entries in order.
 *
 *   node scripts/verify-template.mjs
 */
import { stripTypeScriptTypes } from 'node:module';
import { readFileSync, writeFileSync, mkdirSync, readdirSync, statSync } from 'node:fs';
import { createHash } from 'node:crypto';
import { join, dirname } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const outDir = join(process.env.TMPDIR || '/data/data/com.termux/files/usr/tmp', 'zyvo', 'tmpltest');
mkdirSync(outDir, { recursive: true });
const read = (rel) => readFileSync(join(root, rel), 'utf8');

writeFileSync(join(outDir, 'config.mjs'), stripTypeScriptTypes(read('src/config.ts')));
writeFileSync(join(outDir, 'clipboard.mjs'), stripTypeScriptTypes(read('src/clipboard.ts')));
const C = await import(pathToFileURL(join(outDir, 'config.mjs')).href);
const CB = await import(pathToFileURL(join(outDir, 'clipboard.mjs')).href);

let pass = 0;
const fails = [];
const ok = (name, cond, extra) => {
  if (cond) pass += 1;
  else fails.push(name + (extra === undefined ? '' : ` → ${JSON.stringify(extra)}`));
};

/* ---------- owner-supplied values, character for character ---------- */
const OWNER_WALLET = 'TANP1ibS4DsF2C1p1rBGAZ5MrGZyS5sUmU';
ok('wallet is byte-exact', C.DONATION_WALLET === OWNER_WALLET, C.DONATION_WALLET);
ok('wallet untouched after trim', C.DONATION_WALLET.trim() === C.DONATION_WALLET);
ok('wallet is 34 chars', C.DONATION_WALLET.length === 34, C.DONATION_WALLET.length);
ok('token is USDT', C.DONATION_TOKEN === 'USDT', C.DONATION_TOKEN);
ok('network is TRC20', C.DONATION_NETWORK === 'TRC20', C.DONATION_NETWORK);
ok('rubika id', C.SUPPORT_RUBIKA_ID === '@yasmajyd', C.SUPPORT_RUBIKA_ID);
ok('rubika url', C.SUPPORT_RUBIKA_URL === 'https://rubika.ir/yasmajyd', C.SUPPORT_RUBIKA_URL);
ok('donateReady() true', C.donateReady() === true);
ok('shareReady() true', C.shareReady() === true);

/* ---------- real TRON address check: base58check + 0x41 prefix ---------- */
const ALPHABET = '123456789ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz';
const b58decode = (s) => {
  let num = 0n;
  for (const ch of s) {
    const v = ALPHABET.indexOf(ch);
    if (v < 0) return null;
    num = num * 58n + BigInt(v);
  }
  let hex = num === 0n ? '' : num.toString(16);
  if (hex.length % 2) hex = '0' + hex;
  const lead = s.length - s.replace(/^1+/, '').length;
  return Buffer.concat([Buffer.alloc(lead), Buffer.from(hex, 'hex')]);
};
const dsha = (b) => createHash('sha256').update(createHash('sha256').update(b).digest()).digest();
const raw = b58decode(C.DONATION_WALLET);
ok('wallet base58 decodes', raw !== null);
if (raw) {
  ok('wallet is 25 bytes', raw.length === 25, raw.length);
  const payload = raw.subarray(0, 21);
  const checksum = raw.subarray(21);
  ok('wallet prefix is 0x41 (TRON mainnet)', payload[0] === 0x41, payload[0].toString(16));
  ok('wallet checksum valid', dsha(payload).subarray(0, 4).equals(checksum));
  const hex = payload.subarray(1).toString('hex');
  ok('wallet maps to a 20-byte account', hex.length === 40, hex);
}

/* ---------- copy buttons must copy these exact constants ---------- */
const supportSrc = read('src/screens/SupportScreen.tsx');
const donateSrc = read('src/screens/DonateScreen.tsx');
ok('Support imports expo-clipboard', /import \* as Clipboard from 'expo-clipboard'/.test(supportSrc));
ok('Support copies the Rubika id', /copyExact\(Clipboard\.setStringAsync, SUPPORT_RUBIKA_ID\)/.test(supportSrc));
ok('Support shows the visible id', /\{SUPPORT_RUBIKA_ID\}/.test(supportSrc));
ok('Support copies exactly once per press', (supportSrc.match(/copyExact\(/g) || []).length === 1);
ok('Support still opens Rubika', /Linking\.openURL\(SUPPORT_RUBIKA_URL\)/.test(supportSrc));
ok('Donate imports expo-clipboard', /import \* as Clipboard from 'expo-clipboard'/.test(donateSrc));
ok('Donate copies the wallet', /copyExact\(Clipboard\.setStringAsync, DONATION_WALLET\)/.test(donateSrc));
ok('Donate renders the wallet in full', /\{DONATION_WALLET\}/.test(donateSrc));
ok('Donate copies exactly once per press', (donateSrc.match(/copyExact\(/g) || []).length === 1);
ok('Donate shows USDT', /\{DONATION_TOKEN\}/.test(donateSrc));
ok('Donate shows TRC20', /\{DONATION_NETWORK\}/.test(donateSrc));
ok('Donate has no "not confirmed" branch', !/donate\.pending/.test(donateSrc) && !/pending/.test(donateSrc));
ok('copied feedback implemented', /common\.copied/.test(supportSrc) && /common\.copied/.test(donateSrc));

/* ---------- the shared copy helper: verbatim write, honest failure ---------- */
{
  let seen = null;
  const writes = [];
  const spy = async (v) => writes.push(v);
  ok('copyExact writes the wallet verbatim', await CB.copyExact(spy, C.DONATION_WALLET));
  seen = writes[0];
  ok('clipboard receives the EXACT wallet string', seen === OWNER_WALLET, seen);
  ok('clipboard length matches the address', seen.length === 34, seen && seen.length);
  ok('copyExact writes the Rubika id verbatim', await CB.copyExact(spy, C.SUPPORT_RUBIKA_ID));
  ok('clipboard received both values', JSON.stringify(writes) === JSON.stringify([OWNER_WALLET, '@yasmajyd']), writes);
  ok('copyExact reports a throwing clipboard as failure', (await CB.copyExact(async () => { throw new Error('denied'); }, 'x')) === false);
  ok('copyExact refuses an empty value', (await CB.copyExact(spy, '')) === false);
  ok('copyExact does not write when value is empty', writes.length === 2, writes.length);
}

/* ---------- i18n: required keys, fa+en, no placeholder wording ---------- */
const i18nSrc = read('src/i18n.ts');
const keys = [...i18nSrc.matchAll(/^\s*'([a-zA-Z]+\.[a-zA-Z]+)':\s*\[(?:'([^']*)'|"([^"]*)"),\s*(?:'([^']*)'|"([^"]*)")\]/gm)].map(
  (m) => ({ key: m[1], fa: m[2] ?? m[3], en: m[4] ?? m[5] }),
);
const map = new Map(keys.map((k) => [k.key, k]));
for (const k of [
  'support.title', 'support.subtitle', 'support.rubika', 'support.rubikaHint', 'support.copyId',
  'donate.title', 'donate.subtitle', 'donate.network', 'donate.wallet', 'donate.copyWallet', 'donate.note',
  'common.copy', 'common.copied',
]) {
  const e = map.get(k);
  ok(`i18n ${k} present (fa+en)`, !!e && e.fa.length > 0 && e.en.length > 0, e);
}
ok('i18n has no donate.pending key', !i18nSrc.includes("'donate.pending'"));
const banned = [/تأیید نشده/, /not confirmed/, /تنظیم نشده/, /not configured/i];
for (const [key, e] of map) {
  if (!/^(support|donate)\./.test(key)) continue;
  ok(`i18n ${key} free of placeholder wording`, !banned.some((rx) => rx.test(e.fa) || rx.test(e.en)), e);
}

/* ---------- drawer: exactly the 9 template entries, in order ---------- */
const drawerSrc = read('src/components/Drawer.tsx');
const order = [...drawerSrc.matchAll(/labelKey: '(nav\.[a-zA-Z]+)'/g)].map((m) => m[1]);
ok(
  'drawer = 9 template entries in order',
  JSON.stringify(order) ===
    JSON.stringify([
      'nav.home', 'nav.volumes', 'nav.settings', 'nav.help', 'nav.share',
      'nav.support', 'nav.donate', 'nav.logs', 'nav.about',
    ]),
  order,
);

/* ---------- project-wide placeholder scan (source only) ---------- */
const walk = (dir) =>
  readdirSync(dir).flatMap((f) => {
    const p = join(dir, f);
    if (statSync(p).isDirectory()) return walk(p);
    return /\.(ts|tsx)$/.test(f) ? [p] : [];
  });
// The i18n dictionary is excluded: it must still carry defensive copy for a
// build whose URL constants were intentionally cleared. What matters is that no
// VISIBLE screen renders placeholder wording.
const srcFiles = [...walk(join(root, 'src')), join(root, 'App.tsx')].filter(
  (p) => !p.endsWith('src/i18n.ts'),
);
const suspicious = [];
for (const p of srcFiles) {
  // TextInput placeholder props are normal UI, not placeholder content.
  const s = readFileSync(p, 'utf8')
    .replace(/placeholderTextColor=\{[^}]*\}/g, '')
    .replace(/placeholder=\{?[^\s>]*\}?/g, '');
  for (const rx of [/TODO/, /FIXME/, /yourlink/i, /\bplaceholder\b/i, /تنظیم نشده/, /تأیید نشده/]) {
    if (rx.test(s)) suspicious.push(`${p.replace(root + '/', '')}: ${rx}`);
  }
}
ok('no TODO/FIXME/placeholder markers in app source', suspicious.length === 0, suspicious);

console.log(`\n${pass}/${pass + fails.length} checks passed`);
if (fails.length) {
  for (const f of fails) console.log(`  FAIL ${f}`);
  process.exit(1);
}
console.log('ALL CHECKS PASSED');
