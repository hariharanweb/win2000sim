import { useEffect, useRef, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, View } from 'react-native';

import { Icon, type IconName } from '../DesktopIcons';
import {
  type AppId,
  type AppProps,
  type DesktopApi,
  type ExplorerLocation,
  useDesktop,
} from '../desktop/types';
import { fileExtension, getNode, MY_DOCUMENTS, pathToString, sortedChildren, type FsPath } from '../fs';
import PixelText from '../PixelText';
import { ClassicButton, T, text } from '../ui';
import { win } from '../Win2000Dialog';

type Entry = {
  name: string;
  icon: IconName;
  open: () => void;
};

const DOUBLE_CLICK_MS = 400;

export function iconForFile(name: string): IconName {
  const ext = fileExtension(name);
  if (ext === 'exe') return 'exeFile';
  if (['bmp', 'png'].includes(ext)) return 'bitmapFile';
  if (['txt', 'ini', 'bat', 'sys', 'log'].includes(ext)) return 'textFile';
  return 'file';
}

export function locationTitle(loc: ExplorerLocation): string {
  switch (loc.kind) {
    case 'mycomputer':
      return 'My Computer';
    case 'controlpanel':
      return 'Control Panel';
    case 'printers':
      return 'Printers';
    case 'network':
      return 'Network and Dial-up Connections';
    case 'path':
      if (loc.path.length === 1) return 'Local Disk (C:)';
      if (pathToString(loc.path) === pathToString(MY_DOCUMENTS)) return 'My Documents';
      return loc.path[loc.path.length - 1];
  }
}

function locationAddress(loc: ExplorerLocation): string {
  return loc.kind === 'path' ? pathToString(loc.path) : locationTitle(loc);
}

function parentOf(loc: ExplorerLocation): ExplorerLocation | null {
  switch (loc.kind) {
    case 'mycomputer':
      return null;
    case 'controlpanel':
      return { kind: 'mycomputer' };
    case 'printers':
    case 'network':
      return { kind: 'controlpanel' };
    case 'path':
      return loc.path.length > 1 ? { kind: 'path', path: loc.path.slice(0, -1) } : { kind: 'mycomputer' };
  }
}

function driveNotReady(api: DesktopApi, letter: string) {
  api.showMessage({
    title: `${letter}\\`,
    kind: 'error',
    lines: [`${letter}\\ is not accessible.`, '', 'The device is not ready.'],
  });
}

function entriesFor(
  loc: ExplorerLocation,
  api: DesktopApi,
  go: (loc: ExplorerLocation) => void,
): Entry[] {
  const app = (id: AppId) => () => api.openApp(id);
  switch (loc.kind) {
    case 'mycomputer':
      return [
        { name: '3½ Floppy (A:)', icon: 'floppy', open: () => driveNotReady(api, 'A:') },
        { name: 'Local Disk (C:)', icon: 'harddisk', open: () => go({ kind: 'path', path: ['C:'] }) },
        { name: 'Compact Disc (D:)', icon: 'cdrom', open: () => driveNotReady(api, 'D:') },
        { name: 'Control Panel', icon: 'controlPanel', open: () => go({ kind: 'controlpanel' }) },
      ];
    case 'controlpanel':
      return [
        { name: 'Date/Time', icon: 'datetime', open: app('datetime') },
        { name: 'Display', icon: 'display', open: app('display') },
        { name: 'Network and Dial-up Connections', icon: 'network', open: () => go({ kind: 'network' }) },
        { name: 'Printers', icon: 'printer', open: () => go({ kind: 'printers' }) },
        { name: 'System', icon: 'computer', open: app('system') },
        { name: 'Taskbar & Start Menu', icon: 'taskbar', open: app('taskbar') },
        { name: 'Users and Passwords', icon: 'users', open: app('users') },
      ];
    case 'printers':
      return [
        {
          name: 'Add Printer',
          icon: 'printer',
          open: () =>
            api.showMessage({
              title: 'Add Printer Wizard',
              kind: 'info',
              lines: ['Windows could not find any printers connected', 'to this computer.'],
            }),
        },
      ];
    case 'network':
      return [
        {
          name: 'Make New Connection',
          icon: 'network',
          open: () =>
            api.showMessage({
              title: 'Network Connection Wizard',
              kind: 'info',
              lines: ['You are already connected through your', 'Local Area Connection.'],
            }),
        },
        { name: 'Local Area Connection', icon: 'network', open: app('lanstatus') },
      ];
    case 'path': {
      const node = getNode(api.fs, loc.path);
      if (!node || node.kind !== 'folder') return [];
      return sortedChildren(node).map((child) => {
        const childPath: FsPath = [...loc.path, child.name];
        return child.kind === 'folder'
          ? { name: child.name, icon: 'folder' as IconName, open: () => go({ kind: 'path', path: childPath }) }
          : { name: child.name, icon: iconForFile(child.name), open: () => api.openPath(childPath) };
      });
    }
  }
}

