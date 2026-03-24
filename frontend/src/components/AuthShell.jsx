import { Link } from "react-router-dom";

const AuthShell = ({
  eyebrow,
  title,
  description,
  alternateLabel,
  alternateHref,
  alternateText,
  children,
}) => (
  <div className="relative flex min-h-screen items-center justify-center overflow-hidden px-4 py-10 sm:px-6">
    <div className="relative grid w-full max-w-5xl gap-6 lg:grid-cols-[1fr_1fr]">
      {/* Left promo panel */}
      <section
        className="hidden rounded-2xl border p-8 lg:block theme-transition"
        style={{
          background: "var(--color-panel)",
          borderColor: "var(--color-border)",
        }}
      >
        <p
          className="text-xs font-semibold uppercase tracking-widest"
          style={{ color: "var(--color-accent)" }}
        >
          {eyebrow}
        </p>
        <h1
          className="mt-5 max-w-md text-4xl font-bold leading-tight"
          style={{ color: "var(--color-text-primary)" }}
        >
          Conversations that feel immediate.
        </h1>
        <p
          className="mt-4 max-w-lg text-sm leading-7"
          style={{ color: "var(--color-text-secondary)" }}
        >
          Launch a clean real-time workspace for one-to-one messaging, fast account access,
          and instant delivery powered by Socket.io.
        </p>

        <div className="mt-8 grid gap-3 sm:grid-cols-2">
          <div
            className="rounded-xl border p-4 theme-transition"
            style={{
              borderColor: "var(--color-border)",
              background: "var(--color-input-bg)",
            }}
          >
            <p className="text-sm font-medium" style={{ color: "var(--color-text-primary)" }}>
              Live delivery
            </p>
            <p className="mt-1.5 text-xs leading-5" style={{ color: "var(--color-text-muted)" }}>
              Messages appear the moment the server emits them.
            </p>
          </div>
          <div
            className="rounded-xl border p-4 theme-transition"
            style={{
              borderColor: "var(--color-border)",
              background: "var(--color-input-bg)",
            }}
          >
            <p className="text-sm font-medium" style={{ color: "var(--color-text-primary)" }}>
              Minimal flow
            </p>
            <p className="mt-1.5 text-xs leading-5" style={{ color: "var(--color-text-muted)" }}>
              Sign up, pick a person, and start chatting instantly.
            </p>
          </div>
        </div>
      </section>

      {/* Right form panel */}
      <section
        className="rounded-2xl border p-6 sm:p-8 theme-transition"
        style={{
          background: "var(--color-panel)",
          borderColor: "var(--color-border)",
        }}
      >
        <div className="flex items-center justify-between gap-4">
          <div>
            <p
              className="text-xs font-semibold uppercase tracking-widest"
              style={{ color: "var(--color-accent)" }}
            >
              {eyebrow}
            </p>
            <h2
              className="mt-2 text-2xl font-bold"
              style={{ color: "var(--color-text-primary)" }}
            >
              {title}
            </h2>
            <p className="mt-1 text-sm" style={{ color: "var(--color-text-secondary)" }}>
              {description}
            </p>
          </div>
          <Link
            to={alternateHref}
            className="shrink-0 rounded-lg border px-3 py-1.5 text-sm font-medium transition hover:opacity-80 theme-transition"
            style={{
              borderColor: "var(--color-border)",
              color: "var(--color-text-secondary)",
            }}
          >
            {alternateLabel}
          </Link>
        </div>

        <div className="mt-6">{children}</div>

        <p className="mt-5 text-sm" style={{ color: "var(--color-text-muted)" }}>
          {alternateText}{" "}
          <Link
            to={alternateHref}
            className="font-medium transition hover:opacity-80"
            style={{ color: "var(--color-accent)" }}
          >
            {alternateLabel}
          </Link>
        </p>
      </section>
    </div>
  </div>
);

export default AuthShell;
