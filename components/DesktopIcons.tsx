import type { ReactNode } from 'react';
import Svg, {
  Circle,
  Defs,
  Ellipse,
  LinearGradient,
  Path,
  Polygon,
  Rect,
  Stop,
} from 'react-native-svg';

import PixelIcon from './PixelIcon';

// Windows 2000-style icons, drawn on a 32px (or 16px) grid and scaled up.

type IconProps = { size?: number };

// ---------- Building blocks shared by several icons ----------
// Coordinates sit on half pixels so 1px outlines land exactly on the 32x32 grid.
// Light comes from the top left: highlights there, shadows on the bottom right.

const INK = '#000';
const BEIGE = '#e4e0d0';
const BEIGE_LIGHT = '#fbf9f0';
const BEIGE_DARK = '#a8a490';
const BEIGE_SIDE = '#c4c0ac';

/** A vertical or diagonal gradient. Ids must be unique per icon. */
const grad = (id: string, from: string, to: string, diagonal = false) => (
  <Defs>
    <LinearGradient id={id} x1="0" y1="0" x2={diagonal ? '1' : '0'} y2="1">
      <Stop offset="0" stopColor={from} />
      <Stop offset="1" stopColor={to} />
    </LinearGradient>
  </Defs>
);

/** Manila folder seen slightly from above, with its front flap open a little. */
const folderShape = (id: string, dx = 0, dy = 0) => (
  <>
    {grad(`${id}-f`, '#fff2b0', '#e8b840')}
    <Path d={`M${1.5 + dx},${7.5 + dy} h9 l2,2 h15 v17 h-26 z`} fill="#d8a838" stroke="#6a4a08" strokeWidth={1} />
    <Path d={`M${2.5 + dx},${8.5 + dy} h7.5`} stroke="#f8e090" strokeWidth={1} />
    <Path d={`M${4.5 + dx},${12.5 + dy} H${30.5 + dx} L${27.5 + dx},${26.5 + dy} H${1.5 + dx} Z`}
      fill={`url(#${id}-f)`} stroke="#6a4a08" strokeWidth={1} />
    <Path d={`M${5.5 + dx},${13.5 + dy} H${29 + dx}`} stroke="#fffbe0" strokeWidth={1} />
  </>
);

/** A sheet of paper with a folded corner and a soft shadow. */
const page = (x: number, y: number, w: number, h: number) => (
  <>
    <Rect x={x + 1.5} y={y + 1.5} width={w} height={h} fill="#808080" />
    <Path d={`M${x + 0.5},${y + 0.5} h${w - 6} l6,6 v${h - 6} h-${w} z`} fill="#fff" stroke={INK} strokeWidth={1} />
    <Path d={`M${x + w - 5.5},${y + 0.5} v6 h6 z`} fill="#c8c8c8" stroke={INK} strokeWidth={1} strokeLinejoin="bevel" />
  </>
);

/** A small application window with a Windows 2000 gradient title bar. */
const smallWindow = (id: string, x: number, y: number, w: number, h: number) => (
  <>
    <Defs>
      <LinearGradient id={`${id}-t`} x1="0" y1="0" x2="1" y2="0">
        <Stop offset="0" stopColor="#0a246a" />
        <Stop offset="1" stopColor="#a6caf0" />
      </LinearGradient>
    </Defs>
    <Rect x={x + 0.5} y={y + 0.5} width={w} height={h} fill={BEIGE} stroke={INK} strokeWidth={1} />
    <Rect x={x + 1} y={y + 1} width={w} height={4} fill={`url(#${id}-t)`} />
    <Rect x={x + 2.5} y={y + 5.5} width={w - 4} height={h - 7} fill="#fff" stroke="#808080" strokeWidth={1} />
  </>
);

/** A beige CRT monitor in three-quarter view. */
const monitor = (id: string, screen: [string, string], x = 4, y = 2) => (
  <>
    {grad(`${id}-s`, screen[0], screen[1], true)}
    <Polygon points={`${x + 20.5},${y + 0.5} ${x + 24.5},${y + 3.5} ${x + 24.5},${y + 15.5} ${x + 20.5},${y + 17.5}`}
      fill={BEIGE_SIDE} stroke={INK} strokeWidth={1} />
    <Rect x={x + 0.5} y={y + 0.5} width={20} height={17} fill={BEIGE} stroke={INK} strokeWidth={1} />
    <Path d={`M${x + 1.5},${y + 16.5} V${y + 1.5} H${x + 19.5}`} stroke={BEIGE_LIGHT} strokeWidth={1} fill="none" />
    <Rect x={x + 3.5} y={y + 3.5} width={14} height={11} fill={`url(#${id}-s)`} stroke="#404040" strokeWidth={1} />
    <Path d={`M${x + 4.5},${y + 13.5} V${y + 4.5} H${x + 16.5}`} stroke="#ffffff80" strokeWidth={1} fill="none" />
    <Rect x={x + 15.5} y={y + 15.5} width={2} height={1} fill="#30c030" />
  </>
);

