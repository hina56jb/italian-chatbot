import { BACKEND_URL } from "../config/api.js";

export async function sendChatMessage(message) {
  const response = await fetch(`${BACKEND_URL}/api/chat`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ message }),
  });

  if (!response.ok) {
    throw new Error(`Chat API failed (${response.status})`);
  }

  return response.json();
}

export async function resetChatSession() {
  const response = await fetch(`${BACKEND_URL}/api/reset`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
  });

  if (!response.ok) {
    throw new Error(`Reset API failed (${response.status})`);
  }

  return response.json();
}
