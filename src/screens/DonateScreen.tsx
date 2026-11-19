import React from 'react';
import { View, Text, StyleSheet, ScrollView, Pressable, Linking } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useApp } from '../store';
import { FONTS } from '../theme';
import { Nav } from '../nav';
import { AppHeader } from '../components/AppHeader';
import { DONATION_NETWORK, DONATION_WALLET, donateReady } from '../config';
import { logEvent } from '../log';

export function DonateScreen({ nav }: { nav: Nav }) {
  const { pal, t, vibrate } = useApp();
  const ready = donateReady();

  const contact = async () => {
    vibrate();
    try {
      await Linking.openURL('https://rubika.ir/yasmajyd');
    } catch (e) {
      logEvent('donate', `open contact failed: ${(e as Error)?.message ?? e}`);
    }
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

          {ready ? (
            <>
              <Text style={[styles.label, { color: pal.muted }]}>{t('donate.network')}</Text>
              <Text style={[styles.value, { color: pal.text }]}>{DONATION_NETWORK}</Text>
              <Text style={[styles.label, { color: pal.muted }]}>{t('donate.wallet')}</Text>
              <Text selectable style={[styles.wallet, { color: pal.accent, borderColor: pal.border }]}>
                {DONATION_WALLET}
              </Text>
            </>
          ) : (
            <Text style={[styles.pending, { color: pal.muted }]}>{t('donate.pending')}</Text>
          )}

          <Pressable
            onPress={contact}
            style={({ pressed }) => [styles.cta, { backgroundColor: pal.accentSoft, opacity: pressed ? 0.8 : 1 }]}
          >
            <Ionicons name="chatbubble-ellipses-outline" size={17} color={pal.accent} />
            <Text style={[styles.ctaText, { color: pal.accent }]}>@yasmajyd</Text>
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
  label: { fontFamily: FONTS.regular, fontSize: 11, marginTop: 14 },
  value: { fontFamily: FONTS.medium, fontSize: 13, marginTop: 4 },
  wallet: {
    fontFamily: FONTS.regular,
    fontSize: 12,
    marginTop: 6,
    borderWidth: 1,
    borderRadius: 12,
    padding: 10,
    writingDirection: 'ltr',
    textAlign: 'center',
    alignSelf: 'stretch',
  },
  pending: { fontFamily: FONTS.regular, fontSize: 11.5, lineHeight: 21, textAlign: 'center', marginTop: 12 },
  cta: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    height: 44,
    borderRadius: 13,
    paddingHorizontal: 20,
    marginTop: 18,
    alignSelf: 'stretch',
  },
  ctaText: { fontFamily: FONTS.semi, fontSize: 12.5 },
});
