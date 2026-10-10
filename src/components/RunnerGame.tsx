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

// Game tuning and sprite coordinates mirror Chromium's T-Rex runner (components/neterror/resources/dino_game,
// BSD licence) so it plays like the original. Units are the original 1x pixels at 60fps.
const HEIGHT = 150;
const BOTTOM_PAD = 10;
const MS_PER_FRAME = 1000 / 60;
const SPEED = 6;
const MAX_SPEED = 13;
const ACCELERATION = 0.001;
const GAP_COEFFICIENT = 0.6;
const MAX_GAP_COEFFICIENT = 1.5;
const MAX_OBSTACLE_LENGTH = 3;
const MAX_DUPLICATION = 2;
const CLEAR_TIME = 3000;
const SPEED_DROP_COEFFICIENT = 3;
const SCORE_COEFFICIENT = 0.025;
const INVERT_DISTANCE = 700;
const CLOUD = { x: 86, y: 2, x2: 166, y2: 2, width: 46, height: 14 };
const CLOUD_SPEED = 0.2;
const CLOUD_FREQUENCY = 0.5;
const MAX_CLOUDS = 6;
const MIN_CLOUD_GAP = 100;
const MAX_CLOUD_GAP = 400;
const MAX_SKY = 30;
const MIN_SKY = 71;
const HORIZON = { x: 2, y: 54, x2: 2, y2: 104, width: 600, height: 12, yPos: 127 };
// T-Rex sprite and hitboxes: not drawn right now (the pixel runner below replaced it), kept so it can be
// switched back later. To restore it, use TREX/TREX_*_BOXES in place of PLAYER/PLAYER_*_BOXES and re-enable
// the T-Rex draw call in draw().
const TREX = {
  sprite: { x: 848, y: 2, x2: 1678, y2: 2 },
  startX: 50,
  width: 44,
  height: 47,
  widthDuck: 59,
  heightDuck: 25,
  gravity: 0.6,
  initialJumpVelocity: -10,
  dropVelocity: -5,
  minJumpHeight: 30,
  maxJumpHeight: 30,
};
type Box = { x: number; y: number; width: number; height: number };
type SpriteBase = { x: number; y: number; x2: number; y2: number };
const TREX_RUN_BOXES: Box[] = [
  { x: 22, y: 0, width: 17, height: 16 },
  { x: 1, y: 18, width: 30, height: 9 },
  { x: 10, y: 35, width: 14, height: 8 },
  { x: 1, y: 24, width: 29, height: 5 },
  { x: 5, y: 30, width: 21, height: 4 },
  { x: 9, y: 34, width: 15, height: 4 },
];
const TREX_DUCK_BOXES: Box[] = [{ x: 1, y: 18, width: 55, height: 25 }];

