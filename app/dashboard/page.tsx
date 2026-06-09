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
  deleteTask,
  createTask,
  createTemplate,
} from "../lib/api";
import CreateTemplateModal, { type CreateTemplateModalPayload } from "../components/CreateTemplateModal";
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

const CheckSquareIcon = ({ color = COLOR.text, size = 18 }: { color?: string, size?: number } = {}) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="9 11 12 14 22 4" />
    <path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11" />
  </svg>
);

const ClockAlertIcon = ({ color = COLOR.text, size = 18 }: { color?: string, size?: number } = {}) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="12" cy="12" r="10" />
    <polyline points="12 6 12 12 16 14" />
  </svg>
);

const AlertTriangleIcon = ({ color = COLOR.text, size = 18 }: { color?: string, size?: number } = {}) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
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

const MoreDotsIcon = ({ size = 14 }: { size?: number }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor">
    <circle cx="5" cy="12" r="2" />
    <circle cx="12" cy="12" r="2" />
    <circle cx="19" cy="12" r="2" />
  </svg>
);

const TrashIcon = ({ size = 13 }: { size?: number }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="3 6 5 6 21 6" />
    <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
  </svg>
);

const PenIcon = ({ size = 13 }: { size?: number }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M12 20h9" />
    <path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z" />
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
    labels: ["1 Jun", "2 Jun", "3 Jun", "4 Jun", "5 Jun", "6 Jun", "7 Jun"],
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
  { id: 1, title: "Weekly Design Sprint", desc: "A collaborative 5-day process for answering critical business questions through design, prototyping, and testing.", level: "OFFICIAL", subtasks: 2, type: ["Official"] },
  { id: 2, title: "Proyek Kelompok", desc: "A collaborative 5-day process for answering critical business questions through design, prototyping, and testing.", level: "MEDIUM", subtasks: 4, type: ["Private"] },
  { id: 3, title: "Rencana Belajar Semester", desc: "A collaborative 5-day process for answering critical business questions through design, prototyping, and testing.", level: "LOW", subtasks: 3, type: ["Public"] },
  { id: 4, title: "Menulis Skripsi", desc: "A collaborative 5-day process for answering critical business questions through design, prototyping, and testing.", level: "HIGH", subtasks: 4, type: ["Private"] },
  { id: 5, title: "Persiapan Ujian", desc: "A collaborative 5-day process for answering critical business questions through design, prototyping, and testing.", level: "OFFICIAL", subtasks: 2, type: ["Official"] },
  { id: 6, title: "Persiapan Presentasi", desc: "A collaborative 5-day process for answering critical business questions through design, prototyping, and testing.", level: "MEDIUM", subtasks: 5, type: ["Public"] },
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

type DetailTaskData = ViewTask & {
  description?: string;
};

type TemplateFilter = "Official" | "Public" | "Private";

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
  createdBy?: string;
  usage?: string;
  updatedAt?: string;
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
  desc: template.description || "Template siap pakai untuk mempercepat perencanaan tugas.",
  level: template.is_official ? "OFFICIAL" : (template.level ?? "Medium").toUpperCase(),
  subtasks: template.total_items,
  type: [template.is_official ? "Official" : template.visibility === "private" ? "Private" : "Public"],
  previewItems: template.preview_items ?? template.items ?? [],
  createdBy: template.created_by?.display_name || template.created_by?.email || (template.is_official ? "BenToDo Official" : "Unknown"),
  usage: `${(template.usage_count ?? 0).toLocaleString("en-US")} times`,
  updatedAt: template.updated_at ? formatDate(template.updated_at) : "-",
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
  const [templateFilter, setTemplateFilter] = useState<TemplateFilter>("Official");
  const [searchTask, setSearchTask] = useState("");
  const [activeMenu, setActiveMenu] = useState("dashboard");
  const [selectedTemplateId, setSelectedTemplateId] = useState<number | null>(null);
  const [templateView, setTemplateView] = useState<"list" | "detail" | "create" | "success">("list");
  const [selectedTaskId, setSelectedTaskId] = useState<string | null>(null);
  const [taskDetailCopied, setTaskDetailCopied] = useState(false);
  const [templatesList, setTemplatesList] = useState<ViewCard[]>(templatesData);
  const [apiTasks, setApiTasks] = useState<Task[]>([]);
  const [displayName, setDisplayName] = useState("User");
  const [energyData, setEnergyData] = useState({ current: 0, max: 240, percent: 0, isCritical: false });
  const [isActionLoading, setIsActionLoading] = useState(false);
  const [notice, setNotice] = useState<string | null>(null);
  const [deadlineStats, setDeadlineStats] = useState({ upcoming: 0, overdue: 0 });
  const [chartRange, setChartRange] = useState<ChartRange>("week");
  const [chartDropdownOpen, setChartDropdownOpen] = useState(false);
  const [calendarRef, setCalendarRef] = useState(() => new Date());
  const [showNotifications, setShowNotifications] = useState(false);

  const [isAddTaskModalOpen, setIsAddTaskModalOpen] = useState(false);
  const [addTaskTitle, setAddTaskTitle] = useState("");
  const [addTaskEnergy, setAddTaskEnergy] = useState<EnergyWeight>("Ringan");
  const [addTaskDeadline, setAddTaskDeadline] = useState("");
  const [addTaskDesc, setAddTaskDesc] = useState("");

  const [isEditTaskModalOpen, setIsEditTaskModalOpen] = useState(false);
  const [editTaskId, setEditTaskId] = useState<string | null>(null);

  const [isDetailTaskModalOpen, setIsDetailTaskModalOpen] = useState(false);
  const [detailTaskData, setDetailTaskData] = useState<DetailTaskData | null>(null);

  const [isDeleteTaskModalOpen, setIsDeleteTaskModalOpen] = useState(false);
  const [deleteTaskId, setDeleteTaskId] = useState<string | null>(null);

  const [openTaskMenuId, setOpenTaskMenuId] = useState<string | null>(null);

  const [addTaskSubtasks, setAddTaskSubtasks] = useState<{ text: string; done: boolean }[]>([]);
  const [newSubtaskText, setNewSubtaskText] = useState("");
  const [localTaskMeta, setLocalTaskMeta] = useState<Record<string, { description: string; subtasks: { text: string; done: boolean }[] }>>({});

  const [templateFormError, setTemplateFormError] = useState<string | null>(null);
  const [createdTemplateSummary, setCreatedTemplateSummary] = useState<{
    title: string;
    label: TemplateFilter;
    taskCount: number;
  } | null>(null);

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
      setEnergyData({
        current: energyResult.data.current_energy,
        max: energyResult.data.max_energy,
        percent: Math.round((energyResult.data.current_energy / energyResult.data.max_energy) * 100),
        isCritical: energyResult.data.is_critical_energy,
      });

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

  const handleCreateCustomTemplate = async (payload: CreateTemplateModalPayload) => {
    setIsActionLoading(true);
    setTemplateFormError(null);

    try {
      await createTemplate({
        name: payload.name,
        description: payload.description,
        visibility: payload.visibility ?? "private",
        level: payload.level,
        items: payload.items,
      });

      await loadDashboardData(true);
      setCreatedTemplateSummary({
        title: payload.name,
        label: payload.visibility === "public" ? "Public" : "Private",
        taskCount: payload.items.length,
      });
      setTemplateView("success");
    } catch (error) {
      setTemplateFormError(error instanceof Error ? error.message : "Gagal membuat template.");
    } finally {
      setIsActionLoading(false);
    }
  };

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
    } catch (error) {
      setNotice(error instanceof Error ? error.message : "Gagal memulai fokus.");
    } finally {
      setIsActionLoading(false);
      router.push("/focus");
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
      const result = await createTask({
        title: addTaskTitle,
        energy_weight: addTaskEnergy,
        deadline: addTaskDeadline || null,
      });
      // Store description and subtasks locally
      if (result?.data?.id) {
        setLocalTaskMeta(prev => ({
          ...prev,
          [result.data.id]: {
            description: addTaskDesc,
            subtasks: addTaskSubtasks,
          },
        }));
      }
      setNotice("Tugas berhasil ditambahkan.");
      setIsAddTaskModalOpen(false);
      setAddTaskTitle("");
      setAddTaskEnergy("Ringan");
      setAddTaskDeadline("");
      setAddTaskDesc("");
      setAddTaskSubtasks([]);
      setNewSubtaskText("");
      await loadDashboardData(true);
    } catch (error) {
      setNotice(error instanceof Error ? error.message : "Gagal menambahkan tugas.");
    } finally {
      setIsActionLoading(false);
    }
  };

  const handleSaveEdit = async () => {
    if (!editTaskId || !addTaskTitle.trim()) {
      setNotice("Nama tugas tidak boleh kosong.");
      return;
    }
    setIsActionLoading(true);
    try {
      await updateTask(editTaskId, {
        title: addTaskTitle,
        energy_weight: addTaskEnergy,
        deadline: addTaskDeadline || null,
      });
      setLocalTaskMeta(prev => ({
        ...prev,
        [editTaskId]: {
          description: addTaskDesc,
          subtasks: prev[editTaskId]?.subtasks || [],
        },
      }));
      setNotice("Tugas berhasil diperbarui.");
      setIsEditTaskModalOpen(false);
      setEditTaskId(null);
      await loadDashboardData(true);
    } catch (error) {
      setNotice(error instanceof Error ? error.message : "Gagal memperbarui tugas.");
    } finally {
      setIsActionLoading(false);
    }
  };

  const handleDeleteTask = async () => {
    if (!deleteTaskId) return;
    setIsActionLoading(true);
    try {
      await deleteTask(deleteTaskId);
      setNotice("Tugas berhasil dihapus.");
      setIsDeleteTaskModalOpen(false);
      setDeleteTaskId(null);
      await loadDashboardData(true);
    } catch (error) {
      setNotice(error instanceof Error ? error.message : "Gagal menghapus tugas.");
    } finally {
      setIsActionLoading(false);
    }
  };

  const handleCompleteTask = async (taskId: string) => {
    setIsActionLoading(true);
    try {
      await updateTask(taskId, { status: "done" });
      setNotice("Tugas berhasil diselesaikan.");
      await loadDashboardData(true);
    } catch (error) {
      setNotice(error instanceof Error ? error.message : "Gagal menyelesaikan tugas.");
    } finally {
      setIsActionLoading(false);
    }
  };

  return (
    <div style={{ display: "flex", minHeight: "100vh", backgroundColor: COLOR.surface, color: COLOR.text, fontFamily: "inherit" }}>
      <style>{`
        @keyframes dashRingBell {
          0% { transform: rotate(0); }
          10% { transform: rotate(15deg); }
          20% { transform: rotate(-10deg); }
          30% { transform: rotate(5deg); }
          40% { transform: rotate(-5deg); }
          50% { transform: rotate(2deg); }
          60% { transform: rotate(0); }
          100% { transform: rotate(0); }
        }
        .dash-bell-hover:hover svg {
          animation: dashRingBell 0.5s ease-in-out;
          transform-origin: top center;
        }
        @keyframes dashNotifPop {
          from { opacity: 0; transform: translateY(10px) scale(0.95); }
          to { opacity: 1; transform: translateY(0) scale(1); }
        }
      `}</style>

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
              activeMenu === "task" ? (selectedTaskId ? "Detail Task" : "Task") : "Template"}
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
            <div style={{ position: "relative" }}>
              <button
                className="dash-bell-hover"
                onClick={() => setShowNotifications(!showNotifications)}
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  width: "32px",
                  height: "32px",
                  borderRadius: "6px",
                  border: `1px solid ${showNotifications ? COLOR.primary : COLOR.border}`,
                  background: showNotifications ? "#f0fdf4" : "none",
                  color: showNotifications ? COLOR.primary : COLOR.mutedDark,
                  cursor: "pointer",
                  transition: "all 0.15s",
                }}
                onMouseEnter={(e) => { e.currentTarget.style.borderColor = COLOR.primary; e.currentTarget.style.color = COLOR.primary; }}
                onMouseLeave={(e) => {
                  if (!showNotifications) {
                    e.currentTarget.style.borderColor = COLOR.border;
                    e.currentTarget.style.color = COLOR.mutedDark;
                  }
                }}
              >
                <BellIcon />
              </button>

              {/* Notification Pop-up */}
              {showNotifications && (
                <div
                  style={{
                    position: "absolute",
                    top: "42px",
                    right: 0,
                    width: "320px",
                    backgroundColor: COLOR.surface,
                    borderRadius: "12px",
                    boxShadow: "0 10px 40px rgba(0,0,0,0.12)",
                    border: `1px solid ${COLOR.borderSoft}`,
                    zIndex: 100,
                    animation: "dashNotifPop 0.2s ease-out forwards",
                    overflow: "hidden",
                  }}
                >
                  <div style={{ padding: "16px", borderBottom: `1px solid ${COLOR.borderSoft}`, backgroundColor: "#f9fafb" }}>
                    <h3 style={{ margin: 0, fontSize: "14px", fontWeight: 600, color: COLOR.text }}>Notifications & History</h3>
                  </div>
                  <div style={{ display: "flex", flexDirection: "column", maxHeight: "300px", overflowY: "auto" }}>
                    <div style={{ padding: "16px", borderBottom: `1px solid ${COLOR.borderSoft}` }}>
                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "4px" }}>
                        <div style={{ fontSize: "13px", fontWeight: 600, color: COLOR.text }}>Task Completed</div>
                        <div style={{ width: "8px", height: "8px", backgroundColor: COLOR.primary, borderRadius: "50%", flexShrink: 0, marginTop: "4px" }} />
                      </div>
                      <div style={{ fontSize: "12px", color: COLOR.muted, lineHeight: 1.4 }}>You completed &ldquo;Design Homepage UI&rdquo;. Great job!</div>
                      <div style={{ fontSize: "11px", color: "#9ca3af", marginTop: "8px" }}>10 mins ago</div>
                    </div>
                    <div style={{ padding: "16px", borderBottom: `1px solid ${COLOR.borderSoft}`, backgroundColor: "#ffffff" }}>
                      <div style={{ fontSize: "13px", fontWeight: 500, color: COLOR.text, marginBottom: "4px" }}>New Task Added</div>
                      <div style={{ fontSize: "12px", color: COLOR.muted, lineHeight: 1.4 }}>&ldquo;Submit Invoice&rdquo; has been added to your dashboard.</div>
                      <div style={{ fontSize: "11px", color: "#9ca3af", marginTop: "8px" }}>1 hour ago</div>
                    </div>
                    <div style={{ padding: "16px", backgroundColor: "#ffffff" }}>
                      <div style={{ fontSize: "13px", fontWeight: 500, color: COLOR.text, marginBottom: "4px" }}>Template Created</div>
                      <div style={{ fontSize: "12px", color: COLOR.muted, lineHeight: 1.4 }}>&ldquo;Weekly Report&rdquo; template was successfully saved.</div>
                      <div style={{ fontSize: "11px", color: "#9ca3af", marginTop: "8px" }}>Yesterday</div>
                    </div>
                  </div>
                </div>
              )}
            </div>

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
          {(activeMenu === "dashboard" || (activeMenu === "template" && templateView === "list") || (activeMenu === "task" && !selectedTaskId)) && (
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
                    (["Official", "Public", "Private"] as const).map((t) => (
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
                <div style={{ ...CARD_STYLE, width: "100%", minHeight: "136px", padding: "20px clamp(18px, 2.8vw, 32px)", boxSizing: "border-box", display: "flex", flexDirection: "column", justifyContent: "space-between" }}>
                  <div style={{ fontSize: "14px", color: COLOR.text, fontWeight: 600, lineHeight: 1.1 }}>Task Completed</div>
                  <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                    <div style={{ width: "42px", height: "42px", borderRadius: "10px", backgroundColor: "#e0f2fe", color: "#0284c7", display: "flex", alignItems: "center", justifyContent: "center" }}>
                      <CheckSquareIcon color="currentColor" size={24} />
                    </div>
                    <span style={{ fontSize: "34px", fontWeight: 700, color: COLOR.text, lineHeight: 1 }}>{completedCount}</span>
                    <TrendBadge value="+10%" up />
                  </div>
                  <div style={{ fontSize: "12px", color: COLOR.muted, lineHeight: 1 }}>from last week</div>
                </div>

                {/* Upcoming Deadlines */}
                <div style={{ ...CARD_STYLE, width: "100%", minHeight: "136px", padding: "20px clamp(18px, 2.8vw, 32px)", boxSizing: "border-box", display: "flex", flexDirection: "column", justifyContent: "space-between" }}>
                  <div style={{ fontSize: "14px", color: COLOR.text, fontWeight: 600, lineHeight: 1.1 }}>Upcoming Deadlines</div>
                  <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                    <div style={{ width: "42px", height: "42px", borderRadius: "10px", backgroundColor: "#fef08a", color: "#a16207", display: "flex", alignItems: "center", justifyContent: "center" }}>
                      <ClockAlertIcon color="currentColor" size={24} />
                    </div>
                    <span style={{ fontSize: "34px", fontWeight: 700, color: COLOR.text, lineHeight: 1 }}>{upcomingDeadlineCount}</span>
                    <TrendBadge value="+10%" up />
                  </div>
                  <div style={{ fontSize: "12px", color: COLOR.muted, lineHeight: 1 }}>from last week</div>
                </div>

                {/* Overdue Task */}
                <div style={{ ...CARD_STYLE, width: "100%", minHeight: "136px", padding: "20px clamp(18px, 2.8vw, 32px)", boxSizing: "border-box", display: "flex", flexDirection: "column", justifyContent: "space-between" }}>
                  <div style={{ fontSize: "14px", color: COLOR.text, fontWeight: 600, lineHeight: 1.1 }}>Overdue Task</div>
                  <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                    <div style={{ width: "42px", height: "42px", borderRadius: "10px", backgroundColor: "#fee2e2", color: "#dc2626", display: "flex", alignItems: "center", justifyContent: "center" }}>
                      <AlertTriangleIcon color="currentColor" size={24} />
                    </div>
                    <span style={{ fontSize: "34px", fontWeight: 700, color: COLOR.text, lineHeight: 1 }}>{overdueCount}</span>
                    <TrendBadge value="-10%" up={false} />
                  </div>
                  <div style={{ fontSize: "12px", color: COLOR.muted, lineHeight: 1 }}>from last week</div>
                </div>

                {/* Energy */}
                <div style={{ ...CARD_STYLE, width: "100%", minHeight: "136px", padding: "20px clamp(18px, 2.8vw, 32px)", boxSizing: "border-box", display: "flex", flexDirection: "column", justifyContent: "space-between" }}>
                  <div style={{ fontSize: "14px", color: COLOR.text, fontWeight: 600, lineHeight: 1.1 }}>Energy</div>

                  <div style={{ display: "flex", alignItems: "center", gap: "16px", marginTop: "4px" }}>
                    {/* Circle Progress */}
                    <div style={{ position: "relative", width: "48px", height: "48px", flexShrink: 0 }}>
                      <svg viewBox="0 0 36 36" style={{ width: "100%", height: "100%", transform: "rotate(-90deg)" }}>
                        <path
                          style={{ fill: "none", stroke: "#E8E8E8", strokeWidth: 4 }}
                          d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                        />
                        <path
                          style={{ fill: "none", stroke: "#111827", strokeWidth: 4, strokeDasharray: `${energyData.percent}, 100`, transition: "stroke-dasharray 0.3s ease" }}
                          d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                        />
                      </svg>
                      <div style={{ position: "absolute", top: 0, left: 0, width: "100%", height: "100%", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "13px", fontWeight: 700, color: COLOR.text }}>
                        {energyData.percent}%
                      </div>
                    </div>

                    {/* Linear Progress and Label */}
                    <div style={{ flex: 1, display: "flex", flexDirection: "column", gap: "8px" }}>
                      <div style={{ width: "100%", height: "8px", backgroundColor: "#E8E8E8", borderRadius: "999px", overflow: "hidden" }}>
                        <div style={{ width: `${energyData.percent}%`, height: "100%", backgroundColor: energyData.isCritical ? COLOR.danger : COLOR.primary, borderRadius: "999px", transition: "width 0.3s ease, background-color 0.3s ease" }} />
                      </div>
                      <div style={{ fontSize: "11px", color: COLOR.mutedDark, fontWeight: 500 }}>Capacity Energy</div>
                    </div>
                  </div>

                  <div style={{ display: "flex", alignItems: "center", gap: "6px", fontSize: "12px", color: energyData.isCritical ? COLOR.danger : COLOR.primary, fontWeight: 600, marginTop: "8px" }}>
                    <div style={{ width: "4px", height: "4px", borderRadius: "50%", backgroundColor: energyData.isCritical ? COLOR.danger : COLOR.primary }} />
                    {energyData.current === 0 ? "Depleted" : energyData.isCritical ? "Critical Energy" : "Ready for do Task"}
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
                <div style={{ ...CARD_STYLE, width: "100%", minHeight: "230px", padding: "24px clamp(18px, 2.2vw, 32px)", boxSizing: "border-box", gridColumn: "1" }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "22px" }}>
                    <span style={{ fontSize: "16px", fontWeight: 700, color: COLOR.text, lineHeight: 1 }}>Priority Task</span>
                    <span onClick={() => setActiveMenu("task")} style={{ fontSize: "12px", fontWeight: 600, color: "#3b82f6", cursor: "pointer", lineHeight: 1 }}>View all</span>
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
                            <CalendarSmIcon /> {task.date}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Productivity Overview Chart */}
                <div style={{ ...CARD_STYLE, padding: "24px clamp(18px, 2vw, 32px)", gridColumn: "2", gridRow: "1 / span 2", minHeight: "386px", display: "flex", flexDirection: "column", boxSizing: "border-box" }}>
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
                    <div style={{ ...CARD_STYLE, width: "100%", padding: "12px 14px", minHeight: "86px", boxSizing: "border-box", gridColumn: "1" }}>
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
                                onClick={() => {
                                  const formatted = formatDate(dateObj.toISOString());
                                  setSearchTask(searchTask === formatted ? "" : formatted);
                                  document.getElementById("recent-tasks-section")?.scrollIntoView({ behavior: "smooth", block: "start" });
                                }}
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
              <div id="recent-tasks-section" style={{ ...CARD_STYLE, width: "100%", padding: 0, marginBottom: "32px", overflow: "hidden" }}>
                <div style={{ height: "64px", display: "flex", alignItems: "center", justifyContent: "space-between", padding: "0 30px" }}>
                  <span style={{ fontSize: "16px", fontWeight: 700, color: COLOR.text, lineHeight: 1 }}>Recent Tasks</span>
                  <button style={{ background: "none", border: "none", color: "#3b82f6", fontSize: "14px", fontWeight: 600, cursor: "pointer", padding: 0 }}>View All</button>
                </div>

                {/* Table */}
                <table style={{ width: "100%", borderCollapse: "collapse", tableLayout: "fixed" }}>
                  <colgroup>
                    <col style={{ width: "35%" }} />
                    <col style={{ width: "20%" }} />
                    <col style={{ width: "20%" }} />
                    <col style={{ width: "25%" }} />
                  </colgroup>
                  <thead>
                    <tr style={{ height: "42px", backgroundColor: "#f9fafb", borderTop: `1px solid ${COLOR.border}`, borderBottom: `1px solid ${COLOR.border}` }}>
                      {["TASK", "TASK LEVEL", "DUE DATE", "ACTIONS"].map((h, i) => (
                        <th
                          key={h}
                          style={{
                            fontSize: "11px",
                            fontWeight: 600,
                            color: COLOR.mutedDark,
                            textAlign: i === 0 ? "left" : "center",
                            padding: i === 0 ? "0 12px 0 clamp(44px, 3.5vw, 60px)" : "0 12px",
                            letterSpacing: "0.04em",
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
                      <tr style={{ height: "56px", borderBottom: `1px solid ${COLOR.borderSoft}` }}>
                        <td
                          colSpan={4}
                          style={{
                            padding: "0 12px",
                            textAlign: "center",
                            verticalAlign: "middle",
                            fontSize: "12px",
                            fontWeight: 600,
                            color: COLOR.mutedDark,
                          }}
                        >
                          {emptyRecentTaskMessage}
                        </td>
                      </tr>
                    ) : recentTaskItems.map((task) => (
                      <tr key={task.id ?? task.title} style={{ height: "56px", borderBottom: `1px solid ${COLOR.borderSoft}` }}>
                        <td style={{ padding: "0 12px 0 clamp(44px, 3.5vw, 60px)", verticalAlign: "middle" }}>
                          <div style={{ display: "flex", alignItems: "center", gap: "14px", minWidth: 0 }}>
                            <input
                              type="checkbox"
                              checked={!!task.done}
                              disabled={isActionLoading}
                              onChange={(e) => {
                                void handleToggleTaskStatus(task, e.target.checked);
                              }}
                              style={{
                                width: "18px",
                                height: "18px",
                                accentColor: COLOR.primary,
                                borderRadius: "3px",
                                cursor: "pointer",
                                flexShrink: 0,
                              }}
                            />
                            <span style={{ fontSize: "13px", fontWeight: 600, color: COLOR.text, lineHeight: 1.3, overflowWrap: "break-word" }}>{task.title}</span>
                          </div>
                        </td>
                        <td style={{ padding: "0 12px", verticalAlign: "middle", textAlign: "center" }}>
                          <PriorityBadge level={task.level} />
                        </td>
                        <td style={{ padding: "0 12px", fontSize: "12px", color: COLOR.text, fontWeight: 500, verticalAlign: "middle", textAlign: "center" }}>
                          {task.date}
                        </td>
                        <td style={{ padding: "0 12px", verticalAlign: "middle", position: "relative" }}>
                          <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: "8px" }}>
                            {/* 3-dot menu */}
                            <button
                              onClick={() => {
                                setOpenTaskMenuId(openTaskMenuId === task.id ? null : (task.id ?? null));
                              }}
                              style={{ ...buttonReset, color: COLOR.mutedDark, display: "flex", padding: "4px", borderRadius: "4px", transition: "background-color 0.15s" }}
                              onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = "#f3f4f6"; }}
                              onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = "transparent"; }}
                            >
                              <MoreDotsIcon />
                            </button>

                            {/* Dropdown menu for 3-dot */}
                            {openTaskMenuId === task.id && (
                              <div style={{
                                position: "absolute",
                                top: "100%", right: "60px",
                                marginTop: "4px",
                                backgroundColor: "#ffffff",
                                borderRadius: "8px",
                                boxShadow: "0 4px 20px rgba(0,0,0,0.15)",
                                border: `1px solid ${COLOR.borderSoft}`,
                                zIndex: 100,
                                width: "150px",
                                display: "flex",
                                flexDirection: "column",
                                padding: "6px",
                              }}>
                                <button onClick={() => {
                                  setEditTaskId(task.id ?? null);
                                  setAddTaskTitle(task.title);
                                  setAddTaskDesc(localTaskMeta[task.id ?? ""]?.description || "");
                                  setAddTaskDeadline(task.date === "No due date" ? "" : task.date);
                                  setAddTaskEnergy(task.level === "LOW" ? "Ringan" : task.level === "MEDIUM" ? "Sedang" : "Berat");
                                  setIsEditTaskModalOpen(true);
                                  setOpenTaskMenuId(null);
                                }} style={{ ...buttonReset, display: "flex", alignItems: "center", gap: "10px", padding: "8px", borderRadius: "5px", fontSize: "12px", fontWeight: 600, color: COLOR.text, width: "100%", transition: "background-color 0.1s" }}
                                  onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = "#f9fafb"; }}
                                  onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = "transparent"; }}
                                >
                                  <div style={{ width: "22px", height: "22px", borderRadius: "5px", backgroundColor: "#eff6ff", color: "#3b82f6", display: "flex", alignItems: "center", justifyContent: "center" }}><PenIcon size={11} /></div>
                                  Edit Task
                                </button>
                                <button onClick={() => {
                                  setDetailTaskData({ ...task, description: localTaskMeta[task.id ?? ""]?.description || "" });
                                  setIsDetailTaskModalOpen(true);
                                  setOpenTaskMenuId(null);
                                }} style={{ ...buttonReset, display: "flex", alignItems: "center", gap: "10px", padding: "8px", borderRadius: "5px", fontSize: "12px", fontWeight: 600, color: COLOR.text, width: "100%", transition: "background-color 0.1s" }}
                                  onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = "#f9fafb"; }}
                                  onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = "transparent"; }}
                                >
                                  <div style={{ width: "22px", height: "22px", borderRadius: "5px", backgroundColor: "#f3f4f6", color: "#111827", display: "flex", alignItems: "center", justifyContent: "center" }}>
                                    <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path><polyline points="14 2 14 8 20 8"></polyline></svg>
                                  </div>
                                  Detail Task
                                </button>
                                <button onClick={() => {
                                  void handleCompleteTask(task.id ?? "");
                                  setOpenTaskMenuId(null);
                                }} style={{ ...buttonReset, display: "flex", alignItems: "center", gap: "10px", padding: "8px", borderRadius: "5px", fontSize: "12px", fontWeight: 600, color: COLOR.text, width: "100%", transition: "background-color 0.1s" }}
                                  onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = "#f9fafb"; }}
                                  onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = "transparent"; }}
                                >
                                  <div style={{ width: "22px", height: "22px", borderRadius: "5px", backgroundColor: "#dcfce7", color: "#16a34a", display: "flex", alignItems: "center", justifyContent: "center" }}><CheckSquareIcon size={11} color="currentColor" /></div>
                                  Complete Task
                                </button>
                                <button onClick={() => {
                                  setDeleteTaskId(task.id ?? null);
                                  setIsDeleteTaskModalOpen(true);
                                  setOpenTaskMenuId(null);
                                }} style={{ ...buttonReset, display: "flex", alignItems: "center", gap: "10px", padding: "8px", borderRadius: "5px", fontSize: "12px", fontWeight: 600, color: "#ef4444", width: "100%", transition: "background-color 0.1s" }}
                                  onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = "#fef2f2"; }}
                                  onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = "transparent"; }}
                                >
                                  <div style={{ width: "22px", height: "22px", borderRadius: "5px", backgroundColor: "#fee2e2", color: "#ef4444", display: "flex", alignItems: "center", justifyContent: "center" }}><TrashIcon size={11} /></div>
                                  Delete Task
                                </button>
                              </div>
                            )}

                            {/* Edit button */}
                            <button
                              onClick={() => {
                                setEditTaskId(task.id ?? null);
                                setAddTaskTitle(task.title);
                                setAddTaskDesc(localTaskMeta[task.id ?? ""]?.description || "");
                                setAddTaskDeadline(task.date === "No due date" ? "" : task.date);
                                setAddTaskEnergy(task.level === "LOW" ? "Ringan" : task.level === "MEDIUM" ? "Sedang" : "Berat");
                                setIsEditTaskModalOpen(true);
                              }}
                              style={{ ...buttonReset, color: "#3b82f6", display: "flex", padding: "4px", borderRadius: "4px", transition: "background-color 0.15s" }}
                              onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = "#eff6ff"; }}
                              onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = "transparent"; }}
                            >
                              <PenIcon />
                            </button>
                            {/* Delete button */}
                            <button
                              onClick={() => {
                                setDeleteTaskId(task.id ?? null);
                                setIsDeleteTaskModalOpen(true);
                              }}
                              style={{ ...buttonReset, color: "#ef4444", display: "flex", padding: "4px", borderRadius: "4px", transition: "background-color 0.15s" }}
                              onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = "#fef2f2"; }}
                              onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = "transparent"; }}
                            >
                              <TrashIcon />
                            </button>
                            <button
                              disabled={isActionLoading}
                              onClick={() => {
                                void handleStartFocus(task.id);
                              }}
                              style={{
                                display: "flex",
                                alignItems: "center",
                                justifyContent: "center",
                                padding: "5px 12px",
                                minWidth: "85px",
                                borderRadius: "20px",
                                border: "1px solid #d1d5db",
                                backgroundColor: "#ffffff",
                                fontSize: "11px",
                                fontWeight: 600,
                                color: "#111827",
                                cursor: "pointer",
                                fontFamily: "inherit",
                                whiteSpace: "nowrap",
                                transition: "all 0.15s"
                              }}
                              onMouseEnter={(e) => {
                                if (!isActionLoading) {
                                  e.currentTarget.style.backgroundColor = "#f9fafb";
                                }
                              }}
                              onMouseLeave={(e) => {
                                if (!isActionLoading) {
                                  e.currentTarget.style.backgroundColor = "#ffffff";
                                }
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

          {/* ── Task View (List) ── */}
          {activeMenu === "task" && !selectedTaskId && templateView === "list" && (
            <div style={{ ...CARD_STYLE, width: "100%", padding: 0, marginBottom: "32px", overflow: "hidden" }}>
              <table style={{ width: "100%", borderCollapse: "collapse", tableLayout: "fixed" }}>
                <colgroup>
                  <col style={{ width: "35%" }} />
                  <col style={{ width: "20%" }} />
                  <col style={{ width: "20%" }} />
                  <col style={{ width: "25%" }} />
                </colgroup>
                <thead>
                  <tr style={{ height: "42px", backgroundColor: "#f9fafb", borderTop: `1px solid ${COLOR.border}`, borderBottom: `1px solid ${COLOR.border}` }}>
                    {["TASK", "TASK LEVEL", "DUE DATE", "ACTIONS"].map((h, i) => (
                      <th
                        key={h}
                        style={{
                          fontSize: "11px",
                          fontWeight: 600,
                          color: COLOR.mutedDark,
                          textAlign: i === 0 ? "left" : "center",
                          padding: i === 0 ? "0 12px 0 clamp(44px, 3.5vw, 60px)" : "0 12px",
                          letterSpacing: "0.04em",
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
                    <tr style={{ height: "56px", borderBottom: `1px solid ${COLOR.borderSoft}` }}>
                      <td
                        colSpan={4}
                        style={{
                          padding: "0 12px",
                          textAlign: "center",
                          verticalAlign: "middle",
                          fontSize: "12px",
                          fontWeight: 600,
                          color: COLOR.mutedDark,
                        }}
                      >
                        {emptyRecentTaskMessage}
                      </td>
                    </tr>
                  ) : recentTaskItems.map((task) => (
                    <tr key={task.id ?? task.title} style={{ height: "56px", borderBottom: `1px solid ${COLOR.borderSoft}` }}>
                      <td style={{ padding: "0 12px 0 clamp(44px, 3.5vw, 60px)", verticalAlign: "middle" }}>
                        <div style={{ display: "flex", alignItems: "center", gap: "14px", minWidth: 0 }}>
                          <input
                            type="checkbox"
                            checked={!!task.done}
                            disabled={isActionLoading}
                            onChange={(e) => {
                              void handleToggleTaskStatus(task, e.target.checked);
                            }}
                            style={{
                              width: "18px",
                              height: "18px",
                              accentColor: COLOR.primary,
                              borderRadius: "3px",
                              cursor: "pointer",
                              flexShrink: 0,
                            }}
                          />
                          <span style={{ fontSize: "13px", fontWeight: 600, color: COLOR.text, lineHeight: 1.3, overflowWrap: "break-word" }}>{task.title}</span>
                        </div>
                      </td>
                      <td style={{ padding: "0 12px", verticalAlign: "middle", textAlign: "center" }}>
                        <PriorityBadge level={task.level} />
                      </td>
                      <td style={{ padding: "0 12px", fontSize: "12px", color: COLOR.text, fontWeight: 500, verticalAlign: "middle", textAlign: "center" }}>
                        {task.date}
                      </td>
                      <td style={{ padding: "0 12px", verticalAlign: "middle", position: "relative" }}>
                        <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: "8px" }}>
                          <button onClick={() => {
                            setOpenTaskMenuId(openTaskMenuId === task.id ? null : (task.id ?? null));
                          }} style={{ ...buttonReset, color: COLOR.mutedDark, display: "flex", padding: "4px", borderRadius: "4px", transition: "background-color 0.15s" }}
                            onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = "#f3f4f6"; }}
                            onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = "transparent"; }}
                          >
                            <MoreDotsIcon />
                          </button>
                          {openTaskMenuId === task.id && (
                            <div style={{
                              position: "absolute",
                              top: "100%", right: "60px",
                              marginTop: "4px",
                              backgroundColor: "#ffffff",
                              borderRadius: "8px",
                              boxShadow: "0 4px 20px rgba(0,0,0,0.15)",
                              border: `1px solid ${COLOR.borderSoft}`,
                              zIndex: 100,
                              width: "150px",
                              display: "flex",
                              flexDirection: "column",
                              padding: "6px",
                            }}>
                              <button onClick={() => {
                                setEditTaskId(task.id ?? null);
                                setAddTaskTitle(task.title);
                                setAddTaskDesc(localTaskMeta[task.id ?? ""]?.description || "");
                                setAddTaskDeadline(task.date === "No due date" ? "" : task.date);
                                setAddTaskEnergy(task.level === "LOW" ? "Ringan" : task.level === "MEDIUM" ? "Sedang" : "Berat");
                                setIsEditTaskModalOpen(true);
                                setOpenTaskMenuId(null);
                              }} style={{ ...buttonReset, display: "flex", alignItems: "center", gap: "10px", padding: "8px", borderRadius: "5px", fontSize: "12px", fontWeight: 600, color: COLOR.text, width: "100%", transition: "background-color 0.1s" }}
                                onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = "#f9fafb"; }}
                                onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = "transparent"; }}
                              >
                                <div style={{ width: "22px", height: "22px", borderRadius: "5px", backgroundColor: "#eff6ff", color: "#3b82f6", display: "flex", alignItems: "center", justifyContent: "center" }}><PenIcon size={11} /></div>
                                Edit Task
                              </button>
                              <button onClick={() => {
                                setDetailTaskData({ ...task, description: localTaskMeta[task.id ?? ""]?.description || "" });
                                setIsDetailTaskModalOpen(true);
                                setOpenTaskMenuId(null);
                              }} style={{ ...buttonReset, display: "flex", alignItems: "center", gap: "10px", padding: "8px", borderRadius: "5px", fontSize: "12px", fontWeight: 600, color: COLOR.text, width: "100%", transition: "background-color 0.1s" }}
                                onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = "#f9fafb"; }}
                                onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = "transparent"; }}
                              >
                                <div style={{ width: "22px", height: "22px", borderRadius: "5px", backgroundColor: "#f3f4f6", color: "#111827", display: "flex", alignItems: "center", justifyContent: "center" }}>
                                  <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path><polyline points="14 2 14 8 20 8"></polyline></svg>
                                </div>
                                Detail Task
                              </button>
                              <button onClick={() => {
                                void handleCompleteTask(task.id ?? "");
                                setOpenTaskMenuId(null);
                              }} style={{ ...buttonReset, display: "flex", alignItems: "center", gap: "10px", padding: "8px", borderRadius: "5px", fontSize: "12px", fontWeight: 600, color: COLOR.text, width: "100%", transition: "background-color 0.1s" }}
                                onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = "#f9fafb"; }}
                                onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = "transparent"; }}
                              >
                                <div style={{ width: "22px", height: "22px", borderRadius: "5px", backgroundColor: "#dcfce7", color: "#16a34a", display: "flex", alignItems: "center", justifyContent: "center" }}><CheckSquareIcon size={11} color="currentColor" /></div>
                                Complete Task
                              </button>
                              <button onClick={() => {
                                setDeleteTaskId(task.id ?? null);
                                setIsDeleteTaskModalOpen(true);
                                setOpenTaskMenuId(null);
                              }} style={{ ...buttonReset, display: "flex", alignItems: "center", gap: "10px", padding: "8px", borderRadius: "5px", fontSize: "12px", fontWeight: 600, color: "#ef4444", width: "100%", transition: "background-color 0.1s" }}
                                onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = "#fef2f2"; }}
                                onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = "transparent"; }}
                              >
                                <div style={{ width: "22px", height: "22px", borderRadius: "5px", backgroundColor: "#fee2e2", color: "#ef4444", display: "flex", alignItems: "center", justifyContent: "center" }}><TrashIcon size={11} /></div>
                                Delete Task
                              </button>
                            </div>
                          )}

                          <button
                            disabled={isActionLoading}
                            onClick={() => {
                              void handleStartFocus(task.id);
                            }}
                            style={{
                              display: "flex",
                              alignItems: "center",
                              justifyContent: "center",
                              padding: "5px 12px",
                              minWidth: "85px",
                              borderRadius: "20px",
                              border: "1px solid #d1d5db",
                              backgroundColor: "#ffffff",
                              fontSize: "11px",
                              fontWeight: 600,
                              color: "#111827",
                              cursor: "pointer",
                              fontFamily: "inherit",
                              whiteSpace: "nowrap",
                              transition: "all 0.15s"
                            }}
                            onMouseEnter={(e) => {
                              if (!isActionLoading) {
                                e.currentTarget.style.backgroundColor = "#f9fafb";
                              }
                            }}
                            onMouseLeave={(e) => {
                              if (!isActionLoading) {
                                e.currentTarget.style.backgroundColor = "#ffffff";
                              }
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
          )}

          {/* ── Template View ── */}
          {activeMenu === "template" && templateView !== "detail" && (
            <div style={{ display: "flex", flexDirection: "column", gap: "24px" }}>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(3, minmax(0, 1fr))", gap: "clamp(28px, 3vw, 44px)", alignItems: "start" }}>
                {templatesList
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
                      {item.createdBy && (
                        <p style={{ fontSize: "12px", color: COLOR.mutedDark, lineHeight: 1.4, margin: "-12px 0 18px" }}>
                          Dibuat oleh {item.createdBy}
                        </p>
                      )}

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
                          Use Template
                        </button>
                        <button
                          onClick={() => {
                            setSelectedTemplateId(item.id);
                            setTemplateView("detail");
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

          {/* ── Detail Task View ── */}
          {activeMenu === "task" && selectedTaskId && (() => {
            const task = apiTasks.find(t => t.id === selectedTaskId);
            if (!task) return null;
            const energyLevel = mapEnergyToLevel(task.energy_weight);
            const energyColor = task.energy_weight === "Berat" ? "#DC2626" : task.energy_weight === "Sedang" ? "#F59E0B" : COLOR.primary;
            const statusLabel = task.status === "done" ? "Selesai" : task.status === "in_progress" ? "In Progress" : "Pending";
            const statusColor = task.status === "done" ? COLOR.primary : task.status === "in_progress" ? "#3B82F6" : "#F59E0B";
            const fmtDateTime = (v: string | null) => {
              if (!v) return "—";
              return new Intl.DateTimeFormat("id-ID", { day: "numeric", month: "long", year: "numeric", hour: "2-digit", minute: "2-digit" }).format(new Date(v));
            };
            const meta = localTaskMeta[task.id];
            const taskDescription = meta?.description || "";
            const taskSubtasks = meta?.subtasks || [];
            const doneSubtaskCount = taskSubtasks.filter(s => s.done).length;
            return (
              <div style={{ backgroundColor: "#ffffff", borderRadius: "12px", border: "1px solid #e5e7eb", overflow: "hidden", marginBottom: "32px" }}>
                {/* Header / Modal-like top bar */}
                <div style={{ padding: "20px 24px", borderBottom: "1px solid #e5e7eb", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <h2 style={{ fontSize: "16px", fontWeight: 700, color: "#111827", margin: 0 }}>Task Detail</h2>
                  <button onClick={() => setSelectedTaskId(null)} style={{ background: "none", border: "none", cursor: "pointer", color: "#6b7280" }}>
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" /></svg>
                  </button>
                </div>

                {/* Body 2 columns */}
                <div style={{ display: "grid", gridTemplateColumns: "1fr 280px", minHeight: "500px" }}>
                  {/* Left Column */}
                  <div style={{ padding: "32px", display: "flex", flexDirection: "column", gap: "24px" }}>

                    {/* Title */}
                    <div>
                      <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "12px", fontSize: "14px", fontWeight: 600, color: "#4b5563" }}>
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z" /></svg>
                        Title
                      </div>
                      <div style={{ padding: "16px", borderRadius: "8px", border: "1px solid #e5e7eb", fontSize: "20px", fontWeight: 700, color: "#111827" }}>
                        {task.title}
                      </div>
                    </div>

                    {/* Description */}
                    <div>
                      <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "12px", fontSize: "14px", fontWeight: 600, color: "#4b5563" }}>
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" /><polyline points="14 2 14 8 20 8" /><line x1="16" y1="13" x2="8" y2="13" /><line x1="16" y1="17" x2="8" y2="17" /><polyline points="10 9 9 9 8 9" /></svg>
                        Description
                      </div>
                      <div style={{ padding: "16px", borderRadius: "8px", border: "1px solid #e5e7eb", fontSize: "14px", color: "#4b5563", minHeight: "100px", whiteSpace: "pre-wrap" }}>
                        {taskDescription || "No description provided."}
                      </div>
                    </div>

                    {/* Subtasks */}
                    <div>
                      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "12px" }}>
                        <div style={{ display: "flex", alignItems: "center", gap: "8px", fontSize: "14px", fontWeight: 600, color: "#4b5563" }}>
                          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="8" y1="6" x2="21" y2="6" /><line x1="8" y1="12" x2="21" y2="12" /><line x1="8" y1="18" x2="21" y2="18" /><line x1="3" y1="6" x2="3.01" y2="6" /><line x1="3" y1="12" x2="3.01" y2="12" /><line x1="3" y1="18" x2="3.01" y2="18" /></svg>
                          Subtasks
                        </div>
                        <div style={{ backgroundColor: "#f3f4f6", padding: "4px 10px", borderRadius: "999px", fontSize: "11px", fontWeight: 700, color: "#4b5563" }}>
                          {doneSubtaskCount}/{taskSubtasks.length} Done
                        </div>
                      </div>

                      <div style={{ borderRadius: "8px", border: "1px solid #e5e7eb", padding: "16px", display: "flex", flexDirection: "column", gap: "16px" }}>
                        {taskSubtasks.map((st, idx) => (
                          <div key={idx} style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                            <div style={{ width: "20px", height: "20px", borderRadius: "4px", backgroundColor: st.done ? "#6366f1" : "#ffffff", border: st.done ? "none" : "1px solid #d1d5db", display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer", flexShrink: 0 }} onClick={() => {
                              const newSubs = [...taskSubtasks];
                              newSubs[idx] = { ...newSubs[idx], done: !newSubs[idx].done };
                              setLocalTaskMeta(prev => ({ ...prev, [task.id]: { description: taskDescription, subtasks: newSubs } }));
                            }}>
                              {st.done && <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#ffffff" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12" /></svg>}
                            </div>
                            <span style={{ fontSize: "14px", color: st.done ? "#9ca3af" : "#4b5563", textDecoration: st.done ? "line-through" : "none" }}>{st.text}</span>
                          </div>
                        ))}

                        <button style={{ display: "flex", alignItems: "center", gap: "8px", background: "none", border: "none", cursor: "pointer", color: "#6366f1", fontSize: "14px", fontWeight: 600, padding: 0, marginTop: "8px" }} onClick={() => setNotice("Adding subtasks after creation needs backend support.")}>
                          <span style={{ fontSize: "18px", fontWeight: 400 }}>+</span> Add subtask
                        </button>
                      </div>
                    </div>

                  </div>

                  {/* Right Column */}
                  <div style={{ borderLeft: "1px solid #e5e7eb", padding: "32px 24px", display: "flex", flexDirection: "column", gap: "32px" }}>

                    {/* Priority */}
                    <div>
                      <div style={{ fontSize: "11px", fontWeight: 700, color: "#6b7280", letterSpacing: "0.05em", marginBottom: "12px" }}>PRIORITY</div>
                      <div style={{ display: "inline-flex", alignItems: "center", gap: "6px", backgroundColor: energyLevel === "HIGH" ? "#16a34a" : energyLevel === "MEDIUM" ? "#f59e0b" : "#6b7280", color: "#ffffff", padding: "6px 12px", borderRadius: "6px", fontSize: "12px", fontWeight: 600 }}>
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M4 15s1-1 4-1 5 2 8 2 4-1 4-1V3s-1 1-4 1-5-2-8-2-4 1-4 1z" /><line x1="4" y1="22" x2="4" y2="15" /></svg>
                        {energyLevel === "HIGH" ? "High Priority" : energyLevel === "MEDIUM" ? "Medium Priority" : "Low Priority"}
                      </div>
                    </div>

                    {/* Due Date */}
                    <div>
                      <div style={{ fontSize: "11px", fontWeight: 700, color: "#6b7280", letterSpacing: "0.05em", marginBottom: "12px" }}>DUE DATE</div>
                      <div style={{ display: "flex", alignItems: "center", gap: "8px", fontSize: "13px", fontWeight: 600, color: task.deadline && new Date(task.deadline) < new Date() ? "#dc2626" : "#4b5563" }}>
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="4" width="18" height="18" rx="2" ry="2" /><line x1="16" y1="2" x2="16" y2="6" /><line x1="8" y1="2" x2="8" y2="6" /><line x1="3" y1="10" x2="21" y2="10" /></svg>
                        {task.deadline ? new Intl.DateTimeFormat("en-US", { month: "short", day: "numeric", year: "numeric" }).format(new Date(task.deadline)) : "No due date"}
                        {task.deadline && new Date(task.deadline) < new Date() && " (Overdue)"}
                      </div>
                    </div>

                    {/* Task Level */}
                    <div>
                      <div style={{ fontSize: "11px", fontWeight: 700, color: "#6b7280", letterSpacing: "0.05em", marginBottom: "12px" }}>TASK LEVEL</div>
                      <div style={{ display: "inline-flex", alignItems: "center", gap: "4px", fontSize: "13px", fontWeight: 700, color: "#16a34a" }}>
                        {task.energy_weight}
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="6 9 12 15 18 9" /></svg>
                      </div>
                    </div>

                    <hr style={{ border: "none", borderTop: "1px solid #e5e7eb", margin: 0 }} />

                    {/* Created */}
                    <div style={{ fontSize: "12px", fontWeight: 600, color: "#6b7280" }}>
                      Created {new Intl.DateTimeFormat("en-US", { month: "short", day: "numeric" }).format(new Date(task.created_at))}
                    </div>

                    {/* Actions */}
                    <div style={{ display: "flex", flexDirection: "column", gap: "16px", marginTop: "8px" }}>
                      <button onClick={() => setNotice("Fitur edit task perlu endpoint backend tambahan.")} style={{ display: "flex", alignItems: "center", gap: "8px", background: "none", border: "none", cursor: "pointer", color: "#4b5563", fontSize: "13px", fontWeight: 600, padding: 0 }}>
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21.5 2v6h-6M21.34 15.57a10 10 0 1 1-.59-9.21l-3.25-1.95" /></svg>
                        Update Task
                      </button>
                      <button onClick={() => setNotice("Fitur hapus task perlu endpoint backend tambahan.")} style={{ display: "flex", alignItems: "center", gap: "8px", background: "none", border: "none", cursor: "pointer", color: "#4b5563", fontSize: "13px", fontWeight: 600, padding: 0 }}>
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="3 6 5 6 21 6" /><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" /></svg>
                        Delete Task
                      </button>
                    </div>

                  </div>
                </div>
              </div>
            );
          })()}

          {/* ── Detail Template Pop-up ── */}
          {activeMenu === "template" && templateView === "detail" && selectedCard && (
            <div style={{
              position: "fixed", top: 0, left: 0, right: 0, bottom: 0,
              backgroundColor: "rgba(0, 0, 0, 0.35)",
              display: "flex", alignItems: "center", justifyContent: "center",
              zIndex: 100, padding: "20px",
              animation: "dashNotifPop 0.25s ease-out forwards",
            }}>
              <div style={{
                backgroundColor: "#ffffff", borderRadius: "16px",
                width: "100%", maxWidth: "820px", padding: "32px 36px 36px",
                position: "relative", maxHeight: "90vh", overflowY: "auto",
                boxShadow: "0 20px 60px rgba(0,0,0,0.15)",
              }}>
                {/* Close Button */}
                <button
                  onClick={() => {
                    setSelectedTemplateId(null);
                    setTemplateView("list");
                  }}
                  style={{
                    position: "absolute", top: "24px", right: "24px",
                    background: "none", border: "none", cursor: "pointer",
                    color: "#6b7280", padding: "4px", display: "flex",
                    transition: "color 0.15s",
                  }}
                  onMouseEnter={(e) => { e.currentTarget.style.color = "#111827"; }}
                  onMouseLeave={(e) => { e.currentTarget.style.color = "#6b7280"; }}
                >
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <line x1="18" y1="6" x2="6" y2="18" />
                    <line x1="6" y1="6" x2="18" y2="18" />
                  </svg>
                </button>

                {/* Header: Icon + Title + Badge + Description */}
                <div style={{ display: "flex", gap: "16px", alignItems: "flex-start", marginBottom: "28px" }}>
                  <div style={{
                    width: "56px", height: "56px", borderRadius: "12px", backgroundColor: "#f3f4f6",
                    display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0,
                  }}>
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#6b7280" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                      <polyline points="14 2 14 8 20 8" />
                    </svg>
                  </div>
                  <div style={{ flex: 1 }}>
                    <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "6px" }}>
                      <h2 style={{ fontSize: "22px", fontWeight: 700, color: "#111827", margin: 0 }}>{selectedCard.title}</h2>
                      <span style={{
                        fontSize: "10px", fontWeight: 700, color: "#166534", backgroundColor: "#dcfce7",
                        padding: "3px 10px", borderRadius: "4px", letterSpacing: "0.04em",
                      }}>
                        {selectedCard.level === "HIGH" ? "HIGH" : selectedCard.level === "LOW" ? "LOW" : "MEDIUM"}
                      </span>
                    </div>
                    <p style={{ fontSize: "13px", color: "#6b7280", lineHeight: 1.5, margin: 0, maxWidth: "500px" }}>
                      {selectedCard.desc}
                    </p>
                  </div>
                </div>

                {/* Two Column Layout */}
                <div style={{ display: "flex", gap: "20px", flexWrap: "wrap" }}>
                  {/* Left: Template Tasks */}
                  <div style={{
                    flex: 1, minWidth: "320px", border: "1px solid #f0f0f0", borderRadius: "12px",
                    padding: "24px", backgroundColor: "#ffffff",
                  }}>
                    <h3 style={{ fontSize: "16px", fontWeight: 700, color: "#111827", margin: "0 0 24px" }}>Template Tasks</h3>
                    <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
                      {(selectedCard.previewItems?.map((item) => item.title) ?? ["Belum ada preview task"]).map((task, idx) => (
                        <div key={idx} style={{ display: "flex", alignItems: "center", gap: "14px" }}>
                          <div style={{
                            width: "28px", height: "28px", borderRadius: "50%", backgroundColor: "#166534",
                            color: "#ffffff", fontSize: "12px", fontWeight: 700,
                            display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0,
                          }}>
                            {idx + 1}
                          </div>
                          <span style={{ fontSize: "14px", color: "#374151", fontWeight: 500 }}>{task}</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Right: Template Information */}
                  <div style={{
                    width: "300px", flexShrink: 0, border: "1px solid #f0f0f0", borderRadius: "12px",
                    padding: "24px", backgroundColor: "#ffffff",
                    display: "flex", flexDirection: "column",
                  }}>
                    <h3 style={{ fontSize: "16px", fontWeight: 700, color: "#111827", margin: "0 0 28px" }}>Template Information</h3>

                    <div style={{ display: "flex", flexDirection: "column", gap: "24px", flex: 1 }}>
                      {/* Created by */}
                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                        <div style={{ display: "flex", alignItems: "center", gap: "10px", color: "#6b7280" }}>
                          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
                            <circle cx="12" cy="7" r="4" />
                          </svg>
                          <span style={{ fontSize: "13px", fontWeight: 500 }}>Created by</span>
                        </div>
                        <span style={{ fontSize: "13px", fontWeight: 700, color: "#111827" }}>{selectedCard.createdBy ?? "BenToDo Official"}</span>
                      </div>

                      {/* Used */}
                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                        <div style={{ display: "flex", alignItems: "center", gap: "10px", color: "#6b7280" }}>
                          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <circle cx="12" cy="12" r="10" />
                            <polyline points="12 6 12 12 16 14" />
                          </svg>
                          <span style={{ fontSize: "13px", fontWeight: 500 }}>Used</span>
                        </div>
                        <span style={{ fontSize: "13px", fontWeight: 700, color: "#111827" }}>{selectedCard.usage ?? "0 times"}</span>
                      </div>

                      {/* Last updated */}
                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                        <div style={{ display: "flex", alignItems: "center", gap: "10px", color: "#6b7280" }}>
                          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
                            <line x1="16" y1="2" x2="16" y2="6" />
                            <line x1="8" y1="2" x2="8" y2="6" />
                            <line x1="3" y1="10" x2="21" y2="10" />
                          </svg>
                          <span style={{ fontSize: "13px", fontWeight: 500 }}>Last updated</span>
                        </div>
                        <span style={{ fontSize: "13px", fontWeight: 700, color: "#111827" }}>{selectedCard.updatedAt ?? "-"}</span>
                      </div>
                    </div>

                    {/* Action Buttons */}
                    <div style={{ display: "flex", flexDirection: "column", gap: "10px", marginTop: "32px" }}>
                      <button
                        onClick={() => {
                          void handleUseCard(selectedCard);
                        }}
                        style={{
                          width: "100%", height: "44px", borderRadius: "999px", backgroundColor: "#166534",
                          color: "#ffffff", fontSize: "14px", fontWeight: 600, border: "none",
                          cursor: "pointer", fontFamily: "inherit", transition: "background-color 0.15s",
                          display: "flex", alignItems: "center", justifyContent: "center", gap: "8px",
                        }}
                        onMouseEnter={(e) => { (e.currentTarget as HTMLButtonElement).style.backgroundColor = "#14532d"; }}
                        onMouseLeave={(e) => { (e.currentTarget as HTMLButtonElement).style.backgroundColor = "#166534"; }}
                      >
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                          <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                          <polyline points="14 2 14 8 20 8" />
                        </svg>
                        Use Template
                      </button>
                      <button
                        onClick={() => setNotice("Fitur private custom template perlu endpoint backend tambahan.")}
                        style={{
                          width: "100%", height: "44px", borderRadius: "999px", backgroundColor: "#ffffff",
                          color: "#111827", fontSize: "14px", fontWeight: 600, border: "1px solid #e5e7eb",
                          cursor: "pointer", fontFamily: "inherit", transition: "background-color 0.15s",
                          display: "flex", alignItems: "center", justifyContent: "center", gap: "8px",
                        }}
                        onMouseEnter={(e) => { (e.currentTarget as HTMLButtonElement).style.backgroundColor = "#f9fafb"; }}
                        onMouseLeave={(e) => { (e.currentTarget as HTMLButtonElement).style.backgroundColor = "#ffffff"; }}
                      >
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                          <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
                          <path d="M7 11V7a5 5 0 0 1 10 0v4" />
                        </svg>
                        Save Template as Private
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}


          <CreateTemplateModal
            key={templateView === "create" ? "template-create-open" : "template-create-closed"}
            mode="user"
            open={activeMenu === "template" && templateView === "create"}
            isSubmitting={isActionLoading}
            error={templateFormError}
            onClose={() => {
              setTemplateFormError(null);
              setTemplateView("list");
            }}
            onSubmit={handleCreateCustomTemplate}
          />

{/* ── Success Pop-up ── */}
          {activeMenu === "template" && templateView === "success" && (
            <div style={{
              position: "fixed", top: 0, left: 0, right: 0, bottom: 0,
              backgroundColor: "rgba(0, 0, 0, 0.35)",
              display: "flex", alignItems: "center", justifyContent: "center",
              zIndex: 100, padding: "20px",
              animation: "dashNotifPop 0.25s ease-out forwards",
            }}>
              <div style={{
                backgroundColor: "#ffffff", borderRadius: "16px",
                width: "100%", maxWidth: "420px", padding: "36px 32px 32px",
                position: "relative", textAlign: "center",
                boxShadow: "0 20px 60px rgba(0,0,0,0.15)",
              }}>
                {/* Close Button */}
                <button
                  onClick={() => setTemplateView("list")}
                  style={{
                    position: "absolute", top: "20px", right: "20px",
                    background: "none", border: "none", cursor: "pointer",
                    color: "#6b7280", padding: "4px", display: "flex",
                    transition: "color 0.15s",
                  }}
                  onMouseEnter={(e) => { e.currentTarget.style.color = "#111827"; }}
                  onMouseLeave={(e) => { e.currentTarget.style.color = "#6b7280"; }}
                >
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <line x1="18" y1="6" x2="6" y2="18" />
                    <line x1="6" y1="6" x2="18" y2="18" />
                  </svg>
                </button>

                {/* Success Icon with sparkles */}
                <div style={{ display: "flex", justifyContent: "center", marginBottom: "20px", position: "relative" }}>
                  <svg width="90" height="90" viewBox="0 0 90 90" fill="none">
                    <circle cx="45" cy="45" r="35" stroke="#166534" strokeWidth="5" fill="none" />
                    <path d="M28 45l10 10 24-24" stroke="#166534" strokeWidth="5" strokeLinecap="round" strokeLinejoin="round" fill="none" />
                    {/* Sparkles */}
                    <path d="M62 12l2 4 4 2-4 2-2 4-2-4-4-2 4-2z" fill="#166534" opacity="0.7" />
                    <circle cx="70" cy="8" r="1.5" fill="#166534" opacity="0.5" />
                  </svg>
                </div>

                <h2 style={{ fontSize: "20px", fontWeight: 700, color: "#111827", margin: "0 0 6px" }}>Template added successfully!</h2>
                <p style={{ fontSize: "13px", color: "#9ca3af", margin: "0 0 24px" }}>All tasks have been added to your task list.</p>

                {/* Summary Card */}
                <div style={{
                  border: "1px solid #e5e7eb", borderRadius: "10px", padding: "20px",
                  textAlign: "left", backgroundColor: "#fafafa", marginBottom: "24px",
                }}>
                  {/* Title with check */}
                  <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "18px" }}>
                    <CheckCircleSolidIcon />
                    <span style={{ fontSize: "16px", fontWeight: 700, color: "#111827" }}>{createdTemplateSummary?.title || "Untitled"}</span>
                  </div>

                  <div style={{ display: "flex", flexDirection: "column", gap: "14px" }}>
                    {/* Deadline */}
                    <div style={{ display: "flex", alignItems: "center" }}>
                      <div style={{ display: "flex", alignItems: "center", gap: "8px", color: "#6b7280", minWidth: "130px" }}>
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                          <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
                          <line x1="16" y1="2" x2="16" y2="6" />
                          <line x1="8" y1="2" x2="8" y2="6" />
                          <line x1="3" y1="10" x2="21" y2="10" />
                        </svg>
                        <span style={{ fontSize: "13px" }}>Task</span>
                      </div>
                      <span style={{ color: "#9ca3af", marginRight: "8px" }}>:</span>
                      <span style={{ fontSize: "13px", fontWeight: 700, color: "#111827" }}>{createdTemplateSummary?.taskCount ?? 0} tasks</span>
                    </div>

                    {/* Level Task */}
                    <div style={{ display: "flex", alignItems: "center" }}>
                      <div style={{ display: "flex", alignItems: "center", gap: "8px", color: "#6b7280", minWidth: "130px" }}>
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                          <path d="M4 15s1-1 4-1 5 2 8 2 4-1 4-1V3s-1 1-4 1-5-2-8-2-4 1-4 1z" />
                          <line x1="4" y1="22" x2="4" y2="15" />
                        </svg>
                        <span style={{ fontSize: "13px" }}>Type</span>
                      </div>
                      <span style={{ color: "#9ca3af", marginRight: "8px" }}>:</span>
                      <span style={{ fontSize: "13px", fontWeight: 700, color: "#111827" }}>Custom Template</span>
                    </div>

                    {/* Label */}
                    <div style={{ display: "flex", alignItems: "center" }}>
                      <div style={{ display: "flex", alignItems: "center", gap: "8px", color: "#6b7280", minWidth: "130px" }}>
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                          <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                          <polyline points="14 2 14 8 20 8" />
                        </svg>
                        <span style={{ fontSize: "13px" }}>Label</span>
                      </div>
                      <span style={{ color: "#9ca3af", marginRight: "8px" }}>:</span>
                      <span style={{ fontSize: "13px", fontWeight: 700, color: "#111827" }}>{createdTemplateSummary?.label === "Private" ? "Private" : "Public"}</span>
                    </div>
                  </div>
                </div>

                {/* View Template Button */}
                <button
                  onClick={() => {
                    setTemplateFilter(createdTemplateSummary?.label ?? "Private");
                    setTemplateView("list");
                  }}
                  style={{
                    width: "100%", height: "44px", borderRadius: "8px", backgroundColor: "#166534",
                    color: "#ffffff", fontSize: "14px", fontWeight: 600, border: "none",
                    cursor: "pointer", fontFamily: "inherit", transition: "background-color 0.15s",
                  }}
                  onMouseEnter={(e) => { (e.currentTarget as HTMLButtonElement).style.backgroundColor = "#14532d"; }}
                  onMouseLeave={(e) => { (e.currentTarget as HTMLButtonElement).style.backgroundColor = "#166534"; }}
                >
                  View Template
                </button>
              </div>
            </div>
          )}

          {/* ── Add / Edit Task Modal ── */}
          {(isAddTaskModalOpen || isEditTaskModalOpen) && (
            <div style={{
              position: "fixed", top: 0, left: 0, right: 0, bottom: 0,
              backgroundColor: "rgba(0, 0, 0, 0.4)",
              display: "flex", alignItems: "center", justifyContent: "center",
              zIndex: 100, padding: "20px"
            }}>
              <div style={{
                backgroundColor: "#ffffff", borderRadius: "8px",
                width: "100%", maxWidth: "560px", padding: "32px",
                position: "relative", maxHeight: "90vh", overflowY: "auto",
              }}>
                <button
                  onClick={() => {
                    setIsAddTaskModalOpen(false);
                    setIsEditTaskModalOpen(false);
                  }}
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

                <h2 style={{ fontSize: "20px", fontWeight: 700, margin: "0 0 24px", color: COLOR.text }}>
                  {isEditTaskModalOpen ? "Edit Task" : "Add Task"}
                </h2>

                <div style={{ borderTop: `1px solid ${COLOR.borderSoft}`, margin: "0 -32px 24px" }} />

                {/* Task Name */}
                <div style={{ marginBottom: "20px" }}>
                  <label style={{ display: "flex", alignItems: "center", gap: "8px", fontSize: "14px", fontWeight: 600, color: COLOR.text, marginBottom: "8px" }}>
                    <span style={{ fontSize: "14px", fontWeight: "bold" }}>T</span> Task Name
                  </label>
                  <input
                    type="text"
                    value={addTaskTitle}
                    onChange={(e) => setAddTaskTitle(e.target.value)}
                    placeholder="Enter Name Task"
                    style={{
                      width: "100%", height: "48px", borderRadius: "8px", border: `1px solid ${COLOR.border}`,
                      padding: "0 16px", fontSize: "14px", color: COLOR.text, outline: "none",
                      boxSizing: "border-box"
                    }}
                  />
                </div>

                {/* Description */}
                <div style={{ marginBottom: "20px" }}>
                  <label style={{ display: "flex", alignItems: "center", gap: "8px", fontSize: "14px", fontWeight: 600, color: COLOR.text, marginBottom: "8px" }}>
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path><polyline points="14 2 14 8 20 8"></polyline><line x1="16" y1="13" x2="8" y2="13"></line><line x1="16" y1="17" x2="8" y2="17"></line><polyline points="10 9 9 9 8 9"></polyline></svg>
                    Description
                  </label>
                  <textarea
                    value={addTaskDesc}
                    onChange={(e) => setAddTaskDesc(e.target.value)}
                    placeholder="Deskripsi"
                    rows={3}
                    style={{
                      width: "100%", borderRadius: "8px", border: `1px solid ${COLOR.border}`,
                      padding: "12px 16px", fontSize: "14px", color: COLOR.text, outline: "none",
                      boxSizing: "border-box", fontFamily: "inherit", resize: "vertical", minHeight: "80px"
                    }}
                  />
                </div>

                {/* Due Date */}
                <div style={{ marginBottom: "20px" }}>
                  <label style={{ display: "flex", alignItems: "center", gap: "8px", fontSize: "14px", fontWeight: 600, color: COLOR.text, marginBottom: "8px" }}>
                    <CalendarSmIcon /> Due Date
                  </label>
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

                {/* Task Level */}
                <div style={{ marginBottom: "32px" }}>
                  <label style={{ display: "flex", alignItems: "center", gap: "8px", fontSize: "14px", fontWeight: 600, color: COLOR.text, marginBottom: "8px" }}>
                    <span style={{ fontSize: "14px", fontWeight: "bold" }}>!</span> Task Level
                  </label>
                  <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: "12px" }}>
                    {[
                      { id: "Ringan", label: "Low" },
                      { id: "Sedang", label: "Medium" },
                      { id: "Berat", label: "High" },
                    ].map((item) => (
                      <div
                        key={item.id}
                        onClick={() => setAddTaskEnergy(item.id as EnergyWeight)}
                        style={{
                          border: `1.5px solid ${addTaskEnergy === item.id ? COLOR.primary : COLOR.border}`,
                          borderRadius: "8px", height: "48px", cursor: "pointer",
                          backgroundColor: addTaskEnergy === item.id ? "#f0fdf4" : "#ffffff",
                          display: "flex", alignItems: "center", justifyContent: "center",
                          transition: "all 0.2s", position: "relative"
                        }}
                      >
                        <span style={{ fontSize: "13px", fontWeight: addTaskEnergy === item.id ? 700 : 500, color: addTaskEnergy === item.id ? COLOR.primary : COLOR.text }}>
                          {item.label}
                        </span>
                        {addTaskEnergy === item.id && (
                          <div style={{ position: "absolute", top: "-6px", right: "-6px", width: "16px", height: "16px", borderRadius: "50%", backgroundColor: COLOR.primary, display: "flex", alignItems: "center", justifyContent: "center", color: "#fff" }}>
                            <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"></polyline></svg>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>

                <div style={{ borderTop: `1px solid ${COLOR.borderSoft}`, margin: "0 -32px 24px" }} />

                {/* Submit */}
                <div style={{ display: "flex", justifyContent: "flex-end", gap: "12px" }}>
                  <button
                    onClick={() => {
                      setIsAddTaskModalOpen(false);
                      setIsEditTaskModalOpen(false);
                    }}
                    style={{
                      height: "44px", padding: "0 24px", borderRadius: "8px",
                      backgroundColor: "#ffffff", color: COLOR.text,
                      fontSize: "14px", fontWeight: 600, border: `1px solid ${COLOR.border}`, cursor: "pointer"
                    }}
                  >
                    Cancel
                  </button>
                  <button
                    onClick={() => {
                      if (isEditTaskModalOpen) {
                        void handleSaveEdit();
                      } else {
                        void handleCreateTask();
                      }
                    }}
                    disabled={isActionLoading}
                    style={{
                      height: "44px", padding: "0 32px", borderRadius: "8px",
                      backgroundColor: COLOR.primary, color: "#ffffff",
                      fontSize: "14px", fontWeight: 600, border: "none", cursor: "pointer",
                      opacity: isActionLoading ? 0.7 : 1, transition: "opacity 0.2s"
                    }}
                  >
                    {isActionLoading ? "Menyimpan..." : (isEditTaskModalOpen ? "Save Task" : "Add Task")}
                  </button>
                </div>

              </div>
            </div>
          )}

          {/* ── Task Details Modal ── */}
          {isDetailTaskModalOpen && detailTaskData && (
            <div style={{
              position: "fixed", top: 0, left: 0, right: 0, bottom: 0,
              backgroundColor: "rgba(0, 0, 0, 0.4)",
              display: "flex", alignItems: "center", justifyContent: "center",
              zIndex: 100, padding: "20px"
            }}>
              <div style={{
                backgroundColor: "#ffffff", borderRadius: "8px",
                width: "100%", maxWidth: "560px", padding: "32px",
                position: "relative", maxHeight: "90vh", overflowY: "auto",
              }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "24px" }}>
                  <h2 style={{ fontSize: "20px", fontWeight: 700, margin: 0, color: COLOR.text }}>Task Details</h2>
                  <div style={{ display: "flex", alignItems: "center", gap: "16px", color: COLOR.text }}>
                    <button onClick={() => {
                      setEditTaskId(detailTaskData.id ?? null);
                      setAddTaskTitle(detailTaskData.title);
                      setAddTaskDesc(detailTaskData.description || "");
                      setAddTaskDeadline(detailTaskData.date === "No due date" ? "" : detailTaskData.date);
                      setAddTaskEnergy(detailTaskData.level === "LOW" ? "Ringan" : detailTaskData.level === "MEDIUM" ? "Sedang" : "Berat");
                      setIsDetailTaskModalOpen(false);
                      setIsEditTaskModalOpen(true);
                    }} style={{ ...buttonReset, cursor: "pointer", display: "flex" }}>
                      <PenIcon />
                    </button>
                    <button onClick={() => {
                      setIsDetailTaskModalOpen(false);
                      setOpenTaskMenuId(detailTaskData.id ?? null);
                    }} style={{ ...buttonReset, cursor: "pointer", display: "flex" }}>
                      <MoreDotsIcon />
                    </button>
                  </div>
                </div>

                <h3 style={{ fontSize: "18px", fontWeight: 600, color: COLOR.text, margin: "0 0 8px", lineHeight: 1.3 }}>{detailTaskData.title}</h3>
                <p style={{ fontSize: "14px", color: COLOR.mutedDark, margin: "0 0 24px", lineHeight: 1.5 }}>
                  {detailTaskData.description || "No description provided."}
                </p>

                <div style={{ border: `1px solid ${COLOR.borderSoft}`, borderRadius: "8px", padding: "16px", marginBottom: "16px" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: "8px", fontSize: "13px", fontWeight: 600, color: COLOR.text, marginBottom: "8px" }}>
                    <span style={{ fontSize: "14px", fontWeight: "bold" }}>!</span> Priority
                  </div>
                  <PriorityBadge level={detailTaskData.level} />
                </div>

                <div style={{ border: `1px solid ${COLOR.borderSoft}`, borderRadius: "8px", padding: "16px", marginBottom: "32px" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: "8px", fontSize: "13px", fontWeight: 600, color: COLOR.text, marginBottom: "8px" }}>
                    <CalendarSmIcon /> Due Date
                  </div>
                  <div style={{ fontSize: "14px", fontWeight: 600, color: COLOR.text }}>{detailTaskData.date}</div>
                </div>

                <div style={{ borderTop: `1px solid ${COLOR.borderSoft}`, margin: "0 -32px 24px" }} />

                <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
                  <button
                    onClick={() => {
                      setEditTaskId(detailTaskData.id ?? null);
                      setAddTaskTitle(detailTaskData.title);
                      setAddTaskDesc(detailTaskData.description || "");
                      setAddTaskDeadline(detailTaskData.date === "No due date" ? "" : detailTaskData.date);
                      setAddTaskEnergy(detailTaskData.level === "LOW" ? "Ringan" : detailTaskData.level === "MEDIUM" ? "Sedang" : "Berat");
                      setIsDetailTaskModalOpen(false);
                      setIsEditTaskModalOpen(true);
                    }}
                    style={{
                      height: "44px", width: "100%", borderRadius: "8px", display: "flex", alignItems: "center", justifyContent: "center", gap: "8px",
                      backgroundColor: COLOR.primary, color: "#ffffff",
                      fontSize: "14px", fontWeight: 600, border: "none", cursor: "pointer"
                    }}
                  >
                    <PenIcon /> Edit Task
                  </button>
                  <button
                    onClick={() => setIsDetailTaskModalOpen(false)}
                    style={{
                      height: "44px", width: "100%", borderRadius: "8px",
                      backgroundColor: "#ffffff", color: COLOR.mutedDark,
                      fontSize: "14px", fontWeight: 600, border: `1px solid ${COLOR.border}`, cursor: "pointer"
                    }}
                  >
                    Close Details
                  </button>
                </div>

              </div>
            </div>
          )}

          {/* ── Delete Task Modal ── */}
          {isDeleteTaskModalOpen && (
            <div style={{
              position: "fixed", top: 0, left: 0, right: 0, bottom: 0,
              backgroundColor: "rgba(0, 0, 0, 0.4)",
              display: "flex", alignItems: "center", justifyContent: "center",
              zIndex: 100, padding: "20px"
            }}>
              <div style={{
                backgroundColor: "#ffffff", borderRadius: "12px",
                width: "100%", maxWidth: "400px", padding: "40px 32px 32px",
                display: "flex", flexDirection: "column", alignItems: "center", textAlign: "center"
              }}>
                <div style={{ width: "64px", height: "64px", borderRadius: "50%", backgroundColor: "#fee2e2", display: "flex", alignItems: "center", justifyContent: "center", marginBottom: "24px", color: "#b91c1c" }}>
                  <AlertTriangleIcon size={32} color="currentColor" />
                </div>

                <h2 style={{ fontSize: "22px", fontWeight: 700, margin: "0 0 12px", color: COLOR.text }}>Delete Task?</h2>
                <p style={{ fontSize: "14px", color: COLOR.mutedDark, margin: "0 0 32px", lineHeight: 1.5 }}>
                  Are you sure you want to delete this task? This action cannot be undone.
                </p>

                <div style={{ display: "flex", width: "100%", gap: "16px", justifyContent: "center" }}>
                  <button
                    onClick={() => setIsDeleteTaskModalOpen(false)}
                    style={{
                      flex: 1, height: "44px", borderRadius: "8px",
                      backgroundColor: "transparent", color: COLOR.mutedDark,
                      fontSize: "14px", fontWeight: 600, border: "none", cursor: "pointer"
                    }}
                  >
                    Cancel
                  </button>
                  <button
                    onClick={() => void handleDeleteTask()}
                    disabled={isActionLoading}
                    style={{
                      flex: 1, height: "44px", borderRadius: "8px", display: "flex", alignItems: "center", justifyContent: "center", gap: "8px",
                      backgroundColor: "#b91c1c", color: "#ffffff",
                      fontSize: "14px", fontWeight: 600, border: "none", cursor: "pointer",
                      opacity: isActionLoading ? 0.7 : 1, transition: "opacity 0.2s"
                    }}
                  >
                    <TrashIcon /> Delete
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
