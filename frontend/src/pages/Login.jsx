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

  const inputStyle = {
    background: "var(--color-input-bg)",
    borderColor: "var(--color-input-border)",
    color: "var(--color-text-primary)",
  };

  return (
    <AuthShell
      eyebrow="Welcome back"
      title="Log in"
      description="Access your account and jump into your conversations."
      alternateLabel="Create account"
      alternateHref="/signup"
      alternateText="Need a profile?"
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label
            className="mb-1.5 block text-sm font-medium"
            style={{ color: "var(--color-text-primary)" }}
            htmlFor="email"
          >
            Email
          </label>
          <input
            id="email"
            name="email"
            type="email"
            autoComplete="email"
            value={formData.email}
            onChange={handleChange}
            className="w-full rounded-xl border px-3.5 py-3 text-sm outline-none transition-all theme-transition"
            style={inputStyle}
            placeholder="you@example.com"
            required
          />
        </div>

        <div>
          <label
            className="mb-1.5 block text-sm font-medium"
            style={{ color: "var(--color-text-primary)" }}
            htmlFor="password"
          >
            Password
          </label>
          <input
            id="password"
            name="password"
            type="password"
            autoComplete="current-password"
            value={formData.password}
            onChange={handleChange}
            className="w-full rounded-xl border px-3.5 py-3 text-sm outline-none transition-all theme-transition"
            style={inputStyle}
            placeholder="Enter your password"
            required
          />
        </div>

        {authError ? (
          <div
            className="rounded-xl border px-4 py-2.5 text-sm"
            style={{
              borderColor: "rgba(239,68,68,0.2)",
              background: "rgba(239,68,68,0.08)",
              color: "#ef4444",
            }}
          >
            {authError}
          </div>
        ) : null}

        <button
          type="submit"
          disabled={isLoggingIn}
          className="w-full rounded-xl py-3 text-sm font-semibold transition-all active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-50"
          style={{
            background: "var(--color-accent)",
            color: "#fff",
          }}
        >
          {isLoggingIn ? "Logging in…" : "Log in"}
        </button>
      </form>
    </AuthShell>
  );
};

export default Login;
