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
          <label className="mb-2 block text-sm font-medium text-slate-200" htmlFor="fullName">
            Full name
          </label>
          <input
            id="fullName"
            name="fullName"
            type="text"
            autoComplete="name"
            value={formData.fullName}
            onChange={handleChange}
            className="w-full rounded-2xl border border-white/10 bg-slate-900/90 px-4 py-3.5 text-sm text-white outline-none transition placeholder:text-slate-500 focus:border-accent/60"
            placeholder="Jamie Rivera"
            required
          />
        </div>

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
            autoComplete="new-password"
            minLength={6}
            value={formData.password}
            onChange={handleChange}
            className="w-full rounded-2xl border border-white/10 bg-slate-900/90 px-4 py-3.5 text-sm text-white outline-none transition placeholder:text-slate-500 focus:border-accent/60"
            placeholder="At least 6 characters"
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
          disabled={isSigningUp}
          className="w-full rounded-2xl bg-gradient-to-r from-accent to-highlight px-4 py-3.5 text-sm font-semibold text-ink transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {isSigningUp ? "Creating account..." : "Create account"}
        </button>
      </form>
    </AuthShell>
  );
};

export default Signup;
