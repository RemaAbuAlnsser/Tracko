import { Server } from 'socket.io';

let io;

export const initializeSocket = (server) => {
  io = new Server(server, {
    cors: {
      origin: "http://localhost:3000",
      methods: ["GET", "POST"],
      credentials: true
    }
  });

  io.on('connection', (socket) => {
    console.log('🔌 User connected:', socket.id);

    // Join a room (for one-to-one video call)
    socket.on('join-room', (roomId, userId) => {
      console.log(`👤 User ${userId} joining room ${roomId}`);
      socket.join(roomId);
      socket.to(roomId).emit('user-connected', userId, socket.id);
      
      // Send existing users in room
      socket.emit('room-users', Array.from(io.sockets.adapter.rooms.get(roomId) || []));
    });

    // WebRTC signaling
    socket.on('offer', (offer, roomId) => {
      console.log('📞 Offer received for room:', roomId);
      socket.to(roomId).emit('offer', offer, socket.id);
    });

    socket.on('answer', (answer, roomId) => {
      console.log('✅ Answer received for room:', roomId);
      socket.to(roomId).emit('answer', answer, socket.id);
    });

    socket.on('ice-candidate', (candidate, roomId) => {
      console.log('🧊 ICE candidate received for room:', roomId);
      socket.to(roomId).emit('ice-candidate', candidate, socket.id);
    });

    // Call actions
    socket.on('call-user', (data) => {
      console.log('📞 Calling user:', data);
      io.to(data.userToCall).emit('incoming-call', {
        from: socket.id,
        callerName: data.callerName,
        signal: data.signal
      });
    });

    socket.on('accept-call', (data) => {
      console.log('✅ Call accepted');
      io.to(data.to).emit('call-accepted', data.signal);
    });

    socket.on('end-call', (roomId) => {
      console.log('📴 Call ended in room:', roomId);
      socket.to(roomId).emit('call-ended');
    });

    socket.on('disconnect', () => {
      console.log('❌ User disconnected:', socket.id);
      // Notify other users in the same rooms
      socket.rooms.forEach(roomId => {
        socket.to(roomId).emit('user-disconnected', socket.id);
      });
    });
  });

  return io;
};

export const getIO = () => {
  if (!io) {
    throw new Error('Socket.io not initialized!');
  }
  return io;
};
