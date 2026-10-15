import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { UserRound, Mail, LockKeyhole, ArrowRight, User } from "lucide-react";
import api, { getApiErrorMessage } from "../lib/api";

function Register() {
  const navigate = useNavigate();

  const [form, setForm] = useState({
    fullName: "",
    username: "",
    email: "",
    password: "",
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

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
    setSuccess("");
    setLoading(true);

    try {
      const response = await api.post("/users/register", {
        fullName: form.fullName.trim(),
        username: form.username.trim(),
        email: form.email.trim(),
        password: form.password,
      });

      setSuccess(response.data?.message || "Account created successfully!");

      // Registration does not log the user in automatically.
      setTimeout(() => {
        navigate("/login");
      }, 1000);
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
          GET STARTED
        </p>

        <h1 className="text-3xl font-bold tracking-tight text-slate-900">
          Create your account
        </h1>

        <p className="mt-3 text-sm leading-6 text-slate-500">
          Build better habits and keep all your tasks organized.
        </p>

        <form onSubmit={handleSubmit} className="mt-8 space-y-5">
          <div>
            <label
              htmlFor="fullName"
              className="mb-2 block text-sm font-medium text-slate-700"
            >
              Full name
            </label>

            <div className="relative">
              <User className="absolute left-3.5 top-1/2 size-5 -translate-y-1/2 text-slate-400" />

              <input
                id="fullName"
                name="fullName"
                type="text"
                autoComplete="name"
                value={form.fullName}
                onChange={handleChange}
                placeholder="Your full name"
                required
                maxLength={100}
                className="w-full rounded-xl border border-slate-200 py-3 pl-11 pr-4 text-sm outline-none transition focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10"
              />
            </div>
          </div>

          <div>
            <label
              htmlFor="username"
              className="mb-2 block text-sm font-medium text-slate-700"
            >
              Username
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
                placeholder="Choose a username"
                required
                className="w-full rounded-xl border border-slate-200 py-3 pl-11 pr-4 text-sm outline-none transition focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10"
              />
            </div>
          </div>

          <div>
            <label
              htmlFor="email"
              className="mb-2 block text-sm font-medium text-slate-700"
            >
              Email address
            </label>

            <div className="relative">
              <Mail className="absolute left-3.5 top-1/2 size-5 -translate-y-1/2 text-slate-400" />

              <input
                id="email"
                name="email"
                type="email"
                autoComplete="email"
                value={form.email}
                onChange={handleChange}
                placeholder="you@example.com"
                required
                className="w-full rounded-xl border border-slate-200 py-3 pl-11 pr-4 text-sm outline-none transition focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10"
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
                autoComplete="new-password"
                value={form.password}
                onChange={handleChange}
                placeholder="Create a password"
                required
                minLength={8}
                className="w-full rounded-xl border border-slate-200 py-3 pl-11 pr-4 text-sm outline-none transition focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10"
              />
            </div>

            <p className="mt-2 text-xs text-slate-400">
              Use at least 8 characters.
            </p>
          </div>

          {error && (
            <div
              role="alert"
              className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700"
            >
              {error}
            </div>
          )}

          {success && (
            <div
              role="status"
              className="rounded-xl border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-700"
            >
              {success}
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="flex w-full items-center justify-center gap-2 rounded-xl bg-indigo-600 px-4 py-3.5 text-sm font-semibold text-white transition hover:bg-indigo-700 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {loading ? "Creating account..." : "Create account"}
            {!loading && <ArrowRight className="size-4" />}
          </button>
        </form>

        <p className="mt-7 text-center text-sm text-slate-500">
          Already have an account?{" "}
          <Link
            to="/login"
            className="font-semibold text-indigo-600 hover:text-indigo-700"
          >
            Sign in
          </Link>
        </p>
      </section>
    </main>
  );
}

export default Register;
