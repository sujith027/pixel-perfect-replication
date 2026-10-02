import { useEffect, useRef } from "react";

type P = { x: number; y: number; ox: number; oy: number; vx: number; vy: number; c: string };

export function ParticleText({ text }: { text: string }) {
  const ref = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = ref.current!;
    const ctx = canvas.getContext("2d")!;
    const css = getComputedStyle(document.documentElement);
    const palette = [css.getPropertyValue("--foreground"), css.getPropertyValue("--foreground"), css.getPropertyValue("--primary"), css.getPropertyValue("--sky")];
    let parts: P[] = [];
    let raf = 0;
    const mouse = { x: -9999, y: -9999 };
    let w = 0, h = 0, dpr = 1;

    const build = () => {
      dpr = Math.min(window.devicePixelRatio || 1, 2);
      w = canvas.clientWidth; h = canvas.clientHeight;
      canvas.width = w * dpr; canvas.height = h * dpr;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      const off = document.createElement("canvas");
      off.width = w; off.height = h;
      const o = off.getContext("2d")!;
      const lines = w < 700 ? text.split(" ").length > 1 ? ["UI/UX", "DESIGNER"] : [text] : [text];
      let size = Math.min(w / (lines[0].length > 6 ? 6.2 : 4.2), h / (lines.length * 1.1));
      if (lines.length === 1) size = Math.min(w / 7, h * 0.7);
      o.font = `800 ${size}px "Bricolage Grotesque", sans-serif`;
      o.textAlign = "center"; o.textBaseline = "middle"; o.fillStyle = "#000";
      lines.forEach((l, i) => o.fillText(l, w / 2, h / 2 + (i - (lines.length - 1) / 2) * size * 1.0));
      const data = o.getImageData(0, 0, w, h).data;
      const gap = w < 700 ? 4 : 5;
      parts = [];
      for (let y = 0; y < h; y += gap)
        for (let x = 0; x < w; x += gap)
          if ((data[(y * w + x) * 4 + 3] ?? 0) > 128)
            parts.push({ x: Math.random() * w, y: Math.random() * h, ox: x, oy: y, vx: 0, vy: 0, c: palette[(Math.random() * palette.length) | 0] ?? "#222" });
    };

    const tick = () => {
      ctx.clearRect(0, 0, w, h);
      const R = w < 700 ? 60 : 90;
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
        ctx.fillStyle = p.c;
        ctx.fillRect(p.x, p.y, 2.4, 2.4);
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

    document.fonts.ready.then(() => { build(); tick(); });
    const ro = new ResizeObserver(() => build());
    ro.observe(canvas);
    canvas.addEventListener("mousemove", onMouse);
    canvas.addEventListener("mouseleave", leave);
    canvas.addEventListener("touchmove", onTouch, { passive: true });
    canvas.addEventListener("touchend", leave);
    return () => {
      cancelAnimationFrame(raf); ro.disconnect();
      canvas.removeEventListener("mousemove", onMouse);
      canvas.removeEventListener("mouseleave", leave);
      canvas.removeEventListener("touchmove", onTouch);
      canvas.removeEventListener("touchend", leave);
    };
  }, [text]);

  return <canvas ref={ref} role="img" aria-label={text} className="h-full w-full" />;
}
