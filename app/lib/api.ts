const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:5000/api/v1";
  // process.env.NEXT_PUBLIC_API_BASE_URL || "http://bentodo.ariqfaridzki.my.id/api/v1";

const TOKEN_KEY = "bentodo_token";
const USER_KEY = "bentodo_user";
const GUEST_TOKEN_KEY = "bentodo_guest_token";
const GUEST_SESSION_ID_KEY = "bentodo_guest_session_id";

type ApiResponse<T = Record<string, never>> = T & {
  success: boolean;
  message?: string;
};

export type AuthUser = {
  id: string;
  email: string;
  display_name: string;
  role?: "user" | "admin";
  current_energy?: number;
  max_energy?: number;
  created_at?: string;
};

type AuthData = {
  user: AuthUser;
  token: string;
  migrated_tasks_count?: number;
};

type GuestSessionData = {
  guest_session_id: string;
  session_token: string;
  created_at: string;
  updated_at: string;
};

export type EnergyWeight = "Ringan" | "Sedang" | "Berat";
export type TaskStatus = "pending" | "in_progress" | "done";
export type DashboardPeriod = "daily" | "weekly" | "monthly" | "yearly";
export type TrendDirection = "up" | "down" | "flat";

export type FocusSummary = {
  total_sessions: number;
  total_focus_minutes: number;
  total_focus_time_label: string;
  longest_session_minutes: number;
  completed_sessions: number;
  average_focus_score: number | null;
};

export type FocusSessionDetail = {
  id: string;
  task_id: string;
  started_at: string;
  ended_at: string | null;
  duration_minutes: number | null;
  end_reason: string | null;
  focus_score?: number | null;
};

export type Task = {
  id: string;
  user_id: string | null;
  guest_session_id: string | null;
  title: string;
  description?: string | null;
  energy_weight: EnergyWeight;
  deadline: string | null;
  status: TaskStatus;
  used_timer: boolean;
  timer_duration: number | null;
  source_template: string | null;
  completed_at: string | null;
  created_at: string;
  updated_at: string;
  focus_summary?: FocusSummary;
  latest_focus_session?: FocusSessionDetail | null;
};

export type TaskListResponse = {
  page: number;
  limit: number;
  total_items: number;
  total_pages: number;
  data: Task[];
};

export type EnergySummary = {
  current_energy: number;
  max_energy: number;
  is_critical_energy: boolean;
  energy_reset_at?: string;
};

export type DashboardZenResponse = {
  current_energy: number;
  max_energy: number;
  is_critical_energy: boolean;
  hidden_count: number;
  hidden_message: string | null;
  data: Task[];
};

export type TemplatePreviewItem = {
  id?: string;
  title: string;
  description?: string | null;
  energy_weight: EnergyWeight;
  level?: "Low" | "Medium" | "High";
};

export type TaskTemplate = {
  id: string;
  key: string;
  name: string;
  description: string | null;
  level?: "Low" | "Medium" | "High";
  visibility?: "public" | "private";
  is_official?: boolean;
  created_by_user_id?: string | null;
  usage_count?: number;
  created_by?: {
    id: string;
    display_name: string | null;
    email: string;
  } | null;
  created_at?: string;
  updated_at?: string;
  total_items: number;
  preview_items: TemplatePreviewItem[];
  items?: TemplatePreviewItem[];
};

export type TemplateListResponse = {
  total_items: number;
  data: TaskTemplate[];
};

export type ApplyTemplateResponse = {
  template: {
    key: string;
    name: string;
    total_items: number;
  };
  inserted_count: number;
  data: Task[];
};

export type CreateTemplatePayload = {
  name: string;
  description?: string;
  visibility?: "public" | "private";
  level: "Low" | "Medium" | "High";
  items: {
    title: string;
    description?: string;
    energy_weight: EnergyWeight;
  }[];
};

