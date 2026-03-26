import { create } from "zustand";
import useAuthStore from "./authStore";

const ICE_SERVERS = [
  { urls: "stun:stun.l.google.com:19302" },
  { urls: "stun:stun1.l.google.com:19302" },
];

const useCallStore = create((set, get) => ({
  /* state */
  callStatus: "idle", // idle | outgoing | incoming | connected | ended
  remoteUser: null, // { userId, name, avatar }
  callType: "audio", // audio | video
  isMuted: false,
  isVideoOff: false,
  localStream: null,
  remoteStream: null,
  peerConnection: null,
  callDuration: 0,
  _callTimer: null,

  /* ── Initiate call ──────────────────────────────────────── */

  initiateCall: async (userId, callType = "audio") => {
    const socket = useAuthStore.getState().socket;
    const authUser = useAuthStore.getState().authUser;
    if (!socket || !authUser) return;

    try {
      const constraints = {
        audio: true,
        video: callType === "video",
      };

      const stream = await navigator.mediaDevices.getUserMedia(constraints);

      const pc = new RTCPeerConnection({ iceServers: ICE_SERVERS });

      stream.getTracks().forEach((track) => pc.addTrack(track, stream));

      const remoteStream = new MediaStream();

      pc.ontrack = (event) => {
        event.streams[0].getTracks().forEach((track) => remoteStream.addTrack(track));
        set({ remoteStream });
      };

      pc.onicecandidate = (event) => {
        if (event.candidate) {
          socket.emit("call:ice-candidate", {
            toUserId: userId,
            candidate: event.candidate,
          });
        }
      };

      pc.onconnectionstatechange = () => {
        if (pc.connectionState === "disconnected" || pc.connectionState === "failed") {
          get().endCall();
        }
      };

      set({
        callStatus: "outgoing",
        remoteUser: { userId },
        callType,
        localStream: stream,
        remoteStream,
        peerConnection: pc,
        callDuration: 0,
      });

      socket.emit("call:initiate", {
        toUserId: userId,
        callType,
        callerName: authUser.fullName,
        callerAvatar: authUser.avatar,
      });
    } catch (err) {
      console.error("Failed to start call:", err);
      set({ callStatus: "idle" });
    }
  },

  /* ── Accept incoming call ───────────────────────────────── */

  acceptCall: async () => {
    const socket = useAuthStore.getState().socket;
    const { remoteUser, callType } = get();
    if (!socket || !remoteUser) return;

    try {
      const constraints = {
        audio: true,
        video: callType === "video",
      };

      const stream = await navigator.mediaDevices.getUserMedia(constraints);

      const pc = new RTCPeerConnection({ iceServers: ICE_SERVERS });

      stream.getTracks().forEach((track) => pc.addTrack(track, stream));

      const remoteStream = new MediaStream();

      pc.ontrack = (event) => {
        event.streams[0].getTracks().forEach((track) => remoteStream.addTrack(track));
        set({ remoteStream });
      };

      pc.onicecandidate = (event) => {
        if (event.candidate) {
          socket.emit("call:ice-candidate", {
            toUserId: remoteUser.userId,
            candidate: event.candidate,
          });
        }
      };

      pc.onconnectionstatechange = () => {
        if (pc.connectionState === "disconnected" || pc.connectionState === "failed") {
          get().endCall();
        }
      };

      set({
        callStatus: "connected",
        localStream: stream,
        remoteStream,
        peerConnection: pc,
      });

      socket.emit("call:accept", { toUserId: remoteUser.userId });

      /* Start duration timer */
      const timer = setInterval(() => {
        set((s) => ({ callDuration: s.callDuration + 1 }));
      }, 1000);
      set({ _callTimer: timer });
    } catch (err) {
      console.error("Failed to accept call:", err);
      get().rejectCall();
    }
  },

  /* ── Reject call ────────────────────────────────────────── */

  rejectCall: () => {
    const socket = useAuthStore.getState().socket;
    const { remoteUser } = get();
    if (socket && remoteUser) {
      socket.emit("call:reject", { toUserId: remoteUser.userId });
    }
    get()._cleanup();
    set({ callStatus: "ended" });
    setTimeout(() => set({ callStatus: "idle" }), 2000);
  },

  /* ── End call ───────────────────────────────────────────── */

  endCall: () => {
    const socket = useAuthStore.getState().socket;
    const { remoteUser } = get();
    if (socket && remoteUser) {
      socket.emit("call:end", { toUserId: remoteUser.userId });
    }
    get()._cleanup();
    set({ callStatus: "ended" });
    setTimeout(() => set({ callStatus: "idle" }), 2000);
  },

  /* ── Toggle mute ────────────────────────────────────────── */

  toggleMute: () => {
    const { localStream, isMuted } = get();
    if (!localStream) return;

    localStream.getAudioTracks().forEach((track) => {
      track.enabled = isMuted; // toggle
    });

    set({ isMuted: !isMuted });
  },

  /* ── Toggle video ───────────────────────────────────────── */

  toggleVideo: () => {
    const { localStream, isVideoOff } = get();
    if (!localStream) return;

    localStream.getVideoTracks().forEach((track) => {
      track.enabled = isVideoOff;
    });

    set({ isVideoOff: !isVideoOff });
  },

  /* ── Socket event handlers ──────────────────────────────── */

  subscribeToCallEvents: () => {
    const socket = useAuthStore.getState().socket;
    if (!socket) return;

    socket.on("call:incoming", ({ fromUserId, callType, callerName, callerAvatar }) => {
      /* If already in a call, send busy */
      if (get().callStatus !== "idle") {
        socket.emit("call:reject", { toUserId: fromUserId });
        return;
      }

      set({
        callStatus: "incoming",
        remoteUser: { userId: fromUserId, name: callerName, avatar: callerAvatar },
        callType,
      });
    });

    socket.on("call:accepted", async ({ fromUserId }) => {
      const { peerConnection: pc } = get();
      if (!pc) return;

      try {
        const offer = await pc.createOffer();
        await pc.setLocalDescription(offer);
        socket.emit("call:offer", { toUserId: fromUserId, offer });
      } catch (err) {
        console.error("Failed to create offer:", err);
      }
    });

    socket.on("call:offer", async ({ fromUserId, offer }) => {
      const { peerConnection: pc } = get();
      if (!pc) return;

      try {
        await pc.setRemoteDescription(new RTCSessionDescription(offer));
        const answer = await pc.createAnswer();
        await pc.setLocalDescription(answer);
        socket.emit("call:answer", { toUserId: fromUserId, answer });
      } catch (err) {
        console.error("Failed to handle offer:", err);
      }
    });

    socket.on("call:answer", async ({ answer }) => {
      const { peerConnection: pc } = get();
      if (!pc) return;

      try {
        await pc.setRemoteDescription(new RTCSessionDescription(answer));

        set({ callStatus: "connected" });

        /* Start timer */
        const timer = setInterval(() => {
          set((s) => ({ callDuration: s.callDuration + 1 }));
        }, 1000);
        set({ _callTimer: timer });
      } catch (err) {
        console.error("Failed to handle answer:", err);
      }
    });

    socket.on("call:ice-candidate", async ({ candidate }) => {
      const { peerConnection: pc } = get();
      if (!pc) return;

      try {
        await pc.addIceCandidate(new RTCIceCandidate(candidate));
      } catch (err) {
        console.error("Failed to add ICE candidate:", err);
      }
    });

    socket.on("call:ended", () => {
      get()._cleanup();
      set({ callStatus: "ended" });
      setTimeout(() => set({ callStatus: "idle" }), 2000);
    });

    socket.on("call:rejected", () => {
      get()._cleanup();
      set({ callStatus: "ended" });
      setTimeout(() => set({ callStatus: "idle" }), 2000);
    });

    socket.on("call:unavailable", () => {
      get()._cleanup();
      set({ callStatus: "idle" });
    });
  },

  unsubscribeFromCallEvents: () => {
    const socket = useAuthStore.getState().socket;
    if (!socket) return;

    [
      "call:incoming",
      "call:accepted",
      "call:offer",
      "call:answer",
      "call:ice-candidate",
      "call:ended",
      "call:rejected",
      "call:unavailable",
    ].forEach((event) => socket.off(event));
  },

  /* ── Internal cleanup ───────────────────────────────────── */

  _cleanup: () => {
    const { localStream, peerConnection, _callTimer } = get();

    if (localStream) {
      localStream.getTracks().forEach((track) => track.stop());
    }
    if (peerConnection) {
      peerConnection.close();
    }
    if (_callTimer) {
      clearInterval(_callTimer);
    }

    set({
      localStream: null,
      remoteStream: null,
      peerConnection: null,
      isMuted: false,
      isVideoOff: false,
      callDuration: 0,
      _callTimer: null,
      remoteUser: null,
    });
  },
}));

export default useCallStore;
