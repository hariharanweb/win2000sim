import { useRef, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, View } from 'react-native';

import { Icon } from '../DesktopIcons';
import { type AppProps, useDesktop } from '../desktop/types';
import { getNode, pathToString, searchFs, type FsPath } from '../fs';
import PixelText from '../PixelText';
import { ClassicButton, PixelInput, SunkenPanel, T, text } from '../ui';
import { iconForFile } from './Explorer';

export default function SearchApp({ params }: AppProps) {
  const api = useDesktop();
  const [query, setQuery] = useState(params.searchText ?? '');
  const [results, setResults] = useState<FsPath[] | null>(null);
  const [selected, setSelected] = useState<string | null>(null);
  const lastPress = useRef({ key: '', time: 0 });

  const run = () => {
    setResults(searchFs(api.fs, query));
    setSelected(null);
  };

  const press = (path: FsPath) => {
    const key = path.join('\\');
    const now = Date.now();
    if (lastPress.current.key === key && now - lastPress.current.time < 400) {
      lastPress.current = { key: '', time: 0 };
      api.openPath(path);
    } else {
      lastPress.current = { key, time: now };
      setSelected(key);
    }
  };

  return (
    <View style={styles.root}>
      <View style={styles.form}>
        <T>Search for files or folders named:</T>
        <PixelInput value={query} onChangeText={setQuery} onSubmitEditing={run} autoFocus
          autoCapitalize="none" autoCorrect={false} />
        <T>Look in: Local Disk (C:)</T>
        <ClassicButton label="Search Now" isDefault onPress={run} width={180} />
      </View>
      <SunkenPanel style={styles.results}>
        <View style={styles.header}>
          <T style={styles.colName}>Name</T>
          <T>In Folder</T>
        </View>
        <ScrollView>
          {results?.map((path) => {
            const key = path.join('\\');
            const node = getNode(api.fs, path);
            const name = path[path.length - 1];
            const sel = selected === key;
            return (
              <Pressable key={key} style={[styles.row, sel && styles.rowSel]} onPress={() => press(path)}>
                <View style={styles.colName}>
                  <Icon name={node?.kind === 'folder' ? 'folder' : iconForFile(name)} size={32} />
                  <PixelText text={name} style={[text.ui, styles.cell, sel && styles.selText]} />
                </View>
                <PixelText text={pathToString(path.slice(0, -1))} style={[text.ui, styles.cell, sel && styles.selText]} />
              </Pressable>
            );
          })}
          {results && results.length === 0 && (
            <T style={styles.none}>Search is complete. There are no results to display.</T>
          )}
        </ScrollView>
      </SunkenPanel>
      <T>{results ? `${results.length} file(s) found` : 'Enter your search criteria to begin.'}</T>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    padding: 8,
    gap: 8,
  },
  form: {
    gap: 8,
  },
  results: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    paddingHorizontal: 6,
    paddingVertical: 4,
    borderBottomWidth: 2,
    borderBottomColor: '#808080',
  },
  colName: {
    width: 300,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    height: 36,
    paddingHorizontal: 6,
  },
  rowSel: {
    backgroundColor: '#0a246a',
  },
  cell: {
    fontSize: 18,
  },
  selText: {
    color: '#fff',
  },
  none: {
    padding: 8,
    color: '#808080',
  },
});