export type AdminDashboardData = {
  period?: DashboardPeriod;
  stats: {
    guest_users: number;
    users: number;
    tasks: number;
    templates: number;
  };
  metrics?: {
    guest_users: DashboardMetric;
    users: DashboardMetric;
    tasks: DashboardMetric;
    templates: DashboardMetric;
  };
  activity: {
    labels: string[];
    data: number[];
    period?: DashboardPeriod;
    items?: AdminActivityPoint[];
  };
  recent_templates: TaskTemplate[];
};

export type DashboardMetric = {
  value: number;
  current_period_value?: number;
  previous_value: number;
  trend_percent: number;
  trend_direction: TrendDirection;
};

export type DashboardOverviewData = {
  period: DashboardPeriod;
  range: {
    current_start: string;
    current_end: string;
    previous_start: string;
    previous_end: string;
  };
  metrics: {
    task_completed: DashboardMetric;
    upcoming_deadlines: DashboardMetric;
    overdue_tasks: DashboardMetric;
    energy: {
      value: number;
      max_value: number;
      percentage: number;
      is_critical_energy: boolean;
      energy_reset_at?: string | null;
    };
  };
  priority_tasks: DashboardZenResponse;
  productivity: {
    period: DashboardPeriod;
    data: ProductivityPoint[];
  };
  recent_tasks: {
    selected_date: string | null;
    data: Task[];
  };
  calendar: {
    month: string;
    selected_date: string | null;
    data: CalendarTaskCount[];
  };
  focus_summary: FocusSummary;
  notifications: {
    unread_count: number;
    data: Notification[];
  };
};

export type ProductivityPoint = {
  label: string;
  date: string;
  completed: number;
  overdue: number;
  total: number;
  tooltip?: {
    title: string;
    completed: number;
    overdue: number;
  };
};

export type AdminActivityPoint = {
  label: string;
  date: string;
  guest_users: number;
  users: number;
  total: number;
};

export type CalendarTaskCount = {
  date: string;
  total_count: number;
  completed_count: number;
  active_count: number;
  overdue_count: number;
};

export type DashboardHistoryType = "all" | "task" | "focus";

export type DashboardHistoryItem = {
  item_type: "task" | "focus";
  id: string;
  task_id: string;
  title: string;
  description: string | null;
  energy_weight: EnergyWeight;
  deadline: string | null;
  task_status: TaskStatus;
  completed_at: string | null;
  focus_session_id: string | null;
  started_at: string | null;
  ended_at: string | null;
  duration_minutes: number | null;
  end_reason: string | null;
  focus_score: number | null;
  event_at: string;
};

export type DashboardHistoryResponse = {
  type: DashboardHistoryType;
  from: string | null;
  to: string | null;
  page: number;
  limit: number;
  total_items: number;
  total_pages: number;
  summary: FocusSummary;
  data: DashboardHistoryItem[];
};

export type Notification = {
  id: string;
  user_id: string;
  task_id: string | null;
  message: string;
  type: "deadline_reminder" | "energy_critical" | "dopamine_rescue";
  scheduled_at: string;
  sent_at: string | null;
  is_read: boolean;
  created_at: string;
  updated_at: string;
};

export type NotificationListResponse = {
  page: number;
  limit: number;
  total_items: number;
  total_pages: number;
  unread_count: number;
  data: Notification[];
};

export type ActiveFocusSession = {
  id: string;
  user_id: string | null;
  guest_session_id: string | null;
  task_id: string;
  task_title: string;
  task_description?: string | null;
  energy_weight: EnergyWeight;
  task_status: TaskStatus;
  started_at: string;
  elapsed_minutes: number;
  remaining_minutes: number;
  session_limit_minutes: number;
  zombie_limit_reached: boolean;
};

export type ActiveFocusResponse = {
  active_session: ActiveFocusSession | null;
  auto_stopped_session: unknown | null;
  energy?: EnergySummary;
  energy_effects?: unknown[];
  message?: string;
};

export type StartFocusResponse = {
  data: ActiveFocusSession;
};

export type StopFocusResponse = {
  session: unknown;
  task: Task;
  energy?: EnergySummary;
  energy_effects?: unknown[];
};

const buildUrl = (path: string) => {
  const normalizedBase = API_BASE_URL.replace(/\/$/, "");
  const normalizedPath = path.startsWith("/") ? path : `/${path}`;

  return `${normalizedBase}${normalizedPath}`;
};

const getErrorMessage = (payload: unknown) => {
  if (
    payload &&
    typeof payload === "object" &&
    "message" in payload &&
    typeof payload.message === "string"
  ) {
    return payload.message;
  }

  return "Request gagal. Silakan coba lagi.";
};

export const apiRequest = async <T>(
  path: string,
  options: RequestInit = {},
) => {
  const headers = new Headers(options.headers);

  if (options.body && !headers.has("Content-Type")) {
    headers.set("Content-Type", "application/json");
  }

  const response = await fetch(buildUrl(path), {
    ...options,
    headers,
    credentials: "include",
  });

  const text = await response.text();
  const payload = text ? JSON.parse(text) : null;

  if (!response.ok) {
    throw new Error(getErrorMessage(payload));
  }

  return payload as ApiResponse<T>;
};

export const authRequest = async <T>(
  path: string,
  options: RequestInit = {},
) => {
  const token = getAuthToken();
  const guestToken = getGuestSessionToken();

  if (!token && !guestToken) {
    throw new Error("Sesi login tidak ditemukan. Silakan login kembali.");
  }

  const headers = new Headers(options.headers);

  if (token) {
    headers.set("Authorization", `Bearer ${token}`);
  } else if (guestToken) {
    headers.set("x-guest-session-token", guestToken);
  }

  return apiRequest<T>(path, {
    ...options,
    headers,
  });
};

const getGuestMigrationHeaders = () => {
  const headers = new Headers();
  const guestToken = getGuestSessionToken();

  if (guestToken) {
    headers.set("x-guest-session-token", guestToken);
  }

  return headers;
};

export const loginUser = (email: string, password: string) => {
  return apiRequest<{ data: AuthData }>("/auth/login", {
    method: "POST",
    headers: getGuestMigrationHeaders(),
    body: JSON.stringify({ email, password }),
  });
};

export const registerUser = (
  displayName: string,
  email: string,
  password: string,
) => {
  return apiRequest<{ data: AuthData }>("/auth/register", {
    method: "POST",
    headers: getGuestMigrationHeaders(),
    body: JSON.stringify({
      display_name: displayName,
      email,
      password,
    }),
  });
};

export const createGuestSession = () => {
  return apiRequest<{ data: GuestSessionData }>("/guest", {
    method: "POST",
  });
};

export const forgotPassword = (email: string) => {
  return apiRequest("/auth/forgot-password", {
    method: "POST",
    body: JSON.stringify({ email }),
  });
};

export const resetPassword = (token: string, newPassword: string) => {
  return apiRequest("/auth/reset-password", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({ new_password: newPassword }),
  });
};

export const getTasks = (page = 1, limit = 50) => {
  return authRequest<TaskListResponse>(`/tasks?page=${page}&limit=${limit}`);
};

export const getTaskById = (taskId: string) => {
  return authRequest<{ data: Task }>(`/tasks/${taskId}`);
};

export const createTask = (payload: {
  title: string;
  description?: string | null;
  energy_weight: EnergyWeight;
  deadline?: string | null;
  source_template?: string | null;
}) => {
  return authRequest<{ data: Task }>("/tasks", {
    method: "POST",
    body: JSON.stringify(payload),
  });
};

export const updateTask = (
  taskId: string,
  payload: Partial<{
    title: string;
    description: string | null;
    energy_weight: EnergyWeight;
    status: TaskStatus;
    deadline: string | null;
  }>,
) => {
  return authRequest<{ data: Task; energy?: EnergySummary }>(`/tasks/${taskId}`, {
    method: "PUT",
    body: JSON.stringify(payload),
  });
};

