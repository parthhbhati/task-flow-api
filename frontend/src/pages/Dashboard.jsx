import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  ArrowDownRight,
  ArrowRight,
  CalendarDays,
  CheckCircle2,
  Clock3,
  ListTodo,
  Plus,
  Pencil,
  Sparkles,
  Target,
  Trash2,
} from "lucide-react";
import StatCard from "../components/ui/StatCard";
import StatusBadge from "../components/ui/StatusBadge";
import api, { getApiErrorMessage } from "../lib/api";
import { useAuth } from "../context/AuthContext";

const filters = ["all", "pending", "in_progress", "completed"];

function formatDate(date) {
  const dateKey = getTaskDateKey(date);
  return dateKey ? formatDateKey(dateKey) : "No due date";
}

function getLocalDateKey(date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function getTaskDateKey(value) {
  if (typeof value !== "string") return null;

  const match = /^(\d{4})-(\d{2})-(\d{2})(?:$|T)/.exec(value);
  if (!match) return null;

  const [, year, month, day] = match;
  const parsed = new Date(Date.UTC(Number(year), Number(month) - 1, Number(day)));
  if (
    parsed.getUTCFullYear() !== Number(year) ||
    parsed.getUTCMonth() !== Number(month) - 1 ||
    parsed.getUTCDate() !== Number(day)
  ) {
    return null;
  }

  return `${year}-${month}-${day}`;
}

function formatDateKey(dateKey) {
  const [year, month, day] = dateKey.split("-").map(Number);
  return new Intl.DateTimeFormat("en", {
    month: "short",
    day: "numeric",
  }).format(new Date(year, month - 1, day));
}

function Dashboard({ activePage, onNavigate, createTaskRequest }) {
  const { user, updateUser } = useAuth();
  const [avatarFile, setAvatarFile] = useState(null);
  const [avatarPreview, setAvatarPreview] = useState("");
  const avatarPreviewUrl = useRef("");
  const [avatarUploading, setAvatarUploading] = useState(false);
  const [avatarMessage, setAvatarMessage] = useState("");
  const [avatarError, setAvatarError] = useState("");
  const [clock, setClock] = useState(() => new Date());
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [retryCount, setRetryCount] = useState(0);
  const [filter, setFilter] = useState("all");
  const [search, setSearch] = useState("");
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [createForm, setCreateForm] = useState({
    title: "",
    description: "",
    priority: "medium",
    status: "pending",
    dueDate: "",
  });
  const [creating, setCreating] = useState(false);
  const [createError, setCreateError] = useState("");
  const [editingTaskId, setEditingTaskId] = useState(null);
  const [editForm, setEditForm] = useState(null);
  const [savingEdit, setSavingEdit] = useState(false);
  const [editError, setEditError] = useState("");
  const [updatingStatus, setUpdatingStatus] = useState({});
  const [statusErrors, setStatusErrors] = useState({});
  const [deletingTasks, setDeletingTasks] = useState({});
  const [deleteErrors, setDeleteErrors] = useState({});

  useEffect(() => {
    if (createTaskRequest > 0) {
      setShowCreateForm(true);
    }
  }, [createTaskRequest]);

  useEffect(() => {
    const now = new Date();
    const nextHour = new Date(now);
    nextHour.setMinutes(0, 0, 0);
    nextHour.setHours(nextHour.getHours() + 1);

    const timer = window.setTimeout(() => setClock(new Date()), nextHour - now);
    return () => window.clearTimeout(timer);
  }, [clock]);

  const fetchTasks = useCallback(async () => {
    setLoading(true);
    setError("");

    try {
      const response = await api.get("/tasks");
      setTasks(response.data.data);
    } catch (requestError) {
      setError(getApiErrorMessage(requestError));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchTasks();
  }, [fetchTasks, retryCount]);

  useEffect(() => {
    const handleSearch = (event) => setSearch(event.detail || "");

    window.addEventListener("taskflow:search", handleSearch);

    return () => {
      window.removeEventListener("taskflow:search", handleSearch);
    };
  }, []);

  const filteredTasks = useMemo(() => {
    return tasks.filter((task) => {
      const matchesFilter = filter === "all" || task.status === filter;

      const matchesSearch = `${task.title} ${task.description}`
        .toLowerCase()
        .includes(search.toLowerCase());

      const matchesPage =
        activePage !== "My Tasks" ||
        filter === "completed" ||
        task.status !== "completed";

      return matchesFilter && matchesSearch && matchesPage;
    });
  }, [tasks, filter, search, activePage]);

  const total = tasks.length;
  const pending = tasks.filter((task) => task.status === "pending").length;
  const inProgress = tasks.filter(
    (task) => task.status === "in_progress",
  ).length;
  const completed = tasks.filter((task) => task.status === "completed").length;
  const todayKey = getLocalDateKey(clock);
  const seventhDay = new Date(clock.getFullYear(), clock.getMonth(), clock.getDate() + 7);
  const lastUpcomingKey = getLocalDateKey(seventhDay);
  const reminders = useMemo(() => {
    const groups = { overdue: [], today: [], upcoming: [] };

    tasks.forEach((task) => {
      if (task.status === "completed") return;
      const dueDateKey = getTaskDateKey(task.dueDate);
      if (!dueDateKey) return;

      if (dueDateKey < todayKey) groups.overdue.push(task);
      else if (dueDateKey === todayKey) groups.today.push(task);
      else if (dueDateKey <= lastUpcomingKey) groups.upcoming.push(task);
    });

    return groups;
  }, [tasks, todayKey, lastUpcomingKey]);
  const greeting = clock.getHours() < 5
    ? "Good night!"
    : clock.getHours() < 12
      ? "Good morning!"
    : clock.getHours() < 17
      ? "Good afternoon!"
      : "Good evening!";

  useEffect(() => () => {
    if (avatarPreviewUrl.current) URL.revokeObjectURL(avatarPreviewUrl.current);
  }, []);

  async function handleAvatarUpload(event) {
    event.preventDefault();
    if (!avatarFile) {
      setAvatarError("Choose an image before uploading.");
      return;
    }
    const formData = new FormData();
    formData.append("avatar", avatarFile);
    setAvatarUploading(true);
    setAvatarError("");
    setAvatarMessage("");
    try {
      const response = await api.patch("/users/avatar", formData);
      updateUser(response.data.data);
      if (avatarPreviewUrl.current) URL.revokeObjectURL(avatarPreviewUrl.current);
      avatarPreviewUrl.current = "";
      setAvatarPreview("");
      setAvatarFile(null);
      setAvatarMessage("Your avatar has been updated.");
    } catch (requestError) {
      setAvatarError(getApiErrorMessage(requestError));
    } finally {
      setAvatarUploading(false);
    }
  }

  if (activePage === "Profile") {
    const avatarSrc = avatarPreview || user?.avatar || null;
    const profileFields = [
      ["Name", user?.fullName ?? user?.name],
      ["Username", user?.username],
      ["Email", user?.email],
    ].filter(([, value]) => typeof value === "string" && value.trim());

    return (
      <section className="max-w-3xl space-y-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-slate-900">Profile</h1>
          <p className="mt-2 text-sm text-slate-500">Your account information.</p>
        </div>

        <div className="rounded-2xl border border-slate-200/80 bg-white p-6 shadow-sm">
          <form onSubmit={handleAvatarUpload} className="mb-6 flex flex-col gap-5 border-b border-slate-100 pb-6 sm:flex-row sm:items-center">
            {avatarSrc ? (
              <img
                src={avatarSrc}
                alt={`${user?.fullName || "Your"} avatar`}
                className="h-24 w-24 rounded-2xl object-cover"
              />
            ) : (
              <div className="flex h-24 w-24 items-center justify-center rounded-2xl bg-gradient-to-br from-blue-500 to-violet-600 text-2xl font-bold text-white">
                {(user?.fullName || "TF").slice(0, 2).toUpperCase()}
              </div>
            )}
            <div className="flex-1">
              <h2 className="font-semibold text-slate-900">Profile photo</h2>
              <p className="mt-1 text-sm text-slate-500">JPEG, PNG, or WebP, up to 5 MB.</p>
              <div className="mt-3 flex flex-wrap items-center gap-3">
                <label className="cursor-pointer rounded-lg border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50">
                  {avatarFile ? "Choose another" : user?.avatar ? "Change photo" : "Choose photo"}
                  <input
                    type="file"
                    accept="image/jpeg,image/png,image/webp"
                    className="sr-only"
                    onChange={(event) => {
                      const file = event.target.files?.[0] || null;
                      if (avatarPreviewUrl.current) {
                        URL.revokeObjectURL(avatarPreviewUrl.current);
                      }
                      avatarPreviewUrl.current = file ? URL.createObjectURL(file) : "";
                      setAvatarPreview(avatarPreviewUrl.current);
                      setAvatarFile(file);
                      setAvatarError("");
                      setAvatarMessage("");
                    }}
                  />
                </label>
                {avatarFile && (
                  <button type="submit" disabled={avatarUploading} className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700 disabled:cursor-wait disabled:opacity-60">
                    {avatarUploading ? "Uploading…" : "Upload photo"}
                  </button>
                )}
              </div>
              {avatarError && <p role="alert" className="mt-3 text-sm text-red-700">{avatarError}</p>}
              {avatarMessage && <p role="status" className="mt-3 text-sm text-emerald-700">{avatarMessage}</p>}
            </div>
          </form>
          {profileFields.length ? (
            <dl className="divide-y divide-slate-100">
              {profileFields.map(([label, value]) => (
                <div key={label} className="grid gap-1 py-4 first:pt-0 last:pb-0 sm:grid-cols-[140px_1fr] sm:gap-4">
                  <dt className="text-sm font-medium text-slate-500">{label}</dt>
                  <dd className="break-all text-sm font-semibold text-slate-900">{value.trim()}</dd>
                </div>
              ))}
            </dl>
          ) : (
            <p className="text-sm text-slate-500">No profile information is available.</p>
          )}
        </div>
      </section>
    );
  }

  if (activePage === "Reminders") {
    const sections = [
      { key: "overdue", title: "Overdue", tasks: reminders.overdue, tone: "text-red-700" },
      { key: "today", title: "Due today", tasks: reminders.today, tone: "text-amber-700" },
      { key: "upcoming", title: "Upcoming · next 7 days", tasks: reminders.upcoming, tone: "text-blue-700" },
    ];
    const hasReminders = sections.some((section) => section.tasks.length > 0);

    return (
      <section className="max-w-4xl space-y-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-slate-900">Reminders</h1>
          <p className="mt-2 text-sm text-slate-500">Incomplete tasks with due dates that need your attention.</p>
        </div>

        {!loading && error && (
          <div className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700" role="alert">
            <p>{error}</p>
            <button
              type="button"
              onClick={() => setRetryCount((count) => count + 1)}
              disabled={loading}
              className="mt-3 rounded-lg bg-blue-600 px-4 py-2 font-semibold text-white hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-60"
            >
              Retry
            </button>
          </div>
        )}
        {loading ? (
          <p className="rounded-2xl border border-slate-200 bg-white px-6 py-10 text-center text-sm text-slate-500" role="status">
            Loading your reminders...
          </p>
        ) : !error && !hasReminders ? (
          <div className="rounded-2xl border border-slate-200 bg-white px-6 py-12 text-center shadow-sm">
            <CalendarDays size={24} className="mx-auto text-slate-400" />
            <h2 className="mt-3 font-semibold text-slate-800">No reminders</h2>
            <p className="mt-1 text-sm text-slate-500">You have no incomplete tasks due today or within the next seven days.</p>
          </div>
        ) : !error && sections.map((section) => (
          section.tasks.length > 0 && (
            <div key={section.key} className="overflow-hidden rounded-2xl border border-slate-200/80 bg-white shadow-sm">
              <h2 className={`border-b border-slate-100 px-5 py-4 font-semibold ${section.tone}`}>{section.title}</h2>
              <ul className="divide-y divide-slate-100">
                {section.tasks.map((task) => (
                  <li key={task._id} className="flex flex-wrap items-center justify-between gap-3 px-5 py-4">
                    <div className="min-w-0">
                      <p className="truncate text-sm font-semibold text-slate-800">{task.title}</p>
                      <p className="mt-1 text-xs text-slate-500">Due {formatDateKey(getTaskDateKey(task.dueDate))}</p>
                    </div>
                    <StatusBadge value={task.priority} type="priority" />
                  </li>
                ))}
              </ul>
            </div>
          )
        ))}
      </section>
    );
  }

  function handleCreateFormChange(event) {
    const { name, value } = event.target;
    setCreateForm((current) => ({ ...current, [name]: value }));
    setCreateError("");
  }

  async function handleCreateTask(event) {
    event.preventDefault();
    const title = createForm.title.trim();

    if (!title) {
      setCreateError("Enter a task title before saving.");
      return;
    }

    const taskInput = {
      title,
      description: createForm.description,
      priority: createForm.priority,
      status: createForm.status,
    };

    if (createForm.dueDate) {
      taskInput.dueDate = createForm.dueDate;
    }

    setCreating(true);
    setCreateError("");

    try {
      const response = await api.post("/tasks", taskInput);
      const createdTask = response.data.data;

      setTasks((current) => [createdTask, ...current]);
      setFilter("all");
      setCreateForm({
        title: "",
        description: "",
        priority: "medium",
        status: "pending",
        dueDate: "",
      });
      setShowCreateForm(false);
    } catch (requestError) {
      const apiErrors = requestError.response?.data?.errors;
      const details = Array.isArray(apiErrors) ? apiErrors.join(" ") : "";
      setCreateError(
        [getApiErrorMessage(requestError), details]
          .filter(Boolean)
          .join(" "),
      );
    } finally {
      setCreating(false);
    }
  }

  async function handleStatusChange(taskId, status) {
    setUpdatingStatus((current) => ({ ...current, [taskId]: true }));
    setStatusErrors((current) => ({ ...current, [taskId]: "" }));

    try {
      const response = await api.patch(`/tasks/${taskId}`, { status });
      const updatedTask = response.data.data;
      setTasks((current) =>
        current.map((task) =>
          task._id === taskId ? updatedTask : task,
        ),
      );
    } catch (requestError) {
      const apiErrors = requestError.response?.data?.errors;
      const details = Array.isArray(apiErrors) ? apiErrors.join(" ") : "";
      setStatusErrors((current) => ({
        ...current,
        [taskId]: [getApiErrorMessage(requestError), details]
          .filter(Boolean)
          .join(" "),
      }));
    } finally {
      setUpdatingStatus((current) => ({ ...current, [taskId]: false }));
    }
  }

  function beginTaskEdit(task) {
    setEditingTaskId(task._id);
    setEditForm({
      title: task.title || "",
      description: task.description || "",
      priority: task.priority || "medium",
      status: task.status || "pending",
      dueDate: getTaskDateKey(task.dueDate) || "",
    });
    setEditError("");
  }

  async function handleEditTask(event, taskId) {
    event.preventDefault();
    const title = editForm?.title.trim() || "";
    if (!title) {
      setEditError("Enter a task title before saving.");
      return;
    }

    const taskInput = {
      title,
      description: editForm.description,
      priority: editForm.priority,
      status: editForm.status,
      dueDate: editForm.dueDate || null,
    };

    setSavingEdit(true);
    setEditError("");
    try {
      const response = await api.patch(`/tasks/${taskId}`, taskInput);
      const updatedTask = response.data.data;
      setTasks((current) => current.map((task) => task._id === taskId ? updatedTask : task));
      setEditingTaskId(null);
      setEditForm(null);
    } catch (requestError) {
      const apiErrors = requestError.response?.data?.errors;
      const details = Array.isArray(apiErrors) ? apiErrors.join(" ") : "";
      setEditError([getApiErrorMessage(requestError), details].filter(Boolean).join(" "));
    } finally {
      setSavingEdit(false);
    }
  }

  async function handleDeleteTask(task) {
    const confirmed = window.confirm(
      `Delete "${task.title}"? This action cannot be undone.`,
    );

    if (!confirmed) return;

    setDeletingTasks((current) => ({ ...current, [task._id]: true }));
    setDeleteErrors((current) => ({ ...current, [task._id]: "" }));

    try {
      await api.delete(`/tasks/${task._id}`);
      setTasks((current) => current.filter((item) => item._id !== task._id));
    } catch (requestError) {
      setDeleteErrors((current) => ({
        ...current,
        [task._id]: getApiErrorMessage(requestError),
      }));
    } finally {
      setDeletingTasks((current) => ({ ...current, [task._id]: false }));
    }
  }

  return (
    <div className="space-y-8">
      <section className="flex flex-col justify-between gap-5 sm:flex-row sm:items-end">
        <div>
          <div className="mb-3 inline-flex items-center gap-2 rounded-full border border-blue-100 bg-blue-50 px-3 py-1.5 text-xs font-semibold text-blue-700">
            <Sparkles size={14} />
            YOUR PRODUCTIVITY SPACE
          </div>

          <h1 className="text-3xl font-bold tracking-tight text-slate-900 sm:text-4xl">
            {activePage === "My Tasks" ? "My Tasks" : greeting}
          </h1>

          <p className="mt-2 text-sm text-slate-500 sm:text-base">
            {activePage === "My Tasks"
              ? "Focus on the work that matters."
              : "A little progress each day adds up to big results."}
          </p>
        </div>
        <button
          type="button"
          onClick={() => {
            setShowCreateForm((visible) => !visible);
            setCreateError("");
          }}
          className="inline-flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-blue-600 to-violet-600 px-5 py-3 text-sm font-semibold text-white shadow-lg shadow-blue-600/20 transition hover:-translate-y-0.5 hover:shadow-xl"
        >
          <Plus size={18} />
          {showCreateForm ? "Cancel" : "Create task"}
        </button>
      </section>

      {showCreateForm && (
        <form
          onSubmit={handleCreateTask}
          className="rounded-2xl border border-blue-100 bg-white p-5 shadow-sm sm:p-6"
        >
          <h2 className="text-lg font-semibold text-slate-900">Create a task</h2>

          <div className="mt-4 grid gap-4 sm:grid-cols-2">
            <label className="text-sm font-medium text-slate-700 sm:col-span-2">
              Title <span className="text-red-600" aria-hidden="true">*</span>
              <input
                name="title"
                value={createForm.title}
                onChange={handleCreateFormChange}
                placeholder="What needs to get done?"
                maxLength={120}
                required
                aria-invalid={Boolean(createError)}
                className="mt-2 w-full rounded-xl border border-slate-200 px-4 py-3 text-sm outline-none transition focus:border-blue-400 focus:ring-4 focus:ring-blue-50"
              />
            </label>

            <label className="text-sm font-medium text-slate-700 sm:col-span-2">
              Description
              <textarea
                name="description"
                value={createForm.description}
                onChange={handleCreateFormChange}
                rows={3}
                placeholder="Add a few details (optional)"
                className="mt-2 w-full resize-y rounded-xl border border-slate-200 px-4 py-3 text-sm outline-none transition focus:border-blue-400 focus:ring-4 focus:ring-blue-50"
              />
            </label>

            <label className="text-sm font-medium text-slate-700">
              Priority
              <select
                name="priority"
                value={createForm.priority}
                onChange={handleCreateFormChange}
                className="mt-2 w-full rounded-xl border border-slate-200 bg-white px-3 py-3 text-sm outline-none focus:border-blue-400"
              >
                <option value="low">Low</option>
                <option value="medium">Medium</option>
                <option value="high">High</option>
              </select>
            </label>

            <label className="text-sm font-medium text-slate-700">
              Status
              <select
                name="status"
                value={createForm.status}
                onChange={handleCreateFormChange}
                className="mt-2 w-full rounded-xl border border-slate-200 bg-white px-3 py-3 text-sm outline-none focus:border-blue-400"
              >
                <option value="pending">Pending</option>
                <option value="in_progress">In progress</option>
                <option value="completed">Completed</option>
              </select>
            </label>

            <label className="text-sm font-medium text-slate-700">
              Due date <span className="font-normal text-slate-400">(optional)</span>
              <input
                type="date"
                name="dueDate"
                value={createForm.dueDate}
                onChange={handleCreateFormChange}
                className="mt-2 w-full rounded-xl border border-slate-200 bg-white px-3 py-3 text-sm outline-none focus:border-blue-400"
              />
            </label>
          </div>

          {createError && (
            <p className="mt-4 text-sm text-red-700" role="alert">
              {createError}
            </p>
          )}

          <div className="mt-5 flex justify-end">
            <button
              type="submit"
              disabled={creating}
              className="rounded-xl bg-slate-900 px-5 py-3 text-sm font-semibold text-white hover:bg-slate-700 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {creating ? "Saving task..." : "Save task"}
            </button>
          </div>
        </form>
      )}

      {!loading && !error && <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard
          title="Total tasks"
          value={total}
          description="Tasks in your workspace"
          icon={ListTodo}
          tone="blue"
        />
        <StatCard
          title="Pending"
          value={pending}
          description="Waiting for your attention"
          icon={Clock3}
          tone="amber"
        />
        <StatCard
          title="In progress"
          value={inProgress}
          description="Work currently underway"
          icon={ArrowDownRight}
          tone="violet"
        />
        <StatCard
          title="Completed"
          value={completed}
          description="Tasks you've finished"
          icon={CheckCircle2}
          tone="green"
        />
      </section>}

      <section className="grid items-start gap-6 xl:grid-cols-[minmax(0,1fr)_300px]">
        <div className="min-w-0 overflow-hidden rounded-2xl border border-slate-200/80 bg-white shadow-sm shadow-slate-200/30">
          <div className="flex flex-col justify-between gap-4 border-b border-slate-100 p-5 sm:flex-row sm:items-center sm:p-6">
            <div>
              <h2 className="text-lg font-bold text-slate-900">
                {activePage === "My Tasks" ? "Your task list" : "Recent tasks"}
              </h2>
              <p className="mt-1 text-sm text-slate-500">
                Keep your priorities in view.
              </p>
            </div>

            <button
              onClick={() => onNavigate("My Tasks")}
              className="inline-flex items-center gap-2 self-start text-sm font-semibold text-blue-600 hover:text-blue-700"
            >
              View my tasks <ArrowRight size={16} />
            </button>
          </div>

          <div className="flex gap-2 overflow-x-auto border-b border-slate-100 px-5 py-3 sm:px-6">
            {filters.map((item) => (
              <button
                key={item}
                onClick={() => setFilter(item)}
                className={`whitespace-nowrap rounded-lg px-3 py-2 text-xs font-semibold capitalize transition ${
                  filter === item
                    ? "bg-blue-600 text-white"
                    : "text-slate-500 hover:bg-slate-100 hover:text-slate-900"
                }`}
              >
                {item.replace("_", " ")}
              </button>
            ))}
          </div>

          <div className="divide-y divide-slate-100">
            {loading && (
              <p className="px-6 py-14 text-center text-sm text-slate-500" role="status">
                Loading your tasks...
              </p>
            )}

            {!loading && error && (
              <div className="px-6 py-14 text-center" role="alert">
                <p className="text-sm text-red-700">{error}</p>
                <button
                  type="button"
                  onClick={() => setRetryCount((count) => count + 1)}
                  className="mt-4 rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700"
                >
                  Retry
                </button>
              </div>
            )}

            {!loading && !error && tasks.length === 0 && (
              <div className="px-6 py-14 text-center">
                <h3 className="font-semibold text-slate-800">No tasks yet</h3>
                <p className="mt-1 text-sm text-slate-500">
                  Your tasks will appear here when you create one.
                </p>
              </div>
            )}

            {!loading && !error && filteredTasks.map((task) => (
              <article
                key={task._id}
                className="flex flex-wrap items-start gap-3 px-5 py-5 transition hover:bg-slate-50/80 sm:items-center sm:px-6"
              >
                <span
                  aria-label={task.status === "completed" ? "Completed" : "Not completed"}
                  className={`mt-0.5 shrink-0 sm:mt-0 ${
                    task.status === "completed"
                      ? "text-emerald-500"
                      : "text-slate-300"
                  }`}
                >
                  {task.status === "completed" ? (
                    <CheckCircle2 size={21} />
                  ) : (
                    <Clock3 size={21} />
                  )}
                </span>

                <div className="min-w-0 flex-1">
                  <p
                    className={`truncate text-sm font-semibold ${
                      task.status === "completed"
                        ? "text-slate-400 line-through"
                        : "text-slate-800"
                    }`}
                  >
                    {task.title}
                  </p>

                  <p className="mt-1 truncate text-xs text-slate-500">
                    {task.description}
                  </p>

                  <div className="mt-3 flex flex-wrap items-center gap-2">
                    <StatusBadge value={task.priority} type="priority" />
                    <label className="sr-only" htmlFor={`status-${task._id}`}>
                      Status for {task.title}
                    </label>
                    <select
                      id={`status-${task._id}`}
                      value={task.status}
                      onChange={(event) =>
                        handleStatusChange(task._id, event.target.value)
                      }
                      disabled={Boolean(updatingStatus[task._id])}
                      aria-describedby={
                        statusErrors[task._id]
                          ? `status-error-${task._id}`
                          : undefined
                      }
                      className="rounded-lg border border-slate-200 bg-white px-2.5 py-1.5 text-xs font-semibold text-slate-700 outline-none focus:border-blue-400 disabled:cursor-wait disabled:opacity-60"
                    >
                      <option value="pending">Pending</option>
                      <option value="in_progress">In progress</option>
                      <option value="completed">Completed</option>
                    </select>
                  </div>
                  {statusErrors[task._id] && (
                    <p
                      id={`status-error-${task._id}`}
                      className="mt-2 text-xs text-red-700"
                      role="alert"
                    >
                      {statusErrors[task._id]}
                    </p>
                  )}
                  {deleteErrors[task._id] && (
                    <p className="mt-2 text-xs text-red-700" role="alert">
                      {deleteErrors[task._id]}
                    </p>
                  )}
                </div>

                <div className="hidden shrink-0 items-center gap-5 sm:flex">
                  <div className="flex items-center gap-1.5 text-xs text-slate-400">
                    <CalendarDays size={14} />
                    {formatDate(task.dueDate)}
                  </div>

                  <StatusBadge value={task.priority} type="priority" />
                </div>

                <button
                  type="button"
                  onClick={() => beginTaskEdit(task)}
                  aria-label={`Edit ${task.title}`}
                  title="Edit task"
                  className="shrink-0 rounded-lg p-2 text-slate-400 transition hover:bg-blue-50 hover:text-blue-600"
                >
                  <Pencil size={18} />
                </button>

                <button
                  type="button"
                  onClick={() => handleDeleteTask(task)}
                  disabled={Boolean(deletingTasks[task._id])}
                  aria-label={`Delete ${task.title}`}
                  title="Delete task"
                  className="shrink-0 rounded-lg p-2 text-slate-400 transition hover:bg-red-50 hover:text-red-600 disabled:cursor-wait disabled:opacity-60"
                >
                  <Trash2 size={18} />
                </button>
                {editingTaskId === task._id && editForm && (
                  <form
                    onSubmit={(event) => handleEditTask(event, task._id)}
                    className="basis-full rounded-xl border border-blue-100 bg-blue-50/40 p-4 sm:p-5"
                  >
                    <h3 className="font-semibold text-slate-900">Edit task</h3>
                    <div className="mt-4 grid gap-4 sm:grid-cols-2">
                      <label className="text-sm font-medium text-slate-700 sm:col-span-2">
                        Title <span className="text-red-600" aria-hidden="true">*</span>
                        <input
                          name="title"
                          value={editForm.title}
                          onChange={(event) => {
                            setEditForm((current) => ({ ...current, title: event.target.value }));
                            setEditError("");
                          }}
                          maxLength={120}
                          required
                          aria-invalid={Boolean(editError)}
                          className="mt-2 w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm outline-none focus:border-blue-400 focus:ring-4 focus:ring-blue-50"
                        />
                      </label>
                      <label className="text-sm font-medium text-slate-700 sm:col-span-2">
                        Description
                        <textarea
                          value={editForm.description}
                          onChange={(event) => setEditForm((current) => ({ ...current, description: event.target.value }))}
                          rows={3}
                          className="mt-2 w-full resize-y rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm outline-none focus:border-blue-400"
                        />
                      </label>
                      <label className="text-sm font-medium text-slate-700">
                        Priority
                        <select value={editForm.priority} onChange={(event) => setEditForm((current) => ({ ...current, priority: event.target.value }))} className="mt-2 w-full rounded-xl border border-slate-200 bg-white px-3 py-3 text-sm">
                          <option value="low">Low</option><option value="medium">Medium</option><option value="high">High</option>
                        </select>
                      </label>
                      <label className="text-sm font-medium text-slate-700">
                        Status
                        <select value={editForm.status} onChange={(event) => setEditForm((current) => ({ ...current, status: event.target.value }))} className="mt-2 w-full rounded-xl border border-slate-200 bg-white px-3 py-3 text-sm">
                          <option value="pending">Pending</option><option value="in_progress">In progress</option><option value="completed">Completed</option>
                        </select>
                      </label>
                      <label className="text-sm font-medium text-slate-700">
                        Due date <span className="font-normal text-slate-400">(optional)</span>
                        <input type="date" value={editForm.dueDate} onChange={(event) => setEditForm((current) => ({ ...current, dueDate: event.target.value }))} className="mt-2 w-full rounded-xl border border-slate-200 bg-white px-3 py-3 text-sm" />
                      </label>
                    </div>
                    {editError && <p className="mt-4 text-sm text-red-700" role="alert">{editError}</p>}
                    <div className="mt-5 flex justify-end gap-3">
                      <button type="button" onClick={() => { setEditingTaskId(null); setEditForm(null); setEditError(""); }} disabled={savingEdit} className="rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 disabled:opacity-60">Cancel</button>
                      <button type="submit" disabled={savingEdit} className="rounded-xl bg-slate-900 px-5 py-2.5 text-sm font-semibold text-white disabled:cursor-wait disabled:opacity-60">{savingEdit ? "Saving changes..." : "Save changes"}</button>
                    </div>
                  </form>
                )}
              </article>
            ))}

            {!loading && !error && tasks.length > 0 && filteredTasks.length === 0 && (
              <div className="px-6 py-14 text-center">
                <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-slate-100 text-slate-500">
                  <Target size={22} />
                </div>
                <h3 className="mt-4 font-semibold text-slate-800">
                  No tasks found
                </h3>
                <p className="mt-1 text-sm text-slate-500">
                  Try another filter or search term.
                </p>
              </div>
            )}
          </div>
        </div>

        <aside className="rounded-2xl border border-slate-200/80 bg-white p-5 shadow-sm shadow-slate-200/30 sm:p-6">
          <div className="flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-violet-50 text-violet-600">
              <Target size={21} />
            </div>
            <div>
              <h2 className="font-bold text-slate-900">Your progress</h2>
              <p className="text-xs text-slate-500">A snapshot of your work</p>
            </div>
          </div>

          <div className="mt-7">
            <div className="flex items-end justify-between">
              <p className="text-sm text-slate-500">Completion rate</p>
              <p className="text-2xl font-bold text-slate-900">
                {total ? Math.round((completed / total) * 100) : 0}%
              </p>
            </div>

            <div className="mt-3 h-2.5 overflow-hidden rounded-full bg-slate-100">
              <div
                className="h-full rounded-full bg-gradient-to-r from-blue-500 to-violet-500 transition-all"
                style={{
                  width: `${total ? (completed / total) * 100 : 0}%`,
                }}
              />
            </div>

            <p className="mt-3 text-xs leading-5 text-slate-500">
              Every completed task is progress. Keep going at your own pace.
            </p>
          </div>

          <div className="mt-7 rounded-xl bg-gradient-to-br from-slate-950 to-slate-800 p-5 text-white">
            <Sparkles size={20} className="text-blue-300" />
            <h3 className="mt-3 font-semibold">One thing at a time.</h3>
            <p className="mt-2 text-xs leading-5 text-slate-300">
              Choose your next priority, focus on it, and build momentum.
            </p>
            <button
              onClick={() => {
                setFilter("pending");
                onNavigate("Dashboard");
              }}
              className="mt-4 inline-flex items-center gap-2 text-xs font-semibold text-blue-300 hover:text-white"
            >
              See pending tasks <ArrowRight size={14} />
            </button>
          </div>
        </aside>
      </section>
    </div>
  );
}

export default Dashboard;
