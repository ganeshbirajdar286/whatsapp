import jwt from "jsonwebtoken";

export const socketMiddleware = async (socket, next) => {

  // Get token from:
  // 1. socket.handshake.auth.token (recommended)
  // 2. OR authorization header (Bearer token)
  const token =
    socket.handshake.auth?.token ||
    socket.handshake.headers["authorization"]?.split(" ")[1];
  // 1. Check missing token
  if (!token) {
    return next(new Error("Authorization token missing"));
  }

  // 2. Verify token
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    socket.user = decoded;   // Attach user to socket
    next();                  // Continue connection
  } catch (error) {
    console.log(error);
    return next(new Error("Token expired"));
  }
};


// need for socket middleware

// ❌ ANYONE can connect to your socket server

// —even without a token.

// ❌ Attackers can send messages to your chat
// ❌ They can subscribe to rooms
// ❌ They can read others' messages
// ❌ They can impersonate users