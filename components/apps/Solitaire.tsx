import { type ComponentRef, useCallback, useEffect, useRef, useState } from 'react';
import { Platform, Pressable, StyleSheet, View } from 'react-native';
import Svg, { Circle, Defs, Path, Pattern, Rect } from 'react-native-svg';

import { item, separator } from '../desktop/MenuPanel';
import MenuBar from '../desktop/MenuBar';
import { type AppProps, useDesktop } from '../desktop/types';
import PixelText from '../PixelText';
import { T, text } from '../ui';
import { win } from '../Win2000Dialog';

// Klondike solitaire. Click a card to pick it up, then click where it should go.
// Double-click a card to send it to the foundations. Click the deck to deal.

type Suit = 0 | 1 | 2 | 3; // spades, hearts, diamonds, clubs
type Card = { suit: Suit; rank: number; up: boolean };
type Game = {
  stock: Card[];
  waste: Card[];
  foundations: Card[][];
  tableau: Card[][];
  score: number;
};
type Spot =
  | { kind: 'stock' }
  | { kind: 'waste' }
  | { kind: 'foundation'; pile: number }
  | { kind: 'tableau'; col: number; index: number }; // index -1 = the empty column itself

const CW = 96;
const CH = 128;
const GAP = 16;
const DOWN_STEP = 10;
const UP_STEP = 30;
const BOARD_W = 7 * CW + 8 * GAP;
const RANKS = ['', 'A', '2', '3', '4', '5', '6', '7', '8', '9', '10', 'J', 'Q', 'K'];
const isRed = (s: Suit) => s === 1 || s === 2;

function deal(): Game {
  const deck: Card[] = [];
  for (let s = 0; s < 4; s++) for (let r = 1; r <= 13; r++) deck.push({ suit: s as Suit, rank: r, up: false });
  for (let i = deck.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [deck[i], deck[j]] = [deck[j], deck[i]];
  }
  const tableau: Card[][] = [];
  for (let c = 0; c < 7; c++) {
    const col = deck.splice(0, c + 1);
    col[col.length - 1].up = true;
    tableau.push(col);
  }
  return { stock: deck, waste: [], foundations: [[], [], [], []], tableau, score: 0 };
}

const clone = (g: Game): Game => ({
  stock: g.stock.map((c) => ({ ...c })),
  waste: g.waste.map((c) => ({ ...c })),
  foundations: g.foundations.map((p) => p.map((c) => ({ ...c }))),
  tableau: g.tableau.map((p) => p.map((c) => ({ ...c }))),
  score: g.score,
});

const canStackTableau = (card: Card, onto: Card | undefined) =>
  onto ? onto.up && isRed(onto.suit) !== isRed(card.suit) && onto.rank === card.rank + 1 : card.rank === 13;

const canStackFoundation = (card: Card, pile: Card[]) => {
  const top = pile[pile.length - 1];
  return top ? top.suit === card.suit && top.rank === card.rank - 1 : card.rank === 1;
};

/** The cards picked up from a spot (a run for tableau columns, one card elsewhere). */
function cardsAt(g: Game, s: Spot): Card[] {
  if (s.kind === 'waste') return g.waste.slice(-1);
  if (s.kind === 'foundation') return g.foundations[s.pile].slice(-1);
  if (s.kind === 'tableau' && s.index >= 0) return g.tableau[s.col].slice(s.index);
  return [];
}

function removeFrom(g: Game, s: Spot, n: number) {
  if (s.kind === 'waste') g.waste.splice(-n, n);
  if (s.kind === 'foundation') g.foundations[s.pile].splice(-n, n);
  if (s.kind === 'tableau') {
    const col = g.tableau[s.col];
    col.splice(-n, n);
    const top = col[col.length - 1];
    if (top && !top.up) {
      top.up = true;
      g.score += 5;
    }
  }
}

