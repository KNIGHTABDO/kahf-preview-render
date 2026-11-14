import React, {useEffect, useLayoutEffect, useRef, useState} from 'react';
import {continueRender, delayRender, staticFile} from 'remotion';

// 2.5D parallax from a still + depth map (white = near). Each frame is warped on a canvas:
// out(x,y) = src(x - dx*(d-0.5), y - dy*(d-0.5)), bilinear. Deterministic, so shards render identically.
const W = 1920, H = 1080;
type Px = {rgb: Uint8ClampedArray; dep: Float32Array};
const cache = new Map<string, Promise<Px>>();

const loadImg = (src: string) => new Promise<HTMLImageElement>((res, rej) => {
  const im = new Image();
  im.onload = () => res(im); im.onerror = () => rej(new Error('load ' + src)); im.src = src;
});

const load = (src: string, depth: string): Promise<Px> => {
  const key = src + '|' + depth;
  if (!cache.has(key)) {
    cache.set(key, Promise.all([loadImg(staticFile(src)), loadImg(staticFile(depth))]).then(([a, b]) => {
      const c = document.createElement('canvas'); c.width = W; c.height = H;
      const x = c.getContext('2d', {willReadFrequently: true})!;
      x.drawImage(a, 0, 0, W, H); const rgb = x.getImageData(0, 0, W, H).data;
      x.clearRect(0, 0, W, H); x.drawImage(b, 0, 0, W, H); const d = x.getImageData(0, 0, W, H).data;
      const dep = new Float32Array(W * H);
      for (let i = 0; i < W * H; i++) dep[i] = d[i * 4] / 255 - 0.5;
      return {rgb, dep};
    }));
  }
  return cache.get(key)!;
};

export const ParallaxStill: React.FC<{src: string; depth: string; dx: number; dy: number}> = ({src, depth, dx, dy}) => {
  const ref = useRef<HTMLCanvasElement>(null);
  const [px, setPx] = useState<Px | null>(null);
  const [handle] = useState(() => delayRender('parallax ' + src));
  useEffect(() => {
    load(src, depth).then(setPx);
  }, [src, depth]);
  const done = useRef(false);
  useLayoutEffect(() => {
    if (!px || !ref.current) return;
    const ctx = ref.current.getContext('2d')!;
    const out = ctx.createImageData(W, H); const o = out.data; const {rgb, dep} = px;
    for (let y = 0; y < H; y++) {
      for (let x = 0; x < W; x++) {
        const i = y * W + x; const d = dep[i];
        let sx = x - dx * d, sy = y - dy * d;
        if (sx < 0) sx = 0; else if (sx > W - 1.001) sx = W - 1.001;
        if (sy < 0) sy = 0; else if (sy > H - 1.001) sy = H - 1.001;
        const x0 = sx | 0, y0 = sy | 0, fx = sx - x0, fy = sy - y0;
        const a = (y0 * W + x0) * 4, b = a + 4, c = a + W * 4, e = c + 4, j = i * 4;
        const w00 = (1 - fx) * (1 - fy), w10 = fx * (1 - fy), w01 = (1 - fx) * fy, w11 = fx * fy;
        o[j] = rgb[a] * w00 + rgb[b] * w10 + rgb[c] * w01 + rgb[e] * w11;
        o[j + 1] = rgb[a + 1] * w00 + rgb[b + 1] * w10 + rgb[c + 1] * w01 + rgb[e + 1] * w11;
        o[j + 2] = rgb[a + 2] * w00 + rgb[b + 2] * w10 + rgb[c + 2] * w01 + rgb[e + 2] * w11;
        o[j + 3] = 255;
      }
    }
    ctx.putImageData(out, 0, 0);
    if (!done.current) { done.current = true; continueRender(handle); }
  }, [px, dx, dy, handle]);
  return <canvas ref={ref} width={W} height={H} style={{width: '100%', height: '100%'}} />;
};
