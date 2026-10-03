import { useEffect, useId, useRef, useState, type CSSProperties, type ReactNode } from "react";
import { animate, motion, useMotionTemplate, useMotionValue, useMotionValueEvent, useReducedMotion, type AnimationPlaybackControls } from "motion/react";
import { HugeiconsIcon } from "@hugeicons/react";
import { ArrowUp02Icon } from "@hugeicons/core-free-icons";
import { Button } from "@/components/ui/button";

const GAP = 4;
const SLOP = { fine: 4, coarse: 8 };
const FINGER_MAX = 3000;
const HAND_MAX = 6000;
const CANCEL = 0.5;
const POWER_CAP = 1.5;
const DOT_MS = 300;
const EASE_OUT = "cubic-bezier(0.23, 1, 0.32, 1)";
const clamp = (value: number, low: number, high: number) => Math.min(high, Math.max(low, value));
const rubberband = (offset: number, dimension: number, constant = 0.55) =>
  (offset * dimension * constant) / (dimension + constant * Math.abs(offset));

type Axis = "any" | "horizontal" | "vertical";
type Grip = {
  id: number;
  startX: number;
  startY: number;
  scale: number;
  moved: boolean;
  history: Array<{ x: number; y: number; time: number }>;
  rawOrigin: { x: number; y: number };
  slop: number;
};

type SlingButtonProps = {
  children?: ReactNode;
  onSend?: () => void;
  padColor?: string;
  iconColor?: string;
  accentColor?: string;
  wellColor?: string;
  bandColor?: string;
  size?: number;
  strokeWidth?: number;
  armAt?: number;
  maxPull?: number;
  launchSpeed?: number;
  recoil?: number;
  flight?: number;
  particles?: number;
  spread?: number;
  axis?: Axis;
  tapSends?: boolean;
  disabled?: boolean;
  ariaLabel?: string;
  className?: string;
};

