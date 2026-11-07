import { useEffect, useState } from 'react';
import { Platform, Pressable, StyleSheet, TextInput, View } from 'react-native';

import MenuPanel, { item, type MenuEntry, separator } from '../desktop/MenuPanel';
import { type AppProps, useDesktop } from '../desktop/types';
import { fileExtension, getNode, MY_DOCUMENTS, writeFile, type FsPath } from '../fs';
import PixelText from '../PixelText';
import { ClassicButton, PixelInput, T, text } from '../ui';
import { win } from '../Win2000Dialog';

export default function Notepad({ windowId, params }: AppProps) {
  const api = useDesktop();
  const [path, setPath] = useState<FsPath | undefined>(params.path);
  const [content, setContent] = useState(() => {
    const node = params.path && getNode(api.fs, params.path);
    return node && node.kind === 'file' ? node.content.replace(/\r\n/g, '\n') : '';
  });
  const [openMenu, setOpenMenu] = useState<string | null>(null);
  const [saveAsName, setSaveAsName] = useState<string | null>(null);

  const fileName = path ? path[path.length - 1] : 'Untitled';

  const { setTitle } = api;
  useEffect(() => {
    setTitle(windowId, `${fileName} - Notepad`);
  }, [fileName, windowId, setTitle]);

  const save = (target: FsPath) => {
    api.setFs((fs) => writeFile(fs, target, content.replace(/\n/g, '\r\n')));
    setPath(target);
  };

  const confirmSaveAs = () => {
    const name = (saveAsName ?? '').trim();
    if (!name) return;
    const withExt = fileExtension(name) ? name : `${name}.txt`;
    save([...MY_DOCUMENTS, withExt]);
    setSaveAsName(null);
  };

  const menus: Record<string, MenuEntry[]> = {
    File: [
      item('New', undefined, () => {
        setContent('');
        setPath(undefined);
      }),
      item('Save', undefined, () => (path ? save(path) : setSaveAsName('Untitled.txt'))),
      item('Save As...', undefined, () => setSaveAsName(fileName === 'Untitled' ? 'Untitled.txt' : fileName)),
      separator,
      item('Exit', undefined, () => api.closeWindow(windowId)),
    ],
    Edit: [
      item('Time/Date', undefined, () => {
        const now = new Date();
        setContent((c) => `${c}${now.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' })} ${now.toLocaleDateString()}`);
      }),
      item('Clear', undefined, () => setContent('')),
    ],
    Help: [
      item('About Notepad', undefined, () =>
        api.showMessage({
          title: 'About Notepad',
          kind: 'info',
          lines: ['Microsoft (R) Notepad', 'Version 5.0 (Build 2195)', 'Copyright (C) 1981-1999 Microsoft Corp.'],
        }),
      ),
    ],
  };

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
              <MenuPanel
                entries={menus[name]}
                onDone={() => setOpenMenu(null)}
                showIcons={false}
                style={styles.dropdown}
              />
            )}
          </View>
        ))}
      </View>

      <TextInput
        style={styles.editor}
        value={content}
        onChangeText={setContent}
        onFocus={() => setOpenMenu(null)}
        multiline
        autoFocus
        autoCapitalize="none"
        autoCorrect={false}
        spellCheck={false}
      />

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

const webNoOutline = Platform.OS === 'web' ? ({ outlineStyle: 'none' } as object) : {};

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
  editor: {
    flex: 1,
    backgroundColor: '#fff',
    padding: 6,
    fontFamily: Platform.select({ web: '"Lucida Console", Monaco, monospace', default: 'monospace' }),
    fontSize: 20,
    color: '#000',
    textAlignVertical: 'top',
    ...win.sunken,
    ...webNoOutline,
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
