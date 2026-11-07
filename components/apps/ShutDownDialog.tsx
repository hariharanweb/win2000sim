import { useState } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';

import { Icon } from '../DesktopIcons';
import { type AppProps, type PowerAction, useDesktop } from '../desktop/types';
import PixelText from '../PixelText';
import { useSystem } from '../system';
import { ClassicButton, DownArrow, Lines, T, text } from '../ui';
import { Win2000Banner, win } from '../Win2000Dialog';

export default function ShutDownDialog({ windowId }: AppProps) {
  const { closeWindow, power, openApp } = useDesktop();
  const { settings } = useSystem();
  const [choice, setChoice] = useState<PowerAction>('shutdown');
  const [open, setOpen] = useState(false);

  const OPTIONS: { id: PowerAction; label: string; lines: string[] }[] = [
    {
      id: 'logoff',
      label: `Log off ${settings.userName}`,
      lines: ['Ends your session, leaving the computer', 'running on full power.'],
    },
    {
      id: 'shutdown',
      label: 'Shut down',
      lines: ['Ends your session and shuts down Windows so', 'that you can safely turn off power.'],
    },
    {
      id: 'restart',
      label: 'Restart',
      lines: ['Ends your session, shuts down Windows, and', 'starts Windows again.'],
    },
  ];
  const current = OPTIONS.find((o) => o.id === choice)!;

  return (
    <View style={styles.root}>
      <Win2000Banner />
      <View style={styles.body}>
        <View style={styles.question}>
          <Icon name="shutdown" size={64} />
          <View style={styles.right}>
            <T>What do you want the computer to do?</T>
            <View style={styles.dropdownWrap}>
              <Pressable style={styles.dropdown} onPress={() => setOpen(!open)}>
                <View style={styles.dropdownValue}>
                  <PixelText text={current.label} style={text.ui} />
                </View>
                <View style={styles.dropdownButton}>
                  <DownArrow />
                </View>
              </Pressable>
              {open && (
                <View style={styles.dropdownList}>
                  {OPTIONS.map((o) => (
                    <Pressable
                      key={o.id}
                      style={({ hovered }: { pressed: boolean; hovered?: boolean }) => [
                        styles.option,
                        (hovered || o.id === choice) && styles.optionSel,
                      ]}
                      onPress={() => {
                        setChoice(o.id);
                        setOpen(false);
                      }}
                    >
                      {({ hovered }: { pressed: boolean; hovered?: boolean }) => (
                        <PixelText text={o.label}
                          style={[text.ui, (hovered || o.id === choice) && { color: '#fff' }]} />
                      )}
                    </Pressable>
                  ))}
                </View>
              )}
            </View>
            <Lines lines={current.lines} />
          </View>
        </View>
        <View style={styles.buttons}>
          <ClassicButton label="OK" isDefault onPress={() => power(choice)} width={120} />
          <ClassicButton label="Cancel" onPress={() => closeWindow(windowId)} width={120} />
          <ClassicButton label="Help" onPress={() => openApp('help')} width={120} />
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
    padding: 16,
    justifyContent: 'space-between',
  },
  question: {
    flexDirection: 'row',
    gap: 16,
  },
  right: {
    flex: 1,
    gap: 10,
  },
  dropdownWrap: {
    zIndex: 10,
  },
  dropdown: {
    height: 40,
    flexDirection: 'row',
    backgroundColor: '#fff',
    ...win.sunken,
  },
  dropdownValue: {
    flex: 1,
    justifyContent: 'center',
    paddingHorizontal: 6,
  },
  dropdownButton: {
    width: 32,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: win.face,
    ...win.raised,
  },
  dropdownList: {
    position: 'absolute',
    top: 40,
    left: 0,
    right: 0,
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#000',
  },
  option: {
    height: 34,
    justifyContent: 'center',
    paddingHorizontal: 6,
  },
  optionSel: {
    backgroundColor: '#0a246a',
  },
  buttons: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 10,
  },
});