export function SlingButton({
  children,
  onSend,
  padColor = "var(--sling-pad)",
  iconColor = "var(--sling-icon)",
  accentColor = "var(--particle)",
  wellColor = "var(--sling-well)",
  bandColor = "var(--sling-band)",
  size = 56,
  strokeWidth = 3,
  armAt = 48,
  maxPull = 160,
  launchSpeed = 2600,
  recoil = 0.2,
  flight = 120,
  particles = 14,
  spread = 60,
  axis = "any",
  tapSends = true,
  disabled = false,
  ariaLabel = "Send",
  className = "",
}: SlingButtonProps) {
  const reduceMotion = useReducedMotion();
  const range = maxPull;
  const armDistance = Math.min(armAt, 0.8 * range);
  const wellRadius = size / 2 + GAP + strokeWidth;
  const padRadius = size / 2 - strokeWidth / 2;
  const extent = wellRadius + strokeWidth + 2;
  const dotSize = Math.max(6, Math.round(size / 7));
  const dotCount = Math.max(0, Math.round(particles));
  const [held, setHeld] = useState(false);
  const [armed, setArmed] = useState(false);
  const [sent, setSent] = useState(false);
  const rootRef = useRef<HTMLSpanElement>(null);
  const padRef = useRef<HTMLButtonElement>(null);
  const fxRef = useRef<SVGGElement>(null);
  const bandRef = useRef<SVGPathElement>(null);
  const hotRef = useRef<SVGPathElement>(null);
  const arcRef = useRef<SVGCircleElement>(null);
  const dotRefs = useRef<Array<HTMLSpanElement | null>>([]);
  const iconRef = useRef<HTMLSpanElement>(null);
  const power = useRef(0);
  const direction = useRef({ x: 0, y: -1 });
  const grip = useRef<Grip | null>(null);
  const animationX = useRef<AnimationPlaybackControls | null>(null);
  const animationY = useRef<AnimationPlaybackControls | null>(null);
  const armedRef = useRef(false);
  const dotPending = useRef(false);
  const dotTimer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
  const paintQueued = useRef(false);
  const skipClick = useRef(false);
  const hintId = useId();
  const x = useMotionValue(0);
  const y = useMotionValue(0);
  const padTransform = useMotionTemplate`translate(${x}px, ${y}px)`;

  const relaxIcon = () => {
    const icon = iconRef.current;
    if (!icon) return;
    icon.style.transition = reduceMotion ? "none" : "transform 360ms cubic-bezier(0.23, 1, 0.32, 1)";
    icon.style.transform = "rotate(0deg)";
  };

  const launchDots = () => {
    dotPending.current = false;
    clearTimeout(dotTimer.current);
    const { x: unitX, y: unitY } = direction.current;
    relaxIcon();
    const base = Math.atan2(-unitY, -unitX);
    const cone = (spread * Math.PI) / 180;
    const push = 0.85 + 0.35 * power.current;
    dotRefs.current.forEach((dot, index) => {
      if (!dot) return;
      const lead = index === 0;
      const angle = base + (lead ? 0 : (Math.random() + Math.random() - 1) * (cone / 2));
      const cosine = Math.cos(angle);
      const sine = Math.sin(angle);
      const reach = (lead ? flight : flight * (0.3 + Math.random())) * push;
      const drift = lead ? 0 : (Math.random() - 0.5) * flight * 0.4;
      const scale = lead ? 1 : 0.3 + Math.random() * 0.6;
      const shrink = lead ? 0.6 : scale * (0.2 + Math.random() * 0.4);
      const duration = lead ? DOT_MS : DOT_MS * (0.7 + Math.random());
      const delay = lead ? 0 : Math.random() * 70;
      const destination = wellRadius + reach;
      dot.animate([
        { transform: `translate(${cosine * wellRadius}px, ${sine * wellRadius}px) scale(${scale})` },
        { transform: `translate(${cosine * destination - sine * drift}px, ${sine * destination + cosine * drift}px) scale(${shrink})` },
      ], { duration, delay, easing: EASE_OUT });
      dot.animate([{ opacity: 1 }, { opacity: 1, offset: 0.55 }, { opacity: 0 }], { duration, delay, easing: "linear" });
    });
  };

  const paint = () => {
    paintQueued.current = false;
    const band = bandRef.current;
    const hot = hotRef.current;
    const arc = arcRef.current;
    const effects = fxRef.current;
    if (!band || !hot || !arc || !effects) return;
    const currentX = x.get();
    const currentY = y.get();
    const { x: unitX, y: unitY } = direction.current;
    const projection = currentX * unitX + currentY * unitY;
    const progress = clamp(projection / armDistance, 0, 1);
    const distance = Math.hypot(currentX, currentY);
    let path = "";
    if (distance > 0.5) {
      const angle = Math.atan2(currentY, currentX);
      const offset = Math.acos(clamp((wellRadius - padRadius) / distance, -1, 1));
      path = [angle + offset, angle - offset].map((point) => {
        const cosine = Math.cos(point);
        const sine = Math.sin(point);
        return `M${(wellRadius * cosine).toFixed(2)},${(wellRadius * sine).toFixed(2)}L${(currentX + padRadius * cosine).toFixed(2)},${(currentY + padRadius * sine).toFixed(2)}`;
      }).join("");
    }
    band.setAttribute("d", path);
    hot.setAttribute("d", path);
    hot.style.opacity = String(progress);
    effects.style.opacity = String(clamp(projection / 6, 0, 1));
    arc.setAttribute("stroke-dasharray", `${progress} ${1 - progress}`);
    arc.setAttribute("stroke-dashoffset", String(progress / 2));
    arc.style.opacity = progress > 0.01 ? "1" : "0";
    if (grip.current && iconRef.current) {
      const iconAngle = (Math.atan2(-unitY, -unitX) * 180) / Math.PI + 90;
      iconRef.current.style.transition = "none";
      iconRef.current.style.transform = `rotate(${iconAngle * clamp(distance / 12, 0, 1)}deg)`;
    }
    arc.setAttribute("transform", `rotate(${(Math.atan2(-unitY, -unitX) * 180) / Math.PI})`);
    if (dotPending.current && projection <= size / 4) launchDots();
  };

  const schedulePaint = () => {
    if (paintQueued.current) return;
    paintQueued.current = true;
    requestAnimationFrame(paint);
  };
  useMotionValueEvent(x, "change", schedulePaint);
  useMotionValueEvent(y, "change", schedulePaint);

  useEffect(() => {
    animationX.current?.stop();
    animationY.current?.stop();
    x.jump(0);
    y.jump(0);
    paint();
  }, [size, strokeWidth, armAt, maxPull, axis]);

  useEffect(() => () => {
    animationX.current?.stop();
    animationY.current?.stop();
    clearTimeout(dotTimer.current);
  }, []);

  const settle = (velocity: { x: number; y: number }) => {
    if (reduceMotion) {
      if (fxRef.current) fxRef.current.style.opacity = "0";
      x.jump(0);
      y.jump(0);
      return;
    }
    animationX.current = animate(x, 0, { type: "spring", duration: 0.4, bounce: recoil, velocity: velocity.x });
    animationY.current = animate(y, 0, { type: "spring", duration: 0.4, bounce: recoil, velocity: velocity.y });
  };

  const onPointerDown = (event: React.PointerEvent<HTMLButtonElement>) => {
    if (disabled || grip.current || event.button !== 0) return;
    const root = rootRef.current;
    if (!root) return;
    const rect = root.getBoundingClientRect();
    const scale = rect.width / (root.offsetWidth || rect.width) || 1;
    animationX.current?.stop();
    animationY.current?.stop();
    const currentX = x.get();
    const currentY = y.get();
    const distance = Math.hypot(currentX, currentY);
    const clampedDistance = Math.min(distance, 0.95 * range);
    const rawDistance = distance > 0.5 ? (range * clampedDistance) / (range - clampedDistance) : 0;
    grip.current = {
      id: event.pointerId, startX: event.clientX, startY: event.clientY, scale, moved: false, history: [],
      rawOrigin: distance > 0.5 ? { x: (rawDistance * currentX) / distance, y: (rawDistance * currentY) / distance } : { x: 0, y: 0 },
      slop: event.pointerType === "touch" ? SLOP.coarse : SLOP.fine,
    };
    try { event.currentTarget.setPointerCapture(event.pointerId); } catch { /* Pointer capture is optional. */ }
    setHeld(true);
  };

  const onPointerMove = (event: React.PointerEvent<HTMLButtonElement>) => {
    const activeGrip = grip.current;
    if (!activeGrip || activeGrip.id !== event.pointerId) return;
    const deltaX = (event.clientX - activeGrip.startX) / activeGrip.scale;
    const deltaY = (event.clientY - activeGrip.startY) / activeGrip.scale;
    let rawX = activeGrip.rawOrigin.x + deltaX;
    let rawY = activeGrip.rawOrigin.y + deltaY;
    if (axis === "horizontal") rawY = rubberband(rawY, size / 4);
    else if (axis === "vertical") rawX = rubberband(rawX, size / 4);
    if (!activeGrip.moved && Math.hypot(deltaX, deltaY) > activeGrip.slop) activeGrip.moved = true;
    const rawDistance = Math.hypot(rawX, rawY);
    if (rawDistance < 0.01) return;
    const distance = (range * rawDistance) / (range + rawDistance);
    const unitX = rawX / rawDistance;
    const unitY = rawY / rawDistance;
    direction.current = { x: unitX, y: unitY };
    x.set(distance * unitX);
    y.set(distance * unitY);
    const time = performance.now();
    activeGrip.history.push({ x: distance * unitX, y: distance * unitY, time });
    while (activeGrip.history.length > 4) activeGrip.history.shift();
    const oldestSample = activeGrip.history[0];
    while (oldestSample && time - oldestSample.time > 80) {
      activeGrip.history.shift();
      const nextSample = activeGrip.history[0];
      if (!nextSample || time - nextSample.time <= 80) break;
    }
    const isArmed = distance >= armDistance;
    if (isArmed !== armedRef.current) {
      armedRef.current = isArmed;
      setArmed(isArmed);
    }
  };

  const release = (pointerId: number, cancelled: boolean) => {
    const activeGrip = grip.current;
    if (!activeGrip || activeGrip.id !== pointerId) return;
    grip.current = null;
    skipClick.current = true;
    try { padRef.current?.releasePointerCapture(pointerId); } catch { /* Pointer capture may already be released. */ }
    const distance = Math.hypot(x.get(), y.get());
    const pullPower = distance / armDistance;
    const { x: unitX, y: unitY } = direction.current;
    let velocityX = 0;
    let velocityY = 0;
    if (!cancelled && activeGrip.history.length > 1) {
      const first = activeGrip.history[0];
      const last = activeGrip.history[activeGrip.history.length - 1];
      if (first && last) {
        const elapsed = last.time - first.time;
        if (elapsed > 0 && performance.now() - last.time < 50) {
          velocityX = ((last.x - first.x) / elapsed) * 1000;
          velocityY = ((last.y - first.y) / elapsed) * 1000;
        }
      }
    }
    const fingerSpeed = Math.hypot(velocityX, velocityY);
    if (fingerSpeed > FINGER_MAX) {
      velocityX *= FINGER_MAX / fingerSpeed;
      velocityY *= FINGER_MAX / fingerSpeed;
    }
    if (!activeGrip.moved) {
      relaxIcon();
      if (tapSends && !cancelled) onSend?.();
    } else {
      const shouldFire = armedRef.current && !cancelled;
      const launch = shouldFire ? launchSpeed * Math.min(pullPower, POWER_CAP) : CANCEL * launchSpeed * Math.min(pullPower, 1);
      let launchX = velocityX - unitX * launch;
      let launchY = velocityY - unitY * launch;
      const handSpeed = Math.hypot(launchX, launchY);
      if (handSpeed > HAND_MAX) {
        launchX *= HAND_MAX / handSpeed;
        launchY *= HAND_MAX / handSpeed;
      }
      if (!shouldFire) relaxIcon();
      if (shouldFire) {
        onSend?.();
        if (reduceMotion) {
          setSent(true);
          setTimeout(() => setSent(false), 200);
        } else {
          power.current = clamp((Math.min(pullPower, POWER_CAP) - 1) / (POWER_CAP - 1), 0, 1);
          dotPending.current = true;
          dotTimer.current = setTimeout(launchDots, 150);
        }
      }
      settle({ x: launchX, y: launchY });
    }
    armedRef.current = false;
    setHeld(false);
    setArmed(false);
  };

  const styles = {
    "--sl-size": `${size}px`, "--sl-svg": `${2 * extent}px`, "--sl-pad": padColor, "--sl-icon": iconColor,
    "--sl-accent": accentColor, "--sl-well": wellColor, "--sl-band": bandColor,
    "--sl-stroke": `${strokeWidth}px`, "--sl-dot": `${dotSize}px`,
  } as CSSProperties;

  return (
    <span ref={rootRef} className={`sling-button${className ? ` ${className}` : ""}`} data-armed={armed ? "" : undefined} data-sent={sent ? "" : undefined} style={styles}>
      <svg className="sling-button__fx" viewBox={`${-extent} ${-extent} ${2 * extent} ${2 * extent}`} aria-hidden="true">
        <g ref={fxRef} className="sling-button__tension" style={{ opacity: 0 }}>
          <path ref={bandRef} className="sling-button__band" />
          <path ref={hotRef} className="sling-button__band sling-button__band--hot" />
        </g>
        <circle className="sling-button__well" r={wellRadius} />
        <circle ref={arcRef} className="sling-button__arc" r={wellRadius} pathLength="1" strokeDasharray="0 1" style={{ opacity: 0 }} />
      </svg>
      {Array.from({ length: dotCount }, (_, index) => (
        <span key={index} ref={(element) => { dotRefs.current[index] = element; }} className="sling-button__dot" aria-hidden="true" />
      ))}
      <motion.span className="sling-button__move" style={{ transform: padTransform }}>
        <Button ref={padRef} type="button" variant="ghost" size="icon" className="sling-button__pad" aria-label={ariaLabel} aria-describedby={hintId}
          disabled={disabled} data-held={held ? "" : undefined} data-armed={armed ? "" : undefined}
          onPointerDown={onPointerDown} onPointerMove={onPointerMove} onPointerUp={(event) => release(event.pointerId, false)}
          onPointerCancel={(event) => release(event.pointerId, true)} onLostPointerCapture={(event) => release(event.pointerId, true)}
          onKeyDown={(event) => { if (event.key === "Escape" && grip.current) release(grip.current.id, true); }}
          onClick={() => { if (skipClick.current) { skipClick.current = false; return; } if (!disabled) onSend?.(); }}>
          <span className="sling-button__face"><span ref={iconRef} className="sling-button__icon">{children ?? <HugeiconsIcon icon={ArrowUp02Icon} size={Math.round(size * 0.4)} strokeWidth={2.2} />}</span></span>
        </Button>
      </motion.span>
      <span id={hintId} className="sling-button__sr">Press Enter to return to the top, or pull down and release.</span>
    </span>
  );
}
