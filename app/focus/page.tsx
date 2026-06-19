"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import {
  getActiveFocusSession,
  getEnergySummary,
  getTasks,
  hasActiveSession,
  isGuestSession,
  startFocusSession,
  stopFocusSession,
  type ActiveFocusSession,
  type EnergySummary,
  type EnergyWeight,
  type Task,
} from "../lib/api";



const COLOR = {
  green: "var(--color-primary)",
  greenDark: "var(--color-primary-hover)",
  greenSoft: "var(--color-primary-soft)",
  surface: "var(--color-surface)",
  dark: "var(--color-background)",
  text: "var(--color-foreground)",
  muted: "var(--color-muted)",
  border: "var(--color-border)",
};

const GUEST_ENERGY_SUMMARY: EnergySummary = {
  current_energy: 100,
  max_energy: 100,
  is_critical_energy: false,
};

type ExitIntent = "exit" | null;

type FocusResult = {
  title: string;
  elapsedSeconds: number;
  endReason: "completed" | "escaped";
  energy: EnergySummary | null;
};

const levelRank: Record<EnergyWeight, number> = {
  Ringan: 1,
  Sedang: 2,
  Berat: 3,
};

const levelLabel: Record<EnergyWeight, string> = {
  Ringan: "LOW",
  Sedang: "MEDIUM",
  Berat: "HIGH",
};

const levelTone: Record<EnergyWeight, { bg: string; color: string; border: string }> = {
  Ringan: { bg: "#DCFCE7", color: "#008B1F", border: "#BBF7D0" },
  Sedang: { bg: "#FFEDD5", color: "#EA580C", border: "#FED7AA" },
  Berat: { bg: "#FFE4E6", color: "#E11D48", border: "#FECDD3" },
};

const exitReasons = [
  "Task finished",
  "Interrupted",
  "Need a break",
  "Other reason",
];

const formatDuration = (seconds: number) => {
  const safeSeconds = Math.max(0, seconds);
  const hours = Math.floor(safeSeconds / 3600);
  const minutes = Math.floor((safeSeconds % 3600) / 60);
  const secs = safeSeconds % 60;
  const pad = (num: number) => String(num).padStart(2, "0");

  if (hours > 0) {
    return `${pad(hours)}:${pad(minutes)}:${pad(secs)}`;
  }

  return `${pad(minutes)}:${pad(secs)}`;
};

const formatDueDate = (value: string | null) => {
  if (!value) return "No due date";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "No due date";

  return new Intl.DateTimeFormat("id-ID", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(date);
};

const getDeadlineTime = (task: Task) => {
  if (!task.deadline) return Number.MAX_SAFE_INTEGER;
  const time = new Date(task.deadline).getTime();
  return Number.isNaN(time) ? Number.MAX_SAFE_INTEGER : time;
};

const getErrorMessage = (error: unknown, fallback: string) => {
  return error instanceof Error ? error.message : fallback;
};

const getSessionStartTime = (dateString: string) => {
  // Backend returns time in UTC+7 but appends "Z" as if it were UTC.
  // We replace the "Z" with "+07:00" to parse it correctly as UTC timestamp.
  const safeString = dateString.endsWith("Z") ? dateString.slice(0, -1) + "+07:00" : dateString;
  const time = new Date(safeString).getTime();
  return Number.isNaN(time) ? Date.now() : time;
};


function LevelBadge({ level }: { level: EnergyWeight }) {
  const tone = levelTone[level];

  return (
    <span
      style={{
        display: "inline-flex",
        alignItems: "center",
        justifyContent: "center",
        borderRadius: "999px",
        border: `1px solid ${tone.border}`,
        backgroundColor: tone.bg,
        color: tone.color,
        fontSize: "11px",
        fontWeight: 800,
        letterSpacing: "0.04em",
        padding: "3px 10px",
        lineHeight: "16px",
      }}
    >
      {levelLabel[level]}
    </span>
  );
}

function FullscreenIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M8 3H5a2 2 0 0 0-2 2v3" />
      <path d="M16 3h3a2 2 0 0 1 2 2v3" />
      <path d="M8 21H5a2 2 0 0 1-2-2v-3" />
      <path d="M16 21h3a2 2 0 0 0 2-2v-3" />
    </svg>
  );
}

function ArrowLeftIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="m12 19-7-7 7-7" />
      <path d="M19 12H5" />
    </svg>
  );
}

function CloseIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M18 6 6 18" />
      <path d="m6 6 12 12" />
    </svg>
  );
}

function FocusTimerPage() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [session, setSession] = useState<ActiveFocusSession | null>(null);
  const [energyData, setEnergyData] = useState<EnergySummary | null>(null);
  const [elapsedSeconds, setElapsedSeconds] = useState(0);
  const [selectedTaskId, setSelectedTaskId] = useState<string | null>(null);
  const [showTaskPicker, setShowTaskPicker] = useState(false);
  const [exitIntent, setExitIntent] = useState<ExitIntent>(null);
  const [exitReason, setExitReason] = useState(exitReasons[0]);
  const [exitNote, setExitNote] = useState("");
  const [result, setResult] = useState<FocusResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [autoFullscreen, setAutoFullscreen] = useState(false);

  const activeTasks = useMemo(() => {
    return tasks.filter((task) => task.status !== "done");
  }, [tasks]);

  const priorityTasks = useMemo(() => {
    return [...activeTasks]
      .sort((a, b) => {
        const byDeadline = getDeadlineTime(a) - getDeadlineTime(b);
        if (byDeadline !== 0) return byDeadline;
        return levelRank[b.energy_weight] - levelRank[a.energy_weight];
      })
      .slice(0, 3);
  }, [activeTasks]);

  const selectedTask = useMemo(() => {
    return activeTasks.find((task) => task.id === selectedTaskId) ?? null;
  }, [activeTasks, selectedTaskId]);

  const energyPercent = useMemo(() => {
    if (!energyData?.max_energy) return 100;
    return Math.max(
      0,
      Math.min(100, Math.round((energyData.current_energy / energyData.max_energy) * 100)),
    );
  }, [energyData]);

  const startTask = useCallback(async (taskId: string, auto = false) => {
    if (!taskId) return;

    setError(null);
    setIsSubmitting(true);

    try {
      const response = await startFocusSession(taskId);
      setSession(response.data);
      setSelectedTaskId(taskId);
      setElapsedSeconds(0);
      setShowTaskPicker(false);
      setResult(null);
    } catch (startError) {
      const message = getErrorMessage(startError, "Failed to start focus session.");
      const activeSessionExists = message.toLowerCase().includes("sesi fokus aktif") || message.toLowerCase().includes("active");

      if (activeSessionExists) {
        const active = await getActiveFocusSession();
        if (active.active_session) {
          const startedAt = getSessionStartTime(active.active_session.started_at);
          setSession(active.active_session);
          setSelectedTaskId(active.active_session.task_id);
          setElapsedSeconds(Math.max(0, Math.floor((Date.now() - startedAt) / 1000)));
          setShowTaskPicker(false);
          return;
        }
      }

      setError(message);
      if (auto) setShowTaskPicker(true);
    } finally {
      setIsSubmitting(false);
    }
  }, []);

  useEffect(() => {
    let isCancelled = false;

    const loadFocusData = async () => {
      if (!hasActiveSession()) {
        router.replace("/login");
        return;
      }

      setIsLoading(true);
      setError(null);

      try {
        const guest = isGuestSession();
        const [activeRes, tasksRes, energyRes] = await Promise.all([
          getActiveFocusSession().catch(() => ({
            active_session: null,
            auto_stopped_session: null,
          })),
          getTasks(1, 50),
          guest ? Promise.resolve({ data: GUEST_ENERGY_SUMMARY }) : getEnergySummary(),
        ]);

        if (isCancelled) return;

        const activeList = tasksRes.data.filter((task) => task.status !== "done");
        const directTaskId = new URLSearchParams(window.location.search).get("taskId");
        const directTask = directTaskId ? activeList.find((task) => task.id === directTaskId) : null;
        const defaultTask = [...activeList].sort((a, b) => getDeadlineTime(a) - getDeadlineTime(b))[0] ?? null;

        setTasks(tasksRes.data);
        setEnergyData(energyRes.data);

        if (activeRes.active_session) {
          const startedAt = getSessionStartTime(activeRes.active_session.started_at);
          setSession(activeRes.active_session);
          setSelectedTaskId(activeRes.active_session.task_id);
          setElapsedSeconds(Math.max(0, Math.floor((Date.now() - startedAt) / 1000)));
          setShowTaskPicker(false);
          return;
        }

        if (directTask) {
          setSelectedTaskId(directTask.id);
          setShowTaskPicker(false);
          await startTask(directTask.id, true);
          return;
        }

        setSelectedTaskId(defaultTask?.id ?? null);
        setShowTaskPicker(true);
      } catch (loadError) {
        if (!isCancelled) {
          setError(getErrorMessage(loadError, "Failed to load focus data."));
        }
      } finally {
        if (!isCancelled) setIsLoading(false);
      }
    };

    void loadFocusData();

    return () => {
      isCancelled = true;
    };
  }, [router, startTask]);

  useEffect(() => {
    if (!session) return;

    const startedAt = getSessionStartTime(session.started_at);
    const tick = () => {
      setElapsedSeconds(Math.max(0, Math.floor((Date.now() - startedAt) / 1000)));
    };

    tick();
    const interval = window.setInterval(tick, 1000);
    return () => window.clearInterval(interval);
  }, [session]);

  useEffect(() => {
    const syncFullscreen = () => setIsFullscreen(!!document.fullscreenElement);

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape" || e.key === "Esc") {
        if (document.fullscreenElement) {
          document.exitFullscreen().catch(() => {});
        }
      }
    };

    document.addEventListener("fullscreenchange", syncFullscreen);
    window.addEventListener("keydown", handleKeyDown);
    syncFullscreen();

    return () => {
      document.removeEventListener("fullscreenchange", syncFullscreen);
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, []);

  const handleBackRequest = () => {
    if (session) {
      setExitIntent("exit");
      setExitReason("Interrupted");
      return;
    }

    router.push("/dashboard");
  };

  const handleConfirmStop = async () => {
    if (!session) {
      router.push("/dashboard");
      return;
    }

    const endReason = exitReason === "Task finished" ? "completed" : "escaped";
    const currentTitle = session.task_title || selectedTask?.title || "Selected task";
    const currentElapsed = elapsedSeconds;

    setIsSubmitting(true);
    setError(null);

    try {
      const response = await stopFocusSession(session.id, endReason);
      const nextEnergy = response.energy ?? energyData;
      setEnergyData(nextEnergy ?? energyData);
      setResult({
        title: currentTitle,
        elapsedSeconds: currentElapsed,
        endReason,
        energy: nextEnergy ?? energyData,
      });
      setSession(null);
      setExitIntent(null);
      setExitNote("");
      setShowTaskPicker(false);
    } catch (stopError) {
      setError(getErrorMessage(stopError, "Failed to stop focus session."));
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleToggleFullscreen = async () => {
    try {
      if (document.fullscreenElement) {
        await document.exitFullscreen();
      } else if (document.documentElement.requestFullscreen) {
        await document.documentElement.requestFullscreen();
      }
    } catch {
      setError("Fullscreen is not available in this browser.");
    }
  };

  const selectedTitle = session?.task_title || selectedTask?.title || "Choose a priority task";
  const energyLossPreview = Math.floor(elapsedSeconds / 60);

  return (
    <main
      style={{
        minHeight: "100vh",
        color: "#E8F8EC",
        backgroundColor: "var(--color-background)",
        backgroundImage: "radial-gradient(circle at 50% 50%, rgba(1, 139, 40, 0.28) 0%, #111513 75%)",
        position: "relative",
        overflow: "hidden",
        fontFamily: "inherit",
      }}
    >
      <style>{`
        @keyframes focusGridDrift {
          0% { transform: translate3d(0, 0, 0); opacity: 0.5; }
          50% { opacity: 0.85; }
          100% { transform: translate3d(-192px, -192px, 0); opacity: 0.5; }
        }
        @keyframes focusPulse {
          0%, 100% { transform: scale(1); opacity: 0.4; }
          50% { transform: scale(1.03); opacity: 0.8; }
        }
        .focus-grid::before {
          content: "";
          position: absolute;
          inset: -80px;
          background-image:
            linear-gradient(rgba(0, 200, 50, 0.15) 1px, transparent 1px),
            linear-gradient(90deg, rgba(0, 200, 50, 0.15) 1px, transparent 1px);
          background-size: 48px 48px;
          animation: focusGridDrift 20s linear infinite;
          pointer-events: none;
          will-change: transform, opacity;
          backface-visibility: hidden;
        }
        .focus-orbit {
          position: absolute;
          width: min(65vw, 800px);
          aspect-ratio: 1;
          left: 50%;
          top: 50%;
          transform: translate(-50%, -50%);
          border-radius: 999px;
          border: 2px solid rgba(21, 142, 47, 0.15);
          box-shadow: 0 0 120px rgba(20, 180, 54, 0) inset;
          animation: focusPulse 8s ease-in-out infinite;
          pointer-events: none;
        }
      `}</style>

      <div className="focus-grid" style={{ position: "absolute", inset: 0 }} />
      <div className="focus-orbit" />


      <header
        style={{
          position: "relative",
          zIndex: 2,
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          padding: "28px 36px",
        }}
      >
        <button
          onClick={handleBackRequest}
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: "8px",
            border: "none",
            background: "transparent",
            color: "#CFEFD6",
            fontFamily: "inherit",
            fontSize: "13px",
            fontWeight: 700,
            cursor: "pointer",
          }}
        >
          <ArrowLeftIcon />
          Back To Dashboard
        </button>

        <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
          <span
            style={{
              border: "1px solid rgba(255,255,255,0.14)",
              borderRadius: "999px",
              padding: "8px 12px",
              fontSize: "12px",
              fontWeight: 700,
              color: "#D7FBE1",
              backgroundColor: "rgba(255,255,255,0.06)",
            }}
          >
            Energy {energyPercent}%
          </span>
        </div>
      </header>

      <section
        style={{
          position: "relative",
          zIndex: 2,
          minHeight: "calc(100vh - 102px)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          padding: "48px 24px",
          textAlign: "center",
        }}
      >
        <div style={{ width: "min(760px, 100%)" }}>
          <div
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: "8px",
              borderRadius: "999px",
              border: "1px solid rgba(156,255,173,0.3)",
              backgroundColor: "rgba(0,139,31,0.18)",
              color: "#BDFCC8",
              padding: "6px 12px",
              fontSize: "12px",
              fontWeight: 700,
              marginBottom: "18px",
            }}
          >
            <span style={{ width: "7px", height: "7px", borderRadius: "999px", backgroundColor: COLOR.green }} />
            Focus Mode
          </div>

          <p style={{ margin: "0 0 10px", color: "#CFEFD6", fontSize: "14px", fontWeight: 800, letterSpacing: "0.14em" }}>
            BEING FOCUSED...
          </p>

          <h1
            style={{
              margin: "0 auto 18px",
              maxWidth: "720px",
              color: "#F4FFF6",
              fontSize: "clamp(22px, 4vw, 36px)",
              lineHeight: 1.18,
              fontWeight: 800,
              overflowWrap: "anywhere",
            }}
          >
            {selectedTitle}
          </h1>

          <div
            style={{
              fontSize: "clamp(72px, 14vw, 142px)",
              lineHeight: 0.95,
              fontWeight: 900,
              color: "#E2FBE7",
              letterSpacing: "0",
              textShadow: "0 18px 58px rgba(0,0,0,0.28)",
              marginBottom: "26px",
              fontVariantNumeric: "tabular-nums",
            }}
          >
            {formatDuration(elapsedSeconds)}
          </div>

          {error && (
            <div
              style={{
                margin: "0 auto 18px",
                maxWidth: "560px",
                border: "1px solid rgba(248,113,113,0.35)",
                backgroundColor: "rgba(127,29,29,0.28)",
                borderRadius: "10px",
                color: "#FECACA",
                padding: "12px 14px",
                fontSize: "13px",
                fontWeight: 700,
              }}
            >
              {error}
            </div>
          )}

          <div style={{ display: "flex", justifyContent: "center", alignItems: "center", gap: "12px", flexWrap: "wrap" }}>
            {!session ? (
              <div
                style={{
                  minWidth: "150px",
                  height: "44px",
                  borderRadius: "999px",
                  border: "1px solid rgba(255,255,255,0.18)",
                  backgroundColor: "rgba(255,255,255,0.06)",
                  color: "#DDFBE5",
                  display: "inline-flex",
                  alignItems: "center",
                  justifyContent: "center",
                  padding: "0 18px",
                  fontSize: "13px",
                  fontWeight: 800,
                }}
              >
                {isLoading || isSubmitting ? "Preparing focus..." : activeTasks.length === 0 ? "No active task" : "Choose a task"}
              </div>
            ) : (
              <button
                disabled={isSubmitting}
                onClick={() => {
                  setExitIntent("exit");
                  setExitReason("Interrupted");
                }}
                style={{
                  minWidth: "130px",
                  height: "44px",
                  borderRadius: "999px",
                  border: "1px solid rgba(255,255,255,0.18)",
                  backgroundColor: "rgba(255,255,255,0.06)",
                  color: "#DDFBE5",
                  fontFamily: "inherit",
                  fontWeight: 800,
                  fontSize: "14px",
                  cursor: isSubmitting ? "not-allowed" : "pointer",
                }}
              >
                Exit Focus
              </button>
            )}
          </div>
        </div>
      </section>

      <aside
        style={{
          position: "fixed",
          left: "28px",
          bottom: "28px",
          zIndex: 2,
          width: "260px",
          borderRadius: "8px",
          border: "1px solid rgba(255,255,255,0.12)",
          backgroundColor: "rgba(255,255,255,0.08)",
          padding: "14px",
          backdropFilter: "blur(10px)",
        }}
      >
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "10px" }}>
          <span style={{ color: "#DDFBE5", fontSize: "12px", fontWeight: 800 }}>Energy</span>
          <span style={{ color: "#DDFBE5", fontSize: "12px", fontWeight: 800 }}>{energyPercent}%</span>
        </div>
        <div style={{ height: "8px", borderRadius: "999px", backgroundColor: "rgba(255,255,255,0.18)", overflow: "hidden" }}>
          <div style={{ width: `${energyPercent}%`, height: "100%", backgroundColor: COLOR.green, borderRadius: "999px" }} />
        </div>
      </aside>

      <button
        onClick={() => void handleToggleFullscreen()}
        style={{
          position: "fixed",
          right: "28px",
          bottom: "28px",
          zIndex: 3,
          width: "44px",
          height: "44px",
          borderRadius: "10px",
          border: "1px solid rgba(255,255,255,0.16)",
          backgroundColor: isFullscreen ? "rgba(0,139,31,0.34)" : "rgba(255,255,255,0.1)",
          color: "#DDFBE5",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          cursor: "pointer",
          backdropFilter: "blur(10px)",
        }}
        aria-label={isFullscreen ? "Exit fullscreen" : "Enter fullscreen"}
        title={isFullscreen ? "Exit fullscreen" : "Enter fullscreen"}
      >
        <FullscreenIcon />
      </button>

      {(showTaskPicker || exitIntent || result) && (
        <div
          style={{
            position: "fixed",
            inset: 0,
            zIndex: 10,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            padding: "24px",
            backgroundColor: "rgba(0, 0, 0, 0.54)",
          }}
        >
          {showTaskPicker && !session && !result && (
            <div
              style={{
                width: "min(520px, 100%)",
                borderRadius: "12px",
                backgroundColor: "var(--color-surface)",
                color: "var(--color-foreground)",
                boxShadow: "0 26px 70px rgba(0,0,0,0.35)",
                padding: "26px",
              }}
            >
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "18px" }}>
                <div>
                  <h2 style={{ margin: 0, fontSize: "22px", fontWeight: 800 }}>Choose Priority Task</h2>
                  <p style={{ margin: "6px 0 0", color: "var(--color-muted)", fontSize: "13px", lineHeight: 1.5 }}>
                    Pick one of your closest-deadline tasks before entering focus.
                  </p>
                </div>
                <button
                  onClick={() => router.push("/dashboard")}
                  style={{ border: "none", background: "transparent", color: "var(--color-muted)", cursor: "pointer" }}
                  aria-label="Close task picker"
                >
                  <CloseIcon />
                </button>
              </div>

              <div style={{ display: "flex", flexDirection: "column", gap: "10px", marginBottom: "20px" }}>
                {priorityTasks.length === 0 ? (
                  <div style={{ border: `1px dashed ${"var(--color-border)"}`, borderRadius: "8px", padding: "18px", color: "var(--color-muted)", fontSize: "13px", fontWeight: 700 }}>
                    No active task is available. Add a task first from the task menu.
                  </div>
                ) : (
                  priorityTasks.map((task, index) => {
                    const active = selectedTaskId === task.id;
                    return (
                      <button
                        key={task.id}
                        onClick={() => setSelectedTaskId(task.id)}
                        style={{
                          width: "100%",
                          border: `1px solid ${active ? "var(--color-primary)" : "var(--color-border)"}`,
                          backgroundColor: active ? "var(--color-primary-pale)" : "var(--color-surface)",
                          borderRadius: "8px",
                          padding: "14px",
                          display: "grid",
                          gridTemplateColumns: "32px 1fr auto",
                          gap: "12px",
                          alignItems: "center",
                          textAlign: "left",
                          cursor: "pointer",
                          fontFamily: "inherit",
                        }}
                      >
                        <span
                          style={{
                            width: "28px",
                            height: "28px",
                            borderRadius: "999px",
                            backgroundColor: active ? "var(--color-primary)" : "var(--color-panel)",
                            color: active ? "var(--color-surface)" : "var(--color-foreground)",
                            display: "inline-flex",
                            alignItems: "center",
                            justifyContent: "center",
                            fontSize: "12px",
                            fontWeight: 800,
                          }}
                        >
                          {index + 1}
                        </span>
                        <span style={{ minWidth: 0 }}>
                          <span style={{ display: "block", color: "var(--color-foreground)", fontSize: "14px", fontWeight: 800, lineHeight: 1.35, overflowWrap: "anywhere" }}>
                            {task.title}
                          </span>
                          <span style={{ display: "block", color: "var(--color-muted)", fontSize: "12px", fontWeight: 600, marginTop: "4px" }}>
                            {formatDueDate(task.deadline)}
                          </span>
                        </span>
                        <LevelBadge level={task.energy_weight} />
                      </button>
                    );
                  })
                )}
              </div>

              <label
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "10px",
                  marginBottom: "20px",
                  cursor: "pointer",
                  color: "var(--color-muted)",
                  fontSize: "14px",
                  fontWeight: 600,
                }}
              >
                <input
                  type="checkbox"
                  checked={autoFullscreen}
                  onChange={(e) => setAutoFullscreen(e.target.checked)}
                  style={{
                    width: "18px",
                    height: "18px",
                    accentColor: COLOR.green,
                    cursor: "pointer",
                  }}
                />
                Use full screen
              </label>

              <button
                disabled={!selectedTaskId || isSubmitting || priorityTasks.length === 0}
                onClick={() => {
                  if (selectedTaskId) {
                    if (autoFullscreen && document.documentElement.requestFullscreen) {
                      document.documentElement.requestFullscreen().catch(() => { });
                    }
                    void startTask(selectedTaskId);
                  }
                }}
                style={{
                  width: "100%",
                  height: "46px",
                  borderRadius: "7px",
                  border: "none",
                  backgroundColor: COLOR.green,
                  color: "var(--color-foreground)",
                  fontFamily: "inherit",
                  fontSize: "14px",
                  fontWeight: 800,
                  cursor: !selectedTaskId || isSubmitting ? "not-allowed" : "pointer",
                  opacity: !selectedTaskId || isSubmitting ? 0.72 : 1,
                }}
              >
                {isSubmitting ? "Starting..." : "Start Focus"}
              </button>
            </div>
          )}

          {exitIntent && session && (
            <div
              style={{
                width: "min(520px, 100%)",
                borderRadius: "12px",
                backgroundColor: "var(--color-surface)",
                color: "var(--color-foreground)",
                boxShadow: "0 26px 70px rgba(0,0,0,0.35)",
                padding: "26px",
              }}
            >
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "18px" }}>
                <div>
                  <h2 style={{ margin: 0, fontSize: "22px", fontWeight: 800 }}>
                    Why are you leaving focus?
                  </h2>
                  <p style={{ margin: "6px 0 0", color: "var(--color-muted)", fontSize: "13px", lineHeight: 1.5 }}>
                    Elapsed time is {formatDuration(elapsedSeconds)}. Energy will be reduced by about {energyLossPreview} point{energyLossPreview === 1 ? "" : "s"}.
                  </p>
                </div>
                <button
                  onClick={() => setExitIntent(null)}
                  style={{ border: "none", background: "transparent", color: "var(--color-muted)", cursor: "pointer" }}
                  aria-label="Close exit dialog"
                >
                  <CloseIcon />
                </button>
              </div>

              <div style={{ display: "grid", gridTemplateColumns: "repeat(2, minmax(0, 1fr))", gap: "10px", marginBottom: "14px" }}>
                {exitReasons.map((reason) => (
                  <button
                    key={reason}
                    onClick={() => setExitReason(reason)}
                    style={{
                      minHeight: "40px",
                      borderRadius: "7px",
                      border: `1px solid ${exitReason === reason ? COLOR.green : "var(--color-border)"}`,
                      backgroundColor: exitReason === reason ? "#F0FFF4" : "var(--color-surface)",
                      color: exitReason === reason ? COLOR.greenDark : "var(--color-foreground)",
                      fontFamily: "inherit",
                      fontSize: "12px",
                      fontWeight: 800,
                      cursor: "pointer",
                    }}
                  >
                    {reason}
                  </button>
                ))}
              </div>

              <textarea
                value={exitNote}
                onChange={(event) => setExitNote(event.target.value.slice(0, 240))}
                placeholder="Optional note"
                style={{
                  width: "100%",
                  minHeight: "92px",
                  resize: "vertical",
                  borderRadius: "7px",
                  border: `1px solid ${"var(--color-border)"}`,
                  padding: "12px",
                  boxSizing: "border-box",
                  fontFamily: "inherit",
                  fontSize: "13px",
                  lineHeight: 1.5,
                  outline: "none",
                  marginBottom: "18px",
                }}
              />

              <div style={{ display: "flex", justifyContent: "flex-end", gap: "12px" }}>
                <button
                  disabled={isSubmitting}
                  onClick={() => setExitIntent(null)}
                  style={{
                    minWidth: "110px",
                    height: "42px",
                    borderRadius: "7px",
                    border: `1px solid ${"var(--color-border)"}`,
                    backgroundColor: "var(--color-foreground)",
                    color: "var(--color-foreground)",
                    fontFamily: "inherit",
                    fontWeight: 800,
                    cursor: isSubmitting ? "not-allowed" : "pointer",
                  }}
                >
                  Cancel
                </button>
                <button
                  disabled={isSubmitting}
                  onClick={() => void handleConfirmStop()}
                  style={{
                    minWidth: "150px",
                    height: "42px",
                    borderRadius: "7px",
                    border: "none",
                    backgroundColor: COLOR.green,
                    color: "var(--color-foreground)",
                    fontFamily: "inherit",
                    fontWeight: 800,
                    cursor: isSubmitting ? "not-allowed" : "pointer",
                  }}
                >
                  {isSubmitting ? "Saving..." : "Exit Focus"}
                </button>
              </div>
            </div>
          )}

          {result && (
            <div
              style={{
                width: "min(480px, 100%)",
                borderRadius: "12px",
                backgroundColor: "var(--color-surface)",
                color: "var(--color-foreground)",
                boxShadow: "0 26px 70px rgba(0,0,0,0.35)",
                padding: "30px",
                textAlign: "center",
              }}
            >
              <div
                style={{
                  width: "72px",
                  height: "72px",
                  borderRadius: "999px",
                  border: `5px solid ${COLOR.greenDark}`,
                  color: COLOR.greenDark,
                  display: "inline-flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontSize: "34px",
                  fontWeight: 900,
                  marginBottom: "18px",
                }}
              >
                OK
              </div>
              <h2 style={{ margin: "0 0 8px", fontSize: "22px", fontWeight: 900 }}>
                {result.endReason === "completed" ? "Focus completed!" : "Focus session ended"}
              </h2>
              <p style={{ margin: "0 0 18px", color: "var(--color-muted)", fontSize: "13px", lineHeight: 1.5 }}>
                {result.title} was focused for {formatDuration(result.elapsedSeconds)}.
              </p>
              <div style={{ border: `1px solid ${"var(--color-border)"}`, borderRadius: "8px", padding: "14px", marginBottom: "20px", textAlign: "left" }}>
                <div style={{ display: "flex", justifyContent: "space-between", fontSize: "13px", fontWeight: 800 }}>
                  <span style={{ color: "var(--color-muted)" }}>Energy now</span>
                  <span>{result.energy ? Math.round((result.energy.current_energy / result.energy.max_energy) * 100) : energyPercent}%</span>
                </div>
              </div>
              <div style={{ display: "flex", gap: "10px" }}>
                <button
                  onClick={() => router.push("/dashboard")}
                  style={{
                    flex: 1,
                    height: "44px",
                    borderRadius: "7px",
                    border: `1px solid ${"var(--color-border)"}`,
                    backgroundColor: "var(--color-foreground)",
                    color: "var(--color-foreground)",
                    fontFamily: "inherit",
                    fontWeight: 800,
                    cursor: "pointer",
                  }}
                >
                  Dashboard
                </button>
                <button
                  onClick={() => {
                    setResult(null);
                    setShowTaskPicker(true);
                  }}
                  style={{
                    flex: 1,
                    height: "44px",
                    borderRadius: "7px",
                    border: "none",
                    backgroundColor: COLOR.green,
                    color: "var(--color-foreground)",
                    fontFamily: "inherit",
                    fontWeight: 800,
                    cursor: "pointer",
                  }}
                >
                  Focus Again
                </button>
              </div>
            </div>
          )}
        </div>
      )}
    </main>
  );
}

export default FocusTimerPage;
