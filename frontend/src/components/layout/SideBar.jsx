import {
  CheckSquare,
  LayoutDashboard,
  ListTodo,
  Bell,
  Plus,
  UserRound,
  X,
  Zap,
} from "lucide-react";

const navigation = [
  { label: "Dashboard", icon: LayoutDashboard },
  { label: "My Tasks", icon: ListTodo },
  { label: "Reminders", icon: Bell },
  { label: "Create Task", icon: Plus },
  { label: "Profile", icon: UserRound },
];

function Sidebar({ activePage, onNavigate, mobileMenuOpen }) {
  return (
    <aside
      className={`fixed inset-y-0 left-0 z-50 flex w-64 flex-col bg-slate-950 text-white transition-transform duration-300 ${
        mobileMenuOpen ? "translate-x-0" : "-translate-x-full"
      } lg:translate-x-0`}
    >
      <div className="flex h-20 items-center justify-between border-b border-white/10 px-6">
        <button
          onClick={() => onNavigate("Dashboard")}
          className="flex items-center gap-3"
          aria-label="Go to TaskFlow dashboard"
        >
          <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-blue-500 to-violet-600 shadow-lg shadow-blue-950/30">
            <CheckSquare size={23} strokeWidth={2.5} />
          </span>

          <span className="text-xl font-bold tracking-tight">
            Task<span className="text-blue-400">Flow</span>
          </span>
        </button>

        <button
          onClick={() => onNavigate(activePage)}
          className="rounded-lg p-2 text-slate-400 hover:bg-white/10 lg:hidden"
          aria-label="Close menu"
        >
          <X size={20} />
        </button>
      </div>

      <div className="px-4 pt-8">
        <p className="mb-3 px-3 text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">
          Workspace
        </p>

        <nav className="space-y-1">
          {navigation.map(({ label, icon: Icon }) => {
            const active = activePage === label;

            return (
              <button
                key={label}
                onClick={() => onNavigate(label)}
                aria-current={active ? "page" : undefined}
                className={`flex w-full items-center gap-3 rounded-xl px-3 py-3 text-sm font-medium transition ${
                  active
                    ? "bg-blue-600 text-white shadow-lg shadow-blue-950/30"
                    : "text-slate-400 hover:bg-white/5 hover:text-white"
                }`}
              >
                <Icon size={19} />
                <span>{label}</span>

                {label === "Create Task" && (
                  <span className="ml-auto rounded-md bg-white/10 px-2 py-0.5 text-xs">
                    +
                  </span>
                )}
              </button>
            );
          })}
        </nav>
      </div>

      <div className="mt-auto p-4">
        <div className="rounded-2xl border border-white/10 bg-white/[0.04] p-4">
          <div className="mb-3 flex h-9 w-9 items-center justify-center rounded-xl bg-violet-500/15 text-violet-300">
            <Zap size={19} />
          </div>
          <p className="text-sm font-semibold">Stay on track</p>
          <p className="mt-1 text-xs leading-5 text-slate-400">
            Small steps every day lead to big results.
          </p>
        </div>

        <p className="px-2 pt-5 text-xs text-slate-600">TaskFlow · Workspace</p>
      </div>
    </aside>
  );
}

export default Sidebar;
