import express from "express";
import http from "http";
import { Server } from "socket.io";
import cors from "cors";

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: "*", 
  },
});

app.use(cors());

io.on("connection", (socket) => {
  console.log("⚡ New client connected:", socket.id);

  socket.on("join-room", (roomId) => {
    socket.join(roomId);
    console.log(`✅ ${socket.id} joined room ${roomId}`);
    socket.to(roomId).emit("new-user", socket.id);
  });

  socket.on("message", ({ roomId, data }) => {
    socket.to(roomId).emit("message", { sender: socket.id, data });
  });

  socket.on("call", ({ roomId, signal }) => {
    socket.to(roomId).emit("call", { sender: socket.id, signal });
  });

  socket.on("signaling", ({ roomId, signal }) => {
    socket.to(roomId).emit("signaling", { sender: socket.id, signal });
  });

  socket.on("disconnect", () => {
    console.log("❌ Client disconnected:", socket.id);
    io.emit("disconnected", socket.id);
  });
});

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
  console.log(`🚀 Server running on http://localhost:${PORT}`);
});
