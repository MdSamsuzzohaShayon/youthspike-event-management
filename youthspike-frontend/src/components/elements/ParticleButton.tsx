"use client";

import React, { useCallback, useEffect, useRef, useState } from "react";

type Variant = "primary" | "default";
type Size = "sm" | "md" | "lg";

interface Particle {
  id: number;
  x: number;
  y: number;
  dx: number;
  dy: number;
  size: number;
  color: string;
  shape: "circle" | "square" | "star" | "streak";
  rotate: number;
  duration: number;
  delay: number;
  trail: boolean;
}

interface Shockwave {
  id: number;
  x: number;
  y: number;
}

interface ParticleButtonProps
  extends Omit<React.ButtonHTMLAttributes<HTMLButtonElement>, "onClick"> {
  children: React.ReactNode;
  onClick?: (e: React.MouseEvent<HTMLButtonElement>) => void;
  variant?: Variant;
  size?: Size;
  particleCount?: number;
}

/* Strict yellow / black / white palette */
const PARTICLE_COLORS = [
  "#fde047", // yellow-300
  "#facc15", // yellow-400
  "#fbbf24", // amber-400
  "#f59e0b", // amber-500
  "#fef3c7", // yellow-100
  "#ffffff", // white
  "#f9fafb", // gray-50
  "#171717", // near-black
  "#000000", // black
];

const SHAPES: Particle["shape"][] = ["circle", "square", "star", "streak"];

const baseClass =
  "relative inline-flex items-center justify-center font-semibold rounded-lg transition-all duration-200 active:scale-95 focus:outline-none disabled:opacity-50 disabled:pointer-events-none select-none";

const variantClass: Record<Variant, string> = {
  primary:
    "bg-gradient-to-r from-yellow-400 via-amber-400 to-yellow-500 text-black border-2 border-black shadow-lg shadow-amber-500/40 hover:shadow-xl hover:shadow-amber-500/50 hover:brightness-105",
  default:
    "bg-white text-black border-2 border-black shadow-md hover:bg-yellow-300 hover:border-black hover:shadow-lg",
};

const sizeClass: Record<Size, string> = {
  sm: "text-sm px-3 py-1.5",
  md: "text-sm px-4 py-2",
  lg: "text-base px-8 py-3.5",
};

function ParticleDot({
  particle,
  onDone,
}: {
  particle: Particle;
  onDone: (id: number) => void;
}) {
  const ref = useRef<HTMLSpanElement>(null);

  useEffect(() => {
    if (!ref.current) return;
    const anim = ref.current.animate(
      [
        {
          transform: "translate(-50%, -50%) scale(1) rotate(0deg)",
          opacity: 1,
        },
        {
          transform: `translate(calc(-50% + ${particle.dx * 0.55}px), calc(-50% + ${particle.dy * 0.55}px)) scale(1.15) rotate(${particle.rotate * 0.5}deg)`,
          opacity: 0.95,
          offset: 0.35,
        },
        {
          transform: `translate(calc(-50% + ${particle.dx}px), calc(-50% + ${particle.dy + 28}px)) scale(0.1) rotate(${particle.rotate}deg)`,
          opacity: 0,
        },
      ],
      {
        duration: particle.duration,
        easing: "cubic-bezier(0.22, 1, 0.36, 1)",
        fill: "forwards",
        delay: particle.delay,
      }
    );
    anim.onfinish = () => onDone(particle.id);
    return () => anim.cancel();
  }, [particle, onDone]);

  const shapeStyle: React.CSSProperties =
    particle.shape === "square"
      ? { borderRadius: "2px" }
      : particle.shape === "star"
      ? {
          clipPath:
            "polygon(50% 0%, 61% 35%, 98% 35%, 68% 57%, 79% 91%, 50% 70%, 21% 91%, 32% 57%, 2% 35%, 39% 35%)",
        }
      : particle.shape === "streak"
      ? {
          borderRadius: "999px",
          height: `${particle.size * 0.4}px`,
          width: `${particle.size * 2}px`,
        }
      : { borderRadius: "50%" };

  return (
    <span
      ref={ref}
      style={{
        position: "absolute",
        left: `${particle.x}px`,
        top: `${particle.y}px`,
        width: `${particle.size}px`,
        height: `${particle.size}px`,
        background: particle.color,
        transform: "translate(-50%, -50%)",
        pointerEvents: "none",
        zIndex: 30,
        boxShadow: particle.trail
          ? `0 0 ${particle.size * 1.5}px ${particle.color}, 0 0 ${particle.size * 0.5}px ${particle.color}`
          : "none",
        ...shapeStyle,
      }}
    />
  );
}

