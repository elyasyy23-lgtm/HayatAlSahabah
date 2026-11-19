import React from 'react';
import { View, Text, StyleSheet, ScrollView, Pressable, Share } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useApp } from '../store';
import { FONTS } from '../theme';
import { Nav } from '../nav';
import { AppHeader } from '../components/AppHeader';
import { SHARE_URL, shareReady } from '../config';

export function ShareScreen({ nav }: { nav: Nav }) {
  const { pal, t, vibrate } = useApp();

  const doShare = async () => {
    vibrate();
    const body = shareReady() ? `${t('share.message')}\n${SHARE_URL}` : t('share.message');
    try {
      await Share.share({ message: body });
    } catch {
      /* the user dismissed the sheet */
    }
  };

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: pal.bg }]} edges={['top']}>
      <AppHeader
        pal={pal}
        title={t('share.title')}
        subtitle={t('share.subtitle')}
        onBack={nav.back}
        onMenu={nav.openDrawer}
      />
      <ScrollView contentContainerStyle={{ padding: 14, paddingBottom: 36 }}>
        <View style={[styles.hero, { backgroundColor: pal.surface, borderColor: pal.border }]}>
          <View style={[styles.badge, { backgroundColor: pal.accentSoft }]}>
            <Ionicons name="share-social" size={26} color={pal.accent} />
          </View>
          <Text style={[styles.message, { color: pal.text }]}>{t('share.message')}</Text>
        </View>

        <Pressable
          onPress={doShare}
          style={({ pressed }) => [styles.cta, { backgroundColor: pal.accent, opacity: pressed ? 0.85 : 1 }]}
        >
          <Ionicons name="share-outline" size={18} color={pal.onAccent} />
          <Text style={[styles.ctaText, { color: pal.onAccent }]}>{t('nav.share')}</Text>
        </Pressable>

        {shareReady() ? null : (
          <Text style={[styles.pending, { color: pal.muted }]}>{t('share.pending')}</Text>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1 },
  hero: { borderWidth: 1, borderRadius: 20, padding: 20, alignItems: 'center' },
  badge: { width: 56, height: 56, borderRadius: 18, alignItems: 'center', justifyContent: 'center', marginBottom: 12 },
  message: { fontFamily: FONTS.medium, fontSize: 13, lineHeight: 24, textAlign: 'center' },
  cta: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    height: 48,
    borderRadius: 15,
    marginTop: 16,
  },
  ctaText: { fontFamily: FONTS.semi, fontSize: 13.5 },
  pending: { fontFamily: FONTS.regular, fontSize: 11, lineHeight: 19, textAlign: 'center', marginTop: 14 },
});
