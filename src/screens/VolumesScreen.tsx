import React from 'react';
import { View, Text, StyleSheet, ScrollView, Pressable } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useApp } from '../store';
import { FONTS } from '../theme';
import { Nav } from '../nav';
import { AppHeader } from '../components/AppHeader';
import { VOLUMES } from '../volumes';

type Props = {
  nav: Nav;
  activeVolume: number;
  onSelectVolume: (id: number) => void;
};

export function VolumesScreen({ nav, activeVolume, onSelectVolume }: Props) {
  const { pal, t, num, lang } = useApp();

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: pal.bg }]} edges={['top']}>
      <AppHeader
        pal={pal}
        title={t('volumes.title')}
        subtitle={t('volumes.subtitle')}
        onBack={nav.back}
        onMenu={nav.openDrawer}
      />
      <ScrollView contentContainerStyle={{ padding: 14, paddingBottom: 36 }}>
        {VOLUMES.map((v) => {
          const isCurrent = v.id === activeVolume && v.ready;
          return (
            <Pressable
              key={v.id}
              disabled={!v.ready}
              onPress={() => {
                if (v.ready) onSelectVolume(v.id);
              }}
              style={({ pressed }) => [
                styles.card,
                {
                  backgroundColor: pal.surface,
                  borderColor: isCurrent ? pal.accent : pal.border,
                  opacity: v.ready ? (pressed ? 0.85 : 1) : 0.55,
                },
              ]}
            >
              <View style={[styles.badge, { backgroundColor: isCurrent ? pal.accent : pal.accentSoft }]}>
                <Ionicons
                  name={v.ready ? 'book' : 'lock-closed'}
                  size={20}
                  color={isCurrent ? pal.onAccent : pal.muted}
                />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={[styles.title, { color: pal.text }]}>
                  {lang === 'en' ? v.titleEn : v.titleFa}
                </Text>
                <Text style={[styles.sub, { color: v.ready ? pal.accent : pal.muted }]}>
                  {isCurrent ? t('volumes.current') : v.ready ? t('volumes.ready') : t('common.comingSoon')}
                </Text>
              </View>
              <Text style={[styles.num, { color: pal.muted }]}>{num(v.id)}</Text>
            </Pressable>
          );
        })}

        <Text style={[styles.notice, { color: pal.muted }]}>{t('volumes.notice')}</Text>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1 },
  card: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    gap: 12,
    borderWidth: 1.5,
    borderRadius: 18,
    padding: 14,
    marginBottom: 10,
  },
  badge: { width: 42, height: 42, borderRadius: 13, alignItems: 'center', justifyContent: 'center' },
  title: { fontFamily: FONTS.semi, fontSize: 14, textAlign: 'right' },
  sub: { fontFamily: FONTS.regular, fontSize: 11, marginTop: 3, textAlign: 'right' },
  num: { fontFamily: FONTS.semi, fontSize: 12 },
  notice: { fontFamily: FONTS.regular, fontSize: 11, lineHeight: 19, textAlign: 'right', marginTop: 14, paddingHorizontal: 4 },
});
