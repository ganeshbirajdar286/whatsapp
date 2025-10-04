import { io } from "socket.io-client"
import useUserStore from "../../store/useUserStore";

let socket = null;

export const initializeSocket = () => {
   if (socket) return socket

   const user = useUserStore.getState().user;
   //useUserStore.getState().user → only grabs a snapshot at that moment.
   //useUserStore((state) => state.user) → re-renders when state changes.

   const BACKEND_URL = import.meta.env.VITE_API_URL;


   socket = io(BACKEND_URL, {
      withCredentials: true,
      transports: ["websocket", "polling"],

      //Forces the socket to first try WebSocket (fast, efficient).
      // Falls back to polling if WebSocket is blocked (e.g., proxies, firewalls).

      reconnectionAttempts: 5,

      //If the connection drops, the client will retry 5 times before giving up.
      //Prevents infinite reconnection loops.

      reconnectionDelay: 1000,

      //Waits 1 second between reconnection attempts.
      //Avoids spamming the server with reconnect requests.
   })

   //connection events

   socket.on("connect", () => {
      if (user?._id) {
         socket.emit("user_connected", user._id);
      } else {
         console.log("User not ready yet");
      }
   });


   socket.on("connect_error", (error) => {
      console.log("socket connection error", error);
   })

   //disconnect events
   socket.on("disconnect", (reason) => {
      console.log("socket disconnected", reason);
   })

   return socket;

}

export const getSocket = () => {
   if (!socket) {
      return initializeSocket();
   }
   return socket;
}

   //  Why getSocket is created?
   ;
// Reason: To avoid multiple socket connections.
// If you directly call initializeSocket() everywhere, each call would create a new connection to the server.
// That causes duplicate events (receive_message firing multiple times, etc.).
// getSocket() ensures:
// First time → create a socket.
// Next times → return the same socket.

export const disconnectSocket = () => {
   if (socket) {
      socket.disconnect();
      socket = null;
   }
}

// Why disconnectSocket is created?
// Reason: To cleanly close the connection when the user logs out or app shuts down.
// Just calling socket.disconnect() is not enough because:
// socket variable still holds the old reference.
// If user logs in again → getSocket() would reuse the old (disconnected) socket.
// By setting socket = null, next time getSocket() is called, it creates a fresh new connection.