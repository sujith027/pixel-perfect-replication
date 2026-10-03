import { useRef, useState, type CSSProperties, type KeyboardEvent, type PointerEvent } from "react";
import { ArrowUp } from "lucide-react";
import { Button } from "@/components/ui/button";

type SlingButtonProps = {
  onSend: () => void;
  padColor: string;
  iconColor: string;
  accentColor: string;
  wellColor: string;
  bandColor: string;
  size: number;
  strokeWidth: number;
  armAt: number;
  maxPull: number;
  launchSpeed: number;
  recoil: number;
  flight: number;
  particles: number;
  spread: number;
  axis: "any" | "vertical";
  tapSends?: boolean;
  ariaLabel: string;
};

type Burst = { id: number; x: number; y: number; delay: number };

export function SlingButton({ onSend, padColor, iconColor, accentColor, wellColor, bandColor, size, strokeWidth, armAt, maxPull, launchSpeed, recoil, flight, particles, spread, axis, tapSends = false, ariaLabel }: SlingButtonProps) {
  const origin = useRef<{ x: number; y: number } | null>(null);
  const dragged = useRef(false);
  const launched = useRef(false);
  const [pull, setPull] = useState({ x: 0, y: 0 });
  const [bursts, setBursts] = useState<Burst[]>([]);

  const launch = () => {
    if (launched.current) return;
    launched.current = true;
    const seed = Date.now();
    setPull({ x: 0, y: 0 });
    setBursts(Array.from({ length: particles }, (_, i) => {
      const angle = ((i / Math.max(1, particles - 1)) * spread - spread / 2 - 90) * (Math.PI / 180);
      const distance = 26 + (i % 4) * 7;
      return { id: seed + i, x: Math.cos(angle) * distance, y: Math.sin(angle) * distance, delay: (i % 3) * 18 };
    }));
    window.setTimeout(() => setBursts([]), flight + 260);
    onSend();
  };

  const onPointerDown = (event: PointerEvent<HTMLButtonElement>) => {
    origin.current = { x: event.clientX, y: event.clientY };
    dragged.current = false;
    launched.current = false;
    event.currentTarget.setPointerCapture(event.pointerId);
  };

  const onPointerMove = (event: PointerEvent<HTMLButtonElement>) => {
    if (!origin.current) return;
    let x = event.clientX - origin.current.x;
    let y = event.clientY - origin.current.y;
    if (axis === "vertical") x = 0;
    const distance = Math.hypot(x, y);
    if (distance > 4) dragged.current = true;
    if (distance > maxPull) {
      x = (x / distance) * maxPull;
      y = (y / distance) * maxPull;
    }
    setPull({ x, y });
  };

  const onPointerUp = () => {
    const shouldLaunch = dragged.current || tapSends;
    origin.current = null;
    if (shouldLaunch) launch();
    else setPull({ x: 0, y: 0 });
  };

  const onKeyDown = (event: KeyboardEvent<HTMLButtonElement>) => {
    if (event.key !== "Enter" && event.key !== " ") return;
    event.preventDefault();
    launched.current = false;
    launch();
  };

  const padStyle = {
    "--sling-pad": padColor, "--sling-icon": iconColor, "--sling-accent": accentColor,
    "--sling-well": wellColor, "--sling-band": bandColor, "--sling-size": `${size}px`,
    "--sling-stroke": `${strokeWidth}px`, "--sling-arm": `${armAt}px`,
    "--sling-speed": `${Math.max(180, launchSpeed / 7)}ms`, "--sling-recoil": recoil,
    "--sling-flight": `${flight}ms`, "--sling-x": `${pull.x}px`, "--sling-y": `${pull.y}px`, "--sling-axis": axis,
  } as CSSProperties;

  return (
    <div className="sling" style={padStyle}>
      <span className="sling-arm" aria-hidden />
      <Button type="button" variant="ghost" size="icon" aria-label={ariaLabel} title={ariaLabel}
        style={{ width: size, height: size }} className="sling-pad"
        onPointerDown={onPointerDown} onPointerMove={onPointerMove} onPointerUp={onPointerUp}
        onPointerCancel={() => { origin.current = null; setPull({ x: 0, y: 0 }); }} onKeyDown={onKeyDown}>
        <ArrowUp strokeWidth={strokeWidth} />
      </Button>
      {bursts.map((burst) => <span key={burst.id} aria-hidden className="sling-particle" style={{ "--burst-x": `${burst.x}px`, "--burst-y": `${burst.y}px`, "--burst-delay": `${burst.delay}ms` } as CSSProperties} />)}
    </div>
  );
}
