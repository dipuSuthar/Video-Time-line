import { useEffect, useState } from "react";

// localStorage can throw (private mode, quota, blocked cookies), so never trust it.
export const loadJSON = (key, fallback) => {
  try {
    const raw = window.localStorage.getItem(key);
    return raw === null ? fallback : JSON.parse(raw);
  } catch {
    return fallback;
  }
};

export const saveJSON = (key, value) => {
  try {
    window.localStorage.setItem(key, JSON.stringify(value));
  } catch {
    /* ignore: storage is a nice-to-have, not required */
  }
};

export default function useLocalStorage(key, initialValue) {
  const [value, setValue] = useState(() => loadJSON(key, initialValue));
  useEffect(() => {
    saveJSON(key, value);
  }, [key, value]);
  return [value, setValue];
}
