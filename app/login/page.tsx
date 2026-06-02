"use client";

import { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { loginUser, saveAuthSession } from "../lib/api";

// ─── Icons ────────────────────────────────────────────────────────────────────

const EyeOffIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24"
    fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94" />
    <path d="M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19" />
    <line x1="1" y1="1" x2="23" y2="23" />
  </svg>
);

const EyeIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24"
    fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
    <circle cx="12" cy="12" r="3" />
  </svg>
);

const FocusTimerIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="26" height="26" viewBox="0 0 24 24"
    fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="12" cy="12" r="10" />
    <polyline points="12 6 12 12 16 14" />
  </svg>
);

const PriorityTaskIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="26" height="26" viewBox="0 0 24 24"
    fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
    <path d="M9 5H7a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V7a2 2 0 0 0-2-2h-2" />
    <rect x="9" y="3" width="6" height="4" rx="1" />
    <line x1="9" y1="12" x2="15" y2="12" />
    <line x1="9" y1="16" x2="13" y2="16" />
  </svg>
);

const EnergyLevelIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="26" height="26" viewBox="0 0 24 24"
    fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
    <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2" />
  </svg>
);

const BackArrowIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="15" height="15" viewBox="0 0 24 24"
    fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <line x1="19" y1="12" x2="5" y2="12" />
    <polyline points="12 19 5 12 12 5" />
  </svg>
);

const SpinnerIcon = () => (
  <svg className="animate-spin h-4 w-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
  </svg>
);

// ─── Main Component ────────────────────────────────────────────────────────────

