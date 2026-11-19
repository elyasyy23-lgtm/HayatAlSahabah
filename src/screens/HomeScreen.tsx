import React, { useEffect, useState } from 'react';
import { View, Text, Pressable, StyleSheet, ScrollView } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useSQLiteContext } from 'expo-sqlite';
import { useApp } from '../store';
import { FONTS } from '../theme';

import { dbStats, getNode, getProgress } from '../db';
import { Nav } from '../nav';
import { AppHeader } from '../components/AppHeader';
import { VolumeDef } from '../volumes';

type Tile = {
  key: string;
  label: string;
  hint: string;
  icon: React.ComponentProps<typeof Ionicons>['name'];
  onPress: () => void;
};

export function HomeScreen({ nav, volume }: { nav: Nav; volume: VolumeDef }) {
  const db = useSQLiteContext();
  const { pal, meta, t, num, lang } = useApp();
  const [resume, setResume] = useState<{ id: number; title: string; page: number } | null>(null);
  const [stats, setStats] = useState({ nodes: 0, blocks: 0, footnotes: 0, words: 0 });

  useEffect(() => {
    // Reads run only after mount (never during render) and every db call is guarded.
    setStats(dbStats(db));
    const p = getProgress(db);
    if (p?.node_id) {
      const n = getNode(db, p.node_id);
      setResume(n ? { id: n.id, title: n.title, page: n.page } : null);
    } else {
      setResume(null);
    }
  }, [db]);

  const tiles: Tile[] = [
    {
      key: 'toc',
      label: t('home.toc'),
      hint: t('home.titlesCount'),
      icon: 'list-outline',
      onPress: () => nav.go({ name: 'toc' }),
    },
    {
      key: 'search',
      label: t('home.search'),
      hint: t('home.offline'),
      icon: 'search-outline',
      onPress: () => nav.go({ name: 'search' }),
    },
    {
      key: 'bookmarks',
      label: t('home.bookmarks'),
      hint: t('home.savedByMe'),
      icon: 'bookmark-outline',
      onPress: () => nav.go({ name: 'bookmarks' }),
    },
    {
      key: 'settings',
      label: t('settings.reading'),
      hint: t('home.fontTheme'),
      icon: 'options-outline',
      onPress: () => nav.go({ name: 'settings' }),
    },
  ];

  const title = (meta.title ?? 'حیات صحابه — جلد اول').split('—')[0].trim();

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: pal.bg }]} edges={['top']}>
      <AppHeader pal={pal} title={t('app.name')} onMenu={nav.openDrawer} />
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <View style={[styles.hero, { backgroundColor: pal.surface, borderColor: pal.border }]}>
          <View style={[styles.rule, { backgroundColor: pal.gold }]} />
          <Text style={[styles.heroTitle, { color: pal.text }]}>{title}</Text>
          <Text style={[styles.heroVol, { color: pal.gold }]}>{lang === 'fa' ? volume.titleFa : volume.titleEn}</Text>
          <View style={[styles.divider, { backgroundColor: pal.border }]} />
          <Text style={[styles.heroMeta, { color: pal.muted }]}>
            {t('home.author')}: {meta.author ?? 'علّامه شیخ محمّد یوسف کاندهلوی'}
          </Text>
          <Text style={[styles.heroMeta, { color: pal.muted }]}>
            {t('home.translator')}: {meta.translator ?? 'مجیب‌الرحمان رحیمی'}
          </Text>
        </View>

        {resume ? (
          <Pressable
            onPress={() => nav.go({ name: 'reader', nodeId: resume.id })}
            style={({ pressed }) => [
              styles.resume,
              { backgroundColor: pal.accent, opacity: pressed ? 0.9 : 1 },
            ]}
          >
            <View style={styles.resumeIcon}>
              <Ionicons name="book-outline" size={20} color={pal.onAccent} />
            </View>
            <View style={styles.resumeText}>
              <Text style={[styles.resumeLabel, { color: pal.onAccent }]}>{t('home.continue')}</Text>
              <Text numberOfLines={1} style={[styles.resumeTitle, { color: pal.onAccent }]}>
                {resume.title}
              </Text>
              <Text style={[styles.resumePage, { color: pal.onAccent }]}>
                {t('home.page', { n: num(resume.page) })}
              </Text>
            </View>
            <Ionicons name="chevron-back" size={18} color={pal.onAccent} />
          </Pressable>
        ) : (
          <Pressable
            onPress={() => nav.go({ name: 'toc' })}
            style={({ pressed }) => [
              styles.resume,
              { backgroundColor: pal.accent, opacity: pressed ? 0.9 : 1 },
            ]}
          >
            <View style={styles.resumeIcon}>
              <Ionicons name="play" size={20} color={pal.onAccent} />
            </View>
            <View style={styles.resumeText}>
              <Text style={[styles.resumeLabel, { color: pal.onAccent }]}>{t('home.start')}</Text>
              <Text style={[styles.resumeTitle, { color: pal.onAccent }]}>
                {t('home.fromStart')}
              </Text>
            </View>
            <Ionicons name="chevron-back" size={18} color={pal.onAccent} />
          </Pressable>
        )}

        <View style={styles.grid}>
          {tiles.map((t) => (
            <Pressable
              key={t.key}
              onPress={t.onPress}
              style={({ pressed }) => [
                styles.tile,
                {
                  backgroundColor: pal.surface,
                  borderColor: pal.border,
                  opacity: pressed ? 0.7 : 1,
                },
              ]}
            >
              <View style={[styles.tileIcon, { backgroundColor: pal.accentSoft }]}>
                <Ionicons name={t.icon} size={20} color={pal.accent} />
              </View>
              <Text style={[styles.tileLabel, { color: pal.text }]}>{t.label}</Text>
              <Text style={[styles.tileHint, { color: pal.muted }]}>{t.hint}</Text>
            </Pressable>
          ))}
        </View>

        <View style={styles.statsRow}>
          {[
            { label: t('home.titles'), value: num(stats.nodes) },
            { label: t('home.footnotes'), value: num(stats.footnotes) },
            { label: t('home.words'), value: num(stats.words) },
          ].map((s) => (
            <View
              key={s.label}
              style={[styles.stat, { backgroundColor: pal.bgAlt, borderColor: pal.border }]}
            >
              <Text style={[styles.statValue, { color: pal.text }]}>{s.value}</Text>
              <Text style={[styles.statLabel, { color: pal.muted }]}>{s.label}</Text>
            </View>
          ))}
        </View>

        <Pressable
          onPress={() => nav.go({ name: 'about' })}
          style={({ pressed }) => [
            styles.aboutRow,
            { borderColor: pal.border, backgroundColor: pal.surface, opacity: pressed ? 0.7 : 1 },
          ]}
        >
          <Ionicons name="information-circle-outline" size={19} color={pal.accent} />
          <Text style={[styles.aboutText, { color: pal.text }]}>{t('about.subtitle')}</Text>
          <Ionicons name="chevron-back" size={16} color={pal.muted} />
        </Pressable>

        <Text style={[styles.footer, { color: pal.muted }]}>
          {t('home.offlineFooter')}
        </Text>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1 },
  content: { padding: 16, paddingBottom: 32 },
  hero: { borderRadius: 22, borderWidth: 1, padding: 20, alignItems: 'center' },
  rule: { width: 36, height: 3, borderRadius: 2, marginBottom: 14 },
  heroTitle: { fontFamily: FONTS.bold, fontSize: 27, textAlign: 'center' },
  heroVol: { fontFamily: FONTS.semi, fontSize: 13, marginTop: 6 },
  divider: { height: 1, width: '55%', marginVertical: 14 },
  heroMeta: { fontFamily: FONTS.regular, fontSize: 12.5, textAlign: 'center', lineHeight: 22 },
  resume: {
    marginTop: 14,
    borderRadius: 18,
    padding: 14,
    flexDirection: 'row-reverse',
    alignItems: 'center',
    gap: 12,
  },
  resumeIcon: {
    width: 40,
    height: 40,
    borderRadius: 13,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FFFFFF22',
  },
  resumeText: { flex: 1, alignItems: 'flex-end' },
  resumeLabel: { fontFamily: FONTS.medium, fontSize: 11.5, opacity: 0.85 },
  resumeTitle: { fontFamily: FONTS.semi, fontSize: 14.5, marginTop: 2 },
  resumePage: { fontFamily: FONTS.regular, fontSize: 11, opacity: 0.8, marginTop: 2 },
  grid: {
    marginTop: 14,
    flexDirection: 'row-reverse',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    rowGap: 12,
  },
  tile: { width: '48.5%', borderRadius: 18, borderWidth: 1, padding: 14 },
  tileIcon: {
    width: 38,
    height: 38,
    borderRadius: 13,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 10,
  },
  tileLabel: { fontFamily: FONTS.semi, fontSize: 14, textAlign: 'right' },
  tileHint: { fontFamily: FONTS.regular, fontSize: 11, marginTop: 3, textAlign: 'right' },
  statsRow: { flexDirection: 'row-reverse', gap: 10, marginTop: 14 },
  stat: { flex: 1, borderRadius: 16, borderWidth: 1, paddingVertical: 12, alignItems: 'center' },
  statValue: { fontFamily: FONTS.bold, fontSize: 15 },
  statLabel: { fontFamily: FONTS.regular, fontSize: 10.5, marginTop: 3 },
  aboutRow: {
    marginTop: 14,
    borderRadius: 16,
    borderWidth: 1,
    paddingHorizontal: 14,
    paddingVertical: 14,
    flexDirection: 'row-reverse',
    alignItems: 'center',
    gap: 10,
  },
  aboutText: { flex: 1, fontFamily: FONTS.medium, fontSize: 13, textAlign: 'right' },
  footer: {
    textAlign: 'center',
    fontFamily: FONTS.regular,
    fontSize: 10.5,
    marginTop: 22,
  },
});