function ShockwaveRing({
  wave,
  onDone,
}: {
  wave: Shockwave;
  onDone: (id: number) => void;
}) {
  const ref = useRef<HTMLSpanElement>(null);

  useEffect(() => {
    if (!ref.current) return;
    const anim = ref.current.animate(
      [
        { transform: "translate(-50%, -50%) scale(0)", opacity: 0.55 },
        { transform: "translate(-50%, -50%) scale(6)", opacity: 0 },
      ],
      {
        duration: 700,
        easing: "cubic-bezier(0.16, 1, 0.3, 1)",
        fill: "forwards",
      }
    );
    anim.onfinish = () => onDone(wave.id);
    return () => anim.cancel();
  }, [wave, onDone]);

  return (
    <span
      ref={ref}
      style={{
        position: "absolute",
        left: `${wave.x}px`,
        top: `${wave.y}px`,
        width: "16px",
        height: "16px",
        border: "2px solid rgba(254, 240, 138, 0.9)",
        borderRadius: "50%",
        transform: "translate(-50%, -50%) scale(0)",
        pointerEvents: "none",
        zIndex: 25,
      }}
    />
  );
}

export default function ParticleButton({
  children,
  onClick,
  className = "",
  variant = "default",
  size = "md",
  particleCount = 22,
  ...rest
}: ParticleButtonProps) {
  const [particles, setParticles] = useState<Particle[]>([]);
  const [shockwaves, setShockwaves] = useState<Shockwave[]>([]);
  const idRef = useRef(0);
  const waveIdRef = useRef(0);

  const removeParticle = useCallback((id: number) => {
    setParticles((p) => p.filter((pp) => pp.id !== id));
  }, []);

  const removeWave = useCallback((id: number) => {
    setShockwaves((p) => p.filter((pp) => pp.id !== id));
  }, []);

  const burst = useCallback(
    (x: number, y: number) => {
      const newParticles: Particle[] = [];
      for (let i = 0; i < particleCount; i++) {
        const angle =
          (Math.PI * 2 * i) / particleCount + (Math.random() - 0.5) * 0.6;
        const dist = 40 + Math.random() * 95;
        const wave = Math.random() > 0.45 ? 1 : 2;
        newParticles.push({
          id: idRef.current++,
          x,
          y,
          dx: Math.cos(angle) * dist,
          // slight upward bias so particles "pop up" then fall
          dy: Math.sin(angle) * dist - 18,
          size: 4 + Math.random() * 10,
          color:
            PARTICLE_COLORS[
              Math.floor(Math.random() * PARTICLE_COLORS.length)
            ],
          shape: SHAPES[Math.floor(Math.random() * SHAPES.length)],
          rotate: (Math.random() - 0.5) * 720,
          duration:
            wave === 1
              ? 650 + Math.random() * 250
              : 950 + Math.random() * 350,
          delay: wave === 1 ? 0 : 90 + Math.random() * 140,
          trail: Math.random() > 0.45,
        });
      }
      setParticles((p) => [...p, ...newParticles]);
      setShockwaves((p) => [...p, { id: waveIdRef.current++, x, y }]);
    },
    [particleCount]
  );

  const handleClick = (e: React.MouseEvent<HTMLButtonElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    burst(x, y);
    onClick?.(e);
  };

  return (
    <button
      onClick={handleClick}
      className={`${baseClass} ${variantClass[variant]} ${sizeClass[size]} ${className}`}
      {...rest}
    >
      <span className="relative z-10 inline-flex items-center gap-2">
        {children}
      </span>
      <span className="pointer-events-none absolute inset-0 z-20 overflow-visible">
        {shockwaves.map((w) => (
          <ShockwaveRing key={`w-${w.id}`} wave={w} onDone={removeWave} />
        ))}
        {particles.map((p) => (
          <ParticleDot key={`p-${p.id}`} particle={p} onDone={removeParticle} />
        ))}
      </span>
    </button>
  );
}