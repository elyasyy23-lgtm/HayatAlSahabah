# Implementation plan — App Standard Template integration

Project: `HayatAlSahabah` (Expo SDK 58, RN 0.88.1, TypeScript)
Baseline: `npx tsc --noEmit` clean, 2,457 lines in `src/`, DB `assets/db/hayat-v1.db`
(289 nodes / 955 blocks / 417 footnotes / 1,244 search rows / 118,249 words) — **frozen**.
Version stays 1.0.0 / versionCode 1. No APK until explicit approval.

---

## 1. What exists today

| Area | State |
|---|---|
| Reading engine | Reader, TOC (collapsible), Search, Bookmarks, progress/resume, font size, line height, footnote sheet, justify — all working |
| Navigation | Custom stack in `App.tsx` (Route union + BackHandler), **no drawer** |
| Theme | `cream` / `night` palettes, default **cream**; single setting stored in SQLite `settings` |
| Language | Persian strings inline in screens, **no i18n layer** |
| Screens | Home, Toc, Reader, Search, Bookmarks, Settings, About |
| DB | single volume, no `volume_id`; `progress` / `bookmarks` are global keys |
| Audit | 214 verified + 1,171 review records live only as files in Download, not in the app |
| Fonts | Vazirmatn (4 weights) + Amiri (2) bundled and loaded |

## 2. Gaps vs the template

1. Drawer navigation with 9 Persian RTL entries — **missing entirely**.
2. Volume selector (1 ready, 2–6 «به‌زودی») — **missing**; DB is single-volume.
3. Settings needs: dark default, light/dark, vibration, fa/en, (denomination → **not added**, not needed).
4. Share / Support / Donate / Debug Logs screens — **missing** (About exists).
5. Audit records (214 / 1,171) must be visible as **separate audit records**, not book text.
6. `app.json` hard-codes `userInterfaceStyle: "light"`.

## 3. Conflicts and how each is resolved

| # | Conflict | Resolution |
|---|---|---|
| C1 | No drawer; custom stack only | Add a drawer layer above the existing stack. Stack stays for Reader/TOC/Search so back behaviour is unchanged. |
| C2 | Template wants AsyncStorage; app already persists to SQLite `settings` | **Keep SQLite as the single source** (already validated, per-volume, 78/78 tested). Adding AsyncStorage creates two sources of truth that can disagree. |
| C3 | Theme default is `cream`; template wants dark by default | Default `theme: 'night'`, `app.json userInterfaceStyle: "automatic"`. Existing users keep their stored choice. |
| C4 | Single-volume DB, no `volume_id`, global progress/bookmarks | **One DB file per volume** (`hayat-v1.db`, `hayat-v2.db`, …) with the identical schema + a static catalog in `src/volumes.ts`. Gives natural per-volume progress/bookmarks and requires **zero change** to the validated v1 database. |
| C5 | No language layer; ~120 inline Persian strings | New `src/i18n.ts` (Persian string = key, English dictionary, `t()`), converted screen by screen. Layout stays RTL because the book is Persian (honest limit: full LTR flip needs an app reload via `I18nManager`). |
| C6 | No vibration capability | `expo-haptics` (bundled in Expo Go) + `vibrationOn` setting; used on sujud-free events (page turn, bookmark add, long-press). |
| C7 | Audit records not in the app | Bundle the two validated CSVs as assets; read-only `AuditScreen` reached from About. Records stay clearly separated from book text. |
| C8 | Donate wallet / Share URL unknown | `src/config.ts` with **empty** `DONATION_WALLET` and **empty** `SHARE_URL`; UI hides/blocks the button until a value is set. No payment is ever initiated. FocusBlocker URL is not used anywhere. |
| C9 | `@expo/vector-icons` fonts can fail in release APKs (learned on RakaatCounter) | Load `Ionicons.font` + `MaterialCommunityIcons.font` explicitly in `useFonts`, next to Vazirmatn/Amiri. |

## 4. Decision points (pick one each before I start)

**D1 — Drawer implementation**
1. Hand-built drawer inside a transparent `Modal` (zero new dependencies, proven twice, full RTL control) — *recommended*
2. `@react-navigation/drawer` + `react-native-screens` + `gesture-handler` + `reanimated` (standard library, 4 native deps, heavier build risk)
3. Bottom tab bar instead of a drawer (fastest access, but deviates from the template)

**D2 — Settings storage**
1. Keep SQLite `settings` as the single store (recommended)
2. Move everything to AsyncStorage as the template literally says
3. Split: reading prefs in SQLite, UI prefs in AsyncStorage