/** Tries to move the cards at `from` onto `to`. Returns the new game, or null if not allowed. */
function move(g: Game, from: Spot, to: Spot): Game | null {
  const cards = cardsAt(g, from);
  if (!cards.length || !cards[0].up) return null;
  if (to.kind === 'foundation') {
    if (cards.length !== 1 || !canStackFoundation(cards[0], g.foundations[to.pile])) return null;
    const next = clone(g);
    removeFrom(next, from, 1);
    next.foundations[to.pile].push({ ...cards[0] });
    if (from.kind !== 'foundation') next.score += 10;
    return next;
  }
  if (to.kind === 'tableau') {
    if (from.kind === 'tableau' && from.col === to.col) return null;
    const col = g.tableau[to.col];
    if (!canStackTableau(cards[0], col[col.length - 1])) return null;
    const next = clone(g);
    removeFrom(next, from, cards.length);
    next.tableau[to.col].push(...cards.map((c) => ({ ...c })));
    if (from.kind === 'waste') next.score += 5;
    if (from.kind === 'foundation') next.score = Math.max(0, next.score - 15);
    return next;
  }
  return null;
}

/** Cards being dragged, and where: positions are in board coordinates. */
type Drag = { from: Spot; cards: Card[]; offX: number; offY: number; x: number; y: number };

const TABLEAU_Y = CH + GAP;
const slotX = (i: number) => GAP + i * (CW + GAP);

const sameSpot = (a: Spot | null, b: Spot) => !!a && JSON.stringify(a) === JSON.stringify(b);

