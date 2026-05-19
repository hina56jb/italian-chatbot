import { formatTime } from "../utils/formatTime.js";

function formatBotText(text) {
  return text
    .replace(/\*\*(.*?)\*\*/g, "<strong>$1</strong>")
    .replace(/\n/g, "<br>");
}

function escapeHtml(str) {
  return str
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/\n/g, "<br>");
}

export default function MessageBubble({ sender, text, timestamp }) {
  const isBot = sender === "bot";
  const avatar = isBot ? "🧑‍🍳" : "👤";
  const name = isBot ? "Luca" : "You";
  const html = isBot ? formatBotText(text) : escapeHtml(text);

  return (
    <div className={`msg-row ${sender}`}>
      <div className="msg-avatar" aria-hidden="true">
        {avatar}
      </div>
      <div className="msg-content">
        <div className="msg-name">{name}</div>
        <div
          className="msg-bubble"
          dangerouslySetInnerHTML={{ __html: html }}
        />
        <div className="msg-time">{formatTime(timestamp)}</div>
      </div>
    </div>
  );
}
