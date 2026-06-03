"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import {
  applyTemplate,
  clearAuthSession,
  getDashboardZen,
  getEnergySummary,
  getStoredUser,
  getTasks,
  getTemplates,
  hasActiveSession,
  isGuestSession,
  startFocusSession,
  updateTask,
  createTask,
} from "../lib/api";
import { LOGO_SRC } from "../lib/assets";
import type { EnergyWeight, Task, TaskStatus, TaskTemplate } from "../lib/api";

const COLOR = {
  primary: "#008B1F",
  primaryHover: "#007A1B",
  primarySoft: "#9CFFAD",
  primaryPale: "#ECFFF0",
  border: "#D9D9D9",
  borderSoft: "#ECECEC",
  surface: "#FFFFFF",
  panel: "#F5F5F5",
  text: "#1E1E1E",
  muted: "#8A8A8A",
  mutedDark: "#666666",
  danger: "#FF6B76",
  dangerSoft: "#FFCDD2",
};

const GUEST_ENERGY_SUMMARY = {
  current_energy: 100,
  max_energy: 100,
  is_critical_energy: false,
};

const CARD_STYLE = {
  backgroundColor: COLOR.surface,
  borderRadius: "8px",
  border: `1px solid ${COLOR.border}`,
} as const;

const buttonReset = {
  border: "none",
  background: "none",
  fontFamily: "inherit",
  cursor: "pointer",
} as const;

// ─── SVG Icons ────────────────────────────────────────────────────────────────

const DashboardIcon = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <rect x="3" y="3" width="7" height="7" rx="1" />
    <rect x="14" y="3" width="7" height="7" rx="1" />
    <rect x="3" y="14" width="7" height="7" rx="1" />
    <rect x="14" y="14" width="7" height="7" rx="1" />
  </svg>
);

const TaskIcon = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M9 5H7a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V7a2 2 0 0 0-2-2h-2" />
    <rect x="9" y="3" width="6" height="4" rx="1" />
    <path d="m9 14 2 2 4-4" />
  </svg>
);

const TemplateIcon = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
    <polyline points="14 2 14 8 20 8" />
  </svg>
);

const SignOutIcon = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
    <polyline points="16 17 21 12 16 7" />
    <line x1="21" y1="12" x2="9" y2="12" />
  </svg>
);

const SearchIcon = () => (
  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="11" cy="11" r="8" />
    <line x1="21" y1="21" x2="16.65" y2="16.65" />
  </svg>
);

const BellIcon = () => (
  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" />
    <path d="M13.73 21a2 2 0 0 1-3.46 0" />
  </svg>
);

const PlayIcon = () => (
  <svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor">
    <polygon points="5 3 19 12 5 21 5 3" />
  </svg>
);

const CheckSquareIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke={COLOR.text} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="9 11 12 14 22 4" />
    <path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11" />
  </svg>
);

const ClockAlertIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke={COLOR.text} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="12" cy="12" r="10" />
    <polyline points="12 6 12 12 16 14" />
  </svg>
);

const AlertTriangleIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke={COLOR.text} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M10.29 3.86 1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" />
    <line x1="12" y1="9" x2="12" y2="13" />
    <line x1="12" y1="17" x2="12.01" y2="17" />
  </svg>
);

const BatteryIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke={COLOR.text} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <rect x="1" y="6" width="18" height="12" rx="2" ry="2" />
    <line x1="23" y1="13" x2="23" y2="11" />
  </svg>
);

const CalendarSmIcon = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
    <line x1="16" y1="2" x2="16" y2="6" />
    <line x1="8" y1="2" x2="8" y2="6" />
    <line x1="3" y1="10" x2="21" y2="10" />
  </svg>
);

const SubtaskIcon = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <line x1="8" y1="6" x2="21" y2="6" />
    <line x1="8" y1="12" x2="21" y2="12" />
    <line x1="8" y1="18" x2="21" y2="18" />
    <line x1="3" y1="6" x2="3.01" y2="6" />
    <line x1="3" y1="12" x2="3.01" y2="12" />
    <line x1="3" y1="18" x2="3.01" y2="18" />
  </svg>
);

const FilterIcon = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <polygon points="22 3 2 3 10 12.46 10 19 14 21 14 12.46 22 3" />
  </svg>
);

const ChevronLeftIcon = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="15 18 9 12 15 6" />
  </svg>
);

const ChevronRightIcon = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="9 18 15 12 9 6" />
  </svg>
);

const MoreDotsIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
    <circle cx="5" cy="12" r="2" />
    <circle cx="12" cy="12" r="2" />
    <circle cx="19" cy="12" r="2" />
  </svg>
);

const TrendUpIcon = () => (
  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke={COLOR.primary} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="23 6 13.5 15.5 8.5 10.5 1 18" />
    <polyline points="17 6 23 6 23 12" />
  </svg>
);

const TrendDownIcon = () => (
  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke={COLOR.danger} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="23 18 13.5 8.5 8.5 13.5 1 6" />
    <polyline points="17 18 23 18 23 12" />
  </svg>
);

const CompassIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#4F46E5" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="12" cy="5" r="2" />
    <path d="M10.585 6.415l-6.585 13.585" />
    <path d="M13.415 6.415l6.585 13.585" />
    <path d="M7 16h10" />
  </svg>
);

const EyeOutlineIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#6b7280" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
    <circle cx="12" cy="12" r="3" />
  </svg>
);

const UsersIcon = () => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
    <path d="M12 11c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zM18 11c1.66 0 3-1.34 3-3s-1.34-3-3-3-3 1.34-3 3 1.34 3 3 3zM6 11c1.66 0 3-1.34 3-3S7.66 2 6 2 3 3.34 3 5s1.34 3 3 3zM12 13c-2.67 0-8 1.34-8 4v3h16v-3c0-2.66-5.33-4-8-4zM21 13c-.2 0-.42.02-.64.05C21.37 14.07 22 15.34 22 17v3h3v-3c0-2.66-2.67-4-4-4zM3 13c-.2 0-.42.02-.64.05.63 1.02 1.27 2.29 1.27 3.95v3H1v-3c0-2.66 2.67-4 4-4z" />
  </svg>
);

const ShareIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="18" cy="5" r="3" />
    <circle cx="6" cy="12" r="3" />
    <circle cx="18" cy="19" r="3" />
    <line x1="8.59" y1="13.51" x2="15.42" y2="17.49" />
    <line x1="15.41" y1="6.51" x2="8.59" y2="10.49" />
  </svg>
);

const WrenchIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
    <path d="M19.1 12.9c-1.5-1.5-3.8-1.7-5.5-.5L11.8 14 10 12.2l1.6-1.8c-1.2-1.7-1-4 .5-5.5 1.7-1.7 4.3-1.9 6.2-.6l-2.4 2.4 2.1 2.1 2.4-2.4c1.3 1.9 1.1 4.5-.6 6.2zM4.1 21.3c-.6.6-1.5.6-2.1 0-.6-.6-1.5 0-2.1l6.1-6.1 2.1 2.1-6.1 6.1z" />
  </svg>
);

const MailIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
    <path d="M20 4H4c-1.1 0-1.99.9-1.99 2L2 18c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V6c0-1.1-.9-2-2-2zm0 4l-8 5-8-5V6l8 5 8-5v2z" />
  </svg>
);

const UsersUpIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
    <path d="M15 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm-9-2V7H4v3H1v2h3v3h2v-3h3v-2H6zm9 4c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z" />
  </svg>
);

const DownloadSquareIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <rect x="3" y="3" width="18" height="18" rx="2" ry="2" />
    <line x1="12" y1="8" x2="12" y2="16" />
    <polyline points="8 12 12 16 16 12" />
  </svg>
);

const ArrowLeftIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <line x1="19" y1="12" x2="5" y2="12" />
    <polyline points="12 19 5 12 12 5" />
  </svg>
);

const CalendarLineIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
    <line x1="16" y1="2" x2="16" y2="6" />
    <line x1="8" y1="2" x2="8" y2="6" />
    <line x1="3" y1="10" x2="21" y2="10" />
  </svg>
);

const SuccessCheckIcon = () => (
  <svg width="120" height="120" viewBox="0 0 120 120" fill="none">
    <circle cx="60" cy="60" r="50" stroke={COLOR.primary} strokeWidth="8" />
    <path d="M35 60l15 15 35-35" stroke={COLOR.primary} strokeWidth="8" strokeLinecap="round" strokeLinejoin="round" />
    <path d="M20 30l5 5M90 20l5-5M100 80l-5 5" stroke={COLOR.primary} strokeWidth="4" strokeLinecap="round" />
  </svg>
);

const CheckCircleSolidIcon = () => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill={COLOR.primary}>
    <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z" />
  </svg>
);

const PlusCircleIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor" color="#6b7280">
    <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm5 11h-4v4h-2v-4H7v-2h4V7h2v4h4v2z" />
  </svg>
);


// ─── Stat Card Badge ──────────────────────────────────────────────────────────

function TrendBadge({ value, up }: { value: string; up: boolean }) {
  return (
    <span
      style={{
        display: "inline-flex",
        alignItems: "center",
        gap: "2px",
        fontSize: "12px",
        fontWeight: 700,
        color: up ? COLOR.primary : "#D62839",
        backgroundColor: up ? "#BDFCC8" : COLOR.dangerSoft,
        borderRadius: "999px",
        padding: "2px 8px",
      }}
    >
      {up ? <TrendUpIcon /> : <TrendDownIcon />}
      {value}
    </span>
  );
}

// ─── Priority Badge ───────────────────────────────────────────────────────────

function PriorityBadge({ level }: { level: "HIGH" | "MEDIUM" | "LOW" }) {
  const map = {
    HIGH: { bg: "#6D6D6D", text: "#fff" },
    MEDIUM: { bg: "#7B7B7B", text: "#fff" },
    LOW: { bg: "#8E8E8E", text: "#fff" },
  };
  const { bg, text } = map[level];
  return (
    <span
      style={{
        display: "inline-block",
        fontSize: "11px",
        fontWeight: 700,
        letterSpacing: "0.04em",
        color: text,
        backgroundColor: bg,
        borderRadius: "999px",
        padding: "3px 10px",
        lineHeight: "16px",
        flexShrink: 0,
      }}
    >
      {level}
    </span>
  );
}

// ─── Mini Line Chart (SVG) ────────────────────────────────────────────────────

type ChartRange = "week" | "month" | "year";

const CHART_DATA: Record<ChartRange, { labels: string[]; data: number[] }> = {
  week: {
    labels: ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"],
    data: [3, 4, 2, 3, 3, 4, 1],
  },
  month: {
    labels: ["W1", "W2", "W3", "W4"],
    data: [8, 12, 6, 10],
  },
  year: {
    labels: ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"],
    data: [15, 20, 12, 18, 22, 14, 19, 25, 17, 21, 16, 23],
  },
};

