import { useEffect, useRef } from "react";

/** Interactive constellation: drifting points linked by lines, reacting to the
 *  cursor (nearby points connect to it and are gently pushed away).
 *  Performance-minded: DPR capped, paused when the tab is hidden, and rendered
 *  once & static under prefers-reduced-motion. */
export default function ParticleNet({ theme, klingon, pride }: { theme: "light" | "dark"; klingon: boolean; pride: boolean }) {
  const ref = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = ref.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const light = theme === "light";
    const LINK_RGB = klingon ? "239,43,58" : light ? "77,124,15" : "163,230,53";
    const MOUSE_RGB = klingon ? "255,90,100" : light ? "3,105,161" : "56,189,248";
    const DOT = klingon ? "rgba(242,222,222,0.5)" : light ? "rgba(24,24,27,0.5)" : "rgba(233,233,236,0.45)";
    const LINK = 130; // link distance between points
    const MOUSE_R = 170; // cursor interaction radius

    type P = { x: number; y: number; vx: number; vy: number };
    let pts: P[] = [];
    let W = 0;
    let H = 0;
    const mouse = { x: -9999, y: -9999, active: false };

    const resize = () => {
      const dpr = Math.min(window.devicePixelRatio || 1, 1.5);
      W = window.innerWidth;
      H = window.innerHeight;
      canvas.width = W * dpr;
      canvas.height = H * dpr;
      canvas.style.width = W + "px";
      canvas.style.height = H + "px";
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      const count = Math.min(90, Math.max(28, Math.round((W * H) / 18000)));
      pts = Array.from({ length: count }, () => ({
        x: Math.random() * W,
        y: Math.random() * H,
        vx: (Math.random() - 0.5) * 0.35,
        vy: (Math.random() - 0.5) * 0.35,
      }));
    };

    const draw = () => {
      ctx.clearRect(0, 0, W, H);

      for (const p of pts) {
        if (!reduce) {
          p.x += p.vx;
          p.y += p.vy;
          if (p.x < 0 || p.x > W) p.vx *= -1;
          if (p.y < 0 || p.y > H) p.vy *= -1;
          if (mouse.active) {
            const dx = p.x - mouse.x;
            const dy = p.y - mouse.y;
            const d2 = dx * dx + dy * dy;
            if (d2 < MOUSE_R * MOUSE_R && d2 > 0.5) {
              const d = Math.sqrt(d2);
              const f = ((MOUSE_R - d) / MOUSE_R) * 0.9;
              p.x += (dx / d) * f;
              p.y += (dy / d) * f;
            }
          }
        }
      }

      // links between nearby points
      for (let i = 0; i < pts.length; i++) {
        for (let j = i + 1; j < pts.length; j++) {
          const dx = pts[i].x - pts[j].x;
          const dy = pts[i].y - pts[j].y;
          const d2 = dx * dx + dy * dy;
          if (d2 < LINK * LINK) {
            const o = (1 - Math.sqrt(d2) / LINK) * 0.22;
            ctx.strokeStyle = pride ? `hsla(${(((pts[i].x + pts[j].x) / 2) / W) * 360},90%,60%,${o})` : `rgba(${LINK_RGB},${o})`;
            ctx.lineWidth = 1;
            ctx.beginPath();
            ctx.moveTo(pts[i].x, pts[i].y);
            ctx.lineTo(pts[j].x, pts[j].y);
            ctx.stroke();
          }
        }
      }

      // links to the cursor + the dots
      for (const p of pts) {
        if (mouse.active) {
          const dx = p.x - mouse.x;
          const dy = p.y - mouse.y;
          const d2 = dx * dx + dy * dy;
          if (d2 < MOUSE_R * MOUSE_R) {
            const o = (1 - Math.sqrt(d2) / MOUSE_R) * 0.5;
            ctx.strokeStyle = pride ? `hsla(${(p.x / W) * 360},90%,65%,${o})` : `rgba(${MOUSE_RGB},${o})`;
            ctx.lineWidth = 1;
            ctx.beginPath();
            ctx.moveTo(p.x, p.y);
            ctx.lineTo(mouse.x, mouse.y);
            ctx.stroke();
          }
        }
        ctx.fillStyle = pride ? `hsla(${(p.x / W) * 360},90%,65%,0.75)` : DOT;
        ctx.beginPath();
        ctx.arc(p.x, p.y, 1.4, 0, Math.PI * 2);
        ctx.fill();
      }
    };

    let raf = 0;
    const loop = () => {
      draw();
      raf = requestAnimationFrame(loop);
    };

    const onMove = (e: MouseEvent) => {
      mouse.x = e.clientX;
      mouse.y = e.clientY;
      mouse.active = true;
    };
    const onLeave = () => {
      mouse.active = false;
    };
    const onTouch = (e: TouchEvent) => {
      if (e.touches[0]) {
        mouse.x = e.touches[0].clientX;
        mouse.y = e.touches[0].clientY;
        mouse.active = true;
      }
    };
    const onVis = () => {
      if (document.hidden) {
        cancelAnimationFrame(raf);
        raf = 0;
      } else if (!raf) {
        raf = requestAnimationFrame(loop);
      }
    };

    resize();
    window.addEventListener("resize", resize);

    if (reduce) {
      draw(); // static constellation, no loop / no listeners
      return () => window.removeEventListener("resize", resize);
    }

    window.addEventListener("mousemove", onMove, { passive: true });
    window.addEventListener("mouseout", onLeave);
    window.addEventListener("touchmove", onTouch, { passive: true });
    document.addEventListener("visibilitychange", onVis);
    raf = requestAnimationFrame(loop);

    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("resize", resize);
      window.removeEventListener("mousemove", onMove);
      window.removeEventListener("mouseout", onLeave);
      window.removeEventListener("touchmove", onTouch);
      document.removeEventListener("visibilitychange", onVis);
    };
  }, [theme, klingon, pride]);

  return <canvas ref={ref} aria-hidden className="pointer-events-none absolute inset-0" />;
}
