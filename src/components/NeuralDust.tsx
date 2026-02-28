import { useEffect, useRef, useCallback } from "react";

interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  size: number;
  alpha: number;
  hue: number;
}

interface NeuralDustProps {
  /** Rect of the correct answer card (for magnetic attraction) */
  attractorRect?: DOMRect | null;
  /** Whether attraction is active */
  attracting?: boolean;
}

const PARTICLE_COUNT = 40;

const NeuralDust = ({ attractorRect, attracting = false }: NeuralDustProps) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const particles = useRef<Particle[]>([]);
  const mouse = useRef({ x: -1000, y: -1000 });
  const raf = useRef<number>(0);

  const initParticles = useCallback((w: number, h: number) => {
    particles.current = Array.from({ length: PARTICLE_COUNT }, () => ({
      x: Math.random() * w,
      y: Math.random() * h,
      vx: (Math.random() - 0.5) * 0.5,
      vy: (Math.random() - 0.5) * 0.5,
      size: 1.5 + Math.random() * 2.5,
      alpha: 0.3 + Math.random() * 0.5,
      hue: 140 + Math.random() * 40, // green-teal range
    }));
  }, []);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const resize = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
      if (particles.current.length === 0) initParticles(canvas.width, canvas.height);
    };
    resize();
    window.addEventListener("resize", resize);

    const onMove = (e: MouseEvent | TouchEvent) => {
      const p = "touches" in e ? e.touches[0] : e;
      if (p) {
        mouse.current = { x: p.clientX, y: p.clientY };
      }
    };
    window.addEventListener("mousemove", onMove, { passive: true });
    window.addEventListener("touchmove", onMove, { passive: true });

    const animate = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      const mx = mouse.current.x;
      const my = mouse.current.y;

      // Attractor center
      const ax = attractorRect ? attractorRect.left + attractorRect.width / 2 : -1000;
      const ay = attractorRect ? attractorRect.top + attractorRect.height / 2 : -1000;

      for (const p of particles.current) {
        // Follow cursor gently
        const dxM = mx - p.x;
        const dyM = my - p.y;
        const distM = Math.sqrt(dxM * dxM + dyM * dyM);
        if (distM < 200 && distM > 0) {
          const force = (200 - distM) / 200 * 0.02;
          p.vx += (dxM / distM) * force;
          p.vy += (dyM / distM) * force;
        }

        // Magnetic attraction to correct answer
        if (attracting && attractorRect) {
          const dxA = ax - p.x;
          const dyA = ay - p.y;
          const distA = Math.sqrt(dxA * dxA + dyA * dyA);
          if (distA > 0) {
            const aForce = Math.min(0.08, 30 / (distA + 1));
            p.vx += (dxA / distA) * aForce;
            p.vy += (dyA / distA) * aForce;
          }
          p.hue = 130; // green
          p.alpha = Math.min(0.9, p.alpha + 0.01);
        }

        // Damping
        p.vx *= 0.96;
        p.vy *= 0.96;
        p.x += p.vx;
        p.y += p.vy;

        // Wrap edges
        if (p.x < 0) p.x = canvas.width;
        if (p.x > canvas.width) p.x = 0;
        if (p.y < 0) p.y = canvas.height;
        if (p.y > canvas.height) p.y = 0;

        // Draw
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
        ctx.fillStyle = `hsla(${p.hue}, 80%, 65%, ${p.alpha})`;
        ctx.fill();

        // Glow
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.size * 3, 0, Math.PI * 2);
        ctx.fillStyle = `hsla(${p.hue}, 80%, 65%, ${p.alpha * 0.15})`;
        ctx.fill();
      }

      raf.current = requestAnimationFrame(animate);
    };
    raf.current = requestAnimationFrame(animate);

    return () => {
      cancelAnimationFrame(raf.current);
      window.removeEventListener("resize", resize);
      window.removeEventListener("mousemove", onMove);
      window.removeEventListener("touchmove", onMove);
    };
  }, [attractorRect, attracting, initParticles]);

  return (
    <canvas
      ref={canvasRef}
      className="pointer-events-none fixed inset-0 z-40"
      style={{ mixBlendMode: "screen" }}
    />
  );
};

export default NeuralDust;
