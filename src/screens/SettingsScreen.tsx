import React, { useCallback, useEffect, useState } from 'react';
import { View, Text, Pressable, StyleSheet, ScrollView, Switch, Alert } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useSQLiteContext } from 'expo-sqlite';
import { useApp } from '../store';
import { FONTS, Palette } from '../theme';
import { resetProgress } from '../db';
import { Nav } from '../nav';
import { AppHeader } from '../components/AppHeader';
import { APP_VERSION } from '../config';
import { UpdateModal } from '../components/UpdateModal';
import { UpdateInfo, fetchUpdateInfo, shouldNotify, updateCheckConfigured } from '../update';

function Stepper({
  label,
  valueText,
  onMinus,
  onPlus,
  pal,
  disabledMinus,
  disabledPlus,
  minusLabel,
  plusLabel,
}: {
  label: string;
  valueText: string;
  onMinus: () => void;
  onPlus: () => void;
  pal: Palette;
  disabledMinus?: boolean;
  disabledPlus?: boolean;
  minusLabel: string;
  plusLabel: string;
}) {
  return (
    <View style={styles.row}>
      <Text style={[styles.rowLabel, { color: pal.text }]}>{label}</Text>
      <View style={styles.stepper}>
        <Pressable
          onPress={onMinus}
          disabled={disabledMinus}
          style={({ pressed }) => [
            styles.stepBtn,
            { backgroundColor: pal.accentSoft, opacity: disabledMinus ? 0.35 : pressed ? 0.6 : 1 },
          ]}
          accessibilityLabel={minusLabel}
        >
          <Ionicons name="remove" size={16} color={pal.accent} />
        </Pressable>
        <Text style={[styles.stepValue, { color: pal.text }]}>{valueText}</Text>
        <Pressable
          onPress={onPlus}
          disabled={disabledPlus}
          style={({ pressed }) => [
            styles.stepBtn,
            { backgroundColor: pal.accentSoft, opacity: disabledPlus ? 0.35 : pressed ? 0.6 : 1 },
          ]}
          accessibilityLabel={plusLabel}
        >
          <Ionicons name="add" size={16} color={pal.accent} />
        </Pressable>
      </View>
    </View>
  );
}

type CheckState = 'idle' | 'checking' | 'upToDate' | 'offline' | 'unconfigured';

