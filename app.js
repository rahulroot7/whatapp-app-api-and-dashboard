const dotenv = require('dotenv');
dotenv.config({ path: './.env.development' });

const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const http = require('http'); // To create HTTP server
const { Server } = require('socket.io');

const connectDB = require('./config/config');
const authRoutes = require('./routes/auth');
const globleRoutes = require('./routes/route');
const adminRoutes = require('./routes/adminRoute');
const {startTemporaryGroupCleanupCron } = require('./jobs/temporaryGroupCleanup');

const app = express();
connectDB();

app.use(cors());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());
app.use(express.json());
app.use('/uploads', express.static('uploads'));

app.use('/api/auth', authRoutes);
app.use('/api', globleRoutes);
app.use('/api/admin/', adminRoutes);

const PORT = process.env.PORT || 8080;

// Create HTTP server from express app
const server = http.createServer(app);

// Initialize Socket.IO server, attach to HTTP server
const io = new Server(server, {
  pingTimeout: 60000,
  cors: {
    cors: { origin: "*" },
  },
});

// Socket.IO event handlers
io.on('connection', (socket) => {
  console.log('New client connected:', socket.id);

  socket.on('setup', (userData) => {
    socket.join(userData.id);
    socket.emit('connected');
  });

  socket.on('join room', (room) => {
    socket.join(room);
  });

  socket.on('typing', (room) => socket.in(room).emit('typing'));

  socket.on('stop typing', (room) => socket.in(room).emit('stop typing'));

  socket.on('new message', (newMessageReceive) => {
    const chat = newMessageReceive.chatId;
    if (!chat.users) {
      console.log('chat.users is not defined');
      return;
    }
    chat.users.forEach((user) => {
      if (user._id === newMessageReceive.sender._id) return;
      socket.in(user._id).emit('message received', newMessageReceive);
    });
  });

  socket.on('disconnect', () => {
    console.log('Client disconnected:', socket.id);
  });
});
server.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});

// remove temporary group when expire
startTemporaryGroupCleanupCron();