import { useState, useEffect } from "react";

// Persists a piece of state to localStorage under `key`, re-hydrating from storage on mount.
// Pass `key` as null/undefined to skip storage entirely (e.g. to force a fresh default on a new day).
// `sanitize(parsed)` can validate/transform a loaded value; return a falsy value to fall back to `getDefault()`.
export function useLocalStorage(key, getDefault, sanitize) {
  const [value, setValue] = useState(() => {
    if (!key) return getDefault();

    const saved = localStorage.getItem(key);
    if (!saved) return getDefault();

    const parsed = JSON.parse(saved);
    if (!sanitize) return parsed;

    const sanitized = sanitize(parsed);
    return sanitized || getDefault();
  });

  useEffect(() => {
    if (!key) return;
    localStorage.setItem(key, JSON.stringify(value));
  }, [key, value]);

  return [value, setValue];
}
