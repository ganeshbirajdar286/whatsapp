const handleVideoCallEvent = (socket, io, onlineUsers) => {
  // Initiate call - FIXED: Use callId from frontend
  socket.on("initiate_call", ({ callerId, receiverId, callType, callerInfo, callId }) => {
    console.log(`📞 Call initiate received:`, { callerId, receiverId, callId });
    
    const receiverSocketId = onlineUsers.get(receiverId);
    if (receiverSocketId) {
      io.to(receiverSocketId).emit("incoming_call", {
        callerId,
        callerName: callerInfo.username,
        callerAvatar: callerInfo.profilePicture,
        callId, // Use the callId from frontend
        callType,
      });
      console.log(`✅ Call ${callId} forwarded to ${receiverId}`);
    } else {
      console.log(`❌ Receiver ${receiverId} is offline`);
      socket.emit("call_failed", { reason: "user is offline" });
    }
  });

  // Accept call
  socket.on("accept_call", ({ callerId, callId, receiverInfo }) => {
    const callerSocketId = onlineUsers.get(callerId);
    if (callerSocketId) {
      io.to(callerSocketId).emit("call_accepted", {
        receiverName: receiverInfo.username,
        receiverAvatar: receiverInfo.profilePicture,
        callId,
      });
      console.log(`✅ Call ${callId} accepted`);
    } else {
      console.log(`❌ Caller ${callerId} not found`);
    }
  });

  // Receiver ready signal - CRITICAL FOR PROPER FLOW
  socket.on("receiver_ready", ({ callerId, callId }) => {
    console.log(`✅ Receiver ready signal received for call ${callId}`);
    console.log(`📋 Looking for caller with ID: ${callerId}`);
    console.log(`👥 Online users:`, Array.from(onlineUsers.keys()));
    
    const callerSocketId = onlineUsers.get(callerId);
    
    if (callerSocketId) {
      console.log(`📤 Sending receiver_ready to caller socket: ${callerSocketId}`);
      io.to(callerSocketId).emit("receiver_ready", { callId });
      console.log(`✅ Receiver ready signal sent successfully`);
    } else {
      console.error(`❌ Caller ${callerId} not found in online users!`);
    }
  });

  // Reject call
  socket.on("reject_call", ({ callerId, callId }) => {
    console.log(`❌ Call ${callId} rejected`);
    const callerSocketId = onlineUsers.get(callerId);
    if (callerSocketId) {
      io.to(callerSocketId).emit("call_rejected", { callId });
    }
  });

  // End call
  socket.on("end_call", ({ callId, participantId }) => {
    console.log(`📞 Call ${callId} ended`);
    const participantSocketId = onlineUsers.get(participantId);
    if (participantSocketId) {
      io.to(participantSocketId).emit("call_ended", { callId });
    }
  });

  // WebRTC Offer
  socket.on("webrtc_offer", ({ offer, receiverId, callId }) => {
    const receiverSocketId = onlineUsers.get(receiverId);
    if (receiverSocketId) {
      io.to(receiverSocketId).emit("webrtc_offer", {
        offer,
        senderId: socket.userId,
        callId,
      });
      console.log(`📤 WebRTC offer forwarded to ${receiverId}`);
    } else {
      console.log(`❌ Receiver ${receiverId} not found for offer`);
    }
  });

  // WebRTC Answer
  socket.on("webrtc_answer", ({ answer, receiverId, callId }) => {
    const receiverSocketId = onlineUsers.get(receiverId);
    if (receiverSocketId) {
      io.to(receiverSocketId).emit("webrtc_answer", {
        answer,
        senderId: socket.userId,
        callId,
      });
      console.log(`📤 WebRTC answer forwarded to ${receiverId}`);
    } else {
      console.log(`❌ Receiver ${receiverId} not found for answer`);
    }
  });

  // WebRTC ICE Candidate
  socket.on("webrtc_ice_candidate", ({ candidate, receiverId, callId }) => {
    const receiverSocketId = onlineUsers.get(receiverId);
    if (receiverSocketId) {
      io.to(receiverSocketId).emit("webrtc_ice_candidate", {
        candidate,
        senderId: socket.userId,
        callId,
      });
      console.log(`🧊 ICE candidate forwarded to ${receiverId}`);
    } else {
      console.log(`❌ Receiver ${receiverId} not found for ICE candidate`);
    }
  });
};

export default handleVideoCallEvent;