export default function SignInPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsLoading(true);

    try {
      const data = await loginUser(email, password);

      if (data.data?.token) {
        saveAuthSession(data.data, rememberMe);
      }

      router.push("/dashboard");
    } catch (error) {
      setError(
        error instanceof Error
          ? error.message
          : "Unable to connect to server. Please try again.",
      );
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <main className="min-h-screen flex flex-col md:flex-row">

      {/* ══════════════════════════════════════
          LEFT PANEL
      ══════════════════════════════════════ */}
      <div
        className="relative flex flex-col md:w-[47%] flex-shrink-0 min-h-[320px] md:min-h-screen"
        style={{
          background: "radial-gradient(ellipse at 65% 35%, #1b5e1b 0%, #0d2e0d 45%, #060d06 100%)",
        }}
      >
        {/* Back To Dashboard */}
        <div className="absolute top-6 left-6 z-10">
          <Link
            href="/"
            className="flex items-center gap-2 text-white/70 text-[13px] font-medium hover:text-white transition-colors duration-200"
          >
            <BackArrowIcon />
            <span>Back To Home</span>
          </Link>
        </div>

        {/* Center Branding — semua konten dikumpulkan rapat di tengah */}
        <div className="flex flex-col items-center justify-center flex-1 px-8 text-white text-center">

          {/* Logo */}
          <div style={{ marginBottom: "20px" }}>
            <Image
              src="/Logo BenTodo.png"
              alt="Ben To Do Logo"
              width={110}
              height={110}
              className="object-contain drop-shadow-lg"
              style={{ width: "110px", height: "auto" }}
              priority
            />
          </div>

          {/* Title */}
          <h1
            className="font-bold leading-tight"
            style={{ fontSize: "26px", marginBottom: "12px" }}
          >
            Ben To Do
          </h1>

          {/* Subtitle */}
          <p
            className="text-white/55"
            style={{
              fontSize: "13px",
              lineHeight: "1.65",
              maxWidth: "340px", /* Diubah dari 230px ke 340px */
              textAlign: "center", /* Memastikan teks rata tengah */
              margin: "0 auto 24px", /* Tengahkan elemen (auto) dan beri jarak bawah 24px */
            }}
          >
            Plan your tasks today and achieve your best productivity with Ben Todo.
          </p>

          {/* Divider */}
          <div
            style={{
              width: "120px",
              height: "1px",
              backgroundColor: "rgba(255,255,255,0.2)",
              marginBottom: "24px",
            }}
          />

          {/* Feature Icons */}
          <div className="flex items-start justify-center" style={{ gap: "36px" }}>
            {/* Focus Timer */}
            <div className="flex flex-col items-center" style={{ gap: "10px" }}>
              <div style={{ color: "#ffffff" }}><FocusTimerIcon /></div>
              <span style={{ fontSize: "12px", fontWeight: 500, color: "#ffffff", lineHeight: 1 }}>
                Focus Timer
              </span>
            </div>
            {/* Priority Task */}
            <div className="flex flex-col items-center" style={{ gap: "10px" }}>
              <div style={{ color: "#ffffff" }}><PriorityTaskIcon /></div>
              <span style={{ fontSize: "12px", fontWeight: 500, color: "#ffffff", lineHeight: 1 }}>
                Priority Task
              </span>
            </div>
            {/* Energy Level — highlighted */}
            <div className="flex flex-col items-center" style={{ gap: "10px" }}>
              <div style={{ color: "#ffffff" }}><EnergyLevelIcon /></div>
              <span style={{ fontSize: "12px", fontWeight: 600, color: "#ffffff", lineHeight: 1 }}>
                Energy Level
              </span>
            </div>
          </div>

        </div>
      </div>


      {/* ══════════════════════════════════════
          RIGHT PANEL
      ══════════════════════════════════════ */}
      <div className="flex flex-1 items-center justify-center bg-white px-8 py-14 md:py-0">
        {/*
          Container: lebar tetap 360px agar proporsional seperti referensi.
          Padding kiri-kanan 0 karena sudah dihandle parent.
        */}
        <div style={{ width: "100%", maxWidth: "360px" }}>

          {/* ── Heading ── */}
          <div className="text-center" style={{ marginBottom: "28px" }}>
            <h2
              className="font-bold text-gray-900 leading-tight"
              style={{ fontSize: "22px", marginBottom: "8px" }}
            >
              Welcome to Ben To Do
            </h2>
            <p className="text-gray-500" style={{ fontSize: "14px", fontWeight: 400 }}>
              Enter your email and password to Sign in
            </p>
          </div>

          {/* ── Error Banner ── */}
          {error && (
            <div
              role="alert"
              className="rounded-lg bg-red-50 border border-red-200 px-4 py-3 text-red-700"
              style={{ fontSize: "13px", marginBottom: "16px" }}
            >
              {error}
            </div>
          )}

          {/* ── Form ── */}
          <form onSubmit={handleSubmit} noValidate>

            {/* Email */}
            <div style={{ marginBottom: "16px" }}>
              <label
                htmlFor="email"
                className="block text-gray-800"
                style={{ fontSize: "14px", fontWeight: 500, marginBottom: "6px" }}
              >
                Email
              </label>
              <input
                id="email"
                type="email"
                autoComplete="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="Enter your Email"
                style={{
                  width: "100%",
                  height: "48px",
                  borderRadius: "8px",
                  border: "1px solid #d1d5db",
                  padding: "0 16px",
                  fontSize: "14px",
                  color: "#111827",
                  backgroundColor: "#ffffff",
                  outline: "none",
                  transition: "border-color 0.15s, box-shadow 0.15s",
                  fontFamily: "inherit",
                }}
                onFocus={(e) => {
                  e.target.style.borderColor = "#16a34a";
                  e.target.style.boxShadow = "0 0 0 3px rgba(22,163,74,0.12)";
                }}
                onBlur={(e) => {
                  e.target.style.borderColor = "#d1d5db";
                  e.target.style.boxShadow = "none";
                }}
              />
            </div>

            {/* Password */}
            <div style={{ marginBottom: "12px" }}>
              <label
                htmlFor="password"
                className="block text-gray-800"
                style={{ fontSize: "14px", fontWeight: 500, marginBottom: "6px" }}
              >
                Password
              </label>
              <div style={{ position: "relative" }}>
                <input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  autoComplete="current-password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Enter your Password"
                  style={{
                    width: "100%",
                    height: "48px",
                    borderRadius: "8px",
                    border: "1px solid #d1d5db",
                    padding: "0 44px 0 16px",
                    fontSize: "14px",
                    color: "#111827",
                    backgroundColor: "#ffffff",
                    outline: "none",
                    transition: "border-color 0.15s, box-shadow 0.15s",
                    fontFamily: "inherit",
                  }}
                  onFocus={(e) => {
                    e.target.style.borderColor = "#16a34a";
                    e.target.style.boxShadow = "0 0 0 3px rgba(22,163,74,0.12)";
                  }}
                  onBlur={(e) => {
                    e.target.style.borderColor = "#d1d5db";
                    e.target.style.boxShadow = "none";
                  }}
                />
                <button
                  type="button"
                  id="toggle-password-visibility"
                  aria-label={showPassword ? "Hide password" : "Show password"}
                  onClick={() => setShowPassword((p) => !p)}
                  style={{
                    position: "absolute",
                    top: 0,
                    right: 0,
                    bottom: 0,
                    width: "44px",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    color: "#9ca3af",
                    cursor: "pointer",
                    background: "none",
                    border: "none",
                    outline: "none",
                  }}
                >
                  {showPassword ? <EyeIcon /> : <EyeOffIcon />}
                </button>
              </div>
            </div>

            {/* Remember me + Forgot Password */}
            <div
              className="flex items-center justify-between"
              style={{ marginBottom: "20px" }}
            >
              <label
                className="flex items-center cursor-pointer select-none"
                style={{ gap: "8px" }}
              >
                <input
                  id="remember-me"
                  type="checkbox"
                  checked={rememberMe}
                  onChange={(e) => setRememberMe(e.target.checked)}
                  style={{
                    width: "15px",
                    height: "15px",
                    borderRadius: "3px",
                    accentColor: "#16a34a",
                    cursor: "pointer",
                    flexShrink: 0,
                  }}
                />
                <span style={{ fontSize: "13px", color: "#374151", fontWeight: 400 }}>
                  Remember me
                </span>
              </label>

              <Link
                href="/forgot-password"
                id="forgot-password-link"
                style={{
                  fontSize: "13px",
                  color: "#111827",
                  fontWeight: 400,
                  textDecoration: "underline",
                  textUnderlineOffset: "2px",
                }}
              >
                Forgot Password?
              </Link>
            </div>

            {/* Sign In Button */}
            <button
              id="sign-in-button"
              type="submit"
              disabled={isLoading}
              style={{
                width: "100%",
                height: "48px",
                borderRadius: "8px",
                backgroundColor: "#16a34a",
                color: "#ffffff",
                fontSize: "15px",
                fontWeight: 600,
                letterSpacing: "0.01em",
                border: "none",
                cursor: isLoading ? "not-allowed" : "pointer",
                opacity: isLoading ? 0.65 : 1,
                transition: "background-color 0.15s, transform 0.1s",
                fontFamily: "inherit",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                gap: "8px",
              }}
              onMouseEnter={(e) => {
                if (!isLoading) (e.currentTarget as HTMLButtonElement).style.backgroundColor = "#15803d";
              }}
              onMouseLeave={(e) => {
                (e.currentTarget as HTMLButtonElement).style.backgroundColor = "#16a34a";
              }}
              onMouseDown={(e) => {
                if (!isLoading) (e.currentTarget as HTMLButtonElement).style.transform = "scale(0.985)";
              }}
              onMouseUp={(e) => {
                (e.currentTarget as HTMLButtonElement).style.transform = "scale(1)";
              }}
            >
              {isLoading ? (
                <>
                  <SpinnerIcon />
                  <span>Signing in…</span>
                </>
              ) : (
                "Sign In"
              )}
            </button>
          </form>

          {/* Register link */}
          <p
            className="text-center"
            style={{ marginTop: "18px", fontSize: "13px", color: "#6b7280", fontWeight: 400 }}
          >
            Don&apos;t have an account?{" "}
            <Link
              href="/register"
              id="register-link"
              style={{
                color: "#111827",
                fontWeight: 500,
                textDecoration: "underline",
                textUnderlineOffset: "2px",
              }}
            >
              Register
            </Link>
          </p>

        </div>
      </div>
    </main>
  );
}
