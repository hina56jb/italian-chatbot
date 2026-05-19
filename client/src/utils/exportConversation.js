export function downloadConversationJson(messages) {
  const payload = {
    restaurant: "Bella Napoli",
    exported_at: new Date().toISOString(),
    total_messages: messages.length,
    conversation: messages.map(({ sender, text, timestamp }) => ({
      sender,
      text,
      timestamp,
    })),
  };

  const blob = new Blob([JSON.stringify(payload, null, 2)], {
    type: "application/json",
  });
  const link = document.createElement("a");
  link.href = URL.createObjectURL(blob);
  link.download = "bella_napoli_chat.json";
  link.click();
  URL.revokeObjectURL(link.href);
}
