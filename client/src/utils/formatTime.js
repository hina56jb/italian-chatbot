export function formatTime(isoOrDate) {
  const date = isoOrDate instanceof Date ? isoOrDate : new Date(isoOrDate);
  return date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
}

export function createMessageId() {
  return `${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;
}
