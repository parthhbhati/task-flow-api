import { useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { LockKeyhole, UserRound, ArrowRight } from "lucide-react";
import api from "../lib/api";
import { getApiErrorMessage } from "../lib/api";
import { useAuth } from "../context/AuthContext";

function Login() {
  const navigate = useNavigate();
  const location = useLocation();
  const { login, logoutError } = useAuth();
  const [form, setForm] = useState({
    username: "",
    password: "",
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleChange = (event) => {
    const { name, value } = event.target;

    setForm((previous) => ({
      ...previous,
      [name]: value,
    }));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError("");
    setLoading(true);

    try {
      const identifier = form.username.trim();
      const response = await api.post("/users/login", {
        // Usernames may contain "@", so let the backend search both fields.
        username: identifier,
        email: identifier,
        password: form.password,
      });

      const userData = response.data?.data?.user;

      if (!userData) {
        throw new Error("Login succeeded, but user data was missing.");
      }

      login(userData);

      const destination = location.state?.from?.pathname || "/";
      navigate(destination, { replace: true });
    } catch (err) {
      setError(getApiErrorMessage(err));
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="flex min-h-screen items-center justify-center bg-slate-50 px-4 py-10">
      <section className="w-full max-w-md rounded-3xl border border-slate-200 bg-white p-8 shadow-xl shadow-slate-200/50 sm:p-10">
        <Link to="/" className="mb-8 flex items-center gap-3">
          <span className="grid size-11 place-items-center rounded-xl bg-indigo-600 text-lg font-bold text-white">
            T
          </span>
          <span className="text-xl font-bold tracking-tight text-slate-900">
            TaskFlow
          </span>
        </Link>

        <p className="mb-2 text-sm font-semibold text-indigo-600">
          WELCOME BACK
        </p>

        <h1 className="text-3xl font-bold tracking-tight text-slate-900">
          Sign in to your account
        </h1>

        <p className="mt-3 text-sm leading-6 text-slate-500">
          Pick up where you left off and keep your tasks moving.
        </p>

        <form onSubmit={handleSubmit} className="mt-8 space-y-5">
          <div>
            <label
              htmlFor="username"
              className="mb-2 block text-sm font-medium text-slate-700"
            >
              Username or email
            </label>

            <div className="relative">
              <UserRound className="absolute left-3.5 top-1/2 size-5 -translate-y-1/2 text-slate-400" />

              <input
                id="username"
                name="username"
                type="text"
                autoComplete="username"
                value={form.username}
                onChange={handleChange}
                placeholder="Enter username or email"
                required
                className="w-full rounded-xl border border-slate-200 bg-white py-3 pl-11 pr-4 text-sm outline-none transition focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10"
              />
            </div>
          </div>

          <div>
            <label
              htmlFor="password"
              className="mb-2 block text-sm font-medium text-slate-700"
            >
              Password
            </label>

            <div className="relative">
              <LockKeyhole className="absolute left-3.5 top-1/2 size-5 -translate-y-1/2 text-slate-400" />

              <input
                id="password"
                name="password"
                type="password"
                autoComplete="current-password"
                value={form.password}
                onChange={handleChange}
                placeholder="Enter your password"
                required
                className="w-full rounded-xl border border-slate-200 bg-white py-3 pl-11 pr-4 text-sm outline-none transition focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10"
              />
            </div>
          </div>

          {(error || logoutError) && (
            <div
              role="alert"
              className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700"
            >
              {error || `Logout request failed; your local session was cleared. ${logoutError}`}
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="flex w-full items-center justify-center gap-2 rounded-xl bg-indigo-600 px-4 py-3.5 text-sm font-semibold text-white transition hover:bg-indigo-700 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {loading ? "Signing in..." : "Sign in"}
            {!loading && <ArrowRight className="size-4" />}
          </button>
        </form>

        <p className="mt-7 text-center text-sm text-slate-500">
          Don't have an account?{" "}
          <Link
            to="/register"
            className="font-semibold text-indigo-600 hover:text-indigo-700"
          >
            Create one
          </Link>
        </p>
      </section>
    </main>
  );
}

export default Login;