// Pixel runner: hand-drawn frames where each "#" is a 2x2 cell, in the same grey as Chrome's sprites so the
// theme/night inversion applies to it too. Physics match the T-Rex's.
const PIXEL = 2;
const PLAYER_FRAMES = {
  stand: [
    "....#####.....",
    "...#######....",
    "...######.#...",
    "....#######...",
    "....######....",
    ".....####.....",
    "......##......",
    ".....####.....",
    "....######....",
    "....#.##.#....",
    "....#.##.#....",
    "....#.##.#....",
    ".....####.....",
    ".....#..#.....",
    ".....#..#.....",
    ".....#..#.....",
    ".....#..#.....",
    ".....##.##....",
  ],
  run1: [
    "....#####.....",
    "...#######....",
    "...######.#...",
    "....#######...",
    "....######....",
    ".....####.....",
    "......##......",
    ".....####.##..",
    "....######.#..",
    "...#.####.....",
    "..#..####.....",
    "..#..####.....",
    ".....####.....",
    "....##..##....",
    "...##....#....",
    "..##.....#....",
    ".#.......#....",
    ".#.......##...",
  ],
  run2: [
    "....#####.....",
    "...#######....",
    "...######.#...",
    "....#######...",
    "....######....",
    ".....####.....",
    "......##......",
    ".....####.....",
    "....#####.....",
    ".....####.....",
    ".....####.#...",
    ".....#####....",
    ".....####.....",
    ".....#.##.....",
    "......#.#.....",
    ".....#..#.....",
    "....#...#.....",
    "....##..##....",
  ],
  jump: [
    "....#####.....",
    "...#######....",
    "...######.#...",
    "....#######...",
    "....######....",
    ".....####.....",
    "..#...##...#..",
    "...#.####.#...",
    "....######....",
    ".....####.....",
    ".....####.....",
    ".....####.....",
    ".....####.....",
    "....##..##....",
    "...##...##....",
    "...#....#.....",
    "....#....#....",
    "..............",
  ],
  crash: [
    "....#####.....",
    "...#######....",
    "...#####.#.#..",
    "....#####.#...",
    "....####.#.#..",
    ".....####.....",
    "......##......",
    "..#..####..#..",
    "...########...",
    ".....####.....",
    ".....####.....",
    ".....####.....",
    ".....####.....",
    ".....#..#.....",
    ".....#..#.....",
    ".....#..#.....",
    ".....#..#.....",
    "....##.##.....",
  ],
  duck1: [
    "............#####.",
    "...........#######",
    "...........######.",
    "...#########.####.",
    "..###########.....",
    "..###########.....",
    "..####....###.....",
    "...##.##....##....",
    "..##...##...#.....",
    ".##.....##........",
    ".###....###.......",
    "..................",
  ],
  duck2: [
    "............#####.",
    "...........#######",
    "...........######.",
    "...#########.####.",
    "..###########.....",
    "..###########.....",
    "..####...##.......",
    "...####..###......",
    "....##.##.........",
    "....##..##........",
    "....###.###.......",
    "..................",
  ],
} satisfies Record<string, string[]>;
type PlayerFrame = keyof typeof PLAYER_FRAMES;
const PLAYER = {
  startX: 50,
  width: 28,
  height: 36,
  widthDuck: 36,
  heightDuck: 24,
  gravity: 0.6,
  initialJumpVelocity: -10,
  dropVelocity: -5,
  minJumpHeight: 30,
  maxJumpHeight: 30,
};
const PLAYER_RUN_BOXES: Box[] = [
  { x: 8, y: 0, width: 14, height: 12 },
  { x: 8, y: 12, width: 12, height: 14 },
  { x: 6, y: 26, width: 16, height: 10 },
];
// Relative to the ducking pose's top-left (which sits heightDuck above the ground).
const PLAYER_DUCK_BOXES: Box[] = [
  { x: 22, y: 0, width: 14, height: 8 },
  { x: 4, y: 6, width: 24, height: 10 },
  { x: 2, y: 14, width: 20, height: 8 },
];
type ObstacleType = {
  name: string;
  /** Chrome sprite-sheet position (cacti / pterodactyl). */
  sprite?: SpriteBase;
  /** Pixel-art frames ("#" = 2x2 cell) used instead of the sprite sheet. */
  art?: string[][];
  width: number;
  height: number;
  y: number | number[];
  multipleSpeed: number;
  minGap: number;
  minSpeed: number;
  speedOffset?: number;
  frames: number;
  frameRate: number;
  boxes: Box[];
};
// Chrome's cacti and pterodactyl: not used right now (the UI/UX obstacles below replaced them), kept so they
// can be switched back later by spawning from CHROME_OBSTACLES instead of OBSTACLES.
const CHROME_OBSTACLES: ObstacleType[] = [
  {
    name: "cactusSmall", sprite: { x: 228, y: 2, x2: 446, y2: 2 }, width: 17, height: 35, y: 105, multipleSpeed: 4, minGap: 120, minSpeed: 0, frames: 1, frameRate: 0,
    boxes: [{ x: 0, y: 7, width: 5, height: 27 }, { x: 4, y: 0, width: 6, height: 34 }, { x: 10, y: 4, width: 7, height: 14 }],
  },
  {
    name: "cactusLarge", sprite: { x: 332, y: 2, x2: 652, y2: 2 }, width: 25, height: 50, y: 90, multipleSpeed: 7, minGap: 120, minSpeed: 0, frames: 1, frameRate: 0,
    boxes: [{ x: 0, y: 12, width: 7, height: 38 }, { x: 8, y: 0, width: 7, height: 49 }, { x: 13, y: 10, width: 10, height: 38 }],
  },
  {
    name: "pterodactyl", sprite: { x: 134, y: 2, x2: 260, y2: 2 }, width: 46, height: 40, y: [100, 75, 50], multipleSpeed: 999, minGap: 150, minSpeed: 8.5, speedOffset: 0.8, frames: 2, frameRate: 1000 / 6,
    boxes: [{ x: 15, y: 15, width: 16, height: 5 }, { x: 18, y: 21, width: 24, height: 6 }, { x: 2, y: 14, width: 4, height: 3 }, { x: 6, y: 10, width: 4, height: 7 }, { x: 10, y: 8, width: 6, height: 9 }],
  },
];
// UI/UX obstacles. Ground: a wireframe card (small) and a stack of sticky notes (tall), which can come in groups
// like cacti. Air: a client-feedback bubble with bouncing typing dots, at the pterodactyl's three heights
// (low: jump it, middle: duck under it, high: passes overhead). Widths include a gap so groups stay readable.
const OBSTACLES: ObstacleType[] = [
  {
    name: "wireframeCard", width: 32, height: 34, y: 106, multipleSpeed: 4, minGap: 120, minSpeed: 0, frames: 1, frameRate: 0,
    art: [[
        "##############",
        "#............#",
        "#.##########.#",
        "#.##......##.#",
        "#.#.#....#.#.#",
        "#.#..#..#..#.#",
        "#.#...##...#.#",
        "#.#..#..#..#.#",
        "#.#.#....#.#.#",
        "#.##......##.#",
        "#.##########.#",
        "#............#",
        "#.########...#",
        "#............#",
        "#.#####......#",
        "#............#",
        "##############",
      ]],
    boxes: [{ x: 1, y: 1, width: 26, height: 32 }],
  },
  {
    name: "stickyNotes", width: 30, height: 46, y: 94, multipleSpeed: 7, minGap: 120, minSpeed: 0, frames: 1, frameRate: 0,
    art: [[
        "..##########.",
        "..##########.",
        "..##.....###.",
        "..##########.",
        "..##.......#.",
        "..#########..",
        "..########...",
        ".##########..",
        ".##########..",
        ".##......##..",
        ".##########..",
        ".##.....###..",
        ".##########..",
        ".##########..",
        "..##########.",
        "..##########.",
        "..##.....###.",
        "..##########.",
        "..##......##.",
        "..##########.",
        ".##########..",
        ".##.......#..",
        ".##########..",
      ]],
    boxes: [{ x: 3, y: 1, width: 22, height: 44 }],
  },
  {
    name: "feedbackBubble", width: 46, height: 30, y: [105, 82, 50], multipleSpeed: 999, minGap: 150, minSpeed: 8.5, speedOffset: 0.8, frames: 2, frameRate: 1000 / 4,
    art: [[
        "....##############....",
        "..##################..",
        ".####################.",
        "######################",
        "######################",
        "####..####..####..####",
        "####..####..####..####",
        "######################",
        "######################",
        ".####################.",
        "..##################..",
        "....##############....",
        "......####............",
        ".....###..............",
        "....##................",
      ], [
        "....##############....",
        "..##################..",
        ".####################.",
        "######################",
        "##########..##########",
        "####..####..####..####",
        "####..##########..####",
        "######################",
        "######################",
        ".####################.",
        "..##################..",
        "....##############....",
        "......####............",
        ".....###..............",
        "....##................",
      ]],
    boxes: [{ x: 2, y: 2, width: 40, height: 20 }, { x: 8, y: 22, width: 8, height: 6 }],
  },
];
const randomInt = (min: number, max: number) => Math.floor(Math.random() * (max - min + 1)) + min;

