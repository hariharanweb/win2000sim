import { StyleSheet, View } from 'react-native';
import Svg, { Defs, LinearGradient, Rect, Stop } from 'react-native-svg';

import { iconForFile } from '../apps/Explorer';
import { MY_DOCUMENTS } from '../fs';
import PixelText from '../PixelText';
import { win } from '../Win2000Dialog';
import MenuPanel, { item, type MenuEntry, separator } from './MenuPanel';
import type { DesktopApi } from './types';

type Props = {
  api: DesktopApi;
  onClose: () => void;
};

export function buildStartMenu(api: DesktopApi): MenuEntry[] {
  const { openApp, openPath } = api;
  const recent = api.recentDocs.map((p) => item(p[p.length - 1], iconForFile(p[p.length - 1]), () => openPath(p)));

  return [
    item('Windows Update', 'update', () => openApp('ie', { url: 'about:windowsupdate' })),
    separator,
    item('Programs', 'programs', undefined, {
      submenu: [
        item('Accessories', 'programs', undefined, {
          submenu: [
            item('Games', 'programs', undefined, {
              submenu: [
                item('Minefield', 'minefield', () => openApp('minefield')),
                item('Solitaire', 'solitaire', () => openApp('solitaire')),
              ],
            }),
            item('Calculator', 'calc', () => openApp('calc')),
            item('Command Prompt', 'cmd', () => openApp('cmd')),
            item('Notepad', 'notepad', () => openApp('notepad')),
            item('Paint', 'paint', () => openApp('paint')),
            item('Windows Explorer', 'explorer', () =>
              openApp('explorer', { location: { kind: 'path', path: MY_DOCUMENTS } }),
            ),
          ],
        }),
        item('Startup', 'programs', undefined, { submenu: [] }),
        item('Internet Explorer', 'ie', () => openApp('ie')),
      ],
    }),
    item('Documents', 'documents', undefined, {
      submenu: [
        item('My Documents', 'documents', () =>
          openApp('explorer', { location: { kind: 'path', path: MY_DOCUMENTS } }),
        ),
        ...(recent.length ? [separator, ...recent] : []),
      ],
    }),
    item('Settings', 'settings', undefined, {
      submenu: [
        item('Control Panel', 'controlPanel', () =>
          openApp('explorer', { location: { kind: 'controlpanel' } }),
        ),
        item('Network and Dial-up Connections', 'network', () =>
          openApp('explorer', { location: { kind: 'network' } }),
        ),
        item('Printers', 'printer', () => openApp('explorer', { location: { kind: 'printers' } })),
        item('Taskbar & Start Menu...', 'taskbar', () => openApp('taskbar')),
      ],
    }),
    item('Search', 'search', undefined, {
      submenu: [
        item('For Files or Folders...', 'search', () => openApp('search')),
        item('On the Internet...', 'ie', () => openApp('ie', { url: 'about:search' })),
      ],
    }),
    item('Help', 'help', () => openApp('help')),
    item('Run...', 'run', () => openApp('run')),
    separator,
    item('Shut Down...', 'shutdown', () => openApp('shutdown')),
  ];
}

export default function StartMenu({ api, onClose }: Props) {
  return (
    <View style={styles.menu}>
      <View style={styles.banner}>
        <Svg style={StyleSheet.absoluteFill} width="100%" height="100%" preserveAspectRatio="none">
          <Defs>
            <LinearGradient id="start-banner" x1="0" y1="0" x2="0" y2="1">
              <Stop offset="0" stopColor="#000" />
              <Stop offset="1" stopColor="#1c3fd8" />
            </LinearGradient>
          </Defs>
          <Rect x="0" y="0" width="100%" height="100%" fill="url(#start-banner)" />
        </Svg>
        {/* Rotated so it reads bottom-to-top, pivoting on its bottom-left corner. */}
        <View style={styles.bannerText}>
          <PixelText text="Windows" style={styles.bannerHeavy} />
          <PixelText text=" 2000 " style={styles.bannerLight} />
          <PixelText text="Professional" style={styles.bannerHeavy} />
        </View>
      </View>
      <MenuPanel entries={buildStartMenu(api)} onDone={onClose} variant="large" framed={false} />
    </View>
  );
}

const BANNER_W = 46;

const styles = StyleSheet.create({
  menu: {
    flexDirection: 'row',
    backgroundColor: win.face,
    padding: 3,
    ...win.raised,
  },
  banner: {
    width: BANNER_W,
    overflow: 'hidden',
  },
  bannerText: {
    position: 'absolute',
    left: BANNER_W - 2,
    bottom: 6,
    flexDirection: 'row',
    alignItems: 'flex-end',
    transformOrigin: 'left bottom',
    transform: [{ rotate: '-90deg' }],
  },
  bannerHeavy: {
    fontFamily: '"Arial Black", Arial, sans-serif',
    fontWeight: '900',
    fontSize: 34,
    lineHeight: 42,
    color: '#fff',
    letterSpacing: -1,
  },
  bannerLight: {
    fontFamily: 'Arial, sans-serif',
    fontSize: 32,
    lineHeight: 42,
    color: '#fff',
  },
});
