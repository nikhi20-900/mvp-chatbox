import { useEffect, useState } from "react";
import AuthShell from "../components/AuthShell";
import useAuthStore from "../store/authStore";
import useUIStore from "../store/uiStore";

const isValidEmail = (value) => /\S+@\S+\.\S+/.test(value);

const Login = () => {
  const { login, isLoggingIn, authError, clearAuthError } = useAuthStore();
  const showToast = useUIStore((state) => state.showToast);
  const [formData, setFormData] = useState({
    email: "",
    password: "",
  });

  useEffect(() => clearAuthError, [clearAuthError]);

  const handleChange = (event) => {
    const { name, value } = event.target;
    setFormData((current) => ({ ...current, [name]: value }));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    const email = formData.email.trim().toLowerCase();

    if (!isValidEmail(email)) {
      showToast({ type: "error", message: "Enter a valid email address." });
      return;
    }

    if (!formData.password.trim()) {
      showToast({ type: "error", message: "Password is required." });
      return;
    }

    const result = await login({
      email,
      password: formData.password,
    });

    if (result.success) {
      showToast({ type: "success", message: "Logged in successfully." });
      return;
    }

    if (result.message) {
      showToast({ type: "error", message: result.message });
    }
  };

  return (
    <AuthShell
      eyebrow="Welcome back"
      title="Log in"
      description="Access your account and jump straight into your active conversations."
      alternateLabel="Create account"
      alternateHref="/signup"
      alternateText="Need a profile?"
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="mb-2 block text-sm font-medium text-slate-200" htmlFor="email">
            Email
          </label>
          <input
            id="email"
            name="email"
            type="email"
            autoComplete="email"
            value={formData.email}
            onChange={handleChange}
            className="w-full rounded-2xl border border-white/10 bg-slate-900/90 px-4 py-3.5 text-sm text-white outline-none transition placeholder:text-slate-500 focus:border-accent/60"
            placeholder="you@example.com"
            required
          />
        </div>

        <div>
          <label className="mb-2 block text-sm font-medium text-slate-200" htmlFor="password">
            Password
          </label>
          <input
            id="password"
            name="password"
            type="password"
            autoComplete="current-password"
            value={formData.password}
            onChange={handleChange}
            className="w-full rounded-2xl border border-white/10 bg-slate-900/90 px-4 py-3.5 text-sm text-white outline-none transition placeholder:text-slate-500 focus:border-accent/60"
            placeholder="Enter your password"
            required
          />
        </div>

        {authError ? (
          <div className="rounded-2xl border border-rose-400/20 bg-rose-400/10 px-4 py-3 text-sm text-rose-100">
            {authError}
          </div>
        ) : null}

        <button
          type="submit"
          disabled={isLoggingIn}
          className="w-full rounded-2xl bg-gradient-to-r from-accent to-highlight px-4 py-3.5 text-sm font-semibold text-ink transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {isLoggingIn ? "Logging in..." : "Log in"}
        </button>
      </form>
    </AuthShell>
  );
};

export default Login;
