import React from 'react';
import { View, Text, StyleSheet, ScrollView } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useApp } from '../store';
import { FONTS } from '../theme';
import { Nav } from '../nav';
import { AppHeader } from '../components/AppHeader';
import { AUDIT_SUMMARY } from '../audit';

export function AuditScreen({ nav }: { nav: Nav }) {
  const { pal, t, num, lang } = useApp();

  const figures = [
    { key: 'audit.persons', value: AUDIT_SUMMARY.persons, icon: 'people-outline' as const },
    { key: 'audit.attributions', value: AUDIT_SUMMARY.attributions, icon: 'pricetags-outline' as const },
    { key: 'audit.review', value: AUDIT_SUMMARY.review, icon: 'help-buoy-outline' as const },
  ];

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: pal.bg }]} edges={['top']}>
      <AppHeader
        pal={pal}
        title={t('audit.title')}
        subtitle={t('audit.subtitle')}
        onBack={nav.back}
        onMenu={nav.openDrawer}
      />
      <ScrollView contentContainerStyle={{ padding: 14, paddingBottom: 36 }}>
        <View style={styles.figures}>
          {figures.map((f) => (
            <View
              key={f.key}
              style={[styles.figure, { backgroundColor: pal.surface, borderColor: pal.border }]}
            >
              <Ionicons name={f.icon} size={16} color={pal.accent} />
              <Text style={[styles.figureValue, { color: pal.text }]}>{num(f.value)}</Text>
              <Text style={[styles.figureLabel, { color: pal.muted }]} numberOfLines={2}>
                {t(f.key)}
              </Text>
            </View>
          ))}
        </View>

        <Text style={[styles.section, { color: pal.muted }]}>{t('audit.policyTitle')}</Text>
        <View style={[styles.card, { backgroundColor: pal.surface, borderColor: pal.border }]}>
          <Text style={[styles.para, { color: pal.text }]}>{t('audit.policyBody')}</Text>
        </View>

        <Text style={[styles.section, { color: pal.muted }]}>{t('audit.markersTitle')}</Text>
        <View style={[styles.card, { backgroundColor: pal.surface, borderColor: pal.border }]}>
          {AUDIT_SUMMARY.markers.map((m, i) => (
            <View key={m.marker}>
              {i > 0 ? <View style={[styles.hr, { backgroundColor: pal.border }]} /> : null}
              <View style={styles.markerRow}>
                <View style={[styles.markerBadge, { backgroundColor: pal.accentSoft }]}>
                  <Text style={[styles.markerGlyph, { color: pal.accent }]}>{m.marker}</Text>
                </View>
                <Text style={[styles.markerLabel, { color: pal.text }]}>
                  {lang === 'en' ? m.en : m.fa}
                </Text>
                <Text style={[styles.markerCount, { color: pal.muted }]}>{num(m.count)}</Text>
              </View>
            </View>
          ))}
        </View>
        <Text style={[styles.para, { color: pal.muted, marginTop: 10 }]}>{t('audit.markersBody')}</Text>

        <View style={[styles.note, { backgroundColor: pal.goldSoft, borderColor: pal.gold }]}>
          <Ionicons name="shield-outline" size={16} color={pal.gold} />
          <Text style={[styles.noteText, { color: pal.text }]}>{t('audit.separate')}</Text>
        </View>
        <Text style={[styles.para, { color: pal.muted, marginTop: 8 }]}>{t('audit.note')}</Text>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1 },
  figures: { flexDirection: 'row-reverse', gap: 8 },
  figure: { flex: 1, borderWidth: 1, borderRadius: 16, padding: 12, alignItems: 'center', gap: 4 },
  figureValue: { fontFamily: FONTS.bold, fontSize: 18 },
  figureLabel: { fontFamily: FONTS.regular, fontSize: 9.5, textAlign: 'center', lineHeight: 14 },
  section: { fontFamily: FONTS.semi, fontSize: 11, textAlign: 'right', marginTop: 18, marginBottom: 8, marginHorizontal: 4 },
  card: { borderWidth: 1, borderRadius: 16, paddingHorizontal: 14 },
  para: { fontFamily: FONTS.regular, fontSize: 12, lineHeight: 23, textAlign: 'right', paddingVertical: 12, writingDirection: 'rtl' },
  hr: { height: 1 },
  markerRow: { flexDirection: 'row-reverse', alignItems: 'center', gap: 10, paddingVertical: 10 },
  markerBadge: { width: 30, height: 30, borderRadius: 10, alignItems: 'center', justifyContent: 'center' },
  markerGlyph: { fontFamily: FONTS.arabicBold, fontSize: 15 },
  markerLabel: { fontFamily: FONTS.medium, fontSize: 11.5, flex: 1, textAlign: 'right' },
  markerCount: { fontFamily: FONTS.semi, fontSize: 11 },
  note: { flexDirection: 'row-reverse', alignItems: 'center', gap: 8, borderWidth: 1, borderRadius: 14, padding: 12, marginTop: 16 },
  noteText: { fontFamily: FONTS.medium, fontSize: 11, flex: 1, textAlign: 'right', lineHeight: 18 },
});
