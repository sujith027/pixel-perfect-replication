import { useEffect, useLayoutEffect, useRef, useState, type ReactNode } from "react";
import { motion, MotionConfig } from "motion/react";
import { ArrowUpRight } from "lucide-react";
import { cn } from "@/lib/utils";

// Replica of unlumen-ui's Team Stack: a messy stack of cards that fans out on hover (desktop). On phones it
// is a smaller deck instead: the other cards peek out from behind the front one, swiping the front card sends
// it to the back and brings the next forward, a tap on a peeking card brings it forward, and a tap on the
// front card follows its link.

export type StackCard = {
  role: string;
  name: string;
  description: string;
  imageSrc?: string;
  imageAlt?: string;
  /** Shown in the image panel when there is no image. */
  visual?: ReactNode;
  /** Inverted (light-on-dark / dark-on-light) hero card. */
  isFeatured?: boolean;
  ctaLabel?: string;
  ctaHref?: string;
};

const SPRING = { type: "spring", stiffness: 260, damping: 26, mass: 0.9 } as const;
const SWIPE_DISTANCE = 60; // px a drag must travel to count as a swipe
const SWIPE_VELOCITY = 450; // px/s a flick must reach to count as a swipe

// Deterministic jitter so the collapsed stack looks hand-placed but never changes between renders.
const jitter = (index: number, salt: number) => Math.sin(index * 12.9898 + salt * 78.233);

function collapsedPose(index: number) {
  if (index === 0) return { x: 0, y: 0, rotate: -1.5, scale: 1 };
  return { x: jitter(index, 1) * 10, y: index * 5 + jitter(index, 2) * 3, rotate: jitter(index, 3) * 7, scale: 1 - index * 0.015 };
}

function spreadPose(order: number, count: number, spread: number) {
  const offset = order - (count - 1) / 2;
  return { x: offset * spread, y: Math.abs(offset) * 14, rotate: offset * 7, scale: 1 };
}

// Phone deck: the front card is square-on; cards behind alternate right then left, tilted outwards, so
// both edges of the deck show something to swipe to.
function peekPose(depth: number) {
  if (depth === 0) return { x: 0, y: 0, rotate: 0, scale: 1 };
  const side = depth % 2 === 1 ? 1 : -1, step = Math.ceil(depth / 2);
  return { x: side * 32 * step, y: 8 + depth * 6, rotate: side * 5.5 * step, scale: 1 - 0.045 * step };
}

function CtaPill({ label, open }: { label: string; open: boolean }) {
  const labelRef = useRef<HTMLSpanElement>(null);
  const [labelWidth, setLabelWidth] = useState(0);
  useLayoutEffect(() => {
    if (labelRef.current) setLabelWidth(labelRef.current.scrollWidth);
  }, [label]);

  return (
    <motion.span
      aria-hidden
      className="absolute right-3 top-3 z-10 flex h-9 items-center justify-end overflow-hidden rounded-full bg-black text-white shadow-soft"
      initial={false}
      animate={{ width: open ? labelWidth + 44 : 36 }}
      transition={SPRING}
    >
      <motion.span
        ref={labelRef}
        className="whitespace-nowrap pl-4 text-sm font-semibold"
        initial={false}
        animate={{ opacity: open ? 1 : 0 }}
        transition={{ duration: 0.18 }}
      >
        {label}
      </motion.span>
      <span className="grid h-9 w-9 shrink-0 place-items-center">
        <ArrowUpRight className="h-4 w-4" strokeWidth={2.5} />
      </span>
    </motion.span>
  );
}

