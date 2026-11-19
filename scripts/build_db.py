#!/usr/bin/env python3
"""Build the offline reader database for Hayat al-Sahabah Vol.1.

Sources (unchanged):
  proto/book.json  — text/hierarchy/footnotes extracted from the validated DOCX
  rows_v2.json     — verified printed page per heading (Phase 1 result)

Output: assets/db/hayat-v<N>.db  (shipped inside the app, read-only data
+ writable tables for bookmarks / progress / settings)

Rules: text is copied byte-for-byte (footnote markers U+FDD0..U+FDD1 kept).
Nothing is rewritten, reordered or dropped.
"""
import json, os, re, sqlite3, sys, unicodedata

HERE = os.path.dirname(os.path.abspath(__file__))
PROJ = os.path.dirname(HERE)
HAYAT = os.environ.get("HAYAT_DIR", os.path.join(os.environ.get("TMPDIR", "/tmp"), "zyvo/hayat"))
BOOK = os.path.join(HAYAT, "proto/book.json")
ROWS = os.path.join(HAYAT, "rows_v2.json")
VERSION = sys.argv[1] if len(sys.argv) > 1 else "1"
OUT = os.path.join(PROJ, "assets/db/hayat-v%s.db" % VERSION)

book = json.load(open(BOOK, encoding="utf-8"))
rows = json.load(open(ROWS, encoding="utf-8"))
assert len(rows) == 289, len(rows)

def norm(s):
    return re.sub(r"\s+", " ", s).strip()

# ---------- flatten tree in document order ----------
flat = []  # (node, parent_id)
def walk(ns, parent):
    for n in ns:
        nid = len(flat) + 1
        flat.append((n, parent))
        walk(n.get("children") or [], nid)
walk(book["chapters"], None)
assert len(flat) == 289, len(flat)

# map node -> verified page (same order as Phase 1 heading list)
mismatch = []
for idx, (n, _) in enumerate(flat):
    r = rows[idx]
    a, b = norm(n["title"]), norm(r["title"])
    if a != b:
        mismatch.append((idx + 1, a[:40], b[:40]))
print("title mismatches vs rows_v2:", len(mismatch))
for m in mismatch[:5]:
    print("   ", m)

def fold(s):
    s = unicodedata.normalize("NFKC", s)
    for a, b in [("ى", "ی"), ("ي", "ی"), ("ك", "ک"), ("ۀ", "ه"), ("ة", "ه"),
                 ("أ", "ا"), ("إ", "ا"), ("آ", "ا"), ("ؤ", "و"), ("ئ", "ی"),
                 ("ـ", "")]:
        s = s.replace(a, b)
    s = re.sub(r"[\u064B-\u0652\u0670\u0640\u200c\u200d\uFDD0\uFDD1]", " ", s)
    s = re.sub(r"[^0-9A-Za-z\u0600-\u06FF]+", " ", s)
    return re.sub(r"\s+", " ", s).strip()

def strip_markers(t):
    return re.sub(r"[\uFDD0\uFDD1]\d*", "", t)

if os.path.exists(OUT):
    os.remove(OUT)
os.makedirs(os.path.dirname(OUT), exist_ok=True)
db = sqlite3.connect(OUT)
db.executescript("""
PRAGMA journal_mode=DELETE;
CREATE TABLE meta(k TEXT PRIMARY KEY, v TEXT);
CREATE TABLE nodes(
  id INTEGER PRIMARY KEY, parent_id INTEGER, level INTEGER, ord INTEGER,
  title TEXT NOT NULL, page INTEGER, word_page INTEGER, delta INTEGER,
  toc_disp TEXT, path TEXT, blocks_count INTEGER, words INTEGER);
CREATE TABLE blocks(
  id INTEGER PRIMARY KEY, node_id INTEGER NOT NULL, ord INTEGER NOT NULL,
  kind TEXT NOT NULL, text TEXT, jc TEXT, rows_json TEXT, fn_ids TEXT);
CREATE TABLE footnotes(id INTEGER PRIMARY KEY, num INTEGER, text TEXT NOT NULL);
CREATE TABLE footnote_use(fn_id INTEGER, node_id INTEGER, block_id INTEGER);
CREATE TABLE search_index(block_id INTEGER PRIMARY KEY, node_id INTEGER, text TEXT NOT NULL);
CREATE TABLE bookmarks(
  id INTEGER PRIMARY KEY AUTOINCREMENT, node_id INTEGER NOT NULL,
  block_id INTEGER, snippet TEXT, created_at INTEGER NOT NULL);
CREATE TABLE progress(k TEXT PRIMARY KEY, node_id INTEGER, block_id INTEGER, at INTEGER);
CREATE TABLE settings(k TEXT PRIMARY KEY, v TEXT);
CREATE INDEX idx_nodes_parent ON nodes(parent_id);
CREATE INDEX idx_nodes_ord ON nodes(ord);
CREATE INDEX idx_blocks_node ON blocks(node_id, ord);
CREATE INDEX idx_fuse_node ON footnote_use(node_id);
""")

