import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useRef, useState, type ReactNode } from "react";
import { ArrowUpRight, BriefcaseBusiness, Check, Copy } from "lucide-react";
import { ParticleText } from "@/components/ParticleText";
import { WaveLoop } from "@/components/WaveLoop";
import { RunnerGame } from "@/components/RunnerGame";
import { SlingButton } from "@/components/SlingButton";
import { ThemeSwitch } from "@/components/unlumen-ui/theme-switch";
import { AboutStack } from "@/components/AboutStack";
import { HeroPill } from "@/components/HeroPill";
import { useIsMobile } from "@/hooks/use-mobile";
import { BEHANCE, EMAIL, LINKEDIN, experience, projects, skills, tools } from "@/components/portfolio-data";
import profileImage from "@/assets/profile image.jpg";
import resumePdf from "@/assets/Resume.pdf";
import sujithAvatar from "@/assets/sujith-avatar.webp";
import emailIllustration from "@/assets/email-illustration.webp";
import linkedinIllustration from "@/assets/linkedin-illustration.webp";

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
  return (
    <main className="overflow-x-hidden">
      <Nav />
      <Hero />
      <Projects />
      <About />
      <Experience />
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
        {["work", "about", "contact"].map((s) => (
          <a key={s} href={`#${s}`} className="rounded-full px-4 py-2 text-sm font-semibold capitalize transition-colors hover:bg-muted">{s}</a>
        ))}
        <ThemeSwitch className="ml-1" />
      </nav>
    </header>
  );
}

function Hero() {
  return (
    // Phones: the section hugs its content (no full-screen height, no centring) so the gaps between the nav,
    // the greeting pill, the heading and the tagline stay tight; the heading box is only as tall as the logo.
    <section id="top" className="relative flex flex-col items-center justify-center px-4 pt-20 md:min-h-screen max-md:min-h-0 max-md:justify-start max-md:pb-24 max-md:pt-[7.25rem]">
      <HeroPill />
      {/* Phones: the heading box is 1.5rem wider than the padded column (it bleeds 0.75rem each side) so the logo can run closer to the screen edges. */}
      <div className="h-28 w-full max-w-7xl max-md:w-[calc(100%+1.5rem)] md:h-[46vh]">
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
    <section id="about" className="mx-auto grid max-w-6xl gap-10 px-6 pt-8 pb-28 md:grid-cols-[1.4fr_1fr] md:pt-28">
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
          {tools.map((t) => (
            <ScatterPill key={t.name}>
              <svg viewBox="0 0 24 24" aria-hidden className="h-4 w-4 shrink-0 fill-current text-primary">
                <path d={t.path} fillRule={"evenOdd" in t ? "evenodd" : undefined} />
              </svg>
              {t.name}
            </ScatterPill>
          ))}
        </div>
      </div>
      <aside className="reveal self-center py-6 md:py-0">
        <AboutStack
          cards={[
            {
              role: "UI/UX Designer · Mangalore",
              name: "Sujith S Poojary",
              description: "Junior UI/UX Designer at CocoGrid, crafting interfaces that feel natural and purposeful.",
              imageSrc: sujithAvatar,
              imageAlt: "Illustrated portrait of Sujith S Poojary",
              isFeatured: true,
              ctaLabel: "View resume",
              ctaHref: resumePdf,
            },
            {
              role: "Say hello",
              name: "Email me",
              description: "Have a project or an idea to explore? My inbox is always open.",
              imageSrc: emailIllustration,
              imageAlt: "Illustration of Sujith opening an envelope",
              ctaLabel: "Send email",
              ctaHref: `mailto:${EMAIL}`,
            },
            {
              role: "Let's connect",
              name: "LinkedIn",
              description: "Follow along for design work, collaborations and friendly chats.",
              imageSrc: linkedinIllustration,
              imageAlt: "Illustration of Sujith pointing at a LinkedIn badge",
              ctaLabel: "Connect",
              ctaHref: LINKEDIN,
            },
          ]}
        />
      </aside>
    </section>
  );
}