export function AboutStack({ cards, className }: { cards: StackCard[]; className?: string }) {
  const rootRef = useRef<HTMLDivElement>(null);
  const [expanded, setExpanded] = useState(false);
  const [active, setActive] = useState(0);
  const [hovered, setHovered] = useState<number | null>(null);
  const [spread, setSpread] = useState(96);
  const [mobile, setMobile] = useState(false);
  const pointerType = useRef<string>("mouse");
  const dragged = useRef(false);
  const count = cards.length;

  // Narrow screens fan out less so the cards stay inside the viewport, and switch to the swipe deck.
  useEffect(() => {
    const update = () => setSpread(window.innerWidth < 640 ? 54 : window.innerWidth < 1024 ? 80 : 96);
    update();
    window.addEventListener("resize", update);
    const query = window.matchMedia("(max-width: 767px)");
    const onQuery = () => setMobile(query.matches);
    onQuery();
    query.addEventListener("change", onQuery);
    return () => { window.removeEventListener("resize", update); query.removeEventListener("change", onQuery); };
  }, []);

  // Tapping outside collapses the stack on touch devices.
  useEffect(() => {
    if (!expanded) return;
    const onPointerDown = (event: PointerEvent) => {
      if (event.pointerType !== "mouse" && !rootRef.current?.contains(event.target as Node)) setExpanded(false);
    };
    document.addEventListener("pointerdown", onPointerDown);
    return () => document.removeEventListener("pointerdown", onPointerDown);
  }, [expanded]);

  // The desktop fan is hover-only; the phone deck never fans.
  const fanned = expanded && !mobile;

  // Fanned-out order: the active card sits in the middle slot; the rest keep their relative order around it.
  const order = cards.map((_, index) => index);
  const middle = Math.floor((count - 1) / 2);
  const spreadSlot = (index: number) => {
    const others = order.filter((i) => i !== active);
    if (index === active) return middle;
    const position = others.indexOf(index);
    return position < middle ? position : position + 1;
  };
  // Depth in the pile: active card on top. On phones the deck is cyclic, so a swiped card goes to the back
  // and the previous one is always the farthest back.
  const depth = (index: number) =>
    mobile ? (index - active + count) % count : index === active ? 0 : order.filter((i) => i !== active).indexOf(index) + 1;

  const swipe = (direction: 1 | -1) => setActive((current) => (current + direction + count) % count);

  const handleClick = (event: React.MouseEvent, index: number) => {
    // A drag ends with a click on the same card: swallow it so a swipe never follows the link.
    if (dragged.current) { event.preventDefault(); dragged.current = false; return; }
    if (mobile) {
      if (index !== active) { event.preventDefault(); setActive(index); }
      return;
    }
    if (pointerType.current === "mouse") return;
    if (!expanded) {
      event.preventDefault();
      setExpanded(true);
    } else if (index !== active) {
      event.preventDefault();
      setActive(index);
    }
  };

  return (
    <MotionConfig reducedMotion="user">
      <div className={cn("w-full", className)}>
        <div
          ref={rootRef}
          className="relative mx-auto aspect-3/4 w-full max-w-60 md:max-w-76"
          onPointerEnter={(event) => { if (event.pointerType === "mouse") setExpanded(true); }}
          onPointerLeave={(event) => { if (event.pointerType === "mouse") { setExpanded(false); setHovered(null); } }}
          // Keyboard focus only: a tap also focuses the card just before its click, and expanding then would
          // make that first tap follow the link instead of opening the stack.
          onFocus={(event) => { if ((event.target as HTMLElement).matches(":focus-visible")) setExpanded(true); }}
          onBlur={(event) => { if (!event.currentTarget.contains(event.relatedTarget as Node)) setExpanded(false); }}
        >
          {cards.map((card, index) => {
            const pose = mobile ? peekPose(depth(index)) : fanned ? spreadPose(spreadSlot(index), count, spread) : collapsedPose(depth(index));
            const isTop = mobile ? index === active : fanned ? hovered === index || (hovered === null && index === active) : index === active;
            const Tag = card.ctaHref ? motion.a : motion.div;
            const external = card.ctaHref?.startsWith("http") || card.ctaHref?.endsWith(".pdf");
            return (
              <Tag
                key={card.name}
                {...(card.ctaHref ? { href: card.ctaHref, ...(external ? { target: "_blank", rel: "noreferrer" } : {}) } : {})}
                aria-label={card.ctaLabel ? `${card.name}: ${card.ctaLabel}` : card.name}
                onPointerDown={(event: React.PointerEvent) => { pointerType.current = event.pointerType; dragged.current = false; }}
                onClick={(event: React.MouseEvent) => handleClick(event, index)}
                onPointerEnter={(event: React.PointerEvent) => { if (event.pointerType === "mouse") setHovered(index); }}
                // Phone deck: only the front card drags, sideways; it springs back unless the drag counts as a swipe,
                // in which case the pose change takes it from where it was dropped to the back of the deck.
                drag={mobile && index === active ? "x" : false}
                dragConstraints={{ left: 0, right: 0 }}
                dragElastic={0.6}
                dragMomentum={false}
                dragSnapToOrigin
                onDragStart={() => { dragged.current = true; }}
                onDragEnd={(_: unknown, info: { offset: { x: number }; velocity: { x: number } }) => {
                  if (info.offset.x < -SWIPE_DISTANCE || info.velocity.x < -SWIPE_VELOCITY) swipe(1);
                  else if (info.offset.x > SWIPE_DISTANCE || info.velocity.x > SWIPE_VELOCITY) swipe(-1);
                }}
                className={cn(
                  "absolute inset-0 flex flex-col rounded-[1.75rem] border p-3.5 text-left shadow-lift outline-none max-md:rounded-[1.4rem] max-md:p-3",
                  "focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background",
                  card.isFeatured ? "border-transparent bg-foreground text-background" : "bg-card text-card-foreground",
                )}
                style={{ zIndex: isTop ? count + 1 : count - depth(index) }}
                initial={false}
                animate={pose}
                transition={SPRING}
              >
                {/* Image panels use fixed colours, not theme tokens: a little darker grey than the featured card in light mode, dark grey in dark mode. */}
                <div className={cn("relative grid aspect-4/3 place-items-center overflow-hidden rounded-[1.25rem] max-md:rounded-2xl", card.isFeatured ? "bg-neutral-300" : "bg-[oklch(0.79_0_0)] dark:bg-[oklch(0.22_0_0)]")}>
                  {card.imageSrc ? (
                    <img src={card.imageSrc} alt={card.imageAlt ?? ""} draggable={false} className="h-[88%] w-[88%] select-none object-contain" />
                  ) : (
                    card.visual
                  )}
                  {card.ctaLabel && <CtaPill label={card.ctaLabel} open={mobile ? index === active : fanned && isTop} />}
                </div>
                <div className="flex flex-1 flex-col px-2 pb-2 pt-5 max-md:px-1.5 max-md:pb-1 max-md:pt-3.5">
                  <p className={cn("text-sm max-md:text-xs", card.isFeatured ? "text-background/60" : "text-muted-foreground")}>{card.role}</p>
                  <p className="mt-1 font-display text-[1.7rem] font-bold leading-tight tracking-tight max-md:text-[1.35rem]">{card.name}</p>
                  <p className={cn("mt-2 text-[0.95rem] leading-snug max-md:mt-1.5 max-md:text-[0.8rem]", card.isFeatured ? "text-background/75" : "text-muted-foreground")}>{card.description}</p>
                </div>
              </Tag>
            );
          })}
        </div>
        {/* Phone deck position: which card is in front. */}
        <div aria-hidden className="mt-8 flex justify-center gap-1.5 md:hidden">
          {cards.map((card, index) => (
            <span key={card.name} className={cn("h-1.5 rounded-full bg-foreground transition-all duration-300", index === active ? "w-5" : "w-1.5 opacity-25")} />
          ))}
        </div>
      </div>
    </MotionConfig>
  );
}
