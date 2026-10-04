import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useRef, useState, type ReactNode } from "react";
import { ArrowUpRight, Eye, Moon, Sun } from "lucide-react";
import { ParticleText } from "@/components/ParticleText";
import { WaveLoop } from "@/components/WaveLoop";
import { RunnerGame } from "@/components/RunnerGame";
import { SlingButton } from "@/components/SlingButton";
import { Button } from "@/components/ui/button";
import { useIsMobile } from "@/hooks/use-mobile";
import { BEHANCE, EMAIL, LINKEDIN, projects, skills, tools } from "@/components/portfolio-data";
import profileImage from "@/assets/profile image.jpg";
import resumePdf from "@/assets/Resume.pdf";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Sujith S Poojary — UI/UX Designer, Mangalore" },
      { name: "description", content: "Portfolio of Sujith S Poojary, UI/UX designer crafting user-centric products: research, wireframes, prototypes and design systems." },
      { property: "og:title", content: "Sujith S Poojary — UI/UX Designer" },
      { property: "og:description", content: "Playful, user-centric UI/UX design work by Sujith S Poojary." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Index,
});

function useReveal() {
  useEffect(() => {
    const io = new IntersectionObserver((es) => es.forEach((e) => e.isIntersecting && e.target.classList.add("is-in")), { threshold: 0.15 });
    document.querySelectorAll(".reveal").forEach((el) => io.observe(el));
    return () => io.disconnect();
  }, []);
}

function Index() {
  useReveal();
  const [theme, setTheme] = useState<"dark" | "light">("dark");
  useEffect(() => {
    const saved = window.localStorage.getItem("portfolio-theme");
    const next = saved === "light" ? "light" : "dark";
    setTheme(next);
    document.documentElement.classList.toggle("dark", next === "dark");
  }, []);
  const toggleTheme = () => {
    const next = theme === "dark" ? "light" : "dark";
    setTheme(next);
    document.documentElement.classList.toggle("dark", next === "dark");
    window.localStorage.setItem("portfolio-theme", next);
  };
  return (
    <main className="overflow-x-hidden">
      <Nav theme={theme} onToggleTheme={toggleTheme} />
      <Hero />
      <About />
      <Projects />
      <WaveLoop />
      <Contact />
      <Footer />
    </main>
  );
}

function Nav({ theme, onToggleTheme }: { theme: "dark" | "light"; onToggleTheme: () => void }) {
  return (
    <header className="fixed inset-x-0 top-4 z-40 flex justify-center px-4">
      <nav className="flex items-center gap-1 rounded-full border bg-card/80 p-1.5 shadow-soft backdrop-blur">
        <a href="#top" aria-label="Back to top" className="block shrink-0 rounded-full transition-transform duration-500 ease-[cubic-bezier(.34,1.8,.5,1)] hover:scale-110">
          <span className="block h-14 w-14 overflow-hidden rounded-full ring-2 ring-primary/40 ring-offset-2 ring-offset-card shadow-soft">
            <img
              src={profileImage}
              alt="Sujith S Poojary"
              width={56}
              height={56}
              style={{ objectPosition: "center 100%", transform: "translate(2px, -2px) scale(1.08)" }}
              className="h-14 w-14 rounded-full object-cover"
            />
          </span>
        </a>
        {["about", "work", "contact"].map((s) => (
          <a key={s} href={`#${s}`} className="rounded-full px-4 py-2 text-sm font-semibold capitalize transition-colors hover:bg-muted">{s}</a>
        ))}
        <Button type="button" variant="ghost" size="icon" onClick={onToggleTheme} aria-label={`Switch to ${theme === "dark" ? "light" : "dark"} mode`} title={`Switch to ${theme === "dark" ? "light" : "dark"} mode`} className="theme-toggle ml-1 rounded-full">
          <Sun aria-hidden className={theme === "dark" ? "theme-icon is-active" : "theme-icon"} />
          <Moon aria-hidden className={theme === "light" ? "theme-icon is-active" : "theme-icon"} />
        </Button>
      </nav>
    </header>
  );
}

