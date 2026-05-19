import { useEffect, useRef } from "react";
import MessageBubble from "./MessageBubble.jsx";
import TypingIndicator from "./TypingIndicator.jsx";

export default function MessageList({ messages, isTyping }) {
  const areaRef = useRef(null);

  useEffect(() => {
    const area = areaRef.current;
    if (area) area.scrollTop = area.scrollHeight;
  }, [messages, isTyping]);

  return (
    <div className="messages-area" ref={areaRef}>
      <div className="date-divider">
        <span>Today</span>
      </div>
      {messages.map((msg) => (
        <MessageBubble
          key={msg.id}
          sender={msg.sender}
          text={msg.text}
          timestamp={msg.timestamp}
        />
      ))}
      {isTyping && <TypingIndicator />}
    </div>
  );
}
