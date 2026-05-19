import { useEffect, useRef, useState, useCallback } from "react";
import { io } from "socket.io-client";
import { BACKEND_URL } from "../config/api.js";
import { sendChatMessage, resetChatSession } from "../utils/chatApi.js";

const SOCKET_OPTS = {
  path: "/socket.io",
  transports: ["websocket"],
  upgrade: false,
  rememberUpgrade: false,
  reconnection: true,
  reconnectionAttempts: 6,
  reconnectionDelay: 2000,
  timeout: 20000,
  autoConnect: true,
  forceNew: false,
};

let sharedSocket = null;

function getSharedSocket() {
  if (sharedSocket && !sharedSocket.disconnected) {
    return sharedSocket;
  }
  if (sharedSocket) {
    sharedSocket.removeAllListeners();
    sharedSocket.disconnect();
  }
  sharedSocket = io(BACKEND_URL, SOCKET_OPTS);
  return sharedSocket;
}

function parseBotPayload(payload) {
  const text =
    typeof payload === "string"
      ? payload
      : payload?.message || payload?.text || "";
  const timestamp =
    payload?.timestamp || payload?.time || new Date().toISOString();
  return { text, timestamp };
}

export function useSocket({ onBotMessage, onBotTyping }) {
  const socketRef = useRef(null);
  const [connectionStatus, setConnectionStatus] = useState("connecting");
  const useHttpFallbackRef = useRef(false);

  const onBotMessageRef = useRef(onBotMessage);
  const onBotTypingRef = useRef(onBotTyping);

  useEffect(() => {
    onBotMessageRef.current = onBotMessage;
  }, [onBotMessage]);

  useEffect(() => {
    onBotTypingRef.current = onBotTyping;
  }, [onBotTyping]);

  useEffect(() => {
    const socket = getSharedSocket();
    socketRef.current = socket;

    const onConnect = () => {
      useHttpFallbackRef.current = false;
      setConnectionStatus("connected");
    };
    const onDisconnect = () => {
      if (!useHttpFallbackRef.current) {
        setConnectionStatus("disconnected");
      }
    };
    const onConnectError = () => {
      useHttpFallbackRef.current = true;
      setConnectionStatus("connected");
    };
    const onReconnectAttempt = () => setConnectionStatus("connecting");

    const handleBotPayload = (payload) => {
      const { text, timestamp } = parseBotPayload(payload);
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

    if (socket.connected) onConnect();
    else if (socket.disconnected) socket.connect();

    return () => {
      socket.off("connect", onConnect);
      socket.off("disconnect", onDisconnect);
      socket.off("connect_error", onConnectError);
      socket.io.off("reconnect_attempt", onReconnectAttempt);
      socket.off("bot_message", handleBotPayload);
      socket.off("receive_message", handleBotPayload);
    };
  }, []);

  const sendUserMessage = useCallback(async (text) => {
    const socket = socketRef.current;

    if (socket?.connected && !useHttpFallbackRef.current) {
      socket.emit("user_message", { message: text });
      socket.emit("send_message", { message: text });
      return true;
    }

    try {
      useHttpFallbackRef.current = true;
      setConnectionStatus("connected");
      if (onBotTypingRef.current) onBotTypingRef.current(true);

      const data = await sendChatMessage(text);
      const { text: reply, timestamp } = parseBotPayload(data);

      if (onBotTypingRef.current) onBotTypingRef.current(false);
      if (reply && onBotMessageRef.current) {
        onBotMessageRef.current(reply, timestamp);
      }
      return true;
    } catch {
      if (onBotTypingRef.current) onBotTypingRef.current(false);
      return false;
    }
  }, []);

  const resetOnServer = useCallback(async () => {
    const socket = socketRef.current;
    if (socket?.connected && !useHttpFallbackRef.current) {
      socket.emit("reset_conversation", {});
      return;
    }
    try {
      const data = await resetChatSession();
      const { text, timestamp } = parseBotPayload(data);
      if (text && onBotMessageRef.current) {
        onBotMessageRef.current(text, timestamp);
      }
    } catch {
      /* ignore */
    }
  }, []);

  return { connectionStatus, sendUserMessage, resetOnServer };
}