/** A flat beige desktop case in three-quarter view, with a floppy slot. */
const desktopCase = (x = 1, y = 20) => (
  <>
    <Polygon points={`${x + 0.5},${y + 3.5} ${x + 4.5},${y + 0.5} ${x + 29.5},${y + 0.5} ${x + 25.5},${y + 3.5}`}
      fill={BEIGE_LIGHT} stroke={INK} strokeWidth={1} />
    <Polygon points={`${x + 25.5},${y + 3.5} ${x + 29.5},${y + 0.5} ${x + 29.5},${y + 5.5} ${x + 25.5},${y + 9.5}`}
      fill={BEIGE_DARK} stroke={INK} strokeWidth={1} />
    <Rect x={x + 0.5} y={y + 3.5} width={25} height={6} fill={BEIGE} stroke={INK} strokeWidth={1} />
    <Path d={`M${x + 14},${y + 6.5} h8`} stroke="#404040" strokeWidth={1} />
    <Rect x={x + 3} y={y + 6} width={2} height={1} fill="#30c030" />
  </>
);

const magnifier = (cx: number, cy: number) => (
  <>
    <Path d={`M${cx + 3.5},${cy + 3.5} l6,6`} stroke={INK} strokeWidth={4.5} strokeLinecap="round" />
    <Path d={`M${cx + 3.5},${cy + 3.5} l6,6`} stroke="#806040" strokeWidth={2.5} strokeLinecap="round" />
    <Circle cx={cx} cy={cy} r={5.5} fill="#c8ecff" stroke={INK} strokeWidth={1.2} />
    <Circle cx={cx} cy={cy} r={4.3} fill="none" stroke="#a0a0a0" strokeWidth={1} />
    <Path d={`M${cx - 2.5},${cy} a2.5,2.5 0 0 1 2.5,-2.5`} stroke="#fff" strokeWidth={1.2} fill="none" />
  </>
);

const gear = (cx: number, cy: number, r: number) => {
  const pts: string[] = [];
  for (let i = 0; i < 16; i++) {
    const a = (i * Math.PI) / 8;
    const rr = i % 2 === 0 ? r : r * 0.74;
    pts.push(`${(cx + rr * Math.cos(a)).toFixed(2)},${(cy + rr * Math.sin(a)).toFixed(2)}`);
  }
  return (
    <>
      <Polygon points={pts.join(' ')} fill="#b8b8b8" stroke={INK} strokeWidth={1} />
      <Circle cx={cx - 0.5} cy={cy - 0.5} r={r * 0.5} fill="#e0e0e0" />
      <Circle cx={cx} cy={cy} r={r * 0.28} fill={BEIGE} stroke={INK} strokeWidth={1} />
    </>
  );
};

const miniFlag = (x: number, y: number, s: number) => (
  <>
    <Rect x={x} y={y} width={s} height={s} fill="#e8492e" />
    <Rect x={x + s + 1} y={y} width={s} height={s} fill="#3d9a2e" />
    <Rect x={x} y={y + s + 1} width={s} height={s} fill="#3b6fe8" />
    <Rect x={x + s + 1} y={y + s + 1} width={s} height={s} fill="#f5c842" />
  </>
);

/** A small globe with green continents. */
const globe = (id: string, cx: number, cy: number, r: number) => (
  <>
    <Defs>
      <LinearGradient id={`${id}-g`} x1="0" y1="0" x2="1" y2="1">
        <Stop offset="0" stopColor="#a8d8ff" />
        <Stop offset="0.5" stopColor="#2a6fe0" />
        <Stop offset="1" stopColor="#0a2a80" />
      </LinearGradient>
    </Defs>
    <Circle cx={cx} cy={cy} r={r} fill={`url(#${id}-g)`} stroke={INK} strokeWidth={1} />
    <Path
      d={`M${cx - r * 0.6},${cy - r * 0.5} q${r * 0.4},-${r * 0.3} ${r * 0.7},0 q-${r * 0.1},${r * 0.5} -${r * 0.5},${r * 0.5} q-${r * 0.3},-${r * 0.2} -${r * 0.2},-${r * 0.5} z
         M${cx + r * 0.1},${cy + r * 0.1} q${r * 0.5},-${r * 0.2} ${r * 0.7},${r * 0.2} q-${r * 0.1},${r * 0.5} -${r * 0.5},${r * 0.6} q-${r * 0.3},-${r * 0.3} -${r * 0.2},-${r * 0.8} z`}
      fill="#3d9a2e" stroke="#104010" strokeWidth={0.6} />
  </>
);

