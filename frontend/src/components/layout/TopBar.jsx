import { Bell, LogOut, Menu, Search } from "lucide-react";
import { useState } from "react";
import { useAuth } from "../../context/AuthContext";

function Topbar({ onMenuClick, onNavigate, mobileMenuOpen }) {
  const { logout } = useAuth();
  const [loggingOut, setLoggingOut] = useState(false);
  const [showNotificationsMessage, setShowNotificationsMessage] = useState(false);

  async function handleLogout() {
    setLoggingOut(true);
    try {
      await logout();
    } finally {
      setLoggingOut(false);
    }
  }

  return (
    <header className="sticky top-0 z-30 flex h-20 items-center justify-between border-b border-slate-200/80 bg-white/90 px-4 backdrop-blur-xl sm:px-6 lg:px-8">
      <div className="flex items-center gap-3">
        <button
          onClick={onMenuClick}
          className="rounded-xl border border-slate-200 p-2 text-slate-600 hover:bg-slate-50 lg:hidden"
          aria-label={
            mobileMenuOpen ? "Close navigation menu" : "Open navigation menu"
          }
          aria-expanded={mobileMenuOpen}
        >
          <Menu size={20} />
        </button>

        <div>
          <p className="text-sm font-semibold text-slate-900">Workspace</p>
          <p className="hidden text-xs text-slate-500 sm:block">
            Make today productive.
          </p>
        </div>
      </div>

      <div className="flex items-center gap-3 sm:gap-5">
        <label className="hidden h-10 w-56 items-center gap-2 rounded-xl border border-slate-200 bg-slate-50 px-3 focus-within:border-blue-400 md:flex">
          <Search size={17} className="text-slate-400" />
          <input
            type="search"
            aria-label="Search tasks"
            placeholder="Search tasks..."
            className="w-full bg-transparent text-sm outline-none placeholder:text-slate-400"
            onChange={(event) => {
              window.dispatchEvent(
                new CustomEvent("taskflow:search", {
                  detail: event.target.value,
                }),
              );
            }}
          />
          <kbd className="rounded border border-slate-200 bg-white px-1.5 py-0.5 text-[10px] text-slate-400">
            /
          </kbd>
        </label>

        <div className="relative">
          <button
            type="button"
            aria-label="Notifications, currently unavailable"
            aria-expanded={showNotificationsMessage}
            onClick={() => setShowNotificationsMessage((visible) => !visible)}
            className="rounded-xl p-2.5 text-slate-500 transition hover:bg-slate-100 hover:text-slate-900"
          >
            <Bell size={20} />
          </button>
          {showNotificationsMessage && (
            <p
              role="status"
              className="absolute right-0 top-full z-40 mt-2 w-52 rounded-lg border border-slate-200 bg-white p-3 text-xs text-slate-600 shadow-lg"
            >
              Notifications are not available yet.
            </p>
          )}
        </div>

        <button
          onClick={() => onNavigate("Profile")}
          className="flex items-center gap-3 rounded-xl p-1.5 pr-2 transition hover:bg-slate-100"
        >
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-blue-500 to-violet-600 text-sm font-bold text-white">
            TF
          </div>

          <div className="hidden text-left sm:block">
            <p className="text-sm font-semibold text-slate-800">My Account</p>
            <p className="text-xs text-slate-500">Workspace member</p>
          </div>
        </button>

        <button
          type="button"
          onClick={handleLogout}
          disabled={loggingOut}
          className="inline-flex items-center gap-2 rounded-xl border border-slate-200 px-3 py-2 text-sm font-semibold text-slate-600 transition hover:bg-slate-50 hover:text-slate-900 disabled:cursor-wait disabled:opacity-60"
        >
          <LogOut size={17} />
          <span>{loggingOut ? "Signing out..." : "Logout"}</span>
        </button>
      </div>
    </header>
  );
}

export default Topbar;
