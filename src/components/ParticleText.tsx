import { useEffect, useRef, useState } from "react";

// Hero heading: clean solid type. On hover a black hole opens at the cursor: the type around it hands over to
// particles sampled from its own pixels, and a radial force field (vertex shader) bulges those particles away
// from the centre, strongest there and falling off smoothly. Away from the cursor the heading stays solid.
// Positions are a pure function of each particle's home, the smoothed cursor and the eased hover progress, so
// nothing drifts or builds up velocity, and leaving always restores the exact original type.

const LATTICE = 2; // css px between sampled particles (each is jittered inside its cell, so no grid shows)
const POINT = 1; // particle size in css px (rounded to whole device pixels so each dot renders at full colour)
const HOVER_PAD = 10; // css px around the text box that still counts as hovering

// Where the type turns into particles, as multiples of the void radius: solid outside OUTER, particles inside INNER.
const INNER = 1.0, OUTER = 1.06;

const PARTICLE_VERTEX = `
attribute vec2 aHome;
uniform vec2 uSize;      // canvas size, css px
uniform vec2 uMouse;     // void centre, css px
uniform float uRadius;   // void radius, css px
uniform float uStrength; // 0..1
uniform float uPoint;    // point size, device px
varying float vAlpha;
void main() {
  vec2 d = aHome - uMouse;
  float dist = length(d);
  vec2 dir = dist > 0.0001 ? d / dist : vec2(0.0, -1.0);
  // Gaussian push: displaced distance = dist + A * exp(-(dist/R)^2). A = 0.6 R stays monotonic, so particles
  // bulge outward smoothly around a clear void instead of piling up in a ring.
  float g = exp(-(dist * dist) / (uRadius * uRadius));
  float push = uStrength * 0.6 * uRadius * g;
  vec2 p = aHome + dir * push + vec2(-dir.y, dir.x) * push * 0.12;
  vec2 clip = p / uSize * 2.0 - 1.0;
  gl_Position = vec4(clip.x, -clip.y, 0.0, 1.0);
  gl_PointSize = uPoint;
  // Particles exist only where the solid type has handed over to them (by home distance, matching the mask).
  vAlpha = uStrength * (1.0 - smoothstep(${INNER.toFixed(2)} * uRadius, ${OUTER.toFixed(2)} * uRadius, dist));
}`;
const PARTICLE_FRAGMENT = `
precision mediump float;
uniform vec3 uColor;
varying float vAlpha;
void main() {
  // Crisp dots in exactly the heading's colour; only the handover (vAlpha) fades them.
  gl_FragColor = vec4(uColor * vAlpha, vAlpha);
}`;
// The solid type as a textured quad, hidden around the cursor exactly where the particles take over.
const SOLID_VERTEX = `
attribute vec2 aCorner;
varying vec2 vUv;
void main() {
  vUv = aCorner;
  gl_Position = vec4(aCorner.x * 2.0 - 1.0, 1.0 - aCorner.y * 2.0, 0.0, 1.0);
}`;
const SOLID_FRAGMENT = `
precision mediump float;
uniform sampler2D uType;
uniform vec2 uSize;
uniform vec2 uMouse;
uniform float uRadius;
uniform float uStrength;
varying vec2 vUv;
void main() {
  float dist = length(vUv * uSize - uMouse);
  float keep = mix(1.0, smoothstep(${INNER.toFixed(2)} * uRadius, ${OUTER.toFixed(2)} * uRadius, dist), uStrength);
  gl_FragColor = texture2D(uType, vUv) * keep;
}`;

const clamp01 = (v: number) => (v < 0 ? 0 : v > 1 ? 1 : v);
const smoothstep = (a: number, b: number, v: number) => {
  const t = clamp01((v - a) / (b - a));
  return t * t * (3 - 2 * t);
};
// Exponential approach that behaves the same at any frame rate (rate is per 60fps frame).
const ease = (rate: number, frames: number) => 1 - Math.pow(1 - rate, frames);

function themeColor() {
  const value = getComputedStyle(document.documentElement).getPropertyValue("--particle").trim() || "#fff";
  const probe = document.createElement("canvas").getContext("2d");
  if (!probe) return [1, 1, 1] as const;
  probe.fillStyle = "#fff";
  probe.fillStyle = value;
  probe.fillRect(0, 0, 1, 1);
  const [r = 255, g = 255, b = 255] = probe.getImageData(0, 0, 1, 1).data;
  return [r / 255, g / 255, b / 255] as const;
}

