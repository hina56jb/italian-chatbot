const MAX_HISTORY = 20;

const sessions = new Map();

function emptyOrder() {
  return { items: [], drinks: [], desserts: [], service: null, name: "", phone: "", address: "" };
}

function createSession() {
  return {
    stage: "welcome",
    order: emptyOrder(),
    history: [],
    softFails: 0,
    lastBot: "",
    pending: null,
  };
}

function getSession(sessionId) {
  if (!sessionId) sessionId = "default";
  if (!sessions.has(sessionId)) {
    sessions.set(sessionId, createSession());
  }
  return sessions.get(sessionId);
}

function resetSession(sessionId) {
  const fresh = createSession();
  sessions.set(sessionId || "default", fresh);
  return fresh;
}

function pushHistory(session, role, text) {
  session.history.push({ role, text, at: new Date().toISOString() });
  if (session.history.length > MAX_HISTORY) {
    session.history = session.history.slice(-MAX_HISTORY);
  }
}

module.exports = {
  getSession,
  resetSession,
  pushHistory,
  MAX_HISTORY,
};
