import React, { useEffect, useRef } from 'react';
import { Modal, View, Text, Pressable, StyleSheet, ScrollView, type ScrollViewInstance } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { FootnoteRow } from '../db';
import { FONTS, Palette } from '../theme';
import * as Clipboard from 'expo-clipboard';
import { toFa } from '../text';
import { footnoteDisplayText } from '../honorific';

type Props = {
  visible: boolean;
  notes: FootnoteRow[];
  highlight: number | null;
  pal: Palette;
  onClose: () => void;
  honorifics?: boolean;
};

export function FootnoteSheet({ visible, notes, highlight, pal, onClose, honorifics = true }: Props) {
  const scroll = useRef<ScrollViewInstance>(null);
  const offsets = useRef<Record<number, number>>({});

  useEffect(() => {
    if (!visible || highlight == null) return;
    const y = offsets.current[highlight];
    const t = setTimeout(() => {
      if (y != null) scroll.current?.scrollTo({ y: Math.max(0, y - 24), animated: true });
    }, 250);
    return () => clearTimeout(t);
  }, [visible, highlight]);

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <Pressable style={styles.backdrop} onPress={onClose} />
      <View style={[styles.sheet, { backgroundColor: pal.bg, borderColor: pal.border }]}>
        <View style={[styles.handle, { backgroundColor: pal.border }]} />
        <View style={[styles.head, { borderBottomColor: pal.border }]}>
          <Text style={[styles.headTitle, { color: pal.text }]}>پانویس‌ها</Text>
          <Pressable onPress={onClose} hitSlop={10} accessibilityLabel="بستن">
            <Ionicons name="close" size={22} color={pal.muted} />
          </Pressable>
        </View>
        <ScrollView ref={scroll} contentContainerStyle={{ padding: 16, paddingBottom: 36 }}>
          {notes.length === 0 ? (
            <Text style={{ color: pal.muted, fontFamily: FONTS.regular, textAlign: 'center' }}>
              پانویسی برای این بخش ثبت نشده است.
            </Text>
          ) : (
            notes.map((n) => {
              const active = highlight === n.num;
              return (
                <View
                  key={n.id}
                  onLayout={(e) => {
                    offsets.current[n.num] = e.nativeEvent.layout.y;
                  }}
                  style={[
                    styles.note,
                    {
                      backgroundColor: active ? pal.goldSoft : 'transparent',
                      borderColor: active ? pal.gold : 'transparent',
                    },
                  ]}
                >
                  <Text style={[styles.num, { color: pal.gold }]}>{toFa(n.num)}</Text>
                  <Text
                    style={[styles.noteText, { color: pal.text }]}
                    selectable
                    // D8: copying always yields the book's own wording, never the
                    // display variant — long-press puts the source text on the clipboard.
                    onLongPress={async () => {
                      try {
                        await Clipboard.setStringAsync(n.text);
                      } catch {
                        /* clipboard unavailable — nothing to do */
                      }
                    }}
                  >
                    {footnoteDisplayText(n.text, n.id, honorifics)}
                  </Text>
                </View>
              );
            })
          )}
        </ScrollView>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: { flex: 1, backgroundColor: '#00000066' },
  sheet: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    maxHeight: '78%',
    borderTopLeftRadius: 22,
    borderTopRightRadius: 22,
    borderWidth: 1,
    borderBottomWidth: 0,
  },
  handle: { width: 44, height: 4, borderRadius: 2, alignSelf: 'center', marginTop: 8 },
  head: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
  },
  headTitle: { fontFamily: FONTS.bold, fontSize: 15 },
  note: {
    flexDirection: 'row-reverse',
    gap: 8,
    padding: 10,
    borderRadius: 12,
    borderWidth: 1,
    marginBottom: 8,
  },
  num: { fontFamily: FONTS.bold, fontSize: 12.5, marginTop: 2 },
  noteText: {
    flex: 1,
    fontFamily: FONTS.regular,
    fontSize: 14,
    lineHeight: 26,
    textAlign: 'right',
    writingDirection: 'rtl',
  },
});
