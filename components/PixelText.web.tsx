import { useEffect, useRef } from 'react';
import { View } from 'react-native';

import { splitTextStyle, type PixelTextProps } from './pixelTextStyle';

// Renders a single line of text onto a canvas.
// By default it draws at the display's full device resolution, so text is crisp and
// smooth like the real thing on a sharp screen. Pass `pixel` (e.g. 2) to get the old
// chunky look: drawn at low resolution, hard-thresholded, and scaled up nearest-neighbor.

const ALPHA_CUTOFF = 100; // canvas alpha (0-255) above which a pixel counts as ink (pixelated mode)

export default function PixelText({ text, style, pixel, accessibilityLabel }: PixelTextProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const { text: t, layout } = splitTextStyle(style);

  const pixelated = pixel !== undefined && pixel >= 1;
  // Canvas pixels per CSS pixel.
  const scale = pixelated
    ? 1 / pixel
    : typeof window !== 'undefined'
      ? Math.max(1, window.devicePixelRatio || 1)
      : 1;

  const fontSize = t.fontSize * scale;
  // Like CSS: an explicit lineHeight sets the box height; otherwise use the font's own height.
  const lineHeight = t.lineHeight !== undefined ? t.lineHeight * scale : undefined;
  const font = `${t.fontStyle} ${t.fontWeight} ${fontSize}px ${t.fontFamily}`;
  const letterSpacing = t.letterSpacing * scale;

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    let cancelled = false;

    const draw = () => {
      if (cancelled) return;
      const ctx = canvas.getContext('2d', { willReadFrequently: pixelated });
      if (!ctx) return;

      ctx.font = font;
      setLetterSpacing(ctx, letterSpacing);
      const metrics = ctx.measureText(text || ' ');
      const ascent = metrics.fontBoundingBoxAscent ?? fontSize * 0.8;
      const descent = metrics.fontBoundingBoxDescent ?? fontSize * 0.2;
      // Italic/heavy glyphs can overhang their advance width; leave room so nothing is clipped.
      const overhang = Math.ceil(fontSize * 0.15);
      const w = Math.max(1, Math.ceil(metrics.width) + overhang);
      const h = Math.max(1, Math.ceil(lineHeight ?? ascent + descent));

      canvas.width = w;
      canvas.height = h;
      canvas.style.width = `${w / scale}px`;
      canvas.style.height = `${h / scale}px`;

      // Resizing resets context state, so set it again.
      ctx.font = font;
      setLetterSpacing(ctx, letterSpacing);
      ctx.fillStyle = t.color;
      ctx.textBaseline = 'alphabetic';
      const y = Math.round((h - (ascent + descent)) / 2 + ascent);
      ctx.clearRect(0, 0, w, h);
      ctx.fillText(text, 0, y);

      if (pixelated) {
        // Snap every pixel to fully on or fully off.
        const img = ctx.getImageData(0, 0, w, h);
        const d = img.data;
        for (let i = 3; i < d.length; i += 4) d[i] = d[i] >= ALPHA_CUTOFF ? 255 : 0;
        ctx.putImageData(img, 0, 0);
      }
    };

    draw();
    // Redraw once web fonts finish loading so the right typeface is used.
    document.fonts?.ready.then(draw);
    return () => {
      cancelled = true;
    };
  }, [text, font, letterSpacing, lineHeight, fontSize, scale, pixelated, t.color]);

  return (
    <View style={layout}>
      <canvas
        ref={canvasRef}
        role="img"
        aria-label={accessibilityLabel ?? text}
        style={{ display: 'block', imageRendering: pixelated ? 'pixelated' : 'auto' }}
      />
    </View>
  );
}

function setLetterSpacing(ctx: CanvasRenderingContext2D, px: number) {
  // Canvas letterSpacing isn't in every browser; skip it where unsupported.
  if ('letterSpacing' in ctx) {
    (ctx as CanvasRenderingContext2D & { letterSpacing: string }).letterSpacing = `${px}px`;
  }
}
