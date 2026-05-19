import { useCallback, useRef, useState } from "react";
import NavbarComponent from "./components/NavbarComponent.jsx";
import ChatWindowComponent from "./components/ChatWindowComponent.jsx";
import FooterStrip from "./components/FooterStrip.jsx";
import ExportModal from "./components/ExportModal.jsx";
import { useSocket } from "./hooks/useSocket.js";
import { createMessageId } from "./utils/formatTime.js";
import { downloadConversationJson } from "./utils/exportConversation.js";

const WELCOME_MESSAGE = {
  id: "welcome",
  sender: "bot",
  text: "Buonasera! 🍕 I am **Luca**, your waiter at Bella Napoli. What can I bring you tonight?",
  timestamp: new Date().toISOString(),
};

const OFFLINE_REPLY =
  "Mi dispiace! I can't reach the kitchen right now. Please make sure the server is running. 🔧";

export default function App() {
  const [messages, setMessages] = useState([WELCOME_MESSAGE]);
  const [isTyping, setIsTyping] = useState(false);
  const [inputDisabled, setInputDisabled] = useState(false);
  const [showExportModal, setShowExportModal] = useState(false);
  const unlockTimerRef = useRef(null);

  const clearUnlockTimer = () => {
    if (unlockTimerRef.current) {
      clearTimeout(unlockTimerRef.current);
      unlockTimerRef.current = null;
    }
  };

  const addMessage = useCallback((sender, text, timestamp) => {
    setMessages((prev) => [
      ...prev,
      {
        id: createMessageId(),
        sender,
        text,
        timestamp: timestamp || new Date().toISOString(),
      },
    ]);
  }, []);

  const handleBotMessage = useCallback(
    (text, timestamp) => {
      setIsTyping(false);
      addMessage("bot", text, timestamp);
      setInputDisabled(false);
      clearUnlockTimer();
    },
    [addMessage]
  );

  const { connectionStatus, sendUserMessage, resetOnServer } = useSocket({
    onBotMessage: handleBotMessage,
    onBotTyping: setIsTyping,
  });

  const sendMessage = useCallback(
    (text) => {
      const trimmed = text.trim();
      if (!trimmed || inputDisabled) return;

      addMessage("user", trimmed);
      setInputDisabled(true);
      setIsTyping(true);
      clearUnlockTimer();

      const sent = sendUserMessage(trimmed);

      if (!sent) {
        setIsTyping(false);
        addMessage("bot", OFFLINE_REPLY);
        setInputDisabled(false);
        return;
      }

      unlockTimerRef.current = setTimeout(() => {
        setIsTyping(false);
        setInputDisabled(false);
      }, 15000);
    },
    [addMessage, inputDisabled, sendUserMessage]
  );

  const handleExport = () => {
    if (messages.length === 0) {
      window.alert("No messages to export yet!");
      return;
    }
    downloadConversationJson(messages);
    setShowExportModal(true);
  };

  const handleReset = () => {
    if (!window.confirm("Reset conversation and start over? 🍕")) return;
    clearUnlockTimer();
    setMessages([{ ...WELCOME_MESSAGE, id: createMessageId(), timestamp: new Date().toISOString() }]);
    setIsTyping(false);
    setInputDisabled(false);
    resetOnServer();
  };

  return (
    <>
      <NavbarComponent
        connectionStatus={connectionStatus}
        onExport={handleExport}
        onReset={handleReset}
      />
      <ChatWindowComponent
        messages={messages}
        isTyping={isTyping}
        inputDisabled={inputDisabled}
        connectionStatus={connectionStatus}
        onSend={sendMessage}
        onQuickReply={sendMessage}
      />
      <FooterStrip />
      <ExportModal
        show={showExportModal}
        onClose={() => setShowExportModal(false)}
      />
    </>
  );
}
