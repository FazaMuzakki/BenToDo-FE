"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { LOGO_SRC } from "./lib/assets";
import { createGuestSession, saveGuestSession } from "./lib/api";

const COLORS = {
  green: {
    primary: "#008B1F",
    dark: "#007A1B",
    bright: "#12A63A",
    soft: "#ECFFF0",
  },
  neutral: {
    ink: "#202124",
    muted: "#666666",
    line: "#D9D9D9",
    softLine: "#ECECEC",
    surface: "#FFFFFF",
    wash: "#F8FAF8",
  },
  accent: {
    mint: "#BFEBDD",
    lilac: "#C9B8FF",
  },
};

const navLinks = [
  { href: "#fitur", label: "Fitur" },
  { href: "#template", label: "Template" },
  { href: "#about", label: "About" },
  { href: "#faq", label: "FAQ" },
];

const guideSteps = [
  {
    label: "01",
    title: "Masuk atau pakai Guest Mode",
    desc: "Coba alur dasar tanpa akun, lalu pindahkan task saat login atau register.",
  },
  {
    label: "02",
    title: "Kumpulkan bank tugas",
    desc: "Masukkan tugas kuliah, deadline, dan bobot energi agar semua terlihat jelas.",
  },
  {
    label: "03",
    title: "Pilih tiga prioritas",
    desc: "Dashboard membantu kamu fokus ke pekerjaan yang paling dekat dan penting.",
  },
  {
    label: "04",
    title: "Kerjakan dengan ritme",
    desc: "Gunakan focus session, cek energi, dan biarkan reminder deadline menjaga jadwal.",
  },
];

const featureRows = [
  {
    key: "bank",
    title: "Bank tugas dan Rule of 3",
    desc: "Semua tugas kuliah disimpan dalam satu workspace, lalu dashboard menahan fokus ke tiga prioritas utama agar pengguna tidak kewalahan.",
  },
  {
    key: "focus",
    title: "Focus session",
    desc: "Task bisa langsung dibawa ke mode fokus. Alurnya membantu pengguna mulai mengerjakan, bukan hanya mencatat.",
  },
  {
    key: "energy",
    title: "Energy system",
    desc: "Bobot ringan, sedang, dan berat membuat beban harian terasa lebih realistis dan tidak sekadar daftar tugas panjang.",
  },
  {
    key: "reminder",
    title: "Deadline reminder",
    desc: "Untuk user terdaftar, sistem menyiapkan notifikasi aplikasi dan email agar deadline penting tidak terlewat.",
  },
];

const templates = [
  {
    title: "Makalah",
    desc: "Topik, referensi, outline, penulisan, dan revisi.",
    meta: "3 task",
  },
  {
    title: "Presentasi",
    desc: "Poin utama, struktur slide, dan latihan penyampaian.",
    meta: "3 task",
  },
  {
    title: "Praktikum",
    desc: "Modul, eksperimen, catatan hasil, dan laporan.",
    meta: "3 task",
  },
  {
    title: "Ujian",
    desc: "Materi inti, ringkasan, latihan soal, dan review.",
    meta: "4 task",
  },
];

const faqItems = [
  {
    question: "Apa itu Bento-Do?",
    answer:
      "Bento-Do adalah aplikasi produktivitas mahasiswa untuk mengelola bank tugas, memilih prioritas dengan Rule of 3, menjalankan focus session, dan menjaga energi harian agar belajar lebih terarah.",
  },
  {
    question: "Bisa dipakai tanpa login?",
    answer:
      "Bisa. Guest Mode membuat session sementara agar kamu dapat mencoba dashboard dan task dasar tanpa membuat akun terlebih dahulu.",
  },
  {
    question: "Kalau nanti daftar akun, task guest hilang?",
    answer:
      "Tidak. Saat login atau register, frontend mengirim token guest ke backend sehingga task guest bisa dipindahkan ke akun user.",
  },
  {
    question: "Apa fungsi Energy System?",
    answer:
      "Energy System membantu membatasi beban kerja harian. Task ringan, sedang, dan berat memengaruhi energi agar pengguna tidak memaksakan terlalu banyak tugas sekaligus.",
  },
  {
    question: "Bagaimana deadline reminder bekerja?",
    answer:
      "Backend membuat notification reminder untuk deadline, lalu mengirim pengingat di aplikasi dan email untuk user terdaftar.",
  },
];

const pixelDots = Array.from({ length: 9 }).flatMap((_, ring) => {
  const radius = 58 + ring * 30;
  const count = 40 + ring * 4;

  return Array.from({ length: count }).flatMap((__, point) => {
    const angle = (point / count) * 360;
    const gap = (point + ring * 3) % 11 === 0 || (point + ring) % 17 === 0;
    const onMainArc = angle > 200 || angle < 92;
    const onTraceArc = angle > 120 && angle < 178 && ring > 4;

    if (gap || (!onMainArc && !onTraceArc)) return [];

    const rad = (angle * Math.PI) / 180;
    return {
      x: Math.cos(rad) * radius,
      y: Math.sin(rad) * radius,
      size: ring % 4 === 0 ? 2.6 : 1.8,
      shade: ring % 3 === 0 ? COLORS.green.primary : "#7D8581",
      opacity: ring % 3 === 0 ? 0.28 : 0.18,
      delay: `${(point % 12) * 0.12}s`,
    };
  });
});

