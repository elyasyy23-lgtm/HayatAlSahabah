import type { SQLiteDatabase } from 'expo-sqlite';
import { countOccurrences, fold } from './text';

export type NodeRow = {
  id: number;
  parent_id: number | null;
  level: number;
  ord: number;
  title: string;
  page: number;
  word_page: number;
  delta: number;
  toc_disp: string;
  path: string;
  blocks_count: number;
  words: number;
};

export type BlockRow = {
  id: number;
  node_id: number;
  ord: number;
  kind: 'body' | 'body_bold' | 'verse' | 'verse_fa' | 'hadith_ar' | 'table' | string;
  text: string | null;
  jc: string | null;
  rows_json: string | null;
  fn_ids: string | null;
};

export type FootnoteRow = { id: number; num: number; text: string };

export type BookmarkRow = {
  id: number;
  node_id: number;
  block_id: number | null;
  snippet: string | null;
  created_at: number;
  title: string;
  page: number;
  level: number;
};

export type SearchHit = {
  nodeId: number;
  blockId: number;
  title: string;
  page: number;
  level: number;
  text: string;
  score: number;
  tokens: string[];
};

export type Settings = {
  fontSize: number;
  lineHeight: number;
  theme: 'cream' | 'night';
  showFootnotes: boolean;
  justify: boolean;
  lang: 'fa' | 'en';
  vibrationOn: boolean;
  honorifics: boolean;
};

export const DEFAULT_SETTINGS: Settings = {
  fontSize: 18,
  lineHeight: 1.95,
  theme: 'night',
  showFootnotes: true,
  justify: true,
  lang: 'fa',
  vibrationOn: true,
  honorifics: true,
};

/**
 * Guarded access layer.
 *
 * The database handle is owned by `<SQLiteProvider>` for the whole app lifetime.
 * A screen must never crash because a handle was closed, was not ready yet, or a
 * query failed — every call below degrades to a safe value and records the last
 * error instead of throwing during render.
 */
let lastError: string | null = null;

export function getDbError(): string | null {
  return lastError;
}

export function clearDbError(): void {
  lastError = null;
}

/** Probe used by the readiness gate: throws only if the connection is unusable. */
export function assertDbReady(db: SQLiteDatabase): void {
  db.getFirstSync('SELECT 1');
}

function read<T>(tag: string, fn: () => T, fallback: T): T {
  try {
    const value = fn();
    lastError = null;
    return value;
  } catch (e) {
    lastError = `${tag}: ${(e as Error)?.message ?? String(e)}`;
    console.warn(`[db] ${lastError}`);
    return fallback;
  }
}

function write(tag: string, fn: () => void): boolean {
  try {
    fn();
    lastError = null;
    return true;
  } catch (e) {
    lastError = `${tag}: ${(e as Error)?.message ?? String(e)}`;
    console.warn(`[db] ${lastError}`);
    return false;
  }
}

export function getMeta(db: SQLiteDatabase): Record<string, string> {
  return read(
    'meta',
    () => {
      const rows = db.getAllSync<{ k: string; v: string }>('SELECT k,v FROM meta');
      const out: Record<string, string> = {};
      for (const r of rows) out[r.k] = r.v;
      return out;
    },
    {},
  );
}

export function getNode(db: SQLiteDatabase, id: number): NodeRow | null {
  return read('node', () => db.getFirstSync<NodeRow>('SELECT * FROM nodes WHERE id = ?', id) ?? null, null);
}

export function getRoots(db: SQLiteDatabase): NodeRow[] {
  return read(
    'roots',
    () => db.getAllSync<NodeRow>('SELECT * FROM nodes WHERE parent_id IS NULL ORDER BY ord'),
    [],
  );
}

export function getChildren(db: SQLiteDatabase, parentId: number | null): NodeRow[] {
  if (parentId == null) return getRoots(db);
  return read(
    'children',
    () => db.getAllSync<NodeRow>('SELECT * FROM nodes WHERE parent_id = ? ORDER BY ord', parentId),
    [],
  );
}

export function getAllNodes(db: SQLiteDatabase): NodeRow[] {
  return read('allnodes', () => db.getAllSync<NodeRow>('SELECT * FROM nodes ORDER BY ord'), []);
}

