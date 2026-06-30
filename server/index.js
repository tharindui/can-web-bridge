require('dotenv').config();
const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const cors = require('cors');
const canBus = require('./can/canBus');

const PORT = process.env.PORT || 3001;

const app = express();
app.use(cors());

const server = http.createServer(app);
const io = new Server(server, {
  cors: { origin: 'http://localhost:3000', methods: ['GET', 'POST'] },
});

// Forward frames received from MCU to all connected browsers
canBus.onFrame((frame) => {
  io.emit('frame-received', { ...frame, timestamp: new Date().toISOString() });
});

io.on('connection', (socket) => {
  console.log('Browser connected:', socket.id);

  socket.on('send-frame', ({ id, data }) => {
    console.log(`Sending frame → id=${id} data=${data}`);
    canBus.sendFrame(id, data);
  });

  socket.on('disconnect', () => console.log('Browser disconnected:', socket.id));
});

canBus.connect();

if (process.env.NODE_ENV !== 'production') {
  app.use(express.json());
  app.post('/test/inject-frame', (req, res) => {
    const { id, data } = req.body;
    io.emit('frame-received', { id, data, timestamp: new Date().toISOString() });
    res.json({ ok: true });
  });
}

server.listen(PORT, () => console.log(`Server running on http://localhost:${PORT}`));
