import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useRef, useState, type ReactNode } from "react";
import { ParticleText } from "@/components/ParticleText";
import { WaveLoop } from "@/components/WaveLoop";
import { RunnerGame } from "@/components/RunnerGame";
import { BEHANCE, EMAIL, LINKEDIN, projects, skills, tools } from "@/components/portfolio-data";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Sujith S Poojary — UI/UX Designer, Mangalore" },
      { name: "description", content: "Portfolio of Sujith S Poojary, UI/UX designer crafting user-centric products: research, wireframes, prototypes and design systems." },
      { property: "og:title", content: "Sujith S Poojary — UI/UX Designer" },
      { property: "og:description", content: "Playful, user-centric UI/UX design work by Sujith S Poojary." },
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
  return (
    <main className="overflow-x-hidden">
      <Nav />
      <Hero />
      <About />
      <Projects />
      <WaveLoop />
      <Contact />
      <Footer />
    </main>
  );
}

function Nav() {
  return (
    <header className="fixed inset-x-0 top-4 z-40 flex justify-center px-4">
      <nav className="flex items-center gap-1 rounded-full border bg-card/80 p-1.5 shadow-soft backdrop-blur">
        <a href="#top" aria-label="Back to top" className="block shrink-0 rounded-full transition-transform duration-500 ease-[cubic-bezier(.34,1.8,.5,1)] hover:scale-110"><img src="https://i.pravatar.cc/112?img=12" alt="Sujith S Poojary" width={56} height={56} className="h-14 w-14 rounded-full object-cover ring-2 ring-primary/40 ring-offset-2 ring-offset-card shadow-soft" /></a>
        {["about", "work", "contact"].map((s) => (
          <a key={s} href={`#${s}`} className="rounded-full px-4 py-2 text-sm font-semibold capitalize transition-colors hover:bg-muted">{s}</a>
        ))}
      </nav>
    </header>
  );
}

