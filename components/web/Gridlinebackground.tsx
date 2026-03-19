"use client";

import { useEffect, useRef } from "react";
import { useTheme } from "next-themes";

interface Particle {
  // which grid line it lives on
  axis: "h" | "v";      // horizontal or vertical
  lineIndex: number;    // which grid line
  pos: number;          // position along the line (0..1)
  speed: number;        // normalised speed
  size: number;
  alpha: number;
  tailLength: number;   // how long the glow tail is (px)
  hue: number;          // accent hue shift
}

export function GridLineBackground() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const { resolvedTheme } = useTheme();

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const dark = resolvedTheme !== "light";

    // ── colours ──────────────────────────────────────────────────────────────
    const gridColor  = dark ? "rgba(255,255,255,0.055)" : "rgba(0,0,0,0.07)";
    const dotColor   = dark ? "rgba(255,255,255,0.12)"  : "rgba(0,0,0,0.12)";
    // accent colours for the flowing particles
    const ACCENTS = dark
      ? ["#60a5fa", "#a78bfa", "#f472b6", "#34d399", "#38bdf8"]
      : ["#2563eb", "#7c3aed", "#db2777", "#059669", "#0284c7"];

    let raf: number;
    let particles: Particle[] = [];

    // ── grid metrics ─────────────────────────────────────────────────────────
    const CELL = 72; // px between lines — adjust to taste

    const resize = () => {
      canvas.width  = window.innerWidth;
      canvas.height = window.innerHeight;
      buildParticles();
    };

    function buildParticles() {
      if (!canvas) return;
      particles = [];
      const cols = Math.ceil(canvas.width  / CELL) + 1;
      const rows = Math.ceil(canvas.height / CELL) + 1;

      // ~1 particle per 3 grid lines
      const hCount = Math.ceil(rows / 2);
      const vCount = Math.ceil(cols / 2);

      for (let i = 0; i < hCount; i++) {
        const lineIndex = Math.floor(Math.random() * rows);
        particles.push(makeParticle("h", lineIndex));
      }
      for (let i = 0; i < vCount; i++) {
        const lineIndex = Math.floor(Math.random() * cols);
        particles.push(makeParticle("v", lineIndex));
      }
    }

    function makeParticle(axis: "h" | "v", lineIndex: number): Particle {
      return {
        axis,
        lineIndex,
        pos:        Math.random(),
        speed:      (Math.random() * 0.0008 + 0.0003) * (Math.random() < 0.5 ? 1 : -1),
        size:       Math.random() * 1.5 + 1,
        alpha:      Math.random() * 0.5 + 0.5,
        tailLength: Math.random() * 80 + 40,
        hue:        0, // set per accent pick below
      };
    }

    // ── draw ─────────────────────────────────────────────────────────────────
    function drawGrid() {
      if (!canvas || !ctx) return;
      const cols = Math.ceil(canvas.width  / CELL) + 1;
      const rows = Math.ceil(canvas.height / CELL) + 1;
      ctx.strokeStyle = gridColor;
      ctx.lineWidth   = 1;

      // vertical lines
      for (let c = 0; c <= cols; c++) {
        const x = c * CELL;
        ctx.beginPath();
        ctx.moveTo(x, 0);
        ctx.lineTo(x, canvas.height);
        ctx.stroke();
      }
      // horizontal lines
      for (let r = 0; r <= rows; r++) {
        const y = r * CELL;
        ctx.beginPath();
        ctx.moveTo(0, y);
        ctx.lineTo(canvas.width, y);
        ctx.stroke();
      }

      // intersection dots
      ctx.fillStyle = dotColor;
      for (let c = 0; c <= cols; c++) {
        for (let r = 0; r <= rows; r++) {
          ctx.beginPath();
          ctx.arc(c * CELL, r * CELL, 1.5, 0, Math.PI * 2);
          ctx.fill();
        }
      }
    }

    function drawParticles() {
      if (!canvas || !ctx) return;
      const cols = Math.ceil(canvas.width  / CELL) + 1;
      const rows = Math.ceil(canvas.height / CELL) + 1;

      for (const p of particles) {
        p.pos += p.speed;
        // wrap
        if (p.pos > 1) p.pos = 0;
        if (p.pos < 0) p.pos = 1;

        const accent = ACCENTS[p.lineIndex % ACCENTS.length];

        if (p.axis === "h") {
          const y   = p.lineIndex * CELL;
          const x   = p.pos * canvas.width;
          const dir = p.speed > 0 ? -1 : 1;

          // tail gradient
          const tailX = x + dir * p.tailLength;
          const grad  = ctx.createLinearGradient(x, y, tailX, y);
          grad.addColorStop(0,   hexAlpha(accent, p.alpha));
          grad.addColorStop(0.6, hexAlpha(accent, p.alpha * 0.3));
          grad.addColorStop(1,   hexAlpha(accent, 0));

          ctx.beginPath();
          ctx.moveTo(x, y);
          ctx.lineTo(tailX, y);
          ctx.strokeStyle = grad;
          ctx.lineWidth   = p.size;
          ctx.stroke();

          // head glow
          const glow = ctx.createRadialGradient(x, y, 0, x, y, p.size * 6);
          glow.addColorStop(0,   hexAlpha(accent, p.alpha));
          glow.addColorStop(0.4, hexAlpha(accent, p.alpha * 0.4));
          glow.addColorStop(1,   hexAlpha(accent, 0));
          ctx.beginPath();
          ctx.arc(x, y, p.size * 6, 0, Math.PI * 2);
          ctx.fillStyle = glow;
          ctx.fill();

          // head dot
          ctx.beginPath();
          ctx.arc(x, y, p.size, 0, Math.PI * 2);
          ctx.fillStyle = "#fff";
          ctx.fill();

        } else {
          const x   = p.lineIndex * CELL;
          const y   = p.pos * canvas.height;
          const dir = p.speed > 0 ? -1 : 1;

          const tailY = y + dir * p.tailLength;
          const grad  = ctx.createLinearGradient(x, y, x, tailY);
          grad.addColorStop(0,   hexAlpha(accent, p.alpha));
          grad.addColorStop(0.6, hexAlpha(accent, p.alpha * 0.3));
          grad.addColorStop(1,   hexAlpha(accent, 0));

          ctx.beginPath();
          ctx.moveTo(x, y);
          ctx.lineTo(x, tailY);
          ctx.strokeStyle = grad;
          ctx.lineWidth   = p.size;
          ctx.stroke();

          const glow = ctx.createRadialGradient(x, y, 0, x, y, p.size * 6);
          glow.addColorStop(0,   hexAlpha(accent, p.alpha));
          glow.addColorStop(0.4, hexAlpha(accent, p.alpha * 0.4));
          glow.addColorStop(1,   hexAlpha(accent, 0));
          ctx.beginPath();
          ctx.arc(x, y, p.size * 6, 0, Math.PI * 2);
          ctx.fillStyle = glow;
          ctx.fill();

          ctx.beginPath();
          ctx.arc(x, y, p.size, 0, Math.PI * 2);
          ctx.fillStyle = "#fff";
          ctx.fill();
        }
      }
    }

    function animate() {
      if (!canvas || !ctx) return;
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      drawGrid();
      drawParticles();
      raf = requestAnimationFrame(animate);
    }

    // ── helpers ───────────────────────────────────────────────────────────────
    function hexAlpha(hex: string, alpha: number): string {
      // convert #rrggbb + alpha → rgba()
      const r = parseInt(hex.slice(1, 3), 16);
      const g = parseInt(hex.slice(3, 5), 16);
      const b = parseInt(hex.slice(5, 7), 16);
      return `rgba(${r},${g},${b},${alpha})`;
    }

    window.addEventListener("resize", resize);
    resize();
    animate();

    return () => {
      window.removeEventListener("resize", resize);
      cancelAnimationFrame(raf);
    };
  }, [resolvedTheme]);

  return (
    <canvas
      ref={canvasRef}
      className="absolute inset-0 w-full h-full pointer-events-none z-0"
      aria-hidden="true"
    />
  );
}