function ProductivityChart({ range = "week" }: { range?: ChartRange }) {
  const { labels, data } = CHART_DATA[range];
  const width = 520;
  const height = 220;
  const padX = 40;
  const padY = 20;
  const maxVal = Math.max(...data) + 2;
  const chartW = width - padX * 2;
  const chartH = height - padY * 2;

  const points = data.map((v, i) => {
    const x = padX + (i / (data.length - 1)) * chartW;
    const y = padY + chartH - (v / maxVal) * chartH;
    return `${x},${y}`;
  });
  const areaPoints = [
    `${padX},${height - padY}`,
    ...points,
    `${width - padX},${height - padY}`,
  ].join(" ");

  const ySteps = 7;
  const yLabels = Array.from({ length: ySteps }, (_, i) => Math.round((maxVal / (ySteps - 1)) * i));

  const lineLength = points.reduce((acc, _, i, arr) => {
    if (i === 0) return 0;
    const [x1, y1] = arr[i - 1].split(",").map(Number);
    const [x2, y2] = arr[i].split(",").map(Number);
    return acc + Math.sqrt((x2 - x1) ** 2 + (y2 - y1) ** 2);
  }, 0);

  return (
    <svg width="100%" height="100%" viewBox={`0 0 ${width} ${height + 30}`} style={{ overflow: "visible" }}>
      <style>{`
        @keyframes drawLine { from { stroke-dashoffset: ${lineLength}; } to { stroke-dashoffset: 0; } }
        @keyframes fadeIn { from { opacity: 0; transform: translateY(4px); } to { opacity: 1; transform: translateY(0); } }
        @keyframes popIn { 0% { r: 0; } 60% { r: 4.5; } 100% { r: 3; } }
      `}</style>
      {/* Y axis labels & grid */}
      {yLabels.map((v, i) => {
        const y = padY + chartH - (v / maxVal) * chartH;
        return (
          <g key={`y-${i}`} style={{ animation: `fadeIn 0.4s ease ${i * 0.05}s both` }}>
            <text x={padX - 12} y={y + 4} textAnchor="end" fontSize="9" fill={COLOR.muted}>{v}</text>
            <line x1={padX} y1={y} x2={width - padX} y2={y} stroke="#E8E8E8" strokeWidth="1" />
          </g>
        );
      })}
      {/* X axis labels */}
      {labels.map((d, i) => {
        const x = padX + (i / (labels.length - 1)) * chartW;
        return (
          <text key={d} x={x} y={height + 16} textAnchor="middle" fontSize="8" fill={COLOR.text}
            style={{ animation: `fadeIn 0.4s ease ${0.2 + i * 0.04}s both` }}>{d}</text>
        );
      })}
      <polygon points={areaPoints} fill="#EEFFF0" opacity="0.95" style={{ animation: `fadeIn 0.8s ease 0.3s both` }} />
      {/* Animated Line */}
      <polyline
        points={points.join(" ")}
        fill="none"
        stroke={COLOR.primary}
        strokeWidth="2"
        strokeLinejoin="round"
        strokeLinecap="round"
        strokeDasharray={lineLength}
        strokeDashoffset="0"
        style={{ animation: `drawLine 1.2s ease-out 0.3s both` }}
      />
      {/* Animated Dots */}
      {data.map((v, i) => {
        const x = padX + (i / (data.length - 1)) * chartW;
        const y = padY + chartH - (v / maxVal) * chartH;
        return <circle key={i} cx={x} cy={y} r="3" fill={COLOR.primary}
          style={{ animation: `popIn 0.4s ease ${0.5 + i * 0.1}s both` }} />;
      })}
    </svg>
  );
}

// ─── Sample Data ──────────────────────────────────────────────────────────────

// ─── Calendar Helpers ─────────────────────────────────────────────────────────

const MONTH_NAMES = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
const DAY_HEADERS = ["MON", "TUE", "WED", "THU", "FRI", "SAT", "SUN"];

function getCalendarWeek(referenceDate: Date) {
  const day = referenceDate.getDay();
  const mondayOffset = day === 0 ? -6 : 1 - day;
  const monday = new Date(referenceDate);
  monday.setDate(referenceDate.getDate() + mondayOffset);

  const dates: Date[] = [];
  for (let i = 0; i < 7; i++) {
    const d = new Date(monday);
    d.setDate(monday.getDate() + i);
    dates.push(d);
  }
  return dates;
}

function isSameDay(a: Date, b: Date) {
  return a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate();
}

// ─── Template Data ────────────────────────────────────────────────────────────

const templatesData = [
  { id: 1, title: "Weekly Design Sprint", desc: "A collaborative 5-day process for answering critical business questions through design, prototyping, and testing.", level: "HIGH", subtasks: 2, type: ["All", "Public"] },
  { id: 2, title: "Proyek Kelompok", desc: "A collaborative 5-day process for answering critical business questions through design, prototyping, and testing.", level: "MIDLE", subtasks: 4, type: ["All", "Private"] },
  { id: 3, title: "Rencana Belajar Semester", desc: "A collaborative 5-day process for answering critical business questions through design, prototyping, and testing.", level: "LOW", subtasks: 3, type: ["All", "Public"] },
  { id: 4, title: "Menulis Skripsi", desc: "A collaborative 5-day process for answering critical business questions through design, prototyping, and testing.", level: "HIGH", subtasks: 4, type: ["All", "Private"] },
  { id: 5, title: "Persiapan Ujian", desc: "A collaborative 5-day process for answering critical business questions through design, prototyping, and testing.", level: "LOW", subtasks: 2, type: ["All"] },
  { id: 6, title: "Persiapan Presentasi", desc: "A collaborative 5-day process for answering critical business questions through design, prototyping, and testing.", level: "MIDLE", subtasks: 5, type: ["All", "Public", "Private"] },
  { id: 7, title: "Project PKM Mahasiswa", desc: "A collaborative 5-day process for answering critical business questions through design, prototyping, and testing.", level: "HIGH", subtasks: 4, type: ["Private"] },
];

// ─── Main Dashboard ───────────────────────────────────────────────────────────

type PriorityLevel = "HIGH" | "MEDIUM" | "LOW";

type ViewTask = {
  id?: string;
  title: string;
  level: PriorityLevel;
  subtask: string;
  date: string;
  done?: boolean;
  status?: TaskStatus;
};

type ViewCard = {
  id: number;
  backendKey?: string;
  taskId?: string;
  title: string;
  desc: string;
  level: string;
  subtasks: number;
  type: string[];
  previewItems?: TaskTemplate["preview_items"];
};

const mapEnergyToLevel = (energyWeight: EnergyWeight): PriorityLevel => {
  if (energyWeight === "Berat") return "HIGH";
  if (energyWeight === "Sedang") return "MEDIUM";
  return "LOW";
};

const formatDate = (value: string | null) => {
  if (!value) return "No due date";

  return new Intl.DateTimeFormat("id-ID", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  }).format(new Date(value));
};

const mapTaskToViewTask = (task: Task): ViewTask => ({
  id: task.id,
  title: task.title,
  level: mapEnergyToLevel(task.energy_weight),
  subtask: task.source_template ? `Template: ${task.source_template}` : task.status,
  date: formatDate(task.deadline),
  done: task.status === "done",
  status: task.status,
});

const mapTemplateToCard = (template: TaskTemplate, index: number): ViewCard => ({
  id: index + 1,
  backendKey: template.key,
  title: template.name,
  desc: template.description,
  level: "OFFICIAL",
  subtasks: template.total_items,
  type: ["All", "Public"],
  previewItems: template.preview_items,
});

const mapTaskToCard = (task: Task, index: number): ViewCard => ({
  id: index + 1,
  taskId: task.id,
  title: task.title,
  desc: task.source_template
    ? `Task dari template ${task.source_template}`
    : `Status: ${task.status.replace("_", " ")}`,
  level: mapEnergyToLevel(task.energy_weight),
  subtasks: task.used_timer ? task.timer_duration ?? 0 : 0,
  type: ["All", task.status === "done" ? "Public" : "Private"],
});

const getDisplayName = () => {
  const user = getStoredUser();
  return user?.display_name || user?.email?.split("@")[0] || "User";
};

