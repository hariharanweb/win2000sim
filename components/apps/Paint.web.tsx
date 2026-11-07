import { type ReactNode, useCallback, useEffect, useRef, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, View } from 'react-native';
import Svg, { Ellipse, Path, Rect } from 'react-native-svg';

import MenuPanel, { item, type MenuEntry, separator } from '../desktop/MenuPanel';
import { type AppProps, useDesktop } from '../desktop/types';
import { fileExtension, getNode, MY_DOCUMENTS, writeFile, type FsPath } from '../fs';
import PixelText from '../PixelText';
import { ClassicButton, PixelInput, T, text } from '../ui';
import { win } from '../Win2000Dialog';

// Classic Paint. The picture is a pixel buffer drawn without anti-aliasing,
// shown at 2x so each picture pixel matches one "screen pixel" of the UI.

const ZOOM = 2;
const DEFAULT_W = 320;
const DEFAULT_H = 240;
const UNDO_LIMIT = 20;

type Tool = 'pencil' | 'brush' | 'airbrush' | 'eraser' | 'fill' | 'picker' | 'line' | 'rect' | 'ellipse' | 'roundrect';
type FillMode = 'outline' | 'both' | 'fill';
type RGB = [number, number, number];

const TOOLS: { id: Tool; label: string }[] = [
  { id: 'eraser', label: 'Eraser/Color Eraser' },
  { id: 'fill', label: 'Fill With Color' },
  { id: 'picker', label: 'Pick Color' },
  { id: 'pencil', label: 'Pencil' },
  { id: 'brush', label: 'Brush' },
  { id: 'airbrush', label: 'Airbrush' },
  { id: 'line', label: 'Line' },
  { id: 'rect', label: 'Rectangle' },
  { id: 'ellipse', label: 'Ellipse' },
  { id: 'roundrect', label: 'Rounded Rectangle' },
];

const SIZES: Partial<Record<Tool, number[]>> = {
  brush: [1, 3, 5],
  airbrush: [4, 8, 12],
  eraser: [4, 6, 8, 10],
  line: [1, 2, 3, 4, 5],
  rect: [1, 2, 3, 4, 5],
  ellipse: [1, 2, 3, 4, 5],
  roundrect: [1, 2, 3, 4, 5],
};
const SHAPES: Tool[] = ['rect', 'ellipse', 'roundrect'];

const PALETTE = [
  ['#000000', '#808080', '#800000', '#808000', '#008000', '#008080', '#000080', '#800080', '#808040', '#004040', '#0080ff', '#004080', '#8000ff', '#804000'],
  ['#ffffff', '#c0c0c0', '#ff0000', '#ffff00', '#00ff00', '#00ffff', '#0000ff', '#ff00ff', '#ffff80', '#00ff80', '#80ffff', '#8080ff', '#ff0080', '#ff8040'],
];

const toRgb = (hex: string): RGB => [parseInt(hex.slice(1, 3), 16), parseInt(hex.slice(3, 5), 16), parseInt(hex.slice(5, 7), 16)];
const toHex = ([r, g, b]: RGB) => `#${[r, g, b].map((v) => v.toString(16).padStart(2, '0')).join('')}`;

export default function Paint({ windowId, params }: AppProps) {
  const api = useDesktop();
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const imgRef = useRef<ImageData | null>(null);
  const undoRef = useRef<Uint8ClampedArray[]>([]);
  const strokeRef = useRef<{
    button: 0 | 2;
    start: [number, number];
    last: [number, number];
    base: Uint8ClampedArray;
    airTimer?: ReturnType<typeof setInterval>;
  } | null>(null);

  const [size, setSize] = useState({ w: DEFAULT_W, h: DEFAULT_H });
  const [path, setPath] = useState<FsPath | undefined>(params.path);
  const [tool, setTool] = useState<Tool>('pencil');
  const [prevTool, setPrevTool] = useState<Tool>('pencil');
  const [toolSize, setToolSize] = useState<Partial<Record<Tool, number>>>({ brush: 3, airbrush: 8, eraser: 6, line: 1, rect: 1, ellipse: 1, roundrect: 1 });
  const [fillMode, setFillMode] = useState<FillMode>('outline');
  const [fg, setFg] = useState('#000000');
  const [bg, setBg] = useState('#ffffff');
  const [cursor, setCursor] = useState<[number, number] | null>(null);
  const [openMenu, setOpenMenu] = useState<string | null>(null);
  const [saveAsName, setSaveAsName] = useState<string | null>(null);

  const fileName = path ? path[path.length - 1] : 'untitled';
  const { setTitle } = api;
  useEffect(() => {
    setTitle(windowId, `${fileName} - Paint`);
  }, [fileName, windowId, setTitle]);

  const flush = useCallback(() => {
    const ctx = canvasRef.current?.getContext('2d');
    if (ctx && imgRef.current) ctx.putImageData(imgRef.current, 0, 0);
  }, []);

  const blank = useCallback(
    (w: number, h: number, color = '#ffffff') => {
      const canvas = canvasRef.current;
      if (!canvas) return;
      canvas.width = w;
      canvas.height = h;
      const ctx = canvas.getContext('2d', { willReadFrequently: true })!;
      ctx.fillStyle = color;
      ctx.fillRect(0, 0, w, h);
      imgRef.current = ctx.getImageData(0, 0, w, h);
      setSize({ w, h });
    },
    [],
  );

  // Load the file we were opened with, or start with a blank picture.
  useEffect(() => {
    blank(DEFAULT_W, DEFAULT_H);
    const node = params.path && getNode(api.fs, params.path);
    if (node && node.kind === 'file' && node.content.startsWith('data:image/')) {
      const image = new Image();
      image.onload = () => {
        blank(image.width, image.height);
        const ctx = canvasRef.current!.getContext('2d', { willReadFrequently: true })!;
        ctx.drawImage(image, 0, 0);
        imgRef.current = ctx.getImageData(0, 0, image.width, image.height);
      };
      image.src = node.content;
    }
    // Only on first open.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const pushUndo = () => {
    if (!imgRef.current) return;
    undoRef.current.push(new Uint8ClampedArray(imgRef.current.data));
    if (undoRef.current.length > UNDO_LIMIT) undoRef.current.shift();
  };

  const undo = useCallback(() => {
    const prev = undoRef.current.pop();
    if (prev && imgRef.current && prev.length === imgRef.current.data.length) {
      imgRef.current.data.set(prev);
      flush();
    }
  }, [flush]);

  // Ctrl+Z undoes, like the real thing.
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'z') {
        e.preventDefault();
        undo();
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [undo]);

  // ---- pixel helpers ----

  const setPx = (x: number, y: number, [r, g, b]: RGB) => {
    const img = imgRef.current!;
    if (x < 0 || y < 0 || x >= img.width || y >= img.height) return;
    const i = (y * img.width + x) * 4;
    img.data[i] = r;
    img.data[i + 1] = g;
    img.data[i + 2] = b;
    img.data[i + 3] = 255;
  };

  const getPx = (x: number, y: number): RGB => {
    const img = imgRef.current!;
    const i = (y * img.width + x) * 4;
    return [img.data[i], img.data[i + 1], img.data[i + 2]];
  };

  const stamp = (x: number, y: number, s: number, c: RGB, round = false) => {
    const o = Math.floor((s - 1) / 2);
    for (let dy = 0; dy < s; dy++) {
      for (let dx = 0; dx < s; dx++) {
        if (round && s > 2) {
          const cx = dx - (s - 1) / 2;
          const cy = dy - (s - 1) / 2;
          if (cx * cx + cy * cy > (s / 2) * (s / 2)) continue;
        }
        setPx(x - o + dx, y - o + dy, c);
      }
    }
  };

  const line = (x0: number, y0: number, x1: number, y1: number, plot: (x: number, y: number) => void) => {
    const dx = Math.abs(x1 - x0);
    const dy = -Math.abs(y1 - y0);
    const sx = x0 < x1 ? 1 : -1;
    const sy = y0 < y1 ? 1 : -1;
    let err = dx + dy;
    for (;;) {
      plot(x0, y0);
      if (x0 === x1 && y0 === y1) break;
      const e2 = 2 * err;
      if (e2 >= dy) {
        err += dy;
        x0 += sx;
      }
      if (e2 <= dx) {
        err += dx;
        y0 += sy;
      }
    }
  };

  const floodFill = (x: number, y: number, c: RGB) => {
    const img = imgRef.current!;
    const [tr, tg, tb] = getPx(x, y);
    if (tr === c[0] && tg === c[1] && tb === c[2]) return;
    const { width: w, height: h, data } = img;
    const match = (px: number, py: number) => {
      const i = (py * w + px) * 4;
      return data[i] === tr && data[i + 1] === tg && data[i + 2] === tb;
    };
    const stack: [number, number][] = [[x, y]];
    while (stack.length) {
      const [sx, sy] = stack.pop()!;
      let lx = sx;
      while (lx > 0 && match(lx - 1, sy)) lx--;
      let up = false;
      let down = false;
      for (let px = lx; px < w && match(px, sy); px++) {
        setPx(px, sy, c);
        if (sy > 0) {
          const m = match(px, sy - 1);
          if (m && !up) stack.push([px, sy - 1]);
          up = m;
        }
        if (sy < h - 1) {
          const m = match(px, sy + 1);
          if (m && !down) stack.push([px, sy + 1]);
          down = m;
        }
      }
    }
  };

  /** Draws a rectangle, ellipse or rounded rectangle between two corners. */
  const drawShape = (kind: Tool, a: [number, number], b: [number, number], stroke: RGB, fill: RGB, t: number) => {
    const x0 = Math.min(a[0], b[0]);
    const x1 = Math.max(a[0], b[0]);
    const y0 = Math.min(a[1], b[1]);
    const y1 = Math.max(a[1], b[1]);
    // Is pixel (x, y) inside the shape shrunk by `inset` pixels on every side?
    const inside = (x: number, y: number, inset: number) => {
      const l = x0 + inset;
      const r = x1 - inset;
      const tp = y0 + inset;
      const bt = y1 - inset;
      if (x < l || x > r || y < tp || y > bt) return false;
      if (kind === 'rect') return true;
      if (kind === 'ellipse') {
        const rx = (r - l) / 2 + 0.5;
        const ry = (bt - tp) / 2 + 0.5;
        const cx = (l + r) / 2;
        const cy = (tp + bt) / 2;
        return ((x - cx) / rx) ** 2 + ((y - cy) / ry) ** 2 <= 1;
      }
      const rad = Math.max(0, 8 - inset);
      const cx = x < l + rad ? l + rad : x > r - rad ? r - rad : x;
      const cy = y < tp + rad ? tp + rad : y > bt - rad ? bt - rad : y;
      return (x - cx) ** 2 + (y - cy) ** 2 <= (rad + 0.5) ** 2;
    };
    for (let y = y0; y <= y1; y++) {
      for (let x = x0; x <= x1; x++) {
        if (!inside(x, y, 0)) continue;
        if (fillMode === 'fill') setPx(x, y, fill);
        else if (!inside(x, y, t)) setPx(x, y, stroke);
        else if (fillMode === 'both') setPx(x, y, fill);
      }
    }
  };

  // ---- pointer handling ----

  const toImage = (e: React.PointerEvent<HTMLCanvasElement>): [number, number] => {
    const r = e.currentTarget.getBoundingClientRect();
    const img = imgRef.current!;
    return [
      Math.floor(((e.clientX - r.left) / r.width) * img.width),
      Math.floor(((e.clientY - r.top) / r.height) * img.height),
    ];
  };

  const spray = (x: number, y: number, radius: number, c: RGB) => {
    for (let i = 0; i < radius * 2; i++) {
      const a = Math.random() * Math.PI * 2;
      const d = Math.random() * radius;
      setPx(Math.round(x + Math.cos(a) * d), Math.round(y + Math.sin(a) * d), c);
    }
  };

  const onPointerDown = (e: React.PointerEvent<HTMLCanvasElement>) => {
    if (!imgRef.current || (e.button !== 0 && e.button !== 2)) return;
    setOpenMenu(null);
    e.currentTarget.setPointerCapture(e.pointerId);
    const button = e.button as 0 | 2;
    const p = toImage(e);
    const main = toRgb(button === 0 ? fg : bg);
    const other = toRgb(button === 0 ? bg : fg);

    if (tool === 'picker') {
      const c = toHex(getPx(p[0], p[1]));
      (button === 0 ? setFg : setBg)(c);
      setTool(prevTool);
      return;
    }
    pushUndo();
    if (tool === 'fill') {
      floodFill(p[0], p[1], main);
      flush();
      return;
    }

    strokeRef.current = { button, start: p, last: p, base: new Uint8ClampedArray(imgRef.current.data) };
    if (tool === 'pencil') setPx(p[0], p[1], main);
    if (tool === 'brush') stamp(p[0], p[1], toolSize.brush!, main, true);
    // The eraser paints the background color (the foreground color with the right button).
    if (tool === 'eraser') stamp(p[0], p[1], toolSize.eraser!, other);
    if (tool === 'airbrush') {
      spray(p[0], p[1], toolSize.airbrush!, main);
      strokeRef.current.airTimer = setInterval(() => {
        const s = strokeRef.current;
        if (!s) return;
        spray(s.last[0], s.last[1], toolSize.airbrush!, main);
        flush();
      }, 40);
    }
    flush();
  };

  const onPointerMove = (e: React.PointerEvent<HTMLCanvasElement>) => {
    if (!imgRef.current) return;
    const p = toImage(e);
    setCursor(p);
    const s = strokeRef.current;
    if (!s) return;
    const main = toRgb(s.button === 0 ? fg : bg);
    const other = toRgb(s.button === 0 ? bg : fg);
    const [lx, ly] = s.last;

    if (tool === 'pencil') line(lx, ly, p[0], p[1], (x, y) => setPx(x, y, main));
    else if (tool === 'brush') line(lx, ly, p[0], p[1], (x, y) => stamp(x, y, toolSize.brush!, main, true));
    else if (tool === 'eraser') line(lx, ly, p[0], p[1], (x, y) => stamp(x, y, toolSize.eraser!, other));
    else if (tool === 'airbrush') spray(p[0], p[1], toolSize.airbrush!, main);
    else if (tool === 'line') {
      imgRef.current.data.set(s.base);
      line(s.start[0], s.start[1], p[0], p[1], (x, y) => stamp(x, y, toolSize.line!, main));
    } else if (SHAPES.includes(tool)) {
      imgRef.current.data.set(s.base);
      drawShape(tool, s.start, p, main, other, toolSize[tool]!);
    }
    s.last = p;
    flush();
  };

  const endStroke = () => {
    const s = strokeRef.current;
    if (s?.airTimer) clearInterval(s.airTimer);
    strokeRef.current = null;
  };

  // ---- file operations ----

  const save = (target: FsPath) => {
    const data = canvasRef.current?.toDataURL('image/png');
    if (!data) return;
    api.setFs((fs) => writeFile(fs, target, data));
    setPath(target);
  };

  const confirmSaveAs = () => {
    const name = (saveAsName ?? '').trim();
    if (!name) return;
    save([...MY_DOCUMENTS, fileExtension(name) ? name : `${name}.bmp`]);
    setSaveAsName(null);
  };

  const transform = (fn: (x: number, y: number, w: number, h: number) => [number, number]) => {
    const img = imgRef.current;
    if (!img) return;
    pushUndo();
    const src = new Uint8ClampedArray(img.data);
    const { width: w, height: h } = img;
    for (let y = 0; y < h; y++) {
      for (let x = 0; x < w; x++) {
        const [sx, sy] = fn(x, y, w, h);
        const si = (sy * w + sx) * 4;
        const di = (y * w + x) * 4;
        for (let k = 0; k < 4; k++) img.data[di + k] = src[si + k];
      }
    }
    flush();
  };

  const invert = () => {
    const img = imgRef.current;
    if (!img) return;
    pushUndo();
    for (let i = 0; i < img.data.length; i += 4) {
      img.data[i] = 255 - img.data[i];
      img.data[i + 1] = 255 - img.data[i + 1];
      img.data[i + 2] = 255 - img.data[i + 2];
    }
    flush();
  };

  const clearImage = () => {
    const img = imgRef.current;
    if (!img) return;
    pushUndo();
    const c = toRgb(bg);
    for (let y = 0; y < img.height; y++) for (let x = 0; x < img.width; x++) setPx(x, y, c);
    flush();
  };

  const selectTool = (t: Tool) => {
    if (t === 'picker' && tool !== 'picker') setPrevTool(tool);
    setTool(t);
  };

  const menus: Record<string, MenuEntry[]> = {
    File: [
      item('New', undefined, () => {
        undoRef.current = [];
        blank(DEFAULT_W, DEFAULT_H);
        setPath(undefined);
      }),
      item('Save', undefined, () => (path ? save(path) : setSaveAsName('untitled.bmp'))),
      item('Save As...', undefined, () => setSaveAsName(fileName === 'untitled' ? 'untitled.bmp' : fileName)),
      separator,
      item('Exit', undefined, () => api.closeWindow(windowId)),
    ],
    Edit: [item('Undo', undefined, undo)],
    Image: [
      item('Flip Horizontal', undefined, () => transform((x, y, w) => [w - 1 - x, y])),
      item('Flip Vertical', undefined, () => transform((x, y, _w, h) => [x, h - 1 - y])),
      item('Invert Colors', undefined, invert),
      separator,
      item('Clear Image', undefined, clearImage),
    ],
    Help: [
      item('About Paint', undefined, () =>
        api.showMessage({
          title: 'About Paint',
          kind: 'info',
          lines: ['Paint', 'Version 5.0', 'A simple bitmap drawing program.'],
        }),
      ),
    ],
  };

  const sizes = SIZES[tool];

  return (
    <View style={styles.root}>
      <View style={styles.menuBar}>
        {Object.keys(menus).map((name) => (
          <View key={name} style={openMenu === name && styles.menuOpen}>
            <Pressable
              onPress={() => setOpenMenu(openMenu === name ? null : name)}
              onHoverIn={() => openMenu && setOpenMenu(name)}
              style={[styles.menuTitle, openMenu === name && win.sunken]}
            >
              <T>{name}</T>
            </Pressable>
            {openMenu === name && (
              <MenuPanel entries={menus[name]} onDone={() => setOpenMenu(null)} showIcons={false} style={styles.dropdown} />
            )}
          </View>
        ))}
      </View>

      <View style={styles.main}>
        {/* Tool box */}
        <View style={styles.toolbox}>
          <View style={styles.toolGrid}>
            {TOOLS.map((t) => (
              <Pressable
                key={t.id}
                accessibilityLabel={t.label}
                onPress={() => selectTool(t.id)}
                style={[styles.toolButton, tool === t.id ? [win.sunken, styles.toolActive] : win.raised]}
              >
                <ToolIcon tool={t.id} />
              </Pressable>
            ))}
          </View>
          <View style={styles.options}>
            {SHAPES.includes(tool) && (
              <View style={styles.optionCol}>
                {(['outline', 'both', 'fill'] as FillMode[]).map((m) => (
                  <Pressable key={m} onPress={() => setFillMode(m)} style={[styles.option, fillMode === m && styles.optionActive]}>
                    <View
                      style={[
                        styles.fillSample,
                        { borderColor: m === 'fill' ? 'transparent' : fillMode === m ? '#fff' : '#000' },
                        m !== 'outline' && { backgroundColor: '#808080' },
                      ]}
                    />
                  </Pressable>
                ))}
              </View>
            )}
            {sizes && (
              <View style={styles.optionCol}>
                {sizes.map((s) => {
                  const active = toolSize[tool] === s;
                  const color = active ? '#fff' : '#000';
                  return (
                    <Pressable
                      key={s}
                      onPress={() => setToolSize((ts) => ({ ...ts, [tool]: s }))}
                      style={[styles.option, active && styles.optionActive]}
                    >
                      {tool === 'airbrush' || tool === 'brush' ? (
                        <View style={{ width: s * 2 + 2, height: s * 2 + 2, borderRadius: s + 1, backgroundColor: color }} />
                      ) : tool === 'eraser' ? (
                        <View style={{ width: s * 2, height: s * 2, backgroundColor: color }} />
                      ) : (
                        <View style={{ width: 40, height: s * 2, backgroundColor: color }} />
                      )}
                    </Pressable>
                  );
                })}
              </View>
            )}
          </View>
        </View>

        {/* Picture area */}
        <ScrollView style={styles.workspace} contentContainerStyle={styles.workspaceContent} horizontal={false}>
          <ScrollView horizontal contentContainerStyle={styles.workspaceContent}>
            <canvas
              ref={canvasRef}
              onPointerDown={onPointerDown}
              onPointerMove={onPointerMove}
              onPointerUp={endStroke}
              onPointerCancel={endStroke}
              onPointerLeave={() => setCursor(null)}
              onContextMenu={(e) => e.preventDefault()}
              style={{
                display: 'block',
                width: size.w * ZOOM,
                height: size.h * ZOOM,
                imageRendering: 'pixelated',
                cursor: 'crosshair',
                touchAction: 'none',
              }}
            />
          </ScrollView>
        </ScrollView>
      </View>

      {/* Color box */}
      <View style={styles.colorBox}>
        <View style={[styles.current, win.sunken]}>
          <View style={[styles.swatchBg, { backgroundColor: bg }]} />
          <View style={[styles.swatchFg, { backgroundColor: fg }]} />
        </View>
        <View>
          {PALETTE.map((row, r) => (
            <View key={r} style={styles.paletteRow}>
              {row.map((c) => (
                <Swatch key={c} color={c} onLeft={() => setFg(c)} onRight={() => setBg(c)} />
              ))}
            </View>
          ))}
        </View>
      </View>

      {/* Status bar */}
      <View style={styles.status}>
        <View style={[styles.statusMain, win.sunken]}>
          <T>For Help, click Help Topics on the Help Menu.</T>
        </View>
        <View style={[styles.statusCoords, win.sunken]}>
          <T>{cursor ? `${cursor[0]},${cursor[1]}` : ''}</T>
        </View>
      </View>

      {saveAsName !== null && (
        <View style={styles.overlay}>
          <View style={styles.saveAs}>
            <PixelText text="Save As" style={[text.bold, styles.saveAsTitle]} />
            <View style={styles.saveAsBody}>
              <T>Save in: My Documents</T>
              <View style={styles.saveAsRow}>
                <T>File name:</T>
                <PixelInput
                  style={styles.saveAsInput}
                  value={saveAsName}
                  onChangeText={setSaveAsName}
                  onSubmitEditing={confirmSaveAs}
                  autoFocus
                  autoCapitalize="none"
                  autoCorrect={false}
                />
              </View>
              <View style={styles.saveAsButtons}>
                <ClassicButton label="Save" isDefault onPress={confirmSaveAs} width={120} />
                <ClassicButton label="Cancel" onPress={() => setSaveAsName(null)} width={120} />
              </View>
            </View>
          </View>
        </View>
      )}
    </View>
  );
}

