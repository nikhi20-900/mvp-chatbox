import { useEffect } from "react";
import { Navigate, Route, Routes } from "react-router-dom";
import Login from "./pages/Login";
import Signup from "./pages/Signup";
import Home from "./pages/Home";
import Profile from "./pages/Profile";
import ToastStack from "./components/ToastStack";
import useAuthStore from "./store/authStore";

const App = () => {
  const { authUser, isCheckingAuth, checkAuth, connectSocket, disconnectSocket } =
    useAuthStore();

  useEffect(() => {
    checkAuth();
  }, [checkAuth]);

  useEffect(() => {
    if (authUser) {
      connectSocket();
    }

    return () => {
      disconnectSocket();
    };
  }, [authUser, connectSocket, disconnectSocket]);

  if (isCheckingAuth) {
    return (
      <div
        className="flex min-h-screen items-center justify-center px-6"
        style={{ background: "var(--color-bg-page)" }}
      >
        <div
          className="w-full max-w-sm rounded-2xl border p-8 text-center theme-transition"
          style={{
            background: "var(--color-panel)",
            borderColor: "var(--color-border)",
          }}
        >
          <div
            className="mx-auto h-12 w-12 animate-pulse rounded-xl"
            style={{ background: "var(--color-accent)" }}
          />
          <p
            className="mt-5 text-xs uppercase tracking-widest"
            style={{ color: "var(--color-text-muted)" }}
          >
            Syncing session
          </p>
          <h1
            className="mt-2 text-xl font-semibold"
            style={{ color: "var(--color-text-primary)" }}
          >
            Opening your workspace
          </h1>
          <p className="mt-1.5 text-sm" style={{ color: "var(--color-text-secondary)" }}>
            Checking your account and reconnecting the live chat.
          </p>
        </div>
      </div>
    );
  }

  return (
    <>
      <ToastStack />
      <Routes>
        <Route path="/" element={authUser ? <Home /> : <Navigate to="/login" replace />} />
        <Route path="/login" element={!authUser ? <Login /> : <Navigate to="/" replace />} />
        <Route path="/signup" element={!authUser ? <Signup /> : <Navigate to="/" replace />} />
        <Route
          path="/profile"
          element={authUser ? <Profile /> : <Navigate to="/login" replace />}
        />
      </Routes>
    </>
  );
};

export default App;
