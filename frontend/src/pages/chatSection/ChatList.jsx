import { useState } from "react";
import useLayoutStore from "../../store/layoutStore";
import useThemeStore from "../../store/themeStore";
import useUserStore from "../../store/useUserStore";
import { FaPlus, FaSearch } from "react-icons/fa";
import { motion } from "framer-motion";
import formatTimestamp from "../../utils/FormatTime";
import { useChatStore } from "../../store/chatStore";

function ChatList() {
  const setSelectedContact = useLayoutStore((state) => state.setSelectedContact);
  const selectedContact = useLayoutStore((state) => state.SelectedContact);
  const { theme } = useThemeStore();
  const { user } = useUserStore();
  const [searchTerm, setSearchTerm] = useState("");

  const chatStore = useChatStore();
  const { conversations, currentConversation } = chatStore;

  // Generate a dynamic contact list from conversations
  const chatContacts = (conversations?.data || []).map((conv) => {
    const otherUser = conv.participants.find(
      (p) => p._id !== chatStore.currentUser?._id
    );
    return {
      ...otherUser,
      conversation: conv,
      unreadCount: conv.unreadCount || 0, // reactive unread count
    };
  });


  // Filter contacts by search term
  const filterContacts = chatContacts.filter((contact) =>
    contact?.username?.toLowerCase().includes(searchTerm.toLowerCase())
  );
  
  return (
    <div
      className={`w-full border-r h-screen ${
        theme === "dark" ? "bg-[rgb(17,23,33)] border-gray-600" : "bg-white border-gray-200"
      }`}
    >
      {/* Header */}
      <div
        className={`p-4 flex justify-between ${
          theme === "dark" ? "text-white" : "text-gray-800"
        }`}
      >
        <h2 className="text-xl font-semibold">Chats</h2>
        <button className="p-2 bg-green-500 text-white rounded-full hover:bg-green-600 transition-colors cursor-pointer">
          <FaPlus />
        </button>
      </div>

      {/* Search Box */}
      <div className="p-2">
        <div className="relative">
          <FaSearch
            className={`absolute left-3 top-3 -translate-y-1/2 ${
              theme === "dark" ? "text-gray-400" : "text-gray-800"
            }`}
          />
          <input
            type="text"
            placeholder="Search or start new chat"
            className={`w-full pl-10 pr-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 ${
              theme === "dark"
                ? "bg-gray-800 text-white border-gray-700 placeholder-gray-500"
                : "bg-gray-100 text-black border-gray-200 placeholder-gray-400"
            }`}
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>

        {/* Contacts List */}
        <div className="overflow-y-auto h-[calc(100vh-120px)]">
          {filterContacts.map((contact) => (
            <motion.div
              key={contact?._id}
              onClick={() => {
                setSelectedContact(contact);

                if (contact?.conversation?._id) {
                  // Update current conversation in store
                  chatStore.setCurrentConversation(contact.conversation._id);

                  // Reset unread count immediately
                  // chatStore.set((state) => {
                  //   const updatedConvs = state.conversations.data.map((conv) => {
                  //     if (conv._id === contact.conversation._id) {
                  //       return { ...conv, unreadCount: 0 };
                  //     }
                  //     return conv;
                  //   });
                  //   return { conversations: { ...state.conversations, data: updatedConvs } };
                  // });

                  // Mark messages as read in backend
                  //chatStore.markMessagesAsRead();
                }
              }}
              className={`p-3 flex items-center cursor-pointer ${
                theme === "dark"
                  ? selectedContact?._id === contact?._id
                    ? "bg-gray-700"
                    : "hover:bg-gray-800"
                  : selectedContact?._id === contact?._id
                  ? "bg-gray-200"
                  : "hover:bg-gray-100"
              }`}
            >
              <img
                src={contact?.profilePicture}
                alt={contact?.username}
                className="w-12 h-12 rounded-full"
              />
              <div className="ml-3 flex-1">
                <div className="flex justify-between items-baseline">
                  <h2
                    className={`font-semibold ${
                      theme === "dark" ? "text-white" : "text-black"
                    }`}
                  >
                    {contact?.username}
                  </h2>
                  {contact?.conversation?.lastMessage && (
                    <span
                      className={`text-xs ${
                        theme === "dark" ? "text-gray-400" : "text-gray-500"
                      }`}
                    >
                      {formatTimestamp(contact.conversation.lastMessage.createdAt)}
                    </span>
                  )}
                </div>

                <div className="flex justify-between items-baseline">
                  <p
                    className={`text-sm ${
                      theme === "dark" ? "text-gray-400" : "text-gray-500"
                    } truncate`}
                  >
                    {contact?.conversation?.lastMessage?.content}
                  </p>

                  {contact.unreadCount > 0  && (
                      <p
                        className={`text-sm font-semibold w-6 h-6 flex justify-center items-center bg-yellow-500 ${
                          theme === "dark" ? "text-gray-800" : "text-gray-900"
                        } rounded-full`}
                      >
                        {contact.unreadCount}
                      </p>
                    )}
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </div>
  );
}

export default ChatList;