const ArrowUpRight = () => (
  <svg
    width="14"
    height="14"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2.4"
    strokeLinecap="round"
    strokeLinejoin="round"
    aria-hidden="true"
  >
    <line x1="7" y1="17" x2="17" y2="7" />
    <polyline points="7 7 17 7 17 17" />
  </svg>
);

const GlobeIcon = () => (
  <svg
    width="18"
    height="18"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="1.9"
    strokeLinecap="round"
    strokeLinejoin="round"
    aria-hidden="true"
  >
    <circle cx="12" cy="12" r="10" />
    <path d="M2 12h20" />
    <path d="M12 2a15.3 15.3 0 0 1 0 20" />
    <path d="M12 2a15.3 15.3 0 0 0 0 20" />
  </svg>
);

const PhoneIcon = () => (
  <svg
    width="18"
    height="18"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="1.9"
    strokeLinecap="round"
    strokeLinejoin="round"
    aria-hidden="true"
  >
    <rect x="7" y="2" width="10" height="20" rx="2" />
    <path d="M11 18h2" />
  </svg>
);

const MonitorIcon = () => (
  <svg
    width="18"
    height="18"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="1.9"
    strokeLinecap="round"
    strokeLinejoin="round"
    aria-hidden="true"
  >
    <rect x="3" y="4" width="18" height="13" rx="2" />
    <path d="M8 21h8" />
    <path d="M12 17v4" />
  </svg>
);

const ChevronDownIcon = ({ isOpen }: { isOpen: boolean }) => (
  <svg
    width="20"
    height="20"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    style={{ transform: isOpen ? "rotate(180deg)" : "rotate(0deg)" }}
    aria-hidden="true"
  >
    <polyline points="6 9 12 15 18 9" />
  </svg>
);

function LogoMark({ size = 36 }: { size?: number }) {
  return (
    <span
      aria-hidden="true"
      style={{
        width: `${size}px`,
        height: `${size}px`,
        display: "inline-block",
        backgroundColor: COLORS.green.primary,
        WebkitMask: `url('${LOGO_SRC}') center / contain no-repeat`,
        mask: `url('${LOGO_SRC}') center / contain no-repeat`,
      }}
    />
  );
}

function PixelOrbitBackground() {
  return (
    <div className="pixel-orbit" aria-hidden="true">
      <div className="pixel-orbit__globe">
        <span className="globe-arc globe-arc--one" />
        <span className="globe-arc globe-arc--two" />
        <span className="globe-arc globe-arc--three" />
        <span className="globe-arc globe-arc--four" />
      </div>
      <div className="pixel-orbit__rings" />
      <div className="pixel-orbit__dots">
        {pixelDots.map((dot, index) => (
          <span
            key={`${dot.x}-${dot.y}-${index}`}
            style={{
              width: `${dot.size}px`,
              height: `${dot.size}px`,
              backgroundColor: dot.shade,
              opacity: dot.opacity,
              transform: `translate(${dot.x}px, ${dot.y}px)`,
              animationDelay: dot.delay,
            }}
          />
        ))}
      </div>
    </div>
  );
}

function FAQItem({ question, answer }: { question: string; answer: string }) {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div className="faq-item">
      <button type="button" onClick={() => setIsOpen((open) => !open)}>
        <span>{question}</span>
        <ChevronDownIcon isOpen={isOpen} />
      </button>
      <div className={isOpen ? "faq-answer faq-answer--open" : "faq-answer"}>
        <p>{answer}</p>
      </div>
    </div>
  );
}

