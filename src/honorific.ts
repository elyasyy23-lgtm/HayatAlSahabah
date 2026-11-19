import dataset from '../assets/honorifics-v1.json';

/**
 * Display-layer honorifics (policy v2, owner-approved D1-D8).
 *
 * The spans are computed at BUILD time by scripts/build_honorifics.py from the same
 * audit data that produced the name report, so this file is deliberately dumb: it
 * only applies pre-approved insertions to the text that is already on screen.
 *
 * The book itself — DB text, footnotes, headings, page numbers, search index and the
 * audit CSVs — is never touched. Turning the switch off shows the exact source text.
 */
export type Span = [start: number, end: number, replacement: string];

type Dataset = {
  version: number;
  totals?: { blocks?: number; footnotes?: number; spans?: number };
  blocks: Record<string, Span[]>;
  footnotes: Record<string, Span[]>;
};

const DATA = dataset as unknown as Dataset;
const BLOCKS: Record<string, Span[]> = DATA.blocks ?? {};
const NOTES: Record<string, Span[]> = DATA.footnotes ?? {};

/** True when the bundled dataset exists (kill switch for a build without it). */
export const HONORIFICS_AVAILABLE = Object.keys(BLOCKS).length > 0;

/** Master switch — set to false to disable the whole layer in one line. */
export const HONORIFICS_ENABLED = true;

export const HONORIFIC_TOTALS = {
  blocks: DATA.totals?.blocks ?? Object.keys(BLOCKS).length,
  footnotes: DATA.totals?.footnotes ?? Object.keys(NOTES).length,
  spans: DATA.totals?.spans ?? 0,
};

/**
 * Apply pre-computed spans to a raw string.
 * Defensive by design: a stale dataset (offsets past the end, out-of-order or
 * overlapping spans) degrades to the untouched text instead of throwing.
 */
export function applySpans(raw: string, spans?: Span[]): string {
  if (!raw || !spans || spans.length === 0) return raw;
  let out = '';
  let last = 0;
  let touched = 0;
  for (const span of spans) {
    if (!Array.isArray(span) || span.length < 3) continue;
    const [start, end, replacement] = span;
    if (typeof replacement !== 'string' || !replacement) continue;
    if (start < last || end < start || end > raw.length) continue;
    out += raw.slice(last, start);
    out += replacement;
    last = end;
    touched += 1;
  }
  if (!touched) return raw;
  return out + raw.slice(last);
}

export function blockDisplayText(raw: string, blockId: number, enabled: boolean): string {
  if (!enabled || !HONORIFICS_ENABLED) return raw;
  return applySpans(raw, BLOCKS[String(blockId)]);
}

export function footnoteDisplayText(raw: string, noteId: number, enabled: boolean): string {
  if (!enabled || !HONORIFICS_ENABLED) return raw;
  return applySpans(raw, NOTES[String(noteId)]);
}
