// Bring-your-own-key storage. The key lives only in the visitor's browser
// (localStorage) and is sent per-request; it never persists on the server.

export const KEY_STORAGE = "nova_gemini_key";
export const KEY_EVENT = "nova-key-change";

export function getApiKey(): string {
  if (typeof window === "undefined") return "";
  return window.localStorage.getItem(KEY_STORAGE) ?? "";
}

export function setApiKey(value: string) {
  if (typeof window === "undefined") return;
  const trimmed = value.trim();
  if (trimmed) window.localStorage.setItem(KEY_STORAGE, trimmed);
  else window.localStorage.removeItem(KEY_STORAGE);
  window.dispatchEvent(new Event(KEY_EVENT));
}
