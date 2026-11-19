import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, Pressable, Share } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useApp } from '../store';
import { FONTS } from '../theme';
import { Nav } from '../nav';
import { AppHeader } from '../components/AppHeader';
import { clearLogs, formatClock, getLogs, LogEntry, subscribeLogs } from '../log';
import { getDbError } from '../db';

export function LogsScreen({ nav }: { nav: Nav }) {
  const { pal, t, num, vibrate } = useApp();
  const [entries, setEntries] = useState<LogEntry[]>(getLogs());
  const [dbError, setDbError] = useState<string | null>(getDbError());

  useEffect(() => {
    setEntries(getLogs());
    setDbError(getDbError());
    return subscribeLogs(() => setEntries(getLogs()));
  }, []);

  const onClear = () => {
    vibrate();
    clearLogs();
    setEntries([]);
  };

  const onCopy = async () => {
    vibrate();
    const body =
      entries.length === 0
        ? t('logs.empty')
        : entries.map((e) => `${formatClock(e.at)} [${e.tag}] ${e.message}`).join('\n');
    try {
      await Share.share({ message: body });
    } catch {
      /* dismissed */
    }
  };

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: pal.bg }]} edges={['top']}>
      <AppHeader
        pal={pal}
        title={t('logs.title')}
        subtitle={t('logs.subtitle')}
        onBack={nav.back}
        onMenu={nav.openDrawer}
      />
      <ScrollView contentContainerStyle={{ padding: 14, paddingBottom: 36 }}>
        <View
          style={[
            styles.health,
            {
              backgroundColor: dbError ? pal.goldSoft : pal.accentSoft,
              borderColor: dbError ? pal.gold : pal.accent,
            },
          ]}
        >
          <Ionicons
            name={dbError ? 'alert-circle-outline' : 'checkmark-circle-outline'}
            size={18}
            color={dbError ? pal.gold : pal.accent}
          />
          <View style={{ flex: 1 }}>
            <Text style={[styles.healthTitle, { color: pal.text }]}>
              {t('logs.health')}: {dbError ? t('logs.problem') : t('logs.healthy')}
            </Text>
            {dbError ? (
              <Text style={[styles.healthDetail, { color: pal.muted }]} numberOfLines={3}>
                {dbError}
              </Text>
            ) : null}
          </View>
        </View>

        <View style={styles.actions}>
          <Pressable
            onPress={onClear}
            style={({ pressed }) => [
              styles.btn,
              { backgroundColor: pal.surface, borderColor: pal.border, opacity: pressed ? 0.7 : 1 },
            ]}
          >
            <Ionicons name="trash-outline" size={15} color={pal.muted} />
            <Text style={[styles.btnText, { color: pal.muted }]}>{t('logs.clear')}</Text>
          </Pressable>
          <Pressable
            onPress={onCopy}
            style={({ pressed }) => [
              styles.btn,
              { backgroundColor: pal.accentSoft, borderColor: pal.accent, opacity: pressed ? 0.7 : 1 },
            ]}
          >
            <Ionicons name="share-outline" size={15} color={pal.accent} />
            <Text style={[styles.btnText, { color: pal.accent }]}>{t('logs.copy')}</Text>
          </Pressable>
        </View>

        {entries.length === 0 ? (
          <Text style={[styles.empty, { color: pal.muted }]}>{t('logs.empty')}</Text>
        ) : (
          entries.map((e, i) => (
            <View
              key={`${e.at}-${i}`}
              style={[styles.entry, { backgroundColor: pal.surface, borderColor: pal.border }]}
            >
              <View style={styles.entryHead}>
                <Text style={[styles.tag, { color: pal.accent }]}>{e.tag}</Text>
                <Text style={[styles.time, { color: pal.muted }]}>{num(formatClock(e.at))}</Text>
              </View>
              <Text style={[styles.message, { color: pal.text }]}>{e.message}</Text>
            </View>
          ))
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1 },
  health: {
    flexDirection: 'row-reverse',
    alignItems: 'flex-start',
    gap: 10,
    borderWidth: 1,
    borderRadius: 14,
    padding: 12,
  },
  healthTitle: { fontFamily: FONTS.semi, fontSize: 12, textAlign: 'right' },
  healthDetail: { fontFamily: FONTS.regular, fontSize: 10.5, marginTop: 3, textAlign: 'right', lineHeight: 16 },
  actions: { flexDirection: 'row-reverse', gap: 8, marginTop: 12, marginBottom: 10 },
  btn: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    gap: 6,
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 12,
    height: 36,
  },
  btnText: { fontFamily: FONTS.medium, fontSize: 11.5 },
  empty: { fontFamily: FONTS.regular, fontSize: 12, textAlign: 'center', marginTop: 30 },
  entry: { borderWidth: 1, borderRadius: 13, padding: 11, marginBottom: 7 },
  entryHead: { flexDirection: 'row-reverse', justifyContent: 'space-between', marginBottom: 4 },
  tag: { fontFamily: FONTS.semi, fontSize: 10.5 },
  time: { fontFamily: FONTS.regular, fontSize: 10 },
  message: { fontFamily: FONTS.regular, fontSize: 11.5, lineHeight: 19, textAlign: 'right' },
});
