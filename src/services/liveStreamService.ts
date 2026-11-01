/**
 * 60 FPS High-Performance WebRTC Screen & Window Sharing Engine
 * With dual-channel signaling (Unbuffered SSE + Fast Poll Fallback),
 * robust public STUN mesh, persistent private link management,
 * and crisp HD snapshot support.
 */

export interface StreamOverlayConfig {
  enabled: boolean;
  mode: 'hud' | 'break';
  badgeText: string;
  title: string;
  subtitle?: string;
  position: 'bottom-left' | 'bottom-right' | 'top-left' | 'top-right' | 'bottom-bar';
  size?: 'sm' | 'md' | 'lg' | 'xl';
  timerType?: 'countdown' | 'target-time' | 'none';
  targetTimestamp?: number;
  targetTimeDisplay?: string;
}

export interface LiveStreamStatus {
  ok: boolean;
  isLive: boolean;
  isUnlisted?: boolean;
  secretKey?: string | null;
  title: string;
  description: string;
  startedAt: number | null;
  lastFrameAt: number;
  hasFrame: boolean;
  viewersCount: number;
  overlay?: StreamOverlayConfig | null;
}

export interface BroadcastController {
  stream: MediaStream;
  stop: () => void;
  updateMeta: (title: string, description?: string) => void;
  isActive: () => boolean;
  getConnectedPeersCount: () => number;
}

export const RTC_CONFIG: RTCConfiguration = {
  iceServers: [
    { urls: 'stun:stun.l.google.com:19302' },
    { urls: 'stun:stun1.l.google.com:19302' },
    { urls: 'stun:stun2.l.google.com:19302' },
    { urls: 'stun:stun3.l.google.com:19302' },
    { urls: 'stun:stun4.l.google.com:19302' },
    { urls: 'stun:stun.cloudflare.com:3478' },
    { urls: 'stun:stun.services.mozilla.com' }
  ],
  iceCandidatePoolSize: 10
};

let activeMediaStream: MediaStream | null = null;
let broadcastSnapshotInterval: number | null = null;
let currentTitle = 'Élő fejlesztési munkafolyamat';
let currentDescription = 'Valós idejű képernyőmegosztás a stúdióból';
let currentIsUnlisted = false;
let currentSecretKey: string | null = null;

// Active WebRTC connections from Broadcaster to Viewers
const broadcasterPeerConnections = new Map<string, RTCPeerConnection>();
let broadcasterEventSource: EventSource | null = null;
let broadcasterPollInterval: number | null = null;

// Viewer ID generated once per tab session
const SESSION_VIEWER_ID = 'viewer_' + Math.random().toString(36).substring(2, 10);

async function sendSignal(from: string, to: string, type: string, data: any, key?: string) {
  try {
    await fetch('/api/live-stream/signal/message', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ from, to, type, data, key })
    });
  } catch {
    // Ignore transient network error
  }
}

// Storage keys for persistent stream link preferences
const STORAGE_KEY_PERSISTENT_KEY = 'hl_studio_persistent_stream_key';
const STORAGE_KEY_LINK_MODE = 'hl_studio_stream_link_mode'; // 'persistent' | 'ephemeral'

