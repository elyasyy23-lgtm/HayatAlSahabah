import React from 'react';
import { View, Text, StyleSheet, ScrollView } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useApp } from '../store';
import { FONTS } from '../theme';
import { Nav } from '../nav';
import { AppHeader } from '../components/AppHeader';

const STEPS = [1, 2, 3, 4, 5, 6];

export function HelpScreen({ nav }: { nav: Nav }) {
  const { pal, t, num } = useApp();

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: pal.bg }]} edges={['top']}>
      <AppHeader
        pal={pal}
        title={t('help.title')}
        subtitle={t('help.subtitle')}
        onBack={nav.back}
        onMenu={nav.openDrawer}
      />
      <ScrollView contentContainerStyle={{ padding: 14, paddingBottom: 36 }}>
        {STEPS.map((n) => (
          <View
            key={n}
            style={[styles.card, { backgroundColor: pal.surface, borderColor: pal.border }]}
          >
            <View style={[styles.stepNo, { backgroundColor: pal.accentSoft }]}>
              <Text style={[styles.stepNoText, { color: pal.accent }]}>{num(n)}</Text>
            </View>
            <View style={{ flex: 1 }}>
              <Text style={[styles.title, { color: pal.text }]}>{t(`help.s${n}.t`)}</Text>
              <Text style={[styles.desc, { color: pal.muted }]}>{t(`help.s${n}.d`)}</Text>
            </View>
          </View>
        ))}

        <View style={[styles.note, { backgroundColor: pal.goldSoft, borderColor: pal.gold }]}>
          <Ionicons name="shield-checkmark-outline" size={17} color={pal.gold} />
          <Text style={[styles.noteText, { color: pal.text }]}>{t('common.offline')}</Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1 },
  card: {
    flexDirection: 'row-reverse',
    alignItems: 'flex-start',
    gap: 12,
    borderWidth: 1,
    borderRadius: 18,
    padding: 14,
    marginBottom: 10,
  },
  stepNo: { width: 30, height: 30, borderRadius: 10, alignItems: 'center', justifyContent: 'center' },
  stepNoText: { fontFamily: FONTS.bold, fontSize: 13 },
  title: { fontFamily: FONTS.semi, fontSize: 13.5, textAlign: 'right' },
  desc: { fontFamily: FONTS.regular, fontSize: 11.5, lineHeight: 20, textAlign: 'right', marginTop: 4 },
  note: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    gap: 8,
    borderWidth: 1,
    borderRadius: 14,
    padding: 12,
    marginTop: 8,
  },
  noteText: { fontFamily: FONTS.medium, fontSize: 11.5, flex: 1, textAlign: 'right' },
});
