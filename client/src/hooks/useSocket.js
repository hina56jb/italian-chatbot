import { useEffect, useRef, useState, useCallback } from "react";
import { io } from "socket.io-client";
import { BACKEND_URL } from "../config/api.js";

/** One socket per page — avoids duplicate sessions (React StrictMode / remounts). */
function createSocket() {
  return io(BACKEND_URL, {
    path: "/socket.io",
    // WebSocket only on production: Vercel serverless breaks long-polling sessions
    transports: import.meta.env.PROD ? ["websocket"] : ["websocket", "polling"],
    upgrade: !import.meta.env.PROD,
    rememberUpgrade: false,
    reconnection: true,
    reconnectionAttempts: 10,
    reconnectionDelay: 1500,
    reconnectionDelayMax: 5000,
    timeout: 25000,
    autoConnect: true,
    forceNew: true,
  });
}

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
    const socket = createSocket();
    socketRef.current = socket;

    const onConnect = () => setConnectionStatus("connected");
    const onDisconnect = () => setConnectionStatus("disconnected");
    const onConnectError = () => setConnectionStatus("disconnected");
    const onReconnectAttempt = () => setConnectionStatus("connecting");

    const handleBotPayload = (payload) => {
      const text =
        typeof payload === "string"
          ? payload
          : payload?.message || payload?.text || "";
      const timestamp =
        payload?.timestamp || payload?.time || new Date().toISOString();

      if (text && onBotMessageRef.current) {
        onBotMessageRef.current(text, timestamp);
      }
    };

    socket.on("connect", onConnect);
    socket.on("disconnect", onDisconnect);
    socket.on("connect_error", onConnectError);
    socket.io.on("reconnect_attempt", onReconnectAttempt);
    socket.on("bot_message", handleBotPayload);
    socket.on("receive_message", handleBotPayload);
    socket.on("bot_typing", (isTyping) => {
      if (onBotTypingRef.current) onBotTypingRef.current(Boolean(isTyping));
    });

    return () => {
      socket.off("connect", onConnect);
      socket.off("disconnect", onDisconnect);
      socket.off("connect_error", onConnectError);
      socket.io.off("reconnect_attempt", onReconnectAttempt);
      socket.off("bot_message", handleBotPayload);
      socket.off("receive_message", handleBotPayload);
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
