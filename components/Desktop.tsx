import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Platform, Pressable, StyleSheet, View } from 'react-native';

import { messageBoxSize } from './apps/MessageBox';
import { locationTitle } from './apps/Explorer';
import { APPS } from './apps/registry';
import { Icon, type IconName, SpeakerIcon, StartFlagIcon } from './DesktopIcons';
import StartMenu from './desktop/StartMenu';
import VolumeControl from './desktop/VolumeControl';
import { diskActivity, isMuted, onMuteChange, playSound } from './sound';
import {
  type AppId,
  type DesktopApi,
  DesktopContext,
  type LaunchParams,
  type MessageBoxSpec,
  type PowerAction,
  type WindowState,
} from './desktop/types';
import WindowFrame from './desktop/WindowFrame';
import { fileExtension, getNode, type FsPath } from './fs';
import PixelText from './PixelText';
import { useSystem } from './system';
import { text } from './ui';
import { win } from './Win2000Dialog';

type Props = {
  onPower: (action: PowerAction) => void;
};

type DesktopIconId = 'ie' | 'computer';

const DESKTOP_ICONS: { id: DesktopIconId; lines: string[]; icon: IconName }[] = [
  { id: 'ie', lines: ['Internet', 'Explorer'], icon: 'ie' },
  { id: 'computer', lines: ['My Computer'], icon: 'computer' },
];

const DOUBLE_CLICK_MS = 400;

// Programs that can be started by opening their .exe file.
const EXE_APPS: Record<string, AppId> = {
  'notepad.exe': 'notepad',
  'calc.exe': 'calc',
  'mspaint.exe': 'paint',
  'sol.exe': 'solitaire',
  'mines.exe': 'minefield',
  'cmd.exe': 'cmd',
  'iexplore.exe': 'ie',
  'explorer.exe': 'explorer',
  'winver.exe': 'about',
};
const IMAGE_EXTS = ['bmp', 'png'];
const TEXT_EXTS = ['txt', 'ini', 'bat', 'sys', 'log', ''];

export default function Desktop({ onPower }: Props) {
  const { settings, fs, setFs } = useSystem();
  const [windows, setWindows] = useState<WindowState[]>([]);
  const [recentDocs, setRecentDocs] = useState<FsPath[]>([]);
  const [startOpen, setStartOpen] = useState(false);
  const [selectedIcon, setSelectedIcon] = useState<DesktopIconId | null>(null);
  const [bounds, setBounds] = useState({ width: 1200, height: 800 });
  const [loggedOnAt] = useState(() => Date.now());
  const nextId = useRef(1);
  const lastIconPress = useRef({ id: '', time: 0 });

  // Refs so the stable callbacks below always see current values.
  const boundsRef = useRef(bounds);
  boundsRef.current = bounds;
  const fsRef = useRef(fs);
  fsRef.current = fs;

  const focusWindow = useCallback((id: number) => {
    setWindows((ws) => {
      const w = ws.find((x) => x.id === id);
      if (!w) return ws;
      return [...ws.filter((x) => x.id !== id), { ...w, minimized: false }];
    });
  }, []);

  const patchWindow = useCallback((id: number, patch: Partial<WindowState>) => {
    setWindows((ws) => ws.map((w) => (w.id === id ? { ...w, ...patch } : w)));
  }, []);

  const openApp = useCallback((app: AppId, params: LaunchParams = {}) => {
    const def = APPS[app];
    if (!def.dialog) diskActivity(350);
    setWindows((ws) => {
      if (def.single) {
        const existing = ws.find((w) => w.app === app);
        if (existing) return [...ws.filter((w) => w !== existing), { ...existing, minimized: false }];
      }
      let { w, h } = def;
      let title = def.title;
      if (app === 'msgbox' && params.message) {
        ({ w, h } = messageBoxSize(params.message.lines));
        title = params.message.title;
      }
      if (app === 'explorer') {
        title = locationTitle(params.location ?? (params.path ? { kind: 'path', path: params.path } : { kind: 'mycomputer' }));
      }
      const b = boundsRef.current;
      w = Math.min(w, b.width - 20);
      h = Math.min(h, b.height - 20);
      const id = nextId.current++;
      // Dialogs open centered; other windows cascade from the top-left.
      const step = (id % 8) * 32;
      const x = def.dialog ? (b.width - w) / 2 : Math.min(60 + step, b.width - w);
      const y = def.dialog ? (b.height - h) / 2 : Math.min(30 + step, b.height - h);
      return [...ws, { id, app, title, params, x, y, w, h, minimized: false, maximized: false }];
    });
  }, []);

  const closeWindow = useCallback((id: number) => {
    setWindows((ws) => ws.filter((w) => w.id !== id));
  }, []);

  const setTitle = useCallback((id: number, title: string) => patchWindow(id, { title }), [patchWindow]);

  // Window chrome around the content: 2px border + 3px padding per side, plus title bar.
  const setContentSize = useCallback(
    (id: number, width: number, height: number) => patchWindow(id, { w: width + 10, h: height + 50 }),
    [patchWindow],
  );

  const showMessage = useCallback(
    (message: MessageBoxSpec) => {
      playSound(message.kind);
      openApp('msgbox', { message });
    },
    [openApp],
  );

  const openPath = useCallback(
    (path: FsPath) => {
      const node = getNode(fsRef.current, path);
      const name = path[path.length - 1];
      if (!node) {
        showMessage({ title: name, kind: 'error', lines: [`Windows cannot find '${name}'.`] });
        return;
      }
      if (node.kind === 'folder') {
        openApp('explorer', { location: { kind: 'path', path } });
        return;
      }
      const exeApp = EXE_APPS[name.toLowerCase()];
      if (exeApp) {
        openApp(exeApp);
        return;
      }
      if (IMAGE_EXTS.includes(fileExtension(name))) {
        openApp('paint', { path });
        setRecentDocs((r) => [path, ...r.filter((p) => p.join('\\') !== path.join('\\'))].slice(0, 10));
        return;
      }
      if (TEXT_EXTS.includes(fileExtension(name))) {
        openApp('notepad', { path });
        setRecentDocs((r) => [path, ...r.filter((p) => p.join('\\') !== path.join('\\'))].slice(0, 10));
        return;
      }
      showMessage({
        title: 'Open With',
        kind: 'info',
        lines: [`Windows cannot open this file:`, '', `File: ${name}`, '', 'No program is associated with this file type.'],
      });
    },
    [openApp, showMessage],
  );

  const power = useCallback(
    (action: PowerAction) => {
      setWindows([]);
      setStartOpen(false);
      onPower(action);
    },
    [onPower],
  );

  const api = useMemo<DesktopApi>(
    () => ({ openApp, closeWindow, setTitle, setContentSize, showMessage, fs, setFs, openPath, recentDocs, power, loggedOnAt }),
    [openApp, closeWindow, setTitle, setContentSize, showMessage, fs, setFs, openPath, recentDocs, power, loggedOnAt],
  );

  // Logging on plays the start-up sound while the disk loads the desktop.
  useEffect(() => {
    playSound('startup');
    diskActivity(2500);
  }, []);

  // Clicking the tray speaker opens the volume control; the icon shows when sound is muted.
  const [volumeOpen, setVolumeOpen] = useState(false);
  const [muted, setMutedState] = useState(isMuted);
  useEffect(() => onMuteChange(setMutedState), []);

  // Escape closes the Start menu.
  useEffect(() => {
    if (Platform.OS !== 'web' || !startOpen) return;
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && setStartOpen(false);
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [startOpen]);

  const pressDesktopIcon = (id: DesktopIconId) => {
    const now = Date.now();
    if (lastIconPress.current.id === id && now - lastIconPress.current.time < DOUBLE_CLICK_MS) {
      lastIconPress.current = { id: '', time: 0 };
      if (id === 'ie') openApp('ie');
      else openApp('explorer', { location: { kind: 'mycomputer' } });
    } else {
      lastIconPress.current = { id, time: now };
      setSelectedIcon(id);
    }
  };

  const visible = windows.filter((w) => !w.minimized);
  const activeId = visible.length ? visible[visible.length - 1].id : null;

  return (
    <DesktopContext.Provider value={api}>
      <View style={[styles.screen, { backgroundColor: settings.desktopColor }]}>
        <View
          style={styles.desktopArea}
          onLayout={(e) => setBounds({ width: e.nativeEvent.layout.width, height: e.nativeEvent.layout.height })}
        >
          {/* Clicking empty desktop clears the icon selection. */}
          <Pressable style={StyleSheet.absoluteFill} onPress={() => setSelectedIcon(null)} />

          <View style={styles.iconColumn}>
            {DESKTOP_ICONS.map((item) => {
              const sel = selectedIcon === item.id;
              return (
                <Pressable key={item.id} style={styles.icon} onPress={() => pressDesktopIcon(item.id)}>
                  <View style={sel && styles.iconImageSelected}>
                    <Icon name={item.icon} size={64} />
                  </View>
                  <View style={[styles.iconLabel, sel && styles.iconLabelSelected]}>
                    {item.lines.map((line) => (
                      <PixelText key={line} text={line} style={text.white} />
                    ))}
                  </View>
                </Pressable>
              );
            })}
          </View>

          {windows.map((w, i) => {
            const def = APPS[w.app];
            const { Component } = def;
            return (
              <WindowFrame
                key={w.id}
                state={w}
                icon={def.icon}
                active={w.id === activeId}
                resizable={def.resizable}
                dialog={def.dialog}
                bounds={bounds}
                zIndex={i + 1}
                onFocus={() => focusWindow(w.id)}
                onClose={() => closeWindow(w.id)}
                onMinimize={() => patchWindow(w.id, { minimized: true })}
                onToggleMaximize={() => patchWindow(w.id, { maximized: !w.maximized })}
                onMove={(x, y) => patchWindow(w.id, { x, y })}
                onResize={(width, height) => patchWindow(w.id, { w: width, h: height })}
              >
                <Component windowId={w.id} params={w.params} />
              </WindowFrame>
            );
          })}

          {volumeOpen && (
            <>
              <Pressable style={[StyleSheet.absoluteFill, styles.menuCatcher]} onPress={() => setVolumeOpen(false)} />
              <View style={styles.volumePopup}>
                <VolumeControl />
              </View>
            </>
          )}

          {startOpen && (
            <>
              <Pressable style={[StyleSheet.absoluteFill, styles.menuCatcher]} onPress={() => setStartOpen(false)} />
              <View style={styles.startMenu}>
                <StartMenu api={api} onClose={() => setStartOpen(false)} />
              </View>
            </>
          )}
        </View>

        <View style={styles.taskbar}>
          <Pressable
            onPress={() => {
              setVolumeOpen(false);
              setStartOpen(!startOpen);
            }}
            style={({ pressed }) => [styles.startButton, pressed || startOpen ? styles.startOuterDown : styles.startOuterUp]}
          >
            {({ pressed }) => {
              const down = pressed || startOpen;
              return (
                <View style={[styles.startInner, down ? styles.startInnerDown : styles.startInnerUp]}>
                  <StartFlagIcon size={32} />
                  <PixelText text="Start" style={text.bold} pixel={2} />
                </View>
              );
            }}
          </Pressable>

          <View style={styles.divider} />

          <View style={styles.tasks}>
            {windows
              .slice()
              .sort((a, b) => a.id - b.id)
              .map((w) => {
                const isActive = w.id === activeId;
                return (
                  <Pressable
                    key={w.id}
                    onPress={() => {
                      setStartOpen(false);
                      if (isActive) patchWindow(w.id, { minimized: true });
                      else focusWindow(w.id);
                    }}
                    style={[styles.taskButton, isActive ? [win.sunken, styles.taskActive] : win.raised]}
                  >
                    <Icon name={APPS[w.app].icon} size={32} />
                    <View style={styles.taskLabel}>
                      <PixelText text={w.title} style={isActive ? text.bold : text.ui} />
                    </View>
                  </Pressable>
                );
              })}
          </View>

          <View style={styles.tray}>
            <Pressable
              onPress={() => {
                setStartOpen(false);
                setVolumeOpen(!volumeOpen);
              }}
              accessibilityLabel={muted ? 'Volume (muted)' : 'Volume'}
            >
              <SpeakerIcon size={32} muted={muted} />
            </Pressable>
            {settings.showClock && <Clock onDoubleClick={() => openApp('datetime')} />}
          </View>
        </View>
      </View>
    </DesktopContext.Provider>
  );
}

function Clock({ onDoubleClick }: { onDoubleClick: () => void }) {
  const [now, setNow] = useState(() => new Date());
  const last = useRef(0);

  useEffect(() => {
    const id = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(id);
  }, []);

  // Windows 2000 default: 12-hour time without AM/PM, e.g. "10:00".
  const h = now.getHours() % 12 || 12;
  const m = String(now.getMinutes()).padStart(2, '0');
  return (
    <Pressable
      onPress={() => {
        const t = Date.now();
        if (t - last.current < DOUBLE_CLICK_MS) onDoubleClick();
        last.current = t;
      }}
    >
      <PixelText text={`${h}:${m}`} style={text.ui} />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
  },
  desktopArea: {
    flex: 1,
    overflow: 'hidden',
  },
  iconColumn: {
    position: 'absolute',
    top: 20,
    left: 4,
    gap: 40,
  },
  icon: {
    width: 140,
    alignItems: 'center',
  },
  iconImageSelected: {
    // Win2000 tints the selected icon blue; a translucent overlay approximates that.
    opacity: 0.6,
    backgroundColor: '#0a246a',
  },
  iconLabel: {
    marginTop: 6,
    paddingHorizontal: 2,
    alignItems: 'center',
  },
  iconLabelSelected: {
    backgroundColor: '#0a246a',
  },
  menuCatcher: {
    zIndex: 999,
  },
  volumePopup: {
    position: 'absolute',
    right: 4,
    bottom: 4,
    zIndex: 1000,
  },
  startMenu: {
    position: 'absolute',
    left: 2,
    bottom: 0,
    zIndex: 1000,
  },
  taskbar: {
    height: 56,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 4,
    gap: 6,
    backgroundColor: win.face,
    borderTopWidth: 2,
    borderTopColor: '#fff',
    zIndex: 1001,
  },
  // Classic two-level bevel: outer white/black edge, inner face/dark-gray edge.
  startButton: {
    height: 44,
    borderWidth: 2,
    backgroundColor: win.face,
  },
  startOuterUp: {
    borderTopColor: '#fff',
    borderLeftColor: '#fff',
    borderBottomColor: '#000',
    borderRightColor: '#000',
  },
  startOuterDown: {
    borderTopColor: '#000',
    borderLeftColor: '#000',
    borderBottomColor: '#fff',
    borderRightColor: '#fff',
  },
  startInner: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    borderWidth: 2,
  },
  startInnerUp: {
    paddingLeft: 4,
    paddingRight: 6,
    borderTopColor: win.face,
    borderLeftColor: win.face,
    borderBottomColor: '#808080',
    borderRightColor: '#808080',
  },
  // Pressed: the contents shift down and right by one screen pixel.
  startInnerDown: {
    paddingLeft: 6,
    paddingRight: 4,
    paddingTop: 2,
    borderTopColor: '#808080',
    borderLeftColor: '#808080',
    borderBottomColor: win.face,
    borderRightColor: win.face,
  },
  divider: {
    width: 4,
    height: 44,
    borderLeftWidth: 2,
    borderLeftColor: '#808080',
    borderRightWidth: 2,
    borderRightColor: '#fff',
  },
  tasks: {
    flex: 1,
    flexDirection: 'row',
    gap: 6,
    overflow: 'hidden',
  },
  taskButton: {
    height: 44,
    flexShrink: 1,
    width: 300,
    minWidth: 60,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 6,
    backgroundColor: win.face,
    overflow: 'hidden',
  },
  taskActive: {
    backgroundColor: '#e8e6e2',
  },
  taskLabel: {
    flex: 1,
    overflow: 'hidden',
  },
  tray: {
    height: 44,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingHorizontal: 12,
    ...win.sunken,
  },
});