**D3 — Volume storage**
1. One DB asset per volume (recommended — v1 untouched, natural per-volume progress/bookmarks)
2. Single DB with a `volume_id` column (requires rebuilding the validated DB → not recommended)

**D4 — Language behaviour**
1. Strings switch instantly, layout stays RTL (recommended)
2. Full LTR/RTL flip with a "restart the app" notice

## 5. Files

### New
| File | Purpose |
|---|---|
| `src/config.ts` | `SHARE_URL` (empty), `DONATION_WALLET` (empty), `SUPPORT_RUBIKA='@yasmajyd'`, app meta |
| `src/volumes.ts` | Volume catalog: id, title, dbfile, status (`ready` / `soon`) |
| `src/i18n.ts` | fa/en dictionary, `t()`, digit conversion, language type |
| `src/log.ts` | Ring-buffer logger (200 entries) persisted in `settings` key `debug_log_v1` — no schema change |
| `src/components/Drawer.tsx` | RTL side drawer, 9 entries, icons, active state, backdrop, swipe-close |
| `src/screens/VolumeScreen.tsx` | Volume selector (1 active, 2–6 «به‌زودی») |
| `src/screens/ShareScreen.tsx` | Share sheet; blocked with a notice while `SHARE_URL` is empty |
| `src/screens/SupportScreen.tsx` | Rubika `@yasmajyd` card + copy |
| `src/screens/DonateScreen.tsx` | Wallet field, copy button, disabled until address is confirmed |
| `src/screens/DebugLogScreen.tsx` | Log list, copy all, clear |
| `src/screens/AuditScreen.tsx` | Two read-only tabs: 214 verified persons / 1,171 pending review |
| `assets/audit/names.csv`, `assets/audit/review.csv` | Byte-identical copies of the validated audit outputs |

### Modify
| File | Change |
|---|---|
| `App.tsx` | Drawer shell, volume state + DB remount key, i18n + log providers, StatusBar follows theme |
| `src/nav.ts` | Add routes `volumes`, `share`, `support`, `donate`, `logs`, `audit` |
| `src/db.ts` | `Settings` + `vibrationOn`, default theme `night`, log helpers (no schema change, no data rewrite) |
| `src/store.tsx` | Expose `t`, `lang`, `vibrationOn`, haptics helper |
| `src/theme.ts` | Keep palettes; add shadow presets + RTL row helper |
| `src/screens/HomeScreen.tsx` | Menu button, current-volume chip, volume shortcut |
| `src/screens/SettingsScreen.tsx` | Theme default, language selector, vibration switch, audit link |
| `src/screens/AboutScreen.tsx` | Version, sources, link to Audit records |
| `src/components/AppHeader.tsx` | Optional menu button (drawer) alongside back |
| `app.json` | `userInterfaceStyle: "automatic"`; version unchanged |

### Untouched (guaranteed)
`assets/db/hayat-v1.db`, `src/text.ts`, `src/components/BlockView.tsx`,
`src/components/FootnoteSheet.tsx`, `src/screens/{Reader,Toc,Search,Bookmarks}Screen.tsx`
(reading logic), `scripts/build_db.py`, all audit reports in Download.

## 6. Order of work

1. `config.ts`, `volumes.ts`, `i18n.ts`, `log.ts` (pure modules, no UI risk)
2. `db.ts` settings extension + `store.tsx` wiring (typecheck after)
3. Drawer + nav routes + App shell (volume key)
4. New screens (volume, share, support, donate, logs, audit)
5. Settings & About updates, Home menu button
6. Font/icon loading fix in `App.tsx` + `app.json` theme mode
7. Full pass: `npx tsc --noEmit`, `npx expo export --platform android --no-bytecode`
8. Expo Go test (`exp://127.0.0.1:8081`) → your approval → **then** version bump / CI / APK

## 7. Verification gates

- `npx tsc --noEmit` → 0 errors after every step.
- `npx expo export --platform android --no-bytecode` → exit 0 (Hermes AOT is unavailable on this phone).
- Headless DB harness re-run: v1 DB still 289/955/417/1,244 and untouched (sha256 unchanged).
- RTL smoke: every new screen in Persian, drawer opens/closes, Android back closes drawer first.
- Audit screen rows: 214 and 1,171 exactly.

## 8. Not doing without approval

APK build, version bump, GitHub release, honorific insertion/replacement,
attributing any of the 1,171 unresolved names, editing book text or the database.
