import { type ReactElement, useLayoutEffect, useRef, useState } from 'react';

type Props = {
  /** Cache key: the same key must always mean the same drawing. */
  id: string;
  size: number;
  /** The icon as a react-native-svg <Svg>, with a viewBox. */
  svg: ReactElement;
};

// Turns a vector icon into a real low-resolution bitmap, the way Windows 2000 icons were:
// the drawing is rasterized onto a 32x32 grid (16x16 for small icons), its edges are made
// fully opaque or fully transparent, and it's scaled up with hard pixel edges.

const ALPHA_CUTOFF = 128;
const cache = new Map<string, string>();
const pending = new Map<string, Promise<string>>();

/** The bitmap grid size for an icon shown at `size` CSS pixels (the UI runs at 2x). */
export function iconGrid(size: number): number {
  return size >= 48 ? 32 : 16;
}

function rasterize(svgEl: SVGSVGElement, grid: number): Promise<string> {
  const clone = svgEl.cloneNode(true) as SVGSVGElement;
  clone.setAttribute('xmlns', 'http://www.w3.org/2000/svg');
  clone.setAttribute('width', String(grid));
  clone.setAttribute('height', String(grid));
  clone.removeAttribute('style');
  const src = `data:image/svg+xml;charset=utf-8,${encodeURIComponent(new XMLSerializer().serializeToString(clone))}`;

  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => {
      const canvas = document.createElement('canvas');
      canvas.width = grid;
      canvas.height = grid;
      const ctx = canvas.getContext('2d', { willReadFrequently: true })!;
      ctx.drawImage(img, 0, 0, grid, grid);
      const data = ctx.getImageData(0, 0, grid, grid);
      const d = data.data;
      for (let i = 0; i < d.length; i += 4) {
        // getImageData colors aren't premultiplied, so edge pixels keep their true color.
        d[i + 3] = d[i + 3] >= ALPHA_CUTOFF ? 255 : 0;
      }
      ctx.putImageData(data, 0, 0);
      resolve(canvas.toDataURL());
    };
    img.onerror = reject;
    img.src = src;
  });
}

export default function PixelIcon({ id, size, svg }: Props) {
  const grid = iconGrid(size);
  const key = `${id}@${grid}`;
  const [url, setUrl] = useState(() => cache.get(key));
  const holder = useRef<HTMLDivElement>(null);

  useLayoutEffect(() => {
    const cached = cache.get(key);
    if (cached) {
      setUrl(cached);
      return;
    }
    let cancelled = false;
    let job = pending.get(key);
    if (!job) {
      const svgEl = holder.current?.querySelector('svg');
      if (!svgEl) return;
      job = rasterize(svgEl, grid).then((u) => {
        cache.set(key, u);
        pending.delete(key);
        return u;
      });
      pending.set(key, job);
    }
    job.then((u) => !cancelled && setUrl(u)).catch(() => {});
    return () => {
      cancelled = true;
    };
  }, [key, grid]);

  if (url) {
    return (
      <img
        src={url}
        alt=""
        draggable={false}
        style={{ width: size, height: size, imageRendering: 'pixelated', display: 'block', pointerEvents: 'none', flexShrink: 0 }}
      />
    );
  }
  // First time this icon is seen: render the vector once (invisibly) so it can be rasterized.
  return (
    <div ref={holder} style={{ width: size, height: size, opacity: 0, flexShrink: 0 }}>
      {svg}
    </div>
  );
}
