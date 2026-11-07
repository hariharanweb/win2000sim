import { useEffect, useState } from 'react';
import { Platform, StyleSheet, View } from 'react-native';

import PixelText from './PixelText';
import { diskActivity, floppySeek, playSound, startMachine } from './sound';

const TOTAL_MEMORY_KB = 262144; // 256 MB

type Props = {
  onComplete: () => void;
};

// Boot sequence: each step reveals more of the screen.
// 0: header + logo, 1: system name, 2: CPU, 3: memory counting,
// 4: primary master, 5: primary slave, 6: footer, 7: done
const STEP_DELAYS_MS = [600, 500, 500, 0, 450, 450, 1800];

export default function BiosScreen({ onComplete }: Props) {
  const [step, setStep] = useState(0);
  const [memoryKb, setMemoryKb] = useState(0);

  // POST sounds: power on, beep once memory checks out, then probe the drives.
  useEffect(() => {
    if (step === 0) startMachine();
    if (step === 4) {
      playSound('beep');
      diskActivity(400);
    }
    if (step === 5) floppySeek();
    if (step === 6) diskActivity(900);
  }, [step]);

  // Advance through the timed steps (memory step advances itself).
  useEffect(() => {
    if (step === 3) return;
    if (step >= STEP_DELAYS_MS.length) {
      onComplete();
      return;
    }
    const t = setTimeout(() => setStep((s) => s + 1), STEP_DELAYS_MS[step]);
    return () => clearTimeout(t);
  }, [step, onComplete]);

  // Count memory up like a real POST memory test.
  useEffect(() => {
    if (step !== 3) return;
    const interval = setInterval(() => {
      setMemoryKb((kb) => {
        const next = Math.min(kb + 8192, TOTAL_MEMORY_KB);
        if (next === TOTAL_MEMORY_KB) {
          clearInterval(interval);
          setTimeout(() => setStep(4), 300);
        }
        return next;
      });
    }, 40);
    return () => clearInterval(interval);
  }, [step]);

  const memoryDone = memoryKb === TOTAL_MEMORY_KB;

  return (
    <View style={styles.screen}>
      <View style={styles.headerRow}>
        <View style={styles.header}>
          <RibbonIcon />
          <View>
            <PixelText text="SimBIOS v6.00PG" style={styles.text} />
            <PixelText text="Copyright(C) 1984-2000, win2000sim" style={styles.text} />
          </View>
        </View>
        <EnergyLogo />
      </View>

      <View style={styles.body}>
        {step >= 1 && <PixelText text="Intel 440BX AGPset BIOS (ver 1.02)" style={styles.text} />}
        <View style={styles.gap} />
        {step >= 2 && <Line label="Main Processor " value="Intel Core i7-14700K" />}
        {step >= 3 && (
          <Line
            label="Memory Testing "
            value={`${memoryKb}K${memoryDone ? ' OK' : ''}`}
          />
        )}
        {step >= 4 && <Line label="Primary Master " value="WDC WD200BB 20GB" />}
        {step >= 5 && <Line label="Primary Slave  " value="ATAPI CD-ROM 48X" />}
      </View>

      {step >= 6 && (
        <View style={styles.footer}>
          <PixelText text="Press DEL" style={[styles.text, styles.bright]} />
          <PixelText text=" to enter " style={styles.text} />
          <PixelText text="SETUP" style={[styles.text, styles.bright]} />
          <PixelText text="." style={styles.text} />
        </View>
      )}
    </View>
  );
}

function Line({ label, value }: { label: string; value: string }) {
  return <PixelText text={`${label}: ${value}`} style={styles.text} />;
}

function RibbonIcon() {
  return (
    <View style={styles.ribbon}>
      <View style={styles.ribbonCircle} />
      <View style={styles.ribbonTails}>
        <View style={[styles.ribbonTail, { transform: [{ rotate: '20deg' }] }]} />
        <View style={[styles.ribbonTail, { transform: [{ rotate: '-20deg' }] }]} />
      </View>
    </View>
  );
}

function EnergyLogo() {
  return (
    <View style={styles.energy}>
      <View style={styles.energyArc} />
      <View style={styles.energyRow}>
        <PixelText text="energy" style={styles.energyText} />
        <PixelText text="☆" style={[styles.energyText, styles.energyStar]} />
      </View>
      <View style={styles.energyRule} />
      <PixelText text="EPA POLLUTION PREVENTER" style={[styles.energyCaption, styles.center]} />
    </View>
  );
}

const mono = Platform.select({
  web: '"Lucida Console", Monaco, "Courier New", monospace',
  ios: 'Courier',
  default: 'monospace',
});

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: '#000',
    paddingHorizontal: 32,
    paddingVertical: 16,
  },
  text: {
    color: '#aaa',
    fontFamily: mono,
    fontSize: 22,
    lineHeight: 32,
  },
  bright: {
    color: '#fff',
    fontWeight: 'bold',
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginLeft: -24,
  },
  body: {
    marginTop: 48,
  },
  gap: {
    height: 32,
  },
  footer: {
    flexDirection: 'row',
    position: 'absolute',
    left: 32,
    bottom: 32,
  },
  ribbon: {
    width: 40,
    alignItems: 'center',
    marginRight: 8,
    marginTop: 2,
  },
  ribbonCircle: {
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: '#00f',
  },
  ribbonTails: {
    flexDirection: 'row',
    marginTop: -2,
  },
  ribbonTail: {
    width: 12,
    height: 22,
    backgroundColor: '#00f',
    marginHorizontal: 1,
  },
  energy: {
    alignItems: 'center',
    width: 270,
  },
  energyArc: {
    position: 'absolute',
    top: 0,
    width: 230,
    height: 120,
    borderTopLeftRadius: 115,
    borderTopRightRadius: 115,
    borderWidth: 3,
    borderBottomWidth: 0,
    borderColor: '#ff0',
  },
  energyRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    marginTop: 44,
  },
  center: {
    alignSelf: 'center',
  },
  energyText: {
    color: '#ff0',
    fontSize: 54,
    fontStyle: 'italic',
    fontFamily: Platform.select({ web: '"Brush Script MT", cursive', default: undefined }),
  },
  energyStar: {
    fontSize: 64,
    fontStyle: 'normal',
  },
  energyRule: {
    height: 2,
    alignSelf: 'stretch',
    backgroundColor: '#0c0',
    marginTop: 4,
  },
  energyCaption: {
    color: '#0c0',
    fontSize: 17,
    marginTop: 2,
  },
});
