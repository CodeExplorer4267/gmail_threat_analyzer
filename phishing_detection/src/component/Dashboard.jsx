import { useEffect, useState } from "react";
import { motion as Motion } from "framer-motion";
import { FaArrowLeftLong } from "react-icons/fa6";
import { HiOutlineClock } from "react-icons/hi2";
import { Link, NavLink, Navigate, Route, Routes, useLocation, useNavigate } from "react-router-dom";
import DashboardHome from "./dashboard/DashboardHome";
import EmailDetectionPage from "./dashboard/EmailDetectionPage";
import FileDetectionPage from "./dashboard/FileDetectionPage";
import Panel from "./dashboard/Panel";
import WebsiteDetectionPage from "./dashboard/WebsiteDetectionPage";
import {
  API_BASE,
  formatDate,
  getAvatarLetters,
  getCurrentWorkspacePage,
  workspaceNavigation,
} from "./dashboardUtils";

async function apiRequest(path, options = {}) {
  const response = await fetch(`${API_BASE}${path}`, {
    credentials: "include",
    headers: {
      "Content-Type": "application/json",
      ...(options.headers || {}),
    },
    ...options,
  });

  const payload = await response.json().catch(() => ({}));
  if (!response.ok) {
    throw new Error(payload.message || "Something went wrong. Please try again.");
  }

  return payload;
}

