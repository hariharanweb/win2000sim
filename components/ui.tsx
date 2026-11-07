import { type ComponentRef, type ReactNode, type Ref, useEffect, useState } from 'react';
import {
  Platform,
  Pressable,
  type StyleProp,
  StyleSheet,
  TextInput,
  type TextInputProps,
  type TextStyle,
  View,
  type ViewStyle,
} from 'react-native';
import Svg, { Polygon } from 'react-native-svg';

import PixelText from './PixelText';
import { uiFont, win } from './Win2000Dialog';

// Shared classic Windows controls, all drawn with pixel text.

export const text = StyleSheet.create({
  ui: { fontFamily: uiFont, fontSize: 22, color: '#000' },
  bold: { fontFamily: uiFont, fontSize: 22, color: '#000', fontWeight: 'bold' },
  white: { fontFamily: uiFont, fontSize: 22, color: '#fff' },
  disabled: { fontFamily: uiFont, fontSize: 22, color: '#808080' },
  mono: {
    fontFamily: Platform.select({ web: '"Lucida Console", Monaco, monospace', default: 'monospace' }),
    fontSize: 20,
    color: '#c0c0c0',
  },
});

/** One line of UI text. */
export function T({ children, style }: { children: string; style?: StyleProp<TextStyle> }) {
  return <PixelText text={children} style={[text.ui, style]} />;
}

/** Several pre-broken lines of UI text. */
export function Lines({ lines, style, gap = 4 }: { lines: string[]; style?: StyleProp<TextStyle>; gap?: number }) {
  return (
    <View style={{ gap }}>
      {lines.map((line, i) => (
        <PixelText key={i} text={line || ' '} style={[text.ui, style]} />
      ))}
    </View>
  );
}

type ButtonProps = {
  label: string;
  onPress: () => void;
  isDefault?: boolean; // default button gets a black outline
  disabled?: boolean;
  autoFocus?: boolean;
  width?: number;
  labelStyle?: StyleProp<TextStyle>;
  style?: StyleProp<ViewStyle>;
};

export function ClassicButton({
  label,
  onPress,
  isDefault,
  disabled,
  autoFocus,
  width = 150,
  labelStyle,
  style,
}: ButtonProps) {
  return (
    <View style={[styles.buttonOuter, isDefault && styles.buttonDefault, style]}>
      <Pressable
        onPress={onPress}
        disabled={disabled}
        // RN-web forwards autoFocus to the element so Enter/Space work on it.
        {...(Platform.OS === 'web' && autoFocus ? { autoFocus: true } : {})}
        style={({ pressed }) => [
          styles.button,
          { width },
          pressed && !disabled ? win.sunken : win.raised,
        ]}
      >
        <PixelText text={label} style={[disabled ? text.disabled : text.ui, labelStyle]} />
      </Pressable>
    </View>
  );
}

type PixelInputProps = Omit<TextInputProps, 'style' | 'secureTextEntry'> & {
  value: string;
  mask?: boolean; // show * per character, like a Windows password box
  inputRef?: Ref<ComponentRef<typeof TextInput>>;
  style?: StyleProp<ViewStyle>;
};

/**
 * A text box whose contents are drawn as pixel text. The real TextInput sits on top,
 * transparent, so typing, focus and selection still work normally.
 */
export function PixelInput({ value, mask, inputRef, onFocus, onBlur, style, ...rest }: PixelInputProps) {
  const [focused, setFocused] = useState(false);
  const [caretOn, setCaretOn] = useState(true);

  // Blink the caret; restart it solid whenever the text changes.
  useEffect(() => {
    if (!focused) return;
    setCaretOn(true);
    const id = setInterval(() => setCaretOn((on) => !on), 530);
    return () => clearInterval(id);
  }, [focused, value]);

  return (
    <View style={[styles.inputBox, style]}>
      <View style={styles.inputOverlay}>
        <PixelText text={mask ? '*'.repeat(value.length) : value} style={text.ui} />
        {focused && caretOn && <View style={styles.caret} />}
      </View>
      <TextInput
        ref={inputRef}
        {...rest}
        value={value}
        secureTextEntry={mask}
        style={styles.inputNative}
        onFocus={(e) => {
          setFocused(true);
          onFocus?.(e);
        }}
        onBlur={(e) => {
          setFocused(false);
          onBlur?.(e);
        }}
      />
    </View>
  );
}