fn = book["footnotes"]
for k, v in fn.items():
    db.execute("INSERT INTO footnotes(id,num,text) VALUES(?,?,?)", (int(k), int(k), v))

bid = 0
used = set()
words_total = 0
for idx, (n, parent_id) in enumerate(flat):
    r = rows[idx]
    nid = idx + 1
    # path of titles
    chain = []
    p = parent_id
    while p:
        chain.append(flat[p - 1][0]["title"])
        p = flat[p - 1][1]
    path = " › ".join(list(reversed(chain)))
    bl = n.get("blocks") or []
    wc = 0
    for b in bl:
        txt = b.get("text")
        if txt is None and b.get("rows") is not None:
            txt = " ".join(" ".join(c) for c in b["rows"])
        wc += len((txt or "").split())
    db.execute(
        "INSERT INTO nodes(id,parent_id,level,ord,title,page,word_page,delta,toc_disp,path,blocks_count,words)"
        " VALUES(?,?,?,?,?,?,?,?,?,?,?,?)",
        (nid, parent_id, n["level"], idx, n["title"], r["page"], r["word_page"],
         r["delta"], str(r.get("toc_disp") or ""), path, len(bl), wc))
    words_total += wc
    if n.get("footnotes"):  # heading-level footnote references
        for fid in n["footnotes"]:
            used.add(int(fid))
            db.execute("INSERT INTO footnote_use(fn_id,node_id,block_id) VALUES(?,?,NULL)", (int(fid), nid))
    for bi, b in enumerate(bl):
        bid += 1
        kind = b["type"]
        text = b.get("text")
        rows_json = None
        if kind == "table":
            rows_json = json.dumps(b["rows"], ensure_ascii=False)
            text = "\n".join(" | ".join(c for c in row) for row in b["rows"])
        fids = [int(x) for x in (b.get("footnotes") or [])]
        for f in fids:
            used.add(f)
        db.execute("INSERT INTO blocks(id,node_id,ord,kind,text,jc,rows_json,fn_ids) VALUES(?,?,?,?,?,?,?,?)",
                   (bid, nid, bi, kind, text, b.get("jc"), rows_json,
                    ",".join(str(f) for f in fids) if fids else None))
        for f in fids:
            db.execute("INSERT INTO footnote_use(fn_id,node_id,block_id) VALUES(?,?,?)", (f, nid, bid))
        db.execute("INSERT INTO search_index(block_id,node_id,text) VALUES(?,?,?)",
                   (bid, nid, fold(strip_markers(text or ""))))
    # heading itself is searchable
    db.execute("INSERT INTO search_index(block_id,node_id,text) VALUES(?,?,?)",
               (-nid, nid, fold(n["title"])))

db.executemany("INSERT INTO settings(k,v) VALUES(?,?)", [
    ("fontSize", "18"), ("lineHeight", "1.9"), ("theme", "cream"),
    ("showFootnotes", "1"), ("arabicFont", "amiri"), ("justify", "1"),
])
db.execute("INSERT INTO progress(k,node_id,block_id,at) VALUES('last',NULL,NULL,0)")

meta = {
    "title": book["meta"]["title"], "author": book["meta"]["author"],
    "translator": book["meta"]["translator"], "pages": str(book["meta"]["pages"]),
    "footnotes": str(len(fn)), "nodes": str(len(flat)), "blocks": str(bid),
    "words": str(words_total), "dbVersion": VERSION,
    "source": "hayate-sahabah-1-Word.docx (unchanged)",
}
db.executemany("INSERT INTO meta(k,v) VALUES(?,?)", list(meta.items()))
db.commit()

# ---------- integrity checks ----------
q = lambda s, *a: db.execute(s, a).fetchone()[0]
checks = {
    "nodes": q("SELECT COUNT(*) FROM nodes"),
    "blocks": q("SELECT COUNT(*) FROM blocks"),
    "footnotes": q("SELECT COUNT(*) FROM footnotes"),
    "footnote_use rows": q("SELECT COUNT(*) FROM footnote_use"),
    "footnotes used": q("SELECT COUNT(DISTINCT fn_id) FROM footnote_use"),
    "unused footnotes": q("SELECT COUNT(*) FROM footnotes WHERE id NOT IN (SELECT fn_id FROM footnote_use)"),
    "blocks with markers": q("SELECT COUNT(*) FROM blocks WHERE text LIKE '%'||char(63792)||'%'"),
    "search rows": q("SELECT COUNT(*) FROM search_index"),
    "words": q("SELECT SUM(words) FROM nodes"),
}
for k, v in checks.items():
    print(f"  {k}: {v}")
print("used set size:", len(used), "of", len(fn))
print("bytes:", os.path.getsize(OUT))
db.execute("VACUUM")
db.close()
print("OK ->", OUT)