// ---------- Icon drawings (32x32 grid) ----------

const DRAWINGS = {
  ie: (
    <>
      <Defs>
        <LinearGradient id="ico-ie" x1="0" y1="0" x2="1" y2="1">
          <Stop offset="0" stopColor="#9ad4ff" />
          <Stop offset="0.5" stopColor="#2a6fe0" />
          <Stop offset="1" stopColor="#0b2f9a" />
        </LinearGradient>
      </Defs>
      <Path d="M8.5,16.5 H23.5 A7.5,7.5 0 1 0 21.5,21.5" fill="none" stroke={INK} strokeWidth={6} />
      <Path d="M8.5,16.5 H23.5 A7.5,7.5 0 1 0 21.5,21.5" fill="none" stroke="url(#ico-ie)" strokeWidth={4} />
      <Ellipse cx={16} cy={15} rx={14} ry={6} fill="none" stroke="#e8b830" strokeWidth={2}
        transform="rotate(-28 16 15)" />
      <Path d="M3,24 C4,20 7,17 10,15" fill="none" stroke="#f8d860" strokeWidth={1.8} />
    </>
  ),
  computer: (
    <>
      {desktopCase(1, 20)}
      <Rect x={10.5} y={18.5} width={8} height={2} fill={BEIGE_DARK} stroke={INK} strokeWidth={1} />
      {monitor('ico-pc', ['#a8e0ff', '#1050b8'], 4, 1)}
    </>
  ),
  folder: folderShape('ico-folder'),
  documents: (
    <>
      {folderShape('ico-docs')}
      <Rect x={9.5} y={3.5} width={14} height={13} fill="#fff" stroke={INK} strokeWidth={1} />
      <Path d="M12,7.5 h9 M12,10.5 h9 M12,13.5 h6" stroke="#3b6fe8" strokeWidth={1} />
      <Path d={`M4.5,12.5 H30.5 L27.5,26.5 H1.5 Z`} fill="url(#ico-docs-f)" stroke="#6a4a08" strokeWidth={1} />
      <Path d="M5.5,13.5 H29" stroke="#fffbe0" strokeWidth={1} />
    </>
  ),
  programs: (
    <>
      {folderShape('ico-progs', 0, -5)}
      {smallWindow('ico-progs', 8, 13, 22, 17)}
      <Rect x={12} y={21} width={3} height={5} fill="#e8492e" />
      <Rect x={17} y={21} width={3} height={5} fill="#3b6fe8" />
      <Rect x={22} y={21} width={3} height={5} fill="#3d9a2e" />
    </>
  ),
  settings: (
    <>
      <Rect x={4.5} y={2.5} width={15} height={21} fill={BEIGE} stroke={INK} strokeWidth={1} />
      <Path d="M5.5,22.5 V3.5 H18.5" stroke={BEIGE_LIGHT} strokeWidth={1} fill="none" />
      <Rect x={7.5} y={5.5} width={9} height={6} fill="#fff" stroke="#808080" strokeWidth={1} />
      <Path d="M8,15.5 h8 M8,18.5 h8" stroke="#808080" strokeWidth={1} />
      {gear(20, 21, 9)}
    </>
  ),
  search: (
    <>
      {page(10, 2, 19, 25)}
      <Path d="M14,10.5 h11 M14,13.5 h11 M14,16.5 h11 M14,19.5 h8" stroke="#808080" strokeWidth={1} />
      {magnifier(10, 13)}
    </>
  ),
  help: (
    <>
      <Polygon points="4.5,8.5 21.5,3.5 28.5,7.5 11.5,13.5" fill="#b080e0" stroke={INK} strokeWidth={1} />
      <Polygon points="4.5,8.5 11.5,13.5 11.5,29.5 4.5,24.5" fill="#4a1878" stroke={INK} strokeWidth={1} />
      <Polygon points="11.5,13.5 28.5,7.5 28.5,23.5 11.5,29.5" fill="#7a40b0" stroke={INK} strokeWidth={1} />
      <Path d="M5.5,9.5 l5,3.5" stroke="#fff" strokeWidth={1} />
      <Path d="M17,13.5 q2.5,-4 5.5,-1.5 q1,3 -3,4.5 v2" fill="none" stroke="#fff060" strokeWidth={2.2} />
      <Rect x={18.5} y={21} width={2} height={2} fill="#fff060" />
    </>
  ),
  run: (
    <>
      {smallWindow('ico-run', 8, 3, 22, 18)}
      <Rect x={3.5} y={12.5} width={10} height={2} fill="#c02020" stroke={INK} strokeWidth={1} />
      <Rect x={3.5} y={27.5} width={10} height={2} fill="#c02020" stroke={INK} strokeWidth={1} />
      <Polygon points="4.5,14.5 12.5,14.5 8.5,21 12.5,27.5 4.5,27.5 8.5,21" fill="#e8f4ff" stroke={INK} strokeWidth={1} />
      <Path d="M6.5,26.5 h4 l-2,-3 z" fill="#e8c050" />
    </>
  ),
  shutdown: (
    <>
      {monitor('ico-shut', ['#4060a0', '#081840'], 3, 3)}
      <Circle cx={13} cy={12} r={3.5} fill="#f8f0c0" />
      <Circle cx={14.5} cy={11} r={3} fill="#2a4088" />
      <Rect x={9} y={21.5} width={10} height={4} fill={BEIGE_DARK} stroke={INK} strokeWidth={1} />
      <Rect x={5.5} y={25.5} width={18} height={3} fill={BEIGE} stroke={INK} strokeWidth={1} />
    </>
  ),
  update: (
    <>
      {globe('ico-upd', 18, 18, 12)}
      <Rect x={1.5} y={1.5} width={13} height={13} fill="#000" />
      {miniFlag(3, 3, 4.5)}
    </>
  ),
  notepad: (
    <>
      <Rect x={7.5} y={5.5} width={20} height={25} fill="#808080" />
      <Rect x={5.5} y={3.5} width={20} height={25} fill="#fff" stroke={INK} strokeWidth={1} />
      <Rect x={5.5} y={3.5} width={20} height={5} fill="#40a8c8" stroke={INK} strokeWidth={1} />
      <Path d="M8,12.5 h15 M8,15.5 h15 M8,18.5 h15 M8,21.5 h15 M8,24.5 h9" stroke="#8090b0" strokeWidth={1} />
      <Path d="M9.5,1.5 v5 M13.5,1.5 v5 M17.5,1.5 v5 M21.5,1.5 v5" stroke={INK} strokeWidth={1} />
    </>
  ),
  calc: (
    <>
      <Rect x={7.5} y={3.5} width={20} height={27} fill="#808080" />
      <Rect x={5.5} y={1.5} width={20} height={27} fill={BEIGE} stroke={INK} strokeWidth={1} />
      <Path d="M6.5,27.5 V2.5 H24.5" stroke={BEIGE_LIGHT} strokeWidth={1} fill="none" />
      <Rect x={8.5} y={4.5} width={14} height={5} fill="#d0f0d0" stroke="#404040" strokeWidth={1} />
      <Path d="M17,7 h4" stroke="#000" strokeWidth={1} />
      {[0, 1, 2, 3].map((r) =>
        [0, 1, 2].map((c) => (
          <Rect key={`${r}-${c}`} x={8.5 + c * 5} y={11.5 + r * 4} width={4} height={3}
            fill={c === 2 ? '#e05030' : '#fff'} stroke={INK} strokeWidth={1} />
        )),
      )}
    </>
  ),
  cmd: (
    <>
      <Rect x={2.5} y={4.5} width={27} height={23} fill={BEIGE} stroke={INK} strokeWidth={1} />
      <Rect x={3.5} y={5.5} width={25} height={3} fill="#0a246a" />
      <Rect x={4.5} y={9.5} width={23} height={16} fill="#000" stroke="#808080" strokeWidth={1} />
      <Path d="M6.5,12.5 h2 M6.5,12.5 v4 h2 M10.5,13.5 v1 M10.5,15.5 v1 M12,17 l3,-5" stroke="#c0c0c0" strokeWidth={1} fill="none" />
      <Rect x={16} y={16} width={4} height={1} fill="#c0c0c0" />
    </>
  ),
  explorer: (
    <>
      {folderShape('ico-expl')}
      {magnifier(19, 16)}
    </>
  ),
  controlPanel: (
    <>
      {folderShape('ico-cpl')}
      <Rect x={8.5} y={13.5} width={13} height={10} fill={BEIGE} stroke={INK} strokeWidth={1} />
      <Rect x={10.5} y={15.5} width={5} height={3} fill="#3b6fe8" />
      {gear(21, 22, 6.5)}
    </>
  ),
  display: (
    <>
      {monitor('ico-disp', ['#3a6ea5', '#3a6ea5'], 3, 3)}
      <Rect x={7} y={7} width={6} height={4} fill="#e8492e" />
      <Rect x={14} y={7} width={6} height={4} fill="#3d9a2e" />
      <Rect x={7} y={12} width={6} height={4} fill="#f5c842" />
      <Rect x={14} y={12} width={6} height={4} fill="#fff" />
      <Rect x={9} y={21.5} width={10} height={4} fill={BEIGE_DARK} stroke={INK} strokeWidth={1} />
      <Rect x={5.5} y={25.5} width={18} height={3} fill={BEIGE} stroke={INK} strokeWidth={1} />
    </>
  ),
  datetime: (
    <>
      <Rect x={4.5} y={7.5} width={18} height={20} fill="#808080" />
      <Rect x={2.5} y={5.5} width={18} height={20} fill="#fff" stroke={INK} strokeWidth={1} />
      <Rect x={2.5} y={5.5} width={18} height={5} fill="#c02020" stroke={INK} strokeWidth={1} />
      <Path d="M5,14.5 h13 M5,17.5 h13 M5,20.5 h8" stroke="#808080" strokeWidth={1} />
      <Circle cx={22} cy={21} r={8} fill={INK} />
      <Circle cx={22} cy={21} r={7} fill="#fff8d0" stroke="#c8a040" strokeWidth={1} />
      <Path d="M22,16 v5 h4" stroke="#000" strokeWidth={1.4} fill="none" />
    </>
  ),
  users: (
    <>
      <Circle cx={11} cy={9} r={5} fill="#f0c8a0" stroke={INK} strokeWidth={1} />
      <Path d="M10,5 q-4,0 -4,4 q2,-2 6,-2 q2,0 4,1 q0,-3 -6,-3 z" fill="#604020" />
      <Path d="M3.5,27.5 q0,-10 7.5,-10 q7.5,0 7.5,10 z" fill="#3b6fe8" stroke={INK} strokeWidth={1} />
      <Circle cx={22} cy={12} r={5} fill="#f0c8a0" stroke={INK} strokeWidth={1} />
      <Path d="M21,8 q-4,0 -4,4 q2,-2 6,-2 q2,0 4,1 q0,-3 -6,-3 z" fill="#e8c050" />
      <Path d="M14.5,29.5 q0,-10 7.5,-10 q7.5,0 7.5,10 z" fill="#3d9a2e" stroke={INK} strokeWidth={1} />
    </>
  ),
  taskbar: (
    <>
      <Rect x={2.5} y={4.5} width={27} height={23} fill="#3a6ea5" stroke={INK} strokeWidth={1} />
      <Rect x={3.5} y={22.5} width={25} height={4} fill={BEIGE} />
      <Path d="M3.5,22.5 h25" stroke="#fff" strokeWidth={1} />
      <Rect x={4.5} y={23.5} width={6} height={2} fill="#fff" stroke="#404040" strokeWidth={0.5} />
      {smallWindow('ico-tb', 8, 7, 15, 11)}
    </>
  ),
  printer: (
    <>
      <Rect x={9.5} y={2.5} width={14} height={11} fill="#fff" stroke={INK} strokeWidth={1} />
      <Path d="M11.5,5.5 h10 M11.5,8.5 h10" stroke="#808080" strokeWidth={1} />
      <Polygon points="2.5,16.5 6.5,12.5 29.5,12.5 29.5,21.5 25.5,25.5 2.5,25.5" fill={BEIGE_SIDE} stroke={INK} strokeWidth={1} />
      <Rect x={2.5} y={16.5} width={23} height={9} fill={BEIGE} stroke={INK} strokeWidth={1} />
      <Path d="M3.5,24.5 V17.5 H24.5" stroke={BEIGE_LIGHT} strokeWidth={1} fill="none" />
      <Rect x={6.5} y={22.5} width={16} height={7} fill="#fff" stroke={INK} strokeWidth={1} />
      <Rect x={21} y={18} width={2} height={2} fill="#30c030" />
    </>
  ),
  network: (
    <>
      {globe('ico-net', 20, 11, 9)}
      <Rect x={1.5} y={13.5} width={14} height={11} fill={BEIGE} stroke={INK} strokeWidth={1} />
      <Rect x={3.5} y={15.5} width={10} height={7} fill="#1c64c8" stroke="#404040" strokeWidth={1} />
      <Rect x={4.5} y={24.5} width={8} height={3} fill={BEIGE_DARK} stroke={INK} strokeWidth={1} />
      <Path d="M8.5,27.5 v2 h16 v-9" fill="none" stroke={INK} strokeWidth={1.2} />
    </>
  ),
  floppy: (
    <>
      <Path d="M4.5,3.5 h21 l3,3 v22 h-24 z" fill="#303848" stroke={INK} strokeWidth={1} />
      <Rect x={9.5} y={3.5} width={13} height={9} fill="#c8c8d0" stroke={INK} strokeWidth={1} />
      <Rect x={18} y={5} width={3} height={6} fill="#303848" />
      <Rect x={7.5} y={16.5} width={17} height={12} fill="#fff" stroke={INK} strokeWidth={1} />
      <Path d="M9.5,19.5 h13 M9.5,22.5 h13" stroke="#c04040" strokeWidth={1} />
    </>
  ),
  harddisk: (
    <>
      <Polygon points="2.5,14.5 7.5,9.5 29.5,9.5 29.5,19.5 24.5,24.5 2.5,24.5" fill={BEIGE_SIDE} stroke={INK} strokeWidth={1} />
      <Polygon points="2.5,14.5 7.5,9.5 29.5,9.5 24.5,14.5" fill={BEIGE_LIGHT} stroke={INK} strokeWidth={1} />
      <Rect x={2.5} y={14.5} width={22} height={10} fill={BEIGE} stroke={INK} strokeWidth={1} />
      <Path d="M5,19.5 h10" stroke="#606060" strokeWidth={1} />
      <Rect x={19} y={19} width={3} height={2} fill="#30c030" />
    </>
  ),
  cdrom: (
    <>
      <Polygon points="2.5,17.5 7.5,12.5 29.5,12.5 29.5,21.5 24.5,26.5 2.5,26.5" fill={BEIGE_SIDE} stroke={INK} strokeWidth={1} />
      <Rect x={2.5} y={17.5} width={22} height={9} fill={BEIGE} stroke={INK} strokeWidth={1} />
      <Path d="M5,21.5 h12" stroke="#606060" strokeWidth={1} />
      <Defs>
        <LinearGradient id="ico-cd" x1="0" y1="0" x2="1" y2="1">
          <Stop offset="0" stopColor="#f0f0ff" />
          <Stop offset="0.4" stopColor="#c0e0f0" />
          <Stop offset="0.7" stopColor="#f0d0f0" />
          <Stop offset="1" stopColor="#a0a8c0" />
        </LinearGradient>
      </Defs>
      <Ellipse cx={16} cy={9} rx={11} ry={6} fill="url(#ico-cd)" stroke={INK} strokeWidth={1} />
      <Ellipse cx={16} cy={9} rx={2.5} ry={1.4} fill="#fff" stroke={INK} strokeWidth={1} />
    </>
  ),
  textFile: (
    <>
      {page(6, 2, 19, 26)}
      <Path d="M9,10.5 h13 M9,13.5 h13 M9,16.5 h13 M9,19.5 h13 M9,22.5 h8" stroke="#808080" strokeWidth={1} />
    </>
  ),
  exeFile: <>{smallWindow('ico-exe', 3, 6, 26, 20)}</>,
  file: <>{page(6, 2, 19, 26)}</>,
  paint: (
    <>
      <Path d="M3.5,16 C3.5,8 10.5,3.5 18,4.5 C25.5,5.5 29.5,10.5 28.5,16 C27.5,20 22,19 20,21 C18,23 21,27.5 16,28.5 C9,29.5 3.5,23.5 3.5,16 Z"
        fill="#e8d8a8" stroke={INK} strokeWidth={1} />
      <Circle cx={10} cy={14} r={2.5} fill="#e8492e" stroke={INK} strokeWidth={0.6} />
      <Circle cx={14} cy={8.5} r={2.5} fill="#3d9a2e" stroke={INK} strokeWidth={0.6} />
      <Circle cx={20.5} cy={8.5} r={2.5} fill="#3b6fe8" stroke={INK} strokeWidth={0.6} />
      <Circle cx={10} cy={21.5} r={2.5} fill="#f5c842" stroke={INK} strokeWidth={0.6} />
      <Path d="M30.5,1.5 L19,17 L17,15 L28.5,0.5 Z" fill="#c08040" stroke={INK} strokeWidth={1} />
      <Path d="M17,15 L19,17 Q17,22.5 12.5,21.5 Q15,19 17,15 Z" fill="#000" />
    </>
  ),
  solitaire: (
    <>
      <Rect x={3.5} y={6.5} width={15} height={21} rx={1.5} fill="#1d3f8f" stroke={INK} strokeWidth={1}
        transform="rotate(-14 11 17)" />
      <Path d="M6,10 l10,0 M6,14 l10,0 M6,18 l10,0 M6,22 l10,0" stroke="#5f8fe0" strokeWidth={1} transform="rotate(-14 11 17)" />
      <Rect x={12.5} y={4.5} width={15} height={21} rx={1.5} fill="#808080" />
      <Rect x={11.5} y={3.5} width={15} height={21} rx={1.5} fill="#fff" stroke={INK} strokeWidth={1} />
      <Path d="M19,8.5 C19,8.5 14.5,12 14.5,14.5 C14.5,16 15.6,16.8 16.8,16.8 C17.6,16.8 18.3,16.3 18.6,15.7 L17.8,19 H20.2 L19.4,15.7 C19.7,16.3 20.4,16.8 21.2,16.8 C22.4,16.8 23.5,16 23.5,14.5 C23.5,12 19,8.5 19,8.5 Z" fill="#000" />
      <Rect x={13} y={5} width={2} height={3} fill="#d01818" />
    </>
  ),
  minefield: (
    <>
      <Rect x={2.5} y={2.5} width={27} height={27} fill="#c0c0c0" stroke={INK} strokeWidth={1} />
      <Path d="M3.5,28.5 V3.5 H28.5" stroke="#fff" strokeWidth={1} fill="none" />
      <Path d="M16,6 V26 M6,16 H26 M9,9 L23,23 M23,9 L9,23" stroke="#202020" strokeWidth={1.6} />
      <Circle cx={16} cy={16} r={7} fill="#202020" />
      <Rect x={12.5} y={12.5} width={3} height={3} fill="#fff" />
    </>
  ),
  bitmapFile: (
    <>
      {page(6, 2, 19, 26)}
      <Rect x={9.5} y={9.5} width={12} height={14} fill="#80c8ff" stroke="#404040" strokeWidth={1} />
      <Polygon points="10,23 14.5,16 18.5,21 21,18 21,23" fill="#3d9a2e" />
      <Circle cx={17.5} cy={13} r={1.8} fill="#f5c842" />
    </>
  ),
  back: (
    <Polygon points="2.5,16 15.5,4.5 15.5,10.5 28.5,10.5 28.5,21.5 15.5,21.5 15.5,27.5" fill="#3da02e" stroke="#0a3a0a" strokeWidth={1} />
  ),
  forward: (
    <Polygon points="29.5,16 16.5,4.5 16.5,10.5 3.5,10.5 3.5,21.5 16.5,21.5 16.5,27.5" fill="#3da02e" stroke="#0a3a0a" strokeWidth={1} />
  ),
  stop: (
    <>
      <Polygon points="10.5,2.5 21.5,2.5 29.5,10.5 29.5,21.5 21.5,29.5 10.5,29.5 2.5,21.5 2.5,10.5" fill="#e02020" stroke="#400000" strokeWidth={1} />
      <Path d="M11,11 l10,10 M21,11 l-10,10" stroke="#fff" strokeWidth={3} />
    </>
  ),
  refresh: (
    <>
      {page(5, 2, 21, 27)}
      <Path d="M21,13 A6,6 0 1 0 21,20" fill="none" stroke="#3d9a2e" strokeWidth={2.6} />
      <Polygon points="18,9 25,12 19,16" fill="#3d9a2e" />
    </>
  ),
  home: (
    <>
      <Polygon points="16,2.5 30.5,15.5 26.5,15.5 26.5,28.5 5.5,28.5 5.5,15.5 1.5,15.5" fill="#fff8d0" stroke={INK} strokeWidth={1} />
      <Polygon points="16,2.5 30.5,15.5 1.5,15.5" fill="#c02020" stroke={INK} strokeWidth={1} />
      <Rect x={12.5} y={19.5} width={7} height={9} fill="#806000" stroke={INK} strokeWidth={1} />
    </>
  ),
} satisfies Record<string, ReactNode>;

