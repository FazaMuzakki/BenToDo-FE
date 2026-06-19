"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { LOGO_SRC } from "../lib/assets";
import {
  clearAuthSession,
  createAdminTemplate,
  deleteAdminTemplate,
  getAdminDashboard,
  getAdminTemplates,
  getStoredUser,
  hasActiveSession,
} from "../lib/api";
import type { AdminDashboardData, DashboardMetric, DashboardPeriod, TaskTemplate } from "../lib/api";
import CreateTemplateModal, { type CreateTemplateModalPayload } from "../components/CreateTemplateModal";
import { ThemeToggle } from "../components/ThemeToggle";

// ─── Design Tokens ─────────────────────────────────────────────────────────────



const CARD_STYLE = {
  backgroundColor: "var(--color-surface)",
  borderRadius: "8px",
  border: `1px solid ${"var(--color-border)"}`,
} as const;

const buttonReset = {
  border: "none",
  background: "none",
  fontFamily: "inherit",
  cursor: "pointer",
} as const;

// ─── SVG Icons ─────────────────────────────────────────────────────────────────

const DashboardIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <rect x="3" y="3" width="7" height="7" rx="1" />
    <rect x="14" y="3" width="7" height="7" rx="1" />
    <rect x="3" y="14" width="7" height="7" rx="1" />
    <rect x="14" y="14" width="7" height="7" rx="1" />
  </svg>
);

const FolderIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z" />
  </svg>
);

const SignOutIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
    <polyline points="16 17 21 12 16 7" />
    <line x1="21" y1="12" x2="9" y2="12" />
  </svg>
);

const BellIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" />
    <path d="M13.73 21a2 2 0 0 1-3.46 0" />
  </svg>
);

const TrendUpIcon = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke={"var(--color-primary)"} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="23 6 13.5 15.5 8.5 10.5 1 18" />
    <polyline points="17 6 23 6 23 12" />
  </svg>
);

const TrendDownIcon = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke={"var(--color-danger)"} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="23 18 13.5 8.5 8.5 13.5 1 6" />
    <polyline points="17 18 23 18 23 12" />
  </svg>
);

const GuestUserIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke={"var(--color-foreground)"} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
    <circle cx="9" cy="7" r="4" />
    <polyline points="16 11 18 13 22 9" />
  </svg>
);

const UsersGroupIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke={"var(--color-foreground)"} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
    <circle cx="9" cy="7" r="4" />
    <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
    <path d="M16 3.13a4 4 0 0 1 0 7.75" />
  </svg>
);

const TaskClipIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke={"var(--color-foreground)"} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="12" cy="12" r="10" />
    <polyline points="12 6 12 12 16 14" />
  </svg>
);

const TemplatesIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke={"var(--color-foreground)"} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="12" cy="12" r="10" />
    <polyline points="12 6 12 12 16 14" />
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

const MoreDotsIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
    <circle cx="5" cy="12" r="2" />
    <circle cx="12" cy="12" r="2" />
    <circle cx="19" cy="12" r="2" />
  </svg>
);

const TrashIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="3 6 5 6 21 6" />
    <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
  </svg>
);

const PlusIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <line x1="12" y1="5" x2="12" y2="19" />
    <line x1="5" y1="12" x2="19" y2="12" />
  </svg>
);

const CloseIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <line x1="18" y1="6" x2="6" y2="18" />
    <line x1="6" y1="6" x2="18" y2="18" />
  </svg>
);

const GlobeIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="var(--color-muted-dark)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="12" cy="12" r="10" />
    <line x1="2" y1="12" x2="22" y2="12" />
    <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z" />
  </svg>
);

const LockIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="var(--color-muted-dark)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
    <path d="M7 11V7a5 5 0 0 1 10 0v4" />
  </svg>
);

const SuccessCheckIcon = () => (
  <svg width="80" height="80" viewBox="0 0 120 120" fill="none">
    <circle cx="60" cy="60" r="46" stroke={"var(--color-primary)"} strokeWidth="6" />
    <path d="M38 60l14 14 30-30" stroke={"var(--color-primary)"} strokeWidth="6" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);

const SparkleIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill={"var(--color-primary)"}>
    <path d="M12 2l2.09 6.26L20.18 10l-6.09 1.74L12 18l-2.09-6.26L3.82 10l6.09-1.74L12 2z" />
    <circle cx="19" cy="5" r="2" />
  </svg>
);

const CalendarLineIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke={"var(--color-muted)"} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
    <line x1="16" y1="2" x2="16" y2="6" />
    <line x1="8" y1="2" x2="8" y2="6" />
    <line x1="3" y1="10" x2="21" y2="10" />
  </svg>
);

const FlagLineIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke={"var(--color-muted)"} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M4 15s1-1 4-1 5 2 8 2 4-1 4-1V3s-1 1-4 1-5-2-8-2-4 1-4 1z" />
    <line x1="4" y1="22" x2="4" y2="15" />
  </svg>
);

const PlayTriangleIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke={"var(--color-muted)"} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <polygon points="5 3 19 12 5 21 5 3" />
  </svg>
);

const CheckCircleSolidIcon = () => (
  <svg width="22" height="22" viewBox="0 0 24 24" fill={"var(--color-primary)"}>
    <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z" />
  </svg>
);

// ─── Trend Badge ───────────────────────────────────────────────────────────────

function TrendBadge({ value, up }: { value: string; up: boolean }) {
  return (
    <span
      style={{
        display: "inline-flex",
        alignItems: "center",
        gap: "3px",
        fontSize: "12px",
        fontWeight: 700,
        color: up ? "var(--color-primary)" : "#D62839",
        backgroundColor: up ? "var(--color-primary-soft)" : "var(--color-danger-soft)",
        borderRadius: "999px",
        padding: "3px 10px",
      }}
    >
      {up ? <TrendUpIcon /> : <TrendDownIcon />}
      {value}
    </span>
  );
}

// ─── Level Badge ───────────────────────────────────────────────────────────────

function LevelBadge({ level }: { level: string }) {
  const map: Record<string, { bg: string; text: string }> = {
    High: { bg: "#6D6D6D", text: "#fff" },
    Medium: { bg: "#7B7B7B", text: "#fff" },
    Low: { bg: "#8E8E8E", text: "#fff" },
  };
  const { bg, text } = map[level] ?? { bg: "#6D6D6D", text: "#fff" };
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
        padding: "4px 14px",
        lineHeight: "16px",
        whiteSpace: "nowrap",
      }}
    >
      {level}
    </span>
  );
}

// ─── User Activity Chart ───────────────────────────────────────────────────────

type ChartRange = DashboardPeriod;

