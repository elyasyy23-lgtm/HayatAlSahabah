import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  View,
  Text,
  Pressable,
  StyleSheet,
  Modal,
  Animated,
  PanResponder,
  useWindowDimensions,
  ScrollView,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useApp } from '../store';
import { FONTS } from '../theme';
import { Route } from '../nav';
import { APP_VERSION } from '../config';

type Item = {
  route: Route;
  key: string;
  labelKey: string;
  icon: React.ComponentProps<typeof Ionicons>['name'];
};

const ITEMS: Item[] = [
  { route: { name: 'home' }, key: 'home', labelKey: 'nav.home', icon: 'home-outline' },
  { route: { name: 'volumes' }, key: 'volumes', labelKey: 'nav.volumes', icon: 'library-outline' },
  { route: { name: 'settings' }, key: 'settings', labelKey: 'nav.settings', icon: 'settings-outline' },
  { route: { name: 'help' }, key: 'help', labelKey: 'nav.help', icon: 'help-circle-outline' },
  { route: { name: 'share' }, key: 'share', labelKey: 'nav.share', icon: 'share-social-outline' },
  { route: { name: 'support' }, key: 'support', labelKey: 'nav.support', icon: 'chatbubbles-outline' },
  { route: { name: 'donate' }, key: 'donate', labelKey: 'nav.donate', icon: 'heart-outline' },
  { route: { name: 'logs' }, key: 'logs', labelKey: 'nav.logs', icon: 'bug-outline' },
  { route: { name: 'about' }, key: 'about', labelKey: 'nav.about', icon: 'information-circle-outline' },
];

type Props = {
  visible: boolean;
  active: Route['name'];
  onClose: () => void;
  onSelect: (r: Route) => void;
};

export function Drawer({ visible, active, onClose, onSelect }: Props) {
  const { pal, t, num } = useApp();
  const insets = useSafeAreaInsets();
  const { width } = useWindowDimensions();
  const panelWidth = Math.min(330, Math.round(width * 0.85));

  const anim = useRef(new Animated.Value(0)).current;
  const visibleRef = useRef(visible);
  const [mounted, setMounted] = useState(visible);

  useEffect(() => {
    visibleRef.current = visible;
    if (visible) {
      setMounted(true);
      Animated.timing(anim, { toValue: 1, duration: 210, useNativeDriver: true }).start();
    } else {
      Animated.timing(anim, { toValue: 0, duration: 170, useNativeDriver: true }).start(
        ({ finished }) => {
          if (finished && !visibleRef.current) setMounted(false);
        },
      );
    }
  }, [visible, anim]);

  const close = useCallback(() => {
    onClose();
  }, [onClose]);

  const pan = useMemo(
    () =>
      PanResponder.create({
        onMoveShouldSetPanResponder: (_e, g) => Math.abs(g.dx) > 6 && Math.abs(g.dx) > Math.abs(g.dy),
        onPanResponderMove: (_e, g) => {
          const next = Math.max(0, Math.min(1, 1 - g.dx / panelWidth));
          anim.setValue(next);
        },
        onPanResponderRelease: (_e, g) => {
          if (g.dx > panelWidth * 0.28 || g.vx > 0.6) {
            close();
          } else {
            Animated.spring(anim, { toValue: 1, useNativeDriver: true, bounciness: 0 }).start();
          }
        },
        onPanResponderTerminate: () => {
          Animated.spring(anim, { toValue: 1, useNativeDriver: true, bounciness: 0 }).start();
        },
      }),
    [anim, panelWidth, close],
  );

  if (!mounted) return null;

  const translateX = anim.interpolate({ inputRange: [0, 1], outputRange: [panelWidth, 0] });
  const backdropOpacity = anim.interpolate({ inputRange: [0, 1], outputRange: [0, 0.55] });

  return (
    <Modal visible transparent animationType="none" onRequestClose={close} statusBarTranslucent>
      <View style={styles.host}>
        <Animated.View style={[styles.backdrop, { opacity: backdropOpacity }]}>
          <Pressable style={StyleSheet.absoluteFill} onPress={close} accessibilityLabel={t('common.close')} />
        </Animated.View>

        <Animated.View
          style={[
            styles.panel,
            {
              width: panelWidth,
              backgroundColor: pal.surface,
              borderLeftColor: pal.border,
              paddingTop: insets.top + 18,
              paddingBottom: insets.bottom + 12,
              transform: [{ translateX }],
            },
          ]}
          {...pan.panHandlers}
        >
          <View style={styles.brand}>
            <View style={[styles.brandBadge, { backgroundColor: pal.accentSoft }]}>
              <Ionicons name="book" size={24} color={pal.accent} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={[styles.brandTitle, { color: pal.text }]}>{t('app.name')}</Text>
              <Text style={[styles.brandSub, { color: pal.muted }]}>{t('app.tagline')}</Text>
            </View>
            <Pressable onPress={close} hitSlop={12} style={styles.closeBtn}>
              <Ionicons name="close" size={20} color={pal.muted} />
            </Pressable>
          </View>

          <View style={[styles.rule, { backgroundColor: pal.border }]} />

          <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingVertical: 6 }}>
            {ITEMS.map((item) => {
              const isActive = item.key === active;
              return (
                <Pressable
                  key={item.key}
                  onPress={() => {
                    onSelect(item.route);
                    close();
                  }}
                  style={({ pressed }) => [
                    styles.item,
                    { backgroundColor: isActive ? pal.accentSoft : 'transparent', opacity: pressed ? 0.7 : 1 },
                  ]}
                  accessibilityRole="button"
                  accessibilityState={{ selected: isActive }}
                >
                  <Ionicons
                    name={item.icon}
                    size={19}
                    color={isActive ? pal.accent : pal.muted}
                  />
                  <Text
                    style={[
                      styles.itemLabel,
                      { color: isActive ? pal.text : pal.muted, fontFamily: isActive ? FONTS.semi : FONTS.medium },
                    ]}
                  >
                    {t(item.labelKey)}
                  </Text>
                  {isActive ? <View style={[styles.activeDot, { backgroundColor: pal.accent }]} /> : null}
                </Pressable>
              );
            })}
          </ScrollView>

          <View style={[styles.rule, { backgroundColor: pal.border }]} />
          <Text style={[styles.footer, { color: pal.muted }]}>
            {t('common.version')} {num(APP_VERSION)} · {t('common.offline')}
          </Text>
        </Animated.View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  host: { flex: 1 },
  backdrop: { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: '#000' },
  panel: {
    position: 'absolute',
    top: 0,
    bottom: 0,
    right: 0,
    borderLeftWidth: 1,
    paddingHorizontal: 14,
  },
  brand: { flexDirection: 'row-reverse', alignItems: 'center', gap: 11, paddingHorizontal: 4, paddingBottom: 14 },
  brandBadge: { width: 46, height: 46, borderRadius: 15, alignItems: 'center', justifyContent: 'center' },
  brandTitle: { fontFamily: FONTS.bold, fontSize: 15.5, textAlign: 'right' },
  brandSub: { fontFamily: FONTS.regular, fontSize: 10.5, marginTop: 3, textAlign: 'right' },
  closeBtn: { padding: 4 },
  rule: { height: 1, marginVertical: 8 },
  item: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    gap: 12,
    paddingVertical: 12,
    paddingHorizontal: 12,
    borderRadius: 13,
    marginBottom: 2,
  },
  itemLabel: { fontSize: 13.5, flex: 1, textAlign: 'right' },
  activeDot: { width: 6, height: 6, borderRadius: 3 },
  footer: { fontFamily: FONTS.regular, fontSize: 10.5, textAlign: 'center', marginTop: 6 },
});
