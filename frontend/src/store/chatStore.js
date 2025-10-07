import { create } from "zustand";
import { getSocket } from "../pages/services/chat.services";
import { axiosInstance } from "../../src/pages/services/url.services";

// Function  	Responsibility
// initializeSocket()	Create the socket connection (once per user login)
// getSocket()	Retrieve the existing socket instance safely
// initSocketListeners()	Attach or reattach event listeners for chat

export const useChatStore = create((set, get) => ({
  conversations: [], // list of  all converstation
  currentConversation: null, // ID of the active chat
  messages: [], // Messages of the current chat
  loading: false, // Loader flag for API requests
  error: null, // To store error messages
  onlineUsers: new Map(), // { userId -> { isOnline, lastSeen } }
  typingUsers: new Map(), // { conversationId -> Set(userIds who are typing) }
  currentUser: null,

  //socket event listerns
  initSocketListeners: () => {
    const socket = getSocket();
    if (!socket) return;

    // remove exiting listerners to prevent  duplicate handlers
    socket.off("receive_message");
    socket.off("user_typing");
    socket.off("user_status");
    socket.off("message_send");
    socket.off("message_error");
    socket.off("message_deleted");
    socket.off("typing_stop");
    socket.off("add_reaction");

    // Incoming message from other user
    socket.on("receive_message", (message) => {
      console.log(message);
      get().receiveMessage(message);
    });

    // confirm message was delivered.
    socket.on("message_send", (message) => {
      set((state) => ({
        messages: state.messages.map((msg) =>
          msg._id === message._id ? { ...msg } : msg
        ),
      }));
    });

    // read/delivered status updated.
    socket.on("message_status_update", ({ messageId, messageStatus }) => {
      set((state) => ({
        messages: state.messages.map((msg) =>
          msg._id === messageId ? { ...msg, messageStatus } : msg
        ),
      }));

      // Update unread count for conversation
      if (messageStatus === "read") {
        const { conversations } = get();
        const updatedConvs = conversations.data.map((conv) => {
          const lastMsg = conv.lastMessage;
          if (lastMsg && lastMsg._id === messageId) {
            return { ...conv, unreadCount: 0 }; // all read
          }
          return conv;
        });
        set({
          conversations: { ...conversations, data: updatedConvs },
        });
      }
    });

    // handel reaction on message
    socket.on("reaction_update", ({ messageId, reactions }) => {
      set((state) => ({
        messages: state.messages.map((msg) =>
          msg._id === messageId ? { ...msg, reactions } : msg
        ),
      }));
    });

    // handle  message deleted.
    socket.on("reaction_deleted", ({ deletedMessageId }) => {
      set((state) => ({
        messages: state.messages.filter((msg) => msg._id !== deletedMessageId),
      }));
    });

    // handle logs any sending errors.
    socket.on("message_error", (error) => {
      console.error("message error ", error);
    });

    // updates typing status for a conversation.
    socket.on("user_typing", ({ userId, conversationId, isTyping }) => {
      set((state) => {
        const newTypingUsers = new Map(state.typingUsers); //Creates a shallow copy of the existing Map.
        //Shallow copy means:
        //The Map itself is a new Map object, so you can safely add or remove keys without affecting the original Map.
        if (!newTypingUsers.has(conversationId)) {
          newTypingUsers.set(conversationId, new Set());
        }
        const typingSet = newTypingUsers.get(conversationId);
        if (isTyping) {
          typingSet.add(userId);
        } else {
          typingSet.delete(userId);
        }
        return { typingUsers: newTypingUsers };
      });
    });

    //updates online/offline + lastSeen.
    socket.on("user_status", ({ userId, isOnline, lastSeen }) => {
      set((state) => {
        const newOnlineUsers = new Map(state.onlineUsers);
        newOnlineUsers.set(userId, { isOnline, lastSeen });
        return { onlineUsers: newOnlineUsers };
      });
    });

    //emit status check for all users in conversation
    const { conversations } = get();
    if (conversations?.data?.length > 0) {
      conversations.data?.forEach((con) => {
        const otherUser = con.participants.find(
          (p) => p._id !== get().currentUser._id
        );

        if (otherUser?._id) {
          socket.emit("get_user_status", otherUser._id, (status) => {
            set((state) => {
              const newOnlineUsers = new Map(state.onlineUsers);
              newOnlineUsers.set(status.userId, {
                isOnline: status.isOnline,
                lastSeen: status.lastSeen,
              });
              return { onlineUsers: newOnlineUsers };
            });
          });
        }
      });
    }
  },

  setCurrentUser: (user) =>
    set({
      currentUser: user,
    }),

  fetchConversations: async () => {
    //Calls API: GET /chats/conversations.
    // Saves data in conversations.
    // Calls initSocketListeners() once conversations are loaded.

    set({ loading: true, error: null });
    try {
      const { data } = await axiosInstance.get("/chat/conversation");
      set({ conversations: data, loading: false }), get().initSocketListeners();
      return data;
    } catch (error) {
      set({
        error: error?.response?.data?.message || error?.message,
      });
      return null;
    }
  },

  //fetch message for a  conversation
  fetchMassages: async (conversationId) => {
    if (!conversationId) return;
    set({ loading: true, error: null });
    try {
      const { data } = await axiosInstance.get(
        `/chat/conversation/${conversationId}/messages`
      );
      const messageArray = data.data || data || [];
      console.log(data);

      set({
        messages: messageArray,
        currentConversation: conversationId,
        loading: false,
      });

      // make unread message as read
      const { markMessagesAsRead } = get();
      markMessagesAsRead();

      return messageArray;
    } catch (error) {
      set({
        error: error?.response?.data?.message || error?.message,
      });
      return [];
    }
  },

  // send message in real time
  sendMessage: async (formData) => {
    const sender = formData.get("senderId");
    const receiver = formData.get("receiverId");
    const media = formData.get("media");
    const content = formData.get("content");
    const messageStatus = formData.get("messageStatus");
    console.log(sender, receiver, media, content, messageStatus);
    const socket = getSocket();
    const { conversations } = get();

    let conversationId = null;
    if (conversations?.data?.length > 0) {
      const conversation = conversations.data.find(
        (conv) =>
          conv.participants.some((p) => p._id === sender) &&
          conv.participants.some((p) => p._id === receiver)
      );
      if (conversation) {
        conversationId = conversation._id;
        set({ currentConversation: conversationId });
      }
    }

    //temp message before  actual  response
    const tempId = `temp-${Date.now()}`;
    const optimisticMessage = {
      _id: tempId,
      sender: { _id: sender },
      receiver: { _id: receiver },
      conversation: conversationId,
      imageOrVideoUrl:
        media && typeof media !== "string" ? URL.createObjectURL(media) : null,
      content: content,
      contentType: media
        ? media.type.startsWith("image")
          ? "image"
          : "video"
        : "text",
      createdAt: new Date().toISOString(),
      messageStatus,
    };
    set((state) => ({
      messages: [...state.messages, optimisticMessage],
    }));

    try {
      const { data } = await axiosInstance.post(
        "/chat/send-message",
        formData,
        { headers: { "Content-Type": "multipart/form-data" } }
      );
      const messageData = data.data || data;

      // replace optimistic messages with real one
      set((state) => ({
        messages: state.messages.map((msg) =>
          msg._id === tempId ? messageData : msg
        ),
      }));
      socket.emit("send_message", messageData);
      return messageData;
    } catch (error) {
      console.error("Error sending message", error);
      set((state) => ({
        messages: state.messages.map((msg) =>
          msg._id === tempId ? { ...msg, messageStatus: "failed" } : msg
        ),
        error: error?.response?.data?.message || error?.message,
      }));
      throw error;
    }
  },

  //Handles an incoming message
  receiveMessage: (message) => {
    //     Checks if a message exists.
    // ✅ Avoids duplicates in the messages array.
    if (!message) return;
    const { currentConversation, currentUser, messages } = get();
    const messageExits = messages.some((msg) => msg._id === message._id);
    if (messageExits) return;

    //Add message to current conversation
    if (message.conversation === currentConversation) {
      set((state) => ({
        messages: [...state.messages, message],
      }));

      // automatically mark  as read
      if (message.receiver?._id === currentUser?._id) {
        get().markMessagesAsRead();
      }
    }

    //update conversation preview  and unread count
    set((state) => {
      const updateConversations = state.conversations?.data?.map((conv) => {
        if (conv._id === message.conversation) {
          return {
            ...conv,
            lastMessage: message,
            unreadCount:
              message?.receiver?._id === currentUser?._id
                ? (conv.unreadCount || 0) + 1
                : conv.unreadCount || 0,
          };
        }
        return conv;
      });

      
      return {
        conversations: {
          ...state.conversations,
          data: updateConversations,
        },
      };
    });
  },

  //mark as read
 markMessagesAsRead: async () => {
  const { messages, currentUser } = get(); // removed unused conversations
  if (!messages.length || !currentUser) return;

  const unreadIds = messages
    .filter(msg => msg.messageStatus !== "read" && msg.receiver?._id === currentUser._id)
    .map(msg => msg._id)
    .filter(Boolean);

  if (!unreadIds.length) return;

  try {
    await axiosInstance.put("/chat/messages/read", { messageIds: unreadIds });

    set((state) => {
      const updatedMessages = state.messages.map(msg =>
        unreadIds.includes(msg._id) ? { ...msg, messageStatus: "read" } : msg
      );

      const updatedConversations = state.conversations?.data?.map(conv => {
        if (!conv) return conv;
        const hasUnread = unreadIds.some(id =>
          updatedMessages.find(m => m._id === id && m.conversation === conv._id)
        );
        if (!hasUnread) return conv;
        return { ...conv, unreadCount: 0 };
      });

      return {
        messages: updatedMessages,
        conversations: { ...state.conversations, data: updatedConversations },
      };
    });

    const socket = getSocket();
    if (socket) {
      socket.emit("message_read", {
        messageIds: unreadIds,
        readerId: currentUser._id,
      });
    }
  } catch (error) {
    console.log("failed to mark message as read", error);
  }
},


  deletedMessage: async ({ messageId }) => {
    console.log(messageId);
    try {
      const data = await axiosInstance.delete(`/chat/message/${messageId}`);
      set((state) => ({
        messages: state.messages?.filter((msg) => msg?._id !== messageId),
      }));
      return true;
    } catch (error) {
      console.log("error deleting message ", error);
      set({
        error: error.response?.data?.message || error.message,
      });
      return false;
    }
  },

  // add/change reactions
  addReaction: async (messageId, emoji) => {
    const socket = getSocket();
    const { currentUser } = get();

    if (socket && currentUser) {
      const reactionUserId = currentUser._id; // define variable
      socket.emit("add_reaction", {
        messageId,
        emoji,
        reactionUserId,
      });
      console.log(messageId, emoji, reactionUserId); // ✅ now works
    }
  },

  startTyping: (receiverId) => {
    const { currentConversation } = get();
    const socket = getSocket();
    if (socket && currentConversation && receiverId) {
      socket.emit("typing_start", {
        conversationId: currentConversation,
        receiverId,
      });
    }
  },

  stopTyping: (receiverId) => {
    const { currentConversation } = get();
    const socket = getSocket();
    if (socket && currentConversation && receiverId) {
      socket.emit("typing_stop", {
        conversationId: currentConversation,
        receiverId,
      });
    }
  },

  isUserTyping: (userId) => {
    const { typingUsers, currentConversation } = get();
    if (
      !currentConversation ||
      !typingUsers.has(currentConversation) ||
      !userId
    ) {
      return false;
    }
    return typingUsers.get(currentConversation).has(userId);
  },

  isUserOnline: (userId) => {
    if (!userId) return null;
    const { onlineUsers } = get();
    return onlineUsers.get(userId)?.isOnline || false;
  },

  getUserLastSeen: (userId) => {
    if (!userId) return null;
    const { onlineUsers } = get();
    return onlineUsers.get(userId)?.lastSeen || null;
  },

   setCurrentConversation: (conversationId) =>
    set({ currentConversation: conversationId }),

  cleanup: () => {
    set({
      conversations: [],
      currentConversation: null,
      messages: [],
      onlineUsers: new Map(),
      typingUsers: new Map(),
    });
  },
}));
