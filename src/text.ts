const FA_DIGITS = '۰۱۲۳۴۵۶۷۸۹';

export function toFa(n: number | string): string {
  return String(n).replace(/[0-9]/g, (d) => FA_DIGITS[Number(d)]);
}

export function faNum(n: number): string {
  return toFa(n.toLocaleString('en-US').replace(/,/g, '٬'));
}

export type Seg = { kind: 'text' | 'fn'; value: string };

/** Split raw block text into plain segments and footnote reference markers. */
export function parseSegments(raw: string): Seg[] {
  const out: Seg[] = [];
  const re = /\uFDD0(\d+)\uFDD1/g;
  let last = 0;
  let m: RegExpExecArray | null;
  while ((m = re.exec(raw)) !== null) {
    if (m.index > last) out.push({ kind: 'text', value: raw.slice(last, m.index) });
    out.push({ kind: 'fn', value: m[1] });
    last = m.index + m[0].length;
  }
  if (last < raw.length) out.push({ kind: 'text', value: raw.slice(last) });
  return out;
}

export function stripMarkers(raw: string): string {
  return raw.replace(/[\uFDD0\uFDD1]\d*/g, '');
}

const FOLD_MAP: [RegExp, string][] = [
  [/[\u064A\u0649]/g, 'ی'], // ي ى
  [/[\u0643]/g, 'ک'], // ك
  [/[\u06C0\u0629]/g, 'ه'], // ۀ ة
  [/[\u0623\u0625\u0622]/g, 'ا'], // أ إ آ
  [/[\u0624]/g, 'و'],
  [/[\u0626]/g, 'ی'],
  [/[\u0640]/g, ''], // tatweel
];

/** Same normalization the offline index was built with (see scripts/build_db.py). */
export function fold(input: string): string {
  let s = input.normalize('NFKC');
  for (const [re, to] of FOLD_MAP) s = s.replace(re, to);
  s = s.replace(/[\u064B-\u0652\u0670\u200c\u200d\uFDD0\uFDD1]/g, ' ');
  s = s.replace(/[^0-9A-Za-z\u0600-\u06FF]+/g, ' ');
  return s.replace(/\s+/g, ' ').trim();
}

export function snippet(text: string, tokens: string[], radius = 90): string {
  const plain = stripMarkers(text).replace(/\s+/g, ' ').trim();
  if (!tokens.length) return plain.slice(0, radius * 2);
  const folded = fold(plain);
  let at = -1;
  for (const t of tokens) {
    const i = folded.indexOf(t);
    if (i >= 0 && (at < 0 || i < at)) at = i;
  }
  if (at < 0) return plain.slice(0, radius * 2);
  const start = Math.max(0, at - radius);
  return (start > 0 ? '…' : '') + plain.slice(start, at + radius) + (plain.length > at + radius ? '…' : '');
}

export function countOccurrences(haystack: string, needle: string): number {
  if (!needle) return 0;
  let n = 0;
  let i = haystack.indexOf(needle);
  while (i >= 0) {
    n += 1;
    i = haystack.indexOf(needle, i + needle.length);
  }
  return n;
}