export function getBlocks(db: SQLiteDatabase, nodeId: number): BlockRow[] {
  return read(
    'blocks',
    () => db.getAllSync<BlockRow>('SELECT * FROM blocks WHERE node_id = ? ORDER BY ord', nodeId),
    [],
  );
}

export function getNodeFootnotes(db: SQLiteDatabase, nodeId: number): FootnoteRow[] {
  return read(
    'footnotes',
    () =>
      db.getAllSync<FootnoteRow>(
        `SELECT f.id, f.num, f.text FROM footnote_use u
         JOIN footnotes f ON f.id = u.fn_id
         WHERE u.node_id = ? ORDER BY f.num`,
        nodeId,
      ),
    [],
  );
}

/** Ordered reading sequence: only nodes that carry content. */
export function getReadingOrder(db: SQLiteDatabase): { id: number; title: string; level: number; page: number }[] {
  return read(
    'order',
    () => db.getAllSync('SELECT id,title,level,page FROM nodes WHERE blocks_count > 0 ORDER BY ord'),
    [],
  );
}

export function adjacentNode(
  db: SQLiteDatabase,
  nodeId: number,
  dir: -1 | 1,
): { id: number; title: string; page: number } | null {
  if (dir === 1) {
    return read(
      'next',
      () =>
        db.getFirstSync(
          'SELECT id,title,page FROM nodes WHERE blocks_count > 0 AND ord > (SELECT ord FROM nodes WHERE id = ?) ORDER BY ord LIMIT 1',
          nodeId,
        ) ?? null,
      null,
    );
  }
  return read(
    'prev',
    () =>
      db.getFirstSync(
        'SELECT id,title,page FROM nodes WHERE blocks_count > 0 AND ord < (SELECT ord FROM nodes WHERE id = ?) ORDER BY ord DESC LIMIT 1',
        nodeId,
      ) ?? null,
    null,
  );
}

export function search(db: SQLiteDatabase, query: string, limit = 80): SearchHit[] {
  const tokens = fold(query).split(' ').filter((t) => t.length > 1);
  if (!tokens.length) return [];
  return read(
    'search',
    () => {
      const like = tokens.map(() => 'si.text LIKE ?').join(' AND ');
      const params: (string | number)[] = tokens.map((t) => `%${t}%`);
      const raw = db.getAllSync<{
        block_id: number;
        node_id: number;
        si_text: string;
        title: string;
        page: number;
        level: number;
        btext: string | null;
      }>(
        `SELECT si.block_id, si.node_id, si.text AS si_text, n.title, n.page, n.level, b.text AS btext
         FROM search_index si
         JOIN nodes n ON n.id = si.node_id
         LEFT JOIN blocks b ON b.id = si.block_id
         WHERE ${like} LIMIT 600`,
        params,
      );
      const hits: SearchHit[] = raw.map((r) => {
        const body = r.btext ?? '';
        const titleFolded = fold(r.title);
        let score = 0;
        for (const t of tokens) {
          score += countOccurrences(r.si_text, t);
          if (titleFolded.includes(t)) score += 8;
        }
        return {
          nodeId: r.node_id,
          blockId: r.block_id,
          title: r.title,
          page: r.page,
          level: r.level,
          text: body,
          score,
          tokens,
        };
      });
      hits.sort((a, b) => b.score - a.score || a.page - b.page);
      return hits.slice(0, limit);
    },
    [],
  );
}

export function getBookmarks(db: SQLiteDatabase): BookmarkRow[] {
  return read(
    'bookmarks',
    () =>
      db.getAllSync<BookmarkRow>(
        `SELECT bm.*, n.title, n.page, n.level FROM bookmarks bm
         JOIN nodes n ON n.id = bm.node_id ORDER BY bm.created_at DESC`,
      ),
    [],
  );
}

export function isBookmarked(db: SQLiteDatabase, nodeId: number): boolean {
  return read(
    'isbm',
    () => !!db.getFirstSync('SELECT id FROM bookmarks WHERE node_id = ? LIMIT 1', nodeId),
    false,
  );
}

