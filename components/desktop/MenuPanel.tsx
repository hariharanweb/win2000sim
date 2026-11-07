import { useState } from 'react';
import { Pressable, type StyleProp, StyleSheet, View, type ViewStyle } from 'react-native';

import { Icon, type IconName } from '../DesktopIcons';
import PixelText from '../PixelText';
import { MenuArrow, Separator, text, webCursor } from '../ui';
import { win } from '../Win2000Dialog';

export type MenuEntry =
  | {
      kind: 'item';
      label: string;
      icon?: IconName;
      onSelect?: () => void;
      submenu?: MenuEntry[];
      disabled?: boolean;
    }
  | { kind: 'separator' };

export const item = (
  label: string,
  icon: IconName | undefined,
  onSelect?: () => void,
  extra: { submenu?: MenuEntry[]; disabled?: boolean } = {},
): MenuEntry => ({ kind: 'item', label, icon, onSelect, ...extra });
export const separator: MenuEntry = { kind: 'separator' };

type Props = {
  entries: MenuEntry[];
  /** Called after a leaf item is chosen, so the whole menu can close. */
  onDone: () => void;
  /** 'large' is the top level of the Start menu; 'small' is everything else. */
  variant?: 'large' | 'small';
  /** Small menus without icons (like Notepad's) skip the icon column. */
  showIcons?: boolean;
  framed?: boolean;
  style?: StyleProp<ViewStyle>;
};

export default function MenuPanel({
  entries,
  onDone,
  variant = 'small',
  showIcons = true,
  framed = true,
  style,
}: Props) {
  const [hover, setHover] = useState<number | null>(null);
  const [open, setOpen] = useState<number | null>(null);
  const large = variant === 'large';

  return (
    <View style={[framed && styles.frame, styles.panel, style]}>
      {entries.map((entry, i) => {
        if (entry.kind === 'separator') {
          return <Separator key={`sep-${i}`} style={styles.separator} />;
        }
        const highlighted = hover === i || open === i;
        const hasSub = !!entry.submenu;
        const activate = () => {
          if (entry.disabled) return;
          if (hasSub) {
            setOpen(open === i ? null : i);
          } else {
            entry.onSelect?.();
            onDone();
          }
        };
        return (
          <View key={entry.label} style={open === i && styles.rowOpen}>
            <Pressable
              onHoverIn={() => {
                setHover(i);
                setOpen(hasSub && !entry.disabled ? i : null);
              }}
              onHoverOut={() => setHover((h) => (h === i ? null : h))}
              onPress={activate}
              style={[
                styles.row,
                large ? styles.rowLarge : styles.rowSmall,
                !showIcons && styles.rowNoIcon,
                highlighted && !entry.disabled && styles.rowHighlighted,
              ]}
            >
              {showIcons && (
                <View style={large ? styles.iconLarge : styles.iconSmall}>
                  {entry.icon && <Icon name={entry.icon} size={large ? 64 : 32} />}
                </View>
              )}
              <PixelText
                text={entry.label}
                style={[
                  entry.disabled ? text.disabled : text.ui,
                  highlighted && !entry.disabled && styles.textHighlighted,
                ]}
              />
              <View style={styles.spacer} />
              {hasSub && <MenuArrow color={highlighted ? '#fff' : '#000'} />}
            </Pressable>

            {open === i && entry.submenu && (
              <MenuPanel
                entries={entry.submenu.length ? entry.submenu : [EMPTY]}
                onDone={onDone}
                style={styles.submenu}
              />
            )}
          </View>
        );
      })}
    </View>
  );
}

const EMPTY: MenuEntry = { kind: 'item', label: '(Empty)', disabled: true };

const styles = StyleSheet.create({
  frame: {
    backgroundColor: win.face,
    padding: 3,
    ...win.raised,
  },
  panel: {
    minWidth: 240,
  },
  separator: {
    marginVertical: 4,
    marginHorizontal: 4,
    width: 'auto',
  },
  rowOpen: {
    zIndex: 10,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingRight: 12,
    ...webCursor('default'),
  },
  rowSmall: {
    height: 44,
    paddingLeft: 6,
  },
  rowLarge: {
    height: 66,
    paddingLeft: 8,
  },
  rowNoIcon: {
    paddingLeft: 30,
    height: 38,
  },
  rowHighlighted: {
    backgroundColor: '#0a246a',
  },
  textHighlighted: {
    color: '#fff',
  },
  iconSmall: {
    width: 32,
    marginRight: 14,
  },
  iconLarge: {
    width: 64,
    marginRight: 10,
  },
  spacer: {
    flex: 1,
    minWidth: 30,
  },
  submenu: {
    position: 'absolute',
    left: '100%',
    top: -3,
  },
});
