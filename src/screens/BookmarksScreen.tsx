import React, { useCallback, useEffect, useState } from 'react';
import { View, Text, Pressable, StyleSheet, FlatList, Alert } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useSQLiteContext } from 'expo-sqlite';
import { useApp } from '../store';
import { FONTS, LEVEL_LABEL } from '../theme';
import { toFa } from '../text';
import { BookmarkRow, getBookmarks, removeBookmark } from '../db';
import { Nav } from '../nav';
import { AppHeader } from '../components/AppHeader';

function relative(ts: number): string {
  const diff = Date.now() - ts;
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return 'همین حالا';
  if (mins < 60) return `${toFa(mins)} دقیقه پیش`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${toFa(hours)} ساعت پیش`;
  const days = Math.floor(hours / 24);
  if (days < 30) return `${toFa(days)} روز پیش`;
  const d = new Date(ts);
  return `${toFa(d.getFullYear())}/${toFa(d.getMonth() + 1)}/${toFa(d.getDate())}`;
}

export function BookmarksScreen({ nav }: { nav: Nav }) {
  const db = useSQLiteContext();
  const { pal } = useApp();
  const [items, setItems] = useState<BookmarkRow[]>([]);

  const reload = useCallback(() => setItems(getBookmarks(db)), [db]);

  useEffect(() => {
    reload();
  }, [reload]);

  const onDelete = (row: BookmarkRow) => {
    Alert.alert('حذف نشان', `نشان «${row.title}» حذف شود؟`, [
      { text: 'انصراف', style: 'cancel' },
      {
        text: 'حذف',
        style: 'destructive',
        onPress: () => {
          removeBookmark(db, row.node_id);
          reload();
        },
      },
    ]);
  };

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: pal.bg }]} edges={['top']}>
      <AppHeader
        pal={pal}
        title="نشان‌شده‌ها"
        subtitle={`${toFa(items.length)} نشان ذخیره‌شده`}
        onBack={nav.back}
      />
      <FlatList
        data={items}
        keyExtractor={(b) => String(b.id)}
        contentContainerStyle={{ padding: 14, paddingBottom: 30 }}
        renderItem={({ item }) => (
          <View style={[styles.card, { backgroundColor: pal.surface, borderColor: pal.border }]}>
            <Pressable
              onPress={() => nav.go({ name: 'reader', nodeId: item.node_id })}
              style={({ pressed }) => [styles.cardMain, { opacity: pressed ? 0.65 : 1 }]}
            >
              <View style={[styles.iconWrap, { backgroundColor: pal.goldSoft }]}>
                <Ionicons name="bookmark" size={16} color={pal.gold} />
              </View>
              <View style={{ flex: 1 }}>
                <Text numberOfLines={2} style={[styles.title, { color: pal.text }]}>
                  {item.title}
                </Text>
                <Text style={[styles.meta, { color: pal.muted }]}>
                  {LEVEL_LABEL[item.level] ?? 'بخش'} · صفحهٔ {toFa(item.page)} · {relative(item.created_at)}
                </Text>
                {item.snippet ? (
                  <Text numberOfLines={2} style={[styles.snippet, { color: pal.muted }]}>
                    {item.snippet}
                  </Text>
                ) : null}
              </View>
            </Pressable>
            <Pressable
              onPress={() => onDelete(item)}
              hitSlop={10}
              style={styles.deleteBtn}
              accessibilityLabel="حذف نشان"
            >
              <Ionicons name="trash-outline" size={17} color={pal.muted} />
            </Pressable>
          </View>
        )}
        ListEmptyComponent={
          <View style={styles.empty}>
            <View style={[styles.emptyIcon, { backgroundColor: pal.accentSoft }]}>
              <Ionicons name="bookmark-outline" size={26} color={pal.accent} />
            </View>
            <Text style={[styles.emptyTitle, { color: pal.text }]}>هنوز نشانی ذخیره نکرده‌اید</Text>
            <Text style={[styles.emptyText, { color: pal.muted }]}>
              در صفحهٔ مطالعه، دکمهٔ نشان در بالای صفحه را بزنید تا صفحه برای بازگشت سریع ذخیره شود.
            </Text>
          </View>
        }
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1 },
  card: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    borderWidth: 1,
    borderRadius: 16,
    marginBottom: 10,
    paddingHorizontal: 10,
    paddingVertical: 10,
  },
  cardMain: { flex: 1, flexDirection: 'row-reverse', alignItems: 'flex-start', gap: 10 },
  iconWrap: {
    width: 34,
    height: 34,
    borderRadius: 11,
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: { fontFamily: FONTS.semi, fontSize: 13.5, textAlign: 'right', lineHeight: 22 },
  meta: { fontFamily: FONTS.regular, fontSize: 10, marginTop: 3, textAlign: 'right' },
  snippet: {
    fontFamily: FONTS.regular,
    fontSize: 11.5,
    lineHeight: 20,
    marginTop: 6,
    textAlign: 'right',
    writingDirection: 'rtl',
  },
  deleteBtn: { padding: 8 },
  empty: { alignItems: 'center', paddingTop: 70, paddingHorizontal: 30 },
  emptyIcon: {
    width: 64,
    height: 64,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 14,
  },
  emptyTitle: { fontFamily: FONTS.semi, fontSize: 15, marginBottom: 8 },
  emptyText: {
    fontFamily: FONTS.regular,
    fontSize: 12,
    lineHeight: 22,
    textAlign: 'center',
  },
});
