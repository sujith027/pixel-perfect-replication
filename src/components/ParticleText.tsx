import { useEffect, useRef, useState } from "react";

// Hero heading: clean solid type, disturbed only around the cursor. The type is sampled into particles (each
// with a fixed home on a glyph, a position and a velocity) but they only wake up near the pointer. A woken
// ("released") particle is simulated with a black-hole force field (radial push + tangential swirl + a little
// turbulence, smooth falloff) and a weakened spring home, so it breaks away from its glyph, scatters, may
// overshoot the field, then settles back. While anything is released, WebGL draws the same type texture as
// the 2D canvas, erases the pixels around each released particle's home (feathered by its release amount) and
// draws the particle at its current position, so glyph and particle are one object: the type breaks apart
// rather than gaining dots on top. Everything else is the untouched type texture. When all particles are home
// the 2D type shows again and the loop sleeps.

const LATTICE = 1.1; // css px between sampled particles (jittered inside its cell so no grid shows)
const POINT = 2; // particle size in css px
const ERASE = 2.4; // css px of type removed around a released particle's home (slightly larger than POINT)
const HOVER_PAD = 10; // css px around the text box that still counts as hovering

const RADIUS = 72; // force-field radius, css px
const RELEASE_INNER = 0.4, RELEASE_OUTER = 1.5; // release ramps from none at OUTER×radius to full at INNER×radius
const RADIAL = 2300; // outward acceleration at the cursor, px/s²
const SWIRL = 2100; // tangential acceleration at the cursor, px/s²
const TURBULENCE = 520; // random-looking wobble inside the field, px/s²
const SPRING = 34; // pull back to home, 1/s²
const LOOSEN = 0.9; // how much the field slackens the spring
const DAMPING = 5.5; // velocity drag, 1/s
const STRIDE = 5; // floats per particle in the GPU buffer: x, y, homeX, homeY, release

