import { useEffect, useRef, useState } from "react";

export function RunnerGame() {
  const ref = useRef<HTMLCanvasElement>(null);
  const [over, setOver] = useState(false);
  const [score, setScore] = useState(0);
  const restartRef = useRef<() => void>(() => {});
  const jumpRef = useRef<() => void>(() => {});

  useEffect(() => {
    const c = ref.current!;
    const ctx = c.getContext("2d")!;
    const css = getComputedStyle(document.documentElement);
    const ink = css.getPropertyValue("--foreground");
    const coral = css.getPropertyValue("--primary");
    const sky = css.getPropertyValue("--sky");
    const line = css.getPropertyValue("--border");
    let w = 0; const h = 160; const ground = 130;
    let y = 0, vy = 0, obs: { x: number; w: number; h: number }[] = [];
    let speed = 5, t = 0, s = 0, dead = false, raf = 0, last = 0;

    const size = () => { const d = Math.min(devicePixelRatio || 1, 2); w = c.clientWidth; c.width = w * d; c.height = h * d; ctx.setTransform(d, 0, 0, d, 0, 0); };
    const reset = () => { y = 0; vy = 0; obs = []; speed = 5; t = 0; s = 0; dead = false; setOver(false); setScore(0); last = performance.now(); cancelAnimationFrame(raf); raf = requestAnimationFrame(loop); };
    const jump = () => { if (dead) return; if (y === 0) vy = 11; };
    restartRef.current = reset; jumpRef.current = jump;

    function loop(now: number) {
      const dt = Math.min((now - last) / 16.67, 3); last = now;
      t += dt; speed += 0.002 * dt; s += 0.15 * dt;
      vy -= 0.6 * dt; y = Math.max(0, y + vy * dt); if (y === 0) vy = Math.max(vy, 0);
      if (obs.length === 0 || obs[obs.length - 1].x < w - (220 + Math.random() * 260))
        if (Math.random() < 0.03) obs.push({ x: w + 20, w: 16 + Math.random() * 14, h: 20 + Math.random() * 22 });
      obs.forEach(o => (o.x -= speed * dt)); obs = obs.filter(o => o.x > -50);

      ctx.clearRect(0, 0, w, h);
      ctx.strokeStyle = line; ctx.lineWidth = 2; ctx.setLineDash([6, 8]); ctx.lineDashOffset = t * speed;
      ctx.beginPath(); ctx.moveTo(0, ground + 1); ctx.lineTo(w, ground + 1); ctx.stroke(); ctx.setLineDash([]);
      const px = 60, pw = 22, ph = 34, py = ground - ph - y;
      ctx.fillStyle = coral; ctx.beginPath(); ctx.roundRect(px, py, pw, ph, 11); ctx.fill();
      ctx.fillStyle = ink; ctx.beginPath(); ctx.arc(px + 15, py + 11, 2.5, 0, 7); ctx.fill();
      ctx.fillStyle = sky;
      for (const o of obs) {
        ctx.beginPath(); ctx.roundRect(o.x, ground - o.h, o.w, o.h, 5); ctx.fill();
        if (px + pw - 4 > o.x && px + 4 < o.x + o.w && py + ph > ground - o.h + 3) dead = true;
      }
      setScore(Math.floor(s));
      if (dead) { setOver(true); return; }
      raf = requestAnimationFrame(loop);
    }

    const key = (e: KeyboardEvent) => {
      if (e.code !== "Space") return;
      const r = c.getBoundingClientRect();
      if (r.top > innerHeight || r.bottom < 0) return;
      e.preventDefault(); dead ? reset() : jump();
    };
    size(); addEventListener("resize", size); addEventListener("keydown", key);
    const io = new IntersectionObserver(([en]) => { if (en.isIntersecting && t === 0) reset(); });
    io.observe(c);
    return () => { cancelAnimationFrame(raf); removeEventListener("resize", size); removeEventListener("keydown", key); io.disconnect(); };
  }, []);

  return (
    <div className="relative select-none rounded-3xl border bg-card p-4 shadow-soft">
      <div className="flex items-center justify-between px-2 text-sm font-semibold text-muted-foreground">
        <span>Press SPACE or tap to jump</span>
        <span className="font-display text-lg text-foreground tabular-nums">{String(score).padStart(5, "0")}</span>
      </div>
      <canvas ref={ref} onPointerDown={() => jumpRef.current()} aria-label="Endless runner mini game" className="mt-2 h-[160px] w-full cursor-pointer touch-none" />
      {over && (
        <div className="absolute inset-0 grid place-items-center rounded-3xl bg-background/80 backdrop-blur-sm">
          <div className="text-center animate-scale-in">
            <p className="font-display text-3xl font-bold">Oops! Score {score}</p>
            <button onClick={() => restartRef.current()} className="mt-4 rounded-full bg-primary px-6 py-2.5 font-semibold text-primary-foreground transition-transform hover:scale-105">Retry ↻</button>
          </div>
        </div>
      )}
    </div>
  );
}
