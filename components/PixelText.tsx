import { Text } from 'react-native';

import type { PixelTextProps } from './pixelTextStyle';

// Native fallback: plain text. The pixelated rendering lives in PixelText.web.tsx.
export default function PixelText({ text, style, accessibilityLabel }: PixelTextProps) {
  return (
    <Text style={style} accessibilityLabel={accessibilityLabel}>
      {text}
    </Text>
  );
}
