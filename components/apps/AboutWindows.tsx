import { StyleSheet, View } from 'react-native';

import { type AppProps, useDesktop } from '../desktop/types';
import { useSystem } from '../system';
import { ClassicButton, Lines, Separator } from '../ui';
import { Win2000Banner } from '../Win2000Dialog';

export default function AboutWindows({ windowId }: AppProps) {
  const { closeWindow } = useDesktop();
  const { settings } = useSystem();
  return (
    <View style={styles.root}>
      <Win2000Banner />
      <View style={styles.body}>
        <Lines lines={[
          'Microsoft (R) Windows',
          'Version 5.0 (Build 2195: Service Pack 4)',
          'Copyright (C) 1981-1999 Microsoft Corp.',
          '',
          'This product is licensed to:',
          `    ${settings.userName}`,
        ]} />
        <Separator />
        <Lines lines={['Physical memory available to Windows:  262,144 KB']} />
        <View style={styles.buttons}>
          <ClassicButton label="OK" isDefault autoFocus onPress={() => closeWindow(windowId)} width={120} />
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
  },
  body: {
    flex: 1,
    padding: 18,
    gap: 12,
  },
  buttons: {
    flex: 1,
    justifyContent: 'flex-end',
    alignItems: 'flex-end',
  },
});
