import { BACKEND_URL } from "../config/api.js";
import { getSessionId } from "./sessionId.js";

export async function sendChatMessage(message) {
  const response = await fetch(`${BACKEND_URL}/api/chat`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "X-Session-Id": getSessionId(),
    },
    body: JSON.stringify({ message, sessionId: getSessionId() }),
  });

  if (!response.ok) {
    throw new Error(`Chat API failed (${response.status})`);
  }

  return response.json();
}

export async function resetChatSession() {
  const response = await fetch(`${BACKEND_URL}/api/reset`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "X-Session-Id": getSessionId(),
    },
    body: JSON.stringify({ sessionId: getSessionId() }),
  });

  if (!response.ok) {
    throw new Error(`Reset API failed (${response.status})`);
  }

  return response.json();
}
