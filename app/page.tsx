"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { LOGO_SRC, PRODUCTIVITY_BG_SRC } from "./lib/assets";

// ─── Color Palette Constants ─────────────────────────────────────────────────
const COLORS = {
  green: {
    primary: "#00CA07",
    dark: "#00700B",
    medium: "#009E08",
    bright: "#00F20D",
  },
  gray: {
    900: "#191919",
    800: "#262626",
    700: "#333333",
    600: "#4C4C4D",
    400: "#98989A",
    100: "#E6E6E6",
  },
};

// ─── Animated Wireframe Sphere (Canvas) ─────────────────────────────────────

function WireframeSphere() {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let animationId: number;
    let time = 0;

    const resize = () => {
      const dpr = window.devicePixelRatio || 1;
      const rect = canvas.getBoundingClientRect();
      canvas.width = rect.width * dpr;
      canvas.height = rect.height * dpr;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    };

    resize();
    window.addEventListener("resize", resize);

    // Sphere parameters
    const numLat = 18;
    const numLon = 24;
    const numParticles = 120;

    // Generate random particles on sphere surface
    const particles = Array.from({ length: numParticles }, () => ({
      theta: Math.random() * Math.PI,
      phi: Math.random() * Math.PI * 2,
      size: Math.random() * 1.5 + 0.5,
      speed: (Math.random() - 0.5) * 0.003,
    }));

    const project = (
      x: number,
      y: number,
      z: number,
      cx: number,
      cy: number,
      radius: number
    ) => {
      const perspective = 600;
      const scale = perspective / (perspective + z);
      return {
        x: cx + x * scale * radius,
        y: cy + y * scale * radius,
        scale,
        z,
      };
    };

    const draw = () => {
      const w = canvas.getBoundingClientRect().width;
      const h = canvas.getBoundingClientRect().height;
      ctx.clearRect(0, 0, w, h);

      const cx = w * 0.55;
      const cy = h * 0.42;
      const radius = Math.min(w, h) * 0.32;

      const rotY = time * 0.15;
      const rotX = 0.3;

      const cosRY = Math.cos(rotY);
      const sinRY = Math.sin(rotY);
      const cosRX = Math.cos(rotX);
      const sinRX = Math.sin(rotX);

      const rotate = (x: number, y: number, z: number) => {
        // Rotate around Y
        let x1 = x * cosRY - z * sinRY;
        const z1 = x * sinRY + z * cosRY;
        // Rotate around X
        const y1 = y * cosRX - z1 * sinRX;
        const z2 = y * sinRX + z1 * cosRX;
        return { x: x1, y: y1, z: z2 };
      };

      // Draw latitude lines
      for (let i = 1; i < numLat; i++) {
        const theta = (i / numLat) * Math.PI;
        ctx.beginPath();
        let first = true;
        for (let j = 0; j <= 64; j++) {
          const phi = (j / 64) * Math.PI * 2;
          const sx = Math.sin(theta) * Math.cos(phi);
          const sy = Math.cos(theta);
          const sz = Math.sin(theta) * Math.sin(phi);
          const r = rotate(sx, sy, sz);
          const p = project(r.x, r.y, r.z, cx, cy, radius);
          const alpha = 0.06 + p.scale * 0.15;
          if (first) {
            ctx.moveTo(p.x, p.y);
            first = false;
          } else {
            ctx.lineTo(p.x, p.y);
          }
          ctx.strokeStyle = `rgba(0, 202, 7, ${alpha * 0.5})`;
        }
        ctx.lineWidth = 0.5;
        ctx.stroke();
      }

      // Draw longitude lines
      for (let j = 0; j < numLon; j++) {
        const phi = (j / numLon) * Math.PI * 2;
        ctx.beginPath();
        let first = true;
        for (let i = 0; i <= 64; i++) {
          const theta = (i / 64) * Math.PI;
          const sx = Math.sin(theta) * Math.cos(phi);
          const sy = Math.cos(theta);
          const sz = Math.sin(theta) * Math.sin(phi);
          const r = rotate(sx, sy, sz);
          const p = project(r.x, r.y, r.z, cx, cy, radius);
          const alpha = 0.06 + p.scale * 0.15;
          if (first) {
            ctx.moveTo(p.x, p.y);
            first = false;
          } else {
            ctx.lineTo(p.x, p.y);
          }
          ctx.strokeStyle = `rgba(0, 202, 7, ${alpha * 0.5})`;
        }
        ctx.lineWidth = 0.5;
        ctx.stroke();
      }

      // Draw spiral rings
      for (let ring = 0; ring < 3; ring++) {
        const ringRadius = 1.15 + ring * 0.2;
        const tilt = 0.5 + ring * 0.3;
        ctx.beginPath();
        let first = true;
        for (let k = 0; k <= 128; k++) {
          const angle = (k / 128) * Math.PI * 2;
          const sx = ringRadius * Math.cos(angle);
          const sy = ringRadius * Math.sin(angle) * Math.sin(tilt);
          const sz = ringRadius * Math.sin(angle) * Math.cos(tilt);
          const r = rotate(sx, sy, sz);
          const p = project(r.x, r.y, r.z, cx, cy, radius);
          if (first) {
            ctx.moveTo(p.x, p.y);
            first = false;
          } else {
            ctx.lineTo(p.x, p.y);
          }
        }
        ctx.strokeStyle = `rgba(0, 202, 7, ${0.08 - ring * 0.02})`;
        ctx.lineWidth = 0.6;
        ctx.stroke();
      }

      // Draw particles / dots
      particles.forEach((particle) => {
        particle.phi += particle.speed;
        const sx = Math.sin(particle.theta) * Math.cos(particle.phi);
        const sy = Math.cos(particle.theta);
        const sz = Math.sin(particle.theta) * Math.sin(particle.phi);
        const r = rotate(sx, sy, sz);
        const p = project(r.x, r.y, r.z, cx, cy, radius);
        const alpha = 0.2 + p.scale * 0.6;
        ctx.beginPath();
        ctx.arc(p.x, p.y, particle.size * p.scale, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(255,255,255,${alpha})`;
        ctx.fill();
      });

      // Glow in center — green tinted
      const gradient = ctx.createRadialGradient(cx, cy, 0, cx, cy, radius * 1.2);
      gradient.addColorStop(0, "rgba(0, 202, 7, 0.04)");
      gradient.addColorStop(0.5, "rgba(0, 202, 7, 0.015)");
      gradient.addColorStop(1, "rgba(0, 0, 0, 0)");
      ctx.fillStyle = gradient;
      ctx.fillRect(0, 0, w, h);

      time += 0.008;
      animationId = requestAnimationFrame(draw);
    };

    draw();

    return () => {
      cancelAnimationFrame(animationId);
      window.removeEventListener("resize", resize);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      style={{
        position: "absolute",
        inset: 0,
        width: "100%",
        height: "100%",
        pointerEvents: "none",
      }}
    />
  );
}

// ─── Star Field Background ─────────────────────────────────────────────────

function StarField() {
  const [mounted, setMounted] = useState(false);
  const stars = useRef<Array<{ x: number; y: number; size: number; opacity: number; animDelay: number }>>([]);

  useEffect(() => {
    stars.current = Array.from({ length: 80 }, () => ({
      x: Math.random() * 100,
      y: Math.random() * 100,
      size: Math.random() * 1.5 + 0.5,
      opacity: Math.random() * 0.5 + 0.1,
      animDelay: Math.random() * 5,
    }));
    setMounted(true);
  }, []);

  if (!mounted) return null;

  return (
    <div style={{ position: "absolute", inset: 0, overflow: "hidden", pointerEvents: "none" }}>
      {stars.current.map((star, i) => (
        <div
          key={i}
          style={{
            position: "absolute",
            left: `${star.x}%`,
            top: `${star.y}%`,
            width: `${star.size}px`,
            height: `${star.size}px`,
            borderRadius: "50%",
            backgroundColor: "white",
            opacity: star.opacity,
            animation: `twinkle ${3 + star.animDelay}s ease-in-out infinite`,
            animationDelay: `${star.animDelay}s`,
          }}
        />
      ))}
    </div>
  );
}

// ─── Arrow Icon ──────────────────────────────────────────────────────────────

const ArrowUpRight = () => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width="14"
    height="14"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2.5"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <line x1="7" y1="17" x2="17" y2="7" />
    <polyline points="7 7 17 7 17 17" />
  </svg>
);

const PlayIcon = () => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width="14"
    height="14"
    viewBox="0 0 24 24"
    fill="currentColor"
    stroke="none"
  >
    <polygon points="5 3 19 12 5 21 5 3" />
  </svg>
);

// ─── Feature Icons ───────────────────────────────────────────────────────────

const CheckCircleIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24"
    fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
    <polyline points="22 4 12 14.01 9 11.01" />
  </svg>
);

const ClockIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24"
    fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="12" cy="12" r="10" />
    <polyline points="12 6 12 12 16 14" />
  </svg>
);

const BoltIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24"
    fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2" />
  </svg>
);

// ─── Template Icons ──────────────────────────────────────────────────────────

const CalendarIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24"
    fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
    <line x1="16" y1="2" x2="16" y2="6" />
    <line x1="8" y1="2" x2="8" y2="6" />
    <line x1="3" y1="10" x2="21" y2="10" />
  </svg>
);

const TargetIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24"
    fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="12" cy="12" r="10" />
    <circle cx="12" cy="12" r="6" />
    <circle cx="12" cy="12" r="2" />
  </svg>
);

const RocketIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24"
    fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M4.5 16.5c-1.5 1.26-2 5-2 5s3.74-.5 5-2c.71-.84.7-2.13-.09-2.91a2.18 2.18 0 0 0-2.91-.09z" />
    <path d="m12 15-3-3a22 22 0 0 1 2-3.95A12.88 12.88 0 0 1 22 2c0 2.72-.78 7.5-6 11a22.35 22.35 0 0 1-4 2z" />
    <path d="M9 12H4s.55-3.03 2-4c1.62-1.08 5 0 5 0" />
    <path d="M12 15v5s3.03-.55 4-2c1.08-1.62 0-5 0-5" />
  </svg>
);

const BookIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24"
    fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20" />
    <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z" />
  </svg>
);

const RepeatIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24"
    fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="17 1 21 5 17 9" />
    <path d="M3 11V9a4 4 0 0 1 4-4h14" />
    <polyline points="7 23 3 19 7 15" />
    <path d="M21 13v2a4 4 0 0 1-4 4H3" />
  </svg>
);

const UsersIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24"
    fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
    <circle cx="9" cy="7" r="4" />
    <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
    <path d="M16 3.13a4 4 0 0 1 0 7.75" />
  </svg>
);

// ─── Chevron Icon for FAQ ────────────────────────────────────────────────────

const ChevronDownIcon = ({ isOpen }: { isOpen: boolean }) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width="20"
    height="20"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    style={{
      transition: "transform 0.3s ease",
      transform: isOpen ? "rotate(180deg)" : "rotate(0deg)",
    }}
  >
    <polyline points="6 9 12 15 18 9" />
  </svg>
);

// ─── FAQ Accordion Item ──────────────────────────────────────────────────────

function FAQItem({ question, answer }: { question: string; answer: string }) {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div
      style={{
        borderBottom: `1px solid ${COLORS.gray[700]}`,
        overflow: "hidden",
      }}
    >
      <button
        onClick={() => setIsOpen(!isOpen)}
        style={{
          width: "100%",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          padding: "22px 0",
          background: "none",
          border: "none",
          cursor: "pointer",
          color: isOpen ? COLORS.green.primary : "#ffffff",
          fontSize: "16px",
          fontWeight: 600,
          textAlign: "left",
          transition: "color 0.3s ease",
          fontFamily: "inherit",
        }}
      >
        {question}
        <ChevronDownIcon isOpen={isOpen} />
      </button>
      <div
        style={{
          maxHeight: isOpen ? "300px" : "0",
          opacity: isOpen ? 1 : 0,
          transition: "max-height 0.4s ease, opacity 0.3s ease, padding 0.3s ease",
          paddingBottom: isOpen ? "20px" : "0",
          overflow: "hidden",
        }}
      >
        <p
          style={{
            fontSize: "14px",
            color: COLORS.gray[400],
            lineHeight: 1.8,
          }}
        >
          {answer}
        </p>
      </div>
    </div>
  );
}

// ─── Template Data ───────────────────────────────────────────────────────────

const templates = [
  {
    icon: <CalendarIcon />,
    title: "Daily Planner",
    desc: "Atur aktivitas harian dari pagi hingga malam dengan jadwal yang terstruktur dan prioritas yang jelas.",
    tags: ["Harian", "Prioritas"],
  },
  {
    icon: <TargetIcon />,
    title: "Weekly Goals",
    desc: "Tetapkan target mingguan dan lacak kemajuan Anda. Cocok untuk perencanaan jangka pendek yang efektif.",
    tags: ["Mingguan", "Target"],
  },
  {
    icon: <RocketIcon />,
    title: "Project Sprint",
    desc: "Kelola proyek dengan metode sprint. Bagi tugas besar menjadi tahapan kecil yang terukur.",
    tags: ["Proyek", "Sprint"],
  },
  {
    icon: <BookIcon />,
    title: "Study Schedule",
    desc: "Template khusus untuk pelajar. Atur jadwal belajar, tugas, dan deadline ujian dengan mudah.",
    tags: ["Belajar", "Jadwal"],
  },
  {
    icon: <RepeatIcon />,
    title: "Habit Tracker",
    desc: "Bangun kebiasaan positif dengan pelacak harian. Monitor konsistensi dan capai streak terbaik Anda.",
    tags: ["Kebiasaan", "Harian"],
  },
  {
    icon: <UsersIcon />,
    title: "Meeting Notes",
    desc: "Catat hasil rapat, action items, dan keputusan penting. Pastikan follow-up selalu terlaksana.",
    tags: ["Rapat", "Catatan"],
  },
];

// ─── FAQ Data ────────────────────────────────────────────────────────────────

const faqItems = [
  {
    question: "Apa itu Ben Todo?",
    answer:
      "Ben Todo adalah aplikasi produktivitas yang dirancang untuk membantu Anda mengatur tugas harian, mengelola prioritas, dan melacak tingkat energi Anda. Dengan fitur Focus Timer bawaan, Ben Todo membantu Anda tetap fokus dan produktif sepanjang hari.",
  },
  {
    question: "Apakah Ben Todo gratis digunakan?",
    answer:
      "Ya! Ben Todo dapat digunakan secara gratis. Anda bisa langsung mendaftar dan mulai menggunakan semua fitur dasar tanpa memerlukan kartu kredit.",
  },
  {
    question: "Bagaimana cara memulai menggunakan Ben Todo?",
    answer:
      "Sangat mudah! Cukup buat akun gratis dengan email Anda, lalu mulai tambahkan tugas-tugas Anda. Anda bisa mengatur prioritas, menggunakan template yang tersedia, dan memanfaatkan Focus Timer untuk sesi kerja yang lebih produktif.",
  },
  {
    question: "Apakah data saya aman?",
    answer:
      "Keamanan data Anda adalah prioritas utama kami. Semua data disimpan dengan enkripsi dan kami mengikuti standar keamanan terbaik untuk memastikan informasi Anda tetap aman dan terlindungi.",
  },
  {
    question: "Platform apa saja yang didukung?",
    answer:
      "Ben Todo tersedia di Web Browser, Mobile, dan Desktop. Anda bisa mengakses tugas Anda dari mana saja dan kapan saja dengan sinkronisasi otomatis di semua perangkat.",
  },
  {
    question: "Apakah saya bisa menggunakan template yang tersedia?",
    answer:
      "Tentu saja! Ben Todo menyediakan berbagai template produktivitas seperti Daily Planner, Weekly Goals, Project Sprint, Study Schedule, Habit Tracker, dan Meeting Notes. Anda bisa langsung menggunakan template ini untuk memulai lebih cepat.",
  },
];

// ─── Main Landing Page ──────────────────────────────────────────────────────

export default function LandingPage() {
  const [isScrolled, setIsScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => setIsScrolled(window.scrollY > 20);
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  return (
    <>
      {/* ── Inline Styles for Animations ── */}
      <style jsx global>{`
        @keyframes twinkle {
          0%, 100% { opacity: 0.1; }
          50% { opacity: 0.8; }
        }

        @keyframes fadeInUp {
          from {
            opacity: 0;
            transform: translateY(30px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        @keyframes fadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }

        @keyframes slideDown {
          from {
            opacity: 0;
            transform: translateY(-20px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        @keyframes pulseGlow {
          0%, 100% { box-shadow: 0 0 20px rgba(0, 202, 7, 0.2); }
          50% { box-shadow: 0 0 35px rgba(0, 202, 7, 0.4); }
        }

        @keyframes float {
          0%, 100% { transform: translateY(0px); }
          50% { transform: translateY(-10px); }
        }

        @keyframes shimmer {
          0% { background-position: -200% 0; }
          100% { background-position: 200% 0; }
        }

        .landing-page {
          background-color: ${COLORS.gray[900]};
          background-image: url('${PRODUCTIVITY_BG_SRC}');
          background-size: cover;
          background-attachment: fixed;
          background-position: center;
          min-height: 100vh;
          color: #ffffff;
          overflow-x: hidden;
          position: relative;
        }

        .landing-page::before {
          content: "";
          position: fixed;
          inset: 0;
          background: radial-gradient(ellipse at 50% 0%, rgba(25, 25, 25, 0.7) 0%, rgba(25, 25, 25, 0.85) 50%, rgba(25, 25, 25, 0.95) 100%);
          pointer-events: none;
          z-index: 0;
        }

        .landing-page > * {
          position: relative;
          z-index: 1;
        }

        .nav-glass {
          background: rgba(38, 38, 38, 0.7);
          backdrop-filter: blur(16px);
          -webkit-backdrop-filter: blur(16px);
          border: 1px solid ${COLORS.gray[700]};
          border-radius: 50px;
          transition: all 0.3s ease;
        }

        .nav-glass:hover {
          background: rgba(51, 51, 51, 0.8);
          border-color: ${COLORS.gray[600]};
        }

        .nav-link {
          color: ${COLORS.gray[400]};
          font-size: 13.5px;
          font-weight: 500;
          padding: 8px 18px;
          border-radius: 50px;
          transition: all 0.25s ease;
          text-decoration: none;
          letter-spacing: 0.01em;
        }

        .nav-link:hover {
          color: #ffffff;
          background: rgba(255, 255, 255, 0.06);
        }

        .btn-primary {
          display: inline-flex;
          align-items: center;
          gap: 8px;
          background: ${COLORS.green.primary};
          color: #ffffff;
          font-weight: 600;
          font-size: 14px;
          padding: 10px 22px;
          border-radius: 50px;
          border: none;
          cursor: pointer;
          text-decoration: none;
          transition: all 0.25s ease;
          letter-spacing: 0.01em;
        }

        .btn-primary:hover {
          background: ${COLORS.green.bright};
          transform: translateY(-1px);
          box-shadow: 0 8px 30px rgba(0, 202, 7, 0.3);
        }

        .btn-primary:active {
          transform: translateY(0);
        }

        .btn-secondary {
          display: inline-flex;
          align-items: center;
          gap: 8px;
          background: rgba(255, 255, 255, 0.08);
          color: #ffffff;
          font-weight: 500;
          font-size: 14px;
          padding: 12px 26px;
          border-radius: 50px;
          border: 1px solid ${COLORS.gray[700]};
          cursor: pointer;
          text-decoration: none;
          transition: all 0.25s ease;
          backdrop-filter: blur(10px);
        }

        .btn-secondary:hover {
          background: rgba(255, 255, 255, 0.14);
          border-color: ${COLORS.gray[600]};
          transform: translateY(-1px);
        }

        .hero-title {
          font-size: clamp(36px, 5vw, 64px);
          font-weight: 700;
          line-height: 1.08;
          letter-spacing: -0.03em;
          animation: fadeInUp 0.9s ease-out 0.3s both;
        }

        .hero-subtitle {
          font-size: clamp(14px, 1.5vw, 16px);
          color: ${COLORS.gray[400]};
          line-height: 1.7;
          max-width: 420px;
          animation: fadeInUp 0.9s ease-out 0.5s both;
        }

        .hero-buttons {
          animation: fadeInUp 0.9s ease-out 0.7s both;
        }

        .btn-hero-primary {
          display: inline-flex;
          align-items: center;
          gap: 10px;
          background: ${COLORS.green.primary};
          color: #ffffff;
          font-weight: 600;
          font-size: 15px;
          padding: 14px 28px;
          border-radius: 50px;
          border: none;
          cursor: pointer;
          text-decoration: none;
          transition: all 0.3s ease;
          animation: pulseGlow 3s ease-in-out infinite;
        }

        .btn-hero-primary:hover {
          background: ${COLORS.green.bright};
          transform: translateY(-2px) scale(1.02);
          box-shadow: 0 12px 40px rgba(0, 202, 7, 0.35);
        }

        .supported-section {
          animation: fadeInUp 0.9s ease-out 0.9s both;
        }

        .platform-icon {
          display: flex;
          align-items: center;
          justify-content: center;
          width: 38px;
          height: 38px;
          border-radius: 50%;
          background: rgba(255, 255, 255, 0.08);
          border: 1px solid ${COLORS.gray[700]};
          color: ${COLORS.gray[400]};
          transition: all 0.25s ease;
        }

        .platform-icon:hover {
          background: rgba(0, 202, 7, 0.15);
          color: ${COLORS.green.primary};
          border-color: ${COLORS.green.dark};
          transform: translateY(-2px);
        }

        /* Features / Fitur Section */
        .features-section {
          padding: 100px 0 80px;
          position: relative;
        }

        .feature-card {
          background: rgba(38, 38, 38, 0.6);
          border: 1px solid ${COLORS.gray[700]};
          border-radius: 20px;
          padding: 36px 30px;
          transition: all 0.35s ease;
          position: relative;
          overflow: hidden;
          backdrop-filter: blur(10px);
        }

        .feature-card::before {
          content: "";
          position: absolute;
          top: 0;
          left: 0;
          right: 0;
          height: 1px;
          background: linear-gradient(90deg, transparent, ${COLORS.green.primary}, transparent);
          opacity: 0;
          transition: opacity 0.35s ease;
        }

        .feature-card:hover {
          background: rgba(51, 51, 51, 0.7);
          border-color: ${COLORS.gray[600]};
          transform: translateY(-4px);
          box-shadow: 0 20px 60px rgba(0, 0, 0, 0.3);
        }

        .feature-card:hover::before {
          opacity: 1;
        }

        .feature-icon-box {
          width: 48px;
          height: 48px;
          border-radius: 14px;
          background: rgba(0, 202, 7, 0.12);
          display: flex;
          align-items: center;
          justify-content: center;
          color: ${COLORS.green.primary};
          margin-bottom: 20px;
        }

        /* Template Section */
        .template-card {
          background: rgba(38, 38, 38, 0.5);
          border: 1px solid ${COLORS.gray[700]};
          border-radius: 20px;
          padding: 32px 28px;
          transition: all 0.35s ease;
          position: relative;
          overflow: hidden;
          backdrop-filter: blur(10px);
        }

        .template-card:hover {
          background: rgba(51, 51, 51, 0.6);
          border-color: ${COLORS.green.dark};
          transform: translateY(-6px);
          box-shadow: 0 24px 60px rgba(0, 202, 7, 0.08);
        }

        .template-card::after {
          content: "";
          position: absolute;
          bottom: 0;
          left: 0;
          right: 0;
          height: 2px;
          background: linear-gradient(90deg, ${COLORS.green.dark}, ${COLORS.green.primary}, ${COLORS.green.bright});
          opacity: 0;
          transition: opacity 0.35s ease;
        }

        .template-card:hover::after {
          opacity: 1;
        }

        .template-tag {
          display: inline-block;
          padding: 4px 12px;
          border-radius: 50px;
          font-size: 11px;
          font-weight: 600;
          letter-spacing: 0.03em;
          background: rgba(0, 202, 7, 0.1);
          color: ${COLORS.green.primary};
          border: 1px solid rgba(0, 202, 7, 0.15);
          transition: all 0.25s ease;
        }

        .template-card:hover .template-tag {
          background: rgba(0, 202, 7, 0.18);
          border-color: rgba(0, 202, 7, 0.3);
        }

        /* Section label badge */
        .section-badge {
          display: inline-block;
          padding: 6px 16px;
          border-radius: 50px;
          border: 1px solid rgba(0, 202, 7, 0.25);
          background: rgba(0, 202, 7, 0.08);
          color: ${COLORS.green.primary};
          font-size: 12px;
          font-weight: 600;
          letter-spacing: 0.08em;
          text-transform: uppercase;
          margin-bottom: 20px;
        }

        /* Footer */
        .footer-section {
          border-top: 1px solid ${COLORS.gray[700]};
          padding: 40px 0;
        }

        /* FAQ Section */
        .faq-container {
          max-width: 700px;
          margin: 0 auto;
        }

        /* Responsive */
        @media (max-width: 768px) {
          .nav-desktop {
            display: none !important;
          }
          .template-grid {
            grid-template-columns: 1fr !important;
          }
        }
      `}</style>

      <div className="landing-page">
        {/* ── Star Field Background ── */}
        <StarField />

        {/* ════════════════════════════════════════
            HEADER / NAVIGATION
        ════════════════════════════════════════ */}
        <header
          style={{
            position: "fixed",
            top: 0,
            left: 0,
            right: 0,
            zIndex: 50,
            padding: isScrolled ? "14px 0" : "20px 0",
            transition: "all 0.3s ease",
            background: isScrolled ? `rgba(25, 25, 25, 0.85)` : "transparent",
            backdropFilter: isScrolled ? "blur(20px)" : "none",
            animation: "slideDown 0.6s ease-out",
          }}
        >
          <div
            style={{
              maxWidth: "1200px",
              margin: "0 auto",
              padding: "0 32px",
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
            }}
          >
            {/* Logo */}
            <Link
              href="/"
              id="landing-logo"
              style={{
                display: "flex",
                alignItems: "center",
                gap: "10px",
                textDecoration: "none",
                color: "#ffffff",
              }}
            >
              <Image
                src={LOGO_SRC}
                alt="Ben Todo Logo"
                width={36}
                height={36}
                style={{ width: "36px", height: "auto" }}
                priority
              />
              <span style={{ fontSize: "18px", fontWeight: 700, letterSpacing: "-0.02em" }}>
                Ben Todo
              </span>
            </Link>

            {/* Center Nav */}
            <nav
              className="nav-glass nav-desktop"
              style={{
                display: "flex",
                alignItems: "center",
                gap: "2px",
                padding: "5px 6px",
              }}
            >
              <a href="#fitur" className="nav-link">Fitur</a>
              <a href="#template" className="nav-link">Template</a>
              <a href="#about" className="nav-link">About</a>
              <a href="#faq" className="nav-link">FAQ</a>
            </nav>

            {/* Login Button */}
            <Link href="/login" id="landing-login-btn" className="btn-primary">
              Login
              <ArrowUpRight />
            </Link>
          </div>
        </header>

        {/* ════════════════════════════════════════
            HERO SECTION
        ════════════════════════════════════════ */}
        <section
          style={{
            position: "relative",
            minHeight: "100vh",
            display: "flex",
            alignItems: "flex-end",
            paddingBottom: "80px",
          }}
        >
          {/* Wireframe Sphere Canvas */}
          <WireframeSphere />

          {/* Gradient overlay at bottom */}
          <div
            style={{
              position: "absolute",
              bottom: 0,
              left: 0,
              right: 0,
              height: "40%",
              background: `linear-gradient(to top, ${COLORS.gray[900]}, transparent)`,
              pointerEvents: "none",
            }}
          />

          {/* Hero Content */}
          <div
            style={{
              position: "relative",
              zIndex: 10,
              maxWidth: "1200px",
              margin: "0 auto",
              padding: "0 32px",
              width: "100%",
              display: "flex",
              alignItems: "flex-end",
              justifyContent: "space-between",
              flexWrap: "wrap",
              gap: "40px",
            }}
          >
            {/* Left: Text Content */}
            <div style={{ maxWidth: "600px" }}>
              <h1 className="hero-title">
                Organize Your Day,{" "}
                <br />
                Achieve Your{" "}
                <span style={{ color: COLORS.green.primary }}>Best</span>
              </h1>

              <p className="hero-subtitle" style={{ marginTop: "20px" }}>
                Stay focused, manage your priorities, and track your energy
                levels — all in one beautifully crafted productivity app.
              </p>

              {/* CTA Buttons */}
              <div
                className="hero-buttons"
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "16px",
                  marginTop: "36px",
                  flexWrap: "wrap",
                }}
              >
                <Link href="/login" id="hero-login-btn" className="btn-hero-primary">
                  Login
                  <span
                    style={{
                      display: "inline-flex",
                      alignItems: "center",
                      justifyContent: "center",
                      width: "24px",
                      height: "24px",
                      borderRadius: "50%",
                      background: "rgba(0,0,0,0.2)",
                    }}
                  >
                    <ArrowUpRight />
                  </span>
                </Link>

                <Link href="/register" id="hero-register-btn" className="btn-secondary">
                  <PlayIcon />
                  Get Started Free
                </Link>
              </div>
            </div>

            {/* Right: Supported platforms */}
            <div className="supported-section" style={{ textAlign: "right" }}>
              <span
                style={{
                  fontSize: "13px",
                  color: COLORS.gray[400],
                  fontWeight: 500,
                  letterSpacing: "0.03em",
                }}
              >
                Available on:
              </span>
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "10px",
                  marginTop: "10px",
                }}
              >
                {/* Web */}
                <div className="platform-icon" title="Web Browser">
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <circle cx="12" cy="12" r="10" />
                    <line x1="2" y1="12" x2="22" y2="12" />
                    <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z" />
                  </svg>
                </div>
                {/* Mobile */}
                <div className="platform-icon" title="Mobile">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <rect x="5" y="2" width="14" height="20" rx="2" ry="2" />
                    <line x1="12" y1="18" x2="12.01" y2="18" />
                  </svg>
                </div>
                {/* Desktop */}
                <div className="platform-icon" title="Desktop">
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <rect x="2" y="3" width="20" height="14" rx="2" ry="2" />
                    <line x1="8" y1="21" x2="16" y2="21" />
                    <line x1="12" y1="17" x2="12" y2="21" />
                  </svg>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* ════════════════════════════════════════
            FITUR SECTION
        ════════════════════════════════════════ */}
        <section id="fitur" className="features-section">
          {/* Subtle separator */}
          <div
            style={{
              position: "absolute",
              top: 0,
              left: "50%",
              transform: "translateX(-50%)",
              width: "200px",
              height: "1px",
              background: `linear-gradient(90deg, transparent, ${COLORS.green.primary}, transparent)`,
            }}
          />

          <div
            style={{
              maxWidth: "1200px",
              margin: "0 auto",
              padding: "0 32px",
            }}
          >
            {/* Section Header */}
            <div style={{ textAlign: "center", marginBottom: "60px" }}>
              <span className="section-badge">Fitur</span>
              <h2
                style={{
                  fontSize: "clamp(28px, 3.5vw, 42px)",
                  fontWeight: 700,
                  letterSpacing: "-0.02em",
                  lineHeight: 1.2,
                }}
              >
                Semua yang kamu butuhkan untuk{" "}
                <span style={{ color: COLORS.green.primary }}>tetap produktif</span>
              </h2>
              <p
                style={{
                  fontSize: "15px",
                  color: COLORS.gray[400],
                  marginTop: "14px",
                  maxWidth: "500px",
                  marginLeft: "auto",
                  marginRight: "auto",
                  lineHeight: 1.7,
                }}
              >
                Alat canggih yang dirancang untuk membantu Anda fokus pada hal yang paling penting
                dan mencapai tujuan secara efisien.
              </p>
            </div>

            {/* Feature Cards */}
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))",
                gap: "24px",
              }}
            >
              {/* Card 1: Priority Tasks */}
              <div className="feature-card">
                <div className="feature-icon-box">
                  <CheckCircleIcon />
                </div>
                <h3
                  style={{
                    fontSize: "18px",
                    fontWeight: 600,
                    marginBottom: "10px",
                    letterSpacing: "-0.01em",
                  }}
                >
                  Priority Tasks
                </h3>
                <p
                  style={{
                    fontSize: "14px",
                    color: COLORS.gray[400],
                    lineHeight: 1.7,
                  }}
                >
                  Atur tugas berdasarkan tingkat prioritas. Fokus pada hal berdampak tinggi terlebih dahulu
                  dan jangan pernah lewatkan apa yang benar-benar penting dalam hari Anda.
                </p>
              </div>

              {/* Card 2: Focus Timer */}
              <div className="feature-card">
                <div className="feature-icon-box">
                  <ClockIcon />
                </div>
                <h3
                  style={{
                    fontSize: "18px",
                    fontWeight: 600,
                    marginBottom: "10px",
                    letterSpacing: "-0.01em",
                  }}
                >
                  Focus Timer
                </h3>
                <p
                  style={{
                    fontSize: "14px",
                    color: COLORS.gray[400],
                    lineHeight: 1.7,
                  }}
                >
                  Timer Pomodoro bawaan untuk membantu Anda mempertahankan sesi fokus mendalam.
                  Lacak waktu produktif Anda dan bangun kebiasaan kerja yang lebih baik.
                </p>
              </div>

              {/* Card 3: Energy Level */}
              <div className="feature-card">
                <div className="feature-icon-box">
                  <BoltIcon />
                </div>
                <h3
                  style={{
                    fontSize: "18px",
                    fontWeight: 600,
                    marginBottom: "10px",
                    letterSpacing: "-0.01em",
                  }}
                >
                  Energy Tracking
                </h3>
                <p
                  style={{
                    fontSize: "14px",
                    color: COLORS.gray[400],
                    lineHeight: 1.7,
                  }}
                >
                  Pantau tingkat energi Anda sepanjang hari. Jadwalkan tugas berat
                  saat Anda dalam performa puncak untuk produktivitas maksimal.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* ════════════════════════════════════════
            TEMPLATE SECTION
        ════════════════════════════════════════ */}
        <section
          id="template"
          style={{
            padding: "80px 0 100px",
            position: "relative",
          }}
        >
          {/* Top separator */}
          <div
            style={{
              position: "absolute",
              top: 0,
              left: "50%",
              transform: "translateX(-50%)",
              width: "300px",
              height: "1px",
              background: `linear-gradient(90deg, transparent, ${COLORS.gray[600]}, transparent)`,
            }}
          />

          <div
            style={{
              maxWidth: "1200px",
              margin: "0 auto",
              padding: "0 32px",
            }}
          >
            <div style={{ textAlign: "center", marginBottom: "60px" }}>
              <span className="section-badge">Template</span>
              <h2
                style={{
                  fontSize: "clamp(28px, 3.5vw, 42px)",
                  fontWeight: 700,
                  letterSpacing: "-0.02em",
                  lineHeight: 1.2,
                }}
              >
                Template siap pakai untuk{" "}
                <span style={{ color: COLORS.green.primary }}>mulai lebih cepat</span>
              </h2>
              <p
                style={{
                  fontSize: "15px",
                  color: COLORS.gray[400],
                  marginTop: "14px",
                  maxWidth: "520px",
                  marginLeft: "auto",
                  marginRight: "auto",
                  lineHeight: 1.7,
                }}
              >
                Pilih dari berbagai template produktivitas yang telah dirancang untuk membantu
                Anda memulai dengan cepat dan tetap terorganisir.
              </p>
            </div>

            {/* Template Cards Grid */}
            <div
              className="template-grid"
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(auto-fit, minmax(320px, 1fr))",
                gap: "24px",
              }}
            >
              {templates.map((tmpl, i) => (
                <div key={i} className="template-card">
                  <div
                    style={{
                      width: "52px",
                      height: "52px",
                      borderRadius: "16px",
                      background: `linear-gradient(135deg, rgba(0, 202, 7, 0.15), rgba(0, 112, 11, 0.1))`,
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      color: COLORS.green.primary,
                      marginBottom: "20px",
                    }}
                  >
                    {tmpl.icon}
                  </div>
                  <h3
                    style={{
                      fontSize: "18px",
                      fontWeight: 600,
                      marginBottom: "10px",
                      letterSpacing: "-0.01em",
                    }}
                  >
                    {tmpl.title}
                  </h3>
                  <p
                    style={{
                      fontSize: "14px",
                      color: COLORS.gray[400],
                      lineHeight: 1.7,
                      marginBottom: "18px",
                    }}
                  >
                    {tmpl.desc}
                  </p>
                  <div style={{ display: "flex", gap: "8px", flexWrap: "wrap" }}>
                    {tmpl.tags.map((tag, j) => (
                      <span key={j} className="template-tag">
                        {tag}
                      </span>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ════════════════════════════════════════
            ABOUT SECTION
        ════════════════════════════════════════ */}
        <section
          id="about"
          style={{
            padding: "80px 0",
            position: "relative",
          }}
        >
          {/* Top separator */}
          <div
            style={{
              position: "absolute",
              top: 0,
              left: "50%",
              transform: "translateX(-50%)",
              width: "300px",
              height: "1px",
              background: `linear-gradient(90deg, transparent, ${COLORS.gray[600]}, transparent)`,
            }}
          />

          <div
            style={{
              maxWidth: "800px",
              margin: "0 auto",
              padding: "0 32px",
              textAlign: "center",
            }}
          >
            <span className="section-badge">About</span>
            <h2
              style={{
                fontSize: "clamp(28px, 3.5vw, 42px)",
                fontWeight: 700,
                letterSpacing: "-0.02em",
                lineHeight: 1.2,
                marginBottom: "24px",
              }}
            >
              Tentang{" "}
              <span style={{ color: COLORS.green.primary }}>Ben Todo</span>
            </h2>

            <div
              style={{
                background: `rgba(38, 38, 38, 0.5)`,
                border: `1px solid ${COLORS.gray[700]}`,
                borderRadius: "28px",
                padding: "48px 40px",
                position: "relative",
                overflow: "hidden",
                backdropFilter: "blur(10px)",
              }}
            >
              {/* Decorative gradient */}
              <div
                style={{
                  position: "absolute",
                  top: "-50%",
                  left: "-20%",
                  width: "140%",
                  height: "100%",
                  background: `radial-gradient(ellipse, rgba(0, 202, 7, 0.05) 0%, transparent 60%)`,
                  pointerEvents: "none",
                }}
              />

              <p
                style={{
                  fontSize: "16px",
                  color: COLORS.gray[100],
                  lineHeight: 1.8,
                  marginBottom: "20px",
                  position: "relative",
                }}
              >
                Ben Todo lahir dari kebutuhan sederhana: mengelola hari dengan lebih baik.
                Kami percaya bahwa produktivitas bukan tentang melakukan lebih banyak hal,
                tapi tentang melakukan hal yang <strong style={{ color: COLORS.green.primary }}>benar-benar penting</strong>.
              </p>
              <p
                style={{
                  fontSize: "15px",
                  color: COLORS.gray[400],
                  lineHeight: 1.8,
                  marginBottom: "36px",
                  position: "relative",
                }}
              >
                Dengan kombinasi task management, focus timer, dan energy tracking,
                Ben Todo membantu ribuan pengguna mentransformasi cara mereka bekerja
                dan mencapai tujuan setiap hari.
              </p>

              <div style={{ position: "relative" }}>
                <Link href="/register" id="cta-register-btn" className="btn-hero-primary">
                  Buat Akun Gratis
                  <span
                    style={{
                      display: "inline-flex",
                      alignItems: "center",
                      justifyContent: "center",
                      width: "24px",
                      height: "24px",
                      borderRadius: "50%",
                      background: "rgba(0,0,0,0.2)",
                    }}
                  >
                    <ArrowUpRight />
                  </span>
                </Link>
              </div>
            </div>

            {/* Stats */}
            <div
              style={{
                display: "flex",
                justifyContent: "center",
                gap: "60px",
                marginTop: "48px",
                flexWrap: "wrap",
              }}
            >
              {[
                { value: "10K+", label: "Pengguna Aktif" },
                { value: "50K+", label: "Tugas Selesai" },
                { value: "99%", label: "Uptime" },
              ].map((stat, i) => (
                <div key={i} style={{ textAlign: "center" }}>
                  <div
                    style={{
                      fontSize: "32px",
                      fontWeight: 700,
                      color: COLORS.green.primary,
                      letterSpacing: "-0.02em",
                    }}
                  >
                    {stat.value}
                  </div>
                  <div
                    style={{
                      fontSize: "13px",
                      color: COLORS.gray[400],
                      marginTop: "4px",
                      fontWeight: 500,
                    }}
                  >
                    {stat.label}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ════════════════════════════════════════
            FAQ SECTION
        ════════════════════════════════════════ */}
        <section
          id="faq"
          style={{
            padding: "80px 0 100px",
            position: "relative",
          }}
        >
          {/* Top separator */}
          <div
            style={{
              position: "absolute",
              top: 0,
              left: "50%",
              transform: "translateX(-50%)",
              width: "300px",
              height: "1px",
              background: `linear-gradient(90deg, transparent, ${COLORS.gray[600]}, transparent)`,
            }}
          />

          <div
            style={{
              maxWidth: "1200px",
              margin: "0 auto",
              padding: "0 32px",
            }}
          >
            <div style={{ textAlign: "center", marginBottom: "60px" }}>
              <span className="section-badge">FAQ</span>
              <h2
                style={{
                  fontSize: "clamp(28px, 3.5vw, 42px)",
                  fontWeight: 700,
                  letterSpacing: "-0.02em",
                  lineHeight: 1.2,
                }}
              >
                Pertanyaan yang{" "}
                <span style={{ color: COLORS.green.primary }}>sering ditanyakan</span>
              </h2>
              <p
                style={{
                  fontSize: "15px",
                  color: COLORS.gray[400],
                  marginTop: "14px",
                  maxWidth: "450px",
                  marginLeft: "auto",
                  marginRight: "auto",
                  lineHeight: 1.7,
                }}
              >
                Temukan jawaban untuk pertanyaan umum tentang Ben Todo di bawah ini.
              </p>
            </div>

            <div className="faq-container">
              <div
                style={{
                  background: `rgba(38, 38, 38, 0.4)`,
                  border: `1px solid ${COLORS.gray[700]}`,
                  borderRadius: "20px",
                  padding: "12px 32px",
                  backdropFilter: "blur(10px)",
                }}
              >
                {faqItems.map((item, i) => (
                  <FAQItem key={i} question={item.question} answer={item.answer} />
                ))}
              </div>
            </div>
          </div>
        </section>

        {/* ════════════════════════════════════════
            FOOTER
        ════════════════════════════════════════ */}
        <footer className="footer-section">
          <div
            style={{
              maxWidth: "1200px",
              margin: "0 auto",
              padding: "0 32px",
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              flexWrap: "wrap",
              gap: "16px",
            }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
              <Image
                src={LOGO_SRC}
                alt="Ben Todo Logo"
                width={24}
                height={24}
                style={{ width: "24px", height: "auto" }}
              />
              <span
                style={{
                  fontSize: "14px",
                  fontWeight: 600,
                  color: COLORS.gray[400],
                }}
              >
                Ben Todo
              </span>
            </div>
            <p
              style={{
                fontSize: "13px",
                color: COLORS.gray[600],
              }}
            >
              © {new Date().getFullYear()} Ben Todo. All rights reserved.
            </p>
          </div>
        </footer>
      </div>
    </>
  );
}
