import { Bell, Menu, Search } from "lucide-react";

function Topbar({ onMenuClick, onNavigate }) {
  return (
    <header className="sticky top-0 z-30 flex h-20 items-center justify-between border-b border-slate-200/80 bg-white/90 px-4 backdrop-blur-xl sm:px-6 lg:px-8">
      <div className="flex items-center gap-3">
        <button
          onClick={onMenuClick}
          className="rounded-xl border border-slate-200 p-2 text-slate-600 hover:bg-slate-50 lg:hidden"
          aria-label="Open navigation menu"
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

        <button
          aria-label="Notifications"
          title="Notifications"
          className="relative rounded-xl p-2.5 text-slate-500 transition hover:bg-slate-100 hover:text-slate-900"
        >
          <Bell size={20} />
          <span className="absolute right-2 top-2 h-2 w-2 rounded-full border-2 border-white bg-blue-600" />
        </button>

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
      </div>
    </header>
  );
}

export default Topbar;