export default function LandingPage() {
  const router = useRouter();
  const [isGuestLoading, setIsGuestLoading] = useState(false);
  const [guestError, setGuestError] = useState<string | null>(null);

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          entry.target.classList.toggle("is-visible", entry.isIntersecting);
        });
      },
      { threshold: 0.16 },
    );

    document.querySelectorAll(".reveal").forEach((item) => observer.observe(item));

    return () => observer.disconnect();
  }, []);

  const handleGuestMode = async () => {
    setGuestError(null);
    setIsGuestLoading(true);

    try {
      const response = await createGuestSession();
      saveGuestSession(response.data);
      router.push("/dashboard");
    } catch (error) {
      setGuestError(
        error instanceof Error
          ? error.message
          : "Guest mode belum bisa dimulai. Silakan coba lagi.",
      );
    } finally {
      setIsGuestLoading(false);
    }
  };

  return (
    <>
      <style>{`
        @keyframes heroRise {
          from {
            opacity: 0;
            transform: translateY(18px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        @keyframes orbitDrift {
          0% {
            transform: translate3d(0, 0, 0) rotate(0deg);
          }
          100% {
            transform: translate3d(0, 0, 0) rotate(360deg);
          }
        }

        @keyframes pixelPulse {
          0%,
          100% {
            transform: translate(var(--tx, 0), var(--ty, 0)) scale(0.9);
          }
          50% {
            transform: translate(var(--tx, 0), var(--ty, 0)) scale(1.22);
          }
        }

        @keyframes lineSweep {
          from {
            transform: translateX(-100%);
          }
          to {
            transform: translateX(100%);
          }
        }

        .landing-page {
          min-height: 100vh;
          color: ${COLORS.neutral.ink};
          background:
            radial-gradient(circle at 15% 20%, rgba(0, 139, 31, 0.04), transparent 28%),
            radial-gradient(circle at 82% 22%, rgba(0, 139, 31, 0.035), transparent 30%),
            radial-gradient(circle at 92% 12%, rgba(120, 120, 120, 0.035), transparent 22%),
            linear-gradient(180deg, #ffffff 0%, #fbfcfb 52%, #ffffff 100%);
          overflow-x: hidden;
          position: relative;
        }

        .landing-page::before {
          content: "";
          position: fixed;
          inset: 0;
          pointer-events: none;
          z-index: 0;
          background-image:
            radial-gradient(circle, rgba(0, 139, 31, 0.24) 1px, transparent 1.6px),
            radial-gradient(circle, rgba(30, 30, 30, 0.12) 1px, transparent 1.6px);
          background-size: 142px 142px, 210px 210px;
          background-position: 24px 38px, 82px 14px;
          mask-image: linear-gradient(90deg, rgba(0, 0, 0, 0.5), rgba(0, 0, 0, 0.12) 38%, rgba(0, 0, 0, 0.42));
          opacity: 0.24;
        }

        .landing-page > * {
          position: relative;
          z-index: 1;
        }

        .site-header {
          position: fixed;
          top: 22px;
          left: 0;
          right: 0;
          z-index: 50;
          background: transparent;
          border-bottom: none;
          box-shadow: none;
        }

        .site-header__inner {
          max-width: 1200px;
          height: 58px;
          margin: 0 auto;
          padding: 0 32px;
          display: grid;
          grid-template-columns: 1fr auto 1fr;
          align-items: center;
          gap: 24px;
        }

        .brand {
          display: inline-flex;
          align-items: center;
          gap: 10px;
          width: fit-content;
          color: ${COLORS.neutral.ink};
          text-decoration: none;
          font-family: var(--font-outfit), sans-serif;
          font-size: 18px;
          font-weight: 900;
          letter-spacing: -0.02em;
        }

        .nav-menu {
          display: flex;
          align-items: center;
          gap: 4px;
          padding: 6px;
          border: 1px solid ${COLORS.neutral.softLine};
          border-radius: 999px;
          background: #ffffff;
          box-shadow: 0 14px 42px rgba(15, 23, 42, 0.06);
        }

        .nav-menu a {
          color: ${COLORS.neutral.muted};
          text-decoration: none;
          font-size: 13px;
          font-weight: 600;
          padding: 8px 14px;
          border-radius: 999px;
          transition: color 180ms ease, background 180ms ease;
        }

        .nav-menu a:hover {
          color: ${COLORS.green.primary};
          background: ${COLORS.green.soft};
        }

        .nav-actions {
          display: flex;
          justify-content: flex-end;
          align-items: center;
          gap: 10px;
        }

        .nav-login,
        .nav-signup,
        .btn-primary,
        .btn-secondary,
        .btn-text {
          display: inline-flex;
          align-items: center;
          justify-content: center;
          gap: 8px;
          border-radius: 999px;
          text-decoration: none;
          font-size: 14px;
          font-weight: 700;
          transition: transform 180ms ease, border-color 180ms ease, background 180ms ease, color 180ms ease, box-shadow 180ms ease;
        }

        .nav-login {
          color: ${COLORS.green.primary};
          border: 1px solid rgba(0, 139, 31, 0.22);
          padding: 10px 20px;
          background: ${COLORS.neutral.surface};
        }

        .nav-login:hover {
          transform: translateY(-1px);
          border-color: ${COLORS.green.primary};
        }

        .nav-signup,
        .btn-primary {
          color: #ffffff;
          border: 1px solid ${COLORS.green.primary};
          padding: 11px 22px;
          background: ${COLORS.green.primary};
          box-shadow: 0 12px 28px rgba(0, 139, 31, 0.16);
        }

        .nav-signup:hover,
        .btn-primary:hover {
          background: ${COLORS.green.dark};
          transform: translateY(-1px);
        }

        .btn-secondary {
          color: ${COLORS.neutral.ink};
          border: 1px solid ${COLORS.neutral.line};
          padding: 13px 24px;
          background: #ffffff;
        }

        .btn-secondary:hover {
          border-color: ${COLORS.green.primary};
          color: ${COLORS.green.primary};
          transform: translateY(-1px);
        }

        .btn-secondary:disabled {
          cursor: not-allowed;
          opacity: 0.65;
          transform: none;
        }

        .btn-text {
          color: ${COLORS.neutral.muted};
          padding: 12px 8px;
        }

        .btn-text:hover {
          color: ${COLORS.green.primary};
        }

        .hero {
          min-height: 100vh;
          padding: 118px 32px 70px;
          display: flex;
          align-items: center;
        }

        .hero__inner {
          width: 100%;
          max-width: 1200px;
          margin: 0 auto;
          min-height: calc(100vh - 190px);
          position: relative;
          display: block;
        }

        .hero__content {
          max-width: 660px;
          position: relative;
          z-index: 2;
          padding-top: clamp(18px, 4vw, 46px);
        }

        .eyebrow {
          color: ${COLORS.green.primary};
          font-family: ui-monospace, SFMono-Regular, Menlo, Consolas, monospace;
          font-size: 12px;
          font-weight: 800;
          letter-spacing: 0.16em;
          text-transform: uppercase;
        }

        .hero h1 {
          max-width: 720px;
          margin-top: 18px;
          font-family: var(--font-outfit), sans-serif;
          font-size: clamp(48px, 5.1vw, 78px);
          line-height: 1.02;
          letter-spacing: -0.05em;
          font-weight: 900;
          animation: heroRise 860ms cubic-bezier(0.22, 1, 0.36, 1) both;
        }

        .hero h1 span {
          color: ${COLORS.green.primary};
        }

        .hero__copy {
          max-width: 560px;
          margin-top: 26px;
          color: ${COLORS.neutral.muted};
          font-size: clamp(16px, 1.28vw, 19px);
          line-height: 1.75;
          animation: heroRise 860ms cubic-bezier(0.22, 1, 0.36, 1) 120ms both;
        }

        .hero__actions {
          display: flex;
          flex-wrap: wrap;
          align-items: center;
          gap: 14px;
          margin-top: 36px;
          animation: heroRise 860ms cubic-bezier(0.22, 1, 0.36, 1) 220ms both;
        }

        .guest-error {
          margin-top: 14px;
          color: #d62839;
          font-size: 13px;
          font-weight: 700;
        }

        .hero__visual {
          width: min(690px, 58vw);
          aspect-ratio: 1;
          position: absolute;
          top: 48%;
          right: -18px;
          transform: translateY(-50%);
          display: flex;
          align-items: center;
          justify-content: center;
          pointer-events: none;
          z-index: 1;
          will-change: transform;
        }

        .pixel-orbit {
          width: 100%;
          aspect-ratio: 1;
          position: relative;
          opacity: 0.72;
          contain: layout paint;
          transform: translateZ(0);
        }

        .pixel-orbit__globe {
          position: absolute;
          inset: 12%;
          border-radius: 50%;
          background:
            radial-gradient(circle at 50% 50%, rgba(0, 139, 31, 0.085), transparent 62%),
            repeating-radial-gradient(ellipse at center, transparent 0 24px, rgba(0, 139, 31, 0.105) 25px, transparent 26px),
            repeating-conic-gradient(from -12deg, rgba(0, 139, 31, 0.12) 0deg 0.75deg, transparent 0.75deg 13deg);
          border: 1px solid rgba(0, 139, 31, 0.12);
          box-shadow:
            inset 0 0 70px rgba(0, 139, 31, 0.06),
            0 0 0 1px rgba(0, 139, 31, 0.025);
          opacity: 0.74;
          animation: orbitDrift 84s linear infinite;
          will-change: transform;
        }

        .pixel-orbit__globe::before,
        .pixel-orbit__globe::after,
        .globe-arc {
          content: "";
          position: absolute;
          inset: 4%;
          border: 1px solid rgba(0, 139, 31, 0.11);
          border-radius: 50%;
        }

        .pixel-orbit__globe::before {
          transform: scaleX(0.54);
        }

        .pixel-orbit__globe::after {
          transform: scaleX(0.28);
        }

        .globe-arc--one {
          transform: rotate(58deg) scaleX(0.34);
        }

        .globe-arc--two {
          transform: rotate(-58deg) scaleX(0.34);
        }

        .globe-arc--three {
          transform: rotate(82deg) scaleX(0.18);
        }

        .globe-arc--four {
          transform: rotate(-82deg) scaleX(0.18);
        }

        .pixel-orbit::before {
          content: "";
          position: absolute;
          inset: 3%;
          border-radius: 50%;
          background:
            radial-gradient(circle, rgba(0, 139, 31, 0.035), transparent 60%),
            repeating-radial-gradient(circle, transparent 0 28px, rgba(0, 139, 31, 0.045) 29px, transparent 30px);
          filter: blur(0.2px);
          animation: orbitDrift 110s linear infinite;
          mask-image: radial-gradient(circle, #000 0 74%, transparent 82%);
          will-change: transform;
        }

        .pixel-orbit__rings {
          position: absolute;
          inset: 14%;
          border-radius: 50%;
          border: 1px solid rgba(0, 139, 31, 0.08);
          box-shadow:
            0 0 0 42px rgba(0, 139, 31, 0.018),
            0 0 0 88px rgba(30, 30, 30, 0.016),
            0 0 0 146px rgba(0, 139, 31, 0.012);
        }

        .pixel-orbit__dots {
          position: absolute;
          left: 50%;
          top: 50%;
          animation: orbitDrift 120s linear infinite reverse;
          will-change: transform;
        }

        .pixel-orbit__dots span {
          position: absolute;
          left: 0;
          top: 0;
          display: block;
          border-radius: 50%;
          animation: dotGlow 5.6s ease-in-out infinite;
          will-change: opacity;
        }

        @keyframes dotGlow {
          0%,
          100% {
            opacity: 0.18;
          }
          50% {
            opacity: 0.46;
          }
        }

        .hero .eyebrow {
          display: none;
        }

        .hero__note {
          position: absolute;
          right: 0;
          bottom: 38px;
          max-width: 250px;
          color: ${COLORS.neutral.muted};
          font-size: 14px;
          font-weight: 700;
          text-align: center;
        }

        .hero__channels {
          display: flex;
          justify-content: center;
          gap: 10px;
          margin-top: 12px;
        }

        .hero__channels span {
          width: 38px;
          height: 38px;
          display: inline-flex;
          align-items: center;
          justify-content: center;
          border: 1px solid ${COLORS.neutral.softLine};
          border-radius: 50%;
          background: rgba(255, 255, 255, 0.88);
          color: ${COLORS.neutral.muted};
          box-shadow: 0 12px 30px rgba(15, 23, 42, 0.05);
        }

        .section {
          padding: 96px 32px;
          position: relative;
          scroll-margin-top: 108px;
        }

        .section--compact {
          padding-top: 72px;
        }

        .section__inner {
          max-width: 1200px;
          margin: 0 auto;
        }

        .section-heading {
          max-width: 760px;
          margin-bottom: 48px;
        }

        .section-heading--center {
          width: 100%;
          max-width: 980px;
          margin-left: auto;
          margin-right: auto;
          text-align: center;
          display: flex;
          flex-direction: column;
          align-items: center;
        }

        .section-heading h2 {
          margin-top: 14px;
          font-family: var(--font-outfit), sans-serif;
          font-size: clamp(34px, 5vw, 64px);
          line-height: 0.98;
          letter-spacing: -0.045em;
          font-weight: 900;
        }

        .section-heading h2 span {
          color: ${COLORS.green.primary};
        }

        .section-heading p {
          max-width: 620px;
          margin-top: 18px;
          color: ${COLORS.neutral.muted};
          font-size: 16px;
          line-height: 1.75;
        }

        .section-heading--center p {
          margin-left: auto;
          margin-right: auto;
        }

        .section-heading .eyebrow,
        .about-card > .eyebrow,
        .feature-summary > .eyebrow {
          color: ${COLORS.neutral.muted};
        }

        .section-heading .eyebrow::before,
        .about-card > .eyebrow::before,
        .feature-summary > .eyebrow::before {
          content: "[ ";
          color: ${COLORS.neutral.muted};
        }

        .section-heading .eyebrow::after,
        .about-card > .eyebrow::after,
        .feature-summary > .eyebrow::after {
          content: " ]";
          color: ${COLORS.neutral.muted};
        }

        .guide-flow {
          display: grid;
          grid-template-columns: repeat(4, minmax(0, 1fr));
          border-top: 1px solid ${COLORS.neutral.line};
          border-bottom: 1px solid ${COLORS.neutral.line};
        }

        .guide-step {
          min-height: 220px;
          padding: 28px 28px 34px;
          border-right: 1px solid ${COLORS.neutral.softLine};
          position: relative;
          overflow: hidden;
        }

        .guide-step:last-child {
          border-right: none;
        }

        .guide-step::before {
          content: "";
          position: absolute;
          left: 0;
          top: 0;
          width: 100%;
          height: 2px;
          background: ${COLORS.green.primary};
          transform: translateX(-100%);
          transition: transform 420ms ease;
        }

        .guide-step:hover::before {
          transform: translateX(0);
        }

        .guide-step span {
          display: block;
          color: ${COLORS.green.primary};
          font-family: ui-monospace, SFMono-Regular, Menlo, Consolas, monospace;
          font-size: 12px;
          font-weight: 800;
          letter-spacing: 0.14em;
        }

        .guide-step h3 {
          margin-top: 34px;
          color: ${COLORS.neutral.ink};
          font-size: 20px;
          line-height: 1.3;
        }

        .guide-step p {
          margin-top: 12px;
          color: ${COLORS.neutral.muted};
          font-size: 14px;
          line-height: 1.7;
        }

        .feature-flow {
          display: grid;
          grid-template-columns: minmax(280px, 0.78fr) minmax(0, 1.22fr);
          gap: clamp(36px, 7vw, 96px);
          align-items: start;
        }

        .feature-summary {
          position: sticky;
          top: 116px;
        }

        .feature-summary .metric {
          display: inline-flex;
          align-items: baseline;
          gap: 10px;
          margin-top: 36px;
          padding-top: 24px;
          border-top: 1px solid ${COLORS.neutral.line};
        }

        .metric strong {
          color: ${COLORS.green.primary};
          font-family: var(--font-outfit), sans-serif;
          font-size: 54px;
          line-height: 1;
        }

        .metric span {
          color: ${COLORS.neutral.muted};
          font-size: 14px;
          line-height: 1.4;
        }

        .feature-list {
          border-top: 1px solid ${COLORS.neutral.line};
        }

        .feature-row {
          display: grid;
          grid-template-columns: 96px 1fr;
          gap: 26px;
          padding: 34px 0;
          border-bottom: 1px solid ${COLORS.neutral.softLine};
        }

        .feature-row__key {
          color: ${COLORS.neutral.muted};
          font-family: ui-monospace, SFMono-Regular, Menlo, Consolas, monospace;
          font-size: 12px;
          font-weight: 800;
          letter-spacing: 0.14em;
          text-transform: uppercase;
        }

        .feature-row h3 {
          font-size: clamp(22px, 2vw, 32px);
          line-height: 1.15;
          letter-spacing: -0.02em;
        }

        .feature-row p {
          max-width: 620px;
          margin-top: 12px;
          color: ${COLORS.neutral.muted};
          font-size: 15px;
          line-height: 1.75;
        }

        .template-panel {
          border: 1px solid ${COLORS.neutral.line};
          border-radius: 8px;
          overflow: hidden;
          background: rgba(255, 255, 255, 0.86);
          box-shadow: 0 26px 80px rgba(15, 23, 42, 0.05);
        }

        .template-row {
          display: grid;
          grid-template-columns: 1.1fr 1.7fr 120px;
          align-items: center;
          gap: 28px;
          padding: 28px 34px;
          border-bottom: 1px solid ${COLORS.neutral.softLine};
        }

        .template-row:last-child {
          border-bottom: none;
        }

        .template-row h3 {
          font-size: 22px;
          letter-spacing: -0.02em;
        }

        .template-row p {
          color: ${COLORS.neutral.muted};
          font-size: 15px;
          line-height: 1.65;
        }

        .template-row span {
          justify-self: end;
          color: ${COLORS.green.primary};
          font-family: ui-monospace, SFMono-Regular, Menlo, Consolas, monospace;
          font-size: 12px;
          font-weight: 800;
          letter-spacing: 0.1em;
          text-transform: uppercase;
        }

        .about-card {
          max-width: 760px;
          margin: 0 auto;
          text-align: center;
        }

        .about-card h2 {
          margin-top: 14px;
          font-family: var(--font-outfit), sans-serif;
          font-size: clamp(34px, 4.4vw, 54px);
          line-height: 1;
          letter-spacing: -0.045em;
          font-weight: 900;
        }

        .about-card h2 span {
          color: ${COLORS.green.primary};
        }

        .about-card__panel {
          margin-top: 32px;
          padding: clamp(28px, 4vw, 48px);
          border: 1px solid ${COLORS.neutral.softLine};
          border-radius: 24px;
          background: rgba(255, 255, 255, 0.9);
          box-shadow: 0 28px 90px rgba(15, 23, 42, 0.06);
        }

        .about-card__panel p {
          max-width: 620px;
          margin: 0 auto;
          color: ${COLORS.neutral.ink};
          font-size: 16px;
          line-height: 1.8;
        }

        .about-card__panel p + p {
          margin-top: 22px;
        }

        .about-card__panel .btn-primary {
          margin-top: 34px;
        }

        .about-stats {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          max-width: 560px;
          margin: 34px auto 0;
          gap: 24px;
        }

        .about-stats div {
          text-align: center;
        }

        .about-stats strong {
          display: block;
          color: ${COLORS.green.primary};
          font-family: var(--font-outfit), sans-serif;
          font-size: 42px;
          line-height: 1;
        }

        .about-stats span {
          display: block;
          margin-top: 8px;
          color: ${COLORS.neutral.muted};
          font-size: 13px;
          line-height: 1.4;
        }

        .faq-container {
          max-width: 820px;
          margin: 0 auto;
          border-top: 1px solid ${COLORS.neutral.line};
        }

        .faq-item {
          border-bottom: 1px solid ${COLORS.neutral.line};
        }

        .faq-item button {
          width: 100%;
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 24px;
          padding: 24px 0;
          color: ${COLORS.neutral.ink};
          background: transparent;
          border: none;
          cursor: pointer;
          text-align: left;
          font-family: inherit;
          font-size: 18px;
          font-weight: 800;
        }

        .faq-item svg {
          flex: 0 0 auto;
          color: ${COLORS.green.primary};
          transition: transform 220ms ease;
        }

        .faq-answer {
          max-height: 0;
          opacity: 0;
          overflow: hidden;
          transition: max-height 320ms ease, opacity 240ms ease;
        }

        .faq-answer--open {
          max-height: 260px;
          opacity: 1;
        }

        .faq-answer p {
          max-width: 720px;
          padding: 0 0 24px;
          color: ${COLORS.neutral.muted};
          font-size: 15px;
          line-height: 1.75;
        }

        .footer {
          padding: 52px 32px 46px;
          border-top: 1px solid ${COLORS.neutral.line};
          background: #ffffff;
        }

        .footer__inner {
          max-width: 1200px;
          margin: 0 auto;
          display: grid;
          grid-template-columns: minmax(220px, 1fr) repeat(3, minmax(120px, auto));
          gap: clamp(28px, 6vw, 84px);
          align-items: start;
        }

        .footer__brand {
          display: grid;
          gap: 14px;
        }

        .footer__brand strong {
          font-family: var(--font-outfit), sans-serif;
          font-size: clamp(42px, 6vw, 76px);
          line-height: 1;
          letter-spacing: -0.04em;
        }

        .footer__brand p {
          color: ${COLORS.neutral.muted};
          font-size: 13px;
        }

        .footer__group {
          display: grid;
          gap: 14px;
        }

        .footer__group span {
          color: ${COLORS.neutral.muted};
          font-family: ui-monospace, SFMono-Regular, Menlo, Consolas, monospace;
          font-size: 12px;
          font-weight: 800;
          letter-spacing: 0.14em;
          text-transform: uppercase;
        }

        .footer__group a,
        .footer__group button {
          color: ${COLORS.neutral.muted};
          background: none;
          border: none;
          padding: 0;
          text-decoration: none;
          font-family: inherit;
          font-size: 15px;
          font-weight: 700;
          cursor: pointer;
          text-align: left;
        }

        .footer__group a:hover,
        .footer__group button:hover {
          color: ${COLORS.green.primary};
        }

        .reveal {
          opacity: 0;
          transform: translateY(18px);
          transition:
            opacity 760ms cubic-bezier(0.22, 1, 0.36, 1),
            transform 760ms cubic-bezier(0.22, 1, 0.36, 1);
        }

        .reveal.is-visible {
          opacity: 1;
          transform: translateY(0);
        }

        @media (prefers-reduced-motion: reduce) {
          *,
          *::before,
          *::after {
            animation-duration: 0.01ms !important;
            animation-iteration-count: 1 !important;
            scroll-behavior: auto !important;
            transition-duration: 0.01ms !important;
          }
        }

        @media (max-width: 980px) {
          .site-header__inner {
            grid-template-columns: 1fr auto;
          }

          .nav-menu {
            display: none;
          }

          .hero__inner,
          .feature-flow {
            grid-template-columns: 1fr;
          }

          .hero__visual {
            width: min(520px, 100%);
            min-height: 360px;
            position: relative;
            top: auto;
            right: auto;
            transform: none;
            margin: 28px auto 0;
          }

          .hero__note {
            right: 50%;
            bottom: 8px;
            transform: translateX(50%);
          }

          .feature-summary {
            position: static;
          }

          .guide-flow {
            grid-template-columns: repeat(2, minmax(0, 1fr));
          }

          .guide-step:nth-child(2) {
            border-right: none;
          }
        }

        @media (max-width: 720px) {
          .site-header__inner {
            height: auto;
            padding: 14px 20px;
          }

          .brand {
            font-size: 16px;
          }

          .nav-actions {
            gap: 6px;
          }

          .nav-login,
          .nav-signup {
            padding: 9px 13px;
            font-size: 12px;
          }

          .hero,
          .section {
            padding-left: 20px;
            padding-right: 20px;
          }

          .hero {
            padding-top: 124px;
          }

          .guide-flow,
          .about-stats,
          .template-row {
            grid-template-columns: 1fr;
          }

          .guide-step {
            border-right: none;
            border-bottom: 1px solid ${COLORS.neutral.softLine};
          }

          .template-row span {
            justify-self: start;
          }

          .feature-row {
            grid-template-columns: 1fr;
            gap: 10px;
          }

          .footer__inner {
            grid-template-columns: 1fr 1fr;
          }
        }

        @media (max-width: 540px) {
          .footer__inner {
            grid-template-columns: 1fr;
          }
        }
      `}</style>

      <div className="landing-page">
        <header className="site-header">
          <div className="site-header__inner">
            <Link href="/" className="brand" id="landing-logo">
              <LogoMark />
              <span>Bento-Do</span>
            </Link>

            <nav className="nav-menu" aria-label="Landing navigation">
              {navLinks.map((item) => (
                <a key={item.href} href={item.href}>
                  {item.label}
                </a>
              ))}
            </nav>

            <div className="nav-actions">
              <Link href="/login" className="nav-login" id="landing-login-btn">
                Login
              </Link>
              <Link href="/register" className="nav-signup" id="landing-signup-btn">
                Sign Up
              </Link>
            </div>
          </div>
        </header>

        <main>
          <section className="hero">
            <div className="hero__inner">
              <div className="hero__content">
                <div className="eyebrow">Student task dashboard</div>
                <h1>
                  Atur Tugas Kuliah,<br />
                  Jaga Fokus dan<br />
                  <span>Energi</span>
                </h1>
                <p className="hero__copy">
                  Bento-do membantu mahasiswa mengelola bank tugas, memilih tiga prioritas utama,
                  menjalankan focus session, dan menerima reminder deadline dalam satu dashboard
                  sederhana.
                </p>

                <div className="hero__actions">
                  <Link href="#guide" className="btn-primary" id="hero-get-started-btn">
                    Get Started
                    <ArrowUpRight />
                  </Link>
                  <button
                    type="button"
                    id="hero-guest-btn"
                    className="btn-secondary"
                    onClick={handleGuestMode}
                    disabled={isGuestLoading}
                  >
                    {isGuestLoading ? "Menyiapkan..." : "Guest Mode"}
                  </button>
                  <Link href="#template" className="btn-text">
                    Lihat Template
                  </Link>
                </div>

                {guestError && <p className="guest-error">{guestError}</p>}
              </div>

              <div className="hero__visual">
                <PixelOrbitBackground />
                <div className="hero__note">
                  <span>Jalankan lewat:</span>
                  <div className="hero__channels" aria-hidden="true">
                    <span><GlobeIcon /></span>
                    <span><PhoneIcon /></span>
                    <span><MonitorIcon /></span>
                  </div>
                </div>
              </div>
            </div>
          </section>

          <section id="guide" className="section section--compact">
            <div className="section__inner">
              <div className="section-heading section-heading--center reveal">
                <div className="eyebrow">Cara pakai</div>
                <h2>
                  Mulai dari kosong sampai <span>siap fokus</span>.
                </h2>
                <p>
                  Alurnya dibuat pendek supaya pengguna baru bisa mencoba aplikasi tanpa membaca
                  dokumentasi panjang.
                </p>
              </div>

              <div className="guide-flow reveal">
                {guideSteps.map((step) => (
                  <article key={step.label} className="guide-step">
                    <span>{step.label}</span>
                    <h3>{step.title}</h3>
                    <p>{step.desc}</p>
                  </article>
                ))}
              </div>
            </div>
          </section>

          <section id="fitur" className="section">
            <div className="section__inner feature-flow">
              <div className="feature-summary reveal">
                <div className="eyebrow">Fitur inti</div>
                <div className="section-heading" style={{ marginBottom: 0 }}>
                  <h2>
                    Dibuat untuk ritme belajar yang <span>lebih manusiawi</span>.
                  </h2>
                  <p>
                    Fokusnya bukan menambah banyak panel, tapi membuat tugas besar terasa bisa
                    dimulai dan dikendalikan.
                  </p>
                </div>
                <div className="metric">
                  <strong>3</strong>
                  <span>prioritas utama<br />di dashboard</span>
                </div>
              </div>

              <div className="feature-list reveal">
                {featureRows.map((feature) => (
                  <article key={feature.key} className="feature-row">
                    <div className="feature-row__key">{feature.key}</div>
                    <div>
                      <h3>{feature.title}</h3>
                      <p>{feature.desc}</p>
                    </div>
                  </article>
                ))}
              </div>
            </div>
          </section>

          <section id="template" className="section">
            <div className="section__inner">
              <div className="section-heading reveal">
                <div className="eyebrow">Template</div>
                <h2>
                  Template tugas yang sering muncul di <span>perkuliahan</span>.
                </h2>
                <p>
                  Bukan kumpulan card dekoratif, melainkan daftar awal yang bisa dipakai untuk
                  memecah pekerjaan akademik jadi langkah yang lebih kecil.
                </p>
              </div>

              <div className="template-panel reveal">
                {templates.map((template) => (
                  <article key={template.title} className="template-row">
                    <h3>{template.title}</h3>
                    <p>{template.desc}</p>
                    <span>{template.meta}</span>
                  </article>
                ))}
              </div>
            </div>
          </section>

          <section id="about" className="section">
            <div className="section__inner">
              <div className="about-card reveal">
                <div className="eyebrow">About</div>
                <h2>
                  Tentang <span>Bento-Do</span>
                </h2>

                <div className="about-card__panel">
                  <p>
                    Bento-Do dibuat sebagai aplikasi produktivitas mahasiswa untuk membantu
                    pengguna mengelola tugas kuliah tanpa proses onboarding yang berat. Fokusnya
                    sederhana: semua tugas terkumpul, prioritas terlihat, dan pekerjaan bisa
                    dimulai lebih cepat.
                  </p>
                  <p>
                    Di dalamnya ada Guest Mode untuk mencoba tanpa akun, Bank Tugas untuk
                    menyimpan pekerjaan, Rule of 3 untuk menahan fokus, Focus Session untuk mulai
                    mengerjakan, dan Energy System agar beban harian tetap realistis.
                  </p>

                  <Link href="/register" className="btn-primary">
                    Buat Akun Gratis
                    <ArrowUpRight />
                  </Link>
                </div>

                <div className="about-stats">
                  <div>
                    <strong>3</strong>
                    <span>Task Prioritas</span>
                  </div>
                  <div>
                    <strong>4</strong>
                    <span>Template Resmi</span>
                  </div>
                  <div>
                    <strong>24h</strong>
                    <span>Reminder Deadline</span>
                  </div>
                </div>
              </div>
            </div>
          </section>

          <section id="faq" className="section">
            <div className="section__inner">
              <div className="section-heading section-heading--center reveal">
                <div className="eyebrow">FAQ</div>
                <h2>
                  Pertanyaan yang <span>sering ditanyakan</span>.
                </h2>
              </div>

              <div className="faq-container reveal">
                {faqItems.map((item) => (
                  <FAQItem key={item.question} question={item.question} answer={item.answer} />
                ))}
              </div>
            </div>
          </section>
        </main>

        <footer className="footer">
          <div className="footer__inner">
            <div className="footer__brand">
              <p>Copyright {new Date().getFullYear()} Bento-Do. All rights reserved.</p>
              <strong>Bento-Do</strong>
            </div>

            <div className="footer__group">
              <span>[Menu]</span>
              <a href="#guide">Panduan</a>
              <a href="#fitur">Fitur</a>
              <a href="#template">Template</a>
              <a href="#faq">FAQ</a>
            </div>

            <div className="footer__group">
              <span>[Account]</span>
              <Link href="/login">Login</Link>
              <Link href="/register">Sign Up</Link>
              <button type="button" onClick={handleGuestMode} disabled={isGuestLoading}>
                {isGuestLoading ? "Menyiapkan..." : "Guest Mode"}
              </button>
            </div>

            <div className="footer__group">
              <span>[Contact]</span>
              <a href="mailto:bentodo.app@gmail.com">bentodo.app@gmail.com</a>
            </div>
          </div>
        </footer>
      </div>
    </>
  );
}
