const express = require("express");
const http = require("http");
const cors = require("cors");
const { Server } = require("socket.io");

const app = express();
app.use(cors({ origin: "*" }));
app.use(express.json());

const isVercel = Boolean(process.env.VERCEL);

function buildBotPayload(text) {
  return {
    sender: "bot",
    message: text,
    text,
    timestamp: new Date().toISOString(),
    time: new Date().toLocaleTimeString([], {
      hour: "2-digit",
      minute: "2-digit",
    }),
  };
}

function botReplyText(userText) {
  return "🍕 Luca received your order!";
}

app.get("/", (_req, res) => {
  res.json({ status: "ok", service: "Bella Napoli API" });
});

app.get("/health", (_req, res) => {
  res.json({ status: "healthy" });
});

app.post("/api/chat", (req, res) => {
  const text = req.body?.message || req.body?.text || "";
  console.log("HTTP chat:", text);
  res.json(buildBotPayload(botReplyText(text)));
});

app.post("/api/reset", (_req, res) => {
  res.json(
    buildBotPayload(
      "Conversation reset! Buonasera — what would you like to order? 🍝"
    )
  );
});

const server = http.createServer(app);

function attachSocketIO(httpServer) {
  if (global.__bellaIo) {
    return global.__bellaIo;
  }

  const io = new Server(httpServer, {
    cors: { origin: "*", methods: ["GET", "POST"] },
    addTrailingSlash: false,
    transports: isVercel ? ["websocket"] : ["websocket", "polling"],
    allowUpgrades: !isVercel,
  });

  function replyToUser(socket, text) {
    const payload = buildBotPayload(text);
    socket.emit("bot_message", payload);
    socket.emit("receive_message", payload);
  }

  function handleUserMessage(socket, data) {
    const text =
      typeof data === "string" ? data : data?.message || data?.text || "";
    console.log("Socket message:", text);
    replyToUser(socket, botReplyText(text));
  }

  io.on("connection", (socket) => {
    console.log("User connected:", socket.id);

    socket.on("send_message", (data) => handleUserMessage(socket, data));
    socket.on("user_message", (data) => handleUserMessage(socket, data));

    socket.on("reset_conversation", () => {
      replyToUser(
        socket,
        "Conversation reset! Buonasera — what would you like to order? 🍝"
      );
    });
  });

  global.__bellaIo = io;
  return io;
}

attachSocketIO(server);

const PORT = process.env.PORT || 3000;

if (!isVercel) {
  server.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
  });
}

module.exports = server;
