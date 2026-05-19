const express = require("express");
const http = require("http");
const cors = require("cors");
const { Server } = require("socket.io");
const { processMessage, resetConversation } = require("./bot/lucaEngine");

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

function resolveSessionId(req, fallback) {
  return (
    req.body?.sessionId ||
    req.headers["x-session-id"] ||
    req.query?.sessionId ||
    fallback
  );
}

app.get("/", (_req, res) => {
  res.json({ status: "ok", service: "Bella Napoli — Luca Bot API" });
});

app.get("/health", (_req, res) => {
  res.json({ status: "healthy" });
});

app.post("/api/chat", (req, res) => {
  const sessionId = resolveSessionId(req, "http-guest");
  const text = req.body?.message || req.body?.text || "";
  const reply = processMessage(sessionId, text);
  res.json(buildBotPayload(reply));
});

app.post("/api/reset", (req, res) => {
  const sessionId = resolveSessionId(req, "http-guest");
  const reply = resetConversation(sessionId);
  res.json(buildBotPayload(reply));
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
    socket.emit("bot_message", buildBotPayload(text));
  }

  io.on("connection", (socket) => {
    const sessionId =
      socket.handshake.query?.sessionId || socket.id;
    console.log("User connected:", socket.id, "session:", sessionId);

    socket.on("user_message", (data) => {
      const text =
        typeof data === "string" ? data : data?.message || data?.text || "";
      const reply = processMessage(sessionId, text);
      replyToUser(socket, reply);
    });

    socket.on("reset_conversation", () => {
      const reply = resetConversation(sessionId);
      replyToUser(socket, reply);
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