function Hero() {
  return (
    <section id="top" className="relative flex min-h-screen flex-col items-center justify-center px-4 pt-20">
      <p className="reveal mb-2 rounded-full border bg-card px-4 py-1.5 text-sm font-semibold shadow-soft">👋 Hi, I'm Sujith S Poojary</p>
      <div className="h-[46vh] w-full max-w-7xl">
        <ParticleText text="UI/UX DESIGNER" src="/logo.svg" />
      </div>
      <p className="reveal max-w-md text-center text-muted-foreground">Hover the letters. Designing calm, curious interfaces from Mangalore, India.</p>
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
        <h2 className="mt-2 text-4xl font-extrabold md:text-6xl">I make things <span className="rounded-2xl bg-accent px-3">feel</span> simple.</h2>
        <p className="mt-6 max-w-xl text-lg text-muted-foreground">
          Aspiring UI/UX designer obsessed with user-centric design — from user research and wireframes to clickable prototypes. Currently a Junior UI/UX Designer at <b className="text-foreground">CocoGrid</b>, Mangalore.
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
          <a href="/resume.pdf" download className="mt-6 flex items-center justify-center gap-2 rounded-full bg-foreground py-3.5 font-semibold text-background transition-transform hover:scale-[1.03]">Download Resume ↓</a>
          <ul className="mt-6 space-y-2 text-sm font-semibold">
            <li><a className="flex justify-between rounded-xl px-3 py-2 hover:bg-muted" href={`mailto:${EMAIL}`}>Email <span className="text-muted-foreground">↗</span></a></li>
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
    <div className="reveal" style={{ transitionDelay: `${(i % 2) * 120}ms` }}>
      <button ref={ref} onClick={onOpen} onMouseMove={move} onMouseLeave={() => (ref.current!.style.transform = "")}
        className="group w-full rounded-3xl border bg-card p-3 text-left shadow-soft transition-[transform,box-shadow] duration-300 ease-out hover:shadow-lift">
        <div className={`relative grid h-64 place-items-center overflow-hidden rounded-2xl ${p.grad}`}>
          <div className="transition-transform duration-500 group-hover:scale-105 group-hover:-rotate-2"><Device kind={p.device} /></div>
          <span className="absolute right-4 top-4 translate-x-[140%] rounded-full bg-foreground px-4 py-2 text-sm font-semibold text-background transition-transform duration-300 group-hover:translate-x-0">View Project ↗</span>
        </div>
        <div className="p-4">
          <h3 className="text-2xl font-bold">{p.title} <span className="font-sans text-base font-medium text-muted-foreground">— {p.sub}</span></h3>
          <p className="mt-1 text-muted-foreground">{p.desc}</p>
          <div className="mt-4 flex flex-wrap gap-2">{p.tags.map((t) => <span key={t} className="rounded-full bg-muted px-3 py-1 text-xs font-semibold">{t}</span>)}</div>
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
        <p className="hidden text-muted-foreground md:block">06 case studies</p>
      </div>
      <div className="mt-12 grid gap-8 md:grid-cols-2">
        {projects.map((p, i) => <ProjectCard key={p.title} p={p} i={i} onOpen={() => setOpen(i)} />)}
      </div>
      {p && (
        <div role="dialog" aria-modal="true" aria-label={p.title} onClick={() => setOpen(null)} className="fixed inset-0 z-50 grid place-items-center bg-foreground/40 p-4 backdrop-blur-sm animate-fade-in">
          <div onClick={(e) => e.stopPropagation()} className="w-full max-w-2xl rounded-3xl bg-card p-3 shadow-lift animate-scale-in">
            <div className={`grid h-56 place-items-center rounded-2xl ${p.grad}`}><Device kind={p.device} /></div>
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
  const submit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const f = new FormData(e.currentTarget);
    window.location.href = `mailto:${EMAIL}?subject=${encodeURIComponent(`Project enquiry from ${f.get("name")}`)}&body=${encodeURIComponent(`${f.get("message")}\n\n— ${f.get("name")} (${f.get("email")})`)}`;
    setSent(true);
  };
  return (
    <section id="contact" className="mx-auto max-w-4xl px-6 py-28 text-center">
      <p className="reveal font-semibold text-primary">Got a freelance project?</p>
      <h2 className="reveal mt-2 text-5xl font-extrabold md:text-7xl">Let's work together 🎈</h2>
      <p className="reveal mx-auto mt-5 max-w-lg text-lg text-muted-foreground">Open to freelance UI/UX work, product collaborations and friendly design chats.</p>
      <form onSubmit={submit} className="reveal mx-auto mt-12 grid max-w-2xl gap-6 rounded-3xl border bg-card p-8 text-left shadow-soft md:grid-cols-2">
        <div className="float-field"><input id="name" name="name" required placeholder=" " /><label htmlFor="name">Your name</label></div>
        <div className="float-field"><input id="email" name="email" type="email" required placeholder=" " /><label htmlFor="email">Email</label></div>
        <div className="float-field md:col-span-2"><textarea id="message" name="message" rows={3} required placeholder=" " /><label htmlFor="message">Tell me about your project</label></div>
        <button className="rounded-full bg-primary py-4 font-semibold text-primary-foreground transition-transform hover:scale-[1.02] md:col-span-2">{sent ? "Opening your mail app ✓" : "Send message →"}</button>
      </form>
      <div className="reveal mx-auto mt-10 grid max-w-2xl gap-3 text-left">
        <div className="flex gap-3">
          <div className="flex-1"><Magnetic href={`mailto:${EMAIL}`} label="Email" value="Say hello" /></div>
          <button onClick={() => { navigator.clipboard.writeText(EMAIL); setCopied(true); setTimeout(() => setCopied(false), 1600); }}
            className="shrink-0 rounded-2xl border bg-card px-5 font-semibold transition-colors hover:bg-accent">{copied ? "Copied!" : "Copy"}</button>
        </div>
        <Magnetic href={LINKEDIN} label="LinkedIn" value="Connect" />
        <Magnetic href={BEHANCE} label="Behance" value="See shots" />
        <Magnetic href="#work" label="Portfolio" value="Case studies" />
      </div>
    </section>
  );
}

function Footer() {
  return (
    <footer className="mx-auto max-w-6xl px-6 pb-10">
      <RunnerGame />
      <p className="mt-6 text-center text-sm text-muted-foreground">© 2026 Sujith S Poojary — Designed & built with ♥</p>
    </footer>
  );
}
