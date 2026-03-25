import { useCallback, useEffect, useRef, useState } from "react";

/* ── Helpers ─────────────────────────────────────────────── */

const FORMATS = [
  "audio/webm;codecs=opus",
  "audio/webm",
  "audio/mp4",
  "audio/ogg;codecs=opus",
];

const getSupportedMimeType = () =>
  FORMATS.find((f) => MediaRecorder.isTypeSupported(f)) || "";

const pad = (n) => String(n).padStart(2, "0");

const formatTimer = (seconds) => `${pad(Math.floor(seconds / 60))}:${pad(seconds % 60)}`;

/* ── Icons ───────────────────────────────────────────────── */

const MicIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M12 2a3 3 0 0 0-3 3v7a3 3 0 0 0 6 0V5a3 3 0 0 0-3-3Z" />
    <path d="M19 10v2a7 7 0 0 1-14 0v-2" />
    <line x1="12" y1="19" x2="12" y2="22" />
  </svg>
);

const StopIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
    <rect x="4" y="4" width="16" height="16" rx="2" />
  </svg>
);

const PlayIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
    <polygon points="6,4 20,12 6,20" />
  </svg>
);

const PauseIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
    <rect x="5" y="4" width="4" height="16" rx="1" />
    <rect x="15" y="4" width="4" height="16" rx="1" />
  </svg>
);

const TrashIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="3 6 5 6 21 6" />
    <path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6" />
    <path d="M10 11v6" />
    <path d="M14 11v6" />
    <path d="M9 6V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2" />
  </svg>
);

const SendIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M22 2L11 13" />
    <path d="M22 2L15 22L11 13L2 9L22 2Z" />
  </svg>
);

/* ── Component ───────────────────────────────────────────── */

const VoiceRecorder = ({ onSend, onCancel, disabled = false, showToast }) => {
  const [state, setState] = useState("idle"); // idle | recording | preview
  const [elapsed, setElapsed] = useState(0);
  const [audioURL, setAudioURL] = useState(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [progress, setProgress] = useState(0);

  const recorderRef = useRef(null);
  const chunksRef = useRef([]);
  const timerRef = useRef(null);
  const blobRef = useRef(null);
  const audioRef = useRef(null);
  const streamRef = useRef(null);

  /* Cleanup on unmount */
  useEffect(() => {
    return () => {
      cleanup();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const cleanup = useCallback(() => {
    if (timerRef.current) clearInterval(timerRef.current);
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.src = "";
    }
    if (audioURL) URL.revokeObjectURL(audioURL);
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((t) => t.stop());
    }
    recorderRef.current = null;
    chunksRef.current = [];
    blobRef.current = null;
    streamRef.current = null;
  }, [audioURL]);

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      streamRef.current = stream;

      const mimeType = getSupportedMimeType();
      const options = mimeType ? { mimeType } : {};
      const recorder = new MediaRecorder(stream, options);

      chunksRef.current = [];

      recorder.ondataavailable = (e) => {
        if (e.data.size > 0) chunksRef.current.push(e.data);
      };

      recorder.onstop = () => {
        const blob = new Blob(chunksRef.current, {
          type: recorder.mimeType || "audio/webm",
        });
        blobRef.current = blob;
        const url = URL.createObjectURL(blob);
        setAudioURL(url);
        setState("preview");
        stream.getTracks().forEach((t) => t.stop());
      };

      recorder.onerror = () => {
        showToast?.({ type: "error", message: "Recording failed" });
        resetToIdle();
      };

      recorderRef.current = recorder;
      recorder.start();

      setElapsed(0);
      setState("recording");

      timerRef.current = setInterval(() => {
        setElapsed((prev) => prev + 1);
      }, 1000);
    } catch (err) {
      if (err.name === "NotAllowedError" || err.name === "PermissionDeniedError") {
        showToast?.({
          type: "error",
          message: "Microphone permission denied. Please allow access in browser settings.",
        });
      } else {
        showToast?.({ type: "error", message: "Could not access microphone" });
      }
    }
  };

  const stopRecording = () => {
    if (timerRef.current) clearInterval(timerRef.current);
    if (recorderRef.current && recorderRef.current.state === "recording") {
      recorderRef.current.stop();
    }
  };

  const resetToIdle = () => {
    cleanup();
    setState("idle");
    setElapsed(0);
    setAudioURL(null);
    setIsPlaying(false);
    setProgress(0);
  };

  const handleCancel = () => {
    resetToIdle();
    onCancel?.();
  };

  const handleSend = async () => {
    if (!blobRef.current) return;

    const reader = new FileReader();
    reader.onloadend = () => {
      const base64 = reader.result;
      onSend?.({ audio: base64, audioDuration: elapsed });
      resetToIdle();
    };
    reader.readAsDataURL(blobRef.current);
  };

  /* Preview playback */
  const togglePlayback = () => {
    if (!audioRef.current) {
      audioRef.current = new Audio(audioURL);
      audioRef.current.addEventListener("timeupdate", () => {
        const a = audioRef.current;
        if (a && a.duration) setProgress((a.currentTime / a.duration) * 100);
      });
      audioRef.current.addEventListener("ended", () => {
        setIsPlaying(false);
        setProgress(0);
      });
    }

    if (isPlaying) {
      audioRef.current.pause();
    } else {
      audioRef.current.play();
    }
    setIsPlaying(!isPlaying);
  };

  /* ── Idle: just a mic button ──── */
  if (state === "idle") {
    return (
      <button
        type="button"
        disabled={disabled}
        onClick={startRecording}
        className="voice-action-btn"
        style={{
          color: "var(--color-text-secondary)",
        }}
        title="Record voice message"
      >
        <MicIcon />
      </button>
    );
  }

  /* ── Recording state ──── */
  if (state === "recording") {
    return (
      <div className="voice-recorder-bar">
        <span className="recording-pulse" />
        <span className="voice-timer" style={{ color: "var(--color-unread-badge)" }}>
          {formatTimer(elapsed)}
        </span>
        <div style={{ flex: 1 }} />
        <button
          type="button"
          onClick={handleCancel}
          className="voice-action-btn"
          style={{ color: "var(--color-text-muted)" }}
          title="Cancel"
        >
          <TrashIcon />
        </button>
        <button
          type="button"
          onClick={stopRecording}
          className="voice-action-btn voice-stop-btn"
          title="Stop recording"
        >
          <StopIcon />
        </button>
      </div>
    );
  }

  /* ── Preview state ──── */
  return (
    <div className="voice-recorder-bar">
      <button
        type="button"
        onClick={togglePlayback}
        className="voice-action-btn"
        style={{ color: "var(--color-accent)" }}
        title={isPlaying ? "Pause" : "Play"}
      >
        {isPlaying ? <PauseIcon /> : <PlayIcon />}
      </button>
      <div className="voice-progress-track">
        <div
          className="voice-progress-fill"
          style={{ width: `${progress}%` }}
        />
      </div>
      <span className="voice-timer" style={{ color: "var(--color-text-secondary)" }}>
        {formatTimer(elapsed)}
      </span>
      <button
        type="button"
        onClick={handleCancel}
        className="voice-action-btn"
        style={{ color: "var(--color-text-muted)" }}
        title="Discard"
      >
        <TrashIcon />
      </button>
      <button
        type="button"
        onClick={handleSend}
        className="voice-action-btn voice-send-btn"
        title="Send voice message"
      >
        <SendIcon />
      </button>
    </div>
  );
};

export default VoiceRecorder;
