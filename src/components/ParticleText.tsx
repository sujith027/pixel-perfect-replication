import { useEffect, useRef } from "react";

type Particle = {
  x: number;
  y: number;
  targetX: number;
  targetY: number;
  velocityX: number;
  velocityY: number;
};

export function ParticleText({ text, src }: { text: string; src?: string }) {
  const ref = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = ref.current;
    const context = canvas?.getContext("2d");
    if (!canvas || !context) return;

    let particles: Particle[] = [];
    let animationFrame = 0;
    let isPointerInside = false;
    let width = 0;
    let height = 0;
    let pixelRatio = 1;
    let image: HTMLImageElement | null = null;
    const pointer = { x: -9999, y: -9999 };
    const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    const buildParticles = () => {
      pixelRatio = Math.min(window.devicePixelRatio || 1, 2);
      width = canvas.clientWidth;
      height = canvas.clientHeight;
      if (!width || !height) return;

      canvas.width = width * pixelRatio;
      canvas.height = height * pixelRatio;
      context.setTransform(pixelRatio, 0, 0, pixelRatio, 0, 0);

      const source = document.createElement("canvas");
      source.width = width;
      source.height = height;
      const sourceContext = source.getContext("2d");
      if (!sourceContext) return;

      if (image) {
        const imageWidth = image.naturalWidth || 1174;
        const imageHeight = image.naturalHeight || 201;
        const scale = Math.min((width * 0.9) / imageWidth, (height * 0.8) / imageHeight);
        sourceContext.drawImage(
          image,
          (width - imageWidth * scale) / 2,
          (height - imageHeight * scale) / 2,
          imageWidth * scale,
          imageHeight * scale,
        );
      } else {
        const lines = width < 700 && text.includes(" ") ? text.split(" ") : [text];
        const fontSize =
          lines.length > 1
            ? Math.min(width / 6.2, height / (lines.length * 1.1))
            : Math.min(width / 8.6, height * 0.7);
        sourceContext.font = `800 ${fontSize}px "Bricolage Grotesque", sans-serif`;
        sourceContext.textAlign = "center";
        sourceContext.textBaseline = "middle";
        sourceContext.fillStyle = "#fff";
        lines.forEach((line, index) =>
          sourceContext.fillText(
            line,
            width / 2,
            height / 2 + (index - (lines.length - 1) / 2) * fontSize,
          ),
        );
      }

      const pixels = sourceContext.getImageData(0, 0, width, height).data;
      const sampleGap = width < 700 ? 3 : 2;
      particles = [];
      for (let y = 0; y < height; y += sampleGap) {
        for (let x = 0; x < width; x += sampleGap) {
          if ((pixels[(y * width + x) * 4 + 3] ?? 0) <= 128) continue;
          particles.push({ x, y, targetX: x, targetY: y, velocityX: 0, velocityY: 0 });
        }
      }
    };

    const draw = () => {
      animationFrame = 0;
      context.clearRect(0, 0, width, height);
      const theme = getComputedStyle(document.documentElement);
      context.fillStyle = theme.getPropertyValue("--particle").trim();
      context.shadowColor = theme.getPropertyValue("--particle-shadow").trim();
      context.shadowBlur = 1.5;
      context.beginPath();

      const radius = width < 700 ? 72 : 100;
      let isSettling = false;
      for (const particle of particles) {
        if (!reduceMotion && isPointerInside) {
          const deltaX = particle.x - pointer.x;
          const deltaY = particle.y - pointer.y;
          const distanceSquared = deltaX * deltaX + deltaY * deltaY;
          if (distanceSquared < radius * radius) {
            const distance = Math.sqrt(distanceSquared) || 1;
            const force = (1 - distance / radius) * 5;
            particle.velocityX += (deltaX / distance) * force;
            particle.velocityY += (deltaY / distance) * force;
          }
        }

        particle.velocityX += (particle.targetX - particle.x) * 0.07;
        particle.velocityY += (particle.targetY - particle.y) * 0.07;
        particle.velocityX *= 0.6;
        particle.velocityY *= 0.6;
        particle.x += particle.velocityX;
        particle.y += particle.velocityY;

        if (
          Math.abs(particle.velocityX) > 0.01 ||
          Math.abs(particle.velocityY) > 0.01 ||
          Math.abs(particle.targetX - particle.x) > 0.1 ||
          Math.abs(particle.targetY - particle.y) > 0.1
        ) {
          isSettling = true;
        }

        context.moveTo(particle.x + 0.5, particle.y);
        context.arc(particle.x, particle.y, 0.5, 0, Math.PI * 2);
      }
      context.fill();

      if (!reduceMotion && (isPointerInside || isSettling)) {
        animationFrame = requestAnimationFrame(draw);
      }
    };

    const requestDraw = () => {
      if (!animationFrame) animationFrame = requestAnimationFrame(draw);
    };

    const movePointer = (clientX: number, clientY: number) => {
      const bounds = canvas.getBoundingClientRect();
      pointer.x = clientX - bounds.left;
      pointer.y = clientY - bounds.top;
      isPointerInside = true;
      requestDraw();
    };

    const onMouseMove = (event: MouseEvent) => movePointer(event.clientX, event.clientY);
    const onTouchMove = (event: TouchEvent) => {
      const touch = event.touches[0];
      if (touch) movePointer(touch.clientX, touch.clientY);
    };
    const stopPointer = () => {
      isPointerInside = false;
      requestDraw();
    };
    const start = () => {
      buildParticles();
      requestDraw();
    };

    if (src) {
      image = new Image();
      image.onload = start;
      image.onerror = () => document.fonts.ready.then(start);
      image.src = src;
    } else {
      document.fonts.ready.then(start);
    }

    const resizeObserver = new ResizeObserver(() => {
      buildParticles();
      requestDraw();
    });
    resizeObserver.observe(canvas);

    const themeObserver = new MutationObserver(requestDraw);
    themeObserver.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ["class"],
    });

    canvas.addEventListener("mousemove", onMouseMove);
    canvas.addEventListener("mouseleave", stopPointer);
    canvas.addEventListener("touchmove", onTouchMove, { passive: true });
    canvas.addEventListener("touchend", stopPointer);

    return () => {
      cancelAnimationFrame(animationFrame);
      resizeObserver.disconnect();
      themeObserver.disconnect();
      canvas.removeEventListener("mousemove", onMouseMove);
      canvas.removeEventListener("mouseleave", stopPointer);
      canvas.removeEventListener("touchmove", onTouchMove);
      canvas.removeEventListener("touchend", stopPointer);
    };
  }, [text, src]);

  return <canvas ref={ref} role="img" aria-label={text} className="hero-particles h-full w-full" />;
}
