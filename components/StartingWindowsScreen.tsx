import { useEffect, useState } from 'react';
import { Platform, StyleSheet, View } from 'react-native';

import PixelText from './PixelText';
import { useDiskBusy } from './sound';

type Props = {
  onComplete: () => void;
};

const SEGMENTS = 52;
const TICK_MS = 70; // time to fill one segment
const HOLD_MS = 600; // pause on a full bar before resetting or moving on
const PASSES = 3; // how many times the bar fills before moving on

export default function StartingWindowsScreen({ onComplete }: Props) {
  useDiskBusy();
  const [filled, setFilled] = useState(0);
  const [pass, setPass] = useState(1);

  useEffect(() => {
    if (filled >= SEGMENTS) {
      const t = setTimeout(() => {
        if (pass >= PASSES) {
          onComplete();
        } else {
          setPass((p) => p + 1);
          setFilled(0);
        }
      }, HOLD_MS);
      return () => clearTimeout(t);
    }
    const t = setTimeout(() => setFilled((f) => f + 1), TICK_MS);
    return () => clearTimeout(t);
  }, [filled, pass, onComplete]);

  return (
    <View style={styles.screen}>
      <View style={styles.bottom}>
        <PixelText text="Starting Windows..." style={styles.text} />
        <View style={styles.bar}>
          {Array.from({ length: SEGMENTS }, (_, i) => (
            // Filled segments merge into one solid block; empty ones show as separate bars.
            <View key={i} style={styles.cell}>
              <View style={styles.block} />
              {i >= filled - 1 && <View style={styles.gap} />}
            </View>
          ))}
        </View>
      </View>
    </View>
  );
}

const mono = Platform.select({
  web: '"Perfect DOS VGA 437", "Lucida Console", "Courier New", monospace',
  ios: 'Courier',
  default: 'monospace',
});

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: '#000',
    justifyContent: 'flex-end',
    paddingHorizontal: 24,
    paddingBottom: 8,
  },
  bottom: {
    alignItems: 'center',
  },
  text: {
    color: '#aaa',
    fontFamily: mono,
    fontSize: 26,
    lineHeight: 32,
    letterSpacing: 2,
    marginBottom: 4,
  },
  bar: {
    flexDirection: 'row',
    alignSelf: 'stretch',
    height: 34,
  },
  cell: {
    flex: 1,
    flexDirection: 'row',
  },
  block: {
    flex: 3,
    backgroundColor: '#aaa',
  },
  gap: {
    flex: 2,
  },
});