function Hero() {
  return (
    <section id="top" className="relative flex min-h-screen flex-col items-center justify-center px-4 pt-20">
      <p className="reveal mb-2 rounded-full border bg-card px-4 py-1.5 text-sm font-semibold shadow-soft">👋 Hi, I'm Sujith S Poojary</p>
      <div className="h-[46vh] w-full max-w-7xl">
        <ParticleText text="UI/UX Designer" src="/logo.svg" />
      </div>
      <p className="reveal max-w-md text-center text-muted-foreground">Bringing creativity into every interface.</p>
      <a href="#about" aria-label="Scroll to about" className="absolute bottom-8 grid h-12 w-12 place-items-center rounded-full border bg-card shadow-soft animate-bob">↓</a>
    </section>
  );
}

function ScatterPill({ children }: { children: ReactNode }) {
  const [t, setT] = useState("");
  return (
    <span
      className="pill cursor-default hover:bg-accent"
      style={{ transform: t }}
      onMouseEnter={() => setT(`translate(${(Math.random() - 0.5) * 14}px, ${-6 - Math.random() * 8}px) rotate(${(Math.random() - 0.5) * 12}deg)`)}
      onMouseLeave={() => setT("")}
    >
      {children}
    </span>
  );
}

function About() {
  return (
    <section id="about" className="mx-auto grid max-w-6xl gap-10 px-6 py-28 md:grid-cols-[1.4fr_1fr]">
      <div className="reveal">
        <p className="font-semibold text-primary">About me</p>
        <h2 className="mt-2 text-4xl font-extrabold leading-[1.2] md:text-6xl">Design isn’t just<br /><span className="rounded-2xl bg-white px-3 text-black">on the screen.</span></h2>
        <p className="mt-6 max-w-xl text-lg text-muted-foreground">
          It’s in the way we interact, decide, explore, and experience everyday life. I believe good design quietly shapes these moments. As a UI/UX designer, I’m interested in creating digital experiences that feel natural, purposeful, and worth remembering.
        </p>
        <p className="mt-4 max-w-xl text-lg text-muted-foreground">
          Currently a Junior UI/UX Designer at <b className="text-foreground">CocoGrid</b>, Mangalore.
        </p>
        <h3 className="mt-10 text-sm font-bold uppercase tracking-widest text-muted-foreground">Skills</h3>
        <div className="mt-4 flex flex-wrap gap-2">{skills.map((s) => <ScatterPill key={s}>{s}</ScatterPill>)}</div>
        <h3 className="mt-8 text-sm font-bold uppercase tracking-widest text-muted-foreground">Tools</h3>
        <div className="mt-4 flex flex-wrap gap-2">
          {tools.map((t) => <ScatterPill key={t.name}><span className="text-primary" aria-hidden>{t.icon}</span>{t.name}</ScatterPill>)}
        </div>
      </div>
      <aside className="reveal self-start rounded-3xl bg-grad-mix p-1.5 shadow-lift md:rotate-2 transition-transform hover:rotate-0">
        <div className="rounded-[1.4rem] bg-card p-8">
          <div className="grid h-16 w-16 place-items-center rounded-2xl bg-grad-coral font-display text-2xl font-bold text-primary-foreground">S</div>
          <p className="mt-5 font-display text-2xl font-bold">Sujith S Poojary</p>
          <p className="text-muted-foreground">UI/UX Designer · Mangalore</p>
          <a href={resumePdf} target="_blank" rel="noreferrer" className="mt-6 flex w-full items-center justify-center gap-2 rounded-full bg-foreground py-3.5 font-semibold text-background transition-transform hover:scale-[1.03]">
            <Eye aria-hidden className="h-4 w-4" />
            View Resume
          </a>
          <ul className="mt-6 space-y-2 text-sm font-semibold">
            <li><a className="flex min-w-0 justify-between gap-3 rounded-xl px-3 py-2 hover:bg-muted" href={`mailto:${EMAIL}`}><span className="min-w-0 truncate">{EMAIL}</span><span className="text-muted-foreground">↗</span></a></li>
            <li><a className="flex justify-between rounded-xl px-3 py-2 hover:bg-muted" href={LINKEDIN} target="_blank" rel="noreferrer">LinkedIn <span className="text-muted-foreground">↗</span></a></li>
          </ul>
        </div>
      </aside>
    </section>
  );
}

