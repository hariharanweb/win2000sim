import { useState } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';

import PixelText from '../PixelText';
import { text } from '../ui';
import { win } from '../Win2000Dialog';

type Op = '+' | '-' | '*' | '/';

type CalcState = {
  display: string;
  acc: number | null;
  op: Op | null;
  fresh: boolean; // next digit starts a new number
  memory: number;
  error: string | null;
};

const INITIAL: CalcState = { display: '0', acc: null, op: null, fresh: true, memory: 0, error: null };

const DIV_ZERO = 'Cannot divide by zero.';
const BAD_INPUT = 'Invalid input for function.';

function fmt(n: number): string {
  if (!Number.isFinite(n)) return DIV_ZERO;
  return String(Number(n.toPrecision(15)));
}

function compute(a: number, op: Op, b: number): number {
  switch (op) {
    case '+':
      return a + b;
    case '-':
      return a - b;
    case '*':
      return a * b;
    case '/':
      return a / b;
  }
}

function reduce(s: CalcState, key: string): CalcState {
  // After an error, only clearing keys work.
  if (s.error && !['C', 'CE', 'Backspace'].includes(key)) return s;
  const x = Number(s.display);

  if (/^[0-9]$/.test(key)) {
    if (s.fresh || s.display === '0') return { ...s, display: key, fresh: false };
    if (s.display.replace(/[-.]/g, '').length >= 32) return s;
    return { ...s, display: s.display + key };
  }

  switch (key) {
    case '.':
      if (s.fresh) return { ...s, display: '0.', fresh: false };
      return s.display.includes('.') ? s : { ...s, display: s.display + '.' };
    case '+':
    case '-':
    case '*':
    case '/': {
      if (s.op && !s.fresh && s.acc !== null) {
        if (s.op === '/' && x === 0) return { ...INITIAL, memory: s.memory, error: DIV_ZERO };
        const r = compute(s.acc, s.op, x);
        return { ...s, display: fmt(r), acc: r, op: key, fresh: true };
      }
      return { ...s, acc: x, op: key, fresh: true };
    }
    case '=': {
      if (!s.op || s.acc === null) return { ...s, fresh: true };
      if (s.op === '/' && x === 0) return { ...INITIAL, memory: s.memory, error: DIV_ZERO };
      return { ...s, display: fmt(compute(s.acc, s.op, x)), acc: null, op: null, fresh: true };
    }
    case 'C':
      return { ...INITIAL, memory: s.memory };
    case 'CE':
      return { ...s, display: '0', fresh: true, error: null };
    case 'Backspace':
      if (s.error) return { ...INITIAL, memory: s.memory };
      if (s.fresh) return s;
      return { ...s, display: s.display.length > 1 ? s.display.slice(0, -1) : '0' };
    case 'sqrt':
      if (x < 0) return { ...INITIAL, memory: s.memory, error: BAD_INPUT };
      return { ...s, display: fmt(Math.sqrt(x)), fresh: true };
    case '%':
      return { ...s, display: fmt(s.acc !== null ? (s.acc * x) / 100 : 0), fresh: true };
    case '1/x':
      if (x === 0) return { ...INITIAL, memory: s.memory, error: DIV_ZERO };
      return { ...s, display: fmt(1 / x), fresh: true };
    case '+/-':
      if (s.display === '0') return s;
      return { ...s, display: s.display.startsWith('-') ? s.display.slice(1) : `-${s.display}` };
    case 'MC':
      return { ...s, memory: 0 };
    case 'MR':
      return { ...s, display: fmt(s.memory), fresh: true };
    case 'MS':
      return { ...s, memory: x, fresh: true };
    case 'M+':
      return { ...s, memory: s.memory + x, fresh: true };
  }
  return s;
}

const BLUE = '#0000ff';
const RED = '#ff0000';

// [label, color] for the main 5-column grid, row by row.
const GRID: [string, string][][] = [
  [['7', BLUE], ['8', BLUE], ['9', BLUE], ['/', RED], ['sqrt', BLUE]],
  [['4', BLUE], ['5', BLUE], ['6', BLUE], ['*', RED], ['%', BLUE]],
  [['1', BLUE], ['2', BLUE], ['3', BLUE], ['-', RED], ['1/x', BLUE]],
  [['0', BLUE], ['+/-', BLUE], ['.', BLUE], ['+', RED], ['=', RED]],
];
const MEMORY = ['MC', 'MR', 'MS', 'M+'];

export default function Calculator() {
  const [s, setS] = useState(INITIAL);
  const press = (key: string) => setS((prev) => reduce(prev, key));

  const shown = s.error ?? (s.display.includes('.') ? s.display : `${s.display}.`);

  return (
    <View style={styles.root}>
      <View style={styles.display}>
        <PixelText text={shown} style={text.ui} />
      </View>

      <View style={styles.topRow}>
        <View style={styles.memoryBox}>
          {s.memory !== 0 && <PixelText text="M" style={text.ui} />}
        </View>
        <View style={styles.clearKeys}>
          {['Backspace', 'CE', 'C'].map((k) => (
            <Key key={k} label={k} color={RED} onPress={() => press(k)} wide />
          ))}
        </View>
      </View>

      <View style={styles.keypad}>
        <View style={styles.memoryCol}>
          {MEMORY.map((k) => (
            <Key key={k} label={k} color={RED} onPress={() => press(k)} />
          ))}
        </View>
        <View style={styles.grid}>
          {GRID.map((row, r) => (
            <View key={r} style={styles.gridRow}>
              {row.map(([label, color]) => (
                <Key key={label} label={label} color={color} onPress={() => press(label)} />
              ))}
            </View>
          ))}
        </View>
      </View>
    </View>
  );
}

function Key({ label, color, onPress, wide }: { label: string; color: string; onPress: () => void; wide?: boolean }) {
  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [styles.key, wide && styles.keyWide, pressed ? win.sunken : win.raised]}
    >
      <PixelText text={label} style={[text.ui, { color }]} />
    </Pressable>
  );
}

const KEY_W = 68;
const KEY_H = 56;
const GAP = 8;

const styles = StyleSheet.create({
  root: {
    flex: 1,
    padding: 12,
    gap: 14,
  },
  display: {
    height: 44,
    backgroundColor: '#fff',
    alignItems: 'flex-end',
    justifyContent: 'center',
    paddingHorizontal: 8,
    ...win.sunken,
  },
  topRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
  },
  memoryBox: {
    width: KEY_W,
    height: KEY_H - 8,
    alignItems: 'center',
    justifyContent: 'center',
    ...win.sunken,
  },
  clearKeys: {
    flex: 1,
    flexDirection: 'row',
    gap: GAP,
  },
  keypad: {
    flexDirection: 'row',
    gap: 16,
  },
  memoryCol: {
    gap: GAP,
  },
  grid: {
    flex: 1,
    gap: GAP,
  },
  gridRow: {
    flexDirection: 'row',
    gap: GAP,
  },
  key: {
    width: KEY_W,
    height: KEY_H,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: win.face,
  },
  keyWide: {
    flex: 1,
    width: undefined,
  },
});