const PHONE = "(max-width: 767px)";

export function ParticleText({ text, src }: { text: string; src?: string }) {
  const solidRef = useRef<HTMLCanvasElement>(null);
  // On phones the heading is a plain solid logo: no hover effect, and no WebGL context or particle buffer.
  const [interactive, setInteractive] = useState(() => typeof window === "undefined" || !window.matchMedia(PHONE).matches);
  useEffect(() => {
    const query = window.matchMedia(PHONE);
    const update = () => setInteractive(!query.matches);
    update();
    query.addEventListener("change", update);
    return () => query.removeEventListener("change", update);
  }, []);
  const glRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const solid = solidRef.current, glCanvas = glRef.current;
    const ctx = solid?.getContext("2d");
    if (!solid || !glCanvas || !ctx) return;
    const reduceMotion = !interactive || window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const gl = reduceMotion ? null : glCanvas.getContext("webgl", { premultipliedAlpha: true, antialias: false });

    let width = 0, height = 0, dpr = 1, count = 0, loaded = false;
    let image: HTMLImageElement | null = null;
    const box = { x: 0, y: 0, w: 0, h: 0 };
    let color: readonly [number, number, number] = [1, 1, 1];

    // Two WebGL programs (particles, masked solid type); without WebGL or under reduced motion the 2D type stays.
    type Prog = { program: WebGLProgram; u: Record<string, WebGLUniformLocation | null> };
    let particles: Prog | null = null, type: Prog | null = null;
    let particleBuffer: WebGLBuffer | null = null, quadBuffer: WebGLBuffer | null = null, texture: WebGLTexture | null = null;
    const makeProgram = (vertex: string, fragment: string, uniforms: string[]): Prog | null => {
      if (!gl) return null;
      const program = gl.createProgram()!;
      for (const [kind, source] of [[gl.VERTEX_SHADER, vertex], [gl.FRAGMENT_SHADER, fragment]] as const) {
        const shader = gl.createShader(kind)!;
        gl.shaderSource(shader, source);
        gl.compileShader(shader);
        if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) console.warn("ParticleText: shader failed", gl.getShaderInfoLog(shader));
        gl.attachShader(program, shader);
      }
      gl.linkProgram(program);
      if (!gl.getProgramParameter(program, gl.LINK_STATUS)) { console.warn("ParticleText: program failed", gl.getProgramInfoLog(program)); return null; }
      return { program, u: Object.fromEntries(uniforms.map((name) => [name, gl.getUniformLocation(program, name)])) };
    };
    if (gl) {
      particles = makeProgram(PARTICLE_VERTEX, PARTICLE_FRAGMENT, ["uSize", "uMouse", "uRadius", "uStrength", "uPoint", "uColor"]);
      type = makeProgram(SOLID_VERTEX, SOLID_FRAGMENT, ["uType", "uSize", "uMouse", "uRadius", "uStrength"]);
      particleBuffer = gl.createBuffer();
      quadBuffer = gl.createBuffer();
      gl.bindBuffer(gl.ARRAY_BUFFER, quadBuffer);
      gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([0, 0, 1, 0, 0, 1, 1, 1]), gl.STATIC_DRAW);
      texture = gl.createTexture();
      gl.enable(gl.BLEND);
      gl.blendFunc(gl.ONE, gl.ONE_MINUS_SRC_ALPHA);
    }
    const ready = () => !!(gl && particles && type);

    // Interaction state: hover eases 0 → 1 → 0; the void centre follows the pointer smoothly.
    let inside = false, hover = 0, raf = 0, last = 0;
    const pointer = { x: 0, y: 0 }, centre = { x: 0, y: 0 };

    const paintSolid = () => {
      color = themeColor();
      const [r, g, b] = color;
      ctx.setTransform(1, 0, 0, 1, 0, 0);
      ctx.clearRect(0, 0, solid.width, solid.height);
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      ctx.globalCompositeOperation = "source-over";
      if (image) {
        ctx.drawImage(image, box.x, box.y, box.w, box.h);
      } else {
        const lines = width < 700 && text.includes(" ") ? text.split(" ") : [text];
        const size = lines.length > 1 ? Math.min(width / 6.2, height / (lines.length * 1.1)) : Math.min(width / 8.6, height * 0.7);
        ctx.font = `800 ${size}px "Bricolage Grotesque", sans-serif`;
        ctx.textAlign = "center";
        ctx.textBaseline = "middle";
        ctx.fillStyle = "#fff";
        lines.forEach((line, i) => ctx.fillText(line, width / 2, height / 2 + (i - (lines.length - 1) / 2) * size));
      }
      ctx.globalCompositeOperation = "source-in";
      ctx.fillStyle = `rgb(${r * 255} ${g * 255} ${b * 255})`;
      ctx.fillRect(0, 0, width, height);
      ctx.globalCompositeOperation = "source-over";
      // The same pixels become the WebGL type texture, so the masked type matches the 2D type exactly.
      if (gl && texture) {
        gl.bindTexture(gl.TEXTURE_2D, texture);
        gl.pixelStorei(gl.UNPACK_PREMULTIPLY_ALPHA_WEBGL, true);
        gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, solid);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
      }
    };

    const build = () => {
      dpr = Math.min(window.devicePixelRatio || 1, 2);
      width = solid.clientWidth;
      height = solid.clientHeight;
      if (!width || !height) return false;
      for (const canvas of [solid, glCanvas]) {
        canvas.width = Math.round(width * dpr);
        canvas.height = Math.round(height * dpr);
      }
      const iw = image?.naturalWidth || 1175, ih = image?.naturalHeight || 205;
      // The logo fills 90% of the box on desktop and 98% on phones, where every pixel of width counts.
      const scale = Math.min((width * (width < 700 ? 0.98 : 0.9)) / iw, (height * 0.8) / ih);
      box.w = image ? iw * scale : width * (width < 700 ? 0.98 : 0.9);
      box.h = image ? ih * scale : height * 0.8;
      box.x = (width - box.w) / 2;
      box.y = (height - box.h) / 2;
      paintSolid();

      // Particles come from the rendered heading's own pixels: every glyph, on a fine jittered lattice
      // (a seeded generator keeps the layout identical on every rebuild, and no moiré forms when it bulges).
      if (gl && ready()) {
        const pixels = ctx.getImageData(0, 0, solid.width, solid.height).data;
        const data: number[] = [];
        let seed = 1;
        const random = () => ((seed = (seed * 16807) % 2147483647) - 1) / 2147483646;
        for (let gy = box.y; gy < box.y + box.h; gy += LATTICE) {
          for (let gx = box.x; gx < box.x + box.w; gx += LATTICE) {
            const x = gx + random() * LATTICE, y = gy + random() * LATTICE;
            if ((pixels[(Math.floor(y * dpr) * solid.width + Math.floor(x * dpr)) * 4 + 3] ?? 0) > 60) data.push(x, y);
          }
        }
        count = data.length / 2;
        gl.bindBuffer(gl.ARRAY_BUFFER, particleBuffer);
        gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(data), gl.STATIC_DRAW);
        gl.viewport(0, 0, glCanvas.width, glCanvas.height);
      }
      return true;
    };

    const render = () => {
      // At rest the exact 2D type shows; while the effect is live WebGL draws the same type, masked around
      // the void, plus the particles that take over there. The void eases in and out with the hover.
      const live = ready() && hover > 0.001;
      solid.style.opacity = live ? "0" : "1";
      if (!gl || !ready()) return;
      gl.clearColor(0, 0, 0, 0);
      gl.clear(gl.COLOR_BUFFER_BIT);
      if (!live) return;
      const strength = smoothstep(0, 1, hover);
      const radius = width < 700 ? 60 : 100;

      gl.useProgram(type!.program);
      gl.bindBuffer(gl.ARRAY_BUFFER, quadBuffer);
      const corner = gl.getAttribLocation(type!.program, "aCorner");
      gl.enableVertexAttribArray(corner);
      gl.vertexAttribPointer(corner, 2, gl.FLOAT, false, 0, 0);
      gl.activeTexture(gl.TEXTURE0);
      gl.bindTexture(gl.TEXTURE_2D, texture);
      gl.uniform1i(type!.u["uType"]!, 0);
      gl.uniform2f(type!.u["uSize"]!, width, height);
      gl.uniform2f(type!.u["uMouse"]!, centre.x, centre.y);
      gl.uniform1f(type!.u["uRadius"]!, radius);
      gl.uniform1f(type!.u["uStrength"]!, strength);
      gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
      gl.disableVertexAttribArray(corner);

      gl.useProgram(particles!.program);
      gl.bindBuffer(gl.ARRAY_BUFFER, particleBuffer);
      const home = gl.getAttribLocation(particles!.program, "aHome");
      gl.enableVertexAttribArray(home);
      gl.vertexAttribPointer(home, 2, gl.FLOAT, false, 0, 0);
      gl.uniform2f(particles!.u["uSize"]!, width, height);
      gl.uniform2f(particles!.u["uMouse"]!, centre.x, centre.y);
      gl.uniform1f(particles!.u["uRadius"]!, radius);
      gl.uniform1f(particles!.u["uStrength"]!, strength);
      gl.uniform1f(particles!.u["uPoint"]!, Math.max(1, Math.round(POINT * dpr)));
      gl.uniform3f(particles!.u["uColor"]!, color[0], color[1], color[2]);
      gl.drawArrays(gl.POINTS, 0, count);
      gl.disableVertexAttribArray(home);
    };

    const frame = (now: number) => {
      raf = 0;
      const frames = last ? Math.min(now - last, 50) / (1000 / 60) : 1;
      last = now;
      hover += ((inside ? 1 : 0) - hover) * ease(inside ? 0.16 : 0.1, frames);
      const follow = ease(0.25, frames);
      centre.x += (pointer.x - centre.x) * follow;
      centre.y += (pointer.y - centre.y) * follow;
      if (!inside && hover < 0.002) { hover = 0; last = 0; render(); return; }
      render();
      raf = requestAnimationFrame(frame);
    };
    const run = () => { if (!raf) raf = requestAnimationFrame(frame); };

    const onMove = (event: PointerEvent) => {
      if (!loaded || !ready()) return;
      const bounds = glCanvas.getBoundingClientRect();
      const x = event.clientX - bounds.left, y = event.clientY - bounds.top;
      const over = x > box.x - HOVER_PAD && x < box.x + box.w + HOVER_PAD && y > box.y - HOVER_PAD && y < box.y + box.h + HOVER_PAD;
      // Start the void exactly at the pointer when the effect is idle, so it never sweeps in from elsewhere.
      if (over && !inside && hover < 0.01) { centre.x = x; centre.y = y; }
      if (over) { pointer.x = x; pointer.y = y; }
      inside = over;
      run();
    };
    const onLeave = () => { inside = false; run(); };
    const onUp = (event: PointerEvent) => { if (event.pointerType !== "mouse") onLeave(); };

    const start = () => {
      loaded = build();
      render();
    };
    if (src) {
      image = new Image();
      image.onload = start;
      image.onerror = () => { image = null; document.fonts.ready.then(start); };
      image.src = src;
    } else {
      document.fonts.ready.then(start);
    }

    const resizeObserver = new ResizeObserver(() => { if (loaded) { loaded = build(); render(); } });
    resizeObserver.observe(solid);
    // Theme changes recolour the type and particles in place (read from --particle at draw time).
    const themeObserver = new MutationObserver(() => { if (loaded) { paintSolid(); render(); } });
    themeObserver.observe(document.documentElement, { attributes: true, attributeFilter: ["class"] });

    glCanvas.addEventListener("pointermove", onMove);
    glCanvas.addEventListener("pointerdown", onMove);
    glCanvas.addEventListener("pointerleave", onLeave);
    glCanvas.addEventListener("pointerup", onUp);
    glCanvas.addEventListener("pointercancel", onLeave);

    return () => {
      cancelAnimationFrame(raf);
      resizeObserver.disconnect();
      themeObserver.disconnect();
      glCanvas.removeEventListener("pointermove", onMove);
      glCanvas.removeEventListener("pointerdown", onMove);
      glCanvas.removeEventListener("pointerleave", onLeave);
      glCanvas.removeEventListener("pointerup", onUp);
      glCanvas.removeEventListener("pointercancel", onLeave);
      if (image) image.onload = image.onerror = null;
      if (gl) {
        gl.deleteBuffer(particleBuffer);
        gl.deleteBuffer(quadBuffer);
        gl.deleteTexture(texture);
        if (particles) gl.deleteProgram(particles.program);
        if (type) gl.deleteProgram(type.program);
      }
    };
  }, [text, src, interactive]);

  return (
    <div role="img" aria-label={text} className="hero-particles relative h-full w-full">
      <canvas ref={solidRef} aria-hidden className="absolute inset-0 h-full w-full" />
      <canvas ref={glRef} aria-hidden className="absolute inset-0 h-full w-full" />
    </div>
  );
}
