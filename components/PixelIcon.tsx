import type { ReactElement } from 'react';

type Props = {
  /** Cache key: the same key must always mean the same drawing. */
  id: string;
  size: number;
  /** The icon as a react-native-svg <Svg>, with a viewBox. */
  svg: ReactElement;
};

// Native fallback: draw the vector icon directly. The bitmap version lives in PixelIcon.web.tsx.
export default function PixelIcon({ svg }: Props) {
  return svg;
}