export default function Explorer({ windowId, params }: AppProps) {
  const api = useDesktop();
  const start: ExplorerLocation =
    params.location ?? (params.path ? { kind: 'path', path: params.path } : { kind: 'mycomputer' });
  const [history, setHistory] = useState<ExplorerLocation[]>([start]);
  const [index, setIndex] = useState(0);
  const [selected, setSelected] = useState<string | null>(null);
  const lastPress = useRef({ name: '', time: 0 });

  const loc = history[index];
  const go = (next: ExplorerLocation) => {
    setHistory((h) => [...h.slice(0, index + 1), next]);
    setIndex((i) => i + 1);
  };

  const { setTitle } = api;
  const title = locationTitle(loc);
  useEffect(() => {
    setTitle(windowId, title);
    setSelected(null);
  }, [title, windowId, setTitle]);

  const entries = entriesFor(loc, api, go);
  const parent = parentOf(loc);

  const press = (entry: Entry) => {
    const now = Date.now();
    if (lastPress.current.name === entry.name && now - lastPress.current.time < DOUBLE_CLICK_MS) {
      lastPress.current = { name: '', time: 0 };
      entry.open();
    } else {
      lastPress.current = { name: entry.name, time: now };
      setSelected(entry.name);
    }
  };

  return (
    <View style={styles.root}>
      <View style={styles.toolbar}>
        <ClassicButton label="Back" onPress={() => setIndex(index - 1)} disabled={index === 0} width={100} />
        <ClassicButton label="Forward" onPress={() => setIndex(index + 1)}
          disabled={index >= history.length - 1} width={120} />
        <ClassicButton label="Up" onPress={() => parent && go(parent)} disabled={!parent} width={80} />
      </View>
      <View style={styles.addressRow}>
        <T>Address</T>
        <View style={styles.address}>
          <PixelText text={locationAddress(loc)} style={text.ui} />
        </View>
      </View>

      <Pressable style={styles.view} onPress={() => setSelected(null)}>
        <ScrollView contentContainerStyle={styles.grid}>
          {entries.map((entry) => {
            const isSel = selected === entry.name;
            return (
              <Pressable key={entry.name} style={styles.item} onPress={() => press(entry)}>
                <View style={isSel && styles.iconSelected}>
                  <Icon name={entry.icon} size={64} />
                </View>
                <View style={[styles.label, isSel && styles.labelSelected]}>
                  {wrapLabel(entry.name).map((line) => (
                    <PixelText key={line} text={line} style={[text.ui, styles.labelText, isSel && styles.labelTextSelected]} />
                  ))}
                </View>
              </Pressable>
            );
          })}
          {entries.length === 0 && <T style={styles.empty}>This folder is empty.</T>}
        </ScrollView>
      </Pressable>

      <View style={styles.status}>
        <T>{selected ? selected : `${entries.length} object(s)`}</T>
      </View>
    </View>
  );
}

/** Splits a long name over at most two lines, like Explorer's icon view. */
function wrapLabel(name: string, max = 14): string[] {
  if (name.length <= max) return [name];
  const words = name.split(' ');
  const lines: string[] = [];
  let cur = '';
  for (const w of words) {
    if (cur && (cur + ' ' + w).length > max) {
      lines.push(cur);
      cur = w;
    } else {
      cur = cur ? `${cur} ${w}` : w;
    }
  }
  if (cur) lines.push(cur);
  if (lines.length > 2) return [lines[0], `${lines.slice(1).join(' ').slice(0, max - 3)}...`];
  return lines;
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
  },
  toolbar: {
    flexDirection: 'row',
    gap: 6,
    paddingVertical: 4,
  },
  addressRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingVertical: 4,
  },
  address: {
    flex: 1,
    height: 40,
    backgroundColor: '#fff',
    justifyContent: 'center',
    paddingHorizontal: 6,
    overflow: 'hidden',
    ...win.sunken,
  },
  view: {
    flex: 1,
    backgroundColor: '#fff',
    ...win.sunken,
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    padding: 10,
    gap: 10,
  },
  item: {
    width: 170,
    alignItems: 'center',
    paddingVertical: 6,
  },
  iconSelected: {
    opacity: 0.6,
    backgroundColor: '#0a246a',
  },
  label: {
    marginTop: 4,
    alignItems: 'center',
    paddingHorizontal: 2,
  },
  labelSelected: {
    backgroundColor: '#0a246a',
  },
  labelText: {
    fontSize: 20,
  },
  labelTextSelected: {
    color: '#fff',
  },
  empty: {
    color: '#808080',
  },
  status: {
    height: 34,
    justifyContent: 'center',
    paddingHorizontal: 6,
    marginTop: 2,
    ...win.sunken,
  },
});
