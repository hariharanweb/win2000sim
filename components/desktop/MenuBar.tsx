import { useState } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';

import { T } from '../ui';
import { win } from '../Win2000Dialog';
import MenuPanel, { type MenuEntry } from './MenuPanel';

/** A classic window menu bar (File, Edit, ...) with drop-down menus. */
export default function MenuBar({ menus }: { menus: Record<string, MenuEntry[]> }) {
  const [open, setOpen] = useState<string | null>(null);
  return (
    <View style={styles.bar}>
      {Object.keys(menus).map((name) => (
        <View key={name} style={open === name && styles.open}>
          <Pressable
            onPress={() => setOpen(open === name ? null : name)}
            onHoverIn={() => open && setOpen(name)}
            style={[styles.title, open === name && win.sunken]}
          >
            <T>{name}</T>
          </Pressable>
          {open === name && (
            <MenuPanel entries={menus[name]} onDone={() => setOpen(null)} showIcons={false} style={styles.dropdown} />
          )}
        </View>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  bar: {
    flexDirection: 'row',
    height: 36,
    alignItems: 'center',
    zIndex: 10,
  },
  open: {
    zIndex: 10,
  },
  title: {
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
});