function UserActivityChart({ activity }: { activity?: AdminDashboardData["activity"] | null }) {
  const chartSource = activity?.items?.length
    ? {
      labels: activity.items.map((item) => item.label),
      data: activity.items.map((item) => item.total),
    }
    : activity?.labels?.length && activity.data?.length
      ? activity
      : { labels: [], data: [] };
  const { labels, data } = chartSource;
  const width = 680;
  const height = 260;
  const padX = 40;
  const padY = 30;
  const safeData = data.length ? data : [0];
  const maxVal = Math.max(6, Math.ceil(Math.max(...safeData)) + 2);
  const chartW = width - padX * 2;
  const chartH = height - padY * 2;

  const points = data.map((v, i) => {
    const ratio = data.length === 1 ? 0.5 : i / (data.length - 1);
    const x = padX + ratio * chartW;
    const y = padY + chartH - (v / maxVal) * chartH;
    return `${x},${y}`;
  });

  const areaPoints = [
    `${padX},${height - padY}`,
    ...points,
    `${width - padX},${height - padY}`,
  ].join(" ");

  const yLabels = Array.from({ length: 7 }, (_, i) => Math.round((maxVal / 6) * i));

  const lineLength = points.reduce((acc, _, i, arr) => {
    if (i === 0) return 0;
    const [x1, y1] = arr[i - 1].split(",").map(Number);
    const [x2, y2] = arr[i].split(",").map(Number);
    return acc + Math.sqrt((x2 - x1) ** 2 + (y2 - y1) ** 2);
  }, 0);

  return (
    <svg width="100%" height="100%" viewBox={`0 0 ${width} ${height + 30}`} style={{ overflow: "visible" }}>
      <style>{`
        @keyframes adminDrawLine { from { stroke-dashoffset: ${lineLength}; } to { stroke-dashoffset: 0; } }
        @keyframes adminFadeIn { from { opacity: 0; transform: translateY(4px); } to { opacity: 1; transform: translateY(0); } }
        @keyframes adminPopIn { 0% { r: 0; } 60% { r: 5; } 100% { r: 3.5; } }
      `}</style>

      {/* Y axis labels & grid */}
      {yLabels.map((v, i) => {
        const y = padY + chartH - (v / maxVal) * chartH;
        return (
          <g key={`y-${i}`} style={{ animation: `adminFadeIn 0.4s ease ${i * 0.04}s both` }}>
            <text x={padX - 14} y={y + 4} textAnchor="end" fontSize="10" fill={"var(--color-muted)"}>{v}</text>
            <line x1={padX} y1={y} x2={width - padX} y2={y} stroke="#EFEFEF" strokeWidth="1" strokeDasharray="4 4" />
          </g>
        );
      })}

      {/* X axis labels */}
      {labels.map((d, i) => {
        const ratio = labels.length === 1 ? 0.5 : i / (labels.length - 1);
        const x = padX + ratio * chartW;
        return (
          <text key={d} x={x} y={height + 16} textAnchor="middle" fontSize="10" fill={"var(--color-foreground)"}
            style={{ animation: `adminFadeIn 0.4s ease ${0.2 + i * 0.04}s both` }}>{d}</text>
        );
      })}

      {/* Area fill */}
      <polygon points={areaPoints} fill={"var(--color-primary-pale)"} opacity="0.8" style={{ animation: `adminFadeIn 0.8s ease 0.3s both` }} />

      {/* Animated Line */}
      <polyline
        points={points.join(" ")}
        fill="none"
        stroke={"var(--color-primary)"}
        strokeWidth="2.5"
        strokeLinejoin="round"
        strokeLinecap="round"
        strokeDasharray={lineLength}
        strokeDashoffset="0"
        style={{ animation: `adminDrawLine 1.2s ease-out 0.3s both` }}
      />

      {/* Animated Dots */}
      {data.map((v, i) => {
        const x = padX + (data.length === 1 ? 0.5 : i / (data.length - 1)) * chartW;
        const y = padY + chartH - (v / maxVal) * chartH;
        return <circle key={i} cx={x} cy={y} r="3.5" fill={"var(--color-primary)"}
          style={{ animation: `adminPopIn 0.4s ease ${0.5 + i * 0.1}s both` }} />;
      })}
    </svg>
  );
}

// ─── Sample Data ───────────────────────────────────────────────────────────────

type TemplateItem = {
  id: string;
  name: string;
  createdAt: string;
  createdBy: string;
  usage: string;
  level: string;
  description: string;
  label: string;
};

// ─── Main Admin Dashboard ──────────────────────────────────────────────────────

type AdminMenu = "dashboard" | "template";

const formatAdminDate = (value?: string) => {
  if (!value) {
    return new Date().toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
  }

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return value;
  }

  return date.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
};

const formatNumber = (value?: number) => (value ?? 0).toLocaleString("en-US");

const formatUsage = (value?: number) => `${formatNumber(value)} Users`;

const mapTimeRangeToPeriod = (value: "Daily" | "Weekly" | "Monthly" | "Yearly"): DashboardPeriod => {
  if (value === "Daily") return "daily";
  if (value === "Monthly") return "monthly";
  if (value === "Yearly") return "yearly";
  return "weekly";
};

const chartRangeLabels: Record<ChartRange, string> = {
  daily: "Today",
  weekly: "This Week",
  monthly: "This Month",
  yearly: "This Year",
};

const periodToTimeRange: Record<ChartRange, "Daily" | "Weekly" | "Monthly" | "Yearly"> = {
  daily: "Daily",
  weekly: "Weekly",
  monthly: "Monthly",
  yearly: "Yearly",
};

const formatMetricTrend = (metric?: DashboardMetric) => {
  if (!metric || metric.trend_percent === 0 || metric.trend_direction === "flat") return "0%";
  const sign = metric.trend_percent > 0 ? "+" : "";
  return `${sign}${metric.trend_percent}%`;
};

const isTrendUp = (metric?: DashboardMetric) => metric?.trend_direction !== "down";

const getErrorText = (error: unknown, fallback: string) => {
  return error instanceof Error ? error.message : fallback;
};

const mapTemplateToAdminItem = (template: TaskTemplate): TemplateItem => ({
  id: template.id,
  name: template.name,
  createdAt: formatAdminDate(template.created_at),
  createdBy:
    template.created_by?.display_name ||
    template.created_by?.email ||
    (template.is_official ? "Bento-do" : "Unknown"),
  usage: formatUsage(template.usage_count),
  level: template.level || "Medium",
  description: template.description || "No description provided.",
  label: template.is_official ? "Official" : template.visibility === "private" ? "Custom" : "Public",
});

