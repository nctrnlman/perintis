export type ConsentStatus = "pending" | "accepted" | "declined";

const STORAGE_KEY = "perintis-cookie-consent";
const listeners = new Set<() => void>();

function readStatus(): ConsentStatus {
  const stored = localStorage.getItem(STORAGE_KEY);
  return stored === "accepted" || stored === "declined" ? stored : "pending";
}

let cachedStatus: ConsentStatus | null = null;

export function getConsentSnapshot(): ConsentStatus {
  if (cachedStatus === null) {
    cachedStatus = readStatus();
  }
  return cachedStatus;
}

export function getConsentServerSnapshot(): ConsentStatus {
  return "pending";
}

export function subscribeConsent(callback: () => void): () => void {
  listeners.add(callback);
  return () => listeners.delete(callback);
}

function setConsent(status: "accepted" | "declined") {
  localStorage.setItem(STORAGE_KEY, status);
  cachedStatus = status;
  listeners.forEach((listener) => listener());
}

export function acceptConsent() {
  setConsent("accepted");
}

export function declineConsent() {
  setConsent("declined");
}
