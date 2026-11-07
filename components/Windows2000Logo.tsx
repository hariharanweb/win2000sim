import Svg, { Defs, LinearGradient, Path, Rect, Stop } from 'react-native-svg';

// Windows 2000 splash logo: layered offset frames behind the waving four-color flag
// and its trail of small squares. Coordinates are traced from a 2000px-wide screenshot.

const ORANGE = '#c8622a';
const RED = '#c8442a';
const YELLOW = '#f5c842';
const GREEN = '#3d8a2e';
const BLUE = '#1c3fa8';
const LIGHT_BLUE = '#3b8fe8';
const FLAG_RED = '#e8492e';
const FLAG_GREEN = '#3d8a2e';
const FLAG_YELLOW = '#f5c842';

type Pt = [number, number];
const poly = (pts: Pt[]) => 'M' + pts.map(([x, y]) => `${x},${y}`).join(' L') + ' Z';

// Trail columns, nearest the flag first. Each row is drawn as a small slanted tile.
const TRAIL_ROWS = 7;
const TRAIL_COLUMNS = 7;
const ROW_COLORS = ['#000', FLAG_RED, FLAG_RED, '#000', LIGHT_BLUE, LIGHT_BLUE, '#000'];
// Far columns thin out, like the original's dissolving trail.
const SKIP: Record<number, number[]> = { 5: [1, 4], 6: [0, 2, 3, 5, 6] };

function trailTiles() {
  const tiles: { d: string; fill: string }[] = [];
  for (let i = 0; i < TRAIL_COLUMNS; i++) {
    const t = i / (TRAIL_COLUMNS - 1);
    const top: Pt = [1150 - i * 32, 222 - t * 64];
    const bottom: Pt = [1080 - i * 30, 498 - t * 84];
    const w = 34 - i * 3.5;
    const h = 20 - i * 1.6;
    for (let r = 0; r < TRAIL_ROWS; r++) {
      if (SKIP[i]?.includes(r)) continue;
      const k = r / (TRAIL_ROWS - 1);
      const x = top[0] + (bottom[0] - top[0]) * k;
      const y = top[1] + (bottom[1] - top[1]) * k;
      const lean = h * 0.35; // slant to follow the flag's perspective
      tiles.push({
        d: poly([
          [x + lean, y],
          [x + w + lean, y - h * 0.25],
          [x + w, y + h * 0.75],
          [x, y + h],
        ]),
        fill: i === 0 ? '#000' : ROW_COLORS[r],
      });
    }
  }
  return tiles;
}

const TILES = trailTiles();

const FLAG_OUTLINE =
  'M1205,212 C1270,198 1350,215 1418,278 L1335,578 C1270,520 1200,500 1120,518 Z';

const PANES: { d: string; fill: string }[] = [
  { d: 'M1214,252 C1235,247 1258,246 1276,248 L1254,346 C1228,344 1196,344 1172,348 Z', fill: FLAG_RED },
  { d: 'M1300,254 C1325,260 1350,272 1374,292 L1342,388 C1322,370 1302,358 1279,350 Z', fill: FLAG_GREEN },
  { d: 'M1164,378 C1190,374 1220,374 1246,377 L1220,472 C1194,469 1166,470 1139,475 Z', fill: LIGHT_BLUE },
  { d: 'M1270,384 C1293,392 1316,405 1334,421 L1306,514 C1288,498 1266,486 1243,479 Z', fill: FLAG_YELLOW },
];

type Props = { width?: number };

export default function Windows2000Logo({ width = 340 }: Props) {
  const VB_W = 800;
  const VB_H = 745;
  return (
    <Svg width={width} height={(width * VB_H) / VB_W} viewBox={`760 40 ${VB_W} ${VB_H}`}>
      <Defs>
        <LinearGradient id="fadeLeft" x1="0" y1="0" x2="1" y2="0">
          <Stop offset="0" stopColor={ORANGE} stopOpacity="0" />
          <Stop offset="0.25" stopColor={ORANGE} stopOpacity="1" />
        </LinearGradient>
        <LinearGradient id="fadeTopOrange" x1="0" y1="0" x2="0" y2="1">
          <Stop offset="0" stopColor={ORANGE} stopOpacity="0" />
          <Stop offset="0.25" stopColor={ORANGE} stopOpacity="1" />
        </LinearGradient>
        <LinearGradient id="fadeTopYellow" x1="0" y1="0" x2="0" y2="1">
          <Stop offset="0" stopColor={YELLOW} stopOpacity="0" />
          <Stop offset="0.2" stopColor={YELLOW} stopOpacity="1" />
        </LinearGradient>
        <LinearGradient id="fadeTopBlue" x1="0" y1="0" x2="0" y2="1">
          <Stop offset="0" stopColor={LIGHT_BLUE} stopOpacity="0" />
          <Stop offset="0.15" stopColor={LIGHT_BLUE} stopOpacity="1" />
          <Stop offset="0.6" stopColor="#2a5cc8" stopOpacity="1" />
          <Stop offset="1" stopColor={BLUE} stopOpacity="1" />
        </LinearGradient>
        <LinearGradient id="fadeEndsGreen" x1="0" y1="0" x2="1" y2="0">
          <Stop offset="0" stopColor={GREEN} stopOpacity="0" />
          <Stop offset="0.1" stopColor={GREEN} stopOpacity="1" />
          <Stop offset="0.9" stopColor={GREEN} stopOpacity="1" />
          <Stop offset="1" stopColor={GREEN} stopOpacity="0" />
        </LinearGradient>
      </Defs>

      {/* Back layers, furthest first */}
      <Rect x={1458} y={230} width={87} height={547} fill="url(#fadeTopBlue)" />
      <Rect x={978} y={740} width={567} height={37} fill={BLUE} />
      <Rect x={930} y={715} width={415} height={25} fill="url(#fadeEndsGreen)" />
      <Rect x={770} y={560} width={27} height={180} fill="url(#fadeTopYellow)" />
      <Rect x={770} y={690} width={160} height={50} fill={YELLOW} />
      <Rect x={1438} y={98} width={20} height={617} fill={RED} />
      <Rect x={845} y={690} width={613} height={25} fill={RED} />

      {/* Main orange frame, open at the top-left */}
      <Rect x={1170} y={50} width={268} height={48} fill="url(#fadeLeft)" />
      <Rect x={1388} y={50} width={50} height={640} fill={ORANGE} />
      <Rect x={797} y={640} width={641} height={50} fill={ORANGE} />
      <Rect x={797} y={390} width={48} height={300} fill="url(#fadeTopOrange)" />

      {/* Trail of squares behind the flag */}
      {TILES.map((tile, i) => (
        <Path key={i} d={tile.d} fill={tile.fill} />
      ))}

      {/* Waving flag */}
      <Path d={FLAG_OUTLINE} fill="#000" />
      {PANES.map((p) => (
        <Path key={p.fill} d={p.d} fill={p.fill} />
      ))}
    </Svg>
  );
}
