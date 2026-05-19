import MessageList from "./MessageList.jsx";
import QuickReplies from "./QuickReplies.jsx";
import ChatInputBar from "./ChatInputBar.jsx";

export default function ChatWindowComponent({
  messages,
  isTyping,
  inputDisabled,
  connectionStatus,
  onSend,
  onQuickReply,
}) {
  const statusText =
    connectionStatus === "connected"
      ? "🟢 Online · ready to take your order"
      : connectionStatus === "connecting"
        ? "⏳ Connecting to the kitchen…"
        : "🔴 Offline · server not reachable";

  return (
    <div className="chat-wrapper">
      <div className="chat-card">
        <div className="chat-subheader">
          <div className="luca-avatar" aria-hidden="true">
            🧑‍🍳
            <span className="status-dot" />
          </div>
          <div>
            <h6>
              Luca{" "}
              <small style={{ fontWeight: 300 }}>— your waiter tonight</small>
            </h6>
            <small>{statusText}</small>
          </div>
        </div>

        <MessageList messages={messages} isTyping={isTyping} />
        <QuickReplies onSelect={onQuickReply} disabled={inputDisabled} />
        <ChatInputBar onSend={onSend} disabled={inputDisabled} />
      </div>
    </div>
  );
}