function isLeaderboardEntry(value: unknown): value is LeaderboardEntry {
  if (typeof value !== "object" || value === null) return false;
  const entry = value as Record<string, unknown>;
  return typeof entry["name"] === "string" && typeof entry["score"] === "number" && Number.isFinite(entry["score"]);
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
  const releaseRef = useRef<() => void>(() => {});

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
    const canvas = ref.current!;
    const ctx = canvas.getContext("2d")!;
    const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    // Sprite sheets from Chromium's T-Rex runner (BSD licence); positions below are its 1x coordinates.
    const sheets = { 1: new Image(), 2: new Image() } as const;
    sheets[1].src = "/runner/offline-sprite-1x.png";
    sheets[2].src = "/runner/offline-sprite-2x.png";
    let sheetScale: 1 | 2 = 1;

    let width = 0, dpr = 1;
    const groundY = HEIGHT - PLAYER.height - BOTTOM_PAD;

    // Pre-render pixel art (runner frames and UI/UX obstacles) at device resolution so each draw is one crisp drawImage.
    const renderArt = (rows: string[]) => {
      const frame = document.createElement("canvas");
      const cell = PIXEL * dpr;
      frame.width = Math.round(rows[0]!.length * cell);
      frame.height = Math.round(rows.length * cell);
      const frameCtx = frame.getContext("2d")!;
      frameCtx.fillStyle = "#535353";
      rows.forEach((row, y) => {
        for (let x = 0; x < row.length; x++) if (row[x] === "#") frameCtx.fillRect(Math.round(x * cell), Math.round(y * cell), Math.ceil(cell), Math.ceil(cell));
      });
      return frame;
    };
    let playerFrames = {} as Record<PlayerFrame, HTMLCanvasElement>;
    let obstacleArt = new Map<string, HTMLCanvasElement[]>();
    const buildPlayerFrames = () => {
      const built = {} as Record<PlayerFrame, HTMLCanvasElement>;
      for (const [name, rows] of Object.entries(PLAYER_FRAMES) as [PlayerFrame, string[]][]) built[name] = renderArt(rows);
      playerFrames = built;
      obstacleArt = new Map(OBSTACLES.filter((type) => type.art).map((type) => [type.name, type.art!.map(renderArt)]));
    };

    type Obstacle = { type: ObstacleType; x: number; y: number; size: number; speedOffset: number; gap: number; frame: number; frameTime: number };
    type Cloud = { x: number; y: number; gap: number };
    let playerY = groundY, jumpVelocity = 0, jumping = false, ducking = false, speedDrop = false, reachedMinHeight = false;
    let runFrame = 0, runTime = 0;
    let speed = SPEED, distance = 0, runningTime = 0, shownScore = -1;
    let obstacles: Obstacle[] = [], history: string[] = [], clouds: Cloud[] = [];
    let groundOffset = 0, groundBumps: boolean[] = [];
    const fillGround = () => { while (groundBumps.length < Math.ceil(width / HORIZON.width) + 1) groundBumps.push(Math.random() > 0.5); };
    let night = false, nextInvertAt = INVERT_DISTANCE;
    let running = false, crashed = false, raf = 0, last = 0;

    const size = () => {
      dpr = Math.min(devicePixelRatio || 1, 2);
      sheetScale = dpr > 1 ? 2 : 1;
      width = canvas.clientWidth;
      canvas.width = Math.round(width * dpr);
      canvas.height = Math.round(HEIGHT * dpr);
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      ctx.imageSmoothingEnabled = false;
      buildPlayerFrames();
      fillGround();
      draw();
    };

    // Draw part of a sprite (offset dx within it, in 1x pixels) at a logical position, snapped to device pixels
    // so it stays crisp. The 2x sheet has its own layout, so each sprite carries both base positions.
    const sprite = (base: SpriteBase, dx: number, sw: number, sh: number, x: number, y: number) => {
      const sheet = sheets[sheetScale];
      if (!sheet.complete || !sheet.naturalWidth) return;
      const sx = sheetScale === 2 ? base.x2 + dx * 2 : base.x + dx;
      const sy = sheetScale === 2 ? base.y2 : base.y;
      const snap = (value: number) => Math.round(value * dpr) / dpr;
      ctx.drawImage(sheet, sx, sy, sw * sheetScale, sh * sheetScale, snap(x), snap(y), sw, sh);
    };

    const setNight = (value: boolean) => {
      night = value;
      canvas.setAttribute("data-night", String(value));
    };

    const reset = () => {
      playerY = groundY; jumpVelocity = 0; jumping = false; ducking = false; speedDrop = false; reachedMinHeight = false;
      speed = SPEED; distance = 0; runningTime = 0; shownScore = -1;
      obstacles = []; history = []; clouds = [{ x: width * 0.6, y: randomInt(MAX_SKY, MIN_SKY), gap: randomInt(MIN_CLOUD_GAP, MAX_CLOUD_GAP) }];
      groundOffset = 0; groundBumps = []; fillGround();
      setNight(false); nextInvertAt = INVERT_DISTANCE;
      crashed = false; running = true; startedRef.current = true;
      setStarted(true); setOver(false); setScore(0); setPlayerName(""); setScoreSaved(false);
      last = performance.now();
      cancelAnimationFrame(raf);
      raf = requestAnimationFrame(loop);
    };

    const startJump = () => {
      if (!running || jumping || ducking) return;
      jumping = true; reachedMinHeight = false; speedDrop = false;
      jumpVelocity = PLAYER.initialJumpVelocity - speed / 10;
    };
    const endJump = () => {
      if (jumping && reachedMinHeight && jumpVelocity < PLAYER.dropVelocity) jumpVelocity = PLAYER.dropVelocity;
    };
    const setDuck = (down: boolean) => {
      if (!running) return;
      if (down && jumping) { speedDrop = true; jumpVelocity = 1; return; }
      ducking = down && !jumping;
    };
    restartRef.current = reset;
    jumpRef.current = startJump;
    releaseRef.current = endJump;

    const addObstacle = () => {
      const candidates = OBSTACLES.filter((type) => speed >= type.minSpeed && history.filter((name) => name === type.name).length < MAX_DUPLICATION);
      const type = candidates[randomInt(0, candidates.length - 1)] ?? OBSTACLES[0]!;
      const size = speed > type.multipleSpeed ? randomInt(1, MAX_OBSTACLE_LENGTH) : 1;
      const y = Array.isArray(type.y) ? type.y[randomInt(0, type.y.length - 1)]! : type.y;
      const minGap = Math.round(type.width * size * speed + type.minGap * GAP_COEFFICIENT);
      const gap = randomInt(minGap, Math.round(minGap * MAX_GAP_COEFFICIENT));
      const speedOffset = type.speedOffset ? (Math.random() > 0.5 ? type.speedOffset : -type.speedOffset) : 0;
      obstacles.push({ type, x: width, y, size, speedOffset, gap, frame: 0, frameTime: 0 });
      history = [type.name, ...history].slice(0, MAX_DUPLICATION);
    };

    const duckOffset = PLAYER.height - PLAYER.heightDuck;
    const playerBoxes = () => ducking
      ? PLAYER_DUCK_BOXES.map((box) => ({ ...box, x: box.x + PLAYER.startX, y: box.y + playerY + duckOffset }))
      : PLAYER_RUN_BOXES.map((box) => ({ ...box, x: box.x + PLAYER.startX, y: box.y + playerY }));
    const obstacleBoxes = (o: Obstacle) => {
      // Pixel-art obstacles repeat their boxes per item in a group.
      if (o.type.art) {
        return Array.from({ length: o.size }, (_, k) => o.type.boxes.map((box) => ({ ...box, x: box.x + o.x + k * o.type.width, y: box.y + o.y }))).flat();
      }
      const boxes = o.type.boxes.map((box) => ({ ...box }));
      if (o.size > 1 && boxes.length >= 3) {
        boxes[1]!.width = o.type.width * o.size - boxes[0]!.width - boxes[2]!.width;
        boxes[2]!.x = o.type.width * o.size - boxes[2]!.width;
      }
      return boxes.map((box) => ({ ...box, x: box.x + o.x, y: box.y + o.y }));
    };
    const hits = (o: Obstacle) => {
      const tw = ducking ? PLAYER.widthDuck : PLAYER.width;
      const top = ducking ? playerY + duckOffset : playerY;
      const ow = o.type.width * o.size;
      // Cheap bounding-box test (1px inset) first, then the per-sprite boxes like the original.
      if (!(PLAYER.startX + 1 < o.x + ow - 1 && PLAYER.startX + tw - 1 > o.x + 1 && top + 1 < o.y + o.type.height - 1 && playerY + PLAYER.height - 1 > o.y + 1)) return false;
      const obstacleParts = obstacleBoxes(o);
      return playerBoxes().some((a) => obstacleParts.some((b) => a.x < b.x + b.width && a.x + a.width > b.x && a.y < b.y + b.height && a.y + a.height > b.y));
    };

    function update(delta: number) {
      const frames = delta / MS_PER_FRAME;
      runningTime += delta;

      // Jump physics (gravity, minimum height before an early release can cut the jump, faster fall when ducking).
      if (jumping) {
        playerY += jumpVelocity * frames * (speedDrop ? SPEED_DROP_COEFFICIENT : 1);
        jumpVelocity += PLAYER.gravity * frames;
        if (playerY < groundY - PLAYER.minJumpHeight || speedDrop) reachedMinHeight = true;
        if (playerY < groundY - PLAYER.maxJumpHeight || speedDrop) endJump();
        if (playerY > groundY) { playerY = groundY; jumping = false; jumpVelocity = 0; speedDrop = false; }
      }
      runTime += delta;
      const frameMs = ducking ? 1000 / 8 : 1000 / 12;
      if (runTime >= frameMs) { runFrame = 1 - runFrame; runTime %= frameMs; }

      // Ground scrolls with the game; clouds drift slower for parallax.
      groundOffset -= speed * frames;
      while (groundOffset <= -HORIZON.width) { groundOffset += HORIZON.width; groundBumps.shift(); fillGround(); }
      for (const cloud of clouds) cloud.x -= CLOUD_SPEED * frames * (speed / SPEED);
      clouds = clouds.filter((cloud) => cloud.x > -CLOUD.width);
      const lastCloud = clouds[clouds.length - 1];
      if (clouds.length < MAX_CLOUDS && (!lastCloud || width - lastCloud.x > lastCloud.gap) && Math.random() < CLOUD_FREQUENCY) {
        clouds.push({ x: width, y: randomInt(MAX_SKY, MIN_SKY), gap: randomInt(MIN_CLOUD_GAP, MAX_CLOUD_GAP) });
      }

      // Obstacles start after a short clear run, then spawn once the previous one has passed its gap.
      if (runningTime > CLEAR_TIME) {
        for (const o of obstacles) {
          o.x -= (speed + o.speedOffset) * frames;
          if (o.type.frames > 1) {
            o.frameTime += delta;
            if (o.frameTime >= o.type.frameRate) { o.frame = (o.frame + 1) % o.type.frames; o.frameTime = 0; }
          }
        }
        obstacles = obstacles.filter((o) => o.x + o.type.width * o.size > 0);
        const lastObstacle = obstacles[obstacles.length - 1];
        if (!lastObstacle || lastObstacle.x + lastObstacle.type.width * lastObstacle.size + lastObstacle.gap < width) addObstacle();
      }

      distance += speed * frames;
      if (speed < MAX_SPEED) speed += ACCELERATION * frames;

      // Night mode flips the palette every 700 points, like the original.
      const points = Math.round(distance * SCORE_COEFFICIENT);
      if (points >= nextInvertAt) { setNight(!night); nextInvertAt += INVERT_DISTANCE; }
      if (points !== shownScore) { shownScore = points; setScore(points); }

      if (obstacles.some(hits)) {
        crashed = true;
        running = false;
        startedRef.current = false;
        setStarted(false);
        setOver(true);
      }
    }

    function draw() {
      ctx.clearRect(0, 0, width, HEIGHT);
      for (const cloud of clouds) sprite(CLOUD, 0, CLOUD.width, CLOUD.height, cloud.x, cloud.y);
      // The two 600px ground strips (flat and bumpy) tile across the canvas, however wide it is.
      groundBumps.forEach((bump, i) => {
        sprite(HORIZON, bump ? HORIZON.width : 0, HORIZON.width, HORIZON.height, groundOffset + i * HORIZON.width, HORIZON.yPos);
      });
      for (const o of obstacles) {
        const w = o.type.width * o.size;
        const art = obstacleArt.get(o.type.name)?.[o.frame];
        if (art) {
          const snap = (value: number) => Math.round(value * dpr) / dpr;
          for (let k = 0; k < o.size; k++) ctx.drawImage(art, snap(o.x + k * o.type.width), snap(o.y), art.width / dpr, art.height / dpr);
        } else if (o.type.sprite) {
          const dx = o.type.frames > 1 ? o.type.width * o.frame : w * 0.5 * (o.size - 1);
          sprite(o.type.sprite, dx, w, o.type.height, o.x, o.y);
        }
      }
      // T-Rex (kept for later):
      // const frameX = crashed ? 220 : jumping ? 0 : ducking ? (runFrame ? 323 : 264) : running ? (runFrame ? 132 : 88) : 44;
      // const trexWidth = ducking && !crashed && !jumping ? TREX.widthDuck : TREX.width;
      // sprite(TREX.sprite, frameX, trexWidth, TREX.height, TREX.startX, playerY);
      const pose: PlayerFrame = crashed ? "crash" : jumping ? "jump" : ducking ? (runFrame ? "duck2" : "duck1") : running ? (runFrame ? "run2" : "run1") : "stand";
      const frame = playerFrames[pose];
      if (frame) {
        const snap = (value: number) => Math.round(value * dpr) / dpr;
        const y = pose.startsWith("duck") ? playerY + duckOffset : playerY;
        ctx.drawImage(frame, snap(PLAYER.startX), snap(y), frame.width / dpr, frame.height / dpr);
      }
    }

    function loop(now: number) {
      const delta = Math.min(now - last, 100);
      last = now;
      if (running) update(reduceMotion ? Math.min(delta, MS_PER_FRAME) : delta);
      draw();
      if (running) raf = requestAnimationFrame(loop);
    }

    const inView = () => {
      const bounds = canvas.getBoundingClientRect();
      return bounds.top < innerHeight && bounds.bottom > 0;
    };
    const onKeyDown = (event: KeyboardEvent) => {
      if (!inView() || (event.target instanceof HTMLElement && event.target.closest("input, textarea"))) return;
      if (event.code === "Space" || event.code === "ArrowUp") {
        if (!running) return;
        event.preventDefault();
        if (!event.repeat) startJump();
      } else if (event.code === "ArrowDown" && running) {
        event.preventDefault();
        setDuck(true);
      }
    };
    const onKeyUp = (event: KeyboardEvent) => {
      if (event.code === "Space" || event.code === "ArrowUp") endJump();
      else if (event.code === "ArrowDown") { ducking = false; speedDrop = false; }
    };

    sheets[1].onload = sheets[2].onload = () => draw();
    size();
    addEventListener("resize", size);
    addEventListener("keydown", onKeyDown);
    addEventListener("keyup", onKeyUp);
    return () => {
      cancelAnimationFrame(raf);
      removeEventListener("resize", size);
      removeEventListener("keydown", onKeyDown);
      removeEventListener("keyup", onKeyUp);
      sheets[1].onload = sheets[2].onload = null;
    };
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
    <div className="relative select-none rounded-[10px] border bg-card p-4">
      <div className="relative z-30 flex items-center justify-between px-2 text-sm font-semibold text-muted-foreground">
        <span>{started ? "SPACE / ↑ to jump · ↓ to duck" : over ? "Run it back?" : "Ready to run?"}</span>
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
      <canvas
        ref={ref}
        onPointerDown={() => (startedRef.current ? jumpRef.current() : restartRef.current())}
        onPointerUp={() => releaseRef.current()}
        aria-label="Endless runner mini game"
        className="runner-canvas mt-2 h-[150px] w-full cursor-pointer touch-none"
      />
      <p className="px-2 pt-1 text-right text-[0.65rem] text-muted-foreground/70">Ground, clouds &amp; gameplay based on Chromium's T-Rex runner (BSD licence)</p>
      {!started && !over && (
        <div className="absolute inset-0 grid place-items-center rounded-[10px] bg-background/70 backdrop-blur-sm">
          <button onClick={() => restartRef.current()} className="inline-flex items-center gap-2 rounded-full bg-primary px-6 py-3 font-semibold text-primary-foreground transition-transform hover:scale-105">
            <Play aria-hidden className="h-4 w-4 fill-current" />
            Start game
          </button>
        </div>
      )}
      {over && (
        <div className="absolute inset-0 z-20 grid place-items-center rounded-[10px] bg-background/80 p-4 backdrop-blur-sm">
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
