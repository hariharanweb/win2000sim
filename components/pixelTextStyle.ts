import { StyleSheet, type StyleProp, type TextStyle, type ViewStyle } from 'react-native';

export type PixelTextProps = {
  text: string;
  style?: StyleProp<TextStyle>;
  /** Size of one "screen pixel" in real pixels. */
  pixel?: number;
  accessibilityLabel?: string;
};

export type ResolvedTextStyle = {
  fontSize: number;
  fontFamily: string;
  fontWeight: string;
  fontStyle: string;
  color: string;
  letterSpacing: number;
  lineHeight?: number;
};

const TEXT_KEYS = new Set([
  'fontSize', 'fontFamily', 'fontWeight', 'fontStyle', 'color', 'letterSpacing', 'lineHeight',
  'textAlign', 'textDecorationLine', 'textTransform',
]);

// Separates the font settings (used to draw the text) from layout settings
// (margins, positioning, alignment) that apply to the wrapper view.
export function splitTextStyle(style: StyleProp<TextStyle>): {
  text: ResolvedTextStyle;
  layout: ViewStyle;
} {
  const flat = (StyleSheet.flatten(style) ?? {}) as TextStyle & Record<string, unknown>;
  const layout: Record<string, unknown> = {};
  for (const [k, v] of Object.entries(flat)) {
    if (!TEXT_KEYS.has(k)) layout[k] = v;
  }
  return {
    text: {
      fontSize: flat.fontSize ?? 14,
      fontFamily: flat.fontFamily ?? 'sans-serif',
      fontWeight: String(flat.fontWeight ?? 'normal'),
      fontStyle: flat.fontStyle ?? 'normal',
      color: typeof flat.color === 'string' ? flat.color : '#000',
      letterSpacing: flat.letterSpacing ?? 0,
      lineHeight: flat.lineHeight,
    },
    layout: layout as ViewStyle,
  };
}
