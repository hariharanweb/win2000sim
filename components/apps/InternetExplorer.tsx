import { useEffect, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, View } from 'react-native';

import { Icon, type IconName } from '../DesktopIcons';
import { type AppProps, useDesktop } from '../desktop/types';
import WebFrame from '../desktop/WebFrame';
import PixelText from '../PixelText';
import { ClassicButton, Lines, PixelInput, T, text } from '../ui';
import { win } from '../Win2000Dialog';
import { normalizeUrl } from './commands';

const HOME = 'about:home';

export default function InternetExplorer({ windowId, params }: AppProps) {
  const { setTitle } = useDesktop();
  const [history, setHistory] = useState<string[]>([params.url ?? HOME]);
  const [index, setIndex] = useState(0);
  const [address, setAddress] = useState(params.url ?? HOME);
  const [reloadKey, setReloadKey] = useState(0);
  const [loading, setLoading] = useState(false);

  const url = history[index];

  const navigate = (raw: string) => {
    const next = normalizeUrl(raw);
    setHistory((h) => [...h.slice(0, index + 1), next]);
    setIndex((i) => i + 1);
  };

  useEffect(() => {
    setAddress(url);
    setLoading(!url.startsWith('about:'));
    setTitle(windowId, `${pageTitle(url)} - Microsoft Internet Explorer`);
  }, [url, windowId, setTitle]);

  return (
    <View style={styles.root}>
      <View style={styles.toolbar}>
        <ToolButton icon="back" label="Back" disabled={index === 0} onPress={() => setIndex(index - 1)} />
        <ToolButton icon="forward" label="Forward" disabled={index >= history.length - 1}
          onPress={() => setIndex(index + 1)} />
        <ToolButton icon="stop" label="Stop" onPress={() => setLoading(false)} />
        <ToolButton icon="refresh" label="Refresh" onPress={() => setReloadKey((k) => k + 1)} />
        <ToolButton icon="home" label="Home" onPress={() => navigate(HOME)} />
        <ToolButton icon="search" label="Search" onPress={() => navigate('about:search')} />
      </View>

      <View style={styles.addressRow}>
        <T style={styles.addressLabel}>Address</T>
        <PixelInput
          style={styles.address}
          value={address}
          onChangeText={setAddress}
          onSubmitEditing={() => navigate(address)}
          autoCapitalize="none"
          autoCorrect={false}
          selectTextOnFocus
        />
        <ClassicButton label="Go" onPress={() => navigate(address)} width={70} />
      </View>

      <View style={styles.page}>
        {url === HOME && <HomePage navigate={navigate} />}
        {url === 'about:search' && <SearchPage navigate={navigate} />}
        {url === 'about:windowsupdate' && <UpdatePage />}
        {url === 'about:blank' && null}
        {!url.startsWith('about:') && (
          <WebFrame key={`${url}#${reloadKey}`} url={url} onLoad={() => setLoading(false)} />
        )}
      </View>

      <View style={styles.status}>
        <T>{loading ? `Opening page ${url}...` : 'Done'}</T>
        <View style={styles.zone}>
          <Icon name="ie" size={32} />
          <T>Internet</T>
        </View>
      </View>
    </View>
  );
}

function pageTitle(url: string): string {
  switch (url) {
    case HOME:
      return 'Welcome to Internet Explorer';
    case 'about:search':
      return 'Search the Web';
    case 'about:windowsupdate':
      return 'Windows Update';
    case 'about:blank':
      return 'about:blank';
  }
  try {
    return new URL(url).hostname;
  } catch {
    return url;
  }
}

function ToolButton({ icon, label, onPress, disabled }: {
  icon: IconName;
  label: string;
  onPress: () => void;
  disabled?: boolean;
}) {
  return (
    <Pressable
      onPress={onPress}
      disabled={disabled}
      style={({ pressed, hovered }: { pressed: boolean; hovered?: boolean }) => [
        styles.toolButton,
        !disabled && (pressed ? win.sunken : hovered ? win.raised : null),
        disabled && styles.toolDisabled,
      ]}
    >
      <Icon name={icon} size={32} />
      <PixelText text={label} style={[disabled ? text.disabled : text.ui, styles.toolLabel]} />
    </Pressable>
  );
}

function Link({ label, onPress }: { label: string; onPress: () => void }) {
  return (
    <Pressable onPress={onPress} style={styles.link}>
      <PixelText text={label} style={[text.ui, styles.linkText]} />
      <View style={styles.underline} />
    </Pressable>
  );
}