const PARTICLE_VERTEX = `
attribute vec2 aPos;
attribute vec2 aHome;
attribute float aRelease;
uniform vec2 uSize;   // canvas size, css px
uniform float uPoint; // point size, device px
uniform float uErase; // 1.0 = draw at home as an eraser, 0.0 = draw at the current position
varying float vRelease;
void main() {
  vec2 p = uErase > 0.5 ? aHome : aPos;
  gl_Position = vec4(p.x / uSize.x * 2.0 - 1.0, 1.0 - p.y / uSize.y * 2.0, 0.0, 1.0);
  gl_PointSize = uPoint;
  vRelease = aRelease;
  if (aRelease < 0.004) gl_Position = vec4(2.0, 2.0, 2.0, 1.0); // not released: not drawn at all
}`;
const PARTICLE_FRAGMENT = `
precision mediump float;
uniform vec3 uColor;
varying float vRelease;
void main() { gl_FragColor = vec4(uColor * vRelease, vRelease); }`;
// The solid type as a textured quad: the same pixels as the 2D canvas.
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
varying vec2 vUv;
void main() { gl_FragColor = texture2D(uType, vUv); }`;

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

    // Simulation state per particle: velocity, mass (spring/return stagger) and the interleaved GPU buffer
    // (position, home, release). `release` is 0 for a particle resting on its glyph, up to 1 when fully broken away.
    let vel = new Float32Array(0), mass = new Float32Array(0), gpu = new Float32Array(0);

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
      particles = makeProgram(PARTICLE_VERTEX, PARTICLE_FRAGMENT, ["uSize", "uPoint", "uErase", "uColor"]);
      type = makeProgram(SOLID_VERTEX, SOLID_FRAGMENT, ["uType"]);
      particleBuffer = gl.createBuffer();
      quadBuffer = gl.createBuffer();
      gl.bindBuffer(gl.ARRAY_BUFFER, quadBuffer);
      gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([0, 0, 1, 0, 0, 1, 1, 1]), gl.STATIC_DRAW);
      texture = gl.createTexture();
      gl.enable(gl.BLEND);
    }
    const ready = () => !!(gl && particles && type);

    // Interaction state. `field` eases 0 → 1 → 0 with the hover and scales the force and the release; the cursor
    // centre follows the pointer smoothly.
    let inside = false, field = 0, released = 0, raf = 0, last = 0;
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
      // The same pixels become the WebGL type texture, so the type drawn while particles are loose matches the 2D type.
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

      // Particles come from the rendered heading's own pixels, one per lattice cell covered by type (a seeded
      // generator keeps the layout identical on every rebuild). Homes are fixed for the particle's whole life.
      if (gl && ready()) {
        const pixels = ctx.getImageData(0, 0, solid.width, solid.height).data;
        const homes: number[] = [];
        let seed = 1;
        const random = () => ((seed = (seed * 16807) % 2147483647) - 1) / 2147483646;
        for (let gy = box.y; gy < box.y + box.h; gy += LATTICE) {
          for (let gx = box.x; gx < box.x + box.w; gx += LATTICE) {
            const x = gx + random() * LATTICE, y = gy + random() * LATTICE;
            if ((pixels[(Math.floor(y * dpr) * solid.width + Math.floor(x * dpr)) * 4 + 3] ?? 0) > 60) homes.push(x, y);
          }
        }
        count = homes.length / 2;
        gpu = new Float32Array(count * STRIDE);
        vel = new Float32Array(count * 2);
        mass = new Float32Array(count);
        for (let i = 0; i < count; i++) {
          const o = i * STRIDE;
          gpu[o] = gpu[o + 2] = homes[i * 2]!;
          gpu[o + 1] = gpu[o + 3] = homes[i * 2 + 1]!;
          mass[i] = 0.75 + random() * 0.5; // varied weight staggers the scatter and the return
        }
        gl.bindBuffer(gl.ARRAY_BUFFER, particleBuffer);
        gl.bufferData(gl.ARRAY_BUFFER, gpu, gl.DYNAMIC_DRAW);
        gl.viewport(0, 0, glCanvas.width, glCanvas.height);
        released = 0;
        field = 0;
      }
      return true;
    };

    // Composite while particles are loose: type texture, then erase under each released particle's home, then
    // the particles themselves. With nothing loose the GL canvas is cleared and the 2D type shows alone.
    const draw = (visible: boolean) => {
      if (!gl || !ready()) return;
      gl.clearColor(0, 0, 0, 0);
      gl.clear(gl.COLOR_BUFFER_BIT);
      if (!visible) return;

      gl.blendFunc(gl.ONE, gl.ONE_MINUS_SRC_ALPHA);
      gl.useProgram(type!.program);
      gl.bindBuffer(gl.ARRAY_BUFFER, quadBuffer);
      const corner = gl.getAttribLocation(type!.program, "aCorner");
      gl.enableVertexAttribArray(corner);
      gl.vertexAttribPointer(corner, 2, gl.FLOAT, false, 0, 0);
      gl.activeTexture(gl.TEXTURE0);
      gl.bindTexture(gl.TEXTURE_2D, texture);
      gl.uniform1i(type!.u["uType"]!, 0);
      gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
      gl.disableVertexAttribArray(corner);

      gl.useProgram(particles!.program);
      gl.bindBuffer(gl.ARRAY_BUFFER, particleBuffer);
      gl.bufferSubData(gl.ARRAY_BUFFER, 0, gpu);
      const bytes = STRIDE * 4;
      const aPos = gl.getAttribLocation(particles!.program, "aPos");
      const aHome = gl.getAttribLocation(particles!.program, "aHome");
      const aRelease = gl.getAttribLocation(particles!.program, "aRelease");
      gl.enableVertexAttribArray(aPos); gl.vertexAttribPointer(aPos, 2, gl.FLOAT, false, bytes, 0);
      gl.enableVertexAttribArray(aHome); gl.vertexAttribPointer(aHome, 2, gl.FLOAT, false, bytes, 8);
      gl.enableVertexAttribArray(aRelease); gl.vertexAttribPointer(aRelease, 1, gl.FLOAT, false, bytes, 16);
      gl.uniform2f(particles!.u["uSize"]!, width, height);
      gl.uniform3f(particles!.u["uColor"]!, color[0], color[1], color[2]);

      gl.blendFunc(gl.ZERO, gl.ONE_MINUS_SRC_ALPHA); // erase: dst *= 1 - release
      gl.uniform1f(particles!.u["uErase"]!, 1);
      gl.uniform1f(particles!.u["uPoint"]!, Math.max(1, Math.ceil(ERASE * dpr)));
      gl.drawArrays(gl.POINTS, 0, count);

      gl.blendFunc(gl.ONE, gl.ONE_MINUS_SRC_ALPHA); // particles at their current positions
      gl.uniform1f(particles!.u["uErase"]!, 0);
      gl.uniform1f(particles!.u["uPoint"]!, Math.max(1, Math.round(POINT * dpr)));
      gl.drawArrays(gl.POINTS, 0, count);

      gl.disableVertexAttribArray(aPos); gl.disableVertexAttribArray(aHome); gl.disableVertexAttribArray(aRelease);
    };

    // Advance every particle by dt seconds; returns how many are still released.
    const simulate = (dt: number, time: number) => {
      const radius = width < 700 ? RADIUS * 0.6 : RADIUS;
      const r2 = radius * radius, inner = radius * RELEASE_INNER, outer = radius * RELEASE_OUTER;
      const cx = centre.x, cy = centre.y;
      let active = 0;
      for (let i = 0; i < count; i++) {
        const o = i * STRIDE, iv = i * 2;
        const hx = gpu[o + 2]!, hy = gpu[o + 3]!;
        let rel = gpu[o + 4]!;

        // Activation: a smooth function of the distance from the cursor to the particle's home on the glyph. Once
        // released a particle stays released until it is back home, so it keeps its motion after the cursor passes.
        if (field > 0.002) {
          const hdx = hx - cx, hdy = hy - cy, hd2 = hdx * hdx + hdy * hdy;
          if (hd2 < outer * outer) {
            const t = Math.min(1, Math.max(0, ((outer - Math.sqrt(hd2)) / (outer - inner)) * 2.2)); // short feather: a half-released type pixel looks grey
            const act = t * t * (3 - 2 * t) * field;
            if (act > rel) rel = act;
          }
        }
        if (rel < 0.004) {
          if (rel !== 0 || gpu[o + 4] !== 0) { gpu[o] = hx; gpu[o + 1] = hy; vel[iv] = vel[iv + 1] = 0; gpu[o + 4] = 0; }
          continue;
        }

        const px = gpu[o]!, py = gpu[o + 1]!;
        let vx = vel[iv]!, vy = vel[iv + 1]!;
        const m = mass[i]!;
        let slack = 1, fx = 0, fy = 0;
        const dx = px - cx, dy = py - cy, d2 = dx * dx + dy * dy;
        if (field > 0.002 && d2 < r2 * 6) {
          const d = Math.sqrt(d2) + 0.5, nx = dx / d, ny = dy / d;
          const f = Math.exp(-d2 / r2) * field * Math.min(1, rel * 3);
          // Radial push + perpendicular swirl, both strongest at the cursor; a phase-shifted wobble keeps the scatter organic.
          const wobble = Math.sin(hx * 0.071 + time * 3.1 + m * 9) * Math.cos(hy * 0.083 - time * 2.3 + m * 5);
          fx = (nx * RADIAL - ny * SWIRL) * f + wobble * TURBULENCE * f;
          fy = (ny * RADIAL + nx * SWIRL) * f - wobble * TURBULENCE * f;
          slack = 1 - LOOSEN * f;
        }
        const k = SPRING * m * slack;
        vx += (fx + (hx - px) * k - vx * DAMPING) * dt;
        vy += (fy + (hy - py) * k - vy * DAMPING) * dt;
        const qx = px + vx * dt, qy = py + vy * dt;
        vel[iv] = vx; vel[iv + 1] = vy; gpu[o] = qx; gpu[o + 1] = qy;

        // Back on its glyph and nearly still: fade the release out (type and particle cross-fade, so no pop).
        const ox = qx - hx, oy = qy - hy;
        if (ox * ox + oy * oy < 0.5 && vx * vx + vy * vy < 25) rel -= dt * 5;
        gpu[o + 4] = rel;
        active++;
      }
      return active;
    };

    const frame = (now: number) => {
      raf = 0;
      const dt = last ? Math.min(now - last, 33) / 1000 : 1 / 60;
      const frames = dt * 60;
      last = now;
      field += ((inside ? 1 : 0) - field) * ease(inside ? 0.14 : 0.1, frames);
      if (!inside && field < 0.003) field = 0;
      const follow = ease(0.25, frames);
      centre.x += (pointer.x - centre.x) * follow;
      centre.y += (pointer.y - centre.y) * follow;
      released = ready() ? simulate(dt, now / 1000) : 0;
      // The 2D type shows alone whenever nothing is loose; otherwise WebGL draws type + erase + particles.
      solid.style.opacity = released ? "0" : "1";
      draw(released > 0);
      if (!inside && field === 0 && released === 0) { last = 0; return; }
      raf = requestAnimationFrame(frame);
    };
    const run = () => { if (!raf) raf = requestAnimationFrame(frame); };

    const onMove = (event: PointerEvent) => {
      if (!loaded || !ready()) return;
      const bounds = glCanvas.getBoundingClientRect();
      const x = event.clientX - bounds.left, y = event.clientY - bounds.top;
      const over = x > box.x - HOVER_PAD && x < box.x + box.w + HOVER_PAD && y > box.y - HOVER_PAD && y < box.y + box.h + HOVER_PAD;
      // Start the field exactly at the pointer when the effect is idle, so it never sweeps in from elsewhere.
      if (over && !inside && field < 0.01) { centre.x = x; centre.y = y; }
      if (over) { pointer.x = x; pointer.y = y; }
      inside = over;
      run();
    };
    const onLeave = () => { inside = false; run(); };
    const onUp = (event: PointerEvent) => { if (event.pointerType !== "mouse") onLeave(); };

    const start = () => {
      loaded = build();
      solid.style.opacity = "1";
      draw(false);
    };
    if (src) {
      image = new Image();
      image.onload = start;
      image.onerror = () => { image = null; document.fonts.ready.then(start); };
      image.src = src;
    } else {
      document.fonts.ready.then(start);
    }

    const resizeObserver = new ResizeObserver(() => { if (loaded) { loaded = build(); solid.style.opacity = "1"; draw(false); } });
    resizeObserver.observe(solid);
    // Theme changes recolour the type and particles in place (read from --particle at draw time).
    const themeObserver = new MutationObserver(() => { if (loaded) { paintSolid(); if (released) draw(true); } });
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
