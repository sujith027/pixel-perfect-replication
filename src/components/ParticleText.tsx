import { useEffect, useRef } from "react";

type P = { x: number; y: number; ox: number; oy: number; vx: number; vy: number; size: number };

export function ParticleText({ text, src }: { text: string; src?: string }) {
  const ref = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = ref.current;
    const ctx = canvas?.getContext("2d");
    if (!canvas || !ctx) return;
    let parts: P[] = [];
    let raf = 0;
    const mouse = { x: -9999, y: -9999 };
    let w = 0, h = 0, dpr = 1;
    let img: HTMLImageElement | null = null;

    const build = () => {
      dpr = Math.min(window.devicePixelRatio || 1, 2);
      w = canvas.clientWidth; h = canvas.clientHeight;
      if (!w || !h) return;
      canvas.width = w * dpr; canvas.height = h * dpr;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      const off = document.createElement("canvas");
      off.width = w; off.height = h;
      const o = off.getContext("2d");
      if (!o) return;
      if (img) {
        const iw = img.naturalWidth || 1174, ih = img.naturalHeight || 201;
        const s = Math.min((w * 0.9) / iw, (h * 0.8) / ih);
        o.drawImage(img, (w - iw * s) / 2, (h - ih * s) / 2, iw * s, ih * s);
      } else {
        const lines = w < 700 && text.includes(" ") ? text.split(" ") : [text];
        const size = lines.length > 1 ? Math.min(w / 6.2, h / (lines.length * 1.1)) : Math.min(w / 8.6, h * 0.7);
        o.font = `800 ${size}px "Bricolage Grotesque", sans-serif`;
        o.textAlign = "center"; o.textBaseline = "middle"; o.fillStyle = "currentColor";
        lines.forEach((l, i) => o.fillText(l, w / 2, h / 2 + (i - (lines.length - 1) / 2) * size));
      }
      const data = o.getImageData(0, 0, w, h).data;
      const gap = w < 700 ? 4 : 5;
      parts = [];
      for (let y = 0; y < h; y += gap)
        for (let x = 0; x < w; x += gap)
          if ((data[(y * w + x) * 4 + 3] ?? 0) > 128) {
            const left = data[(y * w + Math.max(0, x - gap)) * 4 + 3] ?? 0;
            const right = data[(y * w + Math.min(w - 1, x + gap)) * 4 + 3] ?? 0;
            const top = data[(Math.max(0, y - gap) * w + x) * 4 + 3] ?? 0;
            const bottom = data[(Math.min(h - 1, y + gap) * w + x) * 4 + 3] ?? 0;
            const edge = left < 128 || right < 128 || top < 128 || bottom < 128;
            if (!edge && ((x / gap + y / gap) % 2 !== 0)) continue;
            const layer = Math.abs((x * 7 + y * 11) % 3);
            parts.push({ x: Math.random() * w, y: Math.random() * h, ox: x, oy: y, vx: 0, vy: 0, size: [3.8, 4.6, 5.4][layer] ?? 4.6 });
          }
    };

    const tick = () => {
      ctx.clearRect(0, 0, w, h);
      const css = getComputedStyle(document.documentElement);
      ctx.fillStyle = css.getPropertyValue("--particle").trim();
      ctx.shadowColor = css.getPropertyValue("--particle-shadow").trim();
      ctx.shadowBlur = 3;
      const R = w < 700 ? 52 : 72;
      for (const p of parts) {
        const dx = p.x - mouse.x, dy = p.y - mouse.y;
        const d2 = dx * dx + dy * dy;
        if (d2 < R * R) {
          const d = Math.sqrt(d2) || 1;
          const f = (1 - d / R) * 6;
          p.vx += (dx / d) * f; p.vy += (dy / d) * f;
        }
        p.vx += (p.ox - p.x) * 0.06; p.vy += (p.oy - p.y) * 0.06;
        p.vx *= 0.82; p.vy *= 0.82;
        p.x += p.vx; p.y += p.vy;
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.size / 2, 0, Math.PI * 2);
        ctx.fill();
      }
      raf = requestAnimationFrame(tick);
    };

    const move = (x: number, y: number) => {
      const r = canvas.getBoundingClientRect();
      mouse.x = x - r.left; mouse.y = y - r.top;
    };
    const onMouse = (e: MouseEvent) => move(e.clientX, e.clientY);
    const onTouch = (e: TouchEvent) => e.touches[0] && move(e.touches[0].clientX, e.touches[0].clientY);
    const leave = () => { mouse.x = mouse.y = -9999; };

    const start = () => { build(); tick(); };
    if (src) {
      const i = new Image();
      i.onload = () => { img = i; start(); };
      i.onerror = () => document.fonts.ready.then(start);
      i.src = src;
    } else document.fonts.ready.then(start);
    const ro = new ResizeObserver(() => build());
    ro.observe(canvas);
    const themeObserver = new MutationObserver(() => build());
    themeObserver.observe(document.documentElement, { attributes: true, attributeFilter: ["class"] });
    canvas.addEventListener("mousemove", onMouse);
    canvas.addEventListener("mouseleave", leave);
    canvas.addEventListener("touchmove", onTouch, { passive: true });
    canvas.addEventListener("touchend", leave);
    return () => {
      cancelAnimationFrame(raf); ro.disconnect(); themeObserver.disconnect();
      canvas.removeEventListener("mousemove", onMouse);
      canvas.removeEventListener("mouseleave", leave);
      canvas.removeEventListener("touchmove", onTouch);
      canvas.removeEventListener("touchend", leave);
    };
  }, [text, src]);

  return <canvas ref={ref} role="img" aria-label={text} className="h-full w-full" />;
}
