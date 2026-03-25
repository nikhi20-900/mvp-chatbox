import { useState } from "react";

/* ── Icon ────────────────────────────────────────────────── */

const LocationIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0Z" />
    <circle cx="12" cy="10" r="3" />
  </svg>
);

/* ── Component ───────────────────────────────────────────── */

const LocationShare = ({ onSend, disabled = false, showToast }) => {
  const [loading, setLoading] = useState(false);

  const handleClick = () => {
    if (!("geolocation" in navigator)) {
      showToast?.({ type: "error", message: "Geolocation is not supported by your browser" });
      return;
    }

    setLoading(true);

    navigator.geolocation.getCurrentPosition(
      (position) => {
        const { latitude, longitude } = position.coords;
        onSend?.({ location: { lat: latitude, lng: longitude } });
        setLoading(false);
      },
      (err) => {
        setLoading(false);
        switch (err.code) {
          case err.PERMISSION_DENIED:
            showToast?.({
              type: "error",
              message: "Location permission denied. Please allow access in browser settings.",
            });
            break;
          case err.POSITION_UNAVAILABLE:
            showToast?.({
              type: "error",
              message: "Location information is unavailable",
            });
            break;
          case err.TIMEOUT:
            showToast?.({
              type: "error",
              message: "Location request timed out",
            });
            break;
          default:
            showToast?.({ type: "error", message: "Failed to get location" });
        }
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 60000,
      }
    );
  };

  return (
    <button
      type="button"
      disabled={disabled || loading}
      onClick={handleClick}
      className="voice-action-btn"
      style={{ color: "var(--color-text-secondary)" }}
      title="Share location"
    >
      {loading ? (
        <span
          className="inline-block h-5 w-5 animate-spin rounded-full border-2 border-current/30"
          style={{ borderTopColor: "var(--color-accent)" }}
        />
      ) : (
        <LocationIcon />
      )}
    </button>
  );
};

export default LocationShare;
