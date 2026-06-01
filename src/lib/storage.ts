type StorageArea = "local" | "session";

function getStorage(area: StorageArea): Storage | null {
  if (typeof window === "undefined") return null;
  try {
    return area === "local" ? window.localStorage : window.sessionStorage;
  } catch {
    return null;
  }
}

export function readStorage(area: StorageArea, key: string): string | null {
  const storage = getStorage(area);
  if (!storage) return null;
  try {
    return storage.getItem(key);
  } catch {
    return null;
  }
}

export function writeStorage(area: StorageArea, key: string, value: string): boolean {
  const storage = getStorage(area);
  if (!storage) return false;
  try {
    storage.setItem(key, value);
    return true;
  } catch {
    return false;
  }
}

export function removeStorage(area: StorageArea, key: string): boolean {
  const storage = getStorage(area);
  if (!storage) return false;
  try {
    storage.removeItem(key);
    return true;
  } catch {
    return false;
  }
}