export type IconName = keyof typeof DRAWINGS;

export function Icon({ name, size = 64 }: IconProps & { name: IconName }) {
  return (
    <PixelIcon
      id={`icon:${name}`}
      size={size}
      svg={
        <Svg width={size} height={size} viewBox="0 0 32 32">
          {DRAWINGS[name]}
        </Svg>
      }
    />
  );
}

export function InternetExplorerIcon({ size = 64 }: IconProps) {
  return <Icon name="ie" size={size} />;
}

export function MyComputerIcon({ size = 64 }: IconProps) {
  return <Icon name="computer" size={size} />;
}

// 16x16 pixel-art Start flag. K black, R red, G green, B blue, Y yellow.
const START_FLAG = [
  '................',
  '........KKKKK...',
  '......KKKKKKKKK.',
  'K....KKRRKKGGGK.',
  'K.KKKKKRRRKGGGK.',
  '......KRRRKGGGK.',
  'R.RRRKKRRKKGGKK.',
  'R.R..KKKKKKKKKK.',
  '..RRRKKBBKKYYKK.',
  'B.BBBKKBBBKYYYK.',
  'B.B..KKBBBKYYYK.',
  '..BBBKKBBBKYYYK.',
  'K....KKBBKKYYKK.',
  'K.KKKKKKKKKKKKK.',
  'K......KKKKKKK..',
  '................',
];
const FLAG_COLORS: Record<string, string> = {
  K: '#000',
  R: '#e8492e',
  G: '#3d9a2e',
  B: '#3b6fe8',
  Y: '#f5c842',
};

