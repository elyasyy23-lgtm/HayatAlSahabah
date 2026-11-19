/**
 * Tiny bilingual layer: the Persian string is the source of truth, the
 * English twin lives beside it. Switching language re-renders strings
 * instantly; the layout stays RTL (flipping direction would need an app
 * restart via I18nManager, which the owner rejected).
 */

export type Lang = 'fa' | 'en';

/** [Persian, English] */
type Pair = [string, string];

const DICT: Record<string, Pair> = {
  'app.name': ['حیات صحابه', 'Hayat al-Sahabah'],
  'app.tagline': ['زندگی صحابه، چراغ راه ما', 'The lives of the Companions'],

  'nav.home': ['خانه', 'Home'],
  'nav.volumes': ['انتخاب جلد', 'Volumes'],
  'nav.settings': ['تنظیمات', 'Settings'],
  'nav.help': ['راهنما', 'Help'],
  'nav.share': ['اشتراک‌گذاری', 'Share'],
  'nav.support': ['پشتیبانی', 'Support'],
  'nav.donate': ['حمایت از ما', 'Support us'],
  'nav.logs': ['گزارش‌های خطا', 'Error log'],
  'nav.about': ['درباره ما', 'About'],

  'common.cancel': ['انصراف', 'Cancel'],
  'common.ok': ['تأیید', 'OK'],
  'common.close': ['بستن', 'Close'],
  'common.copy': ['رونوشت', 'Copy'],
  'common.copied': ['رونوشت شد', 'Copied'],
  'common.comingSoon': ['به‌زودی', 'Coming soon'],
  'common.offline': ['کاملاً آفلاین', 'Fully offline'],
  'common.version': ['نسخه', 'Version'],

  'settings.title': ['تنظیمات', 'Settings'],
  'settings.subtitle': ['نما، زبان و خواندن', 'Appearance, language, reading'],
  'settings.appearance': ['نما', 'Appearance'],
  'settings.themeLight': ['روشن (کرم)', 'Light (cream)'],
  'settings.themeDark': ['شبانه', 'Dark'],
  'settings.language': ['زبان', 'Language'],
  'settings.languageHint': ['متن‌ها فوراً عوض می‌شوند؛ چیدمان راست‌به‌چپ می‌ماند.', 'Text switches instantly; layout stays right-to-left.'],
  'settings.vibration': ['لرزش', 'Vibration'],
  'settings.vibrationHint': ['لرزش کوتاه هنگام لمس دکمه‌ها.', 'Short haptic feedback on taps.'],
  'settings.langFa': ['فارسی', 'Persian'],
  'settings.langEn': ['English', 'English'],
  'settings.theme': ['پوسته', 'Theme'],
  'settings.text': ['متن', 'Text'],
  'settings.resetDo': ['پاک کن', 'Delete'],
  'volumes.current': ['در حال مطالعه', 'Currently open'],
  'settings.reading': ['خواندن', 'Reading'],
  'settings.fontSize': ['اندازهٔ فونت', 'Font size'],
  'settings.lineHeight': ['فاصلهٔ سطرها', 'Line spacing'],
  'settings.footnotes': ['نمایش پانویس در پایان بخش', 'Show footnotes at the end of a section'],
  'settings.footnotesHint': ['شماره‌های پانویس همیشه در متن قابل لمس هستند.', 'Footnote numbers stay tappable inside the text.'],
  'settings.justify': ['هم‌ترازی دوطرفه', 'Justified text'],
  'settings.justifyHint': ['متن‌های عادی با دو طرف حاشیه تنظیم شوند.', 'Regular paragraphs align to both margins.'],
  'settings.honorifics': ['نمایش القاب و عناوین', 'Show honorifics (titles)'],
  'settings.honorificsHint': [
    '«حضرت» و القاب تأییدشده در متن خواندن افزوده می‌شوند؛ متن کتاب، پانویس‌ها و جست‌وجو دست‌نخورده می‌مانند.',
    'Adds «حضرت» and approved honorifics while reading; the book text, footnotes and search stay untouched.',
  ],
  'settings.honorificsOff': [
    'خاموش — متن دقیقاً همان‌گونه که در کتاب است نمایش داده می‌شود.',
    'Off — the exact wording of the book is shown.',
  ],
  'settings.preview': ['پیش‌نمایش', 'Preview'],
  'settings.data': ['داده‌ها', 'Data'],
  'settings.resetProgress': ['پاک کردن پیشرفت مطالعه', 'Clear reading progress'],
  'settings.resetTitle': ['پاک کردن پیشرفت', 'Clear progress'],
  'settings.resetBody': ['نشان محل مطالعه و واپسین صفحه پاک شود؟ (نشان‌شده‌ها حذف نمی‌شوند)', 'Clear the last position and resume point? (Bookmarks are kept.)'],
  'settings.resetDone': ['انجام شد', 'Done'],
  'settings.resetDoneBody': ['پیشرفت مطالعه پاک شد.', 'Reading progress cleared.'],
  'settings.aboutBook': ['درباره کتاب و این نسخه', 'About the book and this build'],
  'settings.footer': ['حیات صحابه · نسخهٔ {v} · کاملاً آفلاین', 'Hayat al-Sahabah · v{v} · fully offline'],

  'home.continue': ['ادامه مطالعه', 'Continue reading'],
  'home.start': ['شروع مطالعه', 'Start reading'],
  'home.fromStart': ['از ابتدای کتاب شروع کنید', 'Begin from the start of the book'],
  'home.page': ['صفحهٔ {n}', 'Page {n}'],
  'home.toc': ['فهرست مطالب', 'Table of contents'],
  'home.search': ['جستجو در متن', 'Search the text'],
  'home.bookmarks': ['نشان‌شده‌ها', 'Bookmarks'],
  'home.savedByMe': ['ذخیره‌های من', 'Saved by me'],
  'home.stats': ['آمار کتاب', 'Book stats'],
  'home.titles': ['عنوان', 'headings'],
  'home.footnotes': ['پانویس', 'footnotes'],
  'home.words': ['واژه', 'words'],
  'home.titlesCount': ['۲۸۹ عنوان', '289 headings'],
  'home.offline': ['آفلاین', 'Offline'],
  'home.fontTheme': ['فونت و پوسته', 'Font & theme'],
  'home.offlineFooter': ['مطالعهٔ آفلاین · بدون اینترنت', 'Offline reading · no internet'],
  'home.author': ['تألیف', 'Author'],
  'home.translator': ['ترجمه', 'Translator'],

  'volumes.title': ['انتخاب جلد', 'Volumes'],
  'volumes.subtitle': ['شش جلد در یک برنامه', 'Six volumes in one app'],
  'volumes.ready': ['آمادهٔ مطالعه', 'Ready to read'],
  'volumes.read': ['مطالعه', 'Read'],
  'volumes.notice': ['جلدهای بعدی پس از اعتبارسنجی متن اضافه می‌شوند.', 'Further volumes are added once their text is validated.'],

  'share.title': ['اشتراک‌گذاری', 'Share'],
  'share.subtitle': ['معرفی برنامه به دیگران', 'Tell others about the app'],
  'share.pending': ['نشانی انتشار برنامه هنوز تنظیم نشده است.', 'The app download address is not configured yet.'],
  'share.message': ['حیات صحابه — زندگی یاران پیامبر، کاملاً آفلاین و رایگان.', 'Hayat al-Sahabah — the lives of the Companions, fully offline and free.'],

  'support.title': ['پشتیبانی', 'Support'],
  'support.subtitle': ['ارتباط با ما', 'Contact us'],
  'support.rubika': ['پیام در روبیکا', 'Message on Rubika'],
  'support.rubikaHint': ['پرسش، پیشنهاد یا گزارش خطا را از این راه بفرستید.', 'Send questions, suggestions or bug reports here.'],

  'donate.title': ['حمایت از ما', 'Support us'],
  'donate.subtitle': ['کمک به ادامهٔ کار', 'Help keep the work going'],
  'donate.pending': ['نشانی کیف پول هنوز تأیید نشده و پرداختی انجام نمی‌شود.', 'The wallet address is not confirmed yet, so no payment is offered.'],
  'donate.network': ['شبکه', 'Network'],
  'donate.wallet': ['نشانی کیف پول', 'Wallet address'],

  'logs.title': ['گزارش‌های خطا', 'Error log'],
  'logs.subtitle': ['رویدادهای همین دستگاه', 'Events on this device'],
  'logs.empty': ['هنوز رویدادی ثبت نشده است.', 'No events recorded yet.'],
  'logs.clear': ['پاک کردن', 'Clear'],
  'logs.copy': ['رونوشت همه', 'Copy all'],
  'logs.health': ['وضعیت پایگاه داده', 'Database health'],
  'logs.healthy': ['سالم', 'Healthy'],
  'logs.problem': ['خطا', 'Error'],

  'audit.title': ['گزارش نام‌ها و القاب', 'Names and honorifics audit'],
  'audit.subtitle': ['سند بازبینی، جدا از متن کتاب', 'An audit record, separate from the book'],
  'audit.persons': ['شخصیت‌های تأییدشده', 'Verified persons'],
  'audit.attributions': ['انتساب‌های لقب', 'Honorific attributions'],
  'audit.review': ['موارد نیازمند تأیید', 'Occurrences needing review'],
  'audit.policyTitle': ['سیاست بازبینی', 'Review policy'],
  'audit.policyBody': ['هیچ لقبی بر پایهٔ حدس یا یکتایی نام اضافه نشده است. هر مورد مبهم در فهرست بازبینی جداگانه مانده و تا تأیید صریح، دست‌نخورده است.', 'No honorific was added on a guess or on name uniqueness. Every ambiguous occurrence stays in a separate review list, untouched until explicitly approved.'],
  'audit.markersTitle': ['نشانه‌های به‌کاررفته در کتاب', 'Markers used by the book'],
  'audit.markersBody': ['کتاب از نشانه‌های یک‌حرفی استفاده می‌کند: ص برای پیامبر، س برای صحابهٔ مرد، ل برای صحابهٔ زن، ش برای جمع صحابه و ÷ برای پیامبران پیشین. عبارت‌های کامل در متن تقریباً به کار نرفته‌اند.', 'The book uses single-letter markers: ص for the Prophet, س for male Companions, ل for female Companions, ش for the plural, ÷ for earlier prophets. Full phrases are almost absent from the text.'],
  'audit.separate': ['این سند جدا از متن کتاب است و در پایگاه دادهٔ متن ادغام نشده.', 'This record is separate from the book text and is not merged into its database.'],
  'audit.note': ['این گزارش‌ها فقط برای بازبینی‌اند؛ هیچ لقبی به‌طور خودکار به متن اضافه نشده است.', 'These reports are for review only; no honorific was applied automatically.'],

  'help.title': ['راهنما', 'Help'],
  'help.subtitle': ['چگونه از برنامه استفاده کنیم', 'How to use the app'],
  'help.s1.t': ['فهرست را باز کنید', 'Open the table of contents'],
  'help.s1.d': ['همهٔ ۲۸۹ عنوان با ساختار باب، فصل و زیرفصل در دسترس است.', 'All 289 headings are arranged by part, chapter and section.'],
  'help.s2.t': ['یک عنوان را انتخاب کنید', 'Pick a heading'],
  'help.s2.d': ['صفحهٔ مطالعه باز می‌شود و متن همان عنوان نمایش داده می‌شود.', 'The reader opens on that heading.'],
  'help.s3.t': ['جستجو کنید', 'Search instead'],
  'help.s3.d': ['واژه‌ای را بنویسید؛ جستجو روی همین دستگاه و بدون اینترنت انجام می‌شود.', 'Type a word — the search runs on this device, offline.'],
  'help.s4.t': ['نشان بگذارید', 'Add a bookmark'],
  'help.s4.d': ['دکمهٔ نشان در بالای صفحهٔ مطالعه، جای فعلی شما را ذخیره می‌کند.', 'The bookmark button in the reader header saves your place.'],
  'help.s5.t': ['ادامهٔ مطالعه', 'Resume later'],
  'help.s5.d': ['برنامه آخرین جای شما را نگه می‌دارد و در خانه دکمهٔ «ادامه مطالعه» را نشان می‌دهد.', 'The app remembers your last position and offers “Continue reading” on Home.'],
  'help.s6.t': ['پانویس‌ها', 'Footnotes'],
  'help.s6.d': ['روی شمارهٔ پانویس در متن بزنید؛ متن کامل همان پانویس باز می‌شود.', 'Tap a footnote number inside the text to read the full note.'],

  'about.title': ['درباره ما', 'About'],
  'about.subtitle': ['درباره کتاب و این برنامه', 'About the book and this app'],
  'about.auditLinkSection': ['اعتبارسنجی و گزارش‌ها', 'Validation & reports'],
  'about.auditLinkHint': ['آمار نام‌ها و القاب، جدا از متن کتاب', 'Name/honorific audit, separate from the book text'],
  'about.logsLinkHint': ['رویدادهای برنامه برای بررسی خطا', 'App events for troubleshooting'],

  'update.section': ['بروزرسانی', 'Updates'],
  'update.title': ['بروزرسانی برنامه', 'App update'],
  'update.check': ['بررسی بروزرسانی', 'Check for updates'],
  'update.checking': ['در حال بررسی…', 'Checking…'],
  'update.hint': ['برنامه در هر اجرا و با باز شدن تنظیمات، نسخهٔ تازه را بررسی می‌کند.', 'Checked on launch and whenever Settings opens.'],
  'update.upToDate': ['نسخهٔ نصب‌شده، آخرین نسخه است.', 'This is the latest version.'],
  'update.offline': ['بررسی بروزرسانی در دسترس نیست.', 'Update check is unavailable.'],
  'update.unavailable': ['بررسی بروزرسانی هنوز تنظیم نشده است.', 'Update check is not configured yet.'],
  'update.now': ['بروزرسانی', 'Update'],
  'update.later': ['بعداً', 'Later'],
};

export function isLang(v: unknown): v is Lang {
  return v === 'fa' || v === 'en';
}

export function t(lang: Lang, key: string, params?: Record<string, string | number>): string {
  const pair = DICT[key];
  let s = pair ? pair[lang === 'en' ? 1 : 0] : key;
  if (params) {
    for (const k of Object.keys(params)) s = s.split(`{${k}}`).join(String(params[k]));
  }
  return s;
}

const FA_DIGITS = '۰۱۲۳۴۵۶۷۸۹';

/** Numbers follow the UI language: Persian digits for fa, Latin for en. */
export function num(lang: Lang, value: number | string): string {
  const s = String(value);
  return lang === 'en' ? s : s.replace(/[0-9]/g, (d) => FA_DIGITS[Number(d)]);
}
