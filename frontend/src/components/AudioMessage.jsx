import { useEffect, useRef, useState } from "react";

/* ── Helpers ─────────────────────────────────────────────── */

const pad = (n) => String(Math.floor(n)).padStart(2, "0");
const formatDuration = (s) => `${pad(s / 60)}:${pad(s % 60)}`;

/* ── Icons ───────────────────────────────────────────────── */

const PlayIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
    <polygon points="6,4 20,12 6,20" />
  </svg>
);

const PauseIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
    <rect x="5" y="4" width="4" height="16" rx="1" />
    <rect x="15" y="4" width="4" height="16" rx="1" />
  </svg>
);

/* ── Component ───────────────────────────────────────────── */

const AudioMessage = ({ audio, audioDuration = 0, isOwn = false }) => {
  const audioRef = useRef(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [progress, setProgress] = useState(0);
  const [currentTime, setCurrentTime] = useState(0);

  useEffect(() => {
    const el = audioRef.current;
    if (!el) return;

    const onTimeUpdate = () => {
      if (el.duration) {
        setProgress((el.currentTime / el.duration) * 100);
        setCurrentTime(el.currentTime);
      }
    };

    const onEnded = () => {
      setIsPlaying(false);
      setProgress(0);
      setCurrentTime(0);
    };

    el.addEventListener("timeupdate", onTimeUpdate);
    el.addEventListener("ended", onEnded);

    return () => {
      el.removeEventListener("timeupdate", onTimeUpdate);
      el.removeEventListener("ended", onEnded);
    };
  }, []);

  const togglePlay = () => {
    const el = audioRef.current;
    if (!el) return;

    if (isPlaying) {
      el.pause();
    } else {
      el.play().catch(() => {});
    }
    setIsPlaying(!isPlaying);
  };

  const handleSeek = (e) => {
    const el = audioRef.current;
    if (!el || !el.duration) return;

    const rect = e.currentTarget.getBoundingClientRect();
    const ratio = Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width));
    el.currentTime = ratio * el.duration;
  };

  const displayTime = isPlaying
    ? formatDuration(Math.ceil(currentTime))
    : formatDuration(audioDuration);

  return (
    <div className="audio-message">
      <audio ref={audioRef} src={audio} preload="metadata" />
      <button
        type="button"
        onClick={togglePlay}
        className="audio-play-btn"
        style={{
          color: isOwn ? "var(--color-bubble-own-text)" : "var(--color-accent)",
          background: isOwn ? "rgba(255,255,255,0.18)" : "var(--color-accent-glow)",
        }}
      >
        {isPlaying ? <PauseIcon /> : <PlayIcon />}
      </button>

      <div className="audio-track-wrapper">
        <div
          className="audio-track"
          onClick={handleSeek}
          style={{
            background: isOwn ? "rgba(255,255,255,0.2)" : "var(--color-border)",
          }}
        >
          <div
            className="audio-track-fill"
            style={{
              width: `${progress}%`,
              background: isOwn ? "var(--color-bubble-own-text)" : "var(--color-accent)",
            }}
          />
        </div>
        <span
          className="audio-duration"
          style={{
            color: isOwn ? "var(--color-bubble-own-text)" : "var(--color-text-muted)",
            opacity: 0.8,
          }}
        >
          {displayTime}
        </span>
      </div>
    </div>
  );
};

export default AudioMessage;
