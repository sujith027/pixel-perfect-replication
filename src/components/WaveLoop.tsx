import { useEffect, useRef } from "react";
import gsap from "gsap";

const UNIT = "UI Design ✦ UX Research ✦ Prototyping ✦ Interaction Design ✦ Wireframing ✦ Design-to-Code ✦ ";
const W = 2400, H = 300, AMP = 45, PERIOD = 800; // curviness ~90 (peak to trough)

function wavePath() {
  let d = `M -${PERIOD} ${H / 2}`;
  for (let x = -PERIOD; x < W + PERIOD; x += PERIOD / 2) {
    const dir = ((x + PERIOD) / (PERIOD / 2)) % 2 === 0 ? -1 : 1;
    d += ` Q ${x + PERIOD / 4} ${H / 2 + dir * AMP * 2} ${x + PERIOD / 2} ${H / 2}`;
  }
  return d;
}

export function WaveLoop() {
  const tp = useRef<SVGTextPathElement>(null);
  const measure = useRef<SVGTextElement>(null);
  const tween = useRef<gsap.core.Tween | null>(null);
  const d = wavePath();

  useEffect(() => {
    const unitLen = measure.current?.getComputedTextLength() || 1600;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const state = { o: -unitLen };
    tween.current = gsap.to(state, {
      o: 0, duration: unitLen / 90, ease: "none", repeat: -1,
      onUpdate: () => tp.current?.setAttribute("startOffset", String(state.o)),
    });
    return () => { tween.current?.kill(); };
  }, []);

  const text = UNIT.repeat(5).toUpperCase();
  const font = { fontSize: 46, fontWeight: 800, fontFamily: "var(--font-display)", letterSpacing: "0.02em" };

  return (
    <section aria-label="What I do" className="relative -mx-[5vw] overflow-hidden py-10"
      onMouseEnter={() => tween.current?.pause()} onMouseLeave={() => tween.current?.resume()}>
      <svg viewBox={`0 0 ${W} ${H}`} preserveAspectRatio="xMidYMid slice" className="h-[200px] w-[110vw] md:h-[300px]" aria-hidden>
        <path id="wave-path" d={d} fill="none" className="stroke-ribbon" strokeWidth={86} strokeLinecap="round" />
        <text ref={measure} style={font} className="opacity-0">{UNIT.toUpperCase()}</text>
        <text style={font} className="fill-ink" dominantBaseline="central">
          <textPath ref={tp} href="#wave-path" startOffset="0">{text}</textPath>
        </text>
      </svg>
      <p className="sr-only">UI Design, UX Research, Prototyping, Interaction Design, Wireframing, Design-to-Code</p>
    </section>
  );
}
