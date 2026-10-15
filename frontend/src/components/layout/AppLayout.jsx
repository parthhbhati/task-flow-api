import { useState } from "react";
import Sidebar from "./Sidebar";
import Topbar from "./Topbar";

function AppLayout({ children, activePage, onNavigate }) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900">
      {mobileMenuOpen && (
        <button
          type="button"
          aria-label="Close navigation menu"
          className="fixed inset-0 z-40 bg-slate-950/40 lg:hidden"
          onClick={() => setMobileMenuOpen(false)}
        />
      )}

      <Sidebar
        activePage={activePage}
        onNavigate={(page) => {
          onNavigate(page);
          setMobileMenuOpen(false);
        }}
        mobileMenuOpen={mobileMenuOpen}
      />

      <div className="min-h-screen lg:pl-64">
        <Topbar
          onMenuClick={() => setMobileMenuOpen(true)}
          onNavigate={onNavigate}
        />

        <main className="mx-auto w-full max-w-[1600px] p-4 sm:p-6 lg:p-8">
          {children}
        </main>
      </div>
    </div>
  );
}

export default AppLayout;
