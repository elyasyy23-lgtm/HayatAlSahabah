import React from 'react';
import { View, Text, StyleSheet, ScrollView } from 'react-native';
import { BlockRow } from '../db';
import { FONTS, Palette } from '../theme';
import { parseSegments, toFa } from '../text';
import { blockDisplayText } from '../honorific';
import { Settings } from '../db';

type Props = {
  block: BlockRow;
  pal: Palette;
  settings: Settings;
  onFootnote: (num: number) => void;
  onBookmarkBlock?: () => void;
};

function RichText({
  raw,
  pal,
  onFootnote,
  style,
}: {
  raw: string;
  pal: Palette;
  onFootnote: (num: number) => void;
  style: any;
}) {
  const segs = parseSegments(raw);
  return (
    <Text style={style} allowFontScaling={false}>
      {segs.map((s, i) =>
        s.kind === 'text' ? (
          <Text key={i}>{s.value}</Text>
        ) : (
          <Text
            key={i}
            onPress={() => onFootnote(Number(s.value))}
            style={{ color: pal.gold, fontFamily: FONTS.semi }}
            accessibilityLabel={`پانویس ${s.value}`}
          >
            {toFa(s.value)}
          </Text>
        ),
      )}
    </Text>
  );
}

export function BlockView({ block, pal, settings, onFootnote }: Props) {
  const { fontSize, lineHeight, justify } = settings;
  const lh = Math.round(fontSize * lineHeight);
  const raw = blockDisplayText(block.text ?? '', block.id, settings.honorifics);
  const align = block.jc === 'center' ? 'center' : 'right';

  if (block.kind === 'table') {
    const rows: string[][] = block.rows_json ? JSON.parse(block.rows_json) : [];
    return (
      <View style={[styles.table, { borderColor: pal.border, backgroundColor: pal.surface }]}>
        {rows.map((row, ri) => (
          <View
            key={ri}
            style={[
              styles.tableRow,
              { borderBottomColor: pal.border, borderBottomWidth: ri === rows.length - 1 ? 0 : 1 },
            ]}
          >
            {row.map((cell, ci) => (
              <View
                key={ci}
                style={[
                  styles.tableCell,
                  { borderStartColor: pal.border, borderStartWidth: ci === 0 ? 0 : 1 },
                ]}
              >
                <RichText
                  raw={String(cell ?? '')}
                  pal={pal}
                  onFootnote={onFootnote}
                  style={{
                    fontFamily: FONTS.regular,
                    fontSize: Math.max(12, fontSize - 3),
                    lineHeight: Math.round(fontSize * 1.7),
                    color: pal.text,
                    textAlign: 'right',
                    writingDirection: 'rtl',
                  }}
                />
              </View>
            ))}
          </View>
        ))}
      </View>
    );
  }

  if (block.kind === 'hadith_ar') {
    return (
      <View
        style={[
          styles.hadith,
          { backgroundColor: pal.goldSoft, borderColor: pal.gold, borderStartWidth: 3 },
        ]}
      >
        <RichText
          raw={raw}
          pal={pal}
          onFootnote={onFootnote}
          style={{
            fontFamily: FONTS.arabic,
            fontSize: fontSize + 3,
            lineHeight: Math.round((fontSize + 3) * 1.95),
            color: pal.text,
            textAlign: 'center',
            writingDirection: 'rtl',
          }}
        />
      </View>
    );
  }

  if (block.kind === 'verse' || block.kind === 'verse_fa') {
    const isFa = block.kind === 'verse_fa';
    return (
      <View style={styles.verse}>
        <RichText
          raw={raw}
          pal={pal}
          onFootnote={onFootnote}
          style={{
            fontFamily: isFa ? FONTS.medium : FONTS.arabic,
            fontSize: isFa ? fontSize : fontSize + 2,
            lineHeight: Math.round((isFa ? fontSize : fontSize + 2) * 1.9),
            color: isFa ? pal.muted : pal.text,
            textAlign: 'center',
            writingDirection: 'rtl',
          }}
        />
      </View>
    );
  }

  const isBold = block.kind === 'body_bold';
  return (
    <RichText
      raw={raw}
      pal={pal}
      onFootnote={onFootnote}
      style={{
        fontFamily: isBold ? FONTS.semi : FONTS.regular,
        fontSize,
        lineHeight: lh,
        color: pal.text,
        textAlign: justify && align === 'right' ? 'justify' : align,
        writingDirection: 'rtl',
        paddingHorizontal: 20,
        paddingVertical: isBold ? 6 : 5,
      }}
    />
  );
}

const styles = StyleSheet.create({
  table: {
    marginHorizontal: 16,
    marginVertical: 10,
    borderWidth: 1,
    borderRadius: 12,
    overflow: 'hidden',
  },
  tableRow: { flexDirection: 'row-reverse' },
  tableCell: { flex: 1, paddingHorizontal: 8, paddingVertical: 8 },
  hadith: {
    marginHorizontal: 18,
    marginVertical: 10,
    paddingVertical: 12,
    paddingHorizontal: 14,
    borderRadius: 12,
    borderWidth: 1,
  },
  verse: { marginHorizontal: 24, marginVertical: 8 },
});
