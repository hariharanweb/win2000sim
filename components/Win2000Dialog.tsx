import type { ReactNode } from 'react';
import { Platform, StyleSheet, View } from 'react-native';
import Svg, { Defs, LinearGradient, Rect, Stop } from 'react-native-svg';

import BlueBand from './BlueBand';
import PixelText from './PixelText';
import Windows2000Logo from './Windows2000Logo';

// Classic Windows 2000 boot dialog: gradient title bar, logo banner, blue stripe,
// then a gray body for the dialog's own content.

type Props = {
  title: string;
  showTagline?: boolean; // "Built on NT Technology" under the wordmark
  children: ReactNode;
};

export default function Win2000Dialog({ title, showTagline = false, children }: Props) {
  return (
    <View style={styles.dialog}>
      <View style={styles.titleBar}>
        <Svg style={StyleSheet.absoluteFill} width="100%" height="100%" preserveAspectRatio="none">
          <Defs>
            <LinearGradient id="titleGradient" x1="0" y1="0" x2="1" y2="0">
              <Stop offset="0" stopColor="#0a246a" />
              <Stop offset="1" stopColor="#a6caf0" />
            </LinearGradient>
          </Defs>
          <Rect x="0" y="0" width="100%" height="100%" fill="url(#titleGradient)" />
        </Svg>
        <PixelText text={title} style={styles.title} />
      </View>

      <Win2000Banner showTagline={showTagline} />

      {children}
    </View>
  );
}

/** Logo banner and blue stripe, shared by the boot dialogs and Shut Down / About windows. */
export function Win2000Banner({ showTagline = false }: { showTagline?: boolean }) {
  return (
    <>
      <View style={styles.banner}>
        <PixelText text="Microsoft" style={styles.corner} />
        <View style={styles.bannerContent}>
          <Windows2000Logo width={120} />
          <View style={styles.wordmark}>
            <PixelText text="Microsoft" style={styles.brandSmall} />
            <View style={styles.titleRow}>
              <PixelText text="Windows" style={styles.windows} />
              <PixelText text="2000" style={styles.year} />
            </View>
            <PixelText text="Professional" style={styles.edition} />
            {showTagline && (
              <View style={styles.taglineRow}>
                <PixelText text="Built on " style={styles.tagline} />
                <PixelText text="NT" style={[styles.tagline, styles.taglineBold]} />
                <PixelText text=" Technology" style={styles.tagline} />
              </View>
            )}
          </View>
        </View>
      </View>

      <BlueBand height={14} />
    </>
  );
}

export const uiFont = Platform.select({
  web: 'Tahoma, Verdana, "Segoe UI", sans-serif',
  default: undefined,
});
const sans = Platform.select({
  web: 'Arial, Helvetica, sans-serif',
  default: undefined,
});
const heavy = Platform.select({
  web: '"Arial Black", "Helvetica Neue", Arial, sans-serif',
  default: undefined,
});

// Shared colors and borders for classic Windows controls.
export const win = {
  face: '#d4d0c8',
  desktop: '#4a6ea0',
  raised: {
    borderWidth: 2,
    borderTopColor: '#fff',
    borderLeftColor: '#fff',
    borderBottomColor: '#404040',
    borderRightColor: '#404040',
  },
  sunken: {
    borderWidth: 2,
    borderTopColor: '#808080',
    borderLeftColor: '#808080',
    borderBottomColor: '#fff',
    borderRightColor: '#fff',
  },
} as const;

const styles = StyleSheet.create({
  dialog: {
    width: '87%',
    maxWidth: 900,
    backgroundColor: win.face,
    padding: 3,
    ...win.raised,
  },
  titleBar: {
    height: 36,
    justifyContent: 'center',
    paddingHorizontal: 6,
    overflow: 'hidden',
  },
  title: {
    color: '#fff',
    fontFamily: uiFont,
    fontWeight: 'bold',
    fontSize: 20,
  },
  banner: {
    backgroundColor: '#fff',
    paddingVertical: 10,
    marginTop: 2,
  },
  corner: {
    position: 'absolute',
    top: 12,
    right: 20,
    fontFamily: heavy,
    fontWeight: '900',
    fontStyle: 'italic',
    fontSize: 18,
    color: '#000',
  },
  bannerContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 120,
  },
  wordmark: {
    alignItems: 'flex-end',
    marginLeft: 8,
  },
  brandSmall: {
    alignSelf: 'flex-start',
    fontFamily: sans,
    fontSize: 22,
    color: '#000',
    marginBottom: -10,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
  },
  windows: {
    fontFamily: heavy,
    fontWeight: '900',
    fontSize: 58,
    letterSpacing: -3,
    color: '#000',
    lineHeight: 62,
  },
  year: {
    fontFamily: sans,
    fontWeight: '300',
    fontSize: 48,
    color: '#000',
    marginLeft: 8,
    lineHeight: 56,
  },
  edition: {
    fontFamily: heavy,
    fontWeight: '900',
    fontSize: 40,
    letterSpacing: -1.5,
    color: '#000',
    lineHeight: 44,
  },
  taglineRow: {
    flexDirection: 'row',
    alignSelf: 'flex-start',
    marginTop: 2,
  },
  tagline: {
    fontFamily: uiFont,
    fontSize: 20,
    color: '#000',
  },
  taglineBold: {
    fontWeight: 'bold',
  },
});
