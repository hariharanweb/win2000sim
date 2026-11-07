import { useEffect, useState } from 'react';
import { Platform, StyleSheet, View } from 'react-native';

import PixelText from './PixelText';

import BlueBand from './BlueBand';
import Windows2000Logo from './Windows2000Logo';
import { useDiskBusy } from './sound';

type Props = {
  onComplete: () => void;
};

const BLOCKS = 26; // blocks that fit in the progress bar
const TICK_MS = 160; // time per block
const HOLD_MS = 700; // pause on a full bar before moving on


export default function SplashScreen({ onComplete }: Props) {
  useDiskBusy();
  const [filled, setFilled] = useState(0);

  useEffect(() => {
    if (filled >= BLOCKS) {
      const t = setTimeout(onComplete, HOLD_MS);
      return () => clearTimeout(t);
    }
    const t = setTimeout(() => setFilled((f) => f + 1), TICK_MS);
    return () => clearTimeout(t);
  }, [filled, onComplete]);

  return (
    <View style={styles.screen}>
      <View style={styles.top}>
        <PixelText text="Microsoft" style={styles.corner} />

        <View style={styles.center}>
          <View style={styles.emblem}>
            <Windows2000Logo width={340} />
          </View>
          <View style={styles.wordmark}>
            <PixelText text="Microsoft" style={styles.brandSmall} />
            <View style={styles.titleRow}>
              <PixelText text="Windows" style={styles.title} />
              <PixelText text="2000" style={styles.year} />
            </View>
            <PixelText text="Professional" style={styles.edition} />
            <PixelText text="Built on NT Technology" style={styles.tagline} />
          </View>
        </View>
      </View>

      <BlueBand />

      <View style={styles.bottom}>
        <View style={styles.progressRow}>
          <PixelText text="Starting up..." style={styles.status} />
          <View style={styles.progressBox}>
            {Array.from({ length: filled }, (_, i) => (
              <View key={i} style={styles.progressBlock} />
            ))}
          </View>
        </View>
        <PixelText text="Copyright © 1999-2000 Microsoft Corporation" style={styles.status} />
      </View>
    </View>
  );
}

const sans = Platform.select({
  web: 'Arial, Helvetica, sans-serif',
  default: undefined,
});
const heavy = Platform.select({
  web: '"Arial Black", "Helvetica Neue", Arial, sans-serif',
  default: undefined,
});

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: '#fff',
  },
  top: {
    flex: 1,
    backgroundColor: '#fff',
    justifyContent: 'center',
    alignItems: 'center',
  },
  corner: {
    position: 'absolute',
    top: 16,
    right: 24,
    fontFamily: heavy,
    fontWeight: '900',
    fontStyle: 'italic',
    fontSize: 26,
    color: '#000',
  },
  center: {
    alignItems: 'center',
  },
  emblem: {
    marginLeft: 180,
  },
  wordmark: {
    marginTop: 24,
    alignItems: 'flex-end',
  },
  brandSmall: {
    alignSelf: 'flex-start',
    fontFamily: sans,
    fontSize: 34,
    color: '#000',
    marginBottom: -14,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
  },
  title: {
    fontFamily: heavy,
    fontWeight: '900',
    fontSize: 96,
    letterSpacing: -4,
    color: '#000',
    lineHeight: 100,
  },
  year: {
    fontFamily: sans,
    fontSize: 80,
    fontWeight: '300',
    color: '#000',
    marginLeft: 12,
    lineHeight: 92,
  },
  edition: {
    fontFamily: heavy,
    fontWeight: '900',
    fontSize: 60,
    letterSpacing: -2,
    color: '#000',
    lineHeight: 66,
  },
  tagline: {
    fontFamily: sans,
    fontWeight: 'bold',
    fontSize: 24,
    letterSpacing: 1,
    color: '#000',
    marginTop: 4,
  },
  bottom: {
    backgroundColor: '#c0c0c0',
    alignItems: 'center',
    paddingTop: 14,
    paddingBottom: 18,
  },
  progressRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 6,
  },
  status: {
    fontFamily: sans,
    fontSize: 26,
    color: '#000',
  },
  progressBox: {
    width: 440,
    height: 26,
    marginLeft: 14,
    flexDirection: 'row',
    padding: 2,
    gap: 2,
    backgroundColor: '#d4d4d4',
    // Sunken 3D border, like a classic Windows control.
    borderTopWidth: 2,
    borderLeftWidth: 2,
    borderBottomWidth: 2,
    borderRightWidth: 2,
    borderTopColor: '#808080',
    borderLeftColor: '#808080',
    borderBottomColor: '#fff',
    borderRightColor: '#fff',
  },
  progressBlock: {
    width: 14,
    backgroundColor: '#1a1ae0',
  },
});