export function addBookmark(db: SQLiteDatabase, nodeId: number, snippet: string | null): boolean {
  return write('addbm', () =>
    db.runSync(
      'INSERT INTO bookmarks(node_id, block_id, snippet, created_at) VALUES(?, NULL, ?, ?)',
      nodeId,
      snippet,
      Date.now(),
    ),
  );
}

export function removeBookmark(db: SQLiteDatabase, nodeId: number): boolean {
  return write('delbm', () => db.runSync('DELETE FROM bookmarks WHERE node_id = ?', nodeId));
}

export function getProgress(
  db: SQLiteDatabase,
): { node_id: number | null; block_id: number | null; at: number } | null {
  return read(
    'progress',
    () => db.getFirstSync("SELECT node_id, block_id, at FROM progress WHERE k = 'last'") ?? null,
    null,
  );
}

export function saveProgress(db: SQLiteDatabase, nodeId: number, blockId: number | null): boolean {
  return write('saveprogress', () =>
    db.runSync(
      "INSERT INTO progress(k,node_id,block_id,at) VALUES('last',?,?,?) ON CONFLICT(k) DO UPDATE SET node_id=excluded.node_id, block_id=excluded.block_id, at=excluded.at",
      nodeId,
      blockId,
      Date.now(),
    ),
  );
}

export function getSettingPos(db: SQLiteDatabase, nodeId: number): number | null {
  const row = read<{ v: string } | null>(
    'getpos',
    () => db.getFirstSync<{ v: string }>('SELECT v FROM settings WHERE k = ?', `pos:${nodeId}`) ?? null,
    null,
  );
  return row ? Number(row.v) : null;
}

export function setSettingPos(db: SQLiteDatabase, nodeId: number, fraction: number): boolean {
  return write('setpos', () =>
    db.runSync(
      'INSERT INTO settings(k,v) VALUES(?,?) ON CONFLICT(k) DO UPDATE SET v=excluded.v',
      `pos:${nodeId}`,
      String(Math.round(fraction * 1000) / 1000),
    ),
  );
}

export function loadSettings(db: SQLiteDatabase): Settings {
  return read(
    'loadsettings',
    () => {
      const rows = db.getAllSync<{ k: string; v: string }>(
        "SELECT k,v FROM settings WHERE k IN ('fontSize','lineHeight','theme','showFootnotes','justify','lang','vibrationOn','honorifics')",
      );
      const map: Record<string, string> = {};
      for (const r of rows) map[r.k] = r.v;
      return {
        fontSize: Number(map.fontSize ?? DEFAULT_SETTINGS.fontSize),
        lineHeight: Number(map.lineHeight ?? DEFAULT_SETTINGS.lineHeight),
        theme: map.theme === 'night' ? 'night' : 'cream',
        showFootnotes: map.showFootnotes !== '0',
        justify: map.justify !== '0',
        lang: map.lang === 'en' ? 'en' : 'fa',
        vibrationOn: map.vibrationOn !== '0',
        honorifics: map.honorifics !== '0',
      };
    },
    DEFAULT_SETTINGS,
  );
}

export function saveSetting(db: SQLiteDatabase, key: string, value: string): boolean {
  return write('savesetting', () =>
    db.runSync(
      'INSERT INTO settings(k,v) VALUES(?,?) ON CONFLICT(k) DO UPDATE SET v=excluded.v',
      key,
      value,
    ),
  );
}

export function resetProgress(db: SQLiteDatabase): boolean {
  return write('reset', () => {
    db.runSync("DELETE FROM settings WHERE k LIKE 'pos:%'");
    db.runSync("UPDATE progress SET node_id = NULL, block_id = NULL, at = 0 WHERE k = 'last'");
  });
}

export function dbStats(db: SQLiteDatabase): { nodes: number; blocks: number; footnotes: number; words: number } {
  return read(
    'stats',
    () => {
      const one = (sql: string) => db.getFirstSync<{ n: number }>(sql)?.n ?? 0;
      return {
        nodes: one('SELECT COUNT(*) AS n FROM nodes'),
        blocks: one('SELECT COUNT(*) AS n FROM blocks'),
        footnotes: one('SELECT COUNT(*) AS n FROM footnotes'),
        words: one('SELECT SUM(words) AS n FROM nodes'),
      };
    },
    { nodes: 0, blocks: 0, footnotes: 0, words: 0 },
  );
}
