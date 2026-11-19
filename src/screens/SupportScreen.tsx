import React from 'react';
import { View, Text, StyleSheet, ScrollView, Pressable, Linking } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useApp } from '../store';
import { FONTS } from '../theme';
import { Nav } from '../nav';
import { AppHeader } from '../components/AppHeader';
import { SUPPORT_RUBIKA_ID, SUPPORT_RUBIKA_URL } from '../config';
import { logEvent } from '../log';

export function SupportScreen({ nav }: { nav: Nav }) {
  const { pal, t, vibrate } = useApp();

  const openRubika = async () => {
    vibrate();
    try {
      await Linking.openURL(SUPPORT_RUBIKA_URL);
    } catch (e) {
      logEvent('support', `open rubika failed: ${(e as Error)?.message ?? e}`);
    }
  };

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: pal.bg }]} edges={['top']}>
      <AppHeader
        pal={pal}
        title={t('support.title')}
        subtitle={t('support.subtitle')}
        onBack={nav.back}
        onMenu={nav.openDrawer}
      />
      <ScrollView contentContainerStyle={{ padding: 14, paddingBottom: 36 }}>
        <View style={[styles.card, { backgroundColor: pal.surface, borderColor: pal.border }]}>
          <View style={[styles.badge, { backgroundColor: pal.accentSoft }]}>
            <Ionicons name="chatbubbles" size={22} color={pal.accent} />
          </View>
          <Text style={[styles.title, { color: pal.text }]}>{t('support.rubika')}</Text>
          <Text style={[styles.hint, { color: pal.muted }]}>{t('support.rubikaHint')}</Text>
          <Text selectable style={[styles.id, { color: pal.accent }]}>
            {SUPPORT_RUBIKA_ID}
          </Text>
          <Pressable
            onPress={openRubika}
            style={({ pressed }) => [styles.cta, { backgroundColor: pal.accent, opacity: pressed ? 0.85 : 1 }]}
          >
            <Ionicons name="open-outline" size={17} color={pal.onAccent} />
            <Text style={[styles.ctaText, { color: pal.onAccent }]}>{t('support.rubika')}</Text>
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
  hint: { fontFamily: FONTS.regular, fontSize: 11.5, lineHeight: 20, textAlign: 'center', marginTop: 6 },
  id: { fontFamily: FONTS.bold, fontSize: 15, marginTop: 12, writingDirection: 'ltr' },
  cta: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    height: 46,
    borderRadius: 14,
    paddingHorizontal: 22,
    marginTop: 16,
    alignSelf: 'stretch',
  },
  ctaText: { fontFamily: FONTS.semi, fontSize: 13 },
});
