import React from 'react';
import { View, Text, Pressable, StyleSheet, ActivityIndicator } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { FONTS, Palette } from '../theme';

type Props = {
  pal: Palette;
  title?: string;
  subtitle?: string;
  onBack?: () => void;
  onMenu?: () => void;
  actions?: React.ReactNode;
  border?: boolean;
};

export function AppHeader({ pal, title, subtitle, onBack, onMenu, actions, border = true }: Props) {
  return (
    <View
      style={[
        styles.wrap,
        { backgroundColor: pal.bg, borderBottomColor: border ? pal.border : 'transparent' },
      ]}
    >
      <View style={styles.row}>
        {onBack ? (
          <Pressable
            onPress={onBack}
            hitSlop={12}
            style={({ pressed }) => [
              styles.iconBtn,
              { backgroundColor: pal.accentSoft, opacity: pressed ? 0.65 : 1 },
            ]}
            accessibilityLabel="بازگشت"
          >
            <Ionicons name="arrow-forward" size={20} color={pal.accent} />
          </Pressable>
        ) : (
          <View style={styles.iconBtn} />
        )}
        {onMenu ? (
          <Pressable
            onPress={onMenu}
            hitSlop={12}
            style={({ pressed }) => [
              styles.iconBtn,
              { backgroundColor: pal.accentSoft, opacity: pressed ? 0.65 : 1 },
            ]}
            accessibilityLabel="منو"
          >
            <Ionicons name="menu" size={21} color={pal.accent} />
          </Pressable>
        ) : null}
        <View style={styles.titleWrap}>
          <Text numberOfLines={1} style={[styles.title, { color: pal.text }]}>
            {title ?? 'حیات صحابه'}
          </Text>
          {subtitle ? (
            <Text numberOfLines={1} style={[styles.subtitle, { color: pal.muted }]}>
              {subtitle}
            </Text>
          ) : null}
        </View>
        <View style={styles.actions}>{actions}</View>
      </View>
    </View>
  );
}

export function IconButton({
  pal,
  name,
  label,
  onPress,
  active,
}: {
  pal: Palette;
  name: React.ComponentProps<typeof Ionicons>['name'];
  label: string;
  onPress: () => void;
  active?: boolean;
}) {
  return (
    <Pressable
      onPress={onPress}
      hitSlop={10}
      accessibilityLabel={label}
      style={({ pressed }) => [
        styles.iconBtn,
        {
          backgroundColor: active ? pal.accent : pal.accentSoft,
          opacity: pressed ? 0.65 : 1,
        },
      ]}
    >
      <Ionicons name={name} size={20} color={active ? pal.onAccent : pal.accent} />
    </Pressable>
  );
}

export function Loading({ pal, label = 'در حال آماده‌سازی…' }: { pal: Palette; label?: string }) {
  return (
    <View style={[styles.center, { backgroundColor: pal.bg }]}>
      <ActivityIndicator color={pal.accent} />
      <Text style={{ color: pal.muted, fontFamily: FONTS.medium, marginTop: 12 }}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { paddingHorizontal: 14, paddingBottom: 10, paddingTop: 6, borderBottomWidth: 1 },
  row: { flexDirection: 'row-reverse', alignItems: 'center', gap: 10 },
  iconBtn: {
    width: 40,
    height: 40,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  titleWrap: { flex: 1, alignItems: 'flex-end' },
  title: { fontFamily: FONTS.bold, fontSize: 17, textAlign: 'right' },
  subtitle: { fontFamily: FONTS.regular, fontSize: 11.5, marginTop: 2, textAlign: 'right' },
  actions: { flexDirection: 'row-reverse', alignItems: 'center', gap: 8 },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
});
