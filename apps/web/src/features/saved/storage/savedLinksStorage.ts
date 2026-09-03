import type { SavedLink } from "@/domain/article";

const STORAGE_KEY = "daily-news:saved-links";
const listeners = new Set<() => void>();
let storageListenerAttached = false;

// useSyncExternalStore requires getSnapshot to return a stable reference
// when the underlying value hasn't changed, or it re-renders forever.
let cachedRaw: string | null = null;
let cachedLinks: SavedLink[] = [];

function parse(raw: string | null): SavedLink[] {
  if (raw === cachedRaw) return cachedLinks;

  cachedRaw = raw;
  try {
    const parsed: unknown = JSON.parse(raw ?? "[]");
    cachedLinks = Array.isArray(parsed) ? (parsed as SavedLink[]) : [];
  } catch {
    cachedLinks = [];
  }
  return cachedLinks;
}

function notifyListeners() {
  listeners.forEach((listener) => listener());
}

function handleStorageEvent(event: StorageEvent) {
  if (event.key === STORAGE_KEY) {
    notifyListeners();
  }
}

function attachStorageListener() {
  if (typeof window !== "undefined" && !storageListenerAttached) {
    window.addEventListener("storage", handleStorageEvent);
    storageListenerAttached = true;
  }
}

function detachStorageListener() {
  if (
    typeof window !== "undefined" &&
    storageListenerAttached &&
    listeners.size === 0
  ) {
    window.removeEventListener("storage", handleStorageEvent);
    storageListenerAttached = false;
  }
}

export const savedLinksStorage = {
  read(): SavedLink[] {
    if (typeof window === "undefined") return [];

    return parse(window.localStorage.getItem(STORAGE_KEY));
  },

  write(links: SavedLink[]) {
    if (typeof window === "undefined") return;

    try {
      const raw = JSON.stringify(links);
      window.localStorage.setItem(STORAGE_KEY, raw);
      cachedRaw = raw;
      cachedLinks = links;
      notifyListeners();
    } catch {
      // Storage can be unavailable in private browsing or restricted contexts.
    }
  },

  subscribe(listener: () => void) {
    listeners.add(listener);
    attachStorageListener();

    return () => {
      listeners.delete(listener);
      detachStorageListener();
    };
  },
};
