import { useEffect, useRef, useState, useCallback } from "react";
import { io } from "socket.io-client";
import { BACKEND_URL } from "../config/api.js";

export function useSocket({ onBotMessage, onBotTyping }) {
  const socketRef = useRef(null);
  const [connectionStatus, setConnectionStatus] = useState("connecting");

  const onBotMessageRef = useRef(onBotMessage);
  const onBotTypingRef = useRef(onBotTyping);

  useEffect(() => {
    onBotMessageRef.current = onBotMessage;
  }, [onBotMessage]);

  useEffect(() => {
    onBotTypingRef.current = onBotTyping;
  }, [onBotTyping]);

  useEffect(() => {
    const socket = io(BACKEND_URL, {
      path: "/socket.io",
      transports: ["polling", "websocket"],
      reconnection: true,
      reconnectionAttempts: 8,
      reconnectionDelay: 2000,
      timeout: 20000,
      autoConnect: true,
    });

    socketRef.current = socket;

    socket.on("connect", () => setConnectionStatus("connected"));
    socket.on("disconnect", () => setConnectionStatus("disconnected"));
    socket.on("connect_error", () => setConnectionStatus("disconnected"));
    socket.io.on("reconnect_attempt", () => setConnectionStatus("connecting"));

    const handleBotPayload = (payload) => {
      const text =
        typeof payload === "string"
          ? payload
          : payload?.message || payload?.text || "";
      const timestamp =
        payload?.timestamp ||
        payload?.time ||
        new Date().toISOString();

      if (text && onBotMessageRef.current) {
        onBotMessageRef.current(text, timestamp);
      }
    };

    socket.on("bot_message", handleBotPayload);
    socket.on("receive_message", handleBotPayload);

    socket.on("bot_typing", (isTyping) => {
      if (onBotTypingRef.current) onBotTypingRef.current(Boolean(isTyping));
    });

    return () => {
      socket.disconnect();
      socketRef.current = null;
    };
  }, []);

  const sendUserMessage = useCallback((text) => {
    const socket = socketRef.current;
    if (!socket?.connected) return false;

    socket.emit("user_message", { message: text });
    socket.emit("send_message", { message: text });
    return true;
  }, []);

  const resetOnServer = useCallback(() => {
    const socket = socketRef.current;
    if (socket?.connected) {
      socket.emit("reset_conversation", {});
    }
  }, []);

  return { connectionStatus, sendUserMessage, resetOnServer };
}
