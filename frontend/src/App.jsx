import { useEffect } from "react";
import { Navigate, Route, Routes } from "react-router-dom";
import Login from "./pages/Login";
import Signup from "./pages/Signup";
import Home from "./pages/Home";
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
      <div className="flex min-h-screen items-center justify-center px-6">
        <div className="w-full max-w-sm rounded-3xl border border-white/10 bg-slate-950/60 p-8 text-center shadow-soft backdrop-blur">
          <div className="mx-auto h-14 w-14 animate-pulse rounded-2xl bg-gradient-to-br from-accent to-highlight" />
          <p className="mt-6 text-sm uppercase tracking-[0.35em] text-slate-400">
            Syncing session
          </p>
          <h1 className="mt-3 text-2xl font-semibold text-white">Opening your workspace</h1>
          <p className="mt-2 text-sm text-slate-400">
            We&apos;re checking your account and reconnecting the live chat.
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
      </Routes>
    </>
  );
};

export default App;
