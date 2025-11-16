import { useState, useEffect, useMemo } from "react";
import useLayoutStore from "../../store/layoutStore";
import useThemeStore from "../../store/themeStore";
import useUserStore from "../../store/useUserStore";
import { FaPlus, FaSearch, FaTimes } from "react-icons/fa";
import { motion } from "framer-motion";
import formatTimestamp from "../../utils/FormatTime";
import { useChatStore } from "../../store/chatStore";

function ChatList({ contacts }) {
  const setSelectedContact = useLayoutStore((state) => state.setSelectedContact);
  const selectedContact = useLayoutStore((state) => state.SelectedContact);
  const { theme } = useThemeStore();
  const { user } = useUserStore();
  const [searchTerm, setSearchTerm] = useState("");
  const [isMobile, setIsMobile] = useState(false);

  const chatStore = useChatStore();
  const { conversations } = chatStore;

  // Detect mobile screen size
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };
    
    checkMobile();
    window.addEventListener('resize', checkMobile);
    
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

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

  useEffect(() => {
    const handleClose = () => {
      console.log("Tab closing... cleaning storage");
      localStorage.removeItem("layout-storage");
    };

    window.addEventListener("beforeunload", handleClose);
    return () => window.removeEventListener("beforeunload", handleClose);
  }, []);

  const clearSearch = () => {
    setSearchTerm("");
  };

  return (
    <div
      className={`w-full border-r h-screen flex flex-col ${
        theme === "dark" 
          ? "bg-[rgb(17,23,33)] border-gray-600" 
          : "bg-white border-gray-200"
      }`}
    >
      {/* Header - Responsive padding */}
      <div
        className={`p-3 sm:p-4 md:p-5 flex justify-between items-center flex-shrink-0 ${
          theme === "dark" ? "text-white" : "text-gray-800"
        }`}
      >
        <h2 className="text-lg sm:text-xl md:text-2xl font-semibold truncate">
          Chats
        </h2>
        <button 
          className="p-2 sm:p-2.5 bg-green-500 text-white rounded-full hover:bg-green-600 active:bg-green-700 transition-colors cursor-pointer flex-shrink-0 min-w-[40px] min-h-[40px] flex items-center justify-center"
          aria-label="Start new chat"
        >
          <FaPlus className="h-4 w-4 sm:h-5 sm:w-5" />
        </button>
      </div>

      {/* Search Box - Responsive padding and sizing */}
      <div className="px-2 sm:px-3 md:px-4 pb-2 sm:pb-3 flex-shrink-0">
        <div className="relative">
          <FaSearch
            className={`absolute left-3 sm:left-3.5 top-1/2 -translate-y-1/2 ${
              theme === "dark" ? "text-gray-400" : "text-gray-500"
            } h-3.5 w-3.5 sm:h-4 sm:w-4`}
          />
          <input
            type="text"
            placeholder={isMobile ? "Search..." : "Search or start new chat"}
            className={`w-full pl-9 sm:pl-10 pr-10 py-2 sm:py-2.5 md:py-3 text-sm sm:text-base border rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 transition-all ${
              theme === "dark"
                ? "bg-gray-800 text-white border-gray-700 placeholder-gray-500"
                : "bg-gray-100 text-black border-gray-200 placeholder-gray-400"
            }`}
            style={{ fontSize: '16px' }} // Prevents zoom on iOS
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            autoComplete="off"
            autoCorrect="off"
          />
          {searchTerm && (
            <button
              onClick={clearSearch}
              className={`absolute right-3 top-1/2 -translate-y-1/2 ${
                theme === "dark" 
                  ? "text-gray-400 hover:text-gray-300" 
                  : "text-gray-500 hover:text-gray-600"
              } transition-colors`}
              aria-label="Clear search"
            >
              <FaTimes className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
            </button>
          )}
        </div>
      </div>

      {/* Contacts List - Improved scrolling */}
      <div 
        className="flex-1 overflow-y-auto overflow-x-hidden"
        style={{ 
          WebkitOverflowScrolling: 'touch',
          scrollbarWidth: 'thin'
        }}
      >
        {filterContacts.length === 0 ? (
          <div className={`flex flex-col items-center justify-center py-8 sm:py-12 px-4 text-center ${
            theme === "dark" ? "text-gray-400" : "text-gray-500"
          }`}>
            <FaSearch className="h-8 w-8 sm:h-10 sm:w-10 mb-3 opacity-50" />
            <p className="text-sm sm:text-base">
              {searchTerm ? "No contacts found" : "No chats yet"}
            </p>
            {searchTerm && (
              <p className="text-xs sm:text-sm mt-2">
                Try searching with a different name
              </p>
            )}
          </div>
        ) : (
          filterContacts.map((contact, index) => (
            <motion.div
              key={contact?._id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.05, duration: 0.2 }}
              onClick={() => {
                if (contact?.conversation?._id) {
                  // Update current conversation in store
                  chatStore.setCurrentConversation(contact.conversation._id);
                  
                  // Mark messages as read in store (unread count updated)
                  chatStore.markMessagesAsRead(contact.conversation._id);
                  setSelectedContact(contact);
                }
              }}
              className={`p-2.5 sm:p-3 md:p-4 flex items-center cursor-pointer transition-colors active:scale-[0.98] ${
                theme === "dark"
                  ? selectedContact?._id === contact?._id
                    ? "bg-gray-700 border-l-4 border-green-500"
                    : "hover:bg-gray-800 border-l-4 border-transparent"
                  : selectedContact?._id === contact?._id
                  ? "bg-gray-200 border-l-4 border-green-500"
                  : "hover:bg-gray-100 border-l-4 border-transparent"
              }`}
            >
              <div className="relative flex-shrink-0">
                <img
                  src={contact?.profilePicture}
                  alt={contact?.username}
                  className="w-10 h-10 sm:w-12 sm:h-12 md:w-14 md:h-14 rounded-full object-cover"
                />
                {/* Online status indicator (if you have that data) */}
                {contact?.isOnline && (
                  <div className="absolute bottom-0 right-0 w-3 h-3 sm:w-3.5 sm:h-3.5 bg-green-500 border-2 border-white dark:border-gray-800 rounded-full"></div>
                )}
              </div>

              <div className="ml-2.5 sm:ml-3 md:ml-4 flex-1 min-w-0">
                {/* Top row: Name and Time */}
                <div className="flex justify-between items-baseline gap-2 mb-0.5 sm:mb-1">
                  <h2
                    className={`font-semibold text-sm sm:text-base md:text-lg truncate ${
                      theme === "dark" ? "text-white" : "text-black"
                    }`}
                  >
                    {contact?.username}
                  </h2>
                  {contact?.conversation?.lastMessage && (
                    <span
                      className={`text-xs sm:text-sm flex-shrink-0 ${
                        theme === "dark" ? "text-gray-400" : "text-gray-500"
                      }`}
                    >
                      {formatTimestamp(contact.conversation.lastMessage.createdAt)}
                    </span>
                  )}
                </div>

                {/* Bottom row: Last message and Unread badge */}
                <div className="flex justify-between items-center gap-2">
                  <p
                    className={`text-xs sm:text-sm truncate ${
                      contact.unreadCount > 0 ? "font-semibold" : ""
                    } ${
                      theme === "dark" ? "text-gray-400" : "text-gray-600"
                    }`}
                  >
                    {contact?.conversation?.lastMessage?.content || "No messages yet"}
                  </p>

                  {contact.unreadCount > 0 && (
                    <span
                      className={`text-xs font-bold min-w-[20px] sm:min-w-[24px] h-5 sm:h-6 px-1.5 sm:px-2 flex justify-center items-center bg-green-500 text-white rounded-full flex-shrink-0`}
                    >
                      {contact.unreadCount > 99 ? "99+" : contact.unreadCount}
                    </span>
                  )}
                </div>
              </div>
            </motion.div>
          ))
        )}
      </div>

      {/* Optional: Add a subtle shadow at the bottom for better depth */}
      <div 
        className={`h-1 ${
          theme === "dark" 
            ? "bg-gradient-to-t from-gray-900 to-transparent" 
            : "bg-gradient-to-t from-gray-200 to-transparent"
        }`}
      />
    </div>
  );
}

export default ChatList;