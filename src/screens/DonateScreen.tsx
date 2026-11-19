import React, { useEffect, useRef, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, Pressable, Linking } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import * as Clipboard from 'expo-clipboard';
import { useApp } from '../store';
import { FONTS } from '../theme';
import { Nav } from '../nav';
import { AppHeader } from '../components/AppHeader';
import { DONATION_NETWORK, DONATION_TOKEN, DONATION_WALLET, SUPPORT_RUBIKA_ID, SUPPORT_RUBIKA_URL } from '../config';
import { copyExact } from '../clipboard';
import { logEvent } from '../log';

export function DonateScreen({ nav }: { nav: Nav }) {
  const { pal, t, vibrate } = useApp();
  const [copied, setCopied] = useState(false);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => () => {
    if (timer.current) clearTimeout(timer.current);
  }, []);

  const contact = async () => {
    vibrate();
    try {
      await Linking.openURL(SUPPORT_RUBIKA_URL);
    } catch (e) {
      logEvent('donate', `open contact failed: ${(e as Error)?.message ?? e}`);
    }
  };

  const copyWallet = async () => {
    vibrate();
    const done = await copyExact(Clipboard.setStringAsync, DONATION_WALLET);
    if (!done) {
      logEvent('donate', 'copy wallet failed: clipboard unavailable');
      return;
    }
    setCopied(true);
    if (timer.current) clearTimeout(timer.current);
    timer.current = setTimeout(() => setCopied(false), 1600);
  };

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: pal.bg }]} edges={['top']}>
      <AppHeader
        pal={pal}
        title={t('donate.title')}
        subtitle={t('donate.subtitle')}
        onBack={nav.back}
        onMenu={nav.openDrawer}
      />
      <ScrollView contentContainerStyle={{ padding: 14, paddingBottom: 36 }}>
        <View style={[styles.card, { backgroundColor: pal.surface, borderColor: pal.border }]}>
          <View style={[styles.badge, { backgroundColor: pal.goldSoft }]}>
            <Ionicons name="heart" size={22} color={pal.gold} />
          </View>
          <Text style={[styles.title, { color: pal.text }]}>{t('donate.title')}</Text>

          <View style={styles.metaRow}>
            <View style={[styles.metaPill, { backgroundColor: pal.accentSoft, borderColor: pal.border }]}>
              <Text style={[styles.metaText, { color: pal.accent }]}>{DONATION_TOKEN}</Text>
            </View>
            <View style={[styles.metaPill, { backgroundColor: pal.goldSoft, borderColor: pal.border }]}>
              <Text style={[styles.metaText, { color: pal.gold }]}>{DONATION_NETWORK}</Text>
            </View>
          </View>

          <Text style={[styles.label, { color: pal.muted }]}>{t('donate.wallet')}</Text>
          <Text selectable style={[styles.wallet, { color: pal.text, borderColor: pal.border, backgroundColor: pal.bg }]}>
            {DONATION_WALLET}
          </Text>

          <Pressable
            onPress={copyWallet}
            accessibilityRole="button"
            accessibilityLabel={t('donate.copyWallet')}
            style={({ pressed }) => [
              styles.cta,
              { backgroundColor: copied ? pal.accentSoft : pal.accent, opacity: pressed ? 0.85 : 1 },
            ]}
          >
            <Ionicons
              name={copied ? 'checkmark-circle' : 'copy-outline'}
              size={17}
              color={copied ? pal.accent : pal.onAccent}
            />
            <Text style={[styles.ctaText, { color: copied ? pal.accent : pal.onAccent }]}>
              {copied ? t('common.copied') : t('donate.copyWallet')}
            </Text>
          </Pressable>

          <Text style={[styles.note, { color: pal.muted }]}>{t('donate.note')}</Text>

          <Pressable
            onPress={contact}
            accessibilityRole="button"
            accessibilityLabel={t('support.rubika')}
            style={({ pressed }) => [styles.secondary, { borderColor: pal.border, opacity: pressed ? 0.8 : 1 }]}
          >
            <Ionicons name="chatbubble-ellipses-outline" size={16} color={pal.accent} />
            <Text style={[styles.secondaryText, { color: pal.accent }]}>{SUPPORT_RUBIKA_ID}</Text>
          </Pressable>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1 },
  card: { borderWidth: 1, borderRadius: 20, padding: 20, alignItems: 'center' },
  badge: { width: 54, height: 54, borderRadius: 18, alignItems: 'center', justifyContent: 'center', marginBottom: 12 },
  title: { fontFamily: FONTS.semi, fontSize: 14.5, textAlign: 'center' },
  metaRow: { flexDirection: 'row-reverse', gap: 8, marginTop: 12 },
  metaPill: { borderWidth: 1, borderRadius: 999, paddingHorizontal: 12, paddingVertical: 4 },
  metaText: { fontFamily: FONTS.semi, fontSize: 11.5, writingDirection: 'ltr' },
  label: { fontFamily: FONTS.regular, fontSize: 11, marginTop: 16, alignSelf: 'flex-start' },
  wallet: {
    fontFamily: FONTS.medium,
    fontSize: 12,
    marginTop: 6,
    borderWidth: 1,
    borderRadius: 12,
    padding: 11,
    writingDirection: 'ltr',
    textAlign: 'center',
    alignSelf: 'stretch',
    lineHeight: 20,
  },
  cta: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    height: 46,
    borderRadius: 14,
    paddingHorizontal: 20,
    marginTop: 14,
    alignSelf: 'stretch',
  },
  ctaText: { fontFamily: FONTS.semi, fontSize: 13 },
  note: { fontFamily: FONTS.regular, fontSize: 11, lineHeight: 20, textAlign: 'center', marginTop: 12 },
  secondary: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 7,
    height: 40,
    borderRadius: 12,
    borderWidth: 1,
    marginTop: 12,
    alignSelf: 'stretch',
  },
  secondaryText: { fontFamily: FONTS.semi, fontSize: 12, writingDirection: 'ltr' },
});