function HomePage({ navigate }: { navigate: (url: string) => void }) {
  const [query, setQuery] = useState('');
  return (
    <ScrollView contentContainerStyle={styles.pageBody}>
      <PixelText text="Welcome to Internet Explorer" style={[text.bold, styles.h1]} />
      <Lines lines={['Type an address above, or search for something:']} />
      <View style={styles.searchRow}>
        <PixelInput style={styles.searchInput} value={query} onChangeText={setQuery}
          onSubmitEditing={() => query.trim() && navigate(query)} />
        <ClassicButton label="Search" onPress={() => query.trim() && navigate(query)} width={110} />
      </View>
      <PixelText text="Places to visit" style={[text.bold, styles.h2]} />
      <Link label="Windows 2000 on Wikipedia" onPress={() => navigate('https://en.wikipedia.org/wiki/Windows_2000')} />
      <Link label="The web as it looked in 2000 (Wayback Machine)"
        onPress={() => navigate('https://web.archive.org/web/20001201000000*/microsoft.com')} />
      <Link label="example.com" onPress={() => navigate('https://example.com')} />
      <Link label="Windows Update" onPress={() => navigate('about:windowsupdate')} />
      <View style={styles.note}>
        <Lines style={styles.noteText} lines={[
          'Note: some sites (like Google) refuse to be shown inside',
          'another page, so they will appear blank here.',
        ]} />
      </View>
    </ScrollView>
  );
}

function SearchPage({ navigate }: { navigate: (url: string) => void }) {
  const [query, setQuery] = useState('');
  return (
    <View style={styles.pageBody}>
      <PixelText text="Search the Web" style={[text.bold, styles.h1]} />
      <Lines lines={['Find a web page containing:']} />
      <View style={styles.searchRow}>
        <PixelInput style={styles.searchInput} value={query} onChangeText={setQuery} autoFocus
          onSubmitEditing={() => query.trim() && navigate(query)} />
        <ClassicButton label="Search" onPress={() => query.trim() && navigate(query)} width={110} />
      </View>
      <Lines style={styles.noteText} lines={['Results come from Wikipedia.']} />
    </View>
  );
}

type UpdateStage = 'idle' | 'scanning' | 'done';

function UpdatePage() {
  const [stage, setStage] = useState<UpdateStage>('idle');
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    if (stage !== 'scanning') return;
    if (progress >= 20) {
      setStage('done');
      return;
    }
    const t = setTimeout(() => setProgress((p) => p + 1), 150);
    return () => clearTimeout(t);
  }, [stage, progress]);

  return (
    <View style={styles.pageBody}>
      <View style={styles.updateHeader}>
        <Icon name="update" size={64} />
        <PixelText text="Windows Update" style={[text.bold, styles.h1]} />
      </View>
      {stage === 'idle' && (
        <>
          <Lines lines={['Windows Update checks your computer for the latest', 'critical updates, drivers and service packs.']} />
          <ClassicButton label="Scan for updates" isDefault onPress={() => { setProgress(0); setStage('scanning'); }}
            width={240} style={styles.scanButton} />
        </>
      )}
      {stage === 'scanning' && (
        <>
          <Lines lines={['Looking for available updates...']} />
          <View style={styles.progressBox}>
            {Array.from({ length: progress }, (_, i) => <View key={i} style={styles.progressBlock} />)}
          </View>
        </>
      )}
      {stage === 'done' && (
        <>
          <Lines lines={[
            'Your computer is up to date.',
            '',
            'Installed: Windows 2000 Service Pack 4',
            'Installed: Intel Core i7-14700K processor driver',
            'Installed: Internet Explorer 5.01',
            '',
            'There are no critical updates available at this time.',
          ]} />
          <ClassicButton label="Scan again" onPress={() => { setProgress(0); setStage('scanning'); }}
            width={200} style={styles.scanButton} />
        </>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
  },
  toolbar: {
    flexDirection: 'row',
    gap: 2,
    paddingVertical: 2,
    borderBottomWidth: 2,
    borderBottomColor: '#808080',
  },
  toolButton: {
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderWidth: 2,
    borderColor: 'transparent',
  },
  toolDisabled: {
    opacity: 0.6,
  },
  toolLabel: {
    fontSize: 18,
  },
  addressRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingVertical: 4,
  },
  addressLabel: {
    color: '#000',
  },
  address: {
    flex: 1,
  },
  page: {
    flex: 1,
    backgroundColor: '#fff',
    overflow: 'hidden',
    ...win.sunken,
  },
  pageBody: {
    padding: 20,
    gap: 12,
  },
  h1: {
    fontSize: 30,
    color: '#0a246a',
  },
  h2: {
    marginTop: 10,
  },
  searchRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    maxWidth: 640,
  },
  searchInput: {
    flex: 1,
  },
  link: {
    alignSelf: 'flex-start',
  },
  linkText: {
    color: '#0000ee',
  },
  underline: {
    height: 2,
    backgroundColor: '#0000ee',
  },
  note: {
    marginTop: 16,
  },
  noteText: {
    color: '#606060',
    fontSize: 18,
  },
  updateHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
  },
  scanButton: {
    alignSelf: 'flex-start',
    marginTop: 8,
  },
  progressBox: {
    width: 440,
    height: 30,
    flexDirection: 'row',
    gap: 2,
    padding: 2,
    ...win.sunken,
  },
  progressBlock: {
    width: 19,
    backgroundColor: '#0a246a',
  },
  status: {
    height: 34,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 6,
    marginTop: 2,
    ...win.sunken,
  },
  zone: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
});
