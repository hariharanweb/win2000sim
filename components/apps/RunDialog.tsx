import { useState } from 'react';
import { StyleSheet, View } from 'react-native';

import { Icon } from '../DesktopIcons';
import { type AppProps, useDesktop } from '../desktop/types';
import { ClassicButton, Lines, PixelInput, T } from '../ui';
import { notFoundLines, runCommand } from './commands';

export default function RunDialog({ windowId }: AppProps) {
  const api = useDesktop();
  const [value, setValue] = useState('');

  const run = () => {
    if (!value.trim()) return;
    if (runCommand(value, api)) {
      api.closeWindow(windowId);
    } else {
      api.showMessage({ title: value.trim(), kind: 'error', lines: notFoundLines(value) });
    }
  };

  return (
    <View style={styles.body}>
      <View style={styles.intro}>
        <Icon name="run" size={64} />
        <Lines
          lines={[
            'Type the name of a program, folder, document, or',
            'Internet resource, and Windows will open it for you.',
          ]}
        />
      </View>
      <View style={styles.openRow}>
        <T>Open:</T>
        <PixelInput
          style={styles.input}
          value={value}
          onChangeText={setValue}
          onSubmitEditing={run}
          autoFocus
          autoCapitalize="none"
          autoCorrect={false}
        />
      </View>
      <View style={styles.buttons}>
        <ClassicButton label="OK" isDefault onPress={run} width={130} />
        <ClassicButton label="Cancel" onPress={() => api.closeWindow(windowId)} width={130} />
        <ClassicButton label="Browse..." onPress={() => {}} disabled width={130} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  body: {
    flex: 1,
    padding: 16,
    gap: 18,
  },
  intro: {
    flexDirection: 'row',
    gap: 16,
    alignItems: 'center',
  },
  openRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
  },
  input: {
    flex: 1,
  },
  buttons: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 10,
  },
});
