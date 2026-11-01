/**
 * Real-time synchronization bridge between the Website, Admin Panel and Connected Clients.
 * Ensures that any change made on the Website or in the Admin Panel
 * (settings, hero image, project requests, capacity mode, promotions, downloads, email templates)
 * is synchronized across all devices and school/home machines via /api/sync/state.
 */

const SYNCED_KEYS = [
  'hl_studio_projects',
  'hl_studio_downloads',
  'hl_studio_download_flow_config',
  'hl_studio_requests',
  'hl_studio_promotions',
  'hl_studio_email_templates',
  'hl_studio_status_template_map',
  'hl_studio_settings',
  'hl_studio_notifications',
  'hl_studio_capacity_config_v1',
  'hl_studio_capacity_exceptions_v1',
  'hl_studio_capacity_waitlist_v1',
  'hl_studio_capacity_blocked_log_v1',
];

const KEY_TIMESTAMPS_STORAGE = 'hl_studio_sync_timestamps_v1';

let isApplyingRemoteUpdate = false;
let syncStarted = false;

function getLocalTimestamps(): Record<string, number> {
  try {
    const raw = localStorage.getItem(KEY_TIMESTAMPS_STORAGE);
    return raw ? JSON.parse(raw) : {};
  } catch {
    return {};
  }
}

function setLocalTimestamp(key: string, ts: number) {
  try {
    const map = getLocalTimestamps();
    map[key] = ts;
    localStorage.setItem(KEY_TIMESTAMPS_STORAGE, JSON.stringify(map));
  } catch {
    // Ignore
  }
}

export async function pushKeyToServer(key: string, value: unknown): Promise<void> {
  if (isApplyingRemoteUpdate) return;
  if (!SYNCED_KEYS.includes(key)) return;

  const now = Date.now();
  setLocalTimestamp(key, now);

  try {
    await fetch('/api/sync/state', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        updates: {
          [key]: {
            value,
            updatedAt: now,
          },
        },
      }),
    });
    window.dispatchEvent(
      new CustomEvent('hl_studio_sync_status', {
        detail: { synced: true, lastSyncAt: now },
      })
    );
  } catch {
    // Offline or transient network error
  }
}

export async function pullStateFromServer(): Promise<boolean> {
  try {
    const res = await fetch('/api/sync/state');
    if (!res.ok) return false;
    const data = await res.json();
    if (!data?.ok || !data.entries) return false;

    const entries = data.entries as Record<string, { value: unknown; updatedAt: number }>;
    const localTsMap = getLocalTimestamps();
    const missingOnServer: Record<string, { value: unknown; updatedAt: number }> = {};

    let updatedAnyLocal = false;
    let updatedCapacity = false;

    isApplyingRemoteUpdate = true;
    try {
      for (const key of SYNCED_KEYS) {
        const remoteEntry = entries[key];
        const localRaw = localStorage.getItem(key);
        const localTs = localTsMap[key] || 0;

        // If server has an entry and it's newer, or local device has never synced this key
        if (remoteEntry && (remoteEntry.updatedAt > localTs || localTs === 0)) {
          const serialized = JSON.stringify(remoteEntry.value);
          if (localRaw !== serialized) {
            localStorage.setItem(key, serialized);
            setLocalTimestamp(key, remoteEntry.updatedAt);
            window.dispatchEvent(
              new CustomEvent(`store_${key}`, { detail: remoteEntry.value })
            );
            updatedAnyLocal = true;
            if (key.includes('capacity')) {
              updatedCapacity = true;
            }
          } else {
            setLocalTimestamp(key, remoteEntry.updatedAt);
          }
        } else if (!remoteEntry && localRaw && localTs > 0) {
          // Only push to server if this device has an explicitly timestamped local save
          try {
            const parsed = JSON.parse(localRaw);
            missingOnServer[key] = { value: parsed, updatedAt: localTs };
          } catch {
            // Ignore malformed JSON
          }
        }
      }

      if (updatedCapacity) {
        window.dispatchEvent(new Event('store_hl_studio_capacity'));
      }
      if (updatedAnyLocal) {
        window.dispatchEvent(new Event('hl_studio_remote_synced'));
      }
    } finally {
      isApplyingRemoteUpdate = false;
    }

    // Seed server with initial client state if server didn't have these keys yet
    if (Object.keys(missingOnServer).length > 0) {
      await fetch('/api/sync/state', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ updates: missingOnServer }),
      }).catch(() => {});
    }

    window.dispatchEvent(
      new CustomEvent('hl_studio_sync_status', {
        detail: { synced: true, lastSyncAt: Date.now() },
      })
    );
    return updatedAnyLocal;
  } catch {
    return false;
  }
}

export function startRealtimeWebAppSync(): void {
  if (syncStarted || typeof window === 'undefined') return;
  syncStarted = true;

  // Initial pull & seed
  pullStateFromServer();

  // Poll every 4 seconds for real-time cross-device updates (Web <-> Android APK / Admin)
  window.setInterval(() => {
    if (document.visibilityState === 'visible') {
      pullStateFromServer();
    }
  }, 4000);

  window.addEventListener('focus', () => {
    pullStateFromServer();
  });
}