export function StartFlagIcon({ size = 32 }: IconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 16 16">
      {START_FLAG.flatMap((row, y) =>
        [...row].map((ch, x) =>
          FLAG_COLORS[ch] ? <Rect key={`${x},${y}`} x={x} y={y} width={1} height={1} fill={FLAG_COLORS[ch]} /> : null,
        ),
      )}
    </Svg>
  );
}

export function SpeakerIcon({ size = 32, muted = false }: IconProps & { muted?: boolean }) {
  return (
    <PixelIcon
      id={muted ? 'speaker-muted' : 'speaker'}
      size={size}
      svg={
        <Svg width={size} height={size} viewBox="0 0 16 16">
          <Polygon points="1.5,5.5 4.5,5.5 8.5,1.5 8.5,14.5 4.5,10.5 1.5,10.5" fill="#f8e860" stroke="#000" strokeWidth={1} />
          <Rect x={2} y={6} width={2} height={4} fill="#fff8c0" />
          {muted ? (
            <>
              <Circle cx={11} cy={11} r={3.5} fill="#fff" stroke="#d01010" strokeWidth={1.4} />
              <Path d="M8.6,8.6 L13.4,13.4" stroke="#d01010" strokeWidth={1.4} />
            </>
          ) : (
            <Path d="M10.5,4.5 L12.5,2.5 M10.5,8 H14 M10.5,11.5 L12.5,13.5" stroke="#606060" strokeWidth={1} />
          )}
        </Svg>
      }
    />
  );
}