export const liveStreamService = {
  /**
   * Get the persistent secret link key (saves in localStorage so it remains constant across all broadcasts)
   */
  getPersistentKey(): string {
    let key = localStorage.getItem(STORAGE_KEY_PERSISTENT_KEY);
    if (!key || key.trim().length < 4) {
      key = 'studio_live_' + Math.random().toString(36).substring(2, 8);
      localStorage.setItem(STORAGE_KEY_PERSISTENT_KEY, key);
    }
    return key;
  },

  /**
   * Set custom persistent secret key
   */
  setPersistentKey(newKey: string): string {
    const clean = newKey.trim().replace(/[^a-zA-Z0-9_-]/g, '') || 'studio_live_' + Math.random().toString(36).substring(2, 8);
    localStorage.setItem(STORAGE_KEY_PERSISTENT_KEY, clean);
    return clean;
  },

  /**
   * Generate and save a new persistent link key (when user wants to revoke previous link)
   */
  generateNewPersistentKey(): string {
    const fresh = 'live_' + Math.random().toString(36).substring(2, 10);
    localStorage.setItem(STORAGE_KEY_PERSISTENT_KEY, fresh);
    return fresh;
  },

  /**
   * Get link mode: 'persistent' (fixed link) or 'ephemeral' (new random link every broadcast)
   */
  getLinkMode(): 'persistent' | 'ephemeral' {
    const mode = localStorage.getItem(STORAGE_KEY_LINK_MODE);
    return mode === 'ephemeral' ? 'ephemeral' : 'persistent';
  },

  /**
   * Save link mode preference
   */
  setLinkMode(mode: 'persistent' | 'ephemeral'): void {
    localStorage.setItem(STORAGE_KEY_LINK_MODE, mode);
  },

  /**
   * Check whether the current browser supports window/screen capture and WebRTC
   */
  isCaptureSupported(): boolean {
    return (
      typeof navigator !== 'undefined' &&
      !!navigator.mediaDevices &&
      typeof navigator.mediaDevices.getDisplayMedia === 'function' &&
      typeof RTCPeerConnection !== 'undefined'
    );
  },

  /**
   * Fetch current live status from server
   */
  async getStatus(options?: { key?: string; isAdmin?: boolean }): Promise<LiveStreamStatus> {
    try {
      const params = new URLSearchParams();
      params.set('viewerId', SESSION_VIEWER_ID);
      params.set('_t', String(Date.now()));
      if (options?.key) {
        params.set('key', options.key);
      }
      if (options?.isAdmin) {
        params.set('admin', 'true');
      }

      const res = await fetch(`/api/live-stream/status?${params.toString()}`);
      if (!res.ok) throw new Error('Status fetch failed');
      const data = await res.json();
      return data;
    } catch {
      return {
        ok: false,
        isLive: false,
        isUnlisted: false,
        secretKey: null,
        title: '',
        description: '',
        startedAt: null,
        lastFrameAt: 0,
        hasFrame: false,
        viewersCount: 0
      };
    }
  },

  /**
   * Start 60 FPS WebRTC window/screen broadcast
   */
  async startBroadcast(options: {
    title?: string;
    description?: string;
    isUnlisted?: boolean;
    secretKey?: string;
    onEnded?: () => void;
    onError?: (err: Error) => void;
  }): Promise<BroadcastController> {
    if (!this.isCaptureSupported()) {
      throw new Error('A böngésződ nem támogatja a képernyőmegosztást vagy a WebRTC-t.');
    }

    // Stop existing stream if running
    if (activeMediaStream) {
      await this.stopBroadcast();
    }

    currentTitle = options.title?.trim() || 'Élő fejlesztési munkafolyamat';
    currentDescription = options.description?.trim() || 'Valós idejű képernyőmegosztás a stúdióból';
    currentIsUnlisted = Boolean(options.isUnlisted);
    currentSecretKey = options.secretKey || null;

    // Request display media optimized for 60 FPS with full HD clarity
    const stream = await navigator.mediaDevices.getDisplayMedia({
      video: {
        cursor: 'always',
        displaySurface: 'window',
        frameRate: { ideal: 60, max: 60 },
        width: { ideal: 1920, max: 2560 },
        height: { ideal: 1080, max: 1440 }
      } as any,
      audio: false
    });

    activeMediaStream = stream;

    // Handler for messages directed to broadcaster
    const handleBroadcasterMessage = async (msg: any) => {
      try {
        if (msg.type === 'viewer-joined') {
          await createPeerForViewer(msg.viewerId);
        } else if (msg.type === 'answer') {
          const pc = broadcasterPeerConnections.get(msg.from);
          if (pc && pc.signalingState !== 'closed' && pc.signalingState !== 'stable') {
            await pc.setRemoteDescription(new RTCSessionDescription(msg.data));
          }
        } else if (msg.type === 'candidate') {
          const pc = broadcasterPeerConnections.get(msg.from);
          if (pc && pc.remoteDescription && msg.data) {
            await pc.addIceCandidate(new RTCIceCandidate(msg.data)).catch(() => {});
          }
        } else if (msg.type === 'viewer-left') {
          const pc = broadcasterPeerConnections.get(msg.viewerId);
          if (pc) {
            pc.close();
            broadcasterPeerConnections.delete(msg.viewerId);
          }
        }
      } catch (err) {
        console.warn('[WebRTC Broadcaster] Message handler error:', err);
      }
    };

    const createPeerForViewer = async (viewerId: string) => {
      const existing = broadcasterPeerConnections.get(viewerId);
      if (existing) {
        existing.close();
        broadcasterPeerConnections.delete(viewerId);
      }

      const pc = new RTCPeerConnection(RTC_CONFIG);
      broadcasterPeerConnections.set(viewerId, pc);

      // Add all tracks from the 60 FPS capture
      stream.getTracks().forEach((track) => {
        const sender = pc.addTrack(track, stream);
        try {
          const params = sender.getParameters();
          if (!params.encodings || params.encodings.length === 0) {
            params.encodings = [{}];
          }
          params.encodings[0].maxFramerate = 60;
          params.encodings[0].maxBitrate = 6000000; // 6 Mbps for pristine 1080p60
          sender.setParameters(params).catch(() => {});
        } catch {}
      });

      pc.onicecandidate = (event) => {
        if (event.candidate) {
          sendSignal('broadcaster', viewerId, 'candidate', event.candidate);
        }
      };

      pc.onconnectionstatechange = () => {
        if (pc.connectionState === 'failed' || pc.connectionState === 'closed') {
          pc.close();
          broadcasterPeerConnections.delete(viewerId);
        }
      };

      try {
        const offer = await pc.createOffer({
          offerToReceiveVideo: false,
          offerToReceiveAudio: false
        });
        await pc.setLocalDescription(offer);
        await sendSignal('broadcaster', viewerId, 'offer', offer);
      } catch (err: any) {
        console.error('[WebRTC Broadcaster] Error creating offer for viewer:', viewerId, err);
      }
    };

    // 1. Setup Broadcaster WebRTC Signaling via Unbuffered SSE
    const sseUrl = `/api/live-stream/signal/events?peerId=broadcaster&isBroadcaster=true&_t=${Date.now()}`;
    const es = new EventSource(sseUrl);
    broadcasterEventSource = es;

    es.onmessage = async (evt) => {
      try {
        const msg = JSON.parse(evt.data);
        await handleBroadcasterMessage(msg);
      } catch {}
    };

    // 1b. Fast Dual-Channel Poll Fallback for School/Corporate Proxies
    broadcasterPollInterval = window.setInterval(async () => {
      try {
        const res = await fetch('/api/live-stream/signal/poll?peerId=broadcaster');
        if (res.ok) {
          const data = await res.json();
          if (Array.isArray(data.messages)) {
            for (const msg of data.messages) {
              await handleBroadcasterMessage(msg);
            }
          }
        }
      } catch {}
    }, 1200);

    // 2. Offscreen High-Definition Snapshot (Keeps 1080p crisp clarity during connection handshakes)
    const video = document.createElement('video');
    video.muted = true;
    video.playsInline = true;
    video.srcObject = stream;
    await video.play().catch(() => {});

    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');

    const sendSnapshot = async () => {
      if (!activeMediaStream || !video.videoWidth || !video.videoHeight || !ctx) return;
      // Maintain crisp 1080p resolution so text is 100% sharp even before WebRTC video hooks in
      const maxDim = 1920;
      let width = video.videoWidth;
      let height = video.videoHeight;
      if (width > maxDim || height > maxDim) {
        if (width > height) {
          height = Math.round((height * maxDim) / width);
          width = maxDim;
        } else {
          width = Math.round((width * maxDim) / height);
          height = maxDim;
        }
      }
      canvas.width = width;
      canvas.height = height;
      ctx.drawImage(video, 0, 0, width, height);
      // High JPEG compression quality (0.82)
      const dataUrl = canvas.toDataURL('image/jpeg', 0.82);

      try {
        await fetch('/api/live-stream/broadcast', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            frame: dataUrl,
            title: currentTitle,
            description: currentDescription,
            isUnlisted: currentIsUnlisted,
            secretKey: currentSecretKey
          })
        });
      } catch {}
    };

    await sendSnapshot();
    // Snapshot interval every 3 seconds for metadata keepalive and fallback
    broadcastSnapshotInterval = window.setInterval(sendSnapshot, 3000);

    // Handle user clicking native "Stop sharing" blue bar in browser
    const videoTrack = stream.getVideoTracks()[0];
    if (videoTrack) {
      videoTrack.onended = () => {
        this.stopBroadcast();
        options.onEnded?.();
      };
    }

    return {
      stream,
      stop: () => {
        this.stopBroadcast();
        options.onEnded?.();
      },
      updateMeta: (title: string, description?: string) => {
        currentTitle = title.trim() || currentTitle;
        if (description !== undefined) {
          currentDescription = description.trim();
        }
      },
      isActive: () => !!activeMediaStream && activeMediaStream.active,
      getConnectedPeersCount: () => broadcasterPeerConnections.size
    };
  },

  /**
   * Stop broadcasting and notify the server
   */
  async stopBroadcast(): Promise<void> {
    currentIsUnlisted = false;
    currentSecretKey = null;

    if (broadcastSnapshotInterval !== null) {
      clearInterval(broadcastSnapshotInterval);
      broadcastSnapshotInterval = null;
    }

    if (broadcasterPollInterval !== null) {
      clearInterval(broadcasterPollInterval);
      broadcasterPollInterval = null;
    }

    if (broadcasterEventSource) {
      broadcasterEventSource.close();
      broadcasterEventSource = null;
    }

    // Close all viewer peer connections
    for (const [id, pc] of broadcasterPeerConnections.entries()) {
      try {
        pc.close();
      } catch {}
    }
    broadcasterPeerConnections.clear();

    if (activeMediaStream) {
      activeMediaStream.getTracks().forEach((track) => track.stop());
      activeMediaStream = null;
    }

    try {
      await fetch('/api/live-stream/stop', { method: 'POST' });
    } catch {}
  },

  /**
   * Check if currently broadcasting locally from this browser session
   */
  isLocalBroadcasting(): boolean {
    return !!activeMediaStream && activeMediaStream.active;
  },

  /**
   * Update Stream Overlay / Break Screen live across all viewers and links
   */
  async updateOverlay(overlay: StreamOverlayConfig | null): Promise<boolean> {
    try {
      const res = await fetch('/api/live-stream/overlay', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ overlay })
      });
      return res.ok;
    } catch {
      return false;
    }
  },

  /**
   * Viewer: Subscribe to 60 FPS WebRTC Stream with dual-channel signaling
   */
  subscribeWebRtcStream(options: {
    streamKey?: string;
    onStream: (stream: MediaStream) => void;
    onStatusChange?: (status: 'connecting' | 'connected' | 'disconnected') => void;
    onEnded?: () => void;
    onOverlay?: (overlay: StreamOverlayConfig | null) => void;
    onError?: (err: Error) => void;
  }): () => void {
    const viewerId = 'viewer_' + Math.random().toString(36).substring(2, 10);
    let pc: RTCPeerConnection | null = null;
    let isCleanedUp = false;
    let pollInterval: number | null = null;

    const sseParams = new URLSearchParams();
    sseParams.set('peerId', viewerId);
    if (options.streamKey) {
      sseParams.set('key', options.streamKey);
    }
    sseParams.set('_t', String(Date.now()));

    const sseUrl = `/api/live-stream/signal/events?${sseParams.toString()}`;
    const es = new EventSource(sseUrl);

    const handleViewerMessage = async (msg: any) => {
      if (isCleanedUp) return;
      try {
        if (msg.type === 'offer') {
          options.onStatusChange?.('connecting');
          const peer = initPeerConnection();
          await peer.setRemoteDescription(new RTCSessionDescription(msg.data));
          const answer = await peer.createAnswer();
          await peer.setLocalDescription(answer);
          await sendSignal(viewerId, 'broadcaster', 'answer', answer, options.streamKey);
        } else if (msg.type === 'candidate' && pc) {
          if (pc.remoteDescription && msg.data) {
            await pc.addIceCandidate(new RTCIceCandidate(msg.data)).catch(() => {});
          }
        } else if (msg.type === 'overlay-updated') {
          options.onOverlay?.(msg.overlay ?? null);
        } else if (msg.type === 'stream-ended' || msg.type === 'broadcaster-disconnected') {
          options.onStatusChange?.('disconnected');
          options.onEnded?.();
        }
      } catch (err: any) {
        console.warn('[WebRTC Viewer] Signaling message processing error:', err);
      }
    };

    const initPeerConnection = () => {
      if (pc) {
        pc.close();
      }
      pc = new RTCPeerConnection(RTC_CONFIG);

      pc.ontrack = (event) => {
        if (event.streams && event.streams[0]) {
          options.onStream(event.streams[0]);
          options.onStatusChange?.('connected');
        }
      };

      pc.onicecandidate = (event) => {
        if (event.candidate && !isCleanedUp) {
          sendSignal(viewerId, 'broadcaster', 'candidate', event.candidate, options.streamKey);
        }
      };

      pc.onconnectionstatechange = () => {
        if (pc?.connectionState === 'connected') {
          options.onStatusChange?.('connected');
        } else if (pc?.connectionState === 'failed' || pc?.connectionState === 'disconnected') {
          options.onStatusChange?.('connecting');
        }
      };

      pc.oniceconnectionstatechange = () => {
        if (pc?.iceConnectionState === 'connected' || pc?.iceConnectionState === 'completed') {
          options.onStatusChange?.('connected');
        }
      };

      return pc;
    };

    es.onmessage = async (evt) => {
      try {
        const msg = JSON.parse(evt.data);
        await handleViewerMessage(msg);
      } catch {}
    };

    // Dual-channel polling fallback in case school/public wifi buffers SSE
    pollInterval = window.setInterval(async () => {
      if (isCleanedUp) return;
      try {
        const res = await fetch(`/api/live-stream/signal/poll?peerId=${viewerId}`);
        if (res.ok) {
          const data = await res.json();
          if (Array.isArray(data.messages)) {
            for (const msg of data.messages) {
              await handleViewerMessage(msg);
            }
          }
        }
      } catch {}
    }, 1200);

    // Return unsubscribe function
    return () => {
      isCleanedUp = true;
      es.close();
      if (pollInterval !== null) {
        clearInterval(pollInterval);
        pollInterval = null;
      }
      if (pc) {
        pc.close();
        pc = null;
      }
    };
  }
};
