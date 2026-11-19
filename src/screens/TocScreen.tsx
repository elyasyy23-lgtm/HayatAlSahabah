import React, { useEffect, useMemo, useState } from 'react';
import { View, Text, Pressable, StyleSheet, FlatList, TextInput } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useSQLiteContext } from 'expo-sqlite';
import { useApp } from '../store';
import { FONTS, LEVEL_LABEL } from '../theme';
import { fold, toFa } from '../text';
import { getAllNodes, NodeRow } from '../db';
import { Nav } from '../nav';
import { AppHeader, IconButton } from '../components/AppHeader';

export function TocScreen({ nav }: { nav: Nav }) {
  const db = useSQLiteContext();
  const { pal } = useApp();
  const [all, setAll] = useState<NodeRow[]>([]);
  const [expanded, setExpanded] = useState<Set<number>>(() => new Set<number>());
  const [q, setQ] = useState('');

  useEffect(() => {
    // Load after mount only — a query during render can hit a closed connection.
    const nodes = getAllNodes(db);
    setAll(nodes);
    const roots = new Set<number>();
    for (const n of nodes) if (n.level === 0) roots.add(n.id);
    setExpanded(roots);
  }, [db]);

  const hasChildren = useMemo(() => {
    const m = new Map<number, number>();
    for (const n of all) if (n.parent_id != null) m.set(n.parent_id, (m.get(n.parent_id) ?? 0) + 1);
    return m;
  }, [all]);

  const rows = useMemo(() => {
    const query = fold(q);
    if (query) {
      return all
        .filter((n) => fold(n.title).includes(query))
        .map((n) => ({ node: n, depth: 0, crumbs: n.path }));
    }
    const byParent = new Map<number | null, NodeRow[]>();
    for (const n of all) {
      const k = n.parent_id;
      const arr = byParent.get(k);
      if (arr) arr.push(n);
      else byParent.set(k, [n]);
    }
    const out: { node: NodeRow; depth: number; crumbs?: string }[] = [];
    const walk = (pid: number | null, depth: number) => {
      for (const n of byParent.get(pid) ?? []) {
        out.push({ node: n, depth });
        if (expanded.has(n.id)) walk(n.id, depth + 1);
      }
    };
    walk(null, 0);
    return out;
  }, [all, expanded, q]);

  const toggle = (id: number) =>
    setExpanded((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });

  const open = (n: NodeRow) => {
    if (n.blocks_count > 0) nav.go({ name: 'reader', nodeId: n.id });
    else if (hasChildren.get(n.id)) toggle(n.id);
  };

  const allOpen = expanded.size > all.length / 3;

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: pal.bg }]} edges={['top']}>
      <AppHeader
        pal={pal}
        title="فهرست مطالب"
        subtitle={`${toFa(all.length)} عنوان · فصل و زیرفصل`}
        onBack={nav.back}
        actions={
          <IconButton
            pal={pal}
            name={allOpen ? 'contract-outline' : 'expand-outline'}
            label={allOpen ? 'بستن همه' : 'باز کردن همه'}
            onPress={() =>
              setExpanded(allOpen ? new Set() : new Set(all.filter((n) => n.level < 2).map((n) => n.id)))
            }
            active={allOpen}
          />
        }
      />

      <View style={[styles.searchWrap, { backgroundColor: pal.surface, borderColor: pal.border }]}>
        <Ionicons name="search-outline" size={17} color={pal.muted} />
        <TextInput
          value={q}
          onChangeText={setQ}
          placeholder="جستجوی عنوان…"
          placeholderTextColor={pal.muted}
          style={[styles.input, { color: pal.text }]}
          textAlign="right"
          allowFontScaling={false}
        />
        {q ? (
          <Pressable onPress={() => setQ('')} hitSlop={8} accessibilityLabel="پاک کردن">
            <Ionicons name="close-circle" size={17} color={pal.muted} />
          </Pressable>
        ) : null}
      </View>

      <FlatList
        data={rows}
        keyExtractor={(r) => String(r.node.id)}
        contentContainerStyle={{ paddingBottom: 28 }}
        keyboardShouldPersistTaps="handled"
        renderItem={({ item }) => {
          const n = item.node;
          const kids = hasChildren.get(n.id) ?? 0;
          const isOpen = expanded.has(n.id);
          return (
            <View
              style={[
                styles.row,
                {
                  backgroundColor: pal.surface,
                  borderColor: pal.border,
                  marginStart: 10 + Math.min(item.depth, 2) * 14,
                },
              ]}
            >
              <Pressable
                onPress={() => open(n)}
                style={({ pressed }) => [styles.rowMain, { opacity: pressed ? 0.6 : 1 }]}
              >
                <View
                  style={[
                    styles.levelPip,
                    {
                      backgroundColor:
                        n.level === 0 ? pal.accent : n.level === 1 ? pal.gold : pal.border,
                    },
                  ]}
                />
                <View style={styles.rowText}>
                  <Text
                    numberOfLines={2}
                    style={[
                      styles.title,
                      {
                        color: pal.text,
                        fontFamily: n.level === 0 ? FONTS.bold : n.level === 1 ? FONTS.semi : FONTS.regular,
                        fontSize: n.level === 0 ? 14.5 : 13.2,
                      },
                    ]}
                  >
                    {n.title}
                  </Text>
                  <Text style={[styles.meta, { color: pal.muted }]} numberOfLines={1}>
                    {LEVEL_LABEL[n.level] ?? ''} · صفحهٔ {toFa(n.page)}
                    {item.crumbs ? ` · ${item.crumbs}` : kids ? ` · ${toFa(kids)} زیرشاخه` : ''}
                  </Text>
                </View>
                <View
                  style={[
                    styles.pageBadge,
                    { backgroundColor: n.blocks_count ? pal.accentSoft : pal.bgAlt },
                  ]}
                >
                  <Text style={[styles.pageText, { color: n.blocks_count ? pal.accent : pal.muted }]}>
                    {toFa(n.page)}
                  </Text>
                </View>
              </Pressable>
              {kids > 0 ? (
                <Pressable
                  onPress={() => toggle(n.id)}
                  hitSlop={8}
                  style={styles.chev}
                  accessibilityLabel={isOpen ? 'بستن زیرشاخه‌ها' : 'باز کردن زیرشاخه‌ها'}
                >
                  <Ionicons
                    name={isOpen ? 'chevron-up' : 'chevron-down'}
                    size={16}
                    color={pal.muted}
                  />
                </Pressable>
              ) : null}
            </View>
          );
        }}
        ListEmptyComponent={
          <Text style={[styles.empty, { color: pal.muted }]}>عنوانی با این عبارت پیدا نشد.</Text>
        }
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
    marginBottom: 8,
    paddingHorizontal: 12,
    height: 42,
    borderRadius: 14,
    borderWidth: 1,
  },
  input: { flex: 1, fontFamily: FONTS.regular, fontSize: 13.5, paddingVertical: 0 },
  row: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    marginTop: 7,
    marginEnd: 10,
    borderRadius: 14,
    borderWidth: 1,
  },
  rowMain: {
    flex: 1,
    flexDirection: 'row-reverse',
    alignItems: 'center',
    gap: 10,
    paddingVertical: 10,
    paddingHorizontal: 10,
  },
  levelPip: { width: 4, height: 26, borderRadius: 2 },
  rowText: { flex: 1 },
  title: { textAlign: 'right', lineHeight: 22 },
  meta: { fontFamily: FONTS.regular, fontSize: 10.5, marginTop: 3, textAlign: 'right' },
  pageBadge: { minWidth: 34, paddingHorizontal: 7, paddingVertical: 4, borderRadius: 9, alignItems: 'center' },
  pageText: { fontFamily: FONTS.semi, fontSize: 11 },
  chev: { paddingHorizontal: 10, paddingVertical: 12 },
  empty: { textAlign: 'center', fontFamily: FONTS.regular, marginTop: 40, fontSize: 13 },
});