export function Checkbox({
  label,
  checked,
  onChange,
  disabled,
}: {
  label: string;
  checked: boolean;
  onChange: (v: boolean) => void;
  disabled?: boolean;
}) {
  return (
    <Pressable
      style={styles.checkRow}
      onPress={() => !disabled && onChange(!checked)}
      disabled={disabled}
    >
      <View style={[styles.checkBox, disabled && { backgroundColor: win.face }]}>
        {checked && <PixelText text="✓" style={[text.bold, { fontSize: 20, lineHeight: 22 }]} />}
      </View>
      <PixelText text={label} style={disabled ? text.disabled : text.ui} />
    </Pressable>
  );
}

/** Etched horizontal divider. */
export function Separator({ style }: { style?: StyleProp<ViewStyle> }) {
  return (
    <View style={[styles.separator, style]}>
      <View style={styles.separatorDark} />
      <View style={styles.separatorLight} />
    </View>
  );
}

/** Sunken white panel, like a list box or the area inside an Explorer window. */
export function SunkenPanel({ children, style }: { children?: ReactNode; style?: StyleProp<ViewStyle> }) {
  return <View style={[styles.sunkenPanel, style]}>{children}</View>;
}

/** Small black ▶ used on menu items with submenus. */
export function MenuArrow({ color = '#000' }: { color?: string }) {
  return (
    <Svg width={10} height={16} viewBox="0 0 5 8">
      <Polygon points="0,0 4,4 0,8" fill={color} />
    </Svg>
  );
}

/** Small black ▼ used on drop-down boxes. */
export function DownArrow() {
  return (
    <Svg width={16} height={10} viewBox="0 0 8 5">
      <Polygon points="0,0 8,0 4,4" fill="#000" />
    </Svg>
  );
}

/** Web-only mouse cursor (React Native's types only allow 'auto' and 'pointer'). */
export const webCursor = (cursor: string): object => (Platform.OS === 'web' ? { cursor } : {});

const webNoOutline = Platform.OS === 'web' ? ({ outlineStyle: 'none' } as object) : {};

const styles = StyleSheet.create({
  buttonOuter: {
    borderWidth: 1,
    borderColor: 'transparent',
  },
  buttonDefault: {
    borderColor: '#000',
  },
  button: {
    height: 44,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: win.face,
    ...webNoOutline,
  },
  inputBox: {
    height: 40,
    backgroundColor: '#fff',
    ...win.sunken,
  },
  inputOverlay: {
    ...StyleSheet.absoluteFill,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 6,
    pointerEvents: 'none',
    overflow: 'hidden',
  },
  caret: {
    width: 2,
    height: 24,
    marginLeft: 1,
    backgroundColor: '#000',
  },
  inputNative: {
    ...StyleSheet.absoluteFill,
    paddingHorizontal: 6,
    fontFamily: uiFont,
    fontSize: 22,
    color: 'transparent',
    backgroundColor: 'transparent',
    borderWidth: 0,
    ...webNoOutline,
    ...(Platform.OS === 'web' ? ({ caretColor: 'transparent' } as object) : {}),
  },
  checkRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  checkBox: {
    width: 26,
    height: 26,
    backgroundColor: '#fff',
    justifyContent: 'center',
    alignItems: 'center',
    ...win.sunken,
  },
  separator: {
    alignSelf: 'stretch',
  },
  separatorDark: {
    height: 2,
    backgroundColor: '#808080',
  },
  separatorLight: {
    height: 2,
    backgroundColor: '#fff',
  },
  sunkenPanel: {
    backgroundColor: '#fff',
    ...win.sunken,
  },
});
