const express = require("express");
const http = require("http");
const cors = require("cors");
const { Server } = require("socket.io");

const app = express();

app.use(cors());

const server = http.createServer(app);

const io = new Server(server, {
  cors: {
    origin: "*",
  },
});

io.on("connection", (socket) => {

  console.log("User Connected");

  socket.on("send_message", (data) => {

    console.log("Message:", data);

    socket.emit("receive_message", {
      sender: "bot",
      text: "🍕 Luca received your order!",
      time: new Date().toLocaleTimeString([], {
        hour: "2-digit",
        minute: "2-digit",
      }),
    });

  });

});

server.listen(3000, () => {
  console.log("Server running on port 3000");
});