import { type ComponentRef, useCallback, useEffect, useRef, useState } from 'react';
import { Platform, Pressable, StyleSheet, View } from 'react-native';
import Svg, { Circle, Path, Rect } from 'react-native-svg';

import { item, separator } from '../desktop/MenuPanel';
import MenuBar from '../desktop/MenuBar';
import { type AppProps, useDesktop } from '../desktop/types';
import PixelText from '../PixelText';
import { text } from '../ui';
import { win } from '../Win2000Dialog';

// Minefield: clear every square that doesn't hide a mine.
// Left click digs, right click (or long press) plants a marker flag,
// and clicking a number whose flags are all placed digs its neighbours.

type Level = 'easy' | 'medium' | 'hard';
const LEVELS: Record<Level, { label: string; cols: number; rows: number; mines: number }> = {
  easy: { label: 'Easy', cols: 9, rows: 9, mines: 10 },
  medium: { label: 'Medium', cols: 16, rows: 16, mines: 40 },
  hard: { label: 'Hard', cols: 30, rows: 16, mines: 99 },
};

const CELL = 32;
const NUMBER_COLORS = ['', '#1f5fbf', '#2e8b2e', '#c0392b', '#5b2c8f', '#8b4513', '#138d90', '#000', '#606060'];

type Cell = { mine: boolean; open: boolean; flag: boolean; count: number };
type Status = 'ready' | 'playing' | 'won' | 'lost';

const emptyBoard = (cols: number, rows: number): Cell[] =>
  Array.from({ length: cols * rows }, () => ({ mine: false, open: false, flag: false, count: 0 }));

function neighbours(i: number, cols: number, rows: number): number[] {
  const x = i % cols;
  const y = Math.floor(i / cols);
  const out: number[] = [];
  for (let dy = -1; dy <= 1; dy++) {
    for (let dx = -1; dx <= 1; dx++) {
      if (!dx && !dy) continue;
      const nx = x + dx;
      const ny = y + dy;
      if (nx >= 0 && ny >= 0 && nx < cols && ny < rows) out.push(ny * cols + nx);
    }
  }
  return out;
}

/** Places mines anywhere except the first square dug and its neighbours. */
function layMines(board: Cell[], cols: number, rows: number, mines: number, safe: number): Cell[] {
  const keepClear = new Set([safe, ...neighbours(safe, cols, rows)]);
  const spots = board.map((_, i) => i).filter((i) => !keepClear.has(i));
  const next = board.map((c) => ({ ...c }));
  for (let n = 0; n < mines && spots.length; n++) {
    const k = Math.floor(Math.random() * spots.length);
    next[spots[k]].mine = true;
    spots.splice(k, 1);
  }
  next.forEach((c, i) => {
    c.count = neighbours(i, cols, rows).filter((j) => next[j].mine).length;
  });
  return next;
}

