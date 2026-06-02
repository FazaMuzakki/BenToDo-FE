"use client";

import { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { resetPassword } from "../lib/api";
import { LOGO_SRC } from "../lib/assets";

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

const BackArrowIcon = ({ size = 15 }: { size?: number }) => (
  <svg xmlns="http://www.w3.org/2000/svg" width={size} height={size} viewBox="0 0 24 24"
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

// ─── Shared: Input style helper ────────────────────────────────────────────────
const inputBaseStyle: React.CSSProperties = {
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
};

const inputWithIconStyle: React.CSSProperties = {
  ...inputBaseStyle,
  paddingRight: "44px",
};


// ─── Main Component ────────────────────────────────────────────────────────────

export default function ResetPasswordPage() {
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [isSuccess, setIsSuccess] = useState(false);

  const handleFocus = (e: React.FocusEvent<HTMLInputElement>) => {
    e.target.style.borderColor = "#16a34a";
    e.target.style.boxShadow = "0 0 0 3px rgba(22,163,74,0.12)";
  };
  const handleBlur = (e: React.FocusEvent<HTMLInputElement>) => {
    e.target.style.borderColor = "#d1d5db";
    e.target.style.boxShadow = "none";
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (password !== confirmPassword) {
      setError("Password dan konfirmasi password tidak cocok.");
      return;
    }
    if (password.length < 6) {
      setError("Password minimal 6 karakter.");
      return;
    }
    const resetToken = new URLSearchParams(window.location.search).get("token");

    if (!resetToken) {
      setError("Link reset password tidak valid atau token tidak ditemukan.");
      return;
    }

    setIsLoading(true);

    try {
      await resetPassword(resetToken, password);
      setIsSuccess(true);
    } catch (error) {
      setError(
        error instanceof Error
          ? error.message
          : "Tidak dapat menyimpan password baru.",
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
            href="/dashboard"
            className="flex items-center gap-2 text-white/70 text-[13px] font-medium hover:text-white transition-colors duration-200"
          >
            <BackArrowIcon />
            <span>Back To Dashboard</span>
          </Link>
        </div>

        {/* Center Branding */}
        <div className="flex flex-col items-center justify-center flex-1 px-8 text-white text-center">
          {/* Logo */}
          <div style={{ marginBottom: "20px" }}>
            <Image
              src={LOGO_SRC}
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
              maxWidth: "230px",
              margin: "0 auto 24px",
              textAlign: "center",
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
            <div className="flex flex-col items-center" style={{ gap: "10px" }}>
              <div style={{ color: "#ffffff" }}><FocusTimerIcon /></div>
              <span style={{ fontSize: "12px", fontWeight: 500, color: "#ffffff", lineHeight: 1 }}>
                Focus Timer
              </span>
            </div>
            <div className="flex flex-col items-center" style={{ gap: "10px" }}>
              <div style={{ color: "#ffffff" }}><PriorityTaskIcon /></div>
              <span style={{ fontSize: "12px", fontWeight: 500, color: "#ffffff", lineHeight: 1 }}>
                Priority Task
              </span>
            </div>
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
        <div style={{ width: "100%", maxWidth: isSuccess ? "440px" : "360px" }}>

          {isSuccess ? (
            /* ── SUCCESS STATE ── */
            <div className="text-center">
              {/* Heading */}
              <h2
                className="font-bold text-gray-900"
                style={{ fontSize: "22px", marginBottom: "16px" }}
              >
                Password Changed!
              </h2>

              {/* Description */}
              <p
                className="text-gray-500"
                style={{
                  fontSize: "14px",
                  lineHeight: "1.65",
                  marginBottom: "28px",
                  textAlign: "center",
                }}
              >
                You&apos;ve Successfully Completed Your Password Reset!
              </p>

              {/* Sign In Button */}
              <Link
                href="/login"
                style={{
                  display: "flex",
                  width: "100%",
                  maxWidth: "360px",
                  margin: "0 auto",
                  height: "48px",
                  borderRadius: "8px",
                  backgroundColor: "#16a34a",
                  color: "#ffffff",
                  fontSize: "15px",
                  fontWeight: 600,
                  letterSpacing: "0.01em",
                  textDecoration: "none",
                  alignItems: "center",
                  justifyContent: "center",
                  transition: "background-color 0.15s",
                }}
                onMouseEnter={(e) => {
                  (e.currentTarget as HTMLAnchorElement).style.backgroundColor = "#15803d";
                }}
                onMouseLeave={(e) => {
                  (e.currentTarget as HTMLAnchorElement).style.backgroundColor = "#16a34a";
                }}
              >
                Sign In
              </Link>
            </div>
          ) : (
            /* ── FORM STATE ── */
            <>
              {/* Heading */}
              <div className="text-center" style={{ marginBottom: "28px" }}>
                <h2
                  className="font-bold text-gray-900 leading-tight"
                  style={{ fontSize: "22px", marginBottom: "8px" }}
                >
                  Reset Password
                </h2>
                <p className="text-gray-900" style={{ fontSize: "14px", fontWeight: 400 }}>
                  Set new password
                </p>
              </div>

              {/* Error Banner */}
              {error && (
                <div
                  role="alert"
                  className="rounded-lg bg-red-50 border border-red-200 px-4 py-3 text-red-700"
                  style={{ fontSize: "13px", marginBottom: "16px" }}
                >
                  {error}
                </div>
              )}

              {/* Form */}
              <form onSubmit={handleSubmit} noValidate>

                {/* New Password */}
                <div style={{ marginBottom: "20px" }}>
                  <label
                    htmlFor="password"
                    className="block text-gray-800"
                    style={{ fontSize: "14px", fontWeight: 500, marginBottom: "6px" }}
                  >
                    New password
                  </label>
                  <div style={{ position: "relative" }}>
                    <input
                      id="password"
                      type={showPassword ? "text" : "password"}
                      autoComplete="new-password"
                      required
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="Enter your Password"
                      style={inputWithIconStyle}
                      onFocus={handleFocus}
                      onBlur={handleBlur}
                    />
                    <button
                      type="button"
                      id="toggle-password"
                      aria-label={showPassword ? "Hide password" : "Show password"}
                      onClick={() => setShowPassword((p) => !p)}
                      style={{
                        position: "absolute", top: 0, right: 0, bottom: 0,
                        width: "44px", display: "flex", alignItems: "center",
                        justifyContent: "center", color: "#9ca3af",
                        background: "none", border: "none", cursor: "pointer",
                      }}
                    >
                      {showPassword ? <EyeIcon /> : <EyeOffIcon />}
                    </button>
                  </div>
                </div>

                {/* Confirm Password */}
                <div style={{ marginBottom: "24px" }}>
                  <label
                    htmlFor="confirm-password"
                    className="block text-gray-800"
                    style={{ fontSize: "14px", fontWeight: 500, marginBottom: "6px" }}
                  >
                    Re-enter Password
                  </label>
                  <div style={{ position: "relative" }}>
                    <input
                      id="confirm-password"
                      type={showConfirm ? "text" : "password"}
                      autoComplete="new-password"
                      required
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      placeholder="Enter your Password"
                      style={inputWithIconStyle}
                      onFocus={handleFocus}
                      onBlur={handleBlur}
                    />
                    <button
                      type="button"
                      id="toggle-confirm-password"
                      aria-label={showConfirm ? "Hide confirm password" : "Show confirm password"}
                      onClick={() => setShowConfirm((p) => !p)}
                      style={{
                        position: "absolute", top: 0, right: 0, bottom: 0,
                        width: "44px", display: "flex", alignItems: "center",
                        justifyContent: "center", color: "#9ca3af",
                        background: "none", border: "none", cursor: "pointer",
                      }}
                    >
                      {showConfirm ? <EyeIcon /> : <EyeOffIcon />}
                    </button>
                  </div>
                </div>

                {/* Submit Button (Match reference text exactly: Sign Up) */}
                <button
                  id="reset-password-button"
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
                      <span>Saving…</span>
                    </>
                  ) : (
                    "Sign Up"
                  )}
                </button>
              </form>
            </>
          )}

        </div>
      </div>
    </main>
  );
}