function Device({ kind }: { kind: string }) {
  return kind === "phone" ? (
    <div className="h-44 w-24 rounded-[1.4rem] border-4 border-foreground bg-card p-2 shadow-lift">
      <div className="mx-auto h-1.5 w-8 rounded-full bg-foreground" />
      <div className="mt-3 space-y-2"><div className="h-8 rounded-lg bg-muted" /><div className="h-3 w-3/4 rounded bg-muted" /><div className="h-3 w-1/2 rounded bg-muted" /><div className="h-10 rounded-lg bg-accent" /></div>
    </div>
  ) : (
    <div>
      <div className="h-32 w-52 rounded-t-xl border-4 border-foreground bg-card p-2">
        <div className="flex gap-2"><div className="h-20 w-10 rounded bg-muted" /><div className="flex-1 space-y-2"><div className="h-3 rounded bg-muted" /><div className="h-10 rounded bg-accent" /><div className="h-3 w-2/3 rounded bg-muted" /></div></div>
      </div>
      <div className="mx-auto h-2.5 w-60 -translate-x-1 rounded-b-lg bg-foreground" />
    </div>
  );
}

function ProjectCard({ p, i, onOpen }: { p: (typeof projects)[number]; i: number; onOpen: () => void }) {
  const ref = useRef<HTMLButtonElement>(null);
  const move = (e: React.MouseEvent) => {
    const r = ref.current!.getBoundingClientRect();
    const x = (e.clientX - r.left) / r.width - 0.5, y = (e.clientY - r.top) / r.height - 0.5;
    ref.current!.style.transform = `perspective(900px) rotateY(${x * 10}deg) rotateX(${-y * 10}deg) translateY(-6px)`;
  };
  return (
    <div className="reveal h-full min-h-[33.5rem]" style={{ transitionDelay: `${(i % 2) * 120}ms` }}>
      <button ref={ref} onClick={onOpen} onMouseMove={move} onMouseLeave={() => (ref.current!.style.transform = "")}
        className="group flex h-full w-full flex-col rounded-3xl border bg-card p-3 text-left shadow-soft transition-[transform,box-shadow] duration-300 ease-out hover:shadow-lift">
        <div className={`relative grid aspect-4/3 place-items-center overflow-hidden rounded-2xl ${p.grad}`}>
          {p.image ? (
            <img src={p.image} alt={`${p.title} project thumbnail`} className="absolute inset-0 h-full w-full object-cover transition-transform duration-500 group-hover:scale-[1.025]" />
          ) : (
            <div className="transition-transform duration-500 group-hover:scale-105 group-hover:-rotate-2"><Device kind={p.device} /></div>
          )}
          <span className="absolute right-4 top-4 translate-x-[140%] rounded-full bg-foreground px-4 py-2 text-sm font-semibold text-background transition-transform duration-300 group-hover:translate-x-0">View Project ↗</span>
        </div>
        <div className="flex flex-1 flex-col p-4">
          <h3 className="font-display text-3xl font-bold leading-tight">{p.title}</h3>
          <p className="mt-1 font-display text-lg font-medium leading-snug text-muted-foreground">{p.sub}</p>
          <p className="mt-3 text-muted-foreground">{p.desc}</p>
          <div className="mt-auto flex flex-wrap gap-2 pt-4">{p.tags.map((t) => <span key={t} className="rounded-full bg-muted px-3 py-1 text-xs font-semibold">{t}</span>)}</div>
        </div>
      </button>
    </div>
  );
}