export type MessageKind = 'error' | 'info' | 'warning' | 'question';

/** The large icon shown in message boxes. */
export function MessageIcon({ kind, size = 64 }: IconProps & { kind: MessageKind }) {
  return (
    <PixelIcon
      id={`msg:${kind}`}
      size={size}
      svg={
        <Svg width={size} height={size} viewBox="0 0 32 32">
          {kind === 'error' && (
            <>
              <Defs>
                <LinearGradient id="msg-err" x1="0" y1="0" x2="1" y2="1">
                  <Stop offset="0" stopColor="#ff8070" />
                  <Stop offset="0.5" stopColor="#e01010" />
                  <Stop offset="1" stopColor="#800000" />
                </LinearGradient>
              </Defs>
              <Circle cx={17} cy={17} r={13} fill="#808080" />
              <Circle cx={15.5} cy={15.5} r={13} fill="url(#msg-err)" stroke="#400000" strokeWidth={1} />
              <Path d="M10.5,10.5 l10,10 M20.5,10.5 l-10,10" stroke="#fff" strokeWidth={3.2} />
            </>
          )}
          {kind === 'warning' && (
            <>
              <Polygon points="17,4 31,29 3,29" fill="#808080" />
              <Polygon points="15.5,2.5 29.5,27.5 1.5,27.5" fill="#f8e020" stroke="#000" strokeWidth={1} strokeLinejoin="round" />
              <Rect x={14} y={10} width={3} height={10} fill="#000" />
              <Rect x={14} y={22} width={3} height={3} fill="#000" />
            </>
          )}
          {(kind === 'info' || kind === 'question') && (
            <>
              <Path d="M17,4 C25,4 31,9 31,15 C31,21 25,25 18,25 L11,31 L12,24 C6,22 3,19 3,15 C3,9 9,4 17,4 Z" fill="#808080" />
              <Path d="M15.5,2.5 C23.5,2.5 29.5,7.5 29.5,13.5 C29.5,19.5 23.5,23.5 16.5,23.5 L9.5,29.5 L10.5,22.5 C4.5,20.5 1.5,17.5 1.5,13.5 C1.5,7.5 7.5,2.5 15.5,2.5 Z"
                fill="#fff" stroke="#000" strokeWidth={1} />
              {kind === 'info' ? (
                <>
                  <Rect x={14} y={6} width={3} height={3} fill="#1c3fd8" />
                  <Path d="M12,11 h5 v8 h2 v1 h-7 v-1 h2 v-7 h-2 z" fill="#1c3fd8" />
                </>
              ) : (
                <>
                  <Path d="M11.5,9.5 q4,-6 8,0 q0,3 -4,5 v2" fill="none" stroke="#1c3fd8" strokeWidth={2.6} />
                  <Rect x={14} y={17.5} width={3} height={3} fill="#1c3fd8" />
                </>
              )}
            </>
          )}
        </Svg>
      }
    />
  );
}