export default function Solitaire({ windowId }: AppProps) {
  const api = useDesktop();
  const [game, setGame] = useState(deal);
  const [history, setHistory] = useState<Game[]>([]);
  const [selected, setSelected] = useState<Spot | null>(null);
  const [drawThree, setDrawThree] = useState(false);
  const [startedAt, setStartedAt] = useState<number | null>(null);
  const [now, setNow] = useState(Date.now());
  const [won, setWon] = useState(false);
  const lastPress = useRef({ key: '', time: 0 });
  const [feltH, setFeltH] = useState(600);
  const [drag, setDrag] = useState<Drag | null>(null);
  const boardRef = useRef<ComponentRef<typeof View>>(null);
  // A drag ends with a click on whatever is under the pointer; ignore that click.
  const suppressPressUntil = useRef(0);

  const newDeal = useCallback(() => {
    setGame(deal());
    setHistory([]);
    setSelected(null);
    setStartedAt(null);
    setWon(false);
  }, []);

  useEffect(() => {
    if (startedAt === null || won) return;
    const t = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(t);
  }, [startedAt, won]);

  useEffect(() => {
    if (Platform.OS !== 'web') return;
    const onKey = (e: KeyboardEvent) => e.key === 'F2' && newDeal();
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [newDeal]);

  const commit = (next: Game) => {
    setHistory((h) => [...h.slice(-99), game]);
    setGame(next);
    setSelected(null);
    if (startedAt === null) setStartedAt(Date.now());
    if (!won && next.foundations.every((p) => p.length === 13)) {
      setWon(true);
      api.showMessage({
        title: 'Solitaire',
        kind: 'info',
        lines: ['Congratulations, you won!', '', `Score: ${next.score}`, 'Press F2 or choose Game > Deal to play again.'],
      });
    }
  };

  const undo = () => {
    const prev = history[history.length - 1];
    if (!prev) return;
    setHistory((h) => h.slice(0, -1));
    setGame(prev);
    setSelected(null);
  };

  const drawFromStock = () => {
    const next = clone(game);
    if (!next.stock.length) {
      if (!next.waste.length) return;
      next.stock = next.waste.reverse().map((c) => ({ ...c, up: false }));
      next.waste = [];
      next.score = Math.max(0, next.score - (drawThree ? 20 : 100));
    } else {
      const n = drawThree ? 3 : 1;
      next.waste.push(...next.stock.splice(-n, n).reverse().map((c) => ({ ...c, up: true })));
    }
    commit(next);
  };

  const sendToFoundation = (from: Spot): boolean => {
    for (let p = 0; p < 4; p++) {
      const next = move(game, from, { kind: 'foundation', pile: p });
      if (next) {
        commit(next);
        return true;
      }
    }
    return false;
  };

  const press = (spot: Spot) => {
    if (won || Date.now() < suppressPressUntil.current) return;
    const key = JSON.stringify(spot);
    const t = Date.now();
    const isDouble = lastPress.current.key === key && t - lastPress.current.time < 400;
    lastPress.current = { key, time: t };

    if (spot.kind === 'stock') {
      setSelected(null);
      drawFromStock();
      return;
    }

    // Double-click sends the top card home.
    if (isDouble && spot.kind !== 'foundation') {
      const isTop = spot.kind === 'waste' || (spot.kind === 'tableau' && spot.index === game.tableau[spot.col].length - 1);
      if (isTop && sendToFoundation(spot)) return;
    }

    if (selected && !sameSpot(selected, spot)) {
      const dest: Spot | null =
        spot.kind === 'foundation' ? spot : spot.kind === 'tableau' ? { kind: 'tableau', col: spot.col, index: -1 } : null;
      const next = dest && move(game, selected, dest);
      if (next) {
        commit(next);
        return;
      }
    }

    // Turn over a face-down card at the bottom of a column.
    if (spot.kind === 'tableau' && spot.index >= 0) {
      const col = game.tableau[spot.col];
      if (spot.index === col.length - 1 && !col[spot.index].up) {
        const next = clone(game);
        next.tableau[spot.col][spot.index].up = true;
        next.score += 5;
        commit(next);
        return;
      }
    }

    const cards = cardsAt(game, spot);
    if (sameSpot(selected, spot) || !cards.length || !cards[0].up) setSelected(null);
    else setSelected(spot);
  };

  const isSelected = (spot: Spot) => {
    if (!selected) return false;
    if (selected.kind === 'tableau' && spot.kind === 'tableau') return selected.col === spot.col && spot.index >= selected.index;
    return sameSpot(selected, spot);
  };

  /** Card positions in a column, squeezed together if the column would run off the bottom. */
  const columnTops = (col: Card[]) => {
    const avail = feltH - TABLEAU_Y - 2 * GAP;
    const downs = col.filter((c) => !c.up).length;
    const ups = col.length - downs;
    let up = UP_STEP;
    if (ups > 1) {
      const need = downs * DOWN_STEP + (ups - 1) * UP_STEP + CH;
      if (need > avail) up = Math.max(12, (avail - CH - downs * DOWN_STEP) / (ups - 1));
    }
    const tops: number[] = [];
    let y = 0;
    for (const c of col) {
      tops.push(y);
      y += c.up ? up : DOWN_STEP;
    }
    return { tops, up };
  };

  const wasteCount = drawThree ? Math.min(3, game.waste.length) : Math.min(1, game.waste.length);

  /** Which pile or card is at a point on the board. */
  const spotAt = (x: number, y: number): Spot | null => {
    if (y >= 0 && y < CH) {
      const i = Math.floor((x - GAP) / (CW + GAP));
      if (x < slotX(i) || x > slotX(i) + CW) return null;
      if (i === 0) return { kind: 'stock' };
      if (i === 1) {
        const left = slotX(1) + (wasteCount - 1) * 18;
        return wasteCount && x >= left && x <= left + CW ? { kind: 'waste' } : null;
      }
      if (i >= 3 && i <= 6) return { kind: 'foundation', pile: i - 3 };
      return null;
    }
    if (y >= TABLEAU_Y) {
      const c = Math.floor((x - GAP) / (CW + GAP));
      if (c < 0 || c > 6 || x < slotX(c) || x > slotX(c) + CW) return null;
      const col = game.tableau[c];
      const { tops } = columnTops(col);
      const ry = y - TABLEAU_Y;
      for (let i = col.length - 1; i >= 0; i--) {
        if (ry >= tops[i] && ry < tops[i] + CH) return { kind: 'tableau', col: c, index: i };
      }
      return { kind: 'tableau', col: c, index: -1 };
    }
    return null;
  };

  /** Top-left corner of the first card at a spot, in board coordinates. */
  const cardOrigin = (s: Spot): [number, number] => {
    if (s.kind === 'waste') return [slotX(1) + (wasteCount - 1) * 18, 0];
    if (s.kind === 'foundation') return [slotX(3 + s.pile), 0];
    if (s.kind === 'tableau') return [slotX(s.col), TABLEAU_Y + (columnTops(game.tableau[s.col]).tops[s.index] ?? 0)];
    return [slotX(0), 0];
  };

  /** Drops dragged cards whose top card is centred at (cx, cy). */
  const drop = (from: Spot, cx: number, cy: number) => {
    let dest: Spot;
    const slot = Math.max(0, Math.min(6, Math.round((cx - GAP - CW / 2) / (CW + GAP))));
    if (cy < TABLEAU_Y) {
      if (slot < 3) return;
      dest = { kind: 'foundation', pile: slot - 3 };
    } else {
      dest = { kind: 'tableau', col: slot, index: -1 };
    }
    const next = move(game, from, dest);
    if (next) commit(next);
    else setSelected(null);
  };

  // Drag and drop with the mouse (web). Clicking still works as before.
  const latest = useRef({ spotAt, cardOrigin, drop, game });
  latest.current = { spotAt, cardOrigin, drop, game };
  useEffect(() => {
    if (Platform.OS !== 'web') return;
    const el = boardRef.current as unknown as HTMLElement | null;
    if (!el) return;
    let pending: { from: Spot; cards: Card[]; offX: number; offY: number; sx: number; sy: number } | null = null;
    let dragging = false;
    const local = (e: PointerEvent) => {
      const r = el.getBoundingClientRect();
      return [e.clientX - r.left, e.clientY - r.top];
    };
    const onDown = (e: PointerEvent) => {
      if (e.button !== 0) return;
      const [x, y] = local(e);
      const from = latest.current.spotAt(x, y);
      if (!from || from.kind === 'stock') return;
      const cards = cardsAt(latest.current.game, from);
      if (!cards.length || !cards[0].up) return;
      const [ox, oy] = latest.current.cardOrigin(from);
      pending = { from, cards, offX: x - ox, offY: y - oy, sx: x, sy: y };
      dragging = false;
    };
    const onMove = (e: PointerEvent) => {
      if (!pending) return;
      const [x, y] = local(e);
      if (!dragging && Math.hypot(x - pending.sx, y - pending.sy) < 5) return;
      dragging = true;
      setDrag({ from: pending.from, cards: pending.cards, offX: pending.offX, offY: pending.offY, x, y });
    };
    const onUp = (e: PointerEvent) => {
      const p = pending;
      pending = null;
      if (!p || !dragging) return;
      dragging = false;
      suppressPressUntil.current = Date.now() + 300;
      const [x, y] = local(e);
      latest.current.drop(p.from, x - p.offX + CW / 2, y - p.offY + CH / 2);
      setDrag(null);
    };
    el.addEventListener('pointerdown', onDown);
    window.addEventListener('pointermove', onMove);
    window.addEventListener('pointerup', onUp);
    return () => {
      el.removeEventListener('pointerdown', onDown);
      window.removeEventListener('pointermove', onMove);
      window.removeEventListener('pointerup', onUp);
    };
  }, []);

  // While dragging, draw the board without the cards being carried.
  const view = drag ? clone(game) : game;
  if (drag) {
    if (drag.from.kind === 'waste') view.waste.pop();
    if (drag.from.kind === 'foundation') view.foundations[drag.from.pile].pop();
    if (drag.from.kind === 'tableau') view.tableau[drag.from.col].splice(drag.from.index);
  }

  const elapsed = startedAt === null ? 0 : Math.max(0, Math.floor((now - startedAt) / 1000));
  const wasteShown = drawThree ? view.waste.slice(-3) : view.waste.slice(-1);

  return (
    <View style={styles.root}>
      <MenuBar
        menus={{
          Game: [
            item('Deal    F2', undefined, newDeal),
            item('Undo', undefined, undo, { disabled: history.length === 0 }),
            separator,
            item(`${drawThree ? '    ' : '✓ '}Draw One`, undefined, () => {
              setDrawThree(false);
              newDeal();
            }),
            item(`${drawThree ? '✓ ' : '    '}Draw Three`, undefined, () => {
              setDrawThree(true);
              newDeal();
            }),
            separator,
            item('Exit', undefined, () => api.closeWindow(windowId)),
          ],
          Help: [
            item('How to Play', undefined, () =>
              api.showMessage({
                title: 'How to Play',
                kind: 'info',
                lines: [
                  'Build the four piles at the top up by suit, from Ace to King.',
                  'In the columns, stack cards down in alternating colors.',
                  'Drag cards where you want them, or click a card and then click where it should go.',
                  'Double-click a card to move it to the top piles.',
                  'Click the deck to turn over more cards.',
                ],
              }),
            ),
          ],
        }}
      />

      <View style={styles.felt} onLayout={(e) => setFeltH(e.nativeEvent.layout.height)}>
        <View ref={boardRef} style={{ width: BOARD_W, alignSelf: 'center', flex: 1 }}>
          {/* Top row: deck, turned cards, gap, then the four foundations. */}
          <View style={styles.topRow}>
            <Pressable onPress={() => press({ kind: 'stock' })} style={styles.slot}>
              {view.stock.length ? <CardBack /> : <EmptySlot recycle={view.waste.length > 0} />}
            </Pressable>
            <View style={styles.slot}>
              {wasteShown.length === 0 && <EmptySlot />}
              {wasteShown.map((c, i) => {
                const top = i === wasteShown.length - 1;
                return (
                  <Pressable
                    key={`${c.suit}-${c.rank}`}
                    disabled={!top}
                    onPress={() => press({ kind: 'waste' })}
                    style={[styles.abs, { left: i * 18 }]}
                  >
                    <CardFace card={c} selected={top && isSelected({ kind: 'waste' })} />
                  </Pressable>
                );
              })}
            </View>
            <View style={styles.slot} />
            {view.foundations.map((pile, p) => (
              <Pressable key={p} onPress={() => press({ kind: 'foundation', pile: p })} style={styles.slot}>
                {pile.length ? (
                  <CardFace card={pile[pile.length - 1]} selected={isSelected({ kind: 'foundation', pile: p })} />
                ) : (
                  <EmptySlot />
                )}
              </Pressable>
            ))}
          </View>

          {/* The seven columns. */}
          <View style={styles.tableau}>
            {view.tableau.map((col, c) => {
              const { tops } = columnTops(game.tableau[c]);
              return (
                <Pressable
                  key={c}
                  onPress={() => press({ kind: 'tableau', col: c, index: -1 })}
                  style={[styles.column, { height: Math.max(CH, feltH - TABLEAU_Y - GAP) }]}
                >
                  {col.length === 0 && <EmptySlot />}
                  {col.map((card, i) => {
                    const top = tops[i];
                    const spot: Spot = { kind: 'tableau', col: c, index: i };
                    return (
                      <Pressable key={`${card.suit}-${card.rank}`} onPress={() => press(spot)} style={[styles.abs, { top }]}>
                        {card.up ? <CardFace card={card} selected={isSelected(spot)} /> : <CardBack />}
                      </Pressable>
                    );
                  })}
                </Pressable>
              );
            })}
          </View>

          {drag && (
            <View pointerEvents="none" style={[styles.abs, styles.dragLayer, { left: drag.x - drag.offX, top: drag.y - drag.offY }]}>
              {drag.cards.map((card, k) => (
                <View key={`${card.suit}-${card.rank}`} style={[styles.abs, { top: k * UP_STEP }]}>
                  <CardFace card={card} />
                </View>
              ))}
            </View>
          )}
        </View>
      </View>

      <View style={styles.status}>
        <View style={[styles.statusCell, win.sunken]}>
          <T>{`Score: ${game.score}`}</T>
        </View>
        <View style={[styles.statusCell, win.sunken]}>
          <T>{`Time: ${elapsed}`}</T>
        </View>
      </View>
    </View>
  );
}

// ---------- Card drawings ----------

function SuitGlyph({ suit, size }: { suit: Suit; size: number }) {
  const color = isRed(suit) ? '#d01818' : '#000';
  return (
    <Svg width={size} height={size} viewBox="0 0 16 16">
      {suit === 0 && (
        <Path
          d="M8,1 C8,1 15,6 15,9.5 C15,11.5 13.5,12.5 12,12.5 C10.5,12.5 9.5,11.8 8.8,10.8 L10,15 H6 L7.2,10.8 C6.5,11.8 5.5,12.5 4,12.5 C2.5,12.5 1,11.5 1,9.5 C1,6 8,1 8,1 Z"
          fill={color}
        />
      )}
      {suit === 1 && (
        <Path
          d="M8,14.5 C8,14.5 1,9.5 1,5.5 C1,3 3,1.5 5,1.5 C6.5,1.5 7.5,2.5 8,3.5 C8.5,2.5 9.5,1.5 11,1.5 C13,1.5 15,3 15,5.5 C15,9.5 8,14.5 8,14.5 Z"
          fill={color}
        />
      )}
      {suit === 2 && <Path d="M8,0.5 L14,8 L8,15.5 L2,8 Z" fill={color} />}
      {suit === 3 && (
        <>
          <Circle cx={8} cy={4.5} r={3.2} fill={color} />
          <Circle cx={4.3} cy={9.3} r={3.2} fill={color} />
          <Circle cx={11.7} cy={9.3} r={3.2} fill={color} />
          <Path d="M7.2,8 L6,15 H10 L8.8,8 Z" fill={color} />
        </>
      )}
    </Svg>
  );
}

// Pip positions for number cards, as fractions of the pip area.
const L = 0;
const M = 0.5;
const R = 1;
const PIPS: Record<number, [number, number][]> = {
  1: [[M, 0.5]],
  2: [[M, 0], [M, 1]],
  3: [[M, 0], [M, 0.5], [M, 1]],
  4: [[L, 0], [R, 0], [L, 1], [R, 1]],
  5: [[L, 0], [R, 0], [M, 0.5], [L, 1], [R, 1]],
  6: [[L, 0], [R, 0], [L, 0.5], [R, 0.5], [L, 1], [R, 1]],
  7: [[L, 0], [R, 0], [M, 0.25], [L, 0.5], [R, 0.5], [L, 1], [R, 1]],
  8: [[L, 0], [R, 0], [M, 0.25], [L, 0.5], [R, 0.5], [M, 0.75], [L, 1], [R, 1]],
  9: [[L, 0], [R, 0], [L, 1 / 3], [R, 1 / 3], [M, 0.5], [L, 2 / 3], [R, 2 / 3], [L, 1], [R, 1]],
  10: [[L, 0], [R, 0], [M, 1 / 6], [L, 1 / 3], [R, 1 / 3], [L, 2 / 3], [R, 2 / 3], [M, 5 / 6], [L, 1], [R, 1]],
};

function CardFace({ card, selected }: { card: Card; selected?: boolean }) {
  const color = isRed(card.suit) ? '#d01818' : '#000';
  const corner = (
    <View style={styles.corner}>
      <PixelText text={RANKS[card.rank]} style={[text.bold, { color, fontSize: 20 }]} />
      <SuitGlyph suit={card.suit} size={14} />
    </View>
  );
  return (
    <View style={styles.card}>
      {corner}
      <View style={styles.cornerFlip}>{corner}</View>
      {card.rank <= 10 ? (
        (PIPS[card.rank] ?? []).map(([fx, fy], i) => {
          const s = card.rank === 1 ? 40 : 20;
          return (
            <View key={i} style={[styles.abs, { left: 34 + fx * 26 - s / 2, top: 26 + fy * 72 - s / 2 }]}>
              <SuitGlyph suit={card.suit} size={s} />
            </View>
          );
        })
      ) : (
        <View style={[styles.court, { borderColor: color }]}>
          <View style={[styles.courtBand, { backgroundColor: isRed(card.suit) ? '#f6d8d0' : '#d8e0f0' }]} />
          <PixelText text={RANKS[card.rank]} style={[text.bold, { color, fontSize: 40 }]} />
          <SuitGlyph suit={card.suit} size={22} />
        </View>
      )}
      {selected && <View style={styles.selectedTint} />}
    </View>
  );
}

function CardBack() {
  return (
    <View style={[styles.card, styles.back]}>
      <Svg width={CW - 12} height={CH - 12}>
        <Defs>
          <Pattern id="card-back" width={12} height={12} patternUnits="userSpaceOnUse">
            <Rect width={12} height={12} fill="#1d3f8f" />
            <Path d="M0,6 L6,0 L12,6 L6,12 Z" fill="none" stroke="#5f8fe0" strokeWidth={1.5} />
            <Circle cx={6} cy={6} r={1.5} fill="#f0c840" />
          </Pattern>
        </Defs>
        <Rect width={CW - 12} height={CH - 12} fill="url(#card-back)" />
        <Rect x={1} y={1} width={CW - 14} height={CH - 14} fill="none" stroke="#f0c840" strokeWidth={2} />
      </Svg>
    </View>
  );
}

function EmptySlot({ recycle }: { recycle?: boolean }) {
  return (
    <View style={styles.empty}>
      {recycle && (
        <Svg width={40} height={40} viewBox="0 0 20 20">
          <Circle cx={10} cy={10} r={6} fill="none" stroke="#7fd07f" strokeWidth={2.5} />
        </Svg>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
  },
  felt: {
    flex: 1,
    userSelect: 'none',
    backgroundColor: '#0b7a3a',
    paddingTop: GAP,
    overflow: 'hidden',
  },
  topRow: {
    flexDirection: 'row',
    gap: GAP,
    paddingHorizontal: GAP,
    marginBottom: GAP,
  },
  slot: {
    width: CW,
    height: CH,
  },
  tableau: {
    flexDirection: 'row',
    gap: GAP,
    paddingHorizontal: GAP,
  },
  column: {
    width: CW,
  },
  abs: {
    position: 'absolute',
  },
  dragLayer: {
    zIndex: 100,
  },
  card: {
    width: CW,
    height: CH,
    backgroundColor: '#fff',
    borderRadius: 6,
    borderWidth: 2,
    borderColor: '#000',
    overflow: 'hidden',
  },
  back: {
    padding: 4,
    backgroundColor: '#fff',
  },
  corner: {
    position: 'absolute',
    left: 4,
    top: 2,
    alignItems: 'center',
  },
  cornerFlip: {
    position: 'absolute',
    right: 0,
    bottom: 0,
    width: 30,
    height: 46,
    transform: [{ rotate: '180deg' }],
  },
  court: {
    position: 'absolute',
    left: 24,
    top: 14,
    right: 24,
    bottom: 14,
    borderWidth: 2,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
  },
  courtBand: {
    ...StyleSheet.absoluteFill,
    top: '30%',
    bottom: '30%',
  },
  selectedTint: {
    ...StyleSheet.absoluteFill,
    backgroundColor: 'rgba(0, 0, 80, 0.4)',
  },
  empty: {
    width: CW,
    height: CH,
    borderRadius: 6,
    borderWidth: 2,
    borderColor: '#065a28',
    backgroundColor: '#0a6c33',
    alignItems: 'center',
    justifyContent: 'center',
  },
  status: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 4,
    height: 34,
    marginTop: 2,
  },
  statusCell: {
    width: 160,
    justifyContent: 'center',
    paddingHorizontal: 6,
  },
});
