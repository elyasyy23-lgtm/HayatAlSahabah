import React, { useEffect, useMemo, useRef, useState } from 'react';
import { View, Text, TextInput, StyleSheet, FlatList, Pressable, type TextInputInstance } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useSQLiteContext } from 'expo-sqlite';
import { useApp } from '../store';
import { FONTS, LEVEL_LABEL } from '../theme';
import { fold, snippet, toFa } from '../text';
import { search, SearchHit } from '../db';
import { Nav } from '../nav';
import { AppHeader } from '../components/AppHeader';

function Highlighted({ text, tokens, color, hl }: { text: string; tokens: string[]; color: string; hl: string }) {
  const words = text.split(/(\s+)/);
  return (
    <Text style={{ color, fontFamily: FONTS.regular }} allowFontScaling={false}>
      {words.map((w, i) => {
        const f = fold(w);
        const hit = f.length > 0 && tokens.some((t) => f.includes(t));
        return (
          <Text key={i} style={hit ? { color: hl, fontFamily: FONTS.semi } : undefined}>
            {w}
          </Text>
        );
      })}
    </Text>
  );
}

export function SearchScreen({ nav }: { nav: Nav }) {
  const db = useSQLiteContext();
  const { pal } = useApp();
  const [q, setQ] = useState('');
  const [hits, setHits] = useState<SearchHit[]>([]);
  const [busy, setBusy] = useState(false);
  const [took, setTook] = useState(0);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const inputRef = useRef<TextInputInstance>(null);

  useEffect(() => {
    const t = setTimeout(() => inputRef.current?.focus(), 250);
    return () => clearTimeout(t);
  }, []);

  useEffect(() => {
    if (timer.current) clearTimeout(timer.current);
    const query = q.trim();
    if (fold(query).length < 2) {
      setHits([]);
      setBusy(false);
      return;
    }
    setBusy(true);
    timer.current = setTimeout(() => {
      const start = Date.now();
      const res = search(db, query);
      setTook(Date.now() - start);
      setHits(res);
      setBusy(false);
    }, 260);
    return () => {
      if (timer.current) clearTimeout(timer.current);
    };
  }, [db, q]);

  const tokens = useMemo(() => fold(q).split(' ').filter((t) => t.length > 1), [q]);

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: pal.bg }]} edges={['top']}>
      <AppHeader pal={pal} title="جستجو در متن" subtitle="جستجوی آفلاین در سراسر کتاب" onBack={nav.back} />

      <View style={[styles.searchWrap, { backgroundColor: pal.surface, borderColor: pal.border }]}>
        <Ionicons name="search-outline" size={18} color={pal.muted} />
        <TextInput
          ref={inputRef}
          value={q}
          onChangeText={setQ}
          placeholder="واژه یا عبارت…"
          placeholderTextColor={pal.muted}
          style={[styles.input, { color: pal.text }]}
          textAlign="right"
          allowFontScaling={false}
          returnKeyType="search"
        />
        {q ? (
          <Pressable onPress={() => setQ('')} hitSlop={8} accessibilityLabel="پاک کردن">
            <Ionicons name="close-circle" size={18} color={pal.muted} />
          </Pressable>
        ) : null}
      </View>

      <View style={styles.statusRow}>
        <Text style={[styles.status, { color: pal.muted }]}>
          {busy
            ? 'در حال جستجو…'
            : hits.length
              ? `${toFa(hits.length)} نتیجه در ${toFa(took)} میلی‌ثانیه`
              : fold(q).length >= 2
                ? 'نتیجه‌ای یافت نشد.'
                : 'دست‌کم دو حرف بنویسید.'}
        </Text>
      </View>

      <FlatList
        data={hits}
        keyExtractor={(h) => `${h.nodeId}-${h.blockId}`}
        keyboardShouldPersistTaps="handled"
        contentContainerStyle={{ paddingHorizontal: 14, paddingBottom: 30 }}
        renderItem={({ item }) => (
          <Pressable
            onPress={() => nav.go({ name: 'reader', nodeId: item.nodeId, blockId: item.blockId })}
            style={({ pressed }) => [
              styles.card,
              { backgroundColor: pal.surface, borderColor: pal.border, opacity: pressed ? 0.7 : 1 },
            ]}
          >
            <View style={styles.cardHead}>
              <Text numberOfLines={1} style={[styles.cardTitle, { color: pal.text }]}>
                {item.title}
              </Text>
              <View style={[styles.badge, { backgroundColor: pal.accentSoft }]}>
                <Text style={[styles.badgeText, { color: pal.accent }]}>{toFa(item.page)}</Text>
              </View>
            </View>
            <Text style={[styles.cardMeta, { color: pal.muted }]}>
              {LEVEL_LABEL[item.level] ?? 'بخش'}
            </Text>
            {item.text ? (
              <View style={{ marginTop: 6 }}>
                <Highlighted
                  text={snippet(item.text, tokens)}
                  tokens={tokens}
                  color={pal.muted}
                  hl={pal.accent}
                />
              </View>
            ) : null}
          </Pressable>
        )}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1 },
  searchWrap: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    gap: 8,
    marginHorizontal: 14,
    marginTop: 12,
    paddingHorizontal: 12,
    height: 46,
    borderRadius: 15,
    borderWidth: 1,
  },
  input: { flex: 1, fontFamily: FONTS.regular, fontSize: 14, paddingVertical: 0 },
  statusRow: { paddingHorizontal: 18, paddingTop: 10, paddingBottom: 6 },
  status: { fontFamily: FONTS.regular, fontSize: 11, textAlign: 'right' },
  card: { borderWidth: 1, borderRadius: 16, padding: 13, marginBottom: 10 },
  cardHead: { flexDirection: 'row-reverse', alignItems: 'center', gap: 8 },
  cardTitle: { flex: 1, fontFamily: FONTS.semi, fontSize: 13.5, textAlign: 'right' },
  badge: { minWidth: 30, paddingHorizontal: 6, paddingVertical: 3, borderRadius: 8, alignItems: 'center' },
  badgeText: { fontFamily: FONTS.semi, fontSize: 10.5 },
  cardMeta: { fontFamily: FONTS.regular, fontSize: 10, textAlign: 'right', marginTop: 3 },
});