function Experience() {
  return (
    <section id="experience" className="mx-auto max-w-6xl px-6 pb-16 md:pb-20">
      <p className="reveal font-semibold text-primary">Career</p>
      <h2 className="reveal mt-2 text-4xl font-extrabold md:text-6xl">Work experience</h2>
      <div className="reveal mt-8 flex max-w-3xl items-start gap-4 rounded-2xl border bg-card p-5 md:gap-5 md:p-6">
        <span aria-hidden className="grid h-16 w-16 shrink-0 place-items-center rounded-xl bg-foreground text-background md:h-[4.5rem] md:w-[4.5rem]">
          <BriefcaseBusiness className="h-7 w-7" strokeWidth={1.75} />
        </span>
        <div className="min-w-0">
          <h3 className="font-display text-2xl font-bold leading-tight tracking-tight md:text-[1.75rem]">{experience.role}</h3>
          <p className="mt-2 font-display text-lg font-bold md:text-xl">{experience.company} · {experience.location}</p>
          <p className="mt-2 text-base text-muted-foreground">{experience.period}</p>
          {/* LinkedIn-style timeline: a vertical line joins the roles held here, earliest first, the current one lit. */}
          <p className="mt-5 text-xs font-bold uppercase tracking-widest text-muted-foreground">Career progression</p>
          <ol className="mt-3 space-y-3 border-l border-border pl-5">
            {experience.progression.map((step, index) => {
              const current = index === experience.progression.length - 1;
              return (
                <li key={step} className={`relative text-base ${current ? "font-semibold text-foreground" : "text-muted-foreground"}`}>
                  <span aria-hidden className={`absolute -left-[1.6rem] top-[0.4rem] h-2.5 w-2.5 rounded-full border-2 ${current ? "border-foreground bg-foreground" : "border-muted-foreground bg-card"}`} />
                  {step}
                </li>
              );
            })}
          </ol>
        </div>
      </div>
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

function ProjectCard({ p, i }: { p: (typeof projects)[number]; i: number }) {
  const ref = useRef<HTMLAnchorElement>(null);
  const move = (e: React.MouseEvent) => {
    const r = ref.current!.getBoundingClientRect();
    const x = (e.clientX - r.left) / r.width - 0.5, y = (e.clientY - r.top) / r.height - 0.5;
    ref.current!.style.transform = `perspective(900px) rotateY(${x * 10}deg) rotateX(${-y * 10}deg) translateY(-6px)`;
  };
  return (
    <div className="reveal h-full min-h-[33.5rem]" style={{ transitionDelay: `${(i % 2) * 120}ms` }}>
      <a ref={ref} href={p.href} target="_blank" rel="noreferrer" aria-label={`${p.title} — view on Behance (opens in a new tab)`}
        onMouseMove={move} onMouseLeave={() => (ref.current!.style.transform = "")}
        className="group flex h-full w-full flex-col rounded-3xl border bg-card p-3 text-left shadow-soft transition-[transform,box-shadow] duration-300 ease-out hover:shadow-lift">
        {/* Image cards skip the gradient: it bleeds through the anti-aliased rounded edge as a light hairline */}
        <div className={`relative isolate grid aspect-4/3 place-items-center overflow-hidden rounded-2xl ${p.image ? "bg-black" : p.grad}`}>
          {p.image ? (
            <img src={p.image} alt={`${p.title} project thumbnail`} className="absolute inset-0 h-full w-full object-cover transition-transform duration-500 group-hover:scale-[1.025]" />
          ) : (
            <div className="transition-transform duration-500 group-hover:scale-105 group-hover:-rotate-2"><Device kind={p.device} /></div>
          )}
          {/* Subtle 1px stroke drawn above the image (an inset ring on the wrapper would be hidden beneath it) */}
          <span aria-hidden className="pointer-events-none absolute inset-0 rounded-2xl ring-[0.5px] ring-inset ring-white/12" />
          <span className="absolute right-4 top-4 inline-flex translate-x-[140%] items-center gap-1.5 rounded-full bg-foreground px-4 py-2 text-sm font-semibold text-background transition-transform duration-300 group-hover:translate-x-0">View Project <ArrowUpRight aria-hidden className="h-4 w-4" /></span>
        </div>
        <div className="flex flex-1 flex-col p-4">
          <h3 className="font-display text-3xl font-bold leading-tight">{p.title}</h3>
          <p className="mt-1 font-display text-lg font-medium leading-snug text-muted-foreground">{p.sub}</p>
          <p className="mt-3 text-muted-foreground">{p.desc}</p>
          <div className="mt-auto flex flex-wrap gap-2 pt-4">{p.tags.map((t) => <span key={t} className="rounded-full bg-muted px-3 py-1 text-xs font-semibold">{t}</span>)}</div>
        </div>
      </a>
    </div>
  );
}

function Projects() {
  return (
    <section id="work" className="mx-auto max-w-6xl px-6 py-20 max-md:pt-4">
      <div className="reveal flex items-end justify-between">
        <div><p className="font-semibold text-primary">Selected work</p><h2 className="mt-2 text-4xl font-extrabold md:text-6xl">Projects ✦</h2></div>
        <p className="hidden text-muted-foreground md:block">03 featured projects</p>
      </div>
      <div className="mt-12 grid auto-rows-fr gap-8 md:grid-cols-2">
        {projects.slice(0, 3).map((p, i) => <ProjectCard key={p.title} p={p} i={i} />)}
      </div>
      <div className="mt-10 flex justify-center">
        <Link to="/work" className="inline-flex items-center gap-2 rounded-full border bg-card px-5 py-3 text-sm font-semibold transition-colors hover:bg-accent">
          Explore My Work <ArrowUpRight aria-hidden className="h-4 w-4" />
        </Link>
      </div>
    </section>
  );
}

function Magnetic({ href, label, value, className = "" }: { href: string; label: string; value: string; className?: string }) {
  const ref = useRef<HTMLAnchorElement>(null);
  return (
    <a ref={ref} href={href} target={href.startsWith("http") ? "_blank" : undefined} rel="noreferrer"
      onMouseMove={(e) => { const r = ref.current!.getBoundingClientRect(); ref.current!.style.transform = `translate(${(e.clientX - r.left - r.width / 2) * 0.08}px, ${(e.clientY - r.top - r.height / 2) * 0.2}px)`; }}
      onMouseLeave={() => (ref.current!.style.transform = "")}
      className={`group flex h-full flex-col items-start justify-center gap-1 rounded-2xl border bg-card px-4 py-4 transition-[transform,background] duration-300 ease-out hover:bg-accent sm:flex-row sm:items-center sm:justify-between sm:gap-4 sm:px-6 sm:py-5 ${className}`}>
      <span className="text-xs font-bold uppercase tracking-widest text-muted-foreground group-hover:text-foreground sm:text-sm">{label}</span>
      <span className="inline-flex min-w-0 items-center gap-2 font-display text-base font-bold wrap-anywhere sm:text-lg md:text-xl">{value} <ArrowUpRight aria-hidden className="h-4 w-4 shrink-0" /></span>
    </a>
  );
}

function Contact() {
  const [copied, setCopied] = useState(false);
  const [sent, setSent] = useState(false);
  const copyEmail = () => { navigator.clipboard.writeText(EMAIL); setCopied(true); setTimeout(() => setCopied(false), 1600); };
  const submit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (sent) return;
    const f = new FormData(e.currentTarget);
    const mailto = `mailto:${EMAIL}?subject=${encodeURIComponent(`Project enquiry from ${f.get("name")}`)}&body=${encodeURIComponent(`${f.get("message")}\n\n— ${f.get("name")} (${f.get("email")})`)}`;
    setSent(true);
    window.location.href = mailto;
    window.setTimeout(() => setSent(false), 3000);
  };
  return (
    <section id="contact" className="mx-auto max-w-4xl px-6 pt-14 pb-28 text-center">
      <p className="reveal font-semibold text-primary">Have something in mind?</p>
      <h2 className="reveal mt-2 text-5xl font-extrabold md:text-7xl">Let's make something happen.</h2>
      <p className="reveal mx-auto mt-5 max-w-lg text-lg text-muted-foreground">Have a project, an idea to explore, or just want to talk design? My inbox is open.</p>
      <form onSubmit={submit} className="reveal mx-auto mt-12 grid max-w-2xl gap-6 rounded-3xl border bg-card p-8 text-left shadow-soft md:grid-cols-2">
        <div className="float-field"><input id="name" name="name" required placeholder=" " /><label htmlFor="name">Your name</label></div>
        <div className="float-field"><input id="email" name="email" type="email" required placeholder=" " /><label htmlFor="email">Email address</label></div>
        <div className="float-field md:col-span-2"><textarea id="message" name="message" rows={3} required placeholder=" " /><label htmlFor="message">What's on your mind?</label></div>
        <button disabled={sent} className="inline-flex items-center justify-center gap-2 rounded-full bg-primary py-4 font-semibold text-primary-foreground transition-transform hover:scale-[1.02] disabled:cursor-wait md:col-span-2">Let's talk <ArrowUpRight aria-hidden className="h-4 w-4" /></button>
      </form>
      <div className="reveal mx-auto mt-10 grid max-w-2xl gap-3 text-left">
        <div className="flex gap-3">
          {/* On mobile the copy button sits inside the email card, below the address; pb-16 reserves its space */}
          <div className="relative min-w-0 flex-1">
            <Magnetic href={`mailto:${EMAIL}`} label="Email" value={EMAIL} className="pb-16 sm:pb-5" />
            <button type="button" onClick={copyEmail} aria-label={copied ? "Email copied" : "Copy email"}
              className="absolute bottom-4 left-4 inline-flex items-center gap-1.5 rounded-full border bg-background px-3 py-1.5 text-xs font-semibold transition-colors hover:bg-accent sm:hidden">
              {copied ? <Check aria-hidden className="h-3.5 w-3.5" /> : <Copy aria-hidden className="h-3.5 w-3.5" />}
              {copied ? "Copied!" : "Copy"}
            </button>
          </div>
          <button type="button" onClick={copyEmail}
            className="hidden shrink-0 rounded-2xl border bg-card px-5 font-semibold transition-colors hover:bg-accent sm:block">{copied ? "Copied!" : "Copy"}</button>
        </div>
        <Magnetic href={LINKEDIN} label="LinkedIn" value="Connect" />
        <Magnetic href={BEHANCE} label="Behance" value="See shots" />
      </div>
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
      <p className="mt-6 text-center text-sm text-muted-foreground">No pixels were harmed. Many were moved. © 2026 - Sujith S Poojary</p>
    </footer>
  );
}