export const deleteTask = (taskId: string) => {
  return authRequest(`/tasks/${taskId}`, {
    method: "DELETE",
  });
};

export const getDashboardZen = () => {
  return authRequest<DashboardZenResponse>("/dashboard/zen");
};

export const getEnergySummary = () => {
  return authRequest<{ data: EnergySummary }>("/energy");
};

const buildQuery = (params: Record<string, string | number | null | undefined>) => {
  const searchParams = new URLSearchParams();

  Object.entries(params).forEach(([key, value]) => {
    if (value !== null && value !== undefined && value !== "") {
      searchParams.set(key, String(value));
    }
  });

  const query = searchParams.toString();

  return query ? `?${query}` : "";
};

export const getDashboardOverview = (
  period: DashboardPeriod = "weekly",
  calendarDate?: string | null,
  month?: string | null,
) => {
  return authRequest<{ data: DashboardOverviewData }>(
    `/dashboard/overview${buildQuery({
      period,
      calendar_date: calendarDate,
      month,
    })}`,
  );
};

export const getDashboardHistory = (
  type: DashboardHistoryType = "all",
  page = 1,
  limit = 20,
  from?: string | null,
  to?: string | null,
) => {
  return authRequest<DashboardHistoryResponse>(
    `/dashboard/history${buildQuery({ type, page, limit, from, to })}`,
  );
};

export const getTemplates = () => {
  return authRequest<TemplateListResponse>("/templates");
};

export const createTemplate = (payload: CreateTemplatePayload) => {
  return authRequest<{ data: TaskTemplate }>("/templates", {
    method: "POST",
    body: JSON.stringify(payload),
  });
};

export const updateTemplate = (templateId: string, payload: CreateTemplatePayload) => {
  return authRequest<{ data: TaskTemplate }>(`/templates/${templateId}`, {
    method: "PUT",
    body: JSON.stringify(payload),
  });
};

export const deleteTemplate = (templateId: string) => {
  return authRequest(`/templates/${templateId}`, {
    method: "DELETE",
  });
};

export const saveTemplateAsPrivate = (templateKey: string) => {
  return authRequest<{ data: TaskTemplate }>(`/templates/save-private/${templateKey}`, {
    method: "POST",
  });
};

export const createAdminTemplate = (payload: CreateTemplatePayload) => {
  return authRequest<{ data: TaskTemplate }>("/admin/templates", {
    method: "POST",
    body: JSON.stringify(payload),
  });
};

export const applyTemplate = (templateKey: string) => {
  return authRequest<ApplyTemplateResponse>(`/templates/apply/${templateKey}`, {
    method: "POST",
  });
};

export const getAdminDashboard = (period: DashboardPeriod = "weekly") => {
  return authRequest<{ data: AdminDashboardData }>(
    `/admin/dashboard${buildQuery({ period })}`,
  );
};

export const getAdminTemplates = (page = 1, limit = 20) => {
  return authRequest<TemplateListResponse>(
    `/admin/templates${buildQuery({ page, limit })}`,
  );
};

export const deleteAdminTemplate = (templateId: string) => {
  return authRequest(`/admin/templates/${templateId}`, {
    method: "DELETE",
  });
};

export const getNotifications = (page = 1, limit = 10) => {
  return authRequest<NotificationListResponse>(
    `/notifications?page=${page}&limit=${limit}`,
  );
};

export const markNotificationAsRead = (notificationId: string) => {
  return authRequest<{ data: Notification }>(`/notifications/${notificationId}/read`, {
    method: "PUT",
  });
};

export const markAllNotificationsAsRead = () => {
  return authRequest("/notifications/read-all", {
    method: "PUT",
  });
};

