import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  Pressable,
  StyleSheet,
  NativeSyntheticEvent,
  NativeScrollEvent,
  type ScrollViewInstance,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { useSQLiteContext } from 'expo-sqlite';
import { useApp } from '../store';
import { FONTS, LEVEL_LABEL } from '../theme';
import { toFa } from '../text';
import {
  addBookmark,
  adjacentNode,
  BlockRow,
  FootnoteRow,
  getBlocks,
  getChildren,
  getNode,
  getNodeFootnotes,
  getSettingPos,
  isBookmarked,
  NodeRow,
  removeBookmark,
  saveProgress,
  setSettingPos,
} from '../db';
import { Nav } from '../nav';
import { AppHeader, IconButton } from '../components/AppHeader';
import { BlockView } from '../components/BlockView';
import { FootnoteSheet } from '../components/FootnoteSheet';

type Nb = { id: number; title: string; page: number };

export function ReaderScreen({
  nav,
  nodeId,
  targetBlockId,
}: {
  nav: Nav;
  nodeId: number;
  targetBlockId?: number;
}) {
  const db = useSQLiteContext();
  const { pal, settings } = useApp();
  const insets = useSafeAreaInsets();
  const [node, setNode] = useState<NodeRow | null>(null);
  const [blocks, setBlocks] = useState<BlockRow[]>([]);
  const [notes, setNotes] = useState<FootnoteRow[]>([]);
  const [kids, setKids] = useState<NodeRow[]>([]);
  const [marked, setMarked] = useState(false);
  const [prev, setPrev] = useState<Nb | null>(null);
  const [next, setNext] = useState<Nb | null>(null);
  const [showNotes, setShowNotes] = useState(settings.showFootnotes);
  const [sheet, setSheet] = useState<{ visible: boolean; highlight: number | null }>({
    visible: false,
    highlight: null,
  });

  const scrollRef = useRef<ScrollViewInstance>(null);
  const restored = useRef(false);
  const offsets = useRef<Record<number, number>>({});
  const containerY = useRef(0);
  const jumped = useRef(false);
  const fraction = useRef(0);
  const saveTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    const n = getNode(db, nodeId);
    setNode(n);
    setBlocks(getBlocks(db, nodeId));
    setNotes(getNodeFootnotes(db, nodeId));
    setKids(getChildren(db, nodeId));
    setMarked(isBookmarked(db, nodeId));
    setPrev(adjacentNode(db, nodeId, -1));
    setNext(adjacentNode(db, nodeId, 1));
    restored.current = false;
    offsets.current = {};
    jumped.current = false;
    saveProgress(db, nodeId, null);
    const pos = getSettingPos(db, nodeId);
    fraction.current = pos ?? 0;
    if (scrollRef.current) scrollRef.current.scrollTo({ y: 0, animated: false });
  }, [db, nodeId]);

  useEffect(() => {
    return () => {
      if (saveTimer.current) clearTimeout(saveTimer.current);
      setSettingPos(db, nodeId, fraction.current);
    };
  }, [db, nodeId]);

  const onScroll = (e: NativeSyntheticEvent<NativeScrollEvent>) => {
    const { contentOffset, contentSize, layoutMeasurement } = e.nativeEvent;
    const max = Math.max(1, contentSize.height - layoutMeasurement.height);
    fraction.current = Math.min(1, Math.max(0, contentOffset.y / max));
    if (saveTimer.current) return;
    saveTimer.current = setTimeout(() => {
      saveTimer.current = null;
      setSettingPos(db, nodeId, fraction.current);
    }, 1400);
  };

  const toggleBookmark = useCallback(() => {
    if (!node) return;
    if (marked) {
      removeBookmark(db, nodeId);
      setMarked(false);
    } else {
      const first = blocks.find((b) => b.text && b.text.trim().length > 0)?.text ?? null;
      addBookmark(db, nodeId, first ? first.replace(/[\uFDD0\uFDD1]\d*/g, '').slice(0, 140) : null);
      setMarked(true);
    }
  }, [db, marked, node, nodeId, blocks]);

  const openFootnote = (num: number) => setSheet({ visible: true, highlight: num });

  if (!node) return null;

  const hasBody = blocks.length > 0;

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: pal.bg }]} edges={['top']}>
      <AppHeader
        pal={pal}
        title={node.title}
        subtitle={`${LEVEL_LABEL[node.level] ?? 'بخش'} · صفحهٔ چاپی ${toFa(node.page)}`}
        onBack={nav.back}
        actions={
          <IconButton
            pal={pal}
            name={marked ? 'bookmark' : 'bookmark-outline'}
            label={marked ? 'حذف نشان' : 'نشان‌گذاری این بخش'}
            onPress={toggleBookmark}
            active={marked}
          />
        }
      />

      <ScrollView
        ref={scrollRef}
        onScroll={onScroll}
        scrollEventThrottle={120}
        contentContainerStyle={{ paddingBottom: 120 }}
        onContentSizeChange={(w, h) => {
          if (restored.current) return;
          restored.current = true;
          const pos = fraction.current;
          if (targetBlockId) return;
          if (pos > 0.01 && hasBody) {
            setTimeout(() => {
              scrollRef.current?.scrollTo({ y: Math.max(0, pos * h * 0.9), animated: false });
            }, 60);
          }
        }}
      >
        <View style={styles.titleBlock}>
          <View style={[styles.rule, { backgroundColor: pal.gold }]} />
          <Text style={[styles.h1, { color: pal.text }]}>{node.title}</Text>
          {node.path ? (
            <Text style={[styles.path, { color: pal.muted }]} numberOfLines={2}>
              {node.path}
            </Text>
          ) : null}
          <View style={styles.chips}>
            <View style={[styles.chip, { backgroundColor: pal.bgAlt, borderColor: pal.border }]}>
              <Text style={[styles.chipText, { color: pal.muted }]}>
                صفحهٔ {toFa(node.page)}
              </Text>
            </View>
            {node.words > 0 ? (
              <View style={[styles.chip, { backgroundColor: pal.bgAlt, borderColor: pal.border }]}>
                <Text style={[styles.chipText, { color: pal.muted }]}>
                  {toFa(node.words)} واژه
                </Text>
              </View>
            ) : null}
            {notes.length > 0 ? (
              <Pressable
                onPress={() => setSheet({ visible: true, highlight: null })}
                style={[styles.chip, { backgroundColor: pal.goldSoft, borderColor: pal.gold }]}
              >
                <Text style={[styles.chipText, { color: pal.gold }]}>
                  {toFa(notes.length)} پانویس
                </Text>
              </Pressable>
            ) : null}
          </View>
        </View>

        {hasBody ? (
          <View
            onLayout={(e) => {
              containerY.current = e.nativeEvent.layout.y;
            }}
          >
            {blocks.map((b) => (
              <View
                key={b.id}
                onLayout={(e) => {
                  offsets.current[b.id] = e.nativeEvent.layout.y;
                  if (targetBlockId === b.id && !jumped.current) {
                    jumped.current = true;
                    const y = containerY.current + e.nativeEvent.layout.y - 16;
                    requestAnimationFrame(() =>
                      scrollRef.current?.scrollTo({ y: Math.max(0, y), animated: false }),
                    );
                  }
                }}
              >
                <BlockView
                  block={b}
                  pal={pal}
                  settings={settings}
                  onFootnote={openFootnote}
                />
              </View>
            ))}
          </View>
        ) : (
          <View style={{ paddingHorizontal: 16, paddingTop: 6 }}>
            <Text style={[styles.sectionLabel, { color: pal.muted }]}>زیرشاخه‌های این بخش</Text>
            {kids.map((k) => (
              <Pressable
                key={k.id}
                onPress={() => nav.go({ name: 'reader', nodeId: k.id })}
                style={({ pressed }) => [
                  styles.childRow,
                  {
                    backgroundColor: pal.surface,
                    borderColor: pal.border,
                    opacity: pressed ? 0.65 : 1,
                  },
                ]}
              >
                <Ionicons name="chevron-back" size={16} color={pal.muted} />
                <View style={{ flex: 1 }}>
                  <Text style={[styles.childTitle, { color: pal.text }]} numberOfLines={2}>
                    {k.title}
                  </Text>
                  <Text style={[styles.childMeta, { color: pal.muted }]}>
                    {LEVEL_LABEL[k.level] ?? ''} · صفحهٔ {toFa(k.page)}
                  </Text>
                </View>
              </Pressable>
            ))}
            {kids.length === 0 ? (
              <Text style={[styles.emptyText, { color: pal.muted }]}>
                این بخش متنی ندارد.
              </Text>
            ) : null}
          </View>
        )}

        {hasBody && notes.length > 0 && showNotes ? (
          <View style={[styles.notesBox, { backgroundColor: pal.bgAlt, borderColor: pal.border }]}>
            <Pressable
              onPress={() => setShowNotes(false)}
              style={styles.notesHead}
              accessibilityLabel="بستن پانویس‌ها"
            >
              <Ionicons name="chevron-up" size={15} color={pal.muted} />
              <Text style={[styles.sectionLabel, { color: pal.muted, marginBottom: 0 }]}>
                پانویس‌های این بخش
              </Text>
            </Pressable>
            {notes.map((n) => (
              <View key={n.id} style={styles.noteRow}>
                <Text style={[styles.noteNum, { color: pal.gold }]}>{toFa(n.num)}</Text>
                <Text style={[styles.noteText, { color: pal.text }]} selectable>
                  {n.text}
                </Text>
              </View>
            ))}
          </View>
        ) : null}
        {hasBody && notes.length > 0 && !showNotes ? (
          <Pressable
            onPress={() => setShowNotes(true)}
            style={[styles.showNotes, { borderColor: pal.gold, backgroundColor: pal.goldSoft }]}
          >
            <Ionicons name="chevron-down" size={15} color={pal.gold} />
            <Text style={[styles.showNotesText, { color: pal.gold }]}>
              نمایش {toFa(notes.length)} پانویس این بخش
            </Text>
          </Pressable>
        ) : null}

        <View style={[styles.endRule, { backgroundColor: pal.border }]} />
        <Text style={[styles.endText, { color: pal.muted }]}>
          پایان صفحهٔ {toFa(node.page)}
        </Text>
      </ScrollView>

      <View
        style={[
          styles.navBar,
          {
            backgroundColor: pal.surface,
            borderTopColor: pal.border,
            paddingBottom: Math.max(10, insets.bottom),
          },
        ]}
      >
        <Pressable
          disabled={!next}
          onPress={() => next && nav.go({ name: 'reader', nodeId: next.id })}
          style={({ pressed }) => [
            styles.navBtn,
            { opacity: next ? (pressed ? 0.6 : 1) : 0.35 },
          ]}
        >
          <Ionicons name="chevron-back" size={17} color={pal.accent} />
          <View style={styles.navText}>
            <Text style={[styles.navLabel, { color: pal.muted }]}>بعدی</Text>
            <Text numberOfLines={1} style={[styles.navTitle, { color: pal.text }]}>
              {next?.title ?? 'پایان کتاب'}
            </Text>
          </View>
        </Pressable>
        <View style={[styles.navDivider, { backgroundColor: pal.border }]} />
        <Pressable
          disabled={!prev}
          onPress={() => prev && nav.go({ name: 'reader', nodeId: prev.id })}
          style={({ pressed }) => [
            styles.navBtn,
            styles.navBtnEnd,
            { opacity: prev ? (pressed ? 0.6 : 1) : 0.35 },
          ]}
        >
          <View style={[styles.navText, { alignItems: 'flex-end' }]}>
            <Text style={[styles.navLabel, { color: pal.muted, textAlign: 'right' }]}>قبلی</Text>
            <Text
              numberOfLines={1}
              style={[styles.navTitle, { color: pal.text, textAlign: 'right' }]}
            >
              {prev?.title ?? 'آغاز کتاب'}
            </Text>
          </View>
          <Ionicons name="chevron-forward" size={17} color={pal.accent} />
        </Pressable>
      </View>

      <FootnoteSheet
        visible={sheet.visible}
        notes={notes}
        highlight={sheet.highlight}
        pal={pal}
        onClose={() => setSheet({ visible: false, highlight: null })}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1 },
  titleBlock: { paddingHorizontal: 20, paddingTop: 18, paddingBottom: 6, alignItems: 'center' },
  rule: { width: 30, height: 3, borderRadius: 2, marginBottom: 12 },
  h1: { fontFamily: FONTS.bold, fontSize: 20, textAlign: 'center', lineHeight: 32 },
  path: {
    fontFamily: FONTS.regular,
    fontSize: 10.5,
    textAlign: 'center',
    marginTop: 8,
    lineHeight: 18,
  },
  chips: { flexDirection: 'row-reverse', gap: 8, marginTop: 12, flexWrap: 'wrap', justifyContent: 'center' },
  chip: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 9, borderWidth: 1 },
  chipText: { fontFamily: FONTS.medium, fontSize: 10.5 },
  sectionLabel: {
    fontFamily: FONTS.semi,
    fontSize: 12,
    textAlign: 'right',
    marginBottom: 8,
    marginTop: 4,
  },
  childRow: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    gap: 10,
    borderWidth: 1,
    borderRadius: 14,
    padding: 12,
    marginBottom: 8,
  },
  childTitle: { fontFamily: FONTS.medium, fontSize: 13.5, textAlign: 'right', writingDirection: 'rtl' },
  childMeta: { fontFamily: FONTS.regular, fontSize: 10.5, marginTop: 3, textAlign: 'right' },
  emptyText: { fontFamily: FONTS.regular, fontSize: 13, textAlign: 'center', marginTop: 30 },
  notesBox: {
    marginHorizontal: 16,
    marginTop: 18,
    borderWidth: 1,
    borderRadius: 16,
    padding: 14,
  },
  notesHead: { flexDirection: 'row-reverse', alignItems: 'center', gap: 6, marginBottom: 8 },
  noteRow: { flexDirection: 'row-reverse', gap: 8, marginBottom: 8 },
  noteNum: { fontFamily: FONTS.bold, fontSize: 11.5, marginTop: 3 },
  noteText: {
    flex: 1,
    fontFamily: FONTS.regular,
    fontSize: 13,
    lineHeight: 25,
    textAlign: 'right',
    writingDirection: 'rtl',
  },
  showNotes: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    marginHorizontal: 16,
    marginTop: 16,
    borderWidth: 1,
    borderRadius: 12,
    paddingVertical: 10,
  },
  showNotesText: { fontFamily: FONTS.medium, fontSize: 12 },
  endRule: { height: 1, width: 60, alignSelf: 'center', marginTop: 26 },
  endText: { textAlign: 'center', fontFamily: FONTS.regular, fontSize: 10.5, marginTop: 8 },
  navBar: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    flexDirection: 'row-reverse',
    alignItems: 'center',
    borderTopWidth: 1,
    paddingTop: 10,
    paddingHorizontal: 12,
  },
  navBtn: {
    flex: 1,
    flexDirection: 'row-reverse',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 4,
  },
  navBtnEnd: { justifyContent: 'flex-start' },
  navText: { flex: 1 },
  navLabel: { fontFamily: FONTS.regular, fontSize: 9.5 },
  navTitle: { fontFamily: FONTS.semi, fontSize: 11.5, marginTop: 1, writingDirection: 'rtl' },
  navDivider: { width: 1, height: 30, marginHorizontal: 8 },
});
