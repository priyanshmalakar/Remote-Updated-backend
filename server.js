import express from 'express';
import http from 'http';
import { Server } from 'socket.io';

const app = express();
const server = http.createServer(app);

const io = new Server(server, {
  cors: {
    origin: "*",
    methods: ["GET", "POST"]
  }
});

app.get('/', (req, res) => {
  res.send('Remote Control Signaling Server 🚀');
});

const rooms = new Map();

io.on('connection', (socket) => {
  console.log('[SERVER] ✅ Client connected:', socket.id);

  socket.on('join', (roomId) => {
    console.log(`[SERVER] 📥 ${socket.id} joining room: ${roomId}`);
    
    socket.join(roomId);
    socket.roomId = roomId;
    
    if (!rooms.has(roomId)) {
      rooms.set(roomId, new Set());
    }
    rooms.get(roomId).add(socket.id);
    
    console.log(`[SERVER] Room ${roomId} has ${rooms.get(roomId).size} peer(s)`);
    
    // Notify existing peers in room
    socket.to(roomId).emit('message', 'hi');
  });

  socket.on('message', (data) => {
    if (!socket.roomId) {
      console.warn('[SERVER] ⚠️ Message without room');
      return;
    }
    
    const preview = typeof data === 'string' ? data.substring(0, 20) : 'signal';
    console.log(`[SERVER] 📤 Relaying in room ${socket.roomId}: ${preview}...`);
    
    socket.to(socket.roomId).emit('message', data);
  });

  socket.on('disconnect', () => {
    console.log('[SERVER] ❌ Client disconnected:', socket.id);
    
    if (socket.roomId && rooms.has(socket.roomId)) {
      rooms.get(socket.roomId).delete(socket.id);
      socket.to(socket.roomId).emit('peer-disconnected', socket.id);
      
      if (rooms.get(socket.roomId).size === 0) {
        rooms.delete(socket.roomId);
        console.log(`[SERVER] 🗑️ Room ${socket.roomId} deleted`);
      }
    }
  });
});

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
  console.log(`[SERVER] 🚀 Running on http://localhost:${PORT}`);
});