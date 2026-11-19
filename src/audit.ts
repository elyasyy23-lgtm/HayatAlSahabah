/**
 * Volume 1 names & honorifics audit — summary figures only.
 *
 * Source of truth: the frozen audit deliverables produced from the bundled
 * database. This module never feeds the book text; it only describes the
 * separate review record so the reader can see it without opening files.
 */

export const AUDIT_SUMMARY = {
  volume: 1,
  persons: 214,
  attributions: 4547,
  review: 1171,
  prophetCovered: 1371,
  prophetTotal: 1699,
  markers: [
    { marker: 'ص', fa: 'پیامبر — صلی الله علیه وسلم', en: 'Prophet — ﷺ', count: 1369 },
    { marker: 'س', fa: 'صحابهٔ مرد — رضی الله عنه', en: 'Male Companion — رضي الله عنه', count: 345 },
    { marker: 'ل', fa: 'صحابهٔ زن — رضی الله عنها', en: 'Female Companion — رضي الله عنها', count: 24 },
    { marker: 'ش', fa: 'جمع صحابه — رضی الله عنهم', en: 'Companions (plural) — رضي الله عنهم', count: 8 },
    { marker: '÷', fa: 'پیامبران پیشین — علیه السلام', en: 'Earlier prophet — عليه السلام', count: 8 },
  ],
} as const;
