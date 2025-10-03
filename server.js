// server.js
import express from "express";
import http from "http";
import { Server } from "socket.io";
import cors from "cors";

const app = express();
const server = http.createServer(app);

const io = new Server(server, {
  cors: {
    origin: "*", // in production, replace with your frontend origin
    methods: ["GET", "POST"],
  },
});

app.use(cors());
app.get("/", (req, res) => res.send("Signaling server is running"));

io.on("connection", (socket) => {
  console.log("⚡ New client connected:", socket.id);

  socket.on("join", (roomId) => {
    console.log(`🔗 ${socket.id} joining room ${roomId}`);
    socket.join(roomId);
    // notify other peers in room that a new user joined
    socket.to(roomId).emit("new-user", { sender: socket.id });
  });

  // Generic remote data (your app used this event name)
  socket.on("remoteData", ({ roomId, data }) => {
    // forward to others in the same room
    socket.to(roomId).emit("remoteData", { sender: socket.id, data });
  });

  // Signaling (offer/answer/ice-candidate)
  socket.on("signaling", ({ roomId, signal }) => {
    socket.to(roomId).emit("signaling", { sender: socket.id, signal });
  });

  // Optional: message/call events if you need them
  socket.on("message", ({ roomId, data }) => {
    socket.to(roomId).emit("message", { sender: socket.id, data });
  });

  socket.on("disconnect", () => {
    console.log("❌ Client disconnected:", socket.id);
    // broadcast disconnect so other clients can cleanup if needed
    io.emit("disconnected", socket.id);
  });

  socket.on("leave", (roomId) => {
    socket.leave(roomId);
  });
});

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
  console.log(`🚀 Signaling Server running on http://localhost:${PORT}`);
});
