import { useState } from "react";

/* ── Lightbox overlay ────────────────────────────────────── */

const Lightbox = ({ src, alt, onClose }) => (
  <div className="image-lightbox" onClick={onClose}>
    <button
      type="button"
      className="lightbox-close"
      onClick={onClose}
      style={{ color: "#fff" }}
    >
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <line x1="18" y1="6" x2="6" y2="18" />
        <line x1="6" y1="6" x2="18" y2="18" />
      </svg>
    </button>
    <img
      src={src}
      alt={alt}
      className="lightbox-img"
      onClick={(e) => e.stopPropagation()}
    />
  </div>
);

/* ── Component ───────────────────────────────────────────── */

const ImageMessage = ({ image, text = "", isOwn = false }) => {
  const [loaded, setLoaded] = useState(false);
  const [lightboxOpen, setLightboxOpen] = useState(false);

  return (
    <>
      <div className="image-message">
        {/* Skeleton placeholder */}
        {!loaded && (
          <div
            className="image-skeleton"
            style={{ background: isOwn ? "rgba(255,255,255,0.1)" : "var(--color-border)" }}
          />
        )}
        <img
          src={image}
          alt="Shared image"
          className={`image-msg-img ${loaded ? "loaded" : ""}`}
          onLoad={() => setLoaded(true)}
          onClick={() => setLightboxOpen(true)}
        />
        {text && (
          <p
            className="image-caption"
            style={{
              color: isOwn ? "var(--color-bubble-own-text)" : "var(--color-bubble-other-text)",
            }}
          >
            {text}
          </p>
        )}
      </div>

      {lightboxOpen && (
        <Lightbox
          src={image}
          alt="Shared image"
          onClose={() => setLightboxOpen(false)}
        />
      )}
    </>
  );
};

export default ImageMessage;