export default function Dashboard() {
  const location = useLocation();
  const navigate = useNavigate();
  const [session, setSession] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const currentPage = getCurrentWorkspacePage(location.pathname);

  useEffect(() => {
    let isMounted = true;

    async function loadSession() {
      try {
        const data = await apiRequest("/auth/session", { method: "GET" });
        if (isMounted) {
          setSession(data.session);
        }
      } catch {
        if (isMounted) {
          navigate("/login", { replace: true });
        }
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    }

    loadSession();

    return () => {
      isMounted = false;
    };
  }, [navigate]);

  const handleLogout = async () => {
    setIsLoggingOut(true);
    try {
      await apiRequest("/auth/logout", { method: "POST", body: JSON.stringify({}) });
    } catch {
      // Keep navigation responsive even if the backend session already expired.
    } finally {
      setIsLoggingOut(false);
      navigate("/login", { replace: true });
    }
  };

  if (loading) {
    return (
      <div className="relative flex min-h-screen items-center justify-center overflow-hidden bg-[#080511] text-white">
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top_left,_rgba(139,92,246,0.3),_transparent_25%),linear-gradient(135deg,_#140a22_0%,_#080511_50%,_#11081f_100%)]" />
        <p className="relative z-10 text-slate-300">Loading your workspace...</p>
      </div>
    );
  }

  if (!session) {
    return null;
  }

  return (
    <div className="relative min-h-screen overflow-hidden bg-[#080511] text-white">
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,_rgba(139,92,246,0.3),_transparent_25%),radial-gradient(circle_at_85%_15%,_rgba(217,70,239,0.18),_transparent_22%),linear-gradient(135deg,_#140a22_0%,_#080511_50%,_#11081f_100%)]" />
        <div className="absolute left-14 top-20 h-80 w-80 rounded-full bg-violet-500/18 blur-[120px]" />
        <div className="absolute bottom-10 right-10 h-96 w-96 rounded-full bg-fuchsia-500/12 blur-[160px]" />
      </div>

      <div className="relative z-10 mx-auto flex min-h-screen w-full max-w-7xl flex-col gap-6 px-4 py-4 sm:px-6 lg:flex-row lg:px-8">
        <aside className="w-full shrink-0 lg:w-[300px]">
          <Panel className="sticky top-4 p-6">
            <Link
              to="/"
              className="inline-flex items-center gap-3 rounded-full border border-white/10 bg-white/[0.04] px-4 py-3 text-sm text-slate-200 transition hover:border-violet-200/40 hover:text-white"
            >
              <FaArrowLeftLong />
              Back to Home
            </Link>

            <div className="mt-8">
              <p className="text-xs uppercase tracking-[0.35em] text-violet-200/70">Threat Shield</p>
              <h1 className="mt-3 text-3xl font-semibold tracking-[-0.03em] text-white">Security workspace</h1>
              <p className="mt-3 text-sm leading-7 text-slate-400">
                Post-login navigation for dashboard, email detection, website detection, and file detection.
              </p>
            </div>

            <nav className="mt-8 space-y-3">
              {workspaceNavigation.map((item) => (
                <NavLink
                  key={item.path}
                  to={item.path}
                  end={item.path === "/dashboard"}
                  className={({ isActive }) =>
                    `block rounded-[1.5rem] border px-4 py-4 transition ${
                      isActive
                        ? "border-violet-300/30 bg-violet-400/12 text-white"
                        : "border-white/10 bg-white/[0.03] text-slate-300 hover:border-violet-200/20 hover:bg-white/[0.05]"
                    }`
                  }
                >
                  <div className="flex items-start gap-4">
                    <div className="mt-0.5 rounded-2xl border border-violet-300/20 bg-violet-400/10 p-3 text-lg text-violet-100">
                      <item.icon />
                    </div>
                    <div>
                      <p className="text-base font-semibold">{item.label}</p>
                      <p className="mt-1 text-sm leading-6 text-slate-400">{item.description}</p>
                    </div>
                  </div>
                </NavLink>
              ))}
            </nav>

            <div className="mt-8 rounded-[1.6rem] border border-violet-300/20 bg-violet-400/10 p-5">
              <div className="flex items-start gap-3">
                <HiOutlineClock className="mt-1 text-lg text-violet-100" />
                <div>
                  <p className="text-xs uppercase tracking-[0.24em] text-violet-100/70">Session expiry</p>
                  <p className="mt-2 text-sm leading-6 text-slate-100">{formatDate(session.expiresAt)}</p>
                </div>
              </div>
            </div>
          </Panel>
        </aside>

        <div className="flex min-h-screen flex-1 flex-col gap-6">
          <Panel className="sticky top-4 z-20 p-5 sm:p-6">
            <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
              <div>
                <p className="text-xs uppercase tracking-[0.32em] text-violet-200/70">Workspace</p>
                <h2 className="mt-2 text-3xl font-semibold tracking-[-0.03em] text-white">
                  {currentPage.label}
                </h2>
                <p className="mt-2 max-w-2xl text-sm leading-7 text-slate-400">
                  {currentPage.description}
                </p>
              </div>

              <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
                <div className="flex items-center gap-4 rounded-full border border-white/10 bg-white/[0.04] px-4 py-3">
                  <div className="flex h-12 w-12 items-center justify-center rounded-full bg-violet-400 text-sm font-semibold text-slate-950">
                    {getAvatarLetters(session.email)}
                  </div>
                  <div>
                    <p className="text-xs uppercase tracking-[0.24em] text-slate-500">Profile</p>
                    <p className="mt-1 text-sm font-semibold text-white">{session.email}</p>
                  </div>
                </div>

                <button
                  type="button"
                  className="rounded-full border border-white/10 bg-white/[0.04] px-5 py-4 text-sm font-semibold text-slate-200 transition hover:border-rose-300/30 hover:bg-rose-500/10 disabled:cursor-not-allowed disabled:opacity-60"
                  onClick={handleLogout}
                  disabled={isLoggingOut}
                >
                  {isLoggingOut ? "Signing out..." : "Sign out"}
                </button>
              </div>
            </div>
          </Panel>

          <Motion.main
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.45 }}
            className="pb-6"
          >
            <Routes>
              <Route index element={<DashboardHome session={session} />} />
              <Route path="email-detection" element={<EmailDetectionPage session={session} />} />
              <Route path="website-detection" element={<WebsiteDetectionPage />} />
              <Route path="file-detection" element={<FileDetectionPage />} />
              <Route path="*" element={<Navigate to="/dashboard" replace />} />
            </Routes>
          </Motion.main>
        </div>
      </div>
    </div>
  );
}
