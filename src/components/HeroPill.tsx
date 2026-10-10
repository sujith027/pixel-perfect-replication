import { useEffect, useState } from "react";
import { AnimatePresence, motion, MotionConfig } from "motion/react";

// The hero greeting pill: the greeting rolls through languages while the pill resizes to fit each word, and the
// hand waves every time a new greeting arrives.

const GREETINGS = ["Hi", "Namaste", "Hola", "Bonjour", "Ciao"];

export function HeroPill() {
  const [index, setIndex] = useState(0);

  useEffect(() => {
    const id = window.setInterval(() => setIndex((i) => (i + 1) % GREETINGS.length), 2400);
    return () => window.clearInterval(id);
  }, []);

  return (
    <MotionConfig reducedMotion="user">
      {/* The scroll reveal and the resize both use transform, so they live on separate elements. */}
      <div className="reveal mb-2">
        <motion.p
          layout
          transition={{ layout: { type: "spring", stiffness: 300, damping: 30 } }}
          className="inline-flex items-center gap-1 overflow-hidden rounded-full border bg-card py-1.5 pl-3 pr-4 text-sm font-semibold shadow-soft"
        >
          {/* Keyed by the greeting so each new word restarts the wave; it pivots at the wrist. */}
          <motion.span
            key={index}
            aria-hidden
            className="mr-0.5 inline-block origin-[70%_75%]"
            initial={{ rotate: 0 }}
            animate={{ rotate: [0, 16, -8, 16, -4, 10, 0] }}
            transition={{ duration: 1.1, ease: "easeInOut" }}
          >
            👋
          </motion.span>
          {/* One line tall and clipped, so the outgoing and incoming words roll through the line, not past it. */}
          <span className="relative inline-flex h-5 items-center overflow-hidden">
            <AnimatePresence mode="popLayout" initial={false}>
              <motion.span
                key={GREETINGS[index]}
                layout
                initial={{ y: "110%", opacity: 0 }}
                animate={{ y: "0%", opacity: 1 }}
                exit={{ y: "-110%", opacity: 0 }}
                transition={{ type: "spring", stiffness: 260, damping: 26 }}
                className="inline-block"
              >
                {GREETINGS[index]},
              </motion.span>
            </AnimatePresence>
          </span>
          <motion.span layout="position">I'm Sujith S Poojary</motion.span>
        </motion.p>
      </div>
    </MotionConfig>
  );
}