export function SettingsScreen({ nav }: { nav: Nav }) {
  const db = useSQLiteContext();
  const { pal, settings, setSetting, t, num, vibrate, lang } = useApp();
  const size = settings.fontSize;

  /** Update notice: silent check when this screen opens. */
  const [update, setUpdate] = useState<UpdateInfo | null>(null);
  const [updateOpen, setUpdateOpen] = useState(false);
  const [checkState, setCheckState] = useState<CheckState>('idle');

  const runCheck = useCallback(async (manual: boolean) => {
    if (!updateCheckConfigured()) {
      setCheckState('unconfigured');
      return;
    }
    if (manual) setCheckState('checking');
    const info = await fetchUpdateInfo();
    if (shouldNotify(info)) {
      setUpdate(info);
      setUpdateOpen(true);
      setCheckState('idle');
      return;
    }
    setCheckState(info ? 'upToDate' : 'offline');
  }, []);

  useEffect(() => {
    void runCheck(false);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const statusText =
    checkState === 'checking'
      ? t('update.checking')
      : checkState === 'upToDate'
        ? t('update.upToDate')
        : checkState === 'offline'
          ? t('update.offline')
          : checkState === 'unconfigured'
            ? t('update.unavailable')
            : t('update.hint');

  const confirmReset = () => {
    vibrate();
    Alert.alert(t('settings.resetTitle'), t('settings.resetBody'), [
      { text: t('common.cancel'), style: 'cancel' },
      {
        text: t('settings.resetDo'),
        style: 'destructive',
        onPress: () => {
          resetProgress(db);
          Alert.alert(t('settings.resetDone'), t('settings.resetDoneBody'));
        },
      },
    ]);
  };

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: pal.bg }]} edges={['top']}>
      <AppHeader
        pal={pal}
        title={t('settings.title')}
        subtitle={t('settings.subtitle')}
        onBack={nav.back}
        onMenu={nav.openDrawer}
      />
      <ScrollView contentContainerStyle={{ padding: 14, paddingBottom: 36 }}>
        <Text style={[styles.section, { color: pal.muted }]}>{t('settings.theme')}</Text>
        <View style={[styles.segment, { backgroundColor: pal.bgAlt, borderColor: pal.border }]}>
          {(
            [
              { key: 'cream', label: t('settings.themeLight'), icon: 'sunny-outline' as const },
              { key: 'night', label: t('settings.themeDark'), icon: 'moon-outline' as const },
            ] as const
          ).map((item) => {
            const active = settings.theme === item.key;
            return (
              <Pressable
                key={item.key}
                onPress={() => {
                  vibrate();
                  setSetting('theme', item.key);
                }}
                style={[
                  styles.segmentItem,
                  active && { backgroundColor: pal.surface, borderColor: pal.border },
                ]}
              >
                <Ionicons name={item.icon} size={16} color={active ? pal.accent : pal.muted} />
                <Text style={[styles.segmentText, { color: active ? pal.text : pal.muted }]}>
                  {item.label}
                </Text>
              </Pressable>
            );
          })}
        </View>

        <Text style={[styles.section, { color: pal.muted }]}>{t('settings.language')}</Text>
        <View style={[styles.segment, { backgroundColor: pal.bgAlt, borderColor: pal.border }]}>
          {(
            [
              { key: 'fa', label: t('settings.langFa') },
              { key: 'en', label: t('settings.langEn') },
            ] as const
          ).map((item) => {
            const active = settings.lang === item.key;
            return (
              <Pressable
                key={item.key}
                onPress={() => {
                  vibrate();
                  setSetting('lang', item.key);
                }}
                style={[
                  styles.segmentItem,
                  active && { backgroundColor: pal.surface, borderColor: pal.border },
                ]}
              >
                <Text style={[styles.segmentText, { color: active ? pal.text : pal.muted }]}>
                  {item.label}
                </Text>
              </Pressable>
            );
          })}
        </View>
        <Text style={[styles.hintBelow, { color: pal.muted }]}>{t('settings.languageHint')}</Text>

        <Text style={[styles.section, { color: pal.muted }]}>{t('settings.reading')}</Text>
        <View style={[styles.card, { backgroundColor: pal.surface, borderColor: pal.border }]}>
          <Stepper
            label={t('settings.fontSize')}
            valueText={num(size)}
            pal={pal}
            minusLabel={t('settings.fontSize')}
            plusLabel={t('settings.fontSize')}
            onMinus={() => setSetting('fontSize', Math.max(14, size - 1))}
            onPlus={() => setSetting('fontSize', Math.min(28, size + 1))}
            disabledMinus={size <= 14}
            disabledPlus={size >= 28}
          />
          <View style={[styles.hr, { backgroundColor: pal.border }]} />
          <Stepper
            label={t('settings.lineHeight')}
            valueText={num(settings.lineHeight.toFixed(1))}
            pal={pal}
            minusLabel={t('settings.lineHeight')}
            plusLabel={t('settings.lineHeight')}
            onMinus={() =>
              setSetting('lineHeight', Math.max(1.5, Math.round((settings.lineHeight - 0.1) * 10) / 10))
            }
            onPlus={() =>
              setSetting('lineHeight', Math.min(2.6, Math.round((settings.lineHeight + 0.1) * 10) / 10))
            }
            disabledMinus={settings.lineHeight <= 1.5}
            disabledPlus={settings.lineHeight >= 2.6}
          />
          <View style={[styles.hr, { backgroundColor: pal.border }]} />
          <View style={styles.row}>
            <View style={{ flex: 1 }}>
              <Text style={[styles.rowLabel, { color: pal.text }]}>{t('settings.footnotes')}</Text>
              <Text style={[styles.rowHint, { color: pal.muted }]}>{t('settings.footnotesHint')}</Text>
            </View>
            <Switch
              value={settings.showFootnotes}
              onValueChange={(v) => setSetting('showFootnotes', v)}
              trackColor={{ false: pal.border, true: pal.accentSoft }}
              thumbColor={settings.showFootnotes ? pal.accent : pal.bgAlt}
            />
          </View>
          <View style={[styles.hr, { backgroundColor: pal.border }]} />
          <View style={styles.row}>
            <View style={{ flex: 1 }}>
              <Text style={[styles.rowLabel, { color: pal.text }]}>{t('settings.honorifics')}</Text>
              <Text style={[styles.rowHint, { color: pal.muted }]}>
                {settings.honorifics ? t('settings.honorificsHint') : t('settings.honorificsOff')}
              </Text>
            </View>
            <Switch
              value={settings.honorifics}
              onValueChange={(v) => setSetting('honorifics', v)}
              trackColor={{ false: pal.border, true: pal.accentSoft }}
              thumbColor={settings.honorifics ? pal.accent : pal.bgAlt}
            />
          </View>
          <View style={[styles.hr, { backgroundColor: pal.border }]} />
          <View style={styles.row}>
            <View style={{ flex: 1 }}>
              <Text style={[styles.rowLabel, { color: pal.text }]}>{t('settings.justify')}</Text>
              <Text style={[styles.rowHint, { color: pal.muted }]}>{t('settings.justifyHint')}</Text>
            </View>
            <Switch
              value={settings.justify}
              onValueChange={(v) => setSetting('justify', v)}
              trackColor={{ false: pal.border, true: pal.accentSoft }}
              thumbColor={settings.justify ? pal.accent : pal.bgAlt}
            />
          </View>
          <View style={[styles.hr, { backgroundColor: pal.border }]} />
          <View style={styles.row}>
            <View style={{ flex: 1 }}>
              <Text style={[styles.rowLabel, { color: pal.text }]}>{t('settings.vibration')}</Text>
              <Text style={[styles.rowHint, { color: pal.muted }]}>{t('settings.vibrationHint')}</Text>
            </View>
            <Switch
              value={settings.vibrationOn}
              onValueChange={(v) => {
                setSetting('vibrationOn', v);
                if (v) vibrate();
              }}
              trackColor={{ false: pal.border, true: pal.accentSoft }}
              thumbColor={settings.vibrationOn ? pal.accent : pal.bgAlt}
            />
          </View>
        </View>

        <Text style={[styles.section, { color: pal.muted }]}>{t('settings.preview')}</Text>
        <View style={[styles.preview, { backgroundColor: pal.surface, borderColor: pal.border }]}>
          <Text
            style={{
              fontFamily: FONTS.regular,
              fontSize: size,
              lineHeight: Math.round(size * settings.lineHeight),
              color: pal.text,
              textAlign: settings.justify ? 'justify' : 'right',
              writingDirection: 'rtl',
            }}
          >
            اصحاب رسول خدا صلی اللّه علیه و سلّم، ستارگان آسمان هدایت بودند و زندگی‌شان چراغ راه ماست.
          </Text>
        </View>

        <Text style={[styles.section, { color: pal.muted }]}>{t('settings.data')}</Text>
        <View style={[styles.card, { backgroundColor: pal.surface, borderColor: pal.border }]}>
          <Pressable onPress={confirmReset} style={styles.linkRow}>
            <Ionicons name="refresh-outline" size={18} color={pal.accent} />
            <Text style={[styles.rowLabel, { color: pal.text, flex: 1 }]}>{t('settings.resetProgress')}</Text>
            <Ionicons name="chevron-back" size={15} color={pal.muted} />
          </Pressable>
          <View style={[styles.hr, { backgroundColor: pal.border }]} />
          <Pressable
            onPress={() => {
              vibrate();
              nav.go({ name: 'about' });
            }}
            style={styles.linkRow}
          >
            <Ionicons name="information-circle-outline" size={18} color={pal.accent} />
            <Text style={[styles.rowLabel, { color: pal.text, flex: 1 }]}>{t('settings.aboutBook')}</Text>
            <Ionicons name="chevron-back" size={15} color={pal.muted} />
          </Pressable>
        </View>

        <Text style={[styles.section, { color: pal.muted }]}>{t('update.section')}</Text>
        <View style={[styles.card, { backgroundColor: pal.surface, borderColor: pal.border }]}>
          <Pressable
            onPress={() => {
              vibrate();
              void runCheck(true);
            }}
            disabled={checkState === 'checking'}
            style={styles.linkRow}
          >
            <Ionicons name="cloud-download-outline" size={18} color={pal.accent} />
            <View style={{ flex: 1 }}>
              <Text style={[styles.rowLabel, { color: pal.text }]}>{t('update.check')}</Text>
              <Text style={[styles.rowHint, { color: pal.muted }]}>{statusText}</Text>
            </View>
            <Ionicons
              name={checkState === 'checking' ? 'sync-outline' : 'chevron-back'}
              size={15}
              color={pal.muted}
            />
          </Pressable>
        </View>

        <Text style={[styles.version, { color: pal.muted }]}>
          {t('settings.footer', { v: APP_VERSION })}
        </Text>

        <UpdateModal
          visible={updateOpen}
          info={update}
          pal={pal}
          lang={lang}
          latestLabel={lang === 'en' ? 'Latest version' : 'نسخهٔ تازه:'}
          nowLabel={t('update.now')}
          laterLabel={t('update.later')}
          onClose={() => setUpdateOpen(false)}
        />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1 },
  section: {
    fontFamily: FONTS.semi,
    fontSize: 11,
    textAlign: 'right',
    marginTop: 16,
    marginBottom: 8,
    marginHorizontal: 4,
  },
  segment: {
    flexDirection: 'row-reverse',
    padding: 4,
    borderRadius: 14,
    borderWidth: 1,
    gap: 4,
  },
  segmentItem: {
    flex: 1,
    flexDirection: 'row-reverse',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 10,
    borderRadius: 11,
    borderWidth: 1,
    borderColor: 'transparent',
  },
  segmentText: { fontFamily: FONTS.medium, fontSize: 12.5 },
  hintBelow: { fontFamily: FONTS.regular, fontSize: 10.5, textAlign: 'right', marginTop: 7, marginHorizontal: 4, lineHeight: 17 },
  card: { borderWidth: 1, borderRadius: 16, paddingHorizontal: 14 },
  row: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 10,
    paddingVertical: 12,
  },
  rowLabel: { fontFamily: FONTS.medium, fontSize: 13, textAlign: 'right' },
  rowHint: { fontFamily: FONTS.regular, fontSize: 10.5, marginTop: 3, textAlign: 'right', lineHeight: 17 },
  stepper: { flexDirection: 'row-reverse', alignItems: 'center', gap: 10 },
  stepBtn: { width: 32, height: 32, borderRadius: 10, alignItems: 'center', justifyContent: 'center' },
  stepValue: { fontFamily: FONTS.semi, fontSize: 13, minWidth: 26, textAlign: 'center' },
  hr: { height: 1 },
  preview: { borderWidth: 1, borderRadius: 16, padding: 16 },
  linkRow: { flexDirection: 'row-reverse', alignItems: 'center', gap: 10, paddingVertical: 14 },
  version: { fontFamily: FONTS.regular, fontSize: 10.5, textAlign: 'center', marginTop: 24 },
});