/** A palette color: left click picks the foreground color, right click the background. */
function Swatch({ color, onLeft, onRight }: { color: string; onLeft: () => void; onRight: () => void }) {
  return (
    <div
      onMouseDown={(e) => {
        if (e.button === 0) onLeft();
        if (e.button === 2) onRight();
      }}
      onContextMenu={(e) => e.preventDefault()}
      style={{
        width: 28,
        height: 28,
        boxSizing: 'border-box',
        borderStyle: 'solid',
        borderWidth: 2,
        borderColor: '#808080 #fff #fff #808080',
        backgroundColor: color,
        boxShadow: 'inset 2px 2px 0 #404040',
      }}
    />
  );
}

function ToolIcon({ tool }: { tool: Tool }) {
  const drawings: Record<Tool, ReactNode> = {
    pencil: (
      <>
        <Path d="M3,13 L11,5 L13,7 L5,15 Z" fill="#f5c842" stroke="#000" strokeWidth={0.8} />
        <Path d="M11,5 L12.5,3.5 L14.5,5.5 L13,7 Z" fill="#e88080" stroke="#000" strokeWidth={0.8} />
        <Path d="M3,13 L2,16 L5,15 Z" fill="#000" />
      </>
    ),
    brush: (
      <>
        <Path d="M9,8 L14,1 L15,2 L10,9 Z" fill="#a06020" stroke="#000" strokeWidth={0.6} />
        <Path d="M5,10 Q8,7 10,9 Q9,13 4,15 Q2,15 3,13 Q4,12 5,10 Z" fill="#000" />
      </>
    ),
    airbrush: (
      <>
        <Rect x={7} y={6} width={6} height={9} fill="#c0c0c0" stroke="#000" strokeWidth={0.8} />
        <Rect x={8} y={3} width={3} height={3} fill="#808080" stroke="#000" strokeWidth={0.8} />
        {[[3, 2], [5, 4], [2, 5], [4, 7], [1, 3]].map(([x, y]) => (
          <Rect key={`${x}${y}`} x={x} y={y} width={1} height={1} fill="#0000ff" />
        ))}
      </>
    ),
    eraser: (
      <>
        <Path d="M2,11 L8,5 L14,8 L8,14 Z" fill="#fff" stroke="#000" strokeWidth={0.8} />
        <Path d="M8,5 L14,8 L14,10 L8,14 L8,12 L14,8" fill="#ffff80" stroke="#000" strokeWidth={0.8} />
      </>
    ),
    fill: (
      <>
        <Path d="M4,7 L9,2 L14,7 L9,12 Z" fill="#c0c0c0" stroke="#000" strokeWidth={0.8} />
        <Path d="M4,7 Q2,10 3,13 Q4,13 4,10 Z" fill="#0000ff" />
      </>
    ),
    picker: (
      <>
        <Path d="M3,14 L10,7 L11,8 L4,15 Z" fill="#fff" stroke="#000" strokeWidth={0.8} />
        <Path d="M10,5 L12,3 Q14,1 15,3 Q15,4 13,6 L11,8 Z" fill="#000" />
      </>
    ),
    line: <Path d="M2,14 L14,2" stroke="#000" strokeWidth={1.2} />,
    rect: <Rect x={2.5} y={4.5} width={11} height={8} fill="none" stroke="#000" strokeWidth={1} />,
    ellipse: <Ellipse cx={8} cy={8.5} rx={6} ry={4.5} fill="none" stroke="#000" strokeWidth={1} />,
    roundrect: <Rect x={2.5} y={4.5} width={11} height={8} rx={2.5} fill="none" stroke="#000" strokeWidth={1} />,
  };
  return (
    <Svg width={32} height={32} viewBox="0 0 16 16">
      {drawings[tool]}
    </Svg>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
  },
  menuBar: {
    flexDirection: 'row',
    height: 36,
    alignItems: 'center',
    zIndex: 10,
  },
  menuOpen: {
    zIndex: 10,
  },
  menuTitle: {
    paddingHorizontal: 10,
    height: 32,
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: 'transparent',
  },
  dropdown: {
    position: 'absolute',
    top: 32,
    left: 0,
  },
  main: {
    flex: 1,
    flexDirection: 'row',
  },
  toolbox: {
    width: 100,
    padding: 6,
    alignItems: 'center',
    gap: 8,
  },
  toolGrid: {
    width: 88,
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  toolButton: {
    width: 44,
    height: 44,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: win.face,
  },
  toolActive: {
    backgroundColor: '#e8e6e0',
  },
  options: {
    width: 84,
    minHeight: 140,
    flexDirection: 'row',
    justifyContent: 'center',
    padding: 4,
    gap: 4,
    ...win.sunken,
  },
  optionCol: {
    flex: 1,
    gap: 2,
  },
  option: {
    height: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },
  optionActive: {
    backgroundColor: '#0a246a',
  },
  fillSample: {
    width: 40,
    height: 16,
    borderWidth: 2,
  },
  workspace: {
    flex: 1,
    backgroundColor: '#808080',
    ...win.sunken,
  },
  workspaceContent: {
    padding: 6,
  },
  colorBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    padding: 6,
  },
  current: {
    width: 60,
    height: 60,
    backgroundColor: win.face,
  },
  swatchBg: {
    position: 'absolute',
    right: 8,
    bottom: 8,
    width: 26,
    height: 26,
    borderWidth: 2,
    borderColor: '#fff',
  },
  swatchFg: {
    position: 'absolute',
    left: 6,
    top: 6,
    width: 26,
    height: 26,
    borderWidth: 2,
    borderColor: '#fff',
  },
  paletteRow: {
    flexDirection: 'row',
  },
  status: {
    flexDirection: 'row',
    gap: 4,
    height: 34,
  },
  statusMain: {
    flex: 1,
    justifyContent: 'center',
    paddingHorizontal: 6,
  },
  statusCoords: {
    width: 140,
    justifyContent: 'center',
    paddingHorizontal: 6,
  },
  overlay: {
    ...StyleSheet.absoluteFill,
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 20,
  },
  saveAs: {
    width: 560,
    maxWidth: '95%',
    backgroundColor: win.face,
    padding: 3,
    ...win.raised,
  },
  saveAsTitle: {
    color: '#fff',
    backgroundColor: '#0a246a',
    paddingHorizontal: 6,
    paddingVertical: 4,
  },
  saveAsBody: {
    padding: 14,
    gap: 14,
  },
  saveAsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  saveAsInput: {
    flex: 1,
  },
  saveAsButtons: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 10,
  },
});
