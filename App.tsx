import React, { Component, useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { View, StatusBar, BackHandler, Text, ActivityIndicator, StyleSheet, Pressable } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { SQLiteProvider, useSQLiteContext, type SQLiteDatabase } from 'expo-sqlite';
import { useFonts } from 'expo-font';
import { Ionicons } from '@expo/vector-icons';
import { AppProvider, useApp } from './src/store';
import { FONTS, THEMES } from './src/theme';
import { Route } from './src/nav';
import { assertDbReady, clearDbError } from './src/db';
import { DEFAULT_VOLUME_ID, volumeAssetSource, volumeById } from './src/volumes';
import { Drawer } from './src/components/Drawer';
import { UpdateModal } from './src/components/UpdateModal';
import { UpdateInfo, fetchUpdateInfo, shouldNotify } from './src/update';
import { HomeScreen } from './src/screens/HomeScreen';
import { TocScreen } from './src/screens/TocScreen';
import { ReaderScreen } from './src/screens/ReaderScreen';
import { SearchScreen } from './src/screens/SearchScreen';
import { BookmarksScreen } from './src/screens/BookmarksScreen';
import { SettingsScreen } from './src/screens/SettingsScreen';
import { AboutScreen } from './src/screens/AboutScreen';
import { VolumesScreen } from './src/screens/VolumesScreen';
import { HelpScreen } from './src/screens/HelpScreen';
import { ShareScreen } from './src/screens/ShareScreen';
import { SupportScreen } from './src/screens/SupportScreen';
import { DonateScreen } from './src/screens/DonateScreen';
import { LogsScreen } from './src/screens/LogsScreen';
import { AuditScreen } from './src/screens/AuditScreen';

/**
 * Module-scope constants: their identity never changes between renders.
 * <SQLiteProvider> re-runs its setup effect when `assetSource` or `onInit`
 * change identity — an inline arrow here used to close and reopen the
 * connection on every App render, which closed the handle under screens that
 * were already reading from it ("Access to closed resource").
 */
async function onDbInit(_db: SQLiteDatabase): Promise<void> {
  // The bundled database is prebuilt with its full schema and data.
  // Nothing to create or migrate; this hook exists only to keep the
  // provider's options stable.
}

function Splash({ label }: { label: string }) {
  const pal = THEMES.cream;
  return (
    <View style={[styles.center, { backgroundColor: pal.bg }]}>
      <ActivityIndicator color={pal.accent} />
      <Text style={[styles.splashText, { color: pal.muted }]}>{label}</Text>
    </View>
  );
}

function ErrorCard({ title, detail, onRetry }: { title: string; detail?: string | null; onRetry: () => void }) {
  const pal = THEMES.cream;
  return (
    <View style={[styles.center, { backgroundColor: pal.bg, padding: 28 }]}>
      <Ionicons name="alert-circle-outline" size={38} color={pal.gold} />
      <Text style={[styles.errTitle, { color: pal.text }]}>{title}</Text>
      {detail ? (
        <Text style={[styles.errDetail, { color: pal.muted }]} numberOfLines={4}>
          {detail}
        </Text>
      ) : null}
      <Pressable
        onPress={onRetry}
        style={({ pressed }) => [
          styles.retry,
          { backgroundColor: pal.accent, opacity: pressed ? 0.85 : 1 },
        ]}
      >
        <Text style={[styles.retryText, { color: pal.onAccent }]}>تلاش دوباره</Text>
      </Pressable>
    </View>
  );
}

type BoundaryState = { message: string | null };

/** Any render/query failure shows a Persian recoverable screen instead of RN's red error. */
class ErrorBoundary extends Component<{ children: React.ReactNode }, BoundaryState> {
  state: BoundaryState = { message: null };

  static getDerivedStateFromError(error: Error): BoundaryState {
    return { message: error?.message ?? String(error) };
  }

  componentDidCatch(error: Error, info: React.ErrorInfo) {
    console.warn('[render]', error?.message, info?.componentStack);
  }

  reset = () => {
    clearDbError();
    this.setState({ message: null });
  };

  render() {
    if (this.state.message) {
      return (
        <ErrorCard
          title="خطا در نمایش کتاب"
          detail={this.state.message}
          onRetry={this.reset}
        />
      );
    }
    return this.props.children;
  }
}

/**
 * Renders nothing until the shared connection answers a trivial query, so no
 * screen effect can run against a half-opened database.
 */
function DbGate({ children }: { children: React.ReactNode }) {
  const db = useSQLiteContext();
  const [state, setState] = useState<'checking' | 'ready' | 'failed'>('checking');
  const [detail, setDetail] = useState<string | null>(null);

  const check = useCallback(() => {
    setState('checking');
    setDetail(null);
    try {
      assertDbReady(db);
      setState('ready');
    } catch (e) {
      setDetail((e as Error)?.message ?? String(e));
      setState('failed');
    }
  }, [db]);

  useEffect(check, [check]);

  if (state === 'checking') return <Splash label="در حال باز کردن کتاب…" />;
  if (state === 'failed') {
    return <ErrorCard title="باز کردن پایگاه داده ممکن نشد" detail={detail} onRetry={check} />;
  }
  return <>{children}</>;
}

type ShellProps = {
  volumeId: number;
  onVolumeChange: (id: number) => void;
};

function Shell({ volumeId, onVolumeChange }: ShellProps) {
  const { pal, t, lang } = useApp();
  const [stack, setStack] = useState<Route[]>([{ name: 'home' }]);
  const [drawerOpen, setDrawerOpen] = useState(false);

  const go = useCallback((r: Route) => setStack((s) => [...s, r]), []);
  const back = useCallback(
    () => setStack((s) => (s.length > 1 ? s.slice(0, s.length - 1) : s)),
    [],
  );
  const openDrawer = useCallback(() => setDrawerOpen(true), []);

  const nav = useMemo(() => ({ go, back, openDrawer }), [go, back, openDrawer]);

  /** Drawer entries replace the stack instead of growing it. */
  const jump = useCallback((r: Route) => {
    setDrawerOpen(false);
    setStack([r]);
  }, []);

  useEffect(() => {
    const sub = BackHandler.addEventListener('hardwareBackPress', () => {
      if (drawerOpen) {
        setDrawerOpen(false);
        return true;
      }
      if (stack.length > 1) {
        back();
        return true;
      }
      return false;
    });
    return () => sub.remove();
  }, [stack.length, back, drawerOpen]);

  const route = stack[stack.length - 1];

  /**
   * Update notice: checked once per launch (and again whenever Settings
   * opens). Silent on every failure, never blocks the reader.
   */
  const [update, setUpdate] = useState<UpdateInfo | null>(null);
  const [updateOpen, setUpdateOpen] = useState(false);
  const lastUpdateCheck = useRef(0);

  const checkUpdates = useCallback(async () => {
    const now = Date.now();
    if (now - lastUpdateCheck.current < 5 * 60 * 1000) return;
    lastUpdateCheck.current = now;
    const info = await fetchUpdateInfo();
    if (shouldNotify(info)) {
      setUpdate(info);
      setUpdateOpen(true);
    }
  }, []);

  useEffect(() => {
    void checkUpdates();
  }, [checkUpdates]);

  useEffect(() => {
    if (route.name === 'settings') void checkUpdates();
  }, [route.name, checkUpdates]);

  const screen = (() => {
    switch (route.name) {
      case 'toc':
        return <TocScreen nav={nav} />;
      case 'reader':
        return <ReaderScreen nav={nav} nodeId={route.nodeId} targetBlockId={route.blockId} />;
      case 'search':
        return <SearchScreen nav={nav} />;
      case 'bookmarks':
        return <BookmarksScreen nav={nav} />;
      case 'settings':
        return <SettingsScreen nav={nav} />;
      case 'about':
        return <AboutScreen nav={nav} />;
      case 'volumes':
        return (
          <VolumesScreen
            nav={nav}
            activeVolume={volumeId}
            onSelectVolume={(id) => {
              if (id === volumeId) {
                nav.back();
                return;
              }
              onVolumeChange(id);
              jump({ name: 'home' });
            }}
          />
        );
      case 'help':
        return <HelpScreen nav={nav} />;
      case 'share':
        return <ShareScreen nav={nav} />;
      case 'support':
        return <SupportScreen nav={nav} />;
      case 'donate':
        return <DonateScreen nav={nav} />;
      case 'logs':
        return <LogsScreen nav={nav} />;
      case 'audit':
        return <AuditScreen nav={nav} />;
      default:
        return <HomeScreen nav={nav} volume={volumeById(volumeId)} />;
    }
  })();

  return (
    <View style={[styles.flex, { backgroundColor: pal.bg }]}>
      <StatusBar barStyle={pal.name === 'night' ? 'light-content' : 'dark-content'} />
      <View
        key={`${stack.length}-${route.name === 'reader' ? route.nodeId : ''}-${route.name}`}
        style={styles.flex}
      >
        {screen}
      </View>
      <Drawer visible={drawerOpen} active={route.name} onClose={() => setDrawerOpen(false)} onSelect={jump} />
      <UpdateModal
        visible={updateOpen}
        info={update}
        pal={pal}
        lang={lang}
        latestLabel={lang === 'en' ? 'Latest version' : 'نسخهٔ تازه:'}
        nowLabel={t('update.now')}
        laterLabel={t('update.later')}
        onClose={() => setUpdateOpen(false)}
      />
    </View>
  );
}

export default function App() {
  const [volumeId, setVolumeId] = useState<number>(DEFAULT_VOLUME_ID);
  const volume = volumeById(volumeId);

  /** Stable per volume: a stable identity keeps the provider from reopening. */
  const assetSource = useMemo(() => volumeAssetSource(volume), [volume]);

  const [fontsLoaded, fontError] = useFonts({
    'Vazirmatn-Regular': require('./assets/fonts/Vazirmatn-Regular.ttf'),
    'Vazirmatn-Medium': require('./assets/fonts/Vazirmatn-Medium.ttf'),
    'Vazirmatn-SemiBold': require('./assets/fonts/Vazirmatn-SemiBold.ttf'),
    'Vazirmatn-Bold': require('./assets/fonts/Vazirmatn-Bold.ttf'),
    'Amiri-Regular': require('./assets/fonts/Amiri-Regular.ttf'),
    'Amiri-Bold': require('./assets/fonts/Amiri-Bold.ttf'),
  });

  if (!fontsLoaded && !fontError) {
    return <Splash label="در حال آماده‌سازی فونت‌ها…" />;
  }

  return (
    <SafeAreaProvider>
      <ErrorBoundary>
        <SQLiteProvider
          key={`vol-${volume.id}`}
          databaseName={volume.dbName}
          assetSource={assetSource}
          onInit={onDbInit}
          useSuspense={false}
        >
          <DbGate>
            <AppProvider>
              <Shell volumeId={volume.id} onVolumeChange={setVolumeId} />
            </AppProvider>
          </DbGate>
        </SQLiteProvider>
      </ErrorBoundary>
    </SafeAreaProvider>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  splashText: { fontFamily: FONTS.medium, fontSize: 12.5, marginTop: 12 },
  errTitle: { fontFamily: FONTS.bold, fontSize: 16, marginTop: 12, textAlign: 'center' },
  errDetail: { fontFamily: FONTS.regular, fontSize: 11.5, marginTop: 8, textAlign: 'center', lineHeight: 20 },
  retry: { marginTop: 18, paddingHorizontal: 22, paddingVertical: 11, borderRadius: 14 },
  retryText: { fontFamily: FONTS.semi, fontSize: 13 },
});
