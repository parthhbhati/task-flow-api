import { useEffect, useMemo, useState } from "react";
import {
  ArrowDownRight,
  ArrowRight,
  CalendarDays,
  CheckCircle2,
  Circle,
  Clock3,
  ListTodo,
  Plus,
  Sparkles,
  Target,
} from "lucide-react";
import StatCard from "../components/ui/StatCard";
import StatusBadge from "../components/ui/StatusBadge";

const initialTasks = [
  {
    _id: "demo-1",
    title: "Revise backend concepts",
    description: "Practice building APIs",
    priority: "high",
    status: "pending",
    dueDate: "2026-10-20",
  },
  {
    _id: "demo-2",
    title: "Build the TaskFlow frontend",
    description: "Create reusable React components",
    priority: "medium",
    status: "in_progress",
    dueDate: "2026-10-22",
  },
  {
    _id: "demo-3",
    title: "Review MongoDB database",
    description: "Check schemas and data models",
    priority: "low",
    status: "completed",
    dueDate: "2026-10-18",
  },
  {
    _id: "demo-4",
    title: "Write project documentation",
    description: "Prepare README and API docs",
    priority: "medium",
    status: "pending",
    dueDate: "2026-10-25",
  },
];

const filters = ["all", "pending", "in_progress", "completed"];

function formatDate(date) {
  if (!date) return "No due date";

  const parsed = new Date(date);

  if (Number.isNaN(parsed.getTime())) return "No due date";

  return new Intl.DateTimeFormat("en", {
    month: "short",
    day: "numeric",
  }).format(parsed);
}

function Dashboard({ activePage, onNavigate }) {
  const [tasks, setTasks] = useState(initialTasks);
  const [filter, setFilter] = useState("all");
  const [search, setSearch] = useState("");
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [newTitle, setNewTitle] = useState("");
  const [newPriority, setNewPriority] = useState("medium");

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
        activePage !== "My Tasks" || task.status !== "completed";

      return matchesFilter && matchesSearch && matchesPage;
    });
  }, [tasks, filter, search, activePage]);

  const total = tasks.length;
  const pending = tasks.filter((task) => task.status === "pending").length;
  const inProgress = tasks.filter(
    (task) => task.status === "in_progress",
  ).length;
  const completed = tasks.filter((task) => task.status === "completed").length;

  function handleCreateTask(event) {
    event.preventDefault();

    const title = newTitle.trim();
    if (!title) return;

    setTasks((current) => [
      {
        _id: crypto.randomUUID(),
        title,
        description: "Created in the UI preview",
        priority: newPriority,
        status: "pending",
        dueDate: "",
      },
      ...current,
    ]);

    setNewTitle("");
    setNewPriority("medium");
    setShowCreateForm(false);
    setFilter("all");
    onNavigate("Dashboard");
  }

  function toggleTaskStatus(id) {
    setTasks((current) =>
      current.map((task) =>
        task._id === id
          ? {
              ...task,
              status: task.status === "completed" ? "pending" : "completed",
            }
          : task,
      ),
    );
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
            {activePage === "My Tasks" ? "My Tasks" : "Good morning!"}
          </h1>

          <p className="mt-2 text-sm text-slate-500 sm:text-base">
            {activePage === "My Tasks"
              ? "Focus on the work that matters."
              : "A little progress each day adds up to big results."}
          </p>
        </div>

        <button
          onClick={() => setShowCreateForm((visible) => !visible)}
          className="inline-flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-blue-600 to-violet-600 px-5 py-3 text-sm font-semibold text-white shadow-lg shadow-blue-600/20 transition hover:-translate-y-0.5 hover:shadow-xl"
        >
          <Plus size={18} />
          Create task
        </button>
      </section>

      {showCreateForm && (
        <form
          onSubmit={handleCreateTask}
          className="rounded-2xl border border-blue-100 bg-white p-5 shadow-sm sm:p-6"
        >
          <h2 className="text-lg font-semibold">Create a task</h2>

          <div className="mt-4 grid gap-4 sm:grid-cols-[1fr_180px_auto]">
            <input
              autoFocus
              value={newTitle}
              onChange={(event) => setNewTitle(event.target.value)}
              placeholder="What needs to get done?"
              maxLength={120}
              required
              className="min-w-0 rounded-xl border border-slate-200 px-4 py-3 text-sm outline-none transition focus:border-blue-400 focus:ring-4 focus:ring-blue-50"
            />

            <select
              value={newPriority}
              onChange={(event) => setNewPriority(event.target.value)}
              className="rounded-xl border border-slate-200 bg-white px-3 py-3 text-sm outline-none focus:border-blue-400"
            >
              <option value="low">Low priority</option>
              <option value="medium">Medium priority</option>
              <option value="high">High priority</option>
            </select>

            <button
              type="submit"
              className="rounded-xl bg-slate-900 px-5 py-3 text-sm font-semibold text-white hover:bg-slate-700"
            >
              Add task
            </button>
          </div>

          <p className="mt-3 text-xs text-slate-500">
            This is temporary UI state; API persistence comes next.
          </p>
        </form>
      )}

      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
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
      </section>

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
            {filteredTasks.map((task) => (
              <article
                key={task._id}
                className="flex items-start gap-3 px-5 py-5 transition hover:bg-slate-50/80 sm:items-center sm:px-6"
              >
                <button
                  onClick={() => toggleTaskStatus(task._id)}
                  aria-label={`Mark ${task.title} ${
                    task.status === "completed" ? "incomplete" : "complete"
                  }`}
                  title="Toggle completion"
                  className={`mt-0.5 shrink-0 transition sm:mt-0 ${
                    task.status === "completed"
                      ? "text-emerald-500"
                      : "text-slate-300 hover:text-blue-600"
                  }`}
                >
                  {task.status === "completed" ? (
                    <CheckCircle2 size={21} />
                  ) : (
                    <Circle size={21} />
                  )}
                </button>

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

                  <div className="mt-3 flex flex-wrap items-center gap-2 sm:hidden">
                    <StatusBadge value={task.priority} type="priority" />
                    <StatusBadge value={task.status} />
                  </div>
                </div>

                <div className="hidden shrink-0 items-center gap-5 sm:flex">
                  <div className="flex items-center gap-1.5 text-xs text-slate-400">
                    <CalendarDays size={14} />
                    {formatDate(task.dueDate)}
                  </div>

                  <StatusBadge value={task.priority} type="priority" />
                  <StatusBadge value={task.status} />
                </div>
              </article>
            ))}

            {filteredTasks.length === 0 && (
              <div className="px-6 py-14 text-center">
                <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-slate-100 text-slate-500">
                  <Target size={22} />
                </div>
                <h3 className="mt-4 font-semibold text-slate-800">
                  No tasks found
                </h3>
                <p className="mt-1 text-sm text-slate-500">
                  Try another filter or create a new task.
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
