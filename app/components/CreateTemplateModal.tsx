"use client";

import { useMemo, useState } from "react";
import type { EnergyWeight } from "../lib/api";

const NAME_LIMIT = 60;
const DESCRIPTION_LIMIT = 500;
const TASK_NAME_LIMIT = 120;
const TASK_DESCRIPTION_LIMIT = 500;

type DraftTaskLevel = "EASY" | "MEDIUM" | "HARD";
type TemplateLevel = "Low" | "Medium" | "High";
type Visibility = "public" | "private";

type DraftTask = {
  title: string;
  description: string;
  level: DraftTaskLevel;
};

export type CreateTemplateModalPayload = {
  name: string;
  description: string;
  visibility?: Visibility;
  level: TemplateLevel;
  items: {
    title: string;
    description: string;
    energy_weight: EnergyWeight;
  }[];
};

type CreateTemplateModalProps = {
  mode: "user" | "admin";
  open: boolean;
  isSubmitting?: boolean;
  error?: string | null;
  onClose: () => void;
  onSubmit: (payload: CreateTemplateModalPayload) => void | Promise<void>;
};

const COLORS = {
  primary: "#008B1F",
  primaryHover: "#007A1B",
  primaryPale: "#ECFFF0",
  border: "#D9D9D9",
  borderSoft: "#E5E7EB",
  surface: "#FFFFFF",
  panel: "#F8F8F8",
  text: "#111827",
  muted: "#9CA3AF",
  mutedDark: "#6B7280",
  danger: "#DC2626",
};

const emptyTask = (): DraftTask => ({
  title: "",
  description: "",
  level: "EASY",
});

const taskLevelToEnergy = (level: DraftTaskLevel): EnergyWeight => {
  if (level === "HARD") return "Berat";
  if (level === "MEDIUM") return "Sedang";
  return "Ringan";
};

const deriveTemplateLevel = (tasks: DraftTask[]): TemplateLevel => {
  if (tasks.some((task) => task.level === "HARD")) return "High";
  if (tasks.some((task) => task.level === "MEDIUM")) return "Medium";
  return "Low";
};

const levelTone = (level: DraftTaskLevel) => {
  if (level === "HARD") {
    return { bg: "#FEE2E2", text: "#DC2626", border: "#FCA5A5" };
  }

  if (level === "MEDIUM") {
    return { bg: "#FFEDD5", text: "#F97316", border: "#FDBA74" };
  }

  return { bg: "#DCFCE7", text: "#008B1F", border: "#22C55E" };
};

const DocIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
    <polyline points="14 2 14 8 20 8" />
  </svg>
);

const DescIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <line x1="3" y1="6" x2="21" y2="6" />
    <line x1="3" y1="12" x2="21" y2="12" />
    <line x1="3" y1="18" x2="15" y2="18" />
  </svg>
);

const DragIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="#9CA3AF">
    <circle cx="9" cy="6" r="1.5" />
    <circle cx="15" cy="6" r="1.5" />
    <circle cx="9" cy="12" r="1.5" />
    <circle cx="15" cy="12" r="1.5" />
    <circle cx="9" cy="18" r="1.5" />
    <circle cx="15" cy="18" r="1.5" />
  </svg>
);

const ChevronIcon = ({ open }: { open: boolean }) => (
  <svg
    width="14"
    height="14"
    viewBox="0 0 24 24"
    fill="none"
    stroke="#6B7280"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    style={{
      transform: open ? "rotate(180deg)" : "rotate(0deg)",
      transition: "transform 220ms ease",
    }}
  >
    <polyline points="6 9 12 15 18 9" />
  </svg>
);

const GlobeIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="12" cy="12" r="10" />
    <line x1="2" y1="12" x2="22" y2="12" />
    <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z" />
  </svg>
);

const LockIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
    <path d="M7 11V7a5 5 0 0 1 10 0v4" />
  </svg>
);

const ShieldIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
    <path d="m9 12 2 2 4-4" />
  </svg>
);

