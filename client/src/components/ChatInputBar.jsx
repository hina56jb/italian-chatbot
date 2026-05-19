import { useState } from "react";

export default function ChatInputBar({ onSend, disabled }) {
  const [value, setValue] = useState("");

  const submit = () => {
    const trimmed = value.trim();
    if (!trimmed || disabled) return;
    onSend(trimmed);
    setValue("");
  };

  const handleKeyDown = (event) => {
    if (event.key === "Enter" && !event.shiftKey) {
      event.preventDefault();
      submit();
    }
  };

  return (
    <div className="input-bar">
      <input
        type="text"
        className="chat-input"
        placeholder="Type your message to Luca…"
        autoComplete="off"
        maxLength={500}
        value={value}
        disabled={disabled}
        onChange={(e) => setValue(e.target.value)}
        onKeyDown={handleKeyDown}
        aria-label="Message to Luca"
      />
      <button
        type="button"
        className="btn-send"
        title="Send message"
        disabled={disabled || !value.trim()}
        onClick={submit}
      >
        <i className="bi bi-send-fill" />
      </button>
    </div>
  );
}