export default function AdminDashboardPage() {
  const router = useRouter();
  const [activeMenu, setActiveMenu] = useState<AdminMenu>("dashboard");
  const [chartRange, setChartRange] = useState<ChartRange>("weekly");
  const [chartDropdownOpen, setChartDropdownOpen] = useState(false);
  const [timeRange, setTimeRange] = useState<"Daily" | "Weekly" | "Monthly" | "Yearly">("Weekly");
  const [hoveredRow, setHoveredRow] = useState<number | null>(null);
  const [showNotifications, setShowNotifications] = useState(false);
  const [adminName, setAdminName] = useState("Admin");
  const [dashboardData, setDashboardData] = useState<AdminDashboardData | null>(null);
  const [isLoadingData, setIsLoadingData] = useState(true);
  const [pageError, setPageError] = useState<string | null>(null);

  // ─── Templates List (stateful for deletion) ────────────────────────────────
  const [templates, setTemplates] = useState<TemplateItem[]>([]);

  // ─── Create Template Modal State ────────────────────────────────────────────
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [createdTemplateSummary, setCreatedTemplateSummary] = useState<{ name: string; level: string; taskCount: number } | null>(null);
  const [formError, setFormError] = useState<string | null>(null);
  const [isSavingTemplate, setIsSavingTemplate] = useState(false);
  const [isDeletingTemplate, setIsDeletingTemplate] = useState(false);

  // ─── Detail & Delete Modal State ────────────────────────────────────────────
  const [detailTemplate, setDetailTemplate] = useState<TemplateItem | null>(null);
  const [deleteTemplate, setDeleteTemplate] = useState<TemplateItem | null>(null);

  useEffect(() => {
    let isMounted = true;

    const loadAdminData = async () => {
      const storedUser = getStoredUser();

      if (!hasActiveSession() || !storedUser) {
        router.replace("/login");
        return;
      }

      if (storedUser.role && storedUser.role !== "admin") {
        router.replace("/dashboard");
        return;
      }

      setAdminName(storedUser.display_name || storedUser.email?.split("@")[0] || "Admin");
      setIsLoadingData(true);
      setPageError(null);

      try {
        const [dashboardResponse, templatesResponse] = await Promise.all([
          getAdminDashboard(mapTimeRangeToPeriod(timeRange)),
          getAdminTemplates(1, 50),
        ]);

        if (!isMounted) return;

        setDashboardData(dashboardResponse.data);
        setTemplates(templatesResponse.data.map(mapTemplateToAdminItem));
      } catch (error) {
        if (!isMounted) return;

        setPageError(getErrorText(error, "Gagal memuat data admin."));
      } finally {
        if (isMounted) {
          setIsLoadingData(false);
        }
      }
    };

    void loadAdminData();

    return () => {
      isMounted = false;
    };
  }, [router, timeRange]);

  const handleOpenCreateModal = () => {
    setFormError(null);
    setShowCreateModal(true);
  };

  const handleCreateTemplate = async (payload: CreateTemplateModalPayload) => {
    setIsSavingTemplate(true);
    setFormError(null);

    try {
      const response = await createAdminTemplate({
        name: payload.name,
        description: payload.description,
        level: payload.level,
        items: payload.items,
      });

      setTemplates((prev) => [mapTemplateToAdminItem(response.data), ...prev]);
      setCreatedTemplateSummary({
        name: payload.name,
        level: payload.level,
        taskCount: payload.items.length,
      });
      setShowCreateModal(false);
      setShowSuccessModal(true);
    } catch (error) {
      setFormError(getErrorText(error, "Gagal membuat template."));
    } finally {
      setIsSavingTemplate(false);
    }
  };

  const handleCloseSuccess = () => {
    setShowSuccessModal(false);
  };

  const handleConfirmDelete = async () => {
    if (!deleteTemplate) return;

    setIsDeletingTemplate(true);
    setPageError(null);

    try {
      await deleteAdminTemplate(deleteTemplate.id);

      setTemplates((prev) => prev.filter((t) => t.id !== deleteTemplate.id));
      setDeleteTemplate(null);
    } catch (error) {
      setPageError(getErrorText(error, "Gagal menghapus template."));
    } finally {
      setIsDeletingTemplate(false);
    }
  };

  const handleSignOut = () => {
    clearAuthSession();
    router.push("/login");
  };

  // ─── Sidebar Menu Items ────────────────────────────────────────────────────

  const menuItems = [
    { key: "dashboard" as const, label: "DashBoard", icon: <DashboardIcon /> },
    { key: "template" as const, label: "Template Management", icon: <FolderIcon /> },
  ];

  // ─── Stat Cards Data ───────────────────────────────────────────────────────

  const stats = dashboardData?.stats;
  const metrics = dashboardData?.metrics;
  const statCards = [
    { label: "Guest Users", value: formatNumber(stats?.guest_users), icon: <GuestUserIcon />, trend: formatMetricTrend(metrics?.guest_users), up: isTrendUp(metrics?.guest_users) },
    { label: "Users", value: formatNumber(stats?.users), icon: <UsersGroupIcon />, trend: formatMetricTrend(metrics?.users), up: isTrendUp(metrics?.users) },
    { label: "Task", value: formatNumber(stats?.tasks), icon: <TaskClipIcon />, trend: formatMetricTrend(metrics?.tasks), up: isTrendUp(metrics?.tasks) },
    { label: "Templates", value: formatNumber(stats?.templates), icon: <TemplatesIcon />, trend: formatMetricTrend(metrics?.templates), up: isTrendUp(metrics?.templates) },
  ];

  const timeRangeText = {
    Daily: "from yesterday",
    Weekly: "from last week",
    Monthly: "from last month",
    Yearly: "from last year"
  };

  // ─── Render ────────────────────────────────────────────────────────────────

  return (
    <div style={{ display: "flex", minHeight: "100vh", backgroundColor: "var(--color-surface)", color: "var(--color-foreground)", fontFamily: "inherit" }}>
      <style>{`
        @keyframes adminRingBell {
          0% { transform: rotate(0); }
          10% { transform: rotate(15deg); }
          20% { transform: rotate(-10deg); }
          30% { transform: rotate(5deg); }
          40% { transform: rotate(-5deg); }
          50% { transform: rotate(2deg); }
          60% { transform: rotate(0); }
          100% { transform: rotate(0); }
        }
        .admin-bell-hover:hover svg {
          animation: adminRingBell 0.5s ease-in-out;
          transform-origin: top center;
        }
        @keyframes adminNotifPop {
          from { opacity: 0; transform: translateY(10px) scale(0.95); }
          to { opacity: 1; transform: translateY(0) scale(1); }
        }
      `}</style>

      {/* ═══════════════════════════════════════
          SIDEBAR
      ═══════════════════════════════════════ */}
      <aside
        style={{
          width: "220px",
          minHeight: "100vh",
          backgroundColor: "var(--color-surface)",
          borderRight: `1px solid ${"var(--color-border-soft)"}`,
          display: "flex",
          flexDirection: "column",
          padding: "28px 0 0",
          position: "sticky",
          top: 0,
          flexShrink: 0,
        }}
      >
        {/* Logo */}
        <div style={{ display: "flex", alignItems: "center", gap: "12px", padding: "0 28px", marginBottom: "42px" }}>
          <span
            aria-label="Ben To Do Logo"
            style={{
              width: "36px",
              height: "36px",
              display: "inline-block",
              backgroundColor: "var(--color-primary)",
              WebkitMask: `url('${LOGO_SRC}') center / contain no-repeat`,
              mask: `url('${LOGO_SRC}') center / contain no-repeat`,
              flexShrink: 0,
            }}
          />
          <div>
            <div style={{ fontSize: "15px", fontWeight: 700, color: "var(--color-foreground)", lineHeight: 1.1 }}>Ben To Do</div>
            <div style={{ fontSize: "11px", color: "var(--color-muted)", fontWeight: 400, lineHeight: 1.3 }}>Task Dashboard</div>
          </div>
        </div>

        {/* Menu Label */}
        <div style={{ fontSize: "11px", fontWeight: 600, color: "var(--color-muted)", letterSpacing: "0.05em", padding: "0 28px", marginBottom: "14px", textTransform: "uppercase" }}>
          Menu
        </div>

        {/* Nav Items */}
        <nav style={{ display: "flex", flexDirection: "column", gap: "6px", padding: "0 16px" }}>
          {menuItems.map(({ key, label, icon }) => {
            const isActive = activeMenu === key;
            return (
              <button
                key={key}
                id={`admin-nav-${key}`}
                onClick={() => setActiveMenu(key)}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "10px",
                  height: "42px",
                  padding: "0 16px",
                  borderRadius: "6px",
                  border: isActive ? `2px solid ${"var(--color-primary)"}` : "2px solid transparent",
                  cursor: "pointer",
                  fontFamily: "inherit",
                  fontSize: "13px",
                  fontWeight: isActive ? 600 : 400,
                  color: isActive ? "var(--color-primary)" : "var(--color-muted-dark)",
                  backgroundColor: isActive ? "var(--color-primary-soft)" : "transparent",
                  transition: "all 0.2s ease",
                  width: "100%",
                  textAlign: "left",
                }}
                onMouseEnter={(e) => {
                  if (!isActive) {
                    e.currentTarget.style.backgroundColor = "var(--color-panel)";
                  }
                }}
                onMouseLeave={(e) => {
                  if (!isActive) {
                    e.currentTarget.style.backgroundColor = "transparent";
                  }
                }}
              >
                <span style={{ display: "flex", color: isActive ? "var(--color-primary)" : "var(--color-muted-dark)" }}>
                  {icon}
                </span>
                {label}
              </button>
            );
          })}
        </nav>

        {/* Spacer */}
        <div style={{ flex: 1 }} />

        {/* Sign Out */}
        <div style={{ padding: "22px 16px", borderTop: `1px solid ${"var(--color-border-soft)"}` }}>
          <button
            id="admin-sign-out"
            onClick={handleSignOut}
            style={{
              display: "flex",
              alignItems: "center",
              gap: "10px",
              height: "40px",
              padding: "0 16px",
              borderRadius: "6px",
              border: "none",
              cursor: "pointer",
              fontFamily: "inherit",
              fontSize: "13px",
              fontWeight: 400,
              color: "var(--color-muted-dark)",
              backgroundColor: "transparent",
              transition: "all 0.2s ease",
              width: "100%",
              textAlign: "left",
            }}
            onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = "var(--color-panel)"; }}
            onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = "transparent"; }}
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
            height: "70px",
            padding: "0 36px",
            backgroundColor: "var(--color-surface)",
            borderBottom: `1px solid ${"var(--color-border-soft)"}`,
            position: "sticky",
            top: 0,
            zIndex: 20,
          }}
        >
          <h1 style={{ fontSize: "18px", fontWeight: 500, color: "var(--color-foreground)", margin: 0, letterSpacing: "-0.01em" }}>
            {activeMenu === "dashboard" ? "Dashboard Admin" : "Template Management Admin"}
          </h1>

          {/* Right side: notification + profile */}
          <div style={{ display: "flex", alignItems: "center", gap: "18px" }}>
            <ThemeToggle />

            {/* Notification Bell */}
            <div style={{ position: "relative" }}>
              <button
                id="admin-notification-bell"
                className="admin-bell-hover"
                onClick={() => setShowNotifications(!showNotifications)}
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  width: "36px",
                  height: "36px",
                  borderRadius: "6px",
                  border: `1px solid ${showNotifications ? "var(--color-primary)" : "var(--color-border)"}`,
                  background: showNotifications ? "#f0fdf4" : "none",
                  color: showNotifications ? "var(--color-primary)" : "var(--color-muted-dark)",
                  cursor: "pointer",
                  transition: "all 0.15s",
                }}
                onMouseEnter={(e) => { e.currentTarget.style.borderColor = "var(--color-primary)"; e.currentTarget.style.color = "var(--color-primary)"; }}
                onMouseLeave={(e) => {
                  if (!showNotifications) {
                    e.currentTarget.style.borderColor = "var(--color-border)";
                    e.currentTarget.style.color = "var(--color-muted-dark)";
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
                    top: "46px",
                    right: 0,
                    width: "320px",
                    backgroundColor: "var(--color-surface)",
                    borderRadius: "12px",
                    boxShadow: "0 10px 40px rgba(0,0,0,0.12)",
                    border: `1px solid ${"var(--color-border-soft)"}`,
                    zIndex: 100,
                    animation: "adminNotifPop 0.2s ease-out forwards",
                    overflow: "hidden",
                  }}
                >
                  <div style={{ padding: "16px", borderBottom: `1px solid ${"var(--color-border-soft)"}`, backgroundColor: "var(--color-surface)" }}>
                    <h3 style={{ margin: 0, fontSize: "14px", fontWeight: 600, color: "var(--color-foreground)" }}>Notifications</h3>
                  </div>
                  <div style={{ display: "flex", flexDirection: "column", maxHeight: "300px", overflowY: "auto" }}>
                    <div style={{ padding: "16px", borderBottom: `1px solid ${"var(--color-border-soft)"}` }}>
                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "4px" }}>
                        <div style={{ fontSize: "13px", fontWeight: 600, color: "var(--color-foreground)" }}>System Update v1.2</div>
                        <div style={{ width: "8px", height: "8px", backgroundColor: "var(--color-primary)", borderRadius: "50%", flexShrink: 0, marginTop: "4px" }} />
                      </div>
                      <div style={{ fontSize: "12px", color: "var(--color-muted)", lineHeight: 1.4 }}>Added new template layouts and improved dashboard performance.</div>
                      <div style={{ fontSize: "11px", color: "var(--color-muted-dark)", marginTop: "8px" }}>Just now</div>
                    </div>
                    <div style={{ padding: "16px", backgroundColor: "var(--color-surface)" }}>
                      <div style={{ fontSize: "13px", fontWeight: 500, color: "var(--color-foreground)", marginBottom: "4px" }}>New User Registered</div>
                      <div style={{ fontSize: "12px", color: "var(--color-muted)", lineHeight: 1.4 }}>5 new guest users have joined in the last hour.</div>
                      <div style={{ fontSize: "11px", color: "var(--color-muted-dark)", marginTop: "8px" }}>2 hours ago</div>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Separator */}
            <div style={{ width: "1px", height: "28px", backgroundColor: "var(--color-border-soft)" }} />

            {/* Admin Avatar + Info */}
            <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
              <div
                style={{
                  width: "40px",
                  height: "40px",
                  borderRadius: "50%",
                  background: "linear-gradient(135deg, #3A7C5F 0%, #1B4332 100%)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontSize: "15px",
                  fontWeight: 700,
                  color: "var(--color-surface)",
                  flexShrink: 0,
                  border: "2px solid #e0e0e0",
                }}
              >
                {adminName.charAt(0).toUpperCase()}
              </div>
              <div>
                <div style={{ fontSize: "13px", fontWeight: 700, color: "var(--color-foreground)", lineHeight: 1.2 }}>{adminName}</div>
                <div style={{ fontSize: "10px", color: "var(--color-muted)", lineHeight: 1.3 }}>SuperAdmin</div>
              </div>
            </div>
          </div>
        </header>

        {/* ── Scrollable Content ── */}
        <div style={{ flex: 1, padding: "28px 36px 40px", overflowY: "auto", overflowX: "hidden", backgroundColor: "var(--color-surface)" }}>
          {pageError && (
            <div
              style={{
                marginBottom: "16px",
                padding: "12px 14px",
                borderRadius: "8px",
                border: `1px solid ${"var(--color-danger-soft)"}`,
                backgroundColor: "#FFF5F6",
                color: "var(--color-danger)",
                fontSize: "13px",
                fontWeight: 600,
              }}
            >
              {pageError}
            </div>
          )}

          {isLoadingData && (
            <div
              style={{
                marginBottom: "16px",
                padding: "12px 14px",
                borderRadius: "8px",
                border: `1px solid ${"var(--color-border-soft)"}`,
                backgroundColor: "var(--color-surface)",
                color: "var(--color-muted-dark)",
                fontSize: "13px",
                fontWeight: 600,
              }}
            >
              Loading admin data...
            </div>
          )}

          {/* ═══════════════════════════════════════
              DASHBOARD VIEW
          ═══════════════════════════════════════ */}
          {activeMenu === "dashboard" && (
            <>
              {/* Overview Header */}
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "28px" }}>
                <h2 style={{ fontSize: "24px", fontWeight: 700, color: "var(--color-foreground)", margin: 0 }}>Overview</h2>
                <div
                  style={{
                    display: "flex",
                    borderRadius: "3px",
                    backgroundColor: "var(--color-panel)",
                    padding: "3px",
                    overflow: "hidden",
                  }}
                >
                  {(["Daily", "Weekly", "Monthly", "Yearly"] as const).map((t) => (
                    <button
                      key={t}
                      id={`admin-range-${t.toLowerCase()}`}
                      onClick={() => {
                        setTimeRange(t);
                        setChartRange(mapTimeRangeToPeriod(t));
                      }}
                      style={{
                        width: "72px",
                        height: "34px",
                        fontSize: "12px",
                        fontWeight: timeRange === t ? 600 : 400,
                        fontFamily: "inherit",
                        color: "var(--color-foreground)",
                        backgroundColor: timeRange === t ? "var(--color-surface)" : "transparent",
                        border: "none",
                        borderRadius: timeRange === t ? "4px" : "0",
                        cursor: "pointer",
                        transition: "all 0.2s ease",
                        boxShadow: timeRange === t ? "0 1px 3px rgba(0,0,0,0.08)" : "none",
                      }}
                    >
                      {t}
                    </button>
                  ))}
                </div>
              </div>

              {/* ── Stat Cards ── */}
              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "repeat(4, 1fr)",
                  gap: "20px",
                  marginBottom: "28px",
                }}
              >
                {statCards.map((card, idx) => (
                  <div
                    key={idx}
                    id={`admin-stat-${card.label.toLowerCase().replace(/\s/g, "-")}`}
                    style={{
                      ...CARD_STYLE,
                      padding: "22px 24px",
                      display: "flex",
                      flexDirection: "column",
                      gap: "12px",
                    }}
                  >
                    <div style={{ fontSize: "14px", fontWeight: 500, color: "var(--color-foreground)" }}>{card.label}</div>
                    <div style={{ display: "flex", alignItems: "center", gap: "8px", flexWrap: "wrap" }}>
                      <span style={{ display: "flex", color: "var(--color-foreground)" }}>{card.icon}</span>
                      <span style={{ fontSize: "28px", fontWeight: 700, color: "var(--color-foreground)", lineHeight: 1, letterSpacing: "-0.02em" }}>{card.value}</span>
                      <TrendBadge value={card.trend} up={card.up} />
                    </div>
                    <div style={{ fontSize: "12px", color: "var(--color-muted)" }}>{timeRangeText[timeRange]}</div>
                  </div>
                ))}
              </div>

              {/* ── User Activity Chart ── */}
              <div
                style={{
                  ...CARD_STYLE,
                  padding: "24px 28px",
                  marginBottom: "28px",
                }}
              >
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "8px" }}>
                  <div>
                    <div style={{ fontSize: "16px", fontWeight: 700, color: "var(--color-foreground)", marginBottom: "4px" }}>User Activity</div>
                    <div style={{ fontSize: "12px", color: "var(--color-muted)" }}>Sign-ups over the selected period</div>
                  </div>

                  {/* Chart Range Dropdown */}
                  <div style={{ position: "relative" }}>
                    <button
                      id="admin-chart-range-toggle"
                      onClick={() => setChartDropdownOpen(!chartDropdownOpen)}
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: "8px",
                        height: "34px",
                        padding: "0 14px",
                        borderRadius: "6px",
                        border: `1px solid ${"var(--color-border)"}`,
                        backgroundColor: "var(--color-surface)",
                        fontSize: "12px",
                        color: "var(--color-foreground)",
                        cursor: "pointer",
                        fontFamily: "inherit",
                        transition: "border-color 0.2s, box-shadow 0.2s",
                        borderColor: chartDropdownOpen ? "var(--color-primary)" : "var(--color-border)",
                        boxShadow: chartDropdownOpen ? `0 0 0 2px ${"var(--color-primary-pale)"}` : "none",
                      }}
                    >
                      <CalendarSmIcon />
                      {chartRangeLabels[chartRange]}
                      <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"
                        style={{ transition: "transform 0.2s", transform: chartDropdownOpen ? "rotate(180deg)" : "rotate(0)" }}>
                        <polyline points="6 9 12 15 18 9" />
                      </svg>
                    </button>
                    {chartDropdownOpen && (
                      <div style={{
                        position: "absolute", top: "40px", right: 0, zIndex: 30,
                        backgroundColor: "var(--color-surface)", border: `1px solid ${"var(--color-border)"}`,
                        borderRadius: "8px", boxShadow: "0 4px 20px rgba(0,0,0,0.1)",
                        overflow: "hidden", minWidth: "140px",
                        animation: "fadeSlideDown 0.18s ease",
                      }}>
                        {(["daily", "weekly", "monthly", "yearly"] as ChartRange[]).map((r) => (
                          <button
                            key={r}
                            id={`admin-chart-range-${r}`}
                            onClick={() => {
                              setChartRange(r);
                              setTimeRange(periodToTimeRange[r]);
                              setChartDropdownOpen(false);
                            }}
                            style={{
                              display: "flex", alignItems: "center", gap: "8px",
                              width: "100%", padding: "10px 14px", border: "none",
                              backgroundColor: chartRange === r ? "var(--color-primary-pale)" : "transparent",
                              color: chartRange === r ? "var(--color-primary)" : "var(--color-foreground)",
                              fontSize: "12px", fontWeight: chartRange === r ? 600 : 400,
                              cursor: "pointer", fontFamily: "inherit",
                              transition: "background-color 0.15s",
                            }}
                            onMouseEnter={(e) => { if (chartRange !== r) e.currentTarget.style.backgroundColor = "#f5f5f5"; }}
                            onMouseLeave={(e) => { if (chartRange !== r) e.currentTarget.style.backgroundColor = "transparent"; }}
                          >
                            {chartRange === r && <span style={{ width: "5px", height: "5px", borderRadius: "50%", backgroundColor: "var(--color-primary)" }} />}
                            {chartRangeLabels[r]}
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
                <div style={{ width: "100%", minHeight: "290px" }} key={chartRange}>
                  <UserActivityChart activity={dashboardData?.activity} />
                </div>
              </div>

              {/* ── Recent Templates Table ── */}
              <div style={{ ...CARD_STYLE, overflow: "hidden" }}>
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "20px 28px" }}>
                  <span style={{ fontSize: "16px", fontWeight: 700, color: "var(--color-foreground)" }}>Recent Templates</span>
                  <button
                    id="admin-view-all-templates"
                    onClick={() => setActiveMenu("template")}
                    style={{
                      ...buttonReset,
                      fontSize: "13px",
                      fontWeight: 600,
                      color: "var(--color-primary)",
                      transition: "opacity 0.15s",
                    }}
                    onMouseEnter={(e) => { e.currentTarget.style.opacity = "0.75"; }}
                    onMouseLeave={(e) => { e.currentTarget.style.opacity = "1"; }}
                  >
                    View All
                  </button>
                </div>

                <table style={{ width: "100%", borderCollapse: "collapse", tableLayout: "fixed" }}>
                  <colgroup>
                    <col style={{ width: "35%" }} />
                    <col style={{ width: "18%" }} />
                    <col style={{ width: "17%" }} />
                    <col style={{ width: "14%" }} />
                    <col style={{ width: "16%" }} />
                  </colgroup>
                  <thead>
                    <tr style={{ height: "48px", borderTop: `1px solid ${"var(--color-border-soft)"}`, borderBottom: `1px solid ${"var(--color-border-soft)"}` }}>
                      {["Template Name", "Created By", "Usage", "Level", "Actions"].map((h) => (
                        <th
                          key={h}
                          style={{
                            fontSize: "12px",
                            fontWeight: 700,
                            color: "var(--color-foreground)",
                            textAlign: "left",
                            padding: "0 28px",
                            whiteSpace: "nowrap",
                          }}
                        >
                          {h}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {templates.slice(0, 3).map((tmpl, idx) => (
                      <tr
                        key={tmpl.id}
                        style={{
                          height: "68px",
                          borderBottom: `1px solid ${"var(--color-border-soft)"}`,
                          backgroundColor: hoveredRow === idx ? "var(--color-primary-pale)" : "transparent",
                          transition: "background-color 0.15s",
                        }}
                        onMouseEnter={() => setHoveredRow(idx)}
                        onMouseLeave={() => setHoveredRow(null)}
                      >
                        <td style={{ padding: "0 28px", verticalAlign: "middle" }}>
                          <div>
                            <div style={{ fontSize: "13px", fontWeight: 700, color: "var(--color-foreground)" }}>{tmpl.name}</div>
                            <div style={{ fontSize: "11px", color: "var(--color-muted)", marginTop: "2px" }}>Created on {tmpl.createdAt}</div>
                          </div>
                        </td>
                        <td style={{ padding: "0 28px", verticalAlign: "middle", fontSize: "13px", color: "var(--color-foreground)" }}>{tmpl.createdBy}</td>
                        <td style={{ padding: "0 28px", verticalAlign: "middle", fontSize: "13px", color: "var(--color-foreground)" }}>{tmpl.usage}</td>
                        <td style={{ padding: "0 28px", verticalAlign: "middle" }}>
                          <LevelBadge level={tmpl.level} />
                        </td>
                        <td style={{ padding: "0 28px", verticalAlign: "middle" }}>
                          <div style={{ display: "flex", alignItems: "center", gap: "16px" }}>
                            <button
                              onClick={() => setDetailTemplate(tmpl)}
                              style={{ ...buttonReset, color: "var(--color-muted-dark)", display: "flex", padding: "4px", borderRadius: "4px", transition: "color 0.15s" }}
                              onMouseEnter={(e) => { e.currentTarget.style.color = "var(--color-foreground)"; }}
                              onMouseLeave={(e) => { e.currentTarget.style.color = "var(--color-muted-dark)"; }}
                            >
                              <MoreDotsIcon />
                            </button>
                            <button
                              onClick={() => setDeleteTemplate(tmpl)}
                              style={{ ...buttonReset, color: "var(--color-muted-dark)", display: "flex", padding: "4px", borderRadius: "4px", transition: "color 0.15s" }}
                              onMouseEnter={(e) => { e.currentTarget.style.color = "var(--color-danger)"; }}
                              onMouseLeave={(e) => { e.currentTarget.style.color = "var(--color-muted-dark)"; }}
                            >
                              <TrashIcon />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>

                {/* Show More */}
                <div style={{ display: "flex", justifyContent: "center", padding: "16px 0" }}>
                  <button
                    id="admin-show-more-templates"
                    onClick={() => setActiveMenu("template")}
                    style={{
                      ...buttonReset,
                      fontSize: "13px",
                      fontWeight: 500,
                      color: "var(--color-muted-dark)",
                      padding: "8px 20px",
                      borderRadius: "6px",
                      transition: "all 0.15s",
                    }}
                    onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = "var(--color-panel)"; e.currentTarget.style.color = "var(--color-foreground)"; }}
                    onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = "transparent"; e.currentTarget.style.color = "var(--color-muted-dark)"; }}
                  >
                    Show More Templates
                  </button>
                </div>
              </div>
            </>
          )}

          {/* ═══════════════════════════════════════
              TEMPLATE MANAGEMENT VIEW
          ═══════════════════════════════════════ */}
          {activeMenu === "template" && (
            <>
              {/* Overview Header */}
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "28px" }}>
                <h2 style={{ fontSize: "24px", fontWeight: 700, color: "var(--color-foreground)", margin: 0, fontStyle: "italic" }}>Overview</h2>
                <button
                  id="admin-create-new-template"
                  onClick={handleOpenCreateModal}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "8px",
                    height: "42px",
                    padding: "0 24px",
                    borderRadius: "8px",
                    backgroundColor: "var(--color-primary)",
                    color: "var(--color-background)",
                    fontSize: "13px",
                    fontWeight: 600,
                    border: "none",
                    cursor: "pointer",
                    fontFamily: "inherit",
                    transition: "all 0.2s ease",
                    boxShadow: "0 2px 8px rgba(0,139,31,0.25)",
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.backgroundColor = "var(--color-primary-hover)";
                    e.currentTarget.style.boxShadow = "0 4px 16px rgba(0,139,31,0.35)";
                    e.currentTarget.style.transform = "translateY(-1px)";
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.backgroundColor = "var(--color-primary)";
                    e.currentTarget.style.boxShadow = "0 2px 8px rgba(0,139,31,0.25)";
                    e.currentTarget.style.transform = "translateY(0)";
                  }}
                >
                  <PlusIcon />
                  Create New Template
                </button>
              </div>

              {/* ── Full Templates Table ── */}
              <div style={{ ...CARD_STYLE, overflow: "hidden" }}>
                <table style={{ width: "100%", borderCollapse: "collapse", tableLayout: "fixed" }}>
                  <colgroup>
                    <col style={{ width: "35%" }} />
                    <col style={{ width: "18%" }} />
                    <col style={{ width: "17%" }} />
                    <col style={{ width: "14%" }} />
                    <col style={{ width: "16%" }} />
                  </colgroup>
                  <thead>
                    <tr style={{ height: "52px", borderBottom: `1px solid ${"var(--color-border-soft)"}` }}>
                      {["Template Name", "Created By", "Usage", "Level", "Actions"].map((h) => (
                        <th
                          key={h}
                          style={{
                            fontSize: "12px",
                            fontWeight: 700,
                            color: "var(--color-foreground)",
                            textAlign: "left",
                            padding: "0 28px",
                            whiteSpace: "nowrap",
                          }}
                        >
                          {h}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {templates.map((tmpl, idx) => (
                      <tr
                        key={tmpl.id}
                        id={`admin-template-row-${tmpl.id}`}
                        style={{
                          height: "72px",
                          borderBottom: `1px solid ${"var(--color-border-soft)"}`,
                          backgroundColor: hoveredRow === idx + 100 ? "var(--color-primary-pale)" : "transparent",
                          transition: "background-color 0.15s",
                        }}
                        onMouseEnter={() => setHoveredRow(idx + 100)}
                        onMouseLeave={() => setHoveredRow(null)}
                      >
                        <td style={{ padding: "0 28px", verticalAlign: "middle" }}>
                          <div>
                            <div style={{ fontSize: "13px", fontWeight: 700, color: "var(--color-foreground)" }}>{tmpl.name}</div>
                            <div style={{ fontSize: "11px", color: "var(--color-muted)", marginTop: "2px" }}>Created on {tmpl.createdAt}</div>
                          </div>
                        </td>
                        <td style={{ padding: "0 28px", verticalAlign: "middle", fontSize: "13px", color: "var(--color-foreground)" }}>{tmpl.createdBy}</td>
                        <td style={{ padding: "0 28px", verticalAlign: "middle", fontSize: "13px", color: "var(--color-foreground)" }}>{tmpl.usage}</td>
                        <td style={{ padding: "0 28px", verticalAlign: "middle" }}>
                          <LevelBadge level={tmpl.level} />
                        </td>
                        <td style={{ padding: "0 28px", verticalAlign: "middle" }}>
                          <div style={{ display: "flex", alignItems: "center", gap: "16px" }}>
                            <button
                              onClick={() => setDetailTemplate(tmpl)}
                              style={{ ...buttonReset, color: "var(--color-muted-dark)", display: "flex", padding: "4px", borderRadius: "4px", transition: "color 0.15s" }}
                              onMouseEnter={(e) => { e.currentTarget.style.color = "var(--color-foreground)"; }}
                              onMouseLeave={(e) => { e.currentTarget.style.color = "var(--color-muted-dark)"; }}
                            >
                              <MoreDotsIcon />
                            </button>
                            <button
                              onClick={() => setDeleteTemplate(tmpl)}
                              style={{ ...buttonReset, color: "var(--color-muted-dark)", display: "flex", padding: "4px", borderRadius: "4px", transition: "color 0.15s" }}
                              onMouseEnter={(e) => { e.currentTarget.style.color = "var(--color-danger)"; }}
                              onMouseLeave={(e) => { e.currentTarget.style.color = "var(--color-muted-dark)"; }}
                            >
                              <TrashIcon />
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
        </div>
      </main>

      {/* ═══════════════════════════════════════
          TEMPLATE DETAIL MODAL
      ═══════════════════════════════════════ */}
      {detailTemplate && (
        <div
          id="admin-detail-modal-overlay"
          style={{
            position: "fixed",
            inset: 0,
            backgroundColor: "rgba(0,0,0,0.4)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            zIndex: 1000,
            animation: "adminModalOverlayIn 0.25s ease",
          }}
          onClick={(e) => { if (e.target === e.currentTarget) setDetailTemplate(null); }}
        >
          <div
            id="admin-detail-modal"
            style={{
              backgroundColor: "var(--color-surface)",
              borderRadius: "16px",
              width: "520px",
              maxWidth: "90vw",
              maxHeight: "90vh",
              overflowY: "auto",
              padding: "32px 36px 28px",
              boxShadow: "0 20px 60px rgba(0,0,0,0.2)",
              animation: "adminModalSlideIn 0.3s ease",
              position: "relative",
            }}
          >
            {/* Header */}
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "24px" }}>
              <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                <div style={{
                  width: "40px",
                  height: "40px",
                  borderRadius: "10px",
                  backgroundColor: "var(--color-primary-pale)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                }}>
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke={"var(--color-primary)"} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                    <polyline points="14 2 14 8 20 8" />
                  </svg>
                </div>
                <div>
                  <h2 style={{ fontSize: "18px", fontWeight: 700, color: "var(--color-foreground)", margin: 0 }}>Template Detail</h2>
                  <p style={{ fontSize: "11px", color: "var(--color-muted)", margin: "2px 0 0" }}>View template information</p>
                </div>
              </div>
              <button
                id="admin-detail-modal-close"
                onClick={() => setDetailTemplate(null)}
                style={{
                  ...buttonReset,
                  color: "var(--color-muted-dark)",
                  padding: "4px",
                  borderRadius: "6px",
                  display: "flex",
                  transition: "all 0.15s",
                }}
                onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = "var(--color-panel)"; e.currentTarget.style.color = "var(--color-foreground)"; }}
                onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = "transparent"; e.currentTarget.style.color = "var(--color-muted-dark)"; }}
              >
                <CloseIcon />
              </button>
            </div>

            {/* Template Name */}
            <div style={{
              backgroundColor: "var(--color-primary-pale)",
              borderRadius: "10px",
              padding: "18px 20px",
              marginBottom: "20px",
              borderLeft: `4px solid ${"var(--color-primary)"}`,
            }}>
              <div style={{ fontSize: "10px", fontWeight: 600, color: "var(--color-primary)", textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: "4px" }}>Template Name</div>
              <div style={{ fontSize: "17px", fontWeight: 700, color: "var(--color-foreground)" }}>{detailTemplate.name}</div>
            </div>

            {/* Description */}
            <div style={{ marginBottom: "22px" }}>
              <div style={{ fontSize: "12px", fontWeight: 600, color: "var(--color-muted)", marginBottom: "6px", textTransform: "uppercase", letterSpacing: "0.04em" }}>Description</div>
              <p style={{ fontSize: "13px", color: "var(--color-foreground)", lineHeight: 1.7, margin: 0, padding: "12px 16px", backgroundColor: "#F9F9F9", borderRadius: "8px", border: `1px solid ${"var(--color-border-soft)"}` }}>
                {detailTemplate.description || "No description provided."}
              </p>
            </div>

            {/* Info Grid */}
            <div style={{
              display: "grid",
              gridTemplateColumns: "1fr 1fr",
              gap: "14px",
              marginBottom: "24px",
            }}>
              {[
                { label: "Created By", value: detailTemplate.createdBy, icon: <UsersGroupIcon /> },
                { label: "Created On", value: detailTemplate.createdAt, icon: <CalendarLineIcon /> },
                { label: "Usage", value: detailTemplate.usage, icon: <TaskClipIcon /> },
                { label: "Level", value: detailTemplate.level, icon: <FlagLineIcon /> },
              ].map((item, i) => (
                <div key={i} style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "12px",
                  padding: "14px 16px",
                  borderRadius: "8px",
                  border: `1px solid ${"var(--color-border-soft)"}`,
                  backgroundColor: "var(--color-surface)",
                }}>
                  <span style={{ display: "flex", color: "var(--color-muted)", flexShrink: 0 }}>{item.icon}</span>
                  <div>
                    <div style={{ fontSize: "10px", fontWeight: 600, color: "var(--color-muted)", textTransform: "uppercase", letterSpacing: "0.04em", marginBottom: "2px" }}>{item.label}</div>
                    <div style={{ fontSize: "13px", fontWeight: 700, color: "var(--color-foreground)" }}>{item.value}</div>
                  </div>
                </div>
              ))}
            </div>

            {/* Label Badge */}
            <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "24px" }}>
              <span style={{ fontSize: "12px", fontWeight: 600, color: "var(--color-muted)" }}>Label:</span>
              <span style={{
                display: "inline-flex",
                alignItems: "center",
                gap: "6px",
                padding: "5px 14px",
                borderRadius: "999px",
                fontSize: "12px",
                fontWeight: 600,
                backgroundColor: detailTemplate.label === "Public" ? "var(--color-primary-pale)" : "#FEF3C7",
                color: detailTemplate.label === "Public" ? "var(--color-primary)" : "#92400E",
                border: `1px solid ${detailTemplate.label === "Public" ? "#BBF7D0" : "#FDE68A"}`,
              }}>
                {detailTemplate.label === "Public" ? <GlobeIcon /> : <LockIcon />}
                {detailTemplate.label || "Public"}
              </span>
            </div>

            {/* Close Button */}
            <button
              id="admin-detail-modal-done"
              onClick={() => setDetailTemplate(null)}
              style={{
                width: "100%",
                height: "44px",
                borderRadius: "8px",
                border: `1px solid ${"var(--color-border)"}`,
                backgroundColor: "var(--color-surface)",
                color: "var(--color-foreground)",
                fontSize: "13px",
                fontWeight: 600,
                cursor: "pointer",
                fontFamily: "inherit",
                transition: "all 0.15s",
              }}
              onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = "var(--color-panel)"; }}
              onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = "var(--color-surface)"; }}
            >
              Close
            </button>
          </div>
        </div>
      )}

      {/* ═══════════════════════════════════════
          DELETE CONFIRMATION MODAL
      ═══════════════════════════════════════ */}
      {deleteTemplate && (
        <div
          id="admin-delete-modal-overlay"
          style={{
            position: "fixed",
            inset: 0,
            backgroundColor: "rgba(0,0,0,0.45)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            zIndex: 1000,
            animation: "adminModalOverlayIn 0.25s ease",
          }}
          onClick={(e) => { if (e.target === e.currentTarget) setDeleteTemplate(null); }}
        >
          <div
            id="admin-delete-modal"
            style={{
              backgroundColor: "var(--color-surface)",
              borderRadius: "16px",
              width: "420px",
              maxWidth: "90vw",
              padding: "32px 32px 28px",
              boxShadow: "0 20px 60px rgba(0,0,0,0.2)",
              animation: "adminSuccessPop 0.35s ease",
              position: "relative",
              textAlign: "center",
            }}
          >
            {/* Warning Icon */}
            <div style={{
              width: "64px",
              height: "64px",
              borderRadius: "50%",
              backgroundColor: "var(--color-danger-soft)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              margin: "0 auto 20px",
            }}>
              <svg width="30" height="30" viewBox="0 0 24 24" fill="none" stroke="#EF4444" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="3 6 5 6 21 6" />
                <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
                <line x1="10" y1="11" x2="10" y2="17" />
                <line x1="14" y1="11" x2="14" y2="17" />
              </svg>
            </div>

            {/* Title */}
            <h2 style={{ fontSize: "18px", fontWeight: 700, color: "var(--color-foreground)", margin: "0 0 8px" }}>
              Delete Template?
            </h2>
            <p style={{ fontSize: "13px", color: "var(--color-muted)", margin: "0 0 8px", lineHeight: 1.5 }}>
              Are you sure you want to delete
            </p>

            {/* Template name highlight */}
            <div style={{
              display: "inline-flex",
              alignItems: "center",
              gap: "8px",
              padding: "8px 16px",
              borderRadius: "8px",
              backgroundColor: "#FEF2F2",
              border: "1px solid #FECACA",
              marginBottom: "16px",
            }}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#EF4444" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                <polyline points="14 2 14 8 20 8" />
              </svg>
              <span style={{ fontSize: "13px", fontWeight: 700, color: "var(--color-danger)" }}>&ldquo;{deleteTemplate.name}&rdquo;</span>
            </div>

            <p style={{ fontSize: "12px", color: "var(--color-muted)", margin: "0 0 28px", lineHeight: 1.5 }}>
              This action cannot be undone. All data associated<br />with this template will be permanently removed.
            </p>

            {/* Action Buttons */}
            <div style={{ display: "flex", gap: "12px" }}>
              <button
                id="admin-delete-cancel"
                onClick={() => setDeleteTemplate(null)}
                style={{
                  flex: 1,
                  height: "44px",
                  borderRadius: "8px",
                  border: `1px solid ${"var(--color-border)"}`,
                  backgroundColor: "var(--color-surface)",
                  color: "var(--color-foreground)",
                  fontSize: "13px",
                  fontWeight: 600,
                  cursor: "pointer",
                  fontFamily: "inherit",
                  transition: "all 0.15s",
                }}
                onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = "var(--color-panel)"; }}
                onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = "var(--color-surface)"; }}
              >
                No, Cancel
              </button>
              <button
                id="admin-delete-confirm"
                onClick={handleConfirmDelete}
                disabled={isDeletingTemplate}
                style={{
                  flex: 1,
                  height: "44px",
                  borderRadius: "8px",
                  border: "none",
                  backgroundColor: isDeletingTemplate ? "var(--color-muted)" : "#EF4444",
                  color: "var(--color-background)",
                  fontSize: "13px",
                  fontWeight: 600,
                  cursor: isDeletingTemplate ? "not-allowed" : "pointer",
                  fontFamily: "inherit",
                  transition: "all 0.2s ease",
                  boxShadow: isDeletingTemplate ? "none" : "0 2px 8px rgba(239,68,68,0.3)",
                }}
                onMouseEnter={(e) => {
                  if (isDeletingTemplate) return;
                  e.currentTarget.style.backgroundColor = "var(--color-danger)";
                  e.currentTarget.style.transform = "translateY(-1px)";
                  e.currentTarget.style.boxShadow = "0 4px 16px rgba(239,68,68,0.4)";
                }}
                onMouseLeave={(e) => {
                  if (isDeletingTemplate) return;
                  e.currentTarget.style.backgroundColor = "#EF4444";
                  e.currentTarget.style.transform = "translateY(0)";
                  e.currentTarget.style.boxShadow = "0 2px 8px rgba(239,68,68,0.3)";
                }}
              >
                {isDeletingTemplate ? "Deleting..." : "Yes, Delete"}
              </button>
            </div>
          </div>
        </div>
      )}

      <CreateTemplateModal
        key={showCreateModal ? "admin-create-open" : "admin-create-closed"}
        mode="admin"
        open={showCreateModal}
        isSubmitting={isSavingTemplate}
        error={formError}
        onClose={() => {
          setFormError(null);
          setShowCreateModal(false);
        }}
        onSubmit={handleCreateTemplate}
      />

      {/* ═══════════════════════════════════════
          SUCCESS MODAL
      ═══════════════════════════════════════ */}
      {showSuccessModal && (
        <div
          id="admin-success-modal-overlay"
          style={{
            position: "fixed",
            inset: 0,
            backgroundColor: "rgba(0,0,0,0.4)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            zIndex: 1000,
            animation: "adminModalOverlayIn 0.25s ease",
          }}
          onClick={(e) => { if (e.target === e.currentTarget) handleCloseSuccess(); }}
        >
          <div
            id="admin-success-modal"
            style={{
              backgroundColor: "var(--color-surface)",
              borderRadius: "16px",
              width: "420px",
              maxWidth: "90vw",
              padding: "36px 36px 32px",
              boxShadow: "0 20px 60px rgba(0,0,0,0.2)",
              animation: "adminSuccessPop 0.4s ease",
              position: "relative",
              textAlign: "center",
            }}
          >
            {/* Close */}
            <button
              id="admin-success-modal-close"
              onClick={handleCloseSuccess}
              style={{
                ...buttonReset,
                position: "absolute",
                top: "16px",
                right: "16px",
                color: "var(--color-muted-dark)",
                padding: "4px",
                borderRadius: "6px",
                display: "flex",
                transition: "all 0.15s",
              }}
              onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = "var(--color-panel)"; e.currentTarget.style.color = "var(--color-foreground)"; }}
              onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = "transparent"; e.currentTarget.style.color = "var(--color-muted-dark)"; }}
            >
              <CloseIcon />
            </button>

            {/* Success Icon */}
            <div style={{ display: "flex", justifyContent: "center", marginBottom: "20px", position: "relative" }}>
              <div style={{ position: "relative" }}>
                <SuccessCheckIcon />
                <div style={{ position: "absolute", top: "-6px", right: "-8px" }}>
                  <SparkleIcon />
                </div>
              </div>
            </div>

            {/* Title */}
            <h2 style={{ fontSize: "20px", fontWeight: 700, color: "var(--color-foreground)", margin: "0 0 6px" }}>
              Template added successfully!
            </h2>
            <p style={{ fontSize: "12px", color: "var(--color-muted)", margin: "0 0 24px" }}>
              All tasks have been added to your task list.
            </p>

            {/* Summary Card */}
            <div style={{
              border: `1px solid ${"var(--color-border-soft)"}`,
              borderRadius: "10px",
              padding: "20px",
              textAlign: "left",
              marginBottom: "24px",
            }}>
              {/* Template Title */}
              <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "18px" }}>
                <CheckCircleSolidIcon />
                <span style={{ fontSize: "15px", fontWeight: 700, color: "var(--color-foreground)" }}>{createdTemplateSummary?.name || "Template"}</span>
              </div>

              {/* Details */}
              <div style={{ display: "flex", flexDirection: "column", gap: "14px" }}>
                {/* Deadline */}
                <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                  <CalendarLineIcon />
                  <span style={{ fontSize: "13px", color: "var(--color-muted)", minWidth: "80px" }}>Tasks</span>
                  <span style={{ fontSize: "13px", color: "var(--color-muted)", marginRight: "4px" }}>:</span>
                  <span style={{ fontSize: "13px", fontWeight: 700, color: "var(--color-foreground)" }}>
                    {createdTemplateSummary?.taskCount ?? 0} tasks
                  </span>
                </div>

                {/* Level Task */}
                <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                  <FlagLineIcon />
                  <span style={{ fontSize: "13px", color: "var(--color-muted)", minWidth: "80px" }}>Level Task</span>
                  <span style={{ fontSize: "13px", color: "var(--color-muted)", marginRight: "4px" }}>:</span>
                  <span style={{ fontSize: "13px", fontWeight: 700, color: "var(--color-foreground)" }}>{createdTemplateSummary?.level ?? "Medium"}</span>
                </div>

                {/* Label */}
                <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                  <PlayTriangleIcon />
                  <span style={{ fontSize: "13px", color: "var(--color-muted)", minWidth: "80px" }}>Label</span>
                  <span style={{ fontSize: "13px", color: "var(--color-muted)", marginRight: "4px" }}>:</span>
                  <span style={{ fontSize: "13px", fontWeight: 700, color: "var(--color-foreground)" }}>Official</span>
                </div>
              </div>
            </div>

            {/* View Template Button */}
            <button
              id="admin-success-view-template"
              onClick={handleCloseSuccess}
              style={{
                width: "100%",
                height: "46px",
                borderRadius: "8px",
                border: "none",
                backgroundColor: "var(--color-primary)",
                color: "var(--color-background)",
                fontSize: "14px",
                fontWeight: 600,
                cursor: "pointer",
                fontFamily: "inherit",
                transition: "all 0.2s ease",
                boxShadow: "0 2px 8px rgba(0,139,31,0.25)",
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.backgroundColor = "var(--color-primary-hover)";
                e.currentTarget.style.transform = "translateY(-1px)";
                e.currentTarget.style.boxShadow = "0 4px 16px rgba(0,139,31,0.35)";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = "var(--color-primary)";
                e.currentTarget.style.transform = "translateY(0)";
                e.currentTarget.style.boxShadow = "0 2px 8px rgba(0,139,31,0.25)";
              }}
            >
              View Template
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