export default function CreateTemplateModal({
  mode,
  open,
  isSubmitting = false,
  error,
  onClose,
  onSubmit,
}: CreateTemplateModalProps) {
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [visibility, setVisibility] = useState<Visibility>("private");
  const [tasks, setTasks] = useState<DraftTask[]>([]);
  const [expandedIndex, setExpandedIndex] = useState<number | null>(null);
  const [localError, setLocalError] = useState<string | null>(null);

  const validTasks = useMemo(
    () =>
      tasks
        .map((task) => ({
          ...task,
          title: task.title.trim(),
          description: task.description.trim(),
        }))
        .filter((task) => task.title),
    [tasks],
  );

  if (!open) return null;

  const addTask = () => {
    setTasks((current) => {
      const next = [...current, emptyTask()];
      setExpandedIndex(next.length - 1);
      return next;
    });
  };

  const updateTask = (index: number, patch: Partial<DraftTask>) => {
    setTasks((current) =>
      current.map((task, taskIndex) =>
        taskIndex === index ? { ...task, ...patch } : task,
      ),
    );
  };

  const removeTask = (index: number) => {
    setTasks((current) => current.filter((_, taskIndex) => taskIndex !== index));
    setExpandedIndex(null);
  };

  const handleSubmit = async () => {
    const trimmedName = name.trim();

    if (!trimmedName) {
      setLocalError("Template name wajib diisi.");
      return;
    }

    if (!validTasks.length) {
      setLocalError("Minimal tambahkan 1 task template.");
      return;
    }

    setLocalError(null);

    await onSubmit({
      name: trimmedName,
      description: description.trim(),
      visibility: mode === "user" ? visibility : undefined,
      level: deriveTemplateLevel(validTasks),
      items: validTasks.map((task) => ({
        title: task.title,
        description: task.description,
        energy_weight: taskLevelToEnergy(task.level),
      })),
    });
  };

  const canSubmit = !!name.trim() && validTasks.length > 0 && !isSubmitting;
  const shownError = localError || error;

  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        backgroundColor: "rgba(0, 0, 0, 0.34)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        zIndex: 1000,
        padding: "20px",
        animation: "templateOverlayIn 180ms ease-out both",
      }}
      onClick={(event) => {
        if (event.target === event.currentTarget && !isSubmitting) onClose();
      }}
    >
      <style>{`
        @keyframes templateOverlayIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }

        @keyframes templateModalIn {
          from { opacity: 0; transform: translateY(14px) scale(0.985); }
          to { opacity: 1; transform: translateY(0) scale(1); }
        }
      `}</style>

      <div
        style={{
          width: "100%",
          maxWidth: "640px",
          maxHeight: "92vh",
          overflowY: "auto",
          backgroundColor: COLORS.surface,
          borderRadius: "8px",
          boxShadow: "0 24px 70px rgba(0,0,0,0.22)",
          padding: "24px",
          position: "relative",
          animation: "templateModalIn 220ms ease-out both",
        }}
      >
        <button
          onClick={onClose}
          disabled={isSubmitting}
          style={{
            position: "absolute",
            top: "20px",
            right: "20px",
            border: "none",
            background: "none",
            color: COLORS.mutedDark,
            cursor: isSubmitting ? "not-allowed" : "pointer",
            padding: "4px",
            display: "flex",
          }}
          aria-label="Close create template modal"
        >
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
            <line x1="18" y1="6" x2="6" y2="18" />
            <line x1="6" y1="6" x2="18" y2="18" />
          </svg>
        </button>

        <h2 style={{ margin: "0 0 4px", color: COLORS.text, fontSize: "24px", lineHeight: 1.15, fontWeight: 800 }}>
          Create Template
        </h2>
        <p style={{ margin: "0 0 22px", color: COLORS.mutedDark, fontSize: "13px", lineHeight: 1.4 }}>
          Create a template according to your needs.
        </p>

        {shownError && (
          <div
            style={{
              marginBottom: "18px",
              padding: "11px 13px",
              borderRadius: "8px",
              border: "1px solid #FECACA",
              backgroundColor: "#FFF5F6",
              color: "#B91C1C",
              fontSize: "12px",
              fontWeight: 600,
            }}
          >
            {shownError}
          </div>
        )}

        <div style={{ fontSize: "11px", fontWeight: 800, color: COLORS.muted, letterSpacing: "0.08em", marginBottom: "14px" }}>
          GENERAL INFORMATION
        </div>

        <label style={{ display: "block", fontSize: "13px", fontWeight: 700, color: COLORS.text, marginBottom: "8px" }}>
          Template Name <span style={{ color: COLORS.danger }}>*</span>
        </label>
        <div style={{ position: "relative", marginBottom: "18px" }}>
          <span style={{ position: "absolute", left: "13px", top: "50%", transform: "translateY(-50%)", color: COLORS.muted, display: "flex" }}>
            <DocIcon />
          </span>
          <input
            value={name}
            onChange={(event) => setName(event.target.value.slice(0, NAME_LIMIT))}
            placeholder="Skripsi"
            maxLength={NAME_LIMIT}
            style={{
              width: "100%",
              height: "42px",
              borderRadius: "6px",
              border: `1px solid ${COLORS.border}`,
              padding: "0 56px 0 40px",
              color: COLORS.text,
              fontSize: "13px",
              fontFamily: "inherit",
              outline: "none",
              boxSizing: "border-box",
            }}
          />
          <span style={{ position: "absolute", right: "13px", top: "50%", transform: "translateY(-50%)", color: COLORS.primary, fontSize: "11px" }}>
            {name.length}/{NAME_LIMIT}
          </span>
        </div>

        <label style={{ display: "block", fontSize: "13px", fontWeight: 700, color: COLORS.text, marginBottom: "8px" }}>
          Description
        </label>
        <div style={{ position: "relative", marginBottom: "24px" }}>
          <span style={{ position: "absolute", left: "13px", top: "13px", color: COLORS.muted, display: "flex" }}>
            <DescIcon />
          </span>
          <textarea
            value={description}
            onChange={(event) => setDescription(event.target.value.slice(0, DESCRIPTION_LIMIT))}
            placeholder="Organize your thesis workflow efficiently with structured tasks, milestone tracking, deadlines, and progress monitoring from research proposal to final defense."
            maxLength={DESCRIPTION_LIMIT}
            rows={3}
            style={{
              width: "100%",
              minHeight: "76px",
              borderRadius: "6px",
              border: `1px solid ${COLORS.border}`,
              padding: "12px 42px 18px 40px",
              color: COLORS.text,
              fontSize: "12px",
              lineHeight: 1.45,
              fontFamily: "inherit",
              outline: "none",
              resize: "vertical",
              boxSizing: "border-box",
            }}
          />
          <span style={{ position: "absolute", right: "13px", bottom: "9px", color: COLORS.primary, fontSize: "11px" }}>
            {description.length}/{DESCRIPTION_LIMIT}
          </span>
        </div>

        <div style={{ height: "1px", backgroundColor: COLORS.border, opacity: 0.8, marginBottom: "22px" }} />

        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "12px" }}>
          <span style={{ fontSize: "11px", fontWeight: 800, color: COLORS.muted, letterSpacing: "0.08em" }}>
            TEMPLATE TASKS ({tasks.length})
          </span>
          <button
            onClick={addTask}
            type="button"
            style={{
              border: "none",
              background: "none",
              color: COLORS.primary,
              cursor: "pointer",
              fontFamily: "inherit",
              fontSize: "12px",
              fontWeight: 800,
              padding: 0,
            }}
          >
            + Add Task
          </button>
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: "10px", marginBottom: "22px" }}>
          {tasks.length === 0 && (
            <div
              style={{
                padding: "20px",
                textAlign: "center",
                color: COLORS.muted,
                fontSize: "13px",
                border: `1px dashed ${COLORS.borderSoft}`,
                borderRadius: "8px",
                backgroundColor: "#FAFAFA",
              }}
            >
              No tasks added yet. Click &quot;+ Add Task&quot; to get started.
            </div>
          )}

          {tasks.map((task, index) => {
            const isOpen = expandedIndex === index;
            const tone = levelTone(task.level);

            return (
              <div
                key={index}
                style={{
                  border: `1px solid ${isOpen ? COLORS.primary : COLORS.border}`,
                  borderRadius: "8px",
                  overflow: "hidden",
                  backgroundColor: COLORS.surface,
                  boxShadow: isOpen ? "0 0 0 1px rgba(0,139,31,0.08)" : "none",
                  transition: "border-color 180ms ease, box-shadow 180ms ease",
                }}
              >
                <button
                  type="button"
                  onClick={() => setExpandedIndex(isOpen ? null : index)}
                  style={{
                    width: "100%",
                    minHeight: "42px",
                    border: "none",
                    borderBottom: isOpen ? `1px solid ${COLORS.borderSoft}` : "1px solid transparent",
                    backgroundColor: COLORS.surface,
                    display: "flex",
                    alignItems: "center",
                    gap: "10px",
                    padding: "10px 14px",
                    cursor: "pointer",
                    fontFamily: "inherit",
                    transition: "border-color 180ms ease",
                  }}
                >
                  <DragIcon />
                  <span style={{ flex: 1, textAlign: "left", color: COLORS.text, fontSize: "13px", fontWeight: 700 }}>
                    {task.title.trim() || `Task ${index + 1}`}
                  </span>
                  <span
                    style={{
                      color: tone.text,
                      backgroundColor: tone.bg,
                      borderRadius: "5px",
                      padding: "3px 9px",
                      fontSize: "9px",
                      fontWeight: 800,
                      letterSpacing: "0.04em",
                    }}
                  >
                    {task.level}
                  </span>
                  <ChevronIcon open={isOpen} />
                </button>

                <div
                  style={{
                    maxHeight: isOpen ? "360px" : "0px",
                    opacity: isOpen ? 1 : 0,
                    overflow: "hidden",
                    transform: isOpen ? "translateY(0)" : "translateY(-4px)",
                    transition: "max-height 260ms ease, opacity 180ms ease, transform 220ms ease",
                  }}
                >
                  <div style={{ padding: "14px" }}>
                    <label style={{ display: "block", fontSize: "11px", fontWeight: 700, color: COLORS.text, marginBottom: "6px" }}>
                      Task Title
                    </label>
                    <input
                      value={task.title}
                      onChange={(event) => updateTask(index, { title: event.target.value.slice(0, TASK_NAME_LIMIT) })}
                      placeholder="Literature Review"
                      maxLength={TASK_NAME_LIMIT}
                      style={{
                        width: "100%",
                        height: "34px",
                        borderRadius: "5px",
                        border: `1px solid ${COLORS.border}`,
                        padding: "0 10px",
                        boxSizing: "border-box",
                        fontFamily: "inherit",
                        fontSize: "12px",
                        outline: "none",
                        marginBottom: "12px",
                      }}
                    />

                    <label style={{ display: "block", fontSize: "11px", fontWeight: 700, color: COLORS.text, marginBottom: "6px" }}>
                      Task Description
                    </label>
                    <textarea
                      value={task.description}
                      onChange={(event) => updateTask(index, { description: event.target.value.slice(0, TASK_DESCRIPTION_LIMIT) })}
                      placeholder="Reviewing existing research and publications related to the topic."
                      maxLength={TASK_DESCRIPTION_LIMIT}
                      rows={2}
                      style={{
                        width: "100%",
                        minHeight: "48px",
                        borderRadius: "5px",
                        border: `1px solid ${COLORS.border}`,
                        padding: "9px 10px",
                        boxSizing: "border-box",
                        fontFamily: "inherit",
                        fontSize: "12px",
                        lineHeight: 1.35,
                        outline: "none",
                        resize: "vertical",
                        marginBottom: "12px",
                      }}
                    />

                    <label style={{ display: "block", fontSize: "11px", fontWeight: 700, color: COLORS.text, marginBottom: "8px" }}>
                      Task Level
                    </label>
                    <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: "8px", marginBottom: "12px" }}>
                      {(["EASY", "MEDIUM", "HARD"] as const).map((level) => {
                        const currentTone = levelTone(level);
                        const selected = task.level === level;

                        return (
                          <button
                            key={level}
                            type="button"
                            onClick={() => updateTask(index, { level })}
                            style={{
                              height: "28px",
                              borderRadius: "5px",
                              border: `1px solid ${selected ? currentTone.text : COLORS.border}`,
                              backgroundColor: selected ? "#FFFFFF" : "#FAFAFA",
                              color: selected ? currentTone.text : COLORS.mutedDark,
                              fontFamily: "inherit",
                              fontSize: "11px",
                              fontWeight: 700,
                              cursor: "pointer",
                              transition: "all 160ms ease",
                            }}
                          >
                            {level === "EASY" ? "Easy" : level === "MEDIUM" ? "Medium" : "Hard"}
                          </button>
                        );
                      })}
                    </div>

                    <button
                      type="button"
                      onClick={() => removeTask(index)}
                      style={{
                        border: "none",
                        background: "none",
                        color: COLORS.danger,
                        cursor: "pointer",
                        fontFamily: "inherit",
                        fontSize: "12px",
                        fontWeight: 700,
                        padding: 0,
                      }}
                    >
                      Remove Task
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        <div style={{ height: "1px", backgroundColor: COLORS.border, opacity: 0.8, marginBottom: "20px" }} />

        <div style={{ fontSize: "11px", fontWeight: 800, color: COLORS.muted, letterSpacing: "0.08em", marginBottom: "12px" }}>
          {mode === "admin" ? "TEMPLATE LABEL" : "VISIBILITY LABEL"} <span style={{ color: COLORS.danger }}>*</span>
        </div>

        {mode === "user" ? (
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px", marginBottom: "26px" }}>
            {([
              {
                value: "public" as const,
                label: "Public",
                description: "Anyone in your workspace can view and use",
                icon: <GlobeIcon />,
              },
              {
                value: "private" as const,
                label: "Custom (Private)",
                description: "Only you can view and use this template",
                icon: <LockIcon />,
              },
            ]).map((option) => {
              const selected = visibility === option.value;

              return (
                <button
                  key={option.value}
                  type="button"
                  onClick={() => setVisibility(option.value)}
                  style={{
                    minHeight: "72px",
                    borderRadius: "8px",
                    border: `1px solid ${selected ? COLORS.primary : COLORS.border}`,
                    backgroundColor: selected ? COLORS.primaryPale : COLORS.surface,
                    display: "flex",
                    alignItems: "center",
                    gap: "12px",
                    padding: "12px",
                    textAlign: "left",
                    cursor: "pointer",
                    fontFamily: "inherit",
                  }}
                >
                  <span
                    style={{
                      width: "36px",
                      height: "36px",
                      borderRadius: "8px",
                      color: selected ? COLORS.primary : COLORS.mutedDark,
                      backgroundColor: selected ? "#DFFFE6" : "#F3F4F6",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      flexShrink: 0,
                    }}
                  >
                    {option.icon}
                  </span>
                  <span style={{ flex: 1, minWidth: 0 }}>
                    <span style={{ display: "block", color: COLORS.text, fontSize: "13px", fontWeight: 800, marginBottom: "2px" }}>
                      {option.label}
                    </span>
                    <span style={{ display: "block", color: COLORS.mutedDark, fontSize: "10px", lineHeight: 1.3 }}>
                      {option.description}
                    </span>
                  </span>
                  <span
                    style={{
                      width: "18px",
                      height: "18px",
                      borderRadius: "50%",
                      border: `2px solid ${selected ? COLORS.primary : "#CBD5E1"}`,
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      flexShrink: 0,
                    }}
                  >
                    {selected && <span style={{ width: "8px", height: "8px", borderRadius: "50%", backgroundColor: COLORS.primary }} />}
                  </span>
                </button>
              );
            })}
          </div>
        ) : (
          <div
            style={{
              minHeight: "72px",
              borderRadius: "8px",
              border: `1px solid ${COLORS.primary}`,
              backgroundColor: COLORS.primaryPale,
              display: "flex",
              alignItems: "center",
              gap: "12px",
              padding: "12px",
              marginBottom: "26px",
            }}
          >
            <span
              style={{
                width: "36px",
                height: "36px",
                borderRadius: "8px",
                color: COLORS.primary,
                backgroundColor: "#DFFFE6",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                flexShrink: 0,
              }}
            >
              <ShieldIcon />
            </span>
            <span style={{ flex: 1 }}>
              <span style={{ display: "block", color: COLORS.text, fontSize: "13px", fontWeight: 800, marginBottom: "2px" }}>
                Official
              </span>
              <span style={{ display: "block", color: COLORS.mutedDark, fontSize: "10px", lineHeight: 1.3 }}>
                Created by admin and visible to all users.
              </span>
            </span>
            <span
              style={{
                width: "18px",
                height: "18px",
                borderRadius: "50%",
                border: `2px solid ${COLORS.primary}`,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                flexShrink: 0,
              }}
            >
              <span style={{ width: "8px", height: "8px", borderRadius: "50%", backgroundColor: COLORS.primary }} />
            </span>
          </div>
        )}

        <div style={{ display: "flex", justifyContent: "flex-end", gap: "12px" }}>
          <button
            type="button"
            onClick={onClose}
            disabled={isSubmitting}
            style={{
              width: "110px",
              height: "40px",
              borderRadius: "6px",
              border: `1px solid ${COLORS.border}`,
              backgroundColor: COLORS.surface,
              color: COLORS.mutedDark,
              cursor: isSubmitting ? "not-allowed" : "pointer",
              fontFamily: "inherit",
              fontSize: "13px",
              fontWeight: 600,
            }}
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={() => {
              void handleSubmit();
            }}
            disabled={!canSubmit}
            style={{
              minWidth: "148px",
              height: "40px",
              borderRadius: "6px",
              border: "none",
              backgroundColor: canSubmit ? COLORS.primary : "#A7A7A7",
              color: COLORS.surface,
              cursor: canSubmit ? "pointer" : "not-allowed",
              fontFamily: "inherit",
              fontSize: "13px",
              fontWeight: 700,
              boxShadow: canSubmit ? "0 8px 18px rgba(0,139,31,0.18)" : "none",
            }}
            onMouseEnter={(event) => {
              if (canSubmit) event.currentTarget.style.backgroundColor = COLORS.primaryHover;
            }}
            onMouseLeave={(event) => {
              if (canSubmit) event.currentTarget.style.backgroundColor = COLORS.primary;
            }}
          >
            {isSubmitting ? "Creating..." : "Create Template"}
          </button>
        </div>
      </div>
    </div>
  );
}
