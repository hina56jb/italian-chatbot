const express = require("express");
const http = require("http");
const cors = require("cors");
const { Server } = require("socket.io");

const app = express();
app.use(cors({ origin: "*" }));
app.use(express.json());

app.get("/", (_req, res) => {
  res.json({ status: "ok", service: "Bella Napoli Socket API" });
});

app.get("/health", (_req, res) => {
  res.json({ status: "healthy" });
});

const server = http.createServer(app);

const io = new Server(server, {
  cors: { origin: "*", methods: ["GET", "POST"] },
  addTrailingSlash: false,
  transports: ["websocket", "polling"],
});

function replyToUser(socket, text) {
  const payload = {
    sender: "bot",
    message: text,
    text,
    timestamp: new Date().toISOString(),
    time: new Date().toLocaleTimeString([], {
      hour: "2-digit",
      minute: "2-digit",
    }),
  };
  socket.emit("bot_message", payload);
  socket.emit("receive_message", payload);
}

function handleUserMessage(socket, data) {
  const text =
    typeof data === "string"
      ? data
      : data?.message || data?.text || "";

  console.log("Message:", text);

  replyToUser(socket, "🍕 Luca received your order!");
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

const PORT = process.env.PORT || 3000;

if (!process.env.VERCEL) {
  server.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
  });
}

module.exports = server;
