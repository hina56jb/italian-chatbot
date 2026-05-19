const STORAGE_KEY = "bella_napoli_session_id";

export function getSessionId() {
  let id = localStorage.getItem(STORAGE_KEY);
  if (!id) {
    id = `sess_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`;
    localStorage.setItem(STORAGE_KEY, id);
  }
  return id;
}

export function resetSessionId() {
  const id = `sess_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`;
  localStorage.setItem(STORAGE_KEY, id);
  return id;
}
