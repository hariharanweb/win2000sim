import { StyleSheet, View } from 'react-native';

import { MessageIcon } from '../DesktopIcons';
import { type AppProps, useDesktop } from '../desktop/types';
import { ClassicButton, Lines } from '../ui';

export default function MessageBox({ windowId, params }: AppProps) {
  const { closeWindow } = useDesktop();
  const message = params.message;
  if (!message) return null;

  return (
    <View style={styles.box}>
      <View style={styles.content}>
        <MessageIcon kind={message.kind} />
        <View style={styles.text}>
          <Lines lines={message.lines} />
        </View>
      </View>
      <View style={styles.buttons}>
        <ClassicButton label="OK" isDefault autoFocus onPress={() => closeWindow(windowId)} />
      </View>
    </View>
  );
}

/** Window size that fits a message with this many lines. */
export function messageBoxSize(lines: string[]) {
  const longest = Math.max(...lines.map((l) => l.length), 20);
  return {
    w: Math.min(900, Math.max(420, 140 + longest * 11)),
    h: 190 + Math.max(lines.length, 2) * 28,
  };
}

const styles = StyleSheet.create({
  box: {
    flex: 1,
    padding: 18,
    justifyContent: 'space-between',
  },
  content: {
    flexDirection: 'row',
    gap: 18,
    alignItems: 'flex-start',
  },
  text: {
    flex: 1,
    paddingTop: 6,
  },
  buttons: {
    alignItems: 'center',
  },
});