function Projects() {
  const [open, setOpen] = useState<number | null>(null);
  const p = open !== null ? projects[open] : null;
  useEffect(() => {
    const k = (e: KeyboardEvent) => e.key === "Escape" && setOpen(null);
    addEventListener("keydown", k); return () => removeEventListener("keydown", k);
  }, []);
  return (
    <section id="work" className="mx-auto max-w-6xl px-6 py-20">
      <div className="reveal flex items-end justify-between">
        <div><p className="font-semibold text-primary">Selected work</p><h2 className="mt-2 text-4xl font-extrabold md:text-6xl">Projects ✦</h2></div>
        <p className="hidden text-muted-foreground md:block">03 featured projects</p>
      </div>
      <div className="mt-12 grid auto-rows-fr gap-8 md:grid-cols-2">
        {projects.slice(0, 3).map((p, i) => <ProjectCard key={p.title} p={p} i={i} onOpen={() => setOpen(i)} />)}
      </div>
      <div className="mt-10 flex justify-center">
        <Link to="/work" className="inline-flex items-center gap-2 rounded-full border bg-card px-5 py-3 text-sm font-semibold transition-colors hover:bg-accent">
          Explore more projects and Behance work <ArrowUpRight aria-hidden className="h-4 w-4" />
        </Link>
      </div>
      {p && (
        <div role="dialog" aria-modal="true" aria-label={p.title} onClick={() => setOpen(null)} className="fixed inset-0 z-50 grid place-items-center bg-foreground/40 p-4 backdrop-blur-sm animate-fade-in">
          <div onClick={(e) => e.stopPropagation()} className="w-full max-w-2xl rounded-3xl bg-card p-3 shadow-lift animate-scale-in">
            <div className={`grid h-56 place-items-center overflow-hidden rounded-2xl ${p.grad}`}>
              {p.image ? <img src={p.image} alt={`${p.title} project thumbnail`} className="h-full w-full object-contain" /> : <Device kind={p.device} />}
            </div>
            <div className="p-5">
              <div className="flex items-start justify-between gap-4">
                <h3 className="text-3xl font-bold">{p.title}</h3>
                <button onClick={() => setOpen(null)} aria-label="Close" className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-muted hover:bg-accent">✕</button>
              </div>
              <p className="font-semibold text-primary">{p.sub}</p>
              <p className="mt-3 text-muted-foreground">{p.detail}</p>
              <div className="mt-4 flex flex-wrap gap-2">{p.tags.map((t) => <span key={t} className="rounded-full bg-muted px-3 py-1 text-xs font-semibold">{t}</span>)}</div>
            </div>
          </div>
        </div>
      )}
    </section>
  );
}

function Magnetic({ href, label, value }: { href: string; label: string; value: string }) {
  const ref = useRef<HTMLAnchorElement>(null);
  return (
    <a ref={ref} href={href} target={href.startsWith("http") ? "_blank" : undefined} rel="noreferrer"
      onMouseMove={(e) => { const r = ref.current!.getBoundingClientRect(); ref.current!.style.transform = `translate(${(e.clientX - r.left - r.width / 2) * 0.08}px, ${(e.clientY - r.top - r.height / 2) * 0.2}px)`; }}
      onMouseLeave={() => (ref.current!.style.transform = "")}
      className="group flex items-center justify-between rounded-2xl border bg-card px-6 py-5 transition-[transform,background] duration-300 ease-out hover:bg-accent">
      <span className="text-sm font-bold uppercase tracking-widest text-muted-foreground group-hover:text-foreground">{label}</span>
      <span className="font-display text-lg font-bold md:text-xl">{value} ↗</span>
    </a>
  );
}

