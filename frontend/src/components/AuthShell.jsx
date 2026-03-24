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
    <div className="absolute inset-0 opacity-90">
      <div className="absolute left-[-7rem] top-10 h-52 w-52 rounded-full bg-accent/20 blur-3xl" />
      <div className="absolute bottom-10 right-[-4rem] h-64 w-64 rounded-full bg-highlight/20 blur-3xl" />
    </div>

    <div className="relative grid w-full max-w-6xl gap-6 lg:grid-cols-[1.05fr_0.95fr]">
      <section className="hidden rounded-[2rem] border border-white/10 bg-slate-950/50 p-10 shadow-soft backdrop-blur lg:block">
        <p className="text-xs font-semibold uppercase tracking-[0.45em] text-accent">{eyebrow}</p>
        <h1 className="mt-6 max-w-md text-5xl font-semibold leading-tight text-white">
          Conversations that feel immediate.
        </h1>
        <p className="mt-5 max-w-lg text-base leading-7 text-slate-300">
          Launch a clean real-time workspace for one-to-one messaging, fast account access,
          and instant delivery powered by Socket.io.
        </p>

        <div className="mt-10 grid gap-4 sm:grid-cols-2">
          <div className="rounded-3xl border border-white/10 bg-white/5 p-5">
            <p className="text-sm font-medium text-white">Live delivery</p>
            <p className="mt-2 text-sm leading-6 text-slate-400">
              Messages land in the active thread the moment the server emits them.
            </p>
          </div>
          <div className="rounded-3xl border border-white/10 bg-white/5 p-5">
            <p className="text-sm font-medium text-white">Minimal flow</p>
            <p className="mt-2 text-sm leading-6 text-slate-400">
              Sign up, pick a person, and start chatting without extra setup friction.
            </p>
          </div>
        </div>
      </section>

      <section className="rounded-[2rem] border border-white/10 bg-slate-950/70 p-6 shadow-soft backdrop-blur sm:p-8">
        <div className="flex items-center justify-between gap-4">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.35em] text-accent">
              {eyebrow}
            </p>
            <h2 className="mt-3 text-3xl font-semibold text-white">{title}</h2>
            <p className="mt-2 text-sm leading-6 text-slate-400">{description}</p>
          </div>
          <Link
            to={alternateHref}
            className="rounded-full border border-white/10 px-4 py-2 text-sm font-medium text-slate-200 transition hover:border-accent/60 hover:text-white"
          >
            {alternateLabel}
          </Link>
        </div>

        <div className="mt-8">{children}</div>

        <p className="mt-6 text-sm text-slate-400">
          {alternateText}{" "}
          <Link to={alternateHref} className="font-medium text-accent hover:text-white">
            {alternateLabel}
          </Link>
        </p>
      </section>
    </div>
  </div>
);

export default AuthShell;
