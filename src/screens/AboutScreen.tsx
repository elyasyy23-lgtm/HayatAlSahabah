import React from 'react';
import { View, Text, StyleSheet, ScrollView, Linking, Pressable } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useApp } from '../store';
import { FONTS } from '../theme';
import { toFa } from '../text';
import { Nav } from '../nav';
import { AppHeader } from '../components/AppHeader';

function InfoRow({ k, v, pal }: { k: string; v: string; pal: any }) {
  return (
    <View style={styles.infoRow}>
      <Text style={[styles.infoKey, { color: pal.muted }]}>{k}</Text>
      <Text style={[styles.infoVal, { color: pal.text }]}>{v}</Text>
    </View>
  );
}

export function AboutScreen({ nav }: { nav: Nav }) {
  const { pal, meta, t } = useApp();
  const stats: Array<[string, string]> = [
    ['نویسنده', String(meta.author ?? '—')],
    ['مترجم', String(meta.translator ?? '—')],
    ['صفحه‌های نسخهٔ چاپی', `${toFa(meta.pages ?? 0)} صفحه`],
    ['بخش‌های ساختاری', `${toFa(meta.nodes ?? 0)} عنوان`],
    ['پانویس‌ها', `${toFa(meta.footnotes ?? 0)} پانویس`],
    ['واژگان متن', `${toFa(Number(meta.words ?? 0).toLocaleString('en-US').replace(/,/g, '٬'))} واژه`],
    ['منبع متن', 'فایل Word اصلی (بدون تغییر)'],
    ['اعتبارسنجی', 'مقابله با نسخهٔ چاپی پی‌دی‌اف'],
  ];

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: pal.bg }]} edges={['top']}>
      <AppHeader
        pal={pal}
        title={t('about.title')}
        subtitle={t('about.subtitle')}
        onBack={nav.back}
        onMenu={nav.openDrawer}
      />
      <ScrollView contentContainerStyle={{ padding: 14, paddingBottom: 36 }}>
        <View style={[styles.hero, { backgroundColor: pal.surface, borderColor: pal.border }]}>
          <View style={[styles.heroIcon, { backgroundColor: pal.accentSoft }]}>
            <Ionicons name="book" size={26} color={pal.accent} />
          </View>
          <Text style={[styles.heroTitle, { color: pal.text }]}>{String(meta.title ?? 'حیات صحابه')}</Text>
          <Text style={[styles.heroSub, { color: pal.muted }]}>جلد اول</Text>
        </View>

        <Text style={[styles.section, { color: pal.muted }]}>شناسنامه</Text>
        <View style={[styles.card, { backgroundColor: pal.surface, borderColor: pal.border }]}>
          {stats.map(([k, v], i) => (
            <View key={k}>
              {i > 0 ? <View style={[styles.hr, { backgroundColor: pal.border }]} /> : null}
              <InfoRow k={k} v={v} pal={pal} />
            </View>
          ))}
        </View>

        <Text style={[styles.section, { color: pal.muted }]}>دربارهٔ این نسخه</Text>
        <View style={[styles.card, { backgroundColor: pal.surface, borderColor: pal.border }]}>
          <Text style={[styles.para, { color: pal.text }]}>
            این برنامه متن کامل جلد اول «حیات الصحابه» را به‌صورت کاملاً آفلاین در دسترس قرار می‌دهد.
            متن از نسخهٔ Word اصلی گرفته شده و هیچ واژه‌ای بازنویسی، خلاصه یا جابه‌جا نشده است.
            هر ۴۱۷ پانویس به همان جای اصلی خود پیوند دارد و جدول‌ها و آیات نیز در جای خویش حفظ شده‌اند.
          </Text>
          <View style={[styles.hr, { backgroundColor: pal.border }]} />
          <Text style={[styles.para, { color: pal.text }]}>
            صفحه‌های هر عنوان با نسخهٔ چاپی پی‌دی‌اف مقابله و اصلاح شده‌اند؛ بنابراین شمارهٔ صفحه‌ای که
            در فهرست می‌بینید با همان صفحه در کتاب چاپی یکی است. هیچ داده‌ای از برنامه به اینترنت
            فرستاده نمی‌شود و جستجو، نشان‌ها و تنظیمات همگی روی همین دستگاه ذخیره می‌شوند.
          </Text>
        </View>

        <Text style={[styles.section, { color: pal.muted }]}>راهنمای کوتاه</Text>
        <View style={[styles.card, { backgroundColor: pal.surface, borderColor: pal.border }]}>
          {[
            ['list-outline', 'فهرست', 'همهٔ عنوان‌ها با ساختار باب، فصل و زیرفصل.'],
            ['search-outline', 'جستجو', 'جستجوی واژه در سراسر متن، بدون نیاز به اینترنت.'],
            ['bookmark-outline', 'نشان', 'دکمهٔ نشان در بالای صفحهٔ مطالعه، جای شما را نگه می‌دارد.'],
            ['text-outline', 'فونت', 'اندازهٔ نوشته و فاصلهٔ سطرها را در تنظیمات تغییر دهید.'],
          ].map(([icon, t, d], i) => (
            <View key={t}>
              {i > 0 ? <View style={[styles.hr, { backgroundColor: pal.border }]} /> : null}
              <View style={styles.helpRow}>
                <View style={[styles.helpIcon, { backgroundColor: pal.accentSoft }]}>
                  <Ionicons name={icon as any} size={15} color={pal.accent} />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={[styles.helpTitle, { color: pal.text }]}>{t}</Text>
                  <Text style={[styles.helpText, { color: pal.muted }]}>{d}</Text>
                </View>
              </View>
            </View>
          ))}
        </View>

        <Pressable
          onPress={() => nav.go({ name: 'settings' })}
          style={[styles.cta, { backgroundColor: pal.accent }]}
        >
          <Ionicons name="options-outline" size={17} color="#fff" />
          <Text style={styles.ctaText}>{t('settings.reading')}</Text>
        </Pressable>

        <Text style={[styles.section, { color: pal.muted }]}>{t('about.auditLinkSection')}</Text>
        <View style={[styles.card, { backgroundColor: pal.surface, borderColor: pal.border }]}>
          <Pressable onPress={() => nav.go({ name: 'audit' })} style={styles.linkRow}>
            <View style={[styles.helpIcon, { backgroundColor: pal.accentSoft }]}>
              <Ionicons name="shield-checkmark-outline" size={15} color={pal.accent} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={[styles.helpTitle, { color: pal.text }]}>{t('audit.title')}</Text>
              <Text style={[styles.helpText, { color: pal.muted }]}>{t('about.auditLinkHint')}</Text>
            </View>
            <Ionicons name="chevron-back" size={15} color={pal.muted} />
          </Pressable>
          <View style={[styles.hr, { backgroundColor: pal.border }]} />
          <Pressable onPress={() => nav.go({ name: 'logs' })} style={styles.linkRow}>
            <View style={[styles.helpIcon, { backgroundColor: pal.accentSoft }]}>
              <Ionicons name="document-text-outline" size={15} color={pal.accent} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={[styles.helpTitle, { color: pal.text }]}>{t('nav.logs')}</Text>
              <Text style={[styles.helpText, { color: pal.muted }]}>{t('about.logsLinkHint')}</Text>
            </View>
            <Ionicons name="chevron-back" size={15} color={pal.muted} />
          </Pressable>
        </View>

        <Text style={[styles.footer, { color: pal.muted }]}>
          نسخهٔ داده: {toFa(meta.dbVersion ?? '1')} · ساخته‌شده برای مطالعهٔ خالص
        </Text>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1 },
  hero: { borderWidth: 1, borderRadius: 20, padding: 20, alignItems: 'center' },
  heroIcon: { width: 60, height: 60, borderRadius: 20, alignItems: 'center', justifyContent: 'center', marginBottom: 12 },
  heroTitle: { fontFamily: FONTS.bold, fontSize: 18, textAlign: 'center' },
  heroSub: { fontFamily: FONTS.regular, fontSize: 11.5, marginTop: 4 },
  section: { fontFamily: FONTS.semi, fontSize: 11, textAlign: 'right', marginTop: 18, marginBottom: 8, marginHorizontal: 4 },
  card: { borderWidth: 1, borderRadius: 16, paddingHorizontal: 14 },
  hr: { height: 1 },
  infoRow: { flexDirection: 'row-reverse', justifyContent: 'space-between', gap: 12, paddingVertical: 11 },
  infoKey: { fontFamily: FONTS.regular, fontSize: 11.5 },
  infoVal: { fontFamily: FONTS.medium, fontSize: 12, flex: 1, textAlign: 'left' },
  para: { fontFamily: FONTS.regular, fontSize: 12.5, lineHeight: 24, textAlign: 'right', paddingVertical: 12, writingDirection: 'rtl' },
  helpRow: { flexDirection: 'row-reverse', alignItems: 'flex-start', gap: 10, paddingVertical: 12 },
  helpIcon: { width: 30, height: 30, borderRadius: 10, alignItems: 'center', justifyContent: 'center' },
  helpTitle: { fontFamily: FONTS.semi, fontSize: 12.5, textAlign: 'right' },
  helpText: { fontFamily: FONTS.regular, fontSize: 11, marginTop: 2, textAlign: 'right', lineHeight: 18 },
  linkRow: { flexDirection: 'row-reverse', alignItems: 'center', gap: 10, paddingVertical: 12 },
  cta: { flexDirection: 'row-reverse', alignItems: 'center', justifyContent: 'center', gap: 8, height: 46, borderRadius: 14, marginTop: 20 },
  ctaText: { fontFamily: FONTS.semi, fontSize: 13.5, color: '#fff' },
  footer: { fontFamily: FONTS.regular, fontSize: 10.5, textAlign: 'center', marginTop: 22 },
});