export default function Minefield({ windowId }: AppProps) {
  const api = useDesktop();
  const [level, setLevel] = useState<Level>('easy');
  const { cols, rows, mines } = LEVELS[level];
  const [board, setBoard] = useState(() => emptyBoard(cols, rows));
  const [status, setStatus] = useState<Status>('ready');
  const [exploded, setExploded] = useState<number | null>(null);
  const [startedAt, setStartedAt] = useState(0);
  const [seconds, setSeconds] = useState(0);
  const [pressing, setPressing] = useState(false);
  const best = useRef<Partial<Record<Level, number>>>({});
  const boardRef = useRef<ComponentRef<typeof View>>(null);

  const newGame = useCallback((lv: Level = level) => {
    setLevel(lv);
    setBoard(emptyBoard(LEVELS[lv].cols, LEVELS[lv].rows));
    setStatus('ready');
    setExploded(null);
    setSeconds(0);
  }, [level]);

  // The timer runs from the first dig until the game ends, capped at 999 like a scoreboard.
  useEffect(() => {
    if (status !== 'playing') return;
    const t = setInterval(() => setSeconds(Math.min(999, Math.floor((Date.now() - startedAt) / 1000) + 1)), 250);
    return () => clearInterval(t);
  }, [status, startedAt]);

  const finishIfWon = (next: Cell[]) => {
    if (next.some((c) => !c.mine && !c.open)) return next;
    const flagged = next.map((c) => (c.mine ? { ...c, flag: true } : c));
    setStatus('won');
    const time = Math.max(1, Math.floor((Date.now() - startedAt) / 1000) + 1);
    const prev = best.current[level];
    if (prev === undefined || time < prev) {
      best.current[level] = time;
      api.showMessage({
        title: 'Minefield',
        kind: 'info',
        lines: [`You cleared the ${LEVELS[level].label} field in ${time} seconds.`, '', 'That is your best time so far!'],
      });
    }
    return flagged;
  };

  /** Opens squares starting at `start`, spreading through empty areas. */
  const dig = (cells: Cell[], start: number[]): Cell[] | 'boom' => {
    const next = cells.map((c) => ({ ...c }));
    const stack = [...start];
    while (stack.length) {
      const i = stack.pop()!;
      const c = next[i];
      if (c.open || c.flag) continue;
      if (c.mine) {
        setExploded(i);
        return 'boom';
      }
      c.open = true;
      if (c.count === 0) stack.push(...neighbours(i, cols, rows));
    }
    return next;
  };

  const lose = (cells: Cell[]) => {
    setStatus('lost');
    setBoard(cells.map((c) => (c.mine && !c.flag ? { ...c, open: true } : c)));
  };

  const press = (i: number) => {
    if (status === 'won' || status === 'lost') return;
    let cells = board;
    if (status === 'ready') {
      cells = layMines(board, cols, rows, mines, i);
      setStatus('playing');
      setStartedAt(Date.now());
      setSeconds(1);
    }
    const c = cells[i];
    if (c.flag) return;
    let targets = [i];
    if (c.open) {
      // Clicking a number with all its flags placed digs the rest of its neighbours.
      const around = neighbours(i, cols, rows);
      if (c.count === 0 || around.filter((j) => cells[j].flag).length !== c.count) return;
      targets = around;
    }
    const result = dig(cells, targets);
    if (result === 'boom') lose(cells);
    else setBoard(finishIfWon(result));
  };

  const toggleFlag = (i: number) => {
    if (status === 'won' || status === 'lost' || board[i].open) return;
    setBoard((b) => b.map((c, j) => (j === i ? { ...c, flag: !c.flag } : c)));
  };

  // Right click plants a flag (web only; touch devices use a long press).
  useEffect(() => {
    if (Platform.OS !== 'web') return;
    const el = boardRef.current as unknown as HTMLElement | null;
    if (!el) return;
    const onContext = (e: MouseEvent) => {
      e.preventDefault();
      const r = el.getBoundingClientRect();
      const x = Math.floor((e.clientX - r.left - 2) / CELL);
      const y = Math.floor((e.clientY - r.top - 2) / CELL);
      if (x >= 0 && y >= 0 && x < cols && y < rows) toggleFlag(y * cols + x);
    };
    el.addEventListener('contextmenu', onContext);
    return () => el.removeEventListener('contextmenu', onContext);
  });

  // F2 starts a new game.
  useEffect(() => {
    if (Platform.OS !== 'web') return;
    const onKey = (e: KeyboardEvent) => e.key === 'F2' && newGame();
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [newGame]);

  // Fit the window snugly around the field.
  const lastSize = useRef('');
  const fit = (w: number, h: number) => {
    const key = `${Math.ceil(w)}x${Math.ceil(h)}`;
    if (key === lastSize.current) return;
    lastSize.current = key;
    api.setContentSize(windowId, Math.ceil(w), Math.ceil(h));
  };

  const flagsLeft = mines - board.filter((c) => c.flag).length;
  const check = (lv: Level) => `${level === lv ? '✓ ' : '    '}${LEVELS[lv].label}`;

  return (
    <View style={styles.root}>
      <View onLayout={(e) => fit(e.nativeEvent.layout.width, e.nativeEvent.layout.height)} style={styles.content}>
        <MenuBar
          menus={{
            Game: [
              item('New    F2', undefined, () => newGame()),
              separator,
              item(check('easy'), undefined, () => newGame('easy')),
              item(check('medium'), undefined, () => newGame('medium')),
              item(check('hard'), undefined, () => newGame('hard')),
              separator,
              item('Best Times...', undefined, () =>
                api.showMessage({
                  title: 'Best Times',
                  kind: 'info',
                  lines: (Object.keys(LEVELS) as Level[]).map(
                    (lv) => `${LEVELS[lv].label}:  ${best.current[lv] !== undefined ? `${best.current[lv]} seconds` : '—'}`,
                  ),
                }),
              ),
              separator,
              item('Exit', undefined, () => api.closeWindow(windowId)),
            ],
            Help: [
              item('How to Play', undefined, () =>
                api.showMessage({
                  title: 'How to Play',
                  kind: 'info',
                  lines: [
                    'Dig every square that does not hide a mine.',
                    'Numbers show how many mines touch that square.',
                    'Right-click to plant a flag where you think a mine is.',
                    'Click a number with all its flags placed to dig around it.',
                  ],
                }),
              ),
            ],
          }}
        />

        <View style={[styles.panel, win.sunken]}>
          <View style={styles.header}>
            <View style={[styles.counter, win.sunken]}>
              <PixelText text={`Mines ${String(Math.max(flagsLeft, -99)).padStart(3, ' ')}`} style={text.bold} />
            </View>
            <Pressable
              onPress={() => newGame()}
              accessibilityLabel="New game"
              style={({ pressed }) => [styles.newButton, pressed ? win.sunken : win.raised]}
            >
              <StatusFace status={status} pressing={pressing} />
            </Pressable>
            <View style={[styles.counter, win.sunken]}>
              <PixelText text={`Time ${String(seconds).padStart(3, ' ')}`} style={text.bold} />
            </View>
          </View>

          <View ref={boardRef} style={[styles.board, win.sunken, { width: cols * CELL + 4, height: rows * CELL + 4 }]}>
            {board.map((c, i) => (
              <Square
                key={i}
                cell={c}
                exploded={exploded === i}
                revealWrong={status === 'lost' && c.flag && !c.mine}
                onPress={() => press(i)}
                onLongPress={() => toggleFlag(i)}
                onPressIn={() => setPressing(true)}
                onPressOut={() => setPressing(false)}
                x={(i % cols) * CELL}
                y={Math.floor(i / cols) * CELL}
              />
            ))}
          </View>
        </View>
      </View>
    </View>
  );
}

function Square({
  cell,
  exploded,
  revealWrong,
  x,
  y,
  ...handlers
}: {
  cell: Cell;
  exploded: boolean;
  revealWrong: boolean;
  x: number;
  y: number;
  onPress: () => void;
  onLongPress: () => void;
  onPressIn: () => void;
  onPressOut: () => void;
}) {
  const style = [styles.cell, { left: x, top: y }];
  if (!cell.open) {
    return (
      <Pressable {...handlers} delayLongPress={350} style={({ pressed }) => [...style, pressed && !cell.flag ? styles.cellOpen : styles.cellClosed]}>
        {cell.flag && <FlagGlyph crossed={revealWrong} />}
      </Pressable>
    );
  }
  return (
    <Pressable {...handlers} style={[...style, styles.cellOpen, exploded && styles.cellExploded]}>
      {cell.mine ? (
        <MineGlyph />
      ) : cell.count > 0 ? (
        <PixelText text={String(cell.count)} style={[text.bold, { color: NUMBER_COLORS[cell.count] }]} pixel={2} />
      ) : null}
    </Pressable>
  );
}

function MineGlyph() {
  return (
    <Svg width={24} height={24} viewBox="0 0 12 12">
      <Path d="M6,1 V11 M1,6 H11 M2.5,2.5 L9.5,9.5 M9.5,2.5 L2.5,9.5" stroke="#202020" strokeWidth={1} />
      <Circle cx={6} cy={6} r={3.6} fill="#202020" />
      <Rect x={4.2} y={4.2} width={1.4} height={1.4} fill="#fff" />
    </Svg>
  );
}

function FlagGlyph({ crossed }: { crossed?: boolean }) {
  return (
    <Svg width={24} height={24} viewBox="0 0 12 12">
      <Rect x={5.5} y={2} width={1} height={7} fill="#000" />
      <Path d="M6.5,2 L11,3.8 L6.5,5.6 Z" fill="#1f8f3f" />
      <Rect x={3} y={9} width={6} height={1.5} fill="#000" />
      {crossed && <Path d="M1,1 L11,11 M11,1 L1,11" stroke="#d01010" strokeWidth={1.4} />}
    </Svg>
  );
}

/** The new-game button's picture: a mine while playing, a flag when won, a burst when lost. */
function StatusFace({ status, pressing }: { status: Status; pressing: boolean }) {
  if (status === 'won') return <FlagGlyph />;
  if (status === 'lost') {
    return (
      <Svg width={28} height={28} viewBox="0 0 14 14">
        <Path d="M7,0.5 L8.5,4.5 L13,3 L10,7 L13.5,10 L9,10 L8,13.5 L6,10.5 L2,13 L3.5,8.5 L0.5,6 L5,5 Z" fill="#f0a020" stroke="#c03010" strokeWidth={0.8} />
        <Circle cx={7} cy={7.5} r={2.2} fill="#202020" />
      </Svg>
    );
  }
  return (
    <View style={{ transform: [{ scale: pressing ? 0.85 : 1 }] }}>
      <MineGlyph />
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    alignItems: 'flex-start',
  },
  content: {
    alignItems: 'flex-start',
  },
  panel: {
    margin: 6,
    marginTop: 2,
    padding: 10,
    gap: 10,
    backgroundColor: '#c0c0c0',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 6,
    gap: 10,
    ...win.sunken,
  },
  counter: {
    width: 120,
    backgroundColor: '#e8e8e0',
    paddingHorizontal: 8,
    height: 36,
    justifyContent: 'center',
  },
  newButton: {
    width: 44,
    height: 44,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: win.face,
  },
  board: {
    position: 'relative',
    backgroundColor: '#c0c0c0',
  },
  cell: {
    position: 'absolute',
    width: CELL,
    height: CELL,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#c0c0c0',
  },
  cellClosed: {
    borderWidth: 3,
    borderTopColor: '#fff',
    borderLeftColor: '#fff',
    borderBottomColor: '#808080',
    borderRightColor: '#808080',
  },
  cellOpen: {
    borderTopWidth: 1,
    borderLeftWidth: 1,
    borderColor: '#9a9a9a',
  },
  cellExploded: {
    backgroundColor: '#ff4040',
  },
});
