import { useEffect, useRef } from "react";
import useCallStore from "../store/callStore";

/* ── Helpers ─────────────────────────────────────────────── */

const pad = (n) => String(Math.floor(n)).padStart(2, "0");
const formatTime = (s) => `${pad(s / 60)}:${pad(s % 60)}`;

const getInitials = (name = "") =>
  name
    .split(" ")
    .slice(0, 2)
    .map((p) => p[0]?.toUpperCase() || "")
    .join("");

/* ── Icons ───────────────────────────────────────────────── */

const PhoneIcon = () => (
  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z" />
  </svg>
);

const PhoneOffIcon = () => (
  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M10.68 13.31a16 16 0 0 0 3.41 2.6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.42 19.42 0 0 1-3.33-2.67" />
    <path d="M1 1l22 22" />
    <path d="M4.91 4.91a19.48 19.48 0 0 0-2.8 3.27A2 2 0 0 0 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91" />
  </svg>
);

const MicIcon = ({ muted }) =>
  muted ? (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <line x1="1" y1="1" x2="23" y2="23" />
      <path d="M9 9v3a3 3 0 0 0 5.12 2.12M15 9.34V4a3 3 0 0 0-5.94-.6" />
      <path d="M17 16.95A7 7 0 0 1 5 12v-2m14 0v2c0 .76-.13 1.49-.35 2.17" />
      <line x1="12" y1="19" x2="12" y2="23" />
      <line x1="8" y1="23" x2="16" y2="23" />
    </svg>
  ) : (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 2a3 3 0 0 0-3 3v7a3 3 0 0 0 6 0V5a3 3 0 0 0-3-3Z" />
      <path d="M19 10v2a7 7 0 0 1-14 0v-2" />
      <line x1="12" y1="19" x2="12" y2="23" />
      <line x1="8" y1="23" x2="16" y2="23" />
    </svg>
  );

/* ── Component ───────────────────────────────────────────── */

const CallUI = () => {
  const {
    callStatus,
    remoteUser,
    callType,
    isMuted,
    callDuration,
    remoteStream,
    acceptCall,
    rejectCall,
    endCall,
    toggleMute,
  } = useCallStore();

  const remoteAudioRef = useRef(null);

  /* Attach remote stream to audio element */
  useEffect(() => {
    if (remoteAudioRef.current && remoteStream) {
      remoteAudioRef.current.srcObject = remoteStream;
    }
  }, [remoteStream]);

  if (callStatus === "idle") return null;

  const userName = remoteUser?.name || "User";
  const userAvatar = remoteUser?.avatar;
  const userInitials = getInitials(userName);

  return (
    <div className="call-overlay">
      <audio ref={remoteAudioRef} autoPlay />

      <div className="call-card" style={{ background: "var(--color-panel)", borderColor: "var(--color-border)" }}>
        {/* Avatar */}
        <div className="call-avatar-wrapper">
          {callStatus === "outgoing" && <div className="call-ring-animation" />}
          {callStatus === "incoming" && <div className="call-ring-animation call-ring-incoming" />}
          {userAvatar ? (
            <img src={userAvatar} alt={userName} className="call-avatar" />
          ) : (
            <div
              className="call-avatar call-avatar-initials"
              style={{ background: "var(--color-accent)", color: "#fff" }}
            >
              {userInitials}
            </div>
          )}
        </div>

        {/* Status Text */}
        <p className="call-name" style={{ color: "var(--color-text-primary)" }}>
          {userName}
        </p>
        <p className="call-status" style={{ color: "var(--color-text-muted)" }}>
          {callStatus === "outgoing" && "Ringing…"}
          {callStatus === "incoming" && `Incoming ${callType} call`}
          {callStatus === "connected" && formatTime(callDuration)}
          {callStatus === "ended" && "Call ended"}
        </p>

        {/* Controls */}
        <div className="call-controls">
          {/* Incoming: accept + reject */}
          {callStatus === "incoming" && (
            <>
              <button
                type="button"
                onClick={rejectCall}
                className="call-btn call-btn-reject"
                title="Decline"
              >
                <PhoneOffIcon />
              </button>
              <button
                type="button"
                onClick={acceptCall}
                className="call-btn call-btn-accept"
                title="Accept"
              >
                <PhoneIcon />
              </button>
            </>
          )}

          {/* Outgoing: cancel */}
          {callStatus === "outgoing" && (
            <button
              type="button"
              onClick={endCall}
              className="call-btn call-btn-reject"
              title="Cancel call"
            >
              <PhoneOffIcon />
            </button>
          )}

          {/* Connected: mute + end */}
          {callStatus === "connected" && (
            <>
              <button
                type="button"
                onClick={toggleMute}
                className={`call-btn ${isMuted ? "call-btn-muted" : "call-btn-secondary"}`}
                title={isMuted ? "Unmute" : "Mute"}
              >
                <MicIcon muted={isMuted} />
              </button>
              <button
                type="button"
                onClick={endCall}
                className="call-btn call-btn-reject"
                title="End call"
              >
                <PhoneOffIcon />
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default CallUI;