function Contact() {
  const [copied, setCopied] = useState(false);
  const [sent, setSent] = useState(false);
  const [balloonPopped, setBalloonPopped] = useState(false);
  const balloonRef = useRef<HTMLSpanElement>(null);
  const arrowRef = useRef<HTMLSpanElement>(null);
  const submitButtonRef = useRef<HTMLButtonElement>(null);
  const submit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (sent) return;
    const f = new FormData(e.currentTarget);
    const mailto = `mailto:${EMAIL}?subject=${encodeURIComponent(`Project enquiry from ${f.get("name")}`)}&body=${encodeURIComponent(`${f.get("message")}\n\n— ${f.get("name")} (${f.get("email")})`)}`;
    setSent(true);

    const arrow = arrowRef.current;
    const balloon = balloonRef.current;
    const button = submitButtonRef.current;
    const start = button?.getBoundingClientRect();
    const target = balloon?.getBoundingClientRect();
    const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const openMail = () => { window.location.href = mailto; };
    const popBalloon = () => {
      setBalloonPopped(true);
      window.setTimeout(() => {
        setBalloonPopped(false);
        setSent(false);
      }, 5000);
    };

    if (!arrow || !start || !target || reducedMotion) {
      popBalloon();
      window.setTimeout(openMail, 300);
      return;
    }

    const arrowSize = 36;
    const startX = start.left + start.width / 2 - arrowSize / 2;
    const startY = start.top + start.height / 2 - arrowSize / 2;
    const targetX = target.left + target.width / 2 - arrowSize / 2;
    const targetY = target.top + target.height / 2 - arrowSize / 2;
    const animation = arrow.animate(
      [
        { opacity: 0, transform: `translate3d(${startX}px, ${startY}px, 0) rotate(-35deg) scale(.55)` },
        { opacity: 1, transform: `translate3d(${startX}px, ${startY}px, 0) rotate(-25deg) scale(1)`, offset: 0.14 },
        { opacity: 1, transform: `translate3d(${targetX}px, ${targetY}px, 0) rotate(0deg) scale(1)`, offset: 0.88 },
        { opacity: 0, transform: `translate3d(${targetX}px, ${targetY}px, 0) rotate(20deg) scale(.35)` },
      ],
      { duration: 760, easing: "cubic-bezier(0.23, 1, 0.32, 1)" },
    );
    animation.onfinish = () => {
      popBalloon();
      window.setTimeout(openMail, 420);
    };
  };
  return (
    <section id="contact" className="mx-auto max-w-4xl px-6 pt-14 pb-28 text-center">
      <p className="reveal font-semibold text-primary">Got a freelance project?</p>
      <h2 className="reveal mt-2 text-5xl font-extrabold md:text-7xl">Let's work together <span ref={balloonRef} aria-hidden="true" className={`contact-balloon${balloonPopped ? " is-popped" : ""}`}>🎈</span></h2>
      <p className="reveal mx-auto mt-5 max-w-lg text-lg text-muted-foreground">Open to freelance UI/UX work, product collaborations and friendly design chats.</p>
      <form onSubmit={submit} className="reveal mx-auto mt-12 grid max-w-2xl gap-6 rounded-3xl border bg-card p-8 text-left shadow-soft md:grid-cols-2">
        <div className="float-field"><input id="name" name="name" required placeholder=" " /><label htmlFor="name">Your name</label></div>
        <div className="float-field"><input id="email" name="email" type="email" required placeholder=" " /><label htmlFor="email">Email</label></div>
        <div className="float-field md:col-span-2"><textarea id="message" name="message" rows={3} required placeholder=" " /><label htmlFor="message">Tell me about your project</label></div>
        <button ref={submitButtonRef} disabled={sent} className="rounded-full bg-primary py-4 font-semibold text-primary-foreground transition-transform hover:scale-[1.02] disabled:cursor-wait md:col-span-2">Send message →</button>
      </form>
      <div className="reveal mx-auto mt-10 grid max-w-2xl gap-3 text-left">
        <div className="flex gap-3">
          <div className="flex-1"><Magnetic href={`mailto:${EMAIL}`} label="Email" value={EMAIL} /></div>
          <button onClick={() => { navigator.clipboard.writeText(EMAIL); setCopied(true); setTimeout(() => setCopied(false), 1600); }}
            className="shrink-0 rounded-2xl border bg-card px-5 font-semibold transition-colors hover:bg-accent">{copied ? "Copied!" : "Copy"}</button>
        </div>
        <Magnetic href={LINKEDIN} label="LinkedIn" value="Connect" />
        <Magnetic href={BEHANCE} label="Behance" value="See shots" />
      </div>
      <span ref={arrowRef} aria-hidden="true" className="contact-arrow"><ArrowUpRight size={26} strokeWidth={2.5} /></span>
    </section>
  );
}

function Footer() {
  const isMobile = useIsMobile();
  return (
    <footer className="mx-auto max-w-6xl px-6 pb-10">
      <RunnerGame />
      <div className="mt-6 flex items-center justify-end gap-3 pr-2">
        <span className="max-w-40 text-right text-xs text-muted-foreground">Drag down and release to return to top</span>
        <SlingButton onSend={() => window.scrollTo({ top: 0, behavior: "smooth" })} padColor="var(--sling-pad)" iconColor="var(--sling-icon)" accentColor="var(--sling-accent, var(--particle))" wellColor="var(--sling-well)" bandColor="var(--sling-band)" size={isMobile ? 40 : 48} strokeWidth={3} armAt={40} maxPull={110} launchSpeed={2600} recoil={0.2} flight={100} particles={8} spread={50} axis="vertical" tapSends ariaLabel="Back to top" />
      </div>
      <p className="mt-6 text-center text-sm text-muted-foreground">© 2026 Sujith S Poojary — Designed & built with ♥</p>
    </footer>
  );
}