export const getActiveFocusSession = () => {
  return authRequest<ActiveFocusResponse>("/focus/active");
};

export const startFocusSession = (taskId: string) => {
  return authRequest<StartFocusResponse>("/focus/start", {
    method: "POST",
    body: JSON.stringify({ task_id: taskId }),
  });
};

export const stopFocusSession = (
  sessionId: string,
  endReason: "completed" | "escaped" | "zombie_limit" | "crash",
) => {
  return authRequest<StopFocusResponse>(`/focus/${sessionId}/stop`, {
    method: "POST",
    body: JSON.stringify({ end_reason: endReason }),
  });
};

export const saveAuthSession = (data: AuthData, rememberMe = false) => {
  const storage = rememberMe ? localStorage : sessionStorage;

  localStorage.removeItem(TOKEN_KEY);
  localStorage.removeItem(USER_KEY);
  localStorage.removeItem(GUEST_TOKEN_KEY);
  localStorage.removeItem(GUEST_SESSION_ID_KEY);
  sessionStorage.removeItem(TOKEN_KEY);
  sessionStorage.removeItem(USER_KEY);
  sessionStorage.removeItem(GUEST_TOKEN_KEY);
  sessionStorage.removeItem(GUEST_SESSION_ID_KEY);

  storage.setItem(TOKEN_KEY, data.token);
  storage.setItem(USER_KEY, JSON.stringify(data.user));
};

export const saveGuestSession = (data: GuestSessionData) => {
  localStorage.removeItem(TOKEN_KEY);
  localStorage.removeItem(USER_KEY);
  localStorage.removeItem(GUEST_TOKEN_KEY);
  localStorage.removeItem(GUEST_SESSION_ID_KEY);
  sessionStorage.removeItem(TOKEN_KEY);
  sessionStorage.removeItem(USER_KEY);
  sessionStorage.removeItem(GUEST_TOKEN_KEY);
  sessionStorage.removeItem(GUEST_SESSION_ID_KEY);

  localStorage.setItem(GUEST_TOKEN_KEY, data.session_token);
  localStorage.setItem(GUEST_SESSION_ID_KEY, data.guest_session_id);
  localStorage.setItem(
    USER_KEY,
    JSON.stringify({
      id: data.guest_session_id,
      email: "guest@bentodo.local",
      display_name: "Guest",
    } satisfies AuthUser),
  );
};

export const getAuthToken = () => {
  if (typeof window === "undefined") {
    return null;
  }

  return localStorage.getItem(TOKEN_KEY) || sessionStorage.getItem(TOKEN_KEY);
};

export const getGuestSessionToken = () => {
  if (typeof window === "undefined") {
    return null;
  }

  return (
    localStorage.getItem(GUEST_TOKEN_KEY) ||
    sessionStorage.getItem(GUEST_TOKEN_KEY)
  );
};

export const hasActiveSession = () => {
  return !!getAuthToken() || !!getGuestSessionToken();
};

export const isGuestSession = () => {
  return !getAuthToken() && !!getGuestSessionToken();
};

export const getStoredUser = () => {
  if (typeof window === "undefined") {
    return null;
  }

  const rawUser =
    localStorage.getItem(USER_KEY) || sessionStorage.getItem(USER_KEY);

  if (!rawUser) {
    return null;
  }

  try {
    return JSON.parse(rawUser) as AuthUser;
  } catch {
    return null;
  }
};

export const clearAuthSession = () => {
  localStorage.removeItem(TOKEN_KEY);
  localStorage.removeItem(USER_KEY);
  localStorage.removeItem(GUEST_TOKEN_KEY);
  localStorage.removeItem(GUEST_SESSION_ID_KEY);
  sessionStorage.removeItem(TOKEN_KEY);
  sessionStorage.removeItem(USER_KEY);
  sessionStorage.removeItem(GUEST_TOKEN_KEY);
  sessionStorage.removeItem(GUEST_SESSION_ID_KEY);
};
