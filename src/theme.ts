export type ThemeName = 'cream' | 'night';

export type Palette = {
  name: ThemeName;
  bg: string;
  bgAlt: string;
  surface: string;
  border: string;
  text: string;
  muted: string;
  accent: string;
  accentSoft: string;
  onAccent: string;
  gold: string;
  goldSoft: string;
  shadow: string;
};

export const THEMES: Record<ThemeName, Palette> = {
  cream: {
    name: 'cream',
    bg: '#FBF7EE',
    bgAlt: '#F3ECDC',
    surface: '#FFFDF7',
    border: '#E3D8BF',
    text: '#1B2A22',
    muted: '#6C7B71',
    accent: '#12664C',
    accentSoft: '#E3F1E8',
    onAccent: '#FFFFFF',
    gold: '#A9802A',
    goldSoft: '#F7ECD3',
    shadow: '#1B2A2214',
  },
  night: {
    name: 'night',
    bg: '#08130F',
    bgAlt: '#0B1A15',
    surface: '#0F211A',
    border: '#1D3A2F',
    text: '#E9F1EB',
    muted: '#93A99E',
    accent: '#4ADE80',
    accentSoft: '#12301F',
    onAccent: '#06130C',
    gold: '#EBC77F',
    goldSoft: '#241E10',
    shadow: '#00000055',
  },
};

export const FONTS = {
  regular: 'Vazirmatn-Regular',
  medium: 'Vazirmatn-Medium',
  semi: 'Vazirmatn-SemiBold',
  bold: 'Vazirmatn-Bold',
  arabic: 'Amiri-Regular',
  arabicBold: 'Amiri-Bold',
};

export const LEVEL_LABEL: Record<number, string> = {
  0: 'بخش',
  1: 'فصل',
  2: 'زیرفصل',
};