export default function DashboardPage() {
  const router = useRouter();
  const [timeRange, setTimeRange] = useState<"Daily" | "Weekly" | "Monthly" | "Yearly">("Weekly");
  const [templateFilter, setTemplateFilter] = useState<"All" | "Public" | "Private">("All");
  const [searchTask, setSearchTask] = useState("");
  const [activeMenu, setActiveMenu] = useState("dashboard");
  const [selectedTemplateId, setSelectedTemplateId] = useState<number | null>(null);
  const [templateView, setTemplateView] = useState<"list" | "detail" | "create" | "success">("list");
  const [templatesList, setTemplatesList] = useState<ViewCard[]>(templatesData);
  const [apiTasks, setApiTasks] = useState<Task[]>([]);
  const [displayName, setDisplayName] = useState("User");
  const [energyPercent, setEnergyPercent] = useState(0);
  const [isActionLoading, setIsActionLoading] = useState(false);
  const [notice, setNotice] = useState<string | null>(null);
  const [deadlineStats, setDeadlineStats] = useState({ upcoming: 0, overdue: 0 });
  const [chartRange, setChartRange] = useState<ChartRange>("week");
  const [chartDropdownOpen, setChartDropdownOpen] = useState(false);
  const [calendarRef, setCalendarRef] = useState(() => new Date());

  const [isAddTaskModalOpen, setIsAddTaskModalOpen] = useState(false);
  const [addTaskTitle, setAddTaskTitle] = useState("");
  const [addTaskEnergy, setAddTaskEnergy] = useState<EnergyWeight>("Ringan");
  const [addTaskDeadline, setAddTaskDeadline] = useState("");

  const [newTemplate, setNewTemplate] = useState({
    title: "",
    desc: "",
    deadline: "",
    category: "WORK",
    priority: "MIDLE",
    status: "TO DO",
    label: "PRIVATE"
  });

  const loadDashboardData = useCallback(async (silent = false) => {
    if (!hasActiveSession()) {
      router.replace("/login");
      return;
    }

    if (!silent) setNotice(null);

    try {
      const guest = isGuestSession();
      const [tasksResult, zenResult, templatesResult, energyResult] =
        await Promise.all([
          getTasks(1, 50),
          getDashboardZen(),
          guest ? Promise.resolve({ data: [] }) : getTemplates(),
          guest ? Promise.resolve({ data: GUEST_ENERGY_SUMMARY }) : getEnergySummary(),
        ]);

      setDisplayName(getDisplayName());
      setApiTasks(tasksResult.data);
      setTemplatesList(templatesResult.data.map(mapTemplateToCard));
      const currentTime = Date.now();
      setDeadlineStats({
        upcoming: tasksResult.data.filter((task) => {
          if (!task.deadline || task.status === "done") return false;
          const deadline = new Date(task.deadline).getTime();
          return deadline >= currentTime && deadline <= currentTime + 7 * 24 * 60 * 60 * 1000;
        }).length,
        overdue: tasksResult.data.filter((task) => {
          return task.deadline &&
            task.status !== "done" &&
            new Date(task.deadline).getTime() < currentTime;
        }).length,
      });
      setEnergyPercent(
        Math.round(
          (energyResult.data.current_energy / energyResult.data.max_energy) *
            100,
        ),
      );

      if (zenResult.hidden_message) {
        setNotice(zenResult.hidden_message);
      }
    } catch (error) {
      setNotice(
        error instanceof Error
          ? error.message
          : "Gagal memuat data dashboard.",
      );
    }
  }, [router]);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      void loadDashboardData();
    }, 0);

    return () => window.clearTimeout(timer);
  }, [loadDashboardData]);

  const filteredTasks = useMemo(() => {
    const keyword = searchTask.trim().toLowerCase();
    const tasks = apiTasks.map(mapTaskToViewTask);

    if (!keyword) return tasks;

    return tasks.filter((task) =>
      `${task.title} ${task.subtask} ${task.date}`.toLowerCase().includes(keyword),
    );
  }, [apiTasks, searchTask]);

  const priorityTaskItems = useMemo<ViewTask[]>(() => {
    const activeTasks = apiTasks
      .filter((task) => task.status !== "done")
      .sort((a, b) => {
        const aDeadline = a.deadline ? new Date(a.deadline).getTime() : Number.MAX_SAFE_INTEGER;
        const bDeadline = b.deadline ? new Date(b.deadline).getTime() : Number.MAX_SAFE_INTEGER;

        return aDeadline - bDeadline;
      })
      .slice(0, 3)
      .map(mapTaskToViewTask);

    return activeTasks;
  }, [apiTasks]);

  const recentTaskItems: ViewTask[] = filteredTasks;
  const emptyRecentTaskMessage = searchTask.trim()
    ? "Task tidak ditemukan"
    : "Belum ada task";

  const taskCards = useMemo(() => {
    return apiTasks.map(mapTaskToCard);
  }, [apiTasks]);

  const cardItems = activeMenu === "task" ? taskCards : templatesList;
  const selectedCard = templatesList.find((item) => item.id === selectedTemplateId) ?? null;
  const completedCount = apiTasks.filter((task) => task.status === "done").length;
  const upcomingDeadlineCount = deadlineStats.upcoming;
  const overdueCount = deadlineStats.overdue;

  const handleSignOut = () => {
    clearAuthSession();
    router.push("/login");
  };

  const handleToggleTaskStatus = async (task: ViewTask, checked: boolean) => {
    if (!task.id) return;

    setIsActionLoading(true);
    try {
      await updateTask(task.id, { status: checked ? "done" : "pending" });
      await loadDashboardData(true);
    } catch (error) {
      setNotice(error instanceof Error ? error.message : "Gagal update task.");
    } finally {
      setIsActionLoading(false);
    }
  };

  const handleStartFocus = async (taskId?: string) => {
    if (!taskId) {
      router.push("/focus");
      return;
    }

    setIsActionLoading(true);
    try {
      await startFocusSession(taskId);
      setNotice("Sesi fokus berhasil dimulai.");
      router.push("/focus");
    } catch (error) {
      setNotice(error instanceof Error ? error.message : "Gagal memulai fokus.");
    } finally {
      setIsActionLoading(false);
    }
  };

  const handleUseCard = async (item: ViewCard) => {
    if (activeMenu === "task") {
      await handleStartFocus(item.taskId);
      return;
    }

    if (!item.backendKey) {
      setSelectedTemplateId(item.id);
      setTemplateView("detail");
      return;
    }

    setIsActionLoading(true);
    try {
      await applyTemplate(item.backendKey);
      setNotice(`Template ${item.title} berhasil diterapkan.`);
      setActiveMenu("task");
      await loadDashboardData(true);
    } catch (error) {
      setNotice(error instanceof Error ? error.message : "Gagal menerapkan template.");
    } finally {
      setIsActionLoading(false);
    }
  };

  const handleCreateTask = async () => {
    if (!addTaskTitle.trim()) {
      setNotice("Nama tugas tidak boleh kosong.");
      return;
    }
    setIsActionLoading(true);
    try {
      await createTask({
        title: addTaskTitle,
        energy_weight: addTaskEnergy,
        deadline: addTaskDeadline || null,
      });
      setNotice("Tugas berhasil ditambahkan.");
      setIsAddTaskModalOpen(false);
      setAddTaskTitle("");
      setAddTaskEnergy("Ringan");
      setAddTaskDeadline("");
      await loadDashboardData(true);
    } catch (error) {
      setNotice(error instanceof Error ? error.message : "Gagal menambahkan tugas.");
    } finally {
      setIsActionLoading(false);
    }
  };

  return (
    <div style={{ display: "flex", minHeight: "100vh", backgroundColor: COLOR.surface, color: COLOR.text, fontFamily: "inherit" }}>

      {/* ═══════════════════════════════════════
          SIDEBAR
      ═══════════════════════════════════════ */}
      <aside
        style={{
          width: "210px",
          minHeight: "100vh",
          backgroundColor: COLOR.surface,
          borderRight: `1px solid ${COLOR.borderSoft}`,
          display: "flex",
          flexDirection: "column",
          padding: "24px 0 0",
          position: "sticky",
          top: 0,
          flexShrink: 0,
        }}
      >
        {/* Logo */}
        <div style={{ display: "flex", alignItems: "center", gap: "12px", padding: "0 28px", marginBottom: "38px" }}>
          <span
            aria-label="Ben To Do Logo"
            style={{
              width: "32px",
              height: "32px",
              display: "inline-block",
              backgroundColor: COLOR.primary,
              WebkitMask: `url('${LOGO_SRC}') center / contain no-repeat`,
              mask: `url('${LOGO_SRC}') center / contain no-repeat`,
              flexShrink: 0,
            }}
          />
          <div>
            <div style={{ fontSize: "14px", fontWeight: 700, color: COLOR.text, lineHeight: 1.1 }}>Ben To Do</div>
            <div style={{ fontSize: "11px", color: COLOR.text, fontWeight: 400, lineHeight: 1.15 }}>Task Dashboard</div>
          </div>
        </div>

        {/* Menu Label */}
        <div style={{ fontSize: "11px", fontWeight: 600, color: COLOR.text, letterSpacing: "0", padding: "0 28px", marginBottom: "14px" }}>
          MENU
        </div>

        {/* Nav Items */}
        <nav style={{ display: "flex", flexDirection: "column", gap: "10px", padding: "0 24px" }}>
          {[
            { key: "dashboard", label: "DashBoard", icon: <DashboardIcon /> },
            { key: "task", label: "Task", icon: <TaskIcon /> },
            { key: "template", label: "Template", icon: <TemplateIcon /> },
          ].map(({ key, label, icon }) => (
            <button
              key={key}
              onClick={() => {
                setActiveMenu(key);
                setSelectedTemplateId(null);
                setTemplateView("list");
              }}
              style={{
                display: "flex",
                alignItems: "center",
                gap: "11px",
                height: "42px",
                padding: "0 14px",
                borderRadius: "4px",
                border: "none",
                cursor: "pointer",
                fontFamily: "inherit",
                fontSize: "13px",
                fontWeight: activeMenu === key ? 600 : 400,
                color: activeMenu === key ? COLOR.primary : COLOR.mutedDark,
                backgroundColor: activeMenu === key ? COLOR.primarySoft : "transparent",
                transition: "all 0.15s",
                width: "100%",
                textAlign: "left",
              }}
            >
              <span style={{ display: "flex", color: activeMenu === key ? COLOR.primary : COLOR.mutedDark }}>
                {icon}
              </span>
              {label}
            </button>
          ))}
        </nav>

        {/* Spacer */}
        <div style={{ flex: 1 }} />

        {/* Sign Out */}
        <div style={{ padding: "22px 24px", borderTop: `1px solid ${COLOR.borderSoft}` }}>
          <button
            onClick={handleSignOut}
            style={{
              display: "flex",
              alignItems: "center",
              gap: "11px",
              height: "36px",
              padding: "0 12px",
              borderRadius: "3px",
              border: "none",
              cursor: "pointer",
              fontFamily: "inherit",
              fontSize: "13px",
              fontWeight: 400,
              color: COLOR.mutedDark,
              backgroundColor: "transparent",
              transition: "all 0.15s",
              width: "100%",
              textAlign: "left",
            }}
          >
            <SignOutIcon />
            Sign Out
          </button>
        </div>
      </aside>

      {/* ═══════════════════════════════════════
          MAIN CONTENT
      ═══════════════════════════════════════ */}
      <main style={{ flex: 1, display: "flex", flexDirection: "column", minWidth: 0 }}>

        {/* ── Top Bar ── */}
        <header
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            height: "64px",
            padding: "0 32px",
            backgroundColor: COLOR.surface,
            borderBottom: `1px solid ${COLOR.borderSoft}`,
            position: "sticky",
            top: 0,
            zIndex: 20,
          }}
        >
          <h1 style={{ fontSize: "18px", fontWeight: 400, color: COLOR.text, margin: 0 }}>
            {activeMenu === "dashboard" ? "Dashboard" :
              activeMenu === "task" ? "Task" :
                templateView === "create" ? "Create Template" :
                  templateView === "success" ? "Create Template" :
                    templateView === "detail" ? "Detail Template" : "Template"}
          </h1>

          {/* Search + Notification + Profile */}
          <div style={{ display: "flex", alignItems: "center", gap: "14px" }}>
            {/* Search */}
            <div style={{ position: "relative" }}>
              <span style={{ position: "absolute", left: "12px", top: "50%", transform: "translateY(-50%)", color: COLOR.muted, display: "flex" }}>
                <SearchIcon />
              </span>
              <input
                type="text"
                placeholder={activeMenu === "template" ? "Search template" : "Search task"}
                value={searchTask}
                onChange={(e) => setSearchTask(e.target.value)}
                style={{
                  width: "260px",
                  height: "32px",
                  borderRadius: "3px",
                  border: `1px solid ${COLOR.border}`,
                  paddingLeft: "36px",
                  paddingRight: "12px",
                  fontSize: "12px",
                  color: COLOR.text,
                  backgroundColor: COLOR.surface,
                  outline: "none",
                  fontFamily: "inherit",
                }}
              />
            </div>

            {/* Notification */}
            <button
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                width: "32px",
                height: "32px",
                borderRadius: "3px",
                border: `1px solid ${COLOR.border}`,
                background: "none",
                color: COLOR.mutedDark,
                cursor: "pointer",
              }}
            >
              <BellIcon />
            </button>

            {/* User Avatar + Name */}
            <div style={{ display: "flex", alignItems: "center", gap: "10px", paddingLeft: "12px", borderLeft: `1px solid ${COLOR.borderSoft}` }}>
              <div
                style={{
                  width: "38px",
                  height: "38px",
                  borderRadius: "50%",
                  background: "linear-gradient(135deg, #6EE7F9 0%, #0F766E 100%)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontSize: "14px",
                  fontWeight: 700,
                  color: "#ffffff",
                }}
              >
                {displayName.charAt(0).toUpperCase()}
              </div>
              <div>
                <div style={{ fontSize: "12px", fontWeight: 700, color: COLOR.text, lineHeight: 1.15 }}>
                  {displayName}
                </div>
                <div style={{ fontSize: "9px", color: COLOR.text, lineHeight: 1.2 }}>My Workspace</div>
              </div>
            </div>
          </div>
        </header>

        {/* ── Scrollable Content ── */}
        <div style={{ flex: 1, padding: "26px 32px 38px", overflowY: "auto", overflowX: "hidden" }}>
          {notice && (
            <div
              style={{
                backgroundColor: "#f0fdf4",
                color: "#166534",
                padding: "12px 16px",
                borderRadius: "8px",
                fontSize: "13px",
                fontWeight: 600,
                marginBottom: "16px",
                border: "1px solid #bbf7d0",
              }}
            >
              {notice}
            </div>
          )}

          {/* Welcome + Time Range + Focus Timer */}
          {(activeMenu === "dashboard" || (activeMenu === "template" && templateView === "list") || activeMenu === "task") && (
            <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", width: "100%", marginBottom: "32px", gap: "24px" }}>
              <div>
                <h2 style={{ fontSize: "26px", fontWeight: 700, color: COLOR.text, margin: "0 0 6px", lineHeight: 1.15 }}>
                  Welcome, {displayName}
                </h2>
                <p style={{ fontSize: "12px", color: COLOR.text, margin: 0, lineHeight: 1.4 }}>
                  Here&apos;s what&apos;s happening with your workspace today.
                </p>
              </div>

              <div style={{ display: "flex", alignItems: "center", gap: "16px", flexWrap: "wrap" }}>
                {/* Toggle Buttons */}
                <div
                  style={{
                    display: "flex",
                    borderRadius: "3px",
                    backgroundColor: "#F1F1F1",
                    padding: "2px",
                    overflow: "hidden",
                  }}
                >
                  {activeMenu === "dashboard" ? (
                    (["Daily", "Weekly", "Monthly", "Yearly"] as const).map((t) => (
                      <button
                        key={t}
                        onClick={() => setTimeRange(t)}
                        style={{
                          width: "64px",
                          height: "32px",
                          fontSize: "11px",
                          fontWeight: timeRange === t ? 600 : 400,
                          fontFamily: "inherit",
                          color: COLOR.text,
                          backgroundColor: timeRange === t ? COLOR.surface : "transparent",
                          border: "none",
                          cursor: "pointer",
                          transition: "all 0.15s",
                        }}
                      >
                        {t}
                      </button>
                    ))
                  ) : (
                    (["All", "Public", "Private"] as const).map((t) => (
                      <button
                        key={t}
                        onClick={() => setTemplateFilter(t)}
                        style={{
                          width: "64px",
                          height: "32px",
                          fontSize: "11px",
                          fontWeight: templateFilter === t ? 600 : 400,
                          fontFamily: "inherit",
                          color: COLOR.text,
                          backgroundColor: templateFilter === t ? COLOR.surface : "transparent",
                          border: "none",
                          cursor: "pointer",
                          transition: "all 0.15s",
                        }}
                      >
                        {t}
                      </button>
                    ))
                  )}
                </div>

                {/* Start Focus Timer Button */}
                <button
                  onClick={() => {
                    if (activeMenu === "dashboard") {
                      void handleStartFocus(priorityTaskItems[0]?.id);
                    } else if (activeMenu === "task") {
                      setIsAddTaskModalOpen(true);
                    } else if (activeMenu === "template") {
                      setTemplateView("create");
                    }
                  }}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    gap: "8px",
                    minWidth: activeMenu === "dashboard" ? "158px" : "160px",
                    height: "34px",
                    padding: "0 16px",
                    borderRadius: "4px",
                    backgroundColor: COLOR.primary,
                    color: "#ffffff",
                    fontSize: "13px",
                    fontWeight: 600,
                    border: "none",
                    cursor: "pointer",
                    fontFamily: "inherit",
                    transition: "background-color 0.15s",
                  }}
                >
                  {activeMenu === "dashboard" ? <PlayIcon /> : <span style={{ fontSize: "16px", fontWeight: "bold", lineHeight: 1 }}>+</span>}
                  {activeMenu === "dashboard" ? "Start Focus Timer" : activeMenu === "task" ? "Task Baru" : "Template Baru"}
                </button>
              </div>
            </div>
          )}

          {/* ── Dashboard View ── */}
          {activeMenu === "dashboard" && (
            <>
              {/* ── Stats Cards ── */}
              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "repeat(4, minmax(0, 1fr))",
                  gap: "clamp(16px, 2vw, 32px)",
                  marginBottom: "32px",
                }}
              >
                {/* Task Completed */}
                <div className="hover-card" style={{ ...CARD_STYLE, width: "100%", minHeight: "100px", padding: "16px clamp(18px, 2.8vw, 48px)", boxSizing: "border-box" }}>
                  <div style={{ fontSize: "14px", color: COLOR.text, fontWeight: 600, marginBottom: "12px", lineHeight: 1.1 }}>Task Completed</div>
                  <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "10px" }}>
                    <CheckSquareIcon />
                    <span style={{ fontSize: "34px", fontWeight: 700, color: COLOR.text, lineHeight: 1 }}>{completedCount}</span>
                    <TrendBadge value="+10%" up />
                  </div>
                  <div style={{ fontSize: "12px", color: COLOR.muted, lineHeight: 1 }}>from last week</div>
                </div>

                {/* Upcoming Deadlines */}
                <div className="hover-card" style={{ ...CARD_STYLE, width: "100%", minHeight: "100px", padding: "16px clamp(18px, 2.8vw, 48px)", boxSizing: "border-box" }}>
                  <div style={{ fontSize: "14px", color: COLOR.text, fontWeight: 600, marginBottom: "12px", lineHeight: 1.1 }}>Upcoming Deadlines</div>
                  <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "10px" }}>
                    <ClockAlertIcon />
                    <span style={{ fontSize: "34px", fontWeight: 700, color: COLOR.text, lineHeight: 1 }}>{upcomingDeadlineCount}</span>
                    <TrendBadge value="+10%" up />
                  </div>
                  <div style={{ fontSize: "12px", color: COLOR.muted, lineHeight: 1 }}>from last week</div>
                </div>

                {/* Overdue Task */}
                <div className="hover-card" style={{ ...CARD_STYLE, width: "100%", minHeight: "100px", padding: "16px clamp(18px, 2.8vw, 48px)", boxSizing: "border-box" }}>
                  <div style={{ fontSize: "14px", color: COLOR.text, fontWeight: 600, marginBottom: "12px", lineHeight: 1.1 }}>Overdue Task</div>
                  <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "10px" }}>
                    <AlertTriangleIcon />
                    <span style={{ fontSize: "34px", fontWeight: 700, color: COLOR.text, lineHeight: 1 }}>{overdueCount}</span>
                    <TrendBadge value="-10%" up={false} />
                  </div>
                  <div style={{ fontSize: "12px", color: COLOR.muted, lineHeight: 1 }}>from last week</div>
                </div>

                {/* Energy */}
                <div className="hover-card" style={{ ...CARD_STYLE, width: "100%", minHeight: "100px", padding: "16px clamp(18px, 2.8vw, 48px)", boxSizing: "border-box" }}>
                  <div style={{ fontSize: "14px", color: COLOR.text, fontWeight: 600, marginBottom: "12px", lineHeight: 1.1 }}>Energy</div>
                  <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "10px" }}>
                    <BatteryIcon />
                    <span style={{ fontSize: "16px", fontWeight: 700, color: COLOR.text, lineHeight: 1 }}>{energyPercent}%</span>
                  </div>
                  {/* Progress bar */}
                  <div style={{ width: "100%", height: "6px", backgroundColor: "#E1E1E1", borderRadius: "999px", marginBottom: "7px" }}>
                    <div style={{ width: `${Math.min(energyPercent, 100)}%`, height: "100%", backgroundColor: COLOR.primary, borderRadius: "999px", transition: "width 0.5s" }} />
                  </div>
                  <div style={{ display: "flex", alignItems: "center", gap: "5px", fontSize: "11px", color: COLOR.primary, fontWeight: 600 }}>
                    <span style={{ width: "4px", height: "4px", borderRadius: "50%", backgroundColor: COLOR.primary, display: "inline-block" }} />
                    Ready for do Task
                  </div>
                </div>
              </div>

              {/* ── Priority Task + Productivity Chart Row ── */}
              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "minmax(340px, 1.2fr) minmax(0, 2.6fr)",
                  gridTemplateRows: "auto auto",
                  gap: "clamp(22px, 2.6vw, 40px)",
                  width: "100%",
                  marginBottom: "32px",
                  alignItems: "stretch",
                }}
              >
                {/* Priority Task Card */}
                <div className="hover-card" style={{ ...CARD_STYLE, width: "100%", minHeight: "230px", padding: "24px clamp(18px, 2.2vw, 32px)", boxSizing: "border-box", gridColumn: "1" }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "22px" }}>
                    <span style={{ fontSize: "16px", fontWeight: 700, color: COLOR.text, lineHeight: 1 }}>Priority Task</span>
                    <span style={{ fontSize: "12px", color: COLOR.mutedDark, cursor: "pointer", lineHeight: 1 }}>View all</span>
                  </div>

                  <div style={{ display: "flex", flexDirection: "column", gap: "24px" }}>
                    {priorityTaskItems.length === 0 ? (
                      <div
                        style={{
                          backgroundColor: "#F1F1F1",
                          borderRadius: "7px",
                          padding: "18px clamp(16px, 1.8vw, 24px)",
                          minHeight: "80px",
                          display: "flex",
                          alignItems: "center",
                          color: COLOR.mutedDark,
                          fontSize: "13px",
                          fontWeight: 600,
                        }}
                      >
                        Belum ada priority task
                      </div>
                    ) : priorityTaskItems.map((task) => (
                      <div
                        key={task.id ?? task.title}
                        style={{
                          backgroundColor: "#F1F1F1",
                          borderRadius: "7px",
                          padding: "18px clamp(16px, 1.8vw, 24px)",
                          minHeight: "80px",
                        }}
                      >
                        <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", marginBottom: "15px", gap: "14px" }}>
                          <span style={{ flex: 1, minWidth: 0, fontSize: "14px", fontWeight: 700, color: COLOR.text, lineHeight: 1.25, whiteSpace: "normal", wordBreak: "normal", overflowWrap: "break-word" }}>{task.title}</span>
                          <PriorityBadge level={task.level} />
                        </div>
                        <div style={{ display: "flex", alignItems: "center", gap: "18px", flexWrap: "wrap" }}>
                          <span style={{ display: "flex", alignItems: "center", gap: "5px", fontSize: "11px", color: COLOR.text, lineHeight: 1 }}>
                            <SubtaskIcon /> {task.subtask}
                          </span>
                          <span style={{ display: "flex", alignItems: "center", gap: "5px", fontSize: "11px", color: COLOR.text, lineHeight: 1 }}>
                            <CalendarSmIcon /> {task.date}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Productivity Overview Chart */}
                <div className="hover-card" style={{ ...CARD_STYLE, padding: "24px clamp(18px, 2vw, 32px)", gridColumn: "2", gridRow: "1 / span 2", minHeight: "386px", display: "flex", flexDirection: "column", boxSizing: "border-box" }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "30px" }}>
                    <span style={{ fontSize: "16px", fontWeight: 700, color: COLOR.text, lineHeight: 1 }}>Productivity Overview</span>
                    <div style={{ position: "relative" }}>
                      <button
                        onClick={() => setChartDropdownOpen(!chartDropdownOpen)}
                        style={{
                          display: "flex",
                          alignItems: "center",
                          gap: "5px",
                          height: "28px",
                          padding: "0 12px",
                          borderRadius: "4px",
                          border: `1px solid ${COLOR.border}`,
                          backgroundColor: COLOR.surface,
                          fontSize: "11px",
                          color: COLOR.text,
                          cursor: "pointer",
                          fontFamily: "inherit",
                          transition: "border-color 0.2s, box-shadow 0.2s",
                          borderColor: chartDropdownOpen ? COLOR.primary : COLOR.border,
                          boxShadow: chartDropdownOpen ? `0 0 0 2px ${COLOR.primaryPale}` : "none",
                        }}
                      >
                        <CalendarSmIcon />
                        {chartRange === "week" ? "This Week" : chartRange === "month" ? "This Month" : "This Year"}
                        <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"
                          style={{ transition: "transform 0.2s", transform: chartDropdownOpen ? "rotate(180deg)" : "rotate(0)" }}>
                          <polyline points="6 9 12 15 18 9" />
                        </svg>
                      </button>
                      {chartDropdownOpen && (
                        <div style={{
                          position: "absolute", top: "34px", right: 0, zIndex: 30,
                          backgroundColor: COLOR.surface, border: `1px solid ${COLOR.border}`,
                          borderRadius: "6px", boxShadow: "0 4px 16px rgba(0,0,0,0.1)",
                          overflow: "hidden", minWidth: "130px",
                          animation: "fadeSlideDown 0.18s ease",
                        }}>
                          {(["week", "month", "year"] as ChartRange[]).map((r) => (
                            <button
                              key={r}
                              onClick={() => { setChartRange(r); setChartDropdownOpen(false); }}
                              style={{
                                display: "flex", alignItems: "center", gap: "8px",
                                width: "100%", padding: "9px 14px", border: "none",
                                backgroundColor: chartRange === r ? COLOR.primaryPale : "transparent",
                                color: chartRange === r ? COLOR.primary : COLOR.text,
                                fontSize: "12px", fontWeight: chartRange === r ? 600 : 400,
                                cursor: "pointer", fontFamily: "inherit",
                                transition: "background-color 0.15s",
                              }}
                              onMouseEnter={(e) => { if (chartRange !== r) e.currentTarget.style.backgroundColor = "#f9f9f9"; }}
                              onMouseLeave={(e) => { if (chartRange !== r) e.currentTarget.style.backgroundColor = "transparent"; }}
                            >
                              {chartRange === r && <span style={{ width: "4px", height: "4px", borderRadius: "50%", backgroundColor: COLOR.primary }} />}
                              {r === "week" ? "This Week" : r === "month" ? "This Month" : "This Year"}
                            </button>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                  <div style={{ width: "100%", flex: 1, minHeight: "300px" }} key={chartRange}>
                    <ProductivityChart range={chartRange} />
                  </div>
                </div>

                {/* Dynamic Calendar */}
                {(() => {
                  const today = new Date();
                  const weekDates = getCalendarWeek(calendarRef);
                  const displayMonth = MONTH_NAMES[calendarRef.getMonth()];
                  const displayYear = calendarRef.getFullYear();

                  const deadlineDates = apiTasks
                    .filter((t) => t.deadline && t.status !== "done")
                    .map((t) => new Date(t.deadline!));

                  return (
                    <div className="hover-card" style={{ ...CARD_STYLE, width: "100%", padding: "12px 14px", minHeight: "86px", boxSizing: "border-box", gridColumn: "1" }}>
                      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "9px" }}>
                        <span style={{ fontSize: "13px", fontWeight: 700, color: COLOR.text }}>Calendar</span>
                        <div style={{ display: "flex", alignItems: "center", gap: "5px" }}>
                          <button
                            onClick={() => {
                              const prev = new Date(calendarRef);
                              prev.setDate(prev.getDate() - 7);
                              setCalendarRef(prev);
                            }}
                            style={{ ...buttonReset, color: COLOR.text, display: "flex", padding: "2px", borderRadius: "4px", transition: "background-color 0.15s" }}
                            onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = COLOR.panel; }}
                            onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = "transparent"; }}
                          >
                            <ChevronLeftIcon />
                          </button>
                          <button
                            onClick={() => setCalendarRef(new Date())}
                            style={{ ...buttonReset, fontSize: "11px", fontWeight: 600, color: COLOR.text, padding: "2px 4px", borderRadius: "4px", transition: "color 0.15s" }}
                            onMouseEnter={(e) => { e.currentTarget.style.color = COLOR.primary; }}
                            onMouseLeave={(e) => { e.currentTarget.style.color = COLOR.text; }}
                          >
                            {displayMonth} {displayYear}
                          </button>
                          <button
                            onClick={() => {
                              const next = new Date(calendarRef);
                              next.setDate(next.getDate() + 7);
                              setCalendarRef(next);
                            }}
                            style={{ ...buttonReset, color: COLOR.text, display: "flex", padding: "2px", borderRadius: "4px", transition: "background-color 0.15s" }}
                            onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = COLOR.panel; }}
                            onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = "transparent"; }}
                          >
                            <ChevronRightIcon />
                          </button>
                        </div>
                      </div>

                      <div style={{ display: "grid", gridTemplateColumns: "repeat(7, 1fr)", textAlign: "center", marginBottom: "5px" }}>
                        {DAY_HEADERS.map((d) => (
                          <span key={d} style={{ fontSize: "8px", fontWeight: 600, color: COLOR.muted }}>{d}</span>
                        ))}
                      </div>

                      <div style={{ display: "grid", gridTemplateColumns: "repeat(7, 1fr)", textAlign: "center", gap: "3px" }}>
                        {weekDates.map((dateObj, i) => {
                          const isToday = isSameDay(dateObj, today);
                          const hasDot = deadlineDates.some((dl) => isSameDay(dl, dateObj));
                          return (
                            <div key={i} style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: "2px" }}>
                              <div
                                style={{
                                  width: "19px",
                                  height: "19px",
                                  borderRadius: "50%",
                                  display: "flex",
                                  alignItems: "center",
                                  justifyContent: "center",
                                  fontSize: "10px",
                                  fontWeight: isToday ? 700 : 500,
                                  color: isToday ? COLOR.primary : COLOR.text,
                                  backgroundColor: isToday ? COLOR.primarySoft : "transparent",
                                  cursor: "pointer",
                                  transition: "all 0.15s",
                                }}
                              >
                                {dateObj.getDate()}
                              </div>
                              {hasDot && (
                                <div style={{ width: "4px", height: "4px", borderRadius: "50%", backgroundColor: COLOR.primary }} />
                              )}
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  );
                })()}
              </div>

              {/* ── Recent Tasks Table ── */}
              <div style={{ ...CARD_STYLE, width: "100%", padding: 0, marginBottom: "32px", overflow: "hidden" }}>
                <div style={{ height: "78px", display: "flex", alignItems: "center", justifyContent: "space-between", padding: "0 30px" }}>
                  <span style={{ fontSize: "16px", fontWeight: 700, color: COLOR.text, lineHeight: 1 }}>Recent Tasks</span>
                  <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                    {/* Search in table */}
                    <div style={{ position: "relative" }}>
                      <span style={{ position: "absolute", left: "14px", top: "50%", transform: "translateY(-50%)", color: COLOR.muted, display: "flex" }}>
                        <SearchIcon />
                      </span>
                      <input
                        type="text"
                        placeholder="Search task"
                        value={searchTask}
                        onChange={(e) => setSearchTask(e.target.value)}
                        style={{
                          width: "255px",
                          height: "28px",
                          borderRadius: "7px",
                          border: "none",
                          paddingLeft: "40px",
                          paddingRight: "14px",
                          fontSize: "12px",
                          color: COLOR.text,
                          backgroundColor: "#F1F1F1",
                          fontFamily: "inherit",
                          outline: "none",
                        }}
                      />
                    </div>
                    {/* Filter */}
                    <button
                      style={{
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        gap: "7px",
                        width: "78px",
                        height: "32px",
                        padding: 0,
                        borderRadius: "7px",
                        border: `1px solid ${COLOR.border}`,
                        background: COLOR.surface,
                        fontSize: "12px",
                        fontWeight: 600,
                        color: COLOR.text,
                        cursor: "pointer",
                        fontFamily: "inherit",
                      }}
                    >
                      <FilterIcon /> Filter
                    </button>
                  </div>
                </div>

                {/* Table */}
                <table style={{ width: "100%", borderCollapse: "collapse", tableLayout: "fixed" }}>
                  <colgroup>
                    <col style={{ width: "33%" }} />
                    <col style={{ width: "16%" }} />
                    <col style={{ width: "17%" }} />
                    <col style={{ width: "20%" }} />
                    <col style={{ width: "14%" }} />
                  </colgroup>
                  <thead>
                    <tr style={{ height: "52px", backgroundColor: COLOR.panel, borderTop: `1px solid ${COLOR.border}`, borderBottom: `1px solid ${COLOR.border}` }}>
                      {["TASK ↕", "TASK LEVEL ↕", "SUBTASK ↕", "DUE DATE ↕", "VIEW DETAIL ↕"].map((h) => (
                        <th
                          key={h}
                          style={{
                            fontSize: "11px",
                            fontWeight: 700,
                            color: COLOR.mutedDark,
                            textAlign: "center",
                            padding: "0 16px",
                            letterSpacing: "0.02em",
                            whiteSpace: "nowrap",
                            verticalAlign: "middle",
                          }}
                        >
                          {h}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {recentTaskItems.length === 0 ? (
                      <tr style={{ height: "78px", borderBottom: `1px solid ${COLOR.borderSoft}` }}>
                        <td
                          colSpan={5}
                          style={{
                            padding: "0 16px",
                            textAlign: "center",
                            verticalAlign: "middle",
                            fontSize: "13px",
                            fontWeight: 600,
                            color: COLOR.mutedDark,
                          }}
                        >
                          {emptyRecentTaskMessage}
                        </td>
                      </tr>
                    ) : recentTaskItems.map((task) => (
                      <tr key={task.id ?? task.title} style={{ height: "78px", borderBottom: `1px solid ${COLOR.borderSoft}` }}>
                        <td style={{ padding: "0 16px 0 clamp(58px, 4.5vw, 80px)", verticalAlign: "middle" }}>
                          <div style={{ display: "flex", alignItems: "center", gap: "46px", minWidth: 0 }}>
                          <input
                            type="checkbox"
                            checked={!!task.done}
                            disabled={isActionLoading}
                            onChange={(e) => {
                              void handleToggleTaskStatus(task, e.target.checked);
                            }}
                            style={{
                              width: "16px",
                              height: "16px",
                              accentColor: COLOR.primary,
                              borderRadius: "4px",
                              cursor: "pointer",
                              flexShrink: 0,
                            }}
                          />
                          <span style={{ fontSize: "13px", fontWeight: 700, color: COLOR.text, lineHeight: 1.2, overflowWrap: "break-word" }}>{task.title}</span>
                          </div>
                        </td>
                        <td style={{ padding: "0 16px", verticalAlign: "middle", textAlign: "center" }}>
                          <PriorityBadge level={task.level} />
                        </td>
                        <td style={{ padding: "0 16px", fontSize: "13px", color: COLOR.text, verticalAlign: "middle", textAlign: "center" }}>
                          {task.subtask}
                        </td>
                        <td style={{ padding: "0 16px", fontSize: "13px", color: COLOR.text, fontWeight: 700, verticalAlign: "middle", textAlign: "center" }}>
                          {task.date}
                        </td>
                        <td style={{ padding: "0 16px", verticalAlign: "middle" }}>
                          <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: "34px" }}>
                            <button style={{ ...buttonReset, color: COLOR.text, display: "flex" }}>
                              <MoreDotsIcon />
                            </button>
                            <button
                              disabled={isActionLoading}
                              onClick={() => {
                                void handleStartFocus(task.id);
                              }}
                              style={{
                                width: "91px",
                                height: "30px",
                                padding: 0,
                                borderRadius: "7px",
                                border: `1px solid ${COLOR.border}`,
                                backgroundColor: COLOR.surface,
                                fontSize: "11px",
                                fontWeight: 600,
                                color: COLOR.text,
                                cursor: "pointer",
                                fontFamily: "inherit",
                                whiteSpace: "nowrap",
                              }}
                            >
                              Mulai Fokus
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </>
          )}

          {/* ── Template / Task View ── */}
          {(activeMenu === "template" || activeMenu === "task") && templateView === "list" && (
            <div style={{ display: "flex", flexDirection: "column", gap: "24px" }}>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(3, minmax(0, 1fr))", gap: "clamp(28px, 3vw, 44px)", alignItems: "start" }}>
                {cardItems
                  .filter((item) => item.type.includes(templateFilter))
                  .map((item) => (
                    <div key={item.id} style={{
                      width: "100%",
                      minHeight: "258px",
                      backgroundColor: COLOR.surface,
                      borderRadius: "7px",
                      border: `1px solid ${COLOR.border}`,
                      padding: "24px",
                      boxSizing: "border-box",
                      display: "flex",
                      flexDirection: "column"
                    }}>
                      {/* Icon & Badge */}
                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "18px" }}>
                        <div style={{
                          width: "44px", height: "44px", borderRadius: "7px", backgroundColor: "#E5DEFF",
                          display: "flex", alignItems: "center", justifyContent: "center"
                        }}>
                          <CompassIcon />
                        </div>
                        <span style={{
                          display: "inline-block", fontSize: "11px", fontWeight: 700,
                          color: COLOR.mutedDark, backgroundColor: "#F1F1F1", borderRadius: "999px", padding: "4px 13px",
                        }}>
                          {item.level}
                        </span>
                      </div>

                      {/* Title & Desc */}
                      <h3 style={{ fontSize: "16px", fontWeight: 700, color: COLOR.text, marginBottom: "10px", marginTop: 0, lineHeight: 1.25 }}>
                        {item.title}
                      </h3>
                      <p style={{ fontSize: "14px", color: "#4B4B4B", lineHeight: 1.45, marginBottom: "22px" }}>
                        {item.desc}
                      </p>

                      {/* Tags */}
                      <div style={{ display: "flex", alignItems: "center", gap: "12px", marginBottom: "24px", flexWrap: "wrap" }}>
                        <span style={{
                          display: "flex", alignItems: "center", gap: "6px", fontSize: "12px", color: COLOR.text,
                          backgroundColor: "#F1F1F1", padding: "6px 10px", borderRadius: "5px", fontWeight: 500
                        }}>
                          <SubtaskIcon /> {item.subtasks} Subtasks
                        </span>
                        <span style={{
                          display: "flex", alignItems: "center", gap: "6px", fontSize: "12px", color: COLOR.text,
                          backgroundColor: "#F1F1F1", padding: "6px 10px", borderRadius: "5px", fontWeight: 500
                        }}>
                          <CalendarSmIcon /> No due date
                        </span>
                      </div>

                      {/* Buttons */}
                      <div style={{ display: "flex", alignItems: "center", gap: "12px", marginTop: "auto" }}>
                        <button
                          onClick={() => {
                            void handleUseCard(item);
                          }}
                          style={{
                            flex: 1, height: "40px", borderRadius: "7px", backgroundColor: COLOR.primary, color: "#ffffff",
                            fontSize: "13px", fontWeight: 600, border: "none", cursor: "pointer", fontFamily: "inherit",
                            transition: "background-color 0.15s"
                          }}
                          onMouseEnter={(e) => { (e.currentTarget as HTMLButtonElement).style.backgroundColor = COLOR.primaryHover; }}
                          onMouseLeave={(e) => { (e.currentTarget as HTMLButtonElement).style.backgroundColor = COLOR.primary; }}
                        >
                          {activeMenu === "task" ? "Mulai Fokus" : "Use Template"}
                        </button>
                        <button
                          onClick={() => {
                            if (activeMenu === "template") {
                              setSelectedTemplateId(item.id);
                              setTemplateView("detail");
                            }
                          }}
                          style={{
                          width: "40px", height: "40px", borderRadius: "7px", border: `1px solid ${COLOR.border}`, backgroundColor: COLOR.surface,
                          display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer", transition: "border-color 0.15s"
                        }}>
                          <EyeOutlineIcon />
                        </button>
                      </div>
                    </div>
                  ))}
              </div>

              {/* Pagination */}
              <div style={{ display: "none", justifyContent: "center", gap: "8px", marginTop: "16px" }}>
                {[1, 2, 3].map((page) => (
                  <button key={page} style={{
                    width: "28px", height: "28px", borderRadius: "4px",
                    border: page === 1 ? "1px solid #86efac" : "1px solid #e5e7eb",
                    backgroundColor: "#ffffff",
                    color: page === 1 ? "#16a34a" : "#6b7280",
                    fontSize: "12px", fontWeight: 500, cursor: "pointer", fontFamily: "inherit"
                  }}>
                    {page}
                  </button>
                ))}
              </div>

              {/* Tips Banner */}
              <div style={{
                display: "none",
                backgroundColor: "#dcfce7", color: "#166534", padding: "16px 24px",
                borderRadius: "8px", fontSize: "13px", fontWeight: 600,
                textAlign: "center", marginTop: "16px"
              }}>
                Tips : Use templates to speed up your task planning. You can still edit them after use.
              </div>
            </div>
          )}

          {/* ── Detail Template View ── */}
          {activeMenu === "template" && templateView === "detail" && selectedCard && (
            <div style={{ display: "flex", flexDirection: "column", gap: "24px" }}>
              <button
                onClick={() => {
                  setSelectedTemplateId(null);
                  setTemplateView("list");
                }}
                style={{
                  display: "flex", alignItems: "center", gap: "8px",
                  background: "none", border: "none", cursor: "pointer",
                  color: "#111827", fontSize: "14px", fontWeight: 500, fontFamily: "inherit", alignSelf: "flex-start"
                }}
              >
                <ArrowLeftIcon /> Back
              </button>

              <div style={{ display: "flex", gap: "24px", alignItems: "flex-start", flexWrap: "wrap" }}>
                {/* Left Side: Detail & Tasks */}
                <div style={{ flex: 1, minWidth: "400px", display: "flex", flexDirection: "column", gap: "24px" }}>

                  {/* Top Card */}
                  <div style={{
                    backgroundColor: "#ffffff", borderRadius: "12px", border: "1px solid #f0f0f0",
                    padding: "32px", position: "relative"
                  }}>
                    <button style={{
                      position: "absolute", top: "24px", right: "24px",
                      width: "36px", height: "36px", borderRadius: "8px",
                      border: "1px solid #e5e7eb", backgroundColor: "#ffffff",
                      display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer", color: "#111827"
                    }}>
                      <ShareIcon />
                    </button>

                    <div style={{ display: "flex", gap: "20px" }}>
                      <div style={{
                        width: "80px", height: "80px", borderRadius: "12px", backgroundColor: "#e0e7ff",
                        display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0
                      }}>
                        <UsersIcon />
                      </div>

                      <div style={{ flex: 1 }}>
                        <div style={{ display: "flex", alignItems: "center", gap: "12px", marginBottom: "16px" }}>
                          <h2 style={{ fontSize: "22px", fontWeight: 700, color: "#111827", margin: 0 }}>{selectedCard.title}</h2>
                          <span style={{ fontSize: "10px", fontWeight: 700, color: "#6b7280", backgroundColor: "#f3f4f6", padding: "4px 10px", borderRadius: "999px", letterSpacing: "0.04em" }}>{selectedCard.level}</span>
                          <span style={{ fontSize: "10px", fontWeight: 700, color: "#4f46e5", backgroundColor: "#e0e7ff", padding: "4px 10px", borderRadius: "999px", letterSpacing: "0.04em" }}>WORK</span>
                        </div>

                        <div style={{ display: "flex", alignItems: "center", gap: "12px", marginBottom: "20px" }}>
                          <span style={{ display: "flex", alignItems: "center", gap: "6px", fontSize: "12px", color: "#4b5563", backgroundColor: "#f3f4f6", padding: "6px 12px", borderRadius: "6px", fontWeight: 500 }}>
                            <SubtaskIcon /> {selectedCard.subtasks} Subtasks
                          </span>
                          <span style={{ display: "flex", alignItems: "center", gap: "6px", fontSize: "12px", color: "#4b5563", backgroundColor: "#f3f4f6", padding: "6px 12px", borderRadius: "6px", fontWeight: 500 }}>
                            <CalendarSmIcon /> No due date
                          </span>
                        </div>

                        <p style={{ fontSize: "13px", color: "#6b7280", lineHeight: 1.6, margin: 0, maxWidth: "340px" }}>
                          {selectedCard.desc}
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Tasks List Card */}
                  <div style={{ backgroundColor: "#ffffff", borderRadius: "12px", border: "1px solid #f0f0f0", padding: "24px" }}>
                    <h3 style={{ fontSize: "16px", fontWeight: 700, color: "#111827", margin: "0 0 24px" }}>Preview Daftar Task</h3>

                    <div style={{ display: "flex", flexDirection: "column", gap: "24px" }}>
                      {(selectedCard.previewItems?.map((item) => item.title) ?? ["Belum ada preview task"]).map((task, idx) => (
                        <div key={idx} style={{ display: "flex", alignItems: "center", gap: "16px" }}>
                          <div style={{
                            width: "24px", height: "24px", borderRadius: "50%", backgroundColor: "#16a34a",
                            color: "#ffffff", fontSize: "12px", fontWeight: 700,
                            display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0
                          }}>
                            {idx + 1}
                          </div>
                          <span style={{ fontSize: "14px", color: "#374151", fontWeight: 500 }}>{task}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Right Side: Template Information */}
                <div style={{ width: "320px", backgroundColor: "#ffffff", borderRadius: "12px", border: "1px solid #f0f0f0", padding: "24px" }}>
                  <h3 style={{ fontSize: "16px", fontWeight: 700, color: "#111827", margin: "0 0 32px" }}>Template Information</h3>

                  <div style={{ display: "flex", flexDirection: "column", gap: "32px", marginBottom: "40px" }}>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                      <div style={{ display: "flex", alignItems: "center", gap: "12px", color: "#111827" }}>
                        <WrenchIcon />
                        <span style={{ fontSize: "13px", fontWeight: 500, color: "#6b7280" }}>Made by</span>
                      </div>
                      <span style={{ fontSize: "12px", fontWeight: 700, color: "#111827" }}>BenToDo Official</span>
                    </div>

                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                      <div style={{ display: "flex", alignItems: "center", gap: "12px", color: "#111827" }}>
                        <MailIcon />
                        <span style={{ fontSize: "13px", fontWeight: 500, color: "#6b7280" }}>Category</span>
                      </div>
                      <span style={{ fontSize: "12px", fontWeight: 700, color: "#111827" }}>Work</span>
                    </div>

                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                      <div style={{ display: "flex", alignItems: "center", gap: "12px", color: "#111827" }}>
                        <UsersUpIcon />
                        <span style={{ fontSize: "13px", fontWeight: 500, color: "#6b7280" }}>Used</span>
                      </div>
                      <span style={{ fontSize: "12px", fontWeight: 700, color: "#111827" }}>{selectedCard.subtasks} tasks</span>
                    </div>

                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                      <div style={{ display: "flex", alignItems: "center", gap: "12px", color: "#111827" }}>
                        <DownloadSquareIcon />
                        <span style={{ fontSize: "13px", fontWeight: 500, color: "#6b7280" }}>Last updated</span>
                      </div>
                      <span style={{ fontSize: "12px", fontWeight: 700, color: "#111827" }}>Backend API</span>
                    </div>
                  </div>

                  <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
                    <button
                      onClick={() => {
                        void handleUseCard(selectedCard);
                      }}
                      style={{
                      width: "100%", height: "40px", borderRadius: "8px", backgroundColor: "#16a34a",
                      color: "#ffffff", fontSize: "13px", fontWeight: 600, border: "none",
                      cursor: "pointer", fontFamily: "inherit", transition: "background-color 0.15s"
                    }}
                      onMouseEnter={(e) => { (e.currentTarget as HTMLButtonElement).style.backgroundColor = "#15803d"; }}
                      onMouseLeave={(e) => { (e.currentTarget as HTMLButtonElement).style.backgroundColor = "#16a34a"; }}
                    >
                      Use Template
                    </button>
                    <button
                      onClick={() => setNotice("Fitur private custom template perlu endpoint backend tambahan.")}
                      style={{
                      width: "100%", height: "40px", borderRadius: "8px", backgroundColor: "#ffffff",
                      color: "#111827", fontSize: "13px", fontWeight: 600, border: "1px solid #e5e7eb",
                      cursor: "pointer", fontFamily: "inherit", transition: "background-color 0.15s"
                    }}
                      onMouseEnter={(e) => { (e.currentTarget as HTMLButtonElement).style.backgroundColor = "#f9fafb"; }}
                      onMouseLeave={(e) => { (e.currentTarget as HTMLButtonElement).style.backgroundColor = "#ffffff"; }}
                    >
                      Save Template to Private
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}


          {/* ── Create Template View ── */}
          {activeMenu === "template" && templateView === "create" && (
            <div style={{ display: "flex", flexDirection: "column", gap: "24px" }}>
              <button
                onClick={() => setTemplateView("list")}
                style={{
                  display: "flex", alignItems: "center", gap: "8px",
                  background: "none", border: "none", cursor: "pointer",
                  color: "#111827", fontSize: "14px", fontWeight: 500, fontFamily: "inherit", alignSelf: "flex-start"
                }}
              >
                <ArrowLeftIcon /> Back
              </button>

              <div style={{
                backgroundColor: "#ffffff", borderRadius: "12px", border: "1px solid #f0f0f0",
                padding: "32px", position: "relative", maxWidth: "800px"
              }}>
                <button style={{
                  position: "absolute", top: "24px", right: "24px",
                  width: "36px", height: "36px", borderRadius: "8px",
                  border: "1px solid #e5e7eb", backgroundColor: "#ffffff",
                  display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer", color: "#111827"
                }}>
                  <ShareIcon />
                </button>

                <h2 style={{ fontSize: "20px", fontWeight: 700, color: "#111827", margin: "0 0 8px" }}>Create Template</h2>
                <p style={{ fontSize: "13px", color: "#6b7280", margin: "0 0 32px" }}>Create a template according to your needs</p>

                <div style={{ display: "flex", flexDirection: "column", gap: "24px" }}>
                  {/* Name Task */}
                  <div>
                    <label style={{ display: "block", fontSize: "14px", fontWeight: 600, color: "#111827", marginBottom: "8px" }}>Name Task</label>
                    <input
                      type="text"
                      value={newTemplate.title}
                      onChange={(e) => setNewTemplate({ ...newTemplate, title: e.target.value })}
                      placeholder="Jadwal Kuliah"
                      style={{ width: "100%", height: "40px", borderRadius: "8px", border: "1px solid #e5e7eb", padding: "0 16px", fontSize: "13px", fontFamily: "inherit", outline: "none" }}
                    />
                  </div>

                  {/* Deskripsi */}
                  <div>
                    <label style={{ display: "block", fontSize: "14px", fontWeight: 600, color: "#111827", marginBottom: "8px" }}>Deskripsi</label>
                    <input
                      type="text"
                      value={newTemplate.desc}
                      onChange={(e) => setNewTemplate({ ...newTemplate, desc: e.target.value })}
                      placeholder="Checklist jadwal kuliah tahun 2024/2025"
                      style={{ width: "100%", height: "40px", borderRadius: "8px", border: "1px solid #e5e7eb", padding: "0 16px", fontSize: "13px", fontFamily: "inherit", outline: "none" }}
                    />
                  </div>

                  {/* Deadline */}
                  <div>
                    <label style={{ display: "block", fontSize: "14px", fontWeight: 600, color: "#111827", marginBottom: "8px" }}>Deadline (Opsional)</label>
                    <div style={{ position: "relative" }}>
                      <input
                        type="text"
                        value={newTemplate.deadline}
                        onChange={(e) => setNewTemplate({ ...newTemplate, deadline: e.target.value })}
                        placeholder="22 Juni 2025"
                        style={{ width: "100%", height: "40px", borderRadius: "8px", border: "1px solid #e5e7eb", padding: "0 16px", fontSize: "13px", fontFamily: "inherit", outline: "none" }}
                      />
                      <span style={{ position: "absolute", right: "12px", top: "50%", transform: "translateY(-50%)", color: "#6b7280", display: "flex" }}>
                        <CalendarLineIcon />
                      </span>
                    </div>
                  </div>

                  {/* Category */}
                  <div>
                    <label style={{ display: "block", fontSize: "14px", fontWeight: 600, color: "#111827", marginBottom: "12px" }}>Category</label>
                    <div style={{ display: "flex", gap: "8px", flexWrap: "wrap" }}>
                      {["WORK", "DAILY", "HEALTH", "SHOPPING", "FINANCE", "GOALS"].map((cat) => (
                        <button
                          key={cat}
                          onClick={() => setNewTemplate({ ...newTemplate, category: cat })}
                          style={{
                            padding: "6px 16px", borderRadius: "999px", fontSize: "10px", fontWeight: 700, letterSpacing: "0.04em", cursor: "pointer", border: "none",
                            backgroundColor: newTemplate.category === cat ? "#818cf8" : "#e0e7ff",
                            color: newTemplate.category === cat ? "#ffffff" : "#6366f1"
                          }}
                        >
                          {cat}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Priority */}
                  <div>
                    <label style={{ display: "block", fontSize: "14px", fontWeight: 600, color: "#111827", marginBottom: "12px" }}>Priority</label>
                    <div style={{ display: "flex", gap: "8px", flexWrap: "wrap" }}>
                      {["HIGH", "MIDLE", "LOW"].map((pri) => (
                        <button
                          key={pri}
                          onClick={() => setNewTemplate({ ...newTemplate, priority: pri })}
                          style={{
                            padding: "6px 16px", borderRadius: "999px", fontSize: "10px", fontWeight: 700, letterSpacing: "0.04em", cursor: "pointer", border: "none",
                            backgroundColor: newTemplate.priority === pri ? "#e5e7eb" : "#f3f4f6",
                            color: newTemplate.priority === pri ? "#111827" : "#4b5563"
                          }}
                        >
                          {pri}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Status */}
                  <div>
                    <label style={{ display: "block", fontSize: "14px", fontWeight: 600, color: "#111827", marginBottom: "12px" }}>Status</label>
                    <div style={{ display: "flex", gap: "8px", flexWrap: "wrap" }}>
                      {[
                        { id: "TO DO", bg: "#fecdd3", color: "#be123c", activeBg: "#fb7185", activeColor: "#fff" },
                        { id: "DONE", bg: "#bbf7d0", color: "#166534", activeBg: "#4ade80", activeColor: "#fff" },
                        { id: "IN PROGRES", bg: "#e0e7ff", color: "#4338ca", activeBg: "#818cf8", activeColor: "#fff" }
                      ].map((st) => (
                        <button
                          key={st.id}
                          onClick={() => setNewTemplate({ ...newTemplate, status: st.id })}
                          style={{
                            padding: "6px 16px", borderRadius: "999px", fontSize: "10px", fontWeight: 700, letterSpacing: "0.04em", cursor: "pointer", border: "none",
                            backgroundColor: newTemplate.status === st.id ? st.activeBg : st.bg,
                            color: newTemplate.status === st.id ? st.activeColor : st.color
                          }}
                        >
                          {st.id}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Label */}
                  <div>
                    <label style={{ display: "block", fontSize: "14px", fontWeight: 600, color: "#111827", marginBottom: "12px" }}>Label</label>
                    <div style={{ display: "flex", gap: "8px", flexWrap: "wrap" }}>
                      {[
                        { id: "PUBLIC", bg: "#e5e7eb", color: "#4b5563", activeBg: "#9ca3af", activeColor: "#fff" },
                        { id: "PRIVATE", bg: "#dcfce7", color: "#166534", activeBg: "#16a34a", activeColor: "#fff" }
                      ].map((lbl) => (
                        <button
                          key={lbl.id}
                          onClick={() => setNewTemplate({ ...newTemplate, label: lbl.id })}
                          style={{
                            padding: "6px 16px", borderRadius: "999px", fontSize: "10px", fontWeight: 700, letterSpacing: "0.04em", cursor: "pointer", border: "none",
                            backgroundColor: newTemplate.label === lbl.id ? lbl.activeBg : lbl.bg,
                            color: newTemplate.label === lbl.id ? lbl.activeColor : lbl.color
                          }}
                        >
                          {lbl.id}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Action Buttons */}
                  <div style={{ display: "flex", justifyContent: "flex-end", gap: "12px", marginTop: "16px" }}>
                    <button
                      onClick={() => setTemplateView("list")}
                      style={{
                        padding: "10px 32px", borderRadius: "8px", backgroundColor: "#ffffff",
                        color: "#111827", fontSize: "13px", fontWeight: 600, border: "1px solid #e5e7eb",
                        cursor: "pointer", fontFamily: "inherit"
                      }}
                    >
                      Cancel
                    </button>
                    <button
                      onClick={() => {
                        const newTask: ViewCard = {
                          id: templatesList.length + 1,
                          title: newTemplate.title || "Untitled",
                          desc: newTemplate.desc || "No description",
                          level: newTemplate.priority,
                          subtasks: 6,
                          type: newTemplate.label === "PRIVATE" ? ["All", "Private"] : ["All", "Public"]
                        };
                        setTemplatesList([newTask, ...templatesList]);
                        setTemplateView("success");
                      }}
                      style={{
                        padding: "10px 32px", borderRadius: "8px", backgroundColor: "#16a34a",
                        color: "#ffffff", fontSize: "13px", fontWeight: 600, border: "none",
                        cursor: "pointer", fontFamily: "inherit"
                      }}
                    >
                      Add Template
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* ── Success View ── */}
          {activeMenu === "template" && templateView === "success" && (
            <div style={{ display: "flex", flexDirection: "column", gap: "24px" }}>
              <button
                onClick={() => setTemplateView("list")}
                style={{
                  display: "flex", alignItems: "center", gap: "8px",
                  background: "none", border: "none", cursor: "pointer",
                  color: "#111827", fontSize: "14px", fontWeight: 500, fontFamily: "inherit", alignSelf: "flex-start"
                }}
              >
                <ArrowLeftIcon /> Back
              </button>

              <div style={{
                backgroundColor: "#ffffff", borderRadius: "12px", border: "1px solid #f0f0f0",
                padding: "48px 32px", maxWidth: "800px", display: "flex", flexDirection: "column", alignItems: "center"
              }}>
                <SuccessCheckIcon />

                <h2 style={{ fontSize: "22px", fontWeight: 700, color: "#111827", margin: "24px 0 8px" }}>Template berhasil ditambahkan!</h2>
                <p style={{ fontSize: "13px", color: "#6b7280", margin: "0 0 32px" }}>all tasks have been added to your task list</p>

                <div style={{
                  width: "100%", maxWidth: "600px", border: "1px solid #e5e7eb", borderRadius: "8px",
                  padding: "24px", position: "relative", backgroundColor: "#fafafa"
                }}>
                  <span style={{
                    position: "absolute", top: "24px", right: "24px",
                    fontSize: "10px", fontWeight: 700, color: "#be123c", backgroundColor: "#fecdd3",
                    padding: "4px 10px", borderRadius: "999px"
                  }}>
                    {newTemplate.status}
                  </span>

                  <div style={{ display: "flex", alignItems: "center", gap: "16px", marginBottom: "24px" }}>
                    <CheckCircleSolidIcon />
                    <span style={{ fontSize: "20px", fontWeight: 600, color: "#111827" }}>{newTemplate.title || "Untitled"}</span>
                  </div>

                  <div style={{ display: "flex", flexDirection: "column", gap: "16px", marginLeft: "40px" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                      <PlusCircleIcon />
                      <span style={{ fontSize: "13px", color: "#374151" }}>Subtask : 6 tasks added</span>
                    </div>
                    <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                      <PlusCircleIcon />
                      <span style={{ fontSize: "13px", color: "#374151" }}>Deadline : {newTemplate.deadline || "None"}</span>
                    </div>
                    <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                      <PlusCircleIcon />
                      <span style={{ fontSize: "13px", color: "#374151" }}>Prioritas : {newTemplate.priority}</span>
                    </div>
                    <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                      <PlusCircleIcon />
                      <span style={{ fontSize: "13px", color: "#374151", display: "flex", alignItems: "center", gap: "8px" }}>
                        Label : {newTemplate.label === "PRIVATE" ? "Private" : "Public"}
                        <span style={{ width: "12px", height: "12px", borderRadius: "50%", backgroundColor: newTemplate.label === "PRIVATE" ? "#16a34a" : "#9ca3af" }} />
                      </span>
                    </div>
                  </div>
                </div>

                <div style={{ width: "100%", maxWidth: "600px", display: "flex", justifyContent: "flex-end", marginTop: "32px" }}>
                  <button
                    onClick={() => {
                      setTemplateFilter(newTemplate.label === "PRIVATE" ? "Private" : "Public");
                      setTemplateView("list");
                    }}
                    style={{
                      padding: "10px 32px", borderRadius: "8px", backgroundColor: "#16a34a",
                      color: "#ffffff", fontSize: "13px", fontWeight: 600, border: "none",
                      cursor: "pointer", fontFamily: "inherit"
                    }}
                  >
                    See Template
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* ── Add Task Modal ── */}
          {isAddTaskModalOpen && (
            <div style={{
              position: "fixed", top: 0, left: 0, right: 0, bottom: 0,
              backgroundColor: "rgba(0, 0, 0, 0.4)",
              display: "flex", alignItems: "center", justifyContent: "center",
              zIndex: 100, padding: "20px"
            }}>
              <div style={{
                backgroundColor: "#ffffff", borderRadius: "12px",
                width: "100%", maxWidth: "600px", padding: "32px",
                position: "relative",
              }}>
                <button
                  onClick={() => setIsAddTaskModalOpen(false)}
                  style={{
                    position: "absolute", top: "24px", right: "24px",
                    background: "none", border: "none", cursor: "pointer",
                    color: COLOR.text, padding: "4px"
                  }}
                >
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <line x1="18" y1="6" x2="6" y2="18" />
                    <line x1="6" y1="6" x2="18" y2="18" />
                  </svg>
                </button>

                <h2 style={{ fontSize: "24px", fontWeight: 700, margin: "0 0 8px", color: COLOR.text }}>Add Task</h2>
                <p style={{ fontSize: "14px", color: COLOR.mutedDark, margin: "0 0 32px" }}>Buat tugas baru yang sesuai dengan keperluanmu.</p>

                <div style={{ marginBottom: "24px" }}>
                  <label style={{ display: "block", fontSize: "14px", fontWeight: 600, color: COLOR.text, marginBottom: "8px" }}>Nama Tugas</label>
                  <input
                    type="text"
                    value={addTaskTitle}
                    onChange={(e) => setAddTaskTitle(e.target.value)}
                    placeholder="Contoh : Membuat Power Point"
                    style={{
                      width: "100%", height: "48px", borderRadius: "8px", border: `1px solid ${COLOR.border}`,
                      padding: "0 16px", fontSize: "14px", color: COLOR.text, outline: "none",
                      boxSizing: "border-box"
                    }}
                  />
                </div>

                <div style={{ marginBottom: "24px" }}>
                  <label style={{ display: "block", fontSize: "14px", fontWeight: 600, color: COLOR.text, marginBottom: "8px" }}>Beban Energi</label>
                  <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: "12px" }}>
                    {[
                      { id: "Ringan", label: "Ringan", desc: "Tugas ringan", color: "#16a34a" },
                      { id: "Sedang", label: "Sedang", desc: "Tugas sedang", color: "#f59e0b" },
                      { id: "Berat", label: "Berat", desc: "Tugas berat", color: "#ef4444" },
                    ].map((item) => (
                      <div
                        key={item.id}
                        onClick={() => setAddTaskEnergy(item.id as EnergyWeight)}
                        style={{
                          border: `1px solid ${addTaskEnergy === item.id ? COLOR.primary : COLOR.border}`,
                          borderRadius: "8px", padding: "16px", cursor: "pointer",
                          backgroundColor: addTaskEnergy === item.id ? COLOR.primaryPale : "#ffffff",
                          display: "flex", alignItems: "center", gap: "12px",
                          transition: "all 0.2s"
                        }}
                      >
                        <div style={{ width: "16px", height: "16px", borderRadius: "50%", backgroundColor: item.color }} />
                        <div>
                          <div style={{ fontSize: "14px", fontWeight: 700, color: COLOR.text }}>{item.label}</div>
                          <div style={{ fontSize: "12px", color: COLOR.mutedDark }}>{item.desc}</div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                <div style={{ marginBottom: "32px" }}>
                  <label style={{ display: "block", fontSize: "14px", fontWeight: 600, color: COLOR.text, marginBottom: "8px" }}>Deadline (Opsional)</label>
                  <input
                    type="date"
                    value={addTaskDeadline}
                    onChange={(e) => setAddTaskDeadline(e.target.value)}
                    style={{
                      width: "100%", height: "48px", borderRadius: "8px", border: `1px solid ${COLOR.border}`,
                      padding: "0 16px", fontSize: "14px", color: COLOR.text, outline: "none",
                      boxSizing: "border-box", fontFamily: "inherit"
                    }}
                  />
                </div>

                <div style={{ display: "flex", justifyContent: "flex-end" }}>
                  <button
                    onClick={() => void handleCreateTask()}
                    disabled={isActionLoading}
                    style={{
                      height: "44px", padding: "0 32px", borderRadius: "8px",
                      backgroundColor: COLOR.primary, color: "#ffffff",
                      fontSize: "14px", fontWeight: 600, border: "none", cursor: "pointer",
                      opacity: isActionLoading ? 0.7 : 1, transition: "opacity 0.2s"
                    }}
                  >
                    {isActionLoading ? "Menyimpan..." : "Buat Task"}
                  </button>
                </div>

              </div>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
