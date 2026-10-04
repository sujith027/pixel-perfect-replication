import { useEffect, useRef, useState, type FormEvent } from "react";
import { Play, Save, Trophy } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";

type LeaderboardEntry = { name: string; score: number };

const LEADERBOARD_KEY = "runner-leaderboard-v1";
const LEADERBOARD_LIMIT = 6;

function isLeaderboardEntry(value: unknown): value is LeaderboardEntry {
  if (typeof value !== "object" || value === null) return false;
  const entry = value as Record<string, unknown>;
  return typeof entry.name === "string" && typeof entry.score === "number" && Number.isFinite(entry.score);
}

export function RunnerGame() {
  const ref = useRef<HTMLCanvasElement>(null);
  const [over, setOver] = useState(false);
  const [score, setScore] = useState(0);
  const [started, setStarted] = useState(false);
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([]);
  const [leaderboardOpen, setLeaderboardOpen] = useState(false);
  const [playerName, setPlayerName] = useState("");
  const [scoreSaved, setScoreSaved] = useState(false);
  const startedRef = useRef(false);
  const restartRef = useRef<() => void>(() => {});
  const jumpRef = useRef<() => void>(() => {});

  useEffect(() => {
    try {
      const stored = window.localStorage.getItem(LEADERBOARD_KEY);
      if (!stored) return;
      const parsed: unknown = JSON.parse(stored);
      if (!Array.isArray(parsed)) return;
      const entries = parsed
        .filter(isLeaderboardEntry)
        .map(({ name, score }) => ({ name: name.trim().slice(0, 24), score: Math.floor(score) }))
        .filter(({ name, score }) => name.length > 0 && score >= 0)
        .sort((left, right) => right.score - left.score)
        .slice(0, LEADERBOARD_LIMIT);
      setLeaderboard(entries);
    } catch {
      setLeaderboard([]);
    }
  }, []);

  useEffect(() => {
    const c = ref.current!;
    const ctx = c.getContext("2d")!;
    let w = 0; const h = 160; const ground = 130;
    let y = 0, vy = 0, obs: { x: number; w: number; h: number }[] = [];
    let speed = 5, t = 0, s = 0, dead = false, raf = 0, last = 0;

    const size = () => { const d = Math.min(devicePixelRatio || 1, 2); w = c.clientWidth; c.width = w * d; c.height = h * d; ctx.setTransform(d, 0, 0, d, 0, 0); };
    const reset = () => { y = 0; vy = 0; obs = []; speed = 5; t = 0; s = 0; dead = false; startedRef.current = true; setStarted(true); setOver(false); setScore(0); setPlayerName(""); setScoreSaved(false); last = performance.now(); cancelAnimationFrame(raf); raf = requestAnimationFrame(loop); };
    const jump = () => { if (!startedRef.current || dead) return; if (y === 0) vy = 11; };
    restartRef.current = reset; jumpRef.current = jump;

    function loop(now: number) {
      const css = getComputedStyle(document.documentElement);
      const ink = css.getPropertyValue("--foreground");
      const coral = css.getPropertyValue("--primary");
      const sky = css.getPropertyValue("--sky");
      const line = css.getPropertyValue("--border");
      const dt = Math.min((now - last) / 16.67, 3); last = now;
      t += dt; speed += 0.002 * dt; s += 0.15 * dt;
      vy -= 0.6 * dt; y = Math.max(0, y + vy * dt); if (y === 0) vy = Math.max(vy, 0);
      if (obs.length === 0 || obs[obs.length - 1]!.x < w - (220 + Math.random() * 260))
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
      if (dead) { startedRef.current = false; setStarted(false); setOver(true); return; }
      raf = requestAnimationFrame(loop);
    }

    const key = (e: KeyboardEvent) => {
      if (e.code !== "Space") return;
      const r = c.getBoundingClientRect();
      if (!startedRef.current || r.top > innerHeight || r.bottom < 0) return;
      e.preventDefault(); dead ? reset() : jump();
    };
    size(); addEventListener("resize", size); addEventListener("keydown", key);
    return () => { cancelAnimationFrame(raf); removeEventListener("resize", size); removeEventListener("keydown", key); };
  }, []);

  const qualifies = score > 0 && (
    leaderboard.length < LEADERBOARD_LIMIT || score > leaderboard[leaderboard.length - 1]!.score
  );

  const saveScore = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const name = playerName.trim().slice(0, 24);
    if (!name || !qualifies) return;

    const next = [...leaderboard, { name, score }]
      .sort((left, right) => right.score - left.score)
      .slice(0, LEADERBOARD_LIMIT);
    setLeaderboard(next);
    setScoreSaved(true);
    try {
      window.localStorage.setItem(LEADERBOARD_KEY, JSON.stringify(next));
    } catch {
      // Keep the score for this session when browser storage is unavailable.
    }
  };

  const exitGame = () => {
    startedRef.current = false;
    setStarted(false);
    setOver(false);
    setScore(0);
    setPlayerName("");
    setScoreSaved(false);
  };

  return (
    <div className="relative select-none rounded-3xl border bg-card p-4 shadow-soft">
      <div className="relative z-30 flex items-center justify-between px-2 text-sm font-semibold text-muted-foreground">
        <span>{started ? "Press SPACE or tap to jump" : over ? "Run it back?" : "Ready to run?"}</span>
        <div className="flex items-center gap-2">
          <span className="font-display text-lg text-foreground tabular-nums">{String(score).padStart(5, "0")}</span>
          <Dialog open={leaderboardOpen} onOpenChange={setLeaderboardOpen}>
            <DialogTrigger asChild>
              <Button type="button" variant="ghost" size="icon" aria-label="Open leaderboard" title="Leaderboard">
                <Trophy aria-hidden className="h-4 w-4" />
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-sm">
              <DialogHeader>
                <DialogTitle>Leaderboard</DialogTitle>
                <DialogDescription>Top six runs on this browser</DialogDescription>
              </DialogHeader>
              {leaderboard.length > 0 ? (
                <ol className="space-y-2">
                  {leaderboard.map((entry, index) => (
                    <li key={`${entry.name}-${entry.score}-${index}`} className="flex items-center gap-3 rounded-md border px-3 py-2.5">
                      <span className="w-6 text-sm font-semibold text-muted-foreground">{index + 1}.</span>
                      <span className="min-w-0 flex-1 truncate font-medium">{entry.name}</span>
                      <span className="font-display font-bold tabular-nums">{String(entry.score).padStart(5, "0")}</span>
                    </li>
                  ))}
                </ol>
              ) : (
                <p className="py-4 text-center text-sm text-muted-foreground">No scores yet. Set the first record!</p>
              )}
            </DialogContent>
          </Dialog>
        </div>
      </div>
      <canvas ref={ref} onPointerDown={() => startedRef.current ? jumpRef.current() : restartRef.current()} aria-label="Endless runner mini game" className="mt-2 h-[160px] w-full cursor-pointer touch-none" />
      {!started && !over && (
        <div className="absolute inset-0 grid place-items-center rounded-3xl bg-background/70 backdrop-blur-sm">
          <button onClick={() => restartRef.current()} className="inline-flex items-center gap-2 rounded-full bg-primary px-6 py-3 font-semibold text-primary-foreground transition-transform hover:scale-105">
            <Play aria-hidden className="h-4 w-4 fill-current" />
            Start game
          </button>
        </div>
      )}
      {over && (
        <div className="absolute inset-0 z-20 grid place-items-center rounded-3xl bg-background/80 p-4 backdrop-blur-sm">
          <div className="w-full max-w-sm text-center animate-scale-in">
            <p className="font-display text-3xl font-bold">Run over</p>
            <p className="mt-1 text-muted-foreground">Score {score}</p>
            {scoreSaved ? (
              <p className="mt-3 text-sm font-semibold text-primary">Added to the leaderboard</p>
            ) : qualifies ? (
              <form onSubmit={saveScore} className="mt-3 space-y-2">
                <label className="sr-only" htmlFor="runner-player-name">Your name</label>
                <div className="relative">
                  <input
                    id="runner-player-name"
                    autoComplete="nickname"
                    maxLength={24}
                    required
                    value={playerName}
                    onChange={(event) => setPlayerName(event.target.value)}
                    placeholder="Enter your name"
                    className="h-10 w-full rounded-md border bg-background py-2 pl-3 pr-20 text-sm text-foreground placeholder:text-muted-foreground"
                  />
                  <button
                    type="submit"
                    aria-label="Save score"
                    title="Save score"
                    className="absolute right-1 top-1/2 inline-flex h-8 -translate-y-1/2 items-center gap-1 rounded-md bg-transparent px-2 text-xs font-semibold text-muted-foreground transition-colors hover:bg-muted hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                  >
                    <Save aria-hidden className="h-3.5 w-3.5" />
                    <span>Save</span>
                  </button>
                </div>
              </form>
            ) : (
              <p className="mt-3 text-sm text-muted-foreground">Not in the top six this time.</p>
            )}
            <div className="mt-3 flex justify-center gap-2">
              <Button type="button" onClick={() => restartRef.current()}>Retry ↻</Button>
              <Button type="button" variant="outline" onClick={exitGame}>Exit game</Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
