import { useEffect, useState } from "react";
import AuthShell from "../components/AuthShell";
import useAuthStore from "../store/authStore";
import useUIStore from "../store/uiStore";

const isValidEmail = (value) => /\S+@\S+\.\S+/.test(value);

const Signup = () => {
  const { signup, isSigningUp, authError, clearAuthError } = useAuthStore();
  const showToast = useUIStore((state) => state.showToast);
  const [formData, setFormData] = useState({
    fullName: "",
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
    const fullName = formData.fullName.trim();
    const email = formData.email.trim().toLowerCase();

    if (fullName.length < 2) {
      showToast({ type: "error", message: "Full name must be at least 2 characters." });
      return;
    }

    if (!isValidEmail(email)) {
      showToast({ type: "error", message: "Enter a valid email address." });
      return;
    }

    if (formData.password.length < 6) {
      showToast({ type: "error", message: "Password must be at least 6 characters." });
      return;
    }

    const result = await signup({
      fullName,
      email,
      password: formData.password,
    });

    if (result.success) {
      showToast({ type: "success", message: "Account created. You are now logged in." });
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
      eyebrow="Create your space"
      title="Sign up"
      description="Set up a profile in a few seconds and open a real-time chat workspace."
      alternateLabel="Log in"
      alternateHref="/login"
      alternateText="Already have an account?"
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label
            className="mb-1.5 block text-sm font-medium"
            style={{ color: "var(--color-text-primary)" }}
            htmlFor="fullName"
          >
            Full name
          </label>
          <input
            id="fullName"
            name="fullName"
            type="text"
            autoComplete="name"
            value={formData.fullName}
            onChange={handleChange}
            className="w-full rounded-xl border px-3.5 py-3 text-sm outline-none transition-all theme-transition"
            style={inputStyle}
            placeholder="Jamie Rivera"
            required
          />
        </div>

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
            autoComplete="new-password"
            minLength={6}
            value={formData.password}
            onChange={handleChange}
            className="w-full rounded-xl border px-3.5 py-3 text-sm outline-none transition-all theme-transition"
            style={inputStyle}
            placeholder="At least 6 characters"
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
          disabled={isSigningUp}
          className="w-full rounded-xl py-3 text-sm font-semibold transition-all active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-50"
          style={{
            background: "var(--color-accent)",
            color: "#fff",
          }}
        >
          {isSigningUp ? "Creating account…" : "Create account"}
        </button>
      </form>
    </AuthShell>
  );
};

export default Signup;
