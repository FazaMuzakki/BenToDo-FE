"use client";

import { useEffect, useState, useRef } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  getActiveFocusSession,
  stopFocusSession,
  getTasks,
  getEnergySummary,
  updateTask,
  type ActiveFocusSession,
  type Task,
  type EnergySummary
} from "../lib/api";

type PopupType = "task" | "timer" | "energy" | null;

export default function FocusTimerPage() {
  const router = useRouter();

  const [mode, setMode] = useState<"focus" | "break">("focus");
  const [timeLeft, setTimeLeft] = useState(25 * 60);
  const [isActive, setIsActive] = useState(false);
  const [session, setSession] = useState<ActiveFocusSession | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Popup states
  const [activePopup, setActivePopup] = useState<PopupType>(null);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [energyData, setEnergyData] = useState<EnergySummary | null>(null);

  // Custom Timer Form State
  const [customMinutes, setCustomMinutes] = useState("");
  const [customHours, setCustomHours] = useState("");

  const popupRef = useRef<HTMLDivElement>(null);

  // Constants
  const FOCUS_DURATION = 25 * 60;
  const BREAK_DURATION = 5 * 60;

  useEffect(() => {
    // Initial load - check for active focus session & data
    const loadData = async () => {
      try {
        const [sessionRes, tasksRes, energyRes] = await Promise.all([
          getActiveFocusSession(),
          getTasks(1, 10),
          getEnergySummary()
        ]);

        if (sessionRes.active_session) {
          const s = sessionRes.active_session;
          setSession(s);
          setMode("focus");
          
          const startedAt = new Date(s.started_at).getTime();
          const elapsedSeconds = Math.floor((Date.now() - startedAt) / 1000);
          const limitSeconds = s.session_limit_minutes * 60;
          let remaining = limitSeconds - elapsedSeconds;
          if (remaining < 0) remaining = 0;
          
          setTimeLeft(remaining);
          setIsActive(true);
        } else {
          setTimeLeft(FOCUS_DURATION);
        }

        if (tasksRes.data) {
          setTasks(tasksRes.data.filter(t => t.status !== "done"));
        }
        
        if (energyRes.data) {
          setEnergyData(energyRes.data);
        }
      } catch (error) {
        console.error("Failed to fetch data", error);
        setTimeLeft(FOCUS_DURATION);
      } finally {
        setIsLoading(false);
      }
    };

    loadData();
  }, []);

  // Timer tick effect
  useEffect(() => {
    let interval: NodeJS.Timeout | null = null;

    if (isActive && timeLeft > 0) {
      interval = setInterval(() => {
        setTimeLeft((prev) => prev - 1);
      }, 1000);
    } else if (isActive && timeLeft === 0) {
      handleTimerComplete();
    }

    return () => {
      if (interval) clearInterval(interval);
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isActive, timeLeft]);

  // Click outside popup to close
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (popupRef.current && !popupRef.current.contains(event.target as Node)) {
        // Also ensure we didn't click on the trigger buttons (handled via propagation if needed)
        setActivePopup(null);
      }
    }
    
    if (activePopup) {
      document.addEventListener("mousedown", handleClickOutside);
    }
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [activePopup]);

  const handleTimerComplete = async () => {
    setIsActive(false);

    if (mode === "focus") {
      if (session) {
        try {
          await stopFocusSession(session.id, "completed");
          setSession(null);
        } catch (error) {
          console.error("Failed to stop focus session", error);
        }
      }
      setMode("break");
      setTimeLeft(BREAK_DURATION);
    } else {
      setMode("focus");
      setTimeLeft(FOCUS_DURATION);
    }
  };

  const togglePlayPause = () => {
    setIsActive(!isActive);
  };

  const resetTimer = () => {
    setIsActive(false);
    setTimeLeft(mode === "focus" ? FOCUS_DURATION : BREAK_DURATION);
  };

  const switchMode = async () => {
    setIsActive(false);
    
    if (mode === "focus" && session) {
      try {
        await stopFocusSession(session.id, "escaped");
        setSession(null);
      } catch (error) {
        console.error("Failed to stop focus session", error);
      }
    }

    if (mode === "focus") {
      setMode("break");
      setTimeLeft(BREAK_DURATION);
    } else {
      setMode("focus");
      setTimeLeft(FOCUS_DURATION);
    }
  };

  const togglePopup = (type: PopupType, e: React.MouseEvent) => {
    e.stopPropagation();
    setActivePopup(prev => prev === type ? null : type);
  };

  const handleToggleTaskStatus = async (taskId: string, currentStatus: string) => {
    try {
      const newStatus = currentStatus === "done" ? "pending" : "done";
      await updateTask(taskId, { status: newStatus as any });
      setTasks(prev => prev.filter(t => t.id !== taskId));
    } catch (error) {
      console.error("Failed to update task", error);
    }
  };

  const applyCustomTimer = () => {
    let totalSeconds = 0;
    const h = parseInt(customHours) || 0;
    const m = parseInt(customMinutes) || 0;
    
    if (h === 0 && m === 0) return;

    totalSeconds = (h * 3600) + (m * 60);
    setTimeLeft(totalSeconds);
    setIsActive(false);
    setActivePopup(null);
    setCustomHours("");
    setCustomMinutes("");
  };

  const formatTime = (seconds: number) => {
    const h = Math.floor(seconds / 3600);
    const m = Math.floor((seconds % 3600) / 60).toString().padStart(2, "0");
    const s = (seconds % 60).toString().padStart(2, "0");
    if (h > 0) {
      return { m: `${h.toString().padStart(2, "0")}:${m}`, s };
    }
    return { m, s };
  };

  const { m, s } = formatTime(timeLeft);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-[#161816] flex items-center justify-center">
        <div className="w-8 h-8 border-4 border-[#0F8C2A] border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  const dotColor = "#0F8C2A"; 
  const buttonColor = "#0F8C2A"; 
  const textColor = "#E8F5E9";

  const energyPercentage = energyData 
    ? Math.min(100, Math.round((energyData.current_energy / energyData.max_energy) * 100))
    : 0;

  return (
    <main 
      className="min-h-screen text-white font-sans overflow-hidden flex flex-col relative"
      style={{
        backgroundColor: "#161816",
        backgroundImage: `
          radial-gradient(circle at center, #1e2b1f 0%, #161816 70%),
          linear-gradient(rgba(255,255,255,0.02) 1px, transparent 1px),
          linear-gradient(90deg, rgba(255,255,255,0.02) 1px, transparent 1px)
        `,
        backgroundSize: "100% 100%, 40px 40px, 40px 40px",
        backgroundPosition: "center, center, center"
      }}
    >
      {/* Header */}
      <header className="flex justify-between items-center p-8 z-10 relative">
        <Link 
          href="/dashboard" 
          className="flex items-center gap-2 text-white/80 hover:text-white transition"
        >
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <line x1="19" y1="12" x2="5" y2="12" />
            <polyline points="12 19 5 12 12 5" />
          </svg>
          <span className="text-[15px]">Back To Dashboard</span>
        </Link>

        <div className="flex gap-4">
          <button className="px-6 py-2 rounded-lg bg-[#0F8C2A] text-white font-medium hover:bg-[#0c7322] transition">
            Login
          </button>
          <button className="px-6 py-2 rounded-lg border border-white/20 text-white font-medium hover:bg-white/5 transition">
            Sign Up
          </button>
        </div>
      </header>

      {/* Center content */}
      <div className="flex-1 flex flex-col items-center justify-center z-10 -mt-16">
        {/* Mode Pill */}
        <div className="flex items-center gap-2 px-4 py-2 rounded-full border border-white/10 bg-[#1e231e]/50 backdrop-blur-sm mb-6">
          <div 
            className="w-2.5 h-2.5 rounded-full" 
            style={{ backgroundColor: dotColor, boxShadow: `0 0 8px ${dotColor}` }}
          ></div>
          <span className="text-[14px] text-white/90">
            {mode === "focus" ? "Fokus Mode" : "Break Mode"}
          </span>
        </div>

        {/* Status Text */}
        <h2 className="text-[20px] tracking-[0.2em] font-medium text-white/70 mb-2 uppercase">
          {mode === "focus" ? "BEING FOCUSED..." : "TAKING A BREAK..."}
        </h2>

        {/* Timer */}
        <div className="flex items-center text-[160px] font-bold tracking-tight leading-none drop-shadow-lg mb-10" style={{ color: textColor }}>
          <span className="tabular-nums">{m}</span>
          <span className="mx-4 pb-4 animate-pulse">:</span>
          <span className="tabular-nums">{s}</span>
        </div>

        {/* Controls */}
        <div className="flex items-center gap-6">
          <button 
            onClick={togglePlayPause}
            className="w-[64px] h-[64px] rounded-full flex items-center justify-center shadow-lg transition transform hover:scale-105 active:scale-95"
            style={{ backgroundColor: buttonColor }}
          >
            {isActive ? (
              <svg width="28" height="28" viewBox="0 0 24 24" fill="currentColor">
                <rect x="6" y="4" width="4" height="16" rx="1" />
                <rect x="14" y="4" width="4" height="16" rx="1" />
              </svg>
            ) : (
              <svg width="28" height="28" viewBox="0 0 24 24" fill="currentColor" className="ml-1">
                <polygon points="5 3 19 12 5 21 5 3" />
              </svg>
            )}
          </button>

          <button 
            onClick={resetTimer}
            className="w-[54px] h-[54px] rounded-full flex items-center justify-center bg-white/5 border border-white/10 hover:bg-white/10 transition"
          >
            <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="text-white/80">
              <path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8" />
              <polyline points="3 3 3 8 8 8" />
            </svg>
          </button>

          <button 
            onClick={switchMode}
            className="px-8 py-[14px] rounded-full bg-[#2a2e2a] hover:bg-[#343a34] text-white/90 font-semibold tracking-wide transition border border-white/5"
          >
            switch
          </button>
        </div>
      </div>

      {/* Popups Overlay (Only covers screen for centering the Timer Modal, otherwise just container) */}
      {activePopup === "timer" && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-40 flex items-center justify-center">
          <div ref={popupRef} className="bg-[#1C1C1C] border border-white/10 rounded-2xl w-[480px] p-8 shadow-2xl flex flex-col items-center">
            <div className="flex items-center gap-3 text-white mb-2">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="12" cy="12" r="10" />
                <polyline points="12 6 12 12 16 14" />
              </svg>
              <h3 className="text-[20px] font-semibold">Timer Setting</h3>
            </div>
            <p className="text-white/50 text-[14px] mb-8">Set your custom timer.</p>

            <div className="flex w-full gap-4 mb-4">
              <div className="flex-1 relative">
                <input 
                  type="number" 
                  value={customMinutes}
                  onChange={(e) => setCustomMinutes(e.target.value)}
                  className="w-full bg-[#2B2B2B] border border-white/20 rounded-xl px-4 py-4 text-center text-white focus:outline-none focus:border-[#0F8C2A] transition" 
                  placeholder="Minutes"
                />
              </div>
              <div className="flex-1 relative">
                <input 
                  type="number" 
                  value={customHours}
                  onChange={(e) => setCustomHours(e.target.value)}
                  className="w-full bg-[#2B2B2B] border border-white/20 rounded-xl px-4 py-4 text-center text-white focus:outline-none focus:border-[#0F8C2A] transition" 
                  placeholder="Hours"
                />
              </div>
            </div>
            <div className="w-full mb-8">
              <input 
                type="text" 
                className="w-full bg-[#2B2B2B] border border-white/20 rounded-xl px-4 py-4 text-white placeholder:text-white/40 focus:outline-none focus:border-[#0F8C2A] transition" 
                placeholder="Custom Your Timer"
              />
            </div>

            <div className="flex w-full gap-4">
              <button 
                onClick={() => setActivePopup(null)}
                className="flex-1 py-3.5 rounded-xl bg-[#A10000] hover:bg-[#800000] text-white font-medium transition"
              >
                Cancel
              </button>
              <button 
                onClick={applyCustomTimer}
                className="flex-1 py-3.5 rounded-xl bg-[#0F8C2A] hover:bg-[#0c7322] text-white font-medium transition"
              >
                Apply
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Popovers anchored to Bottom Left */}
      <div className="absolute bottom-[90px] left-8 z-40 flex flex-col items-start gap-4">
        {/* Task Popup */}
        {activePopup === "task" && (
          <div ref={popupRef} className="bg-[#595959] border border-white/10 rounded-2xl w-[400px] shadow-2xl p-4 origin-bottom-left animate-in fade-in zoom-in-95 duration-200">
            <div className="flex items-center gap-2 mb-4 px-2">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#0F8C2A" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                <polyline points="14 2 14 8 20 8" />
                <line x1="16" y1="13" x2="8" y2="13" />
                <line x1="16" y1="17" x2="8" y2="17" />
                <polyline points="10 9 9 9 8 9" />
              </svg>
              <h3 className="text-white text-[16px] font-medium">Task</h3>
            </div>
            
            <div className="flex flex-col gap-2 max-h-[300px] overflow-y-auto pr-2 custom-scrollbar">
              {tasks.length > 0 ? tasks.map((task) => (
                <div key={task.id} className="flex items-center gap-3 p-3.5 bg-[#2B2B2B] rounded-xl hover:bg-[#333333] transition cursor-pointer">
                  <button 
                    onClick={() => handleToggleTaskStatus(task.id, task.status)}
                    className="w-5 h-5 rounded border border-white/40 flex-shrink-0 hover:border-[#0F8C2A] transition"
                  ></button>
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="white" className="flex-shrink-0">
                    <polygon points="5 3 19 12 5 21 5 3" />
                  </svg>
                  <span className="text-white/90 text-[14px] truncate">{task.title}</span>
                </div>
              )) : (
                <div className="text-white/50 text-[13px] px-2 py-4 text-center">Belum ada task aktif.</div>
              )}
            </div>
          </div>
        )}

        {/* Energy Popup */}
        {activePopup === "energy" && (
          <div ref={popupRef} className="bg-[#595959] border border-white/10 rounded-2xl w-[320px] shadow-2xl p-5 origin-bottom-left animate-in fade-in zoom-in-95 duration-200">
            <div className="flex items-center gap-3 mb-5">
              <div className="w-8 h-8 rounded-lg border-2 border-[#0F8C2A] flex items-center justify-center">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#0F8C2A" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2" />
                </svg>
              </div>
              <h3 className="text-white text-[18px] font-medium">Energy</h3>
            </div>
            
            <div className="flex items-center gap-4">
              <div className="flex-1 h-4 bg-black rounded-full overflow-hidden border border-black/20">
                <div 
                  className="h-full bg-[#0F8C2A] rounded-full transition-all duration-500 ease-out" 
                  style={{ width: `${energyPercentage}%` }}
                ></div>
              </div>
              <span className="text-white text-[14px] font-medium w-10 text-right">{energyPercentage}%</span>
            </div>
          </div>
        )}
      </div>

      {/* Bottom Footer Icons */}
      <footer className="absolute bottom-8 left-8 right-8 flex justify-between items-end z-30">
        <div className="flex items-center gap-2 p-1.5 rounded-xl border border-white/10 backdrop-blur-md" style={{ backgroundColor: "rgba(30, 35, 30, 0.6)" }}>
          {/* Task Icon (Clipboard) */}
          <button 
            onClick={(e) => togglePopup("task", e)}
            className={`w-[46px] h-[46px] flex items-center justify-center rounded-lg transition ${activePopup === "task" ? "bg-white/20" : "hover:bg-white/10"}`}
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-white/80">
              <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
              <polyline points="14 2 14 8 20 8" />
              <line x1="16" y1="13" x2="8" y2="13" />
              <line x1="16" y1="17" x2="8" y2="17" />
              <polyline points="10 9 9 9 8 9" />
            </svg>
          </button>
          
          {/* Timer Settings Icon (Replaced Music with Stopwatch) */}
          <button 
            onClick={(e) => togglePopup("timer", e)}
            className={`w-[46px] h-[46px] flex items-center justify-center rounded-lg transition ${activePopup === "timer" ? "bg-white/20" : "hover:bg-white/10"}`}
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-white/80">
              <circle cx="12" cy="12" r="10" />
              <polyline points="12 6 12 12 16 14" />
            </svg>
          </button>
          
          {/* Energy Icon (Lightning) */}
          <button 
            onClick={(e) => togglePopup("energy", e)}
            className={`w-[46px] h-[46px] flex items-center justify-center rounded-lg transition ${activePopup === "energy" ? "bg-white/20" : "hover:bg-white/10"}`}
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-white/80">
              <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2" />
            </svg>
          </button>
        </div>

        {/* Fullscreen Icon */}
        <button 
          className="w-[46px] h-[46px] flex items-center justify-center rounded-xl border border-white/10 backdrop-blur-md hover:bg-white/10 transition"
          style={{ backgroundColor: "rgba(30, 35, 30, 0.6)" }}
          onClick={() => {
            if (!document.fullscreenElement) {
              document.documentElement.requestFullscreen().catch(err => console.error(err));
            } else {
              document.exitFullscreen();
            }
          }}
        >
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-white/80">
            <path d="M8 3H5a2 2 0 0 0-2 2v3" />
            <path d="M21 8V5a2 2 0 0 0-2-2h-3" />
            <path d="M3 16v3a2 2 0 0 0 2 2h3" />
            <path d="M16 21h3a2 2 0 0 0 2-2v-3" />
          </svg>
        </button>
      </footer>
    </main>
  );
}
