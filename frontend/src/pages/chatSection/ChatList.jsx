import { useState, useEffect, useMemo } from "react";
import useLayoutStore from "../../store/layoutStore";
import useThemeStore from "../../store/themeStore";
import useUserStore from "../../store/useUserStore";
import { FaPlus, FaSearch, FaTimes } from "react-icons/fa";
import { motion } from "framer-motion";
import formatTimestamp from "../../utils/FormatTime";
import { useChatStore } from "../../store/chatStore";
import useScreenSize from "../../hooks/useScreenSize";

function ChatList({ contacts }) {
  const setSelectedContact = useLayoutStore(
    (state) => state.setSelectedContact
  );
  const selectedContact = useLayoutStore((state) => state.selectedContact);
  const { theme } = useThemeStore();
  const { user } = useUserStore();
  const { isMobile } = useScreenSize();

  const [searchTerm, setSearchTerm] = useState("");

  const chatStore = useChatStore();
  const { conversations } = chatStore;

  // Merge contacts with conversation data
  const contactsWithConversations = useMemo(() => {
    return (contacts || []).map((contact) => {
      const conv = (conversations?.data || []).find((c) =>
        c.participants.some((p) => p._id === contact._id)
      );

      return {
        ...contact,
        conversation: conv,
        unreadCount: conv?.unreadCount || 0,
      };
    });
  }, [contacts, conversations]);

  // Filter merged contacts by search term
  const filterContacts = contactsWithConversations.filter((contact) =>
    contact.username?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const clearSearch = () => {
    setSearchTerm("");
  };

  return (
    <div
      className={`
    w-full h-[100dvh] flex flex-col overflow-hidden
    ${isMobile ? "" : "border-r"}
    ${
      theme === "dark"
        ? "bg-[rgb(17,23,33)] border-gray-600"
        : "bg-white border-gray-200"
    }
  `}
    >
      {/* Header */}
      <div
        className={`p-3 sm:p-4 md:p-5 flex justify-between items-center flex-shrink-0 ${
          theme === "dark" ? "text-white" : "text-gray-800"
        }`}
      >
        <h2 className="text-lg sm:text-xl md:text-2xl font-semibold truncate">
          Chats
        </h2>
        <button
          className="p-2 sm:p-2.5 bg-green-500 text-white rounded-full hover:bg-green-600 active:bg-green-700 transition-colors cursor-pointer"
          aria-label="Start new chat"
        >
          <FaPlus className="h-4 w-4 sm:h-5 sm:w-5" />
        </button>
      </div>

      {/* Search Box */}
      <div className="px-2 sm:px-3 md:px-4 pb-2 sm:pb-3 flex-shrink-0">
        <div className="relative">
          <FaSearch
            className={`absolute left-3 top-1/2 -translate-y-1/2 ${
              theme === "dark" ? "text-gray-400" : "text-gray-500"
            }`}
          />
          <input
            type="text"
            placeholder={isMobile ? "Search..." : "Search or start new chat"}
            className={`w-full pl-9 pr-10 py-2 text-sm border rounded-lg focus:ring-2 focus:ring-green-500 ${
              theme === "dark"
                ? "bg-gray-800 text-white border-gray-700 placeholder-gray-500"
                : "bg-gray-100 text-black border-gray-200 placeholder-gray-400"
            }`}
            style={{ fontSize: "16px" }}
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
          {searchTerm && (
            <button
              onClick={clearSearch}
              className={`absolute right-3 top-1/2 -translate-y-1/2 ${
                theme === "dark" ? "text-gray-400" : "text-gray-600"
              }`}
            >
              <FaTimes />
            </button>
          )}
        </div>
      </div>

      {/* Contacts List */}
      <div className="flex-1 overflow-y-auto overflow-x-hidden">
        {filterContacts.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 text-gray-500">
            <FaSearch className="h-10 w-10 opacity-50" />
            <p>No contacts found</p>
          </div>
        ) : (
          filterContacts.map((contact, index) => (
            <motion.div
              key={contact?._id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.04, duration: 0.2 }}
              onClick={() => {
                setSelectedContact(contact);

                if (contact?.conversation?._id) {
                  chatStore.setCurrentConversation(contact.conversation._id);
                  chatStore.markMessagesAsRead(contact.conversation._id);
                }
              }}
              className={`p-3 flex items-center cursor-pointer active:scale-[0.97] transition ${
                selectedContact?._id === contact?._id
                  ? "bg-green-50 dark:bg-gray-200 border-l-4 border-green-500"
                  : theme === "dark"
                  ? "hover:bg-gray-800"
                  : "hover:bg-gray-100"
              }`}
            >
              <img
                src={contact?.profilePicture}
                alt={contact?.username}
                className="w-12 h-12 rounded-full object-cover"
              />

              <div className="ml-3 flex-1 min-w-0">
                <div className="flex justify-between items-center">
                  <h2
                    className={`font-semibold truncate ${
                      theme === "dark" ? "text-white" : "text-black"
                    }`}
                  >
                    {contact.username}
                  </h2>

                  {contact?.conversation?.lastMessage && (
                    <span
                      className={`text-xs ${
                        theme === "dark" ? "text-gray-400" : "text-gray-500"
                      }`}
                    >
                      {formatTimestamp(
                        contact.conversation.lastMessage.createdAt
                      )}
                    </span>
                  )}
                </div>

                <div className="flex justify-between items-center">
                  <p
                    className={`text-xs truncate ${
                      theme === "dark" ? "text-gray-400" : "text-gray-600"
                    }`}
                  >
                    {contact?.conversation?.lastMessage?.content ||
                      "No messages yet"}
                  </p>

                  {contact.unreadCount > 0 && (
                    <span className="text-xs font-bold bg-green-500 text-white px-2 py-1 rounded-full">
                      {contact.unreadCount}
                    </span>
                  )}
                </div>
              </div>
            </motion.div>
          ))
        )}
      </div>
    </div>
  );
}

export default ChatList;
