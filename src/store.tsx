import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { Vibration } from 'react-native';
import { useSQLiteContext } from 'expo-sqlite';
import { DEFAULT_SETTINGS, getMeta, loadSettings, saveSetting, Settings } from './db';
import { Palette, THEMES } from './theme';
import { Lang, num as numOf, t as translate } from './i18n';

type Ctx = {
  pal: Palette;
  settings: Settings;
  meta: Record<string, string>;
  setSetting: <K extends keyof Settings>(k: K, v: Settings[K]) => void;
  lang: Lang;
  t: (key: string, params?: Record<string, string | number>) => string;
  num: (value: number | string) => string;
  vibrate: () => void;
};

const AppCtx = createContext<Ctx | null>(null);

export function AppProvider({ children }: { children: React.ReactNode }) {
  const db = useSQLiteContext();
  const [settings, setSettings] = useState<Settings>(DEFAULT_SETTINGS);
  const [meta, setMeta] = useState<Record<string, string>>({});

  useEffect(() => {
    setSettings(loadSettings(db));
    setMeta(getMeta(db));
  }, [db]);

  const setSetting = useCallback(
    <K extends keyof Settings>(k: K, v: Settings[K]) => {
      const stored = typeof v === 'boolean' ? (v ? '1' : '0') : String(v);
      saveSetting(db, k, stored);
      setSettings((prev) => ({ ...prev, [k]: v }));
    },
    [db],
  );

  const lang = settings.lang;
  const t = useCallback(
    (key: string, params?: Record<string, string | number>) => translate(lang, key, params),
    [lang],
  );
  const num = useCallback((value: number | string) => numOf(lang, value), [lang]);

  const vibrationOn = settings.vibrationOn;
  const vibrate = useCallback(() => {
    if (!vibrationOn) return;
    try {
      Vibration.vibrate(12);
    } catch {
      /* devices without a vibrator simply do nothing */
    }
  }, [vibrationOn]);

  const value = useMemo<Ctx>(
    () => ({ pal: THEMES[settings.theme], settings, meta, setSetting, lang, t, num, vibrate }),
    [settings, meta, setSetting, lang, t, num, vibrate],
  );

  return <AppCtx.Provider value={value}>{children}</AppCtx.Provider>;
}

export function useApp(): Ctx {
  const ctx = useContext(AppCtx);
  if (!ctx) throw new Error('useApp must be used inside AppProvider');
  return ctx;
}

export { DEFAULT_SETTINGS };
