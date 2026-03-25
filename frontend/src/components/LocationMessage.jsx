/* ── Component ───────────────────────────────────────────── */

const LocationMessage = ({ location, isOwn = false }) => {
  if (!location || location.lat == null || location.lng == null) {
    return null;
  }

  const mapsUrl = `https://www.google.com/maps?q=${location.lat},${location.lng}`;

  return (
    <a
      href={mapsUrl}
      target="_blank"
      rel="noopener noreferrer"
      className="location-message"
      style={{
        background: isOwn ? "rgba(255,255,255,0.1)" : "var(--color-input-bg)",
        borderColor: isOwn ? "rgba(255,255,255,0.15)" : "var(--color-border)",
      }}
    >
      <div className="location-icon-wrapper" style={{ color: isOwn ? "var(--color-bubble-own-text)" : "var(--color-accent)" }}>
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0Z" />
          <circle cx="12" cy="10" r="3" />
        </svg>
      </div>
      <div className="location-info">
        <span
          className="location-title"
          style={{ color: isOwn ? "var(--color-bubble-own-text)" : "var(--color-text-primary)" }}
        >
          Shared Location
        </span>
        <span
          className="location-coords"
          style={{ color: isOwn ? "var(--color-bubble-own-text)" : "var(--color-text-muted)", opacity: 0.8 }}
        >
          {location.lat.toFixed(4)}, {location.lng.toFixed(4)}
        </span>
        <span
          className="location-link-hint"
          style={{ color: isOwn ? "var(--color-bubble-own-text)" : "var(--color-accent)", opacity: 0.9 }}
        >
          Open in Maps ↗
        </span>
      </div>
    </a>
  );
};

export default LocationMessage;
