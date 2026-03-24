import { useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import useAuthStore from "../store/authStore";
import useUIStore from "../store/uiStore";

const Profile = () => {
  const navigate = useNavigate();
  const { authUser, updateProfile, isUpdatingProfile } = useAuthStore();
  const showToast = useUIStore((state) => state.showToast);

  const [fullName, setFullName] = useState(authUser?.fullName || "");
  const [avatarPreview, setAvatarPreview] = useState(authUser?.avatar || "");
  const [avatarData, setAvatarData] = useState(authUser?.avatar || "");
  const fileInputRef = useRef(null);

  const getInitials = (name = "") =>
    name
      .split(" ")
      .slice(0, 2)
      .map((part) => part[0]?.toUpperCase() || "")
      .join("");

  const handleAvatarChange = (event) => {
    const file = event.target.files?.[0];

    if (!file) {
      return;
    }

    if (!file.type.startsWith("image/")) {
      showToast({ type: "error", message: "Please select an image file." });
      return;
    }

    if (file.size > 1_000_000) {
      showToast({ type: "error", message: "Image must be under 1MB." });
      return;
    }

    const reader = new FileReader();

    reader.onload = (e) => {
      const base64 = e.target.result;
      setAvatarPreview(base64);
      setAvatarData(base64);
    };

    reader.readAsDataURL(file);
  };

  const handleSave = async () => {
    const trimmedName = fullName.trim();

    if (!trimmedName || trimmedName.length < 2) {
      showToast({ type: "error", message: "Name must be at least 2 characters." });
      return;
    }

    const result = await updateProfile({
      fullName: trimmedName,
      avatar: avatarData,
    });

    if (result.success) {
      showToast({ type: "success", message: "Profile updated." });
      navigate("/");
    } else {
      showToast({ type: "error", message: result.message || "Failed to update profile." });
    }
  };

  return (
    <main
      className="flex min-h-screen items-center justify-center px-4 py-8"
      style={{ background: "var(--color-bg-page)" }}
    >
      <div
        className="w-full max-w-md rounded-2xl border p-6 sm:p-8 theme-transition"
        style={{
          background: "var(--color-panel)",
          borderColor: "var(--color-border)",
        }}
      >
        {/* Back link */}
        <button
          type="button"
          onClick={() => navigate("/")}
          className="mb-5 flex items-center gap-1.5 text-sm font-medium transition hover:opacity-80"
          style={{ color: "var(--color-accent)" }}
        >
          ← Back to chat
        </button>

        <h1
          className="text-xl font-bold"
          style={{ color: "var(--color-text-primary)" }}
        >
          Edit Profile
        </h1>
        <p className="mt-1 text-sm" style={{ color: "var(--color-text-muted)" }}>
          Update your name and profile picture.
        </p>

        {/* Avatar section */}
        <div className="mt-6 flex flex-col items-center gap-3">
          <div
            className="relative cursor-pointer group"
            onClick={() => fileInputRef.current?.click()}
          >
            {avatarPreview ? (
              <img
                src={avatarPreview}
                alt="Avatar preview"
                className="h-24 w-24 rounded-full object-cover ring-2 ring-offset-2 transition group-hover:ring-4"
                style={{
                  ringColor: "var(--color-accent)",
                  ringOffsetColor: "var(--color-panel)",
                }}
              />
            ) : (
              <div
                className="flex h-24 w-24 items-center justify-center rounded-full text-2xl font-bold transition group-hover:opacity-80"
                style={{
                  background: "var(--color-accent)",
                  color: "#fff",
                }}
              >
                {getInitials(fullName || authUser?.fullName)}
              </div>
            )}

            {/* Hover overlay */}
            <div className="absolute inset-0 flex items-center justify-center rounded-full bg-black/40 opacity-0 transition group-hover:opacity-100">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z" />
                <circle cx="12" cy="13" r="4" />
              </svg>
            </div>
          </div>

          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            onChange={handleAvatarChange}
            className="hidden"
          />

          <p className="text-xs" style={{ color: "var(--color-text-muted)" }}>
            Click to upload (max 1MB)
          </p>
        </div>

        {/* Name field */}
        <div className="mt-6">
          <label
            htmlFor="profile-name"
            className="mb-1.5 block text-sm font-medium"
            style={{ color: "var(--color-text-primary)" }}
          >
            Full name
          </label>
          <input
            id="profile-name"
            type="text"
            value={fullName}
            onChange={(e) => setFullName(e.target.value)}
            className="w-full rounded-xl border px-3.5 py-2.5 text-sm outline-none transition-all theme-transition"
            style={{
              background: "var(--color-input-bg)",
              borderColor: "var(--color-input-border)",
              color: "var(--color-text-primary)",
            }}
            onFocus={(e) => {
              e.target.style.borderColor = "var(--color-accent)";
              e.target.style.boxShadow = "0 0 0 3px var(--color-accent-glow)";
            }}
            onBlur={(e) => {
              e.target.style.borderColor = "var(--color-input-border)";
              e.target.style.boxShadow = "none";
            }}
            placeholder="Your name"
          />
        </div>

        {/* Email (read-only) */}
        <div className="mt-4">
          <label
            className="mb-1.5 block text-sm font-medium"
            style={{ color: "var(--color-text-primary)" }}
          >
            Email
          </label>
          <p
            className="rounded-xl border px-3.5 py-2.5 text-sm"
            style={{
              background: "var(--color-input-bg)",
              borderColor: "var(--color-border)",
              color: "var(--color-text-muted)",
            }}
          >
            {authUser?.email}
          </p>
        </div>

        {/* Save button */}
        <button
          type="button"
          onClick={handleSave}
          disabled={isUpdatingProfile}
          className="mt-6 w-full rounded-xl py-2.5 text-sm font-semibold transition-all active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-50"
          style={{
            background: "var(--color-accent)",
            color: "#fff",
          }}
        >
          {isUpdatingProfile ? "Saving…" : "Save changes"}
        </button>
      </div>
    </main>
  );
};

export default Profile;
