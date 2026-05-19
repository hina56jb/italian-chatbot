export default function TypingIndicator() {
  return (
    <div className="msg-row bot typing-indicator">
      <div className="msg-avatar" aria-hidden="true">
        🧑‍🍳
      </div>
      <div className="msg-content">
        <div className="msg-name">Luca</div>
        <div className="msg-bubble">
          <span className="dot" />
          <span className="dot" />
          <span className="dot" />
        </div>
      </div>
    </div>
  );
}
