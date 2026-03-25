import { useCallback, useRef, useState } from "react";

const MAX_IMAGE_SIZE = 2 * 1024 * 1024; // 2 MB

/* ── Icons ───────────────────────────────────────────────── */

const ImageIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <rect x="3" y="3" width="18" height="18" rx="2" ry="2" />
    <circle cx="8.5" cy="8.5" r="1.5" />
    <polyline points="21 15 16 10 5 21" />
  </svg>
);

const CloseIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <line x1="18" y1="6" x2="6" y2="18" />
    <line x1="6" y1="6" x2="18" y2="18" />
  </svg>
);

const SendIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M22 2L11 13" />
    <path d="M22 2L15 22L11 13L2 9L22 2Z" />
  </svg>
);

/* ── Component ───────────────────────────────────────────── */

const ImageUpload = ({ onSend, disabled = false, showToast }) => {
  const [preview, setPreview] = useState(null); // { base64, name }
  const [isDragging, setIsDragging] = useState(false);
  const [caption, setCaption] = useState("");
  const fileInputRef = useRef(null);

  const processFile = useCallback(
    (file) => {
      if (!file) return;

      if (!file.type.startsWith("image/")) {
        showToast?.({ type: "error", message: "Only image files are allowed" });
        return;
      }

      if (file.size > MAX_IMAGE_SIZE) {
        showToast?.({
          type: "error",
          message: "Image must be under 2 MB",
        });
        return;
      }

      const reader = new FileReader();
      reader.onloadend = () => {
        setPreview({ base64: reader.result, name: file.name });
      };
      reader.readAsDataURL(file);
    },
    [showToast]
  );

  const handleFileChange = (e) => {
    processFile(e.target.files?.[0]);
    e.target.value = "";
  };

  const handleDrop = useCallback(
    (e) => {
      e.preventDefault();
      setIsDragging(false);
      const file = e.dataTransfer.files?.[0];
      processFile(file);
    },
    [processFile]
  );

  const handleSend = () => {
    if (!preview) return;
    onSend?.({ image: preview.base64, text: caption.trim() || "" });
    setPreview(null);
    setCaption("");
  };

  const handleCancel = () => {
    setPreview(null);
    setCaption("");
  };

  const handleKeyDown = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
    if (e.key === "Escape") {
      handleCancel();
    }
  };

  /* ── Preview overlay ──── */
  if (preview) {
    return (
      <div
        className="image-preview-overlay"
        onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
        onDragLeave={() => setIsDragging(false)}
        onDrop={handleDrop}
      >
        <div className="image-preview-card" style={{ background: "var(--color-panel)", borderColor: "var(--color-border)" }}>
          <div className="image-preview-header">
            <span className="image-preview-title" style={{ color: "var(--color-text-primary)" }}>
              Send Image
            </span>
            <button
              type="button"
              onClick={handleCancel}
              className="image-preview-close"
              style={{ color: "var(--color-text-muted)" }}
            >
              <CloseIcon />
            </button>
          </div>

          <div className="image-preview-body">
            <img
              src={preview.base64}
              alt={preview.name}
              className="image-preview-img"
            />
          </div>

          <div className="image-preview-footer">
            <input
              type="text"
              value={caption}
              onChange={(e) => setCaption(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Add a caption…"
              className="image-caption-input"
              style={{
                background: "var(--color-input-bg)",
                borderColor: "var(--color-input-border)",
                color: "var(--color-text-primary)",
              }}
              maxLength={200}
              autoFocus
            />
            <button
              type="button"
              onClick={handleSend}
              className="image-send-btn"
              style={{ background: "var(--color-accent)", color: "#fff" }}
            >
              <SendIcon />
            </button>
          </div>
        </div>
      </div>
    );
  }

  /* ── Upload button ──── */
  return (
    <>
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        onChange={handleFileChange}
        className="sr-only"
      />
      <button
        type="button"
        disabled={disabled}
        onClick={() => fileInputRef.current?.click()}
        className="voice-action-btn"
        style={{ color: "var(--color-text-secondary)" }}
        title="Send image"
      >
        <ImageIcon />
      </button>
    </>
  );
};

export default ImageUpload;
