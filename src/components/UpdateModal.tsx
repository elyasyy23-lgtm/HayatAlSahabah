import React from 'react';
import { Modal, View, Text, Pressable, StyleSheet, Linking, Platform } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { FONTS, Palette } from '../theme';
import { Lang } from '../i18n';
import { UpdateInfo, UPDATE_MESSAGE_EN, UPDATE_MESSAGE_FA, updateTarget } from '../update';

type Props = {
  visible: boolean;
  info: UpdateInfo | null;
  pal: Palette;
  lang: Lang;
  latestLabel: string;
  nowLabel: string;
  laterLabel: string;
  onClose: () => void;
};

/** Owner-approved notice: message text, current version, update / later. */
export function UpdateModal({ visible, info, pal, lang, latestLabel, nowLabel, laterLabel, onClose }: Props) {
  const open = () => {
    if (!info) return;
    const url = updateTarget(info);
    Linking.openURL(url).catch(() => {
      /* nothing to open — the message already told the user to update */
    });
    onClose();
  };

  return (
    <Modal visible={visible && !!info} transparent animationType="fade" onRequestClose={onClose}>
      <View style={styles.backdrop}>
        <View style={[styles.card, { backgroundColor: pal.surface, borderColor: pal.border }]}>
          <View style={[styles.badge, { backgroundColor: pal.accentSoft }]}>
            <Ionicons name="cloud-download-outline" size={24} color={pal.accent} />
          </View>
          <Text style={[styles.body, { color: pal.text }]}>
            {lang === 'en' ? UPDATE_MESSAGE_EN : UPDATE_MESSAGE_FA}
          </Text>
          {info ? (
            <Text style={[styles.version, { color: pal.muted }]}>
              {latestLabel} {info.latestVersion}
            </Text>
          ) : null}
          <Pressable
            onPress={open}
            style={({ pressed }) => [styles.primary, { backgroundColor: pal.accent, opacity: pressed ? 0.8 : 1 }]}
          >
            <Text style={[styles.primaryText, { color: pal.bg }]}>{nowLabel}</Text>
          </Pressable>
          <Pressable onPress={onClose} style={({ pressed }) => [styles.secondary, { opacity: pressed ? 0.6 : 1 }]}>
            <Text style={[styles.secondaryText, { color: pal.muted }]}>{laterLabel}</Text>
          </Pressable>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.55)',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 26,
  },
  card: {
    width: '100%',
    maxWidth: 380,
    borderRadius: 20,
    borderWidth: 1,
    padding: 20,
    alignItems: 'center',
  },
  badge: {
    width: 52,
    height: 52,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 14,
  },
  body: {
    fontFamily: FONTS.regular,
    fontSize: 13,
    lineHeight: 23,
    textAlign: 'center',
    writingDirection: 'rtl',
  },
  version: {
    fontFamily: FONTS.medium,
    fontSize: 11,
    marginTop: 10,
    textAlign: 'center',
    writingDirection: 'rtl',
  },
  primary: {
    alignSelf: 'stretch',
    marginTop: 18,
    borderRadius: 14,
    paddingVertical: Platform.OS === 'ios' ? 14 : 12,
    alignItems: 'center',
  },
  primaryText: { fontFamily: FONTS.semi, fontSize: 13.5 },
  secondary: { marginTop: 12, paddingVertical: 8, paddingHorizontal: 14 },
  secondaryText: { fontFamily: FONTS.medium, fontSize: 12.5 },
});
