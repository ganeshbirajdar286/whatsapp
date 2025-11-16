import React, { useEffect, useRef, useState } from "react";
import useThemeStore from "../../store/themeStore";
import useUserStore from "../../store/useUserStore";
import { useChatStore } from "../../store/chatStore";
import {
  FaArrowLeft,
  FaVideo,
  FaLock,
  FaEllipsisV,
  FaTimes,
  FaSmile,
  FaPaperclip,
  FaImage,
  FaFile,
  FaPaperPlane,
} from "react-icons/fa";
import whatsappImage from "../../assets/whatsappImage.png";
import { isToday, isYesterday, format } from "date-fns";
import MessageBubble from "./MessageBubble.jsx";
import EmojiPicker from "emoji-picker-react";
import VideoCallManger from "../videoCall/VideoCallManger.jsx";
import { getSocket } from "../services/chat.services";
import useVedioCallStore from "../../store/videoCallStore";

const isValidate = (date) => {
  return date instanceof Date && !isNaN(date);
};

function ChatWindow({ selectedContact, setSelectedContact, isMobile }) {
  const [message, setMessage] = useState("");
  const [showEmojiPicker, setshowEmojiPicker] = useState(false);
  const [showFileMenu, setShowFileMenu] = useState(false);
  const [filePreview, setFilePreview] = useState(null);
  const [selectedFile, setSelectedFile] = useState(null);
  const typingTimeoutRef = useRef(null);
  const messageEndRef = useRef(null);
  const emojiPickerRef = useRef(null);
  const fileMenuRef = useRef(null);
  const fileInputRef = useRef(null);
  const { theme } = useThemeStore();
  const { user } = useUserStore();
  const socket = getSocket();
  const {
    messages,
    loading,
    sendMessage,
    receiveMessage,
    fetchMassages,
    fetchConversations,
    conversations,
    isUserTyping,
    startTyping,
    stopTyping,
    getUserLastSeen,
    isUserOnline,
    cleanup,
    deletedMessage,
    addReaction,
  } = useChatStore();

  const conversation = conversations?.data?.find((conv) =>
    conv.participants.some((p) => p._id === selectedContact?._id)
  );
  const currentConversationId = conversation?._id;

  // Get online status and lastseen
  const online = isUserOnline(selectedContact?._id);
  const lastSeen = getUserLastSeen(selectedContact?._id);
  const isTypeing = isUserTyping(selectedContact?._id);

  // Click outside handlers
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (
        emojiPickerRef.current &&
        !emojiPickerRef.current.contains(event.target) &&
        !event.target.closest('[data-emoji-button]')
      ) {
        setshowEmojiPicker(false);
      }
      if (
        fileMenuRef.current &&
        !fileMenuRef.current.contains(event.target) &&
        !event.target.closest('[data-file-button]')
      ) {
        setShowFileMenu(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  useEffect(() => {
    if (selectedContact?._id && conversations?.data?.length > 0) {
      const conversation = conversations?.data?.find((conv) =>
        conv.participants.some(
          (participant) => participant._id === selectedContact?._id
        )
      );
      if (conversation?._id) {
        fetchMassages(conversation?._id);
      }
    }
  }, [selectedContact, conversations]);

  useEffect(() => {
    fetchConversations();
  }, []);

  const scrolltoBottom = () => {
    messageEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrolltoBottom();
  }, [messages]);

  useEffect(() => {
    if (message && selectedContact) {
      startTyping(selectedContact?._id);
      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current);
      }
      typingTimeoutRef.current = setTimeout(() => {
        stopTyping(selectedContact?._id);
      }, 3000);
    }
    return () => {
      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current);
      }
    };
  }, [message, selectedContact, startTyping, stopTyping]);

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setSelectedFile(file);
      setShowFileMenu(false);
      if (file.type.startsWith("image/") || file.type.startsWith("video/")) {
        setFilePreview(URL.createObjectURL(file));
      }
    }
  };

  const handleVideoCall = () => {
    if (selectedContact && online) {
      const { initiateCall } = useVedioCallStore.getState();
      const avatar = selectedContact?.profilePicture;
      initiateCall(
        selectedContact?._id,
        selectedContact?.username,
        avatar,
        "video"
      );
    } else {
      alert("User is offline. Cannot initiate call");
    }
  };

  const handleSendMessage = async () => {
    if (!selectedContact) return;
    if (!message.trim() && !selectedFile) return;

    try {
      const formData = new FormData();
      formData.append("sender", user?._id);
      formData.append("receiver", selectedContact?._id);

      const status = online ? "delivered" : "send";
      formData.append("messageStatus", status);
      
      if (message.trim()) {
        formData.append("content", message.trim());
      }

      if (selectedFile) {
        formData.append("media", selectedFile, selectedFile.name);
      }

      await sendMessage(formData);
      
      // Clear state
      setMessage("");
      setFilePreview(null);
      setSelectedFile(null);
      setShowFileMenu(false);
    } catch (error) {
      console.error("Failed to send message ", error);
    }
  };

  const renderDateSeparator = (date) => {
    if (!isValidate(date)) return null;
    let dateString;
    if (isToday(date)) {
      dateString = "Today";
    } else if (isYesterday(date)) {
      dateString = "Yesterday";
    } else {
      dateString = format(date, "EEEE MMM d");
    }

    return (
      <div className="flex justify-center my-3 sm:my-4">
        <span
          className={`px-2.5 py-1 sm:px-3 sm:py-1.5 rounded-full text-xs sm:text-sm font-medium ${
            theme === "dark"
              ? "bg-gray-700 text-gray-300"
              : "bg-gray-200 text-gray-600"
          }`}
        >
          {dateString}
        </span>
      </div>
    );
  };

  // Grouping of messages
  const groupedMessages = Array.isArray(messages)
    ? messages.reduce((acc, message) => {
        if (!message.createdAt) return acc;
        const date = new Date(message.createdAt);
        if (isValidate(date)) {
          const dateString = format(date, "yyyy-MM-dd");
          if (!acc[dateString]) {
            acc[dateString] = [];
          }
          acc[dateString].push(message);
        } else {
          console.error("invalid date for message ", message);
        }
        return acc;
      }, {})
    : {};

  const handleReaction = (messageId, emoji) => {
    if (!messageId || !emoji) {
      console.error("Invalid reaction parameters", { messageId, emoji });
      return;
    }
    addReaction(messageId, emoji);
  };

  if (!selectedContact) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center h-screen text-center px-4 sm:px-6 md:px-8">
        <div className="max-w-xs sm:max-w-md md:max-w-lg w-full">
          <img 
            src={whatsappImage} 
            alt="chat-app" 
            className="w-full h-auto max-w-[200px] sm:max-w-xs mx-auto mb-4 sm:mb-6" 
          />
          <h2
            className={`text-xl sm:text-2xl md:text-3xl lg:text-4xl font-semibold mb-3 sm:mb-4 ${
              theme === "dark" ? "text-white" : "text-black"
            }`}
          >
            Select a conversation to start chatting
          </h2>
          <p
            className={`text-sm sm:text-base md:text-lg ${
              theme === "dark" ? "text-gray-400" : "text-gray-600"
            } mb-4 sm:mb-6`}
          >
            Choose a contact from list to begin messaging
          </p>
          <p
            className={`${
              theme === "dark" ? "text-gray-400" : "text-gray-600"
            } text-xs sm:text-sm md:text-base mt-6 sm:mt-8 flex items-center justify-center gap-2`}
          >
            <FaLock className="h-3 w-3 sm:h-4 sm:w-4 flex-shrink-0" />
            <span>Your personal messages are end-to-end encrypted</span>
          </p>
        </div>
      </div>
    );
  }

  return (
    <>
      <div className="flex-1 h-screen w-full flex flex-col overflow-hidden">
        {/* Header - Responsive padding and sizing */}
        <div
          className={`p-2.5 sm:p-3 md:p-4 ${
            theme === "dark"
              ? "bg-[#303430] text-white"
              : "bg-[rgb(239,242,245)] text-gray-600"
          } flex items-center gap-2 sm:gap-3 flex-shrink-0`}
        >
          {isMobile && (
            <button
              className="focus:outline-none flex-shrink-0 p-1"
              onClick={() => setSelectedContact(null)}
              aria-label="Back to contacts"
            >
              <FaArrowLeft className="h-4 w-4 sm:h-5 sm:w-5" />
            </button>
          )}
          <img
            src={selectedContact?.profilePicture}
            alt={selectedContact?.username}
            className="w-8 h-8 sm:w-9 sm:h-9 md:w-10 md:h-10 rounded-full object-cover flex-shrink-0"
          />
          <div className="flex-grow min-w-0">
            <h2 className="font-semibold text-sm sm:text-base md:text-lg truncate">
              {selectedContact?.username}
            </h2>
            {isTypeing ? (
              <div className="text-xs sm:text-sm text-green-500 font-medium">
                Typing...
              </div>
            ) : (
              <p
                className={`text-xs sm:text-sm ${
                  theme === "dark" ? "text-gray-400" : "text-gray-500"
                } truncate`}
              >
                {online
                  ? "Online"
                  : lastSeen
                  ? `Last seen ${format(new Date(lastSeen), "HH:mm")}`
                  : "Offline"}
              </p>
            )}
          </div>
          <div className="flex items-center gap-2 sm:gap-3 md:gap-4 flex-shrink-0">
            <button
              className="focus:outline-none p-1"
              onClick={handleVideoCall}
              title={online ? "Start video call" : "User is offline"}
              aria-label={online ? "Start video call" : "User is offline"}
            >
              <FaVideo
                className={`h-4 w-4 sm:h-5 sm:w-5 md:h-6 md:w-6 ${
                  online
                    ? "text-green-500 hover:text-green-600"
                    : "text-gray-400 cursor-not-allowed"
                }`}
              />
            </button>
            <button className="focus:outline-none p-1" aria-label="More options">
              <FaEllipsisV className="h-4 w-4 sm:h-5 sm:w-5" />
            </button>
          </div>
        </div>

        {/* Messages Area - Better overflow handling */}
        <div
          className={`flex-1 p-2 sm:p-3 md:p-4 overflow-y-auto overflow-x-hidden ${
            theme === "dark" ? "bg-[#191a1a]" : "bg-[rgb(241,236,229)]"
          }`}
          style={{ 
            WebkitOverflowScrolling: 'touch',
            scrollbarWidth: 'thin'
          }}
        >
          {Object.entries(groupedMessages).map(([date, msgs]) => (
            <React.Fragment key={date}>
              {renderDateSeparator(new Date(date))}
              {msgs
                .filter((msg) => msg.conversation === currentConversationId)
                .map((msg) => (
                  <MessageBubble
                    selectedContact={selectedContact}
                    key={msg._id || msg.tempId}
                    message={msg}
                    theme={theme}
                    currentUser={user}
                    OnReact={handleReaction}
                    deletedMessage={deletedMessage}
                  />
                ))}
            </React.Fragment>
          ))}
          <div ref={messageEndRef}></div>
        </div>

        {/* File Preview - Responsive sizing */}
        {filePreview && (
          <div className={`relative p-2 sm:p-3 ${
            theme === "dark" ? "bg-[#303430]" : "bg-white"
          } bg-opacity-95`}>
            <div className="max-w-full mx-auto">
              {selectedFile?.type.startsWith("video/") ? (
                <video
                  src={filePreview}
                  controls
                  className="w-full max-w-[280px] xs:max-w-xs sm:max-w-sm md:max-w-md lg:max-w-lg object-cover rounded shadow-lg mx-auto"
                />
              ) : (
                <img
                  src={filePreview}
                  alt="file-preview"
                  className="w-full max-w-[280px] xs:max-w-xs sm:max-w-sm md:max-w-md lg:max-w-lg object-cover rounded shadow-lg mx-auto"
                />
              )}
            </div>
            <button
              onClick={() => {
                setSelectedFile(null);
                setFilePreview(null);
              }}
              className="absolute top-3 sm:top-4 right-3 sm:right-4 bg-red-500 hover:bg-red-600 text-white rounded-full p-1.5 sm:p-2 shadow-lg transition-colors"
              aria-label="Remove preview"
            >
              <FaTimes className="h-3 w-3 sm:h-4 sm:w-4" />
            </button>
          </div>
        )}

        {/* Input Area - Better mobile spacing */}
        <div
          className={`p-2 sm:p-3 md:p-4 flex items-end gap-1.5 sm:gap-2 md:gap-3 ${
            theme === "dark" ? "bg-[#303430]" : "bg-white"
          } relative flex-shrink-0 safe-bottom`}
        >
          {/* Emoji button */}
          <button
            data-emoji-button
            className="focus:outline-none flex-shrink-0 p-1.5 sm:p-2"
            onClick={() => setshowEmojiPicker(!showEmojiPicker)}
            aria-label="Add emoji"
          >
            <FaSmile
              className={`h-5 w-5 sm:h-6 sm:w-6 ${
                theme === "dark" ? "text-gray-400 hover:text-gray-300" : "text-gray-500 hover:text-gray-600"
              } transition-colors`}
            />
          </button>

          {/* Emoji Picker - Responsive positioning */}
          {showEmojiPicker && (
            <div
              ref={emojiPickerRef}
              className="absolute left-2 sm:left-4 bottom-[52px] sm:bottom-[60px] md:bottom-[68px] z-50 shadow-2xl"
            >
              <EmojiPicker
                onEmojiClick={(emojiObject) => {
                  setMessage((prev) => prev + emojiObject.emoji);
                  setshowEmojiPicker(false);
                }}
                theme={theme}
                width={Math.min(window.innerWidth - 32, 320)}
                height={Math.min(window.innerHeight * 0.5, 400)}
              />
            </div>
          )}

          {/* File button + dropdown */}
          <div className="relative flex-shrink-0">
            <button
              data-file-button
              className="focus:outline-none p-1.5 sm:p-2"
              onClick={() => setShowFileMenu(!showFileMenu)}
              aria-label="Attach file"
            >
              <FaPaperclip
                className={`h-5 w-5 sm:h-6 sm:w-6 ${
                  theme === "dark" ? "text-gray-400 hover:text-gray-300" : "text-gray-500 hover:text-gray-600"
                } transition-colors`}
              />
            </button>

            {showFileMenu && (
              <div
                ref={fileMenuRef}
                className={`absolute bottom-[42px] sm:bottom-[50px] left-0 ${
                  theme === "dark" ? "bg-gray-700" : "bg-white"
                } rounded-lg shadow-xl border ${
                  theme === "dark" ? "border-gray-600" : "border-gray-200"
                } overflow-hidden min-w-[160px] sm:min-w-[180px] z-40`}
              >
                <label
                  className={`px-3 py-2 sm:px-4 sm:py-2.5 w-full text-left text-xs sm:text-sm flex items-center cursor-pointer transition-colors ${
                    theme === "dark"
                      ? "hover:bg-gray-600 text-white"
                      : "hover:bg-gray-100 text-black"
                  }`}
                >
                  <FaImage className="mr-2 h-3.5 w-3.5 sm:h-4 sm:w-4 flex-shrink-0" /> 
                  <span>Image / Video</span>
                  <input
                    type="file"
                    accept="image/*,video/*"
                    className="hidden"
                    onChange={handleFileChange}
                  />
                </label>

                <label
                  className={`px-3 py-2 sm:px-4 sm:py-2.5 w-full text-left text-xs sm:text-sm flex items-center cursor-pointer transition-colors ${
                    theme === "dark"
                      ? "hover:bg-gray-600 text-white"
                      : "hover:bg-gray-100 text-black"
                  }`}
                >
                  <FaFile className="mr-2 h-3.5 w-3.5 sm:h-4 sm:w-4 flex-shrink-0" /> 
                  <span>Documents</span>
                  <input
                    type="file"
                    accept=".pdf,.doc,.docx,.txt"
                    className="hidden"
                    onChange={handleFileChange}
                  />
                </label>
              </div>
            )}
          </div>

          {/* Input - Better responsive behavior */}
          <input
            type="text"
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            onKeyPress={(e) => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                handleSendMessage();
              }
            }}
            placeholder="Type a message"
            className={`flex-grow px-3 py-2 sm:px-4 sm:py-2.5 text-sm sm:text-base border rounded-full focus:outline-none focus:ring-2 focus:ring-green-500 transition-all ${
              theme === "dark"
                ? "bg-gray-700 text-white border-gray-600 placeholder-gray-400"
                : "bg-white text-black border-gray-300 placeholder-gray-500"
            }`}
            style={{ minWidth: '100px' }}
          />

          {/* Send button - Consistent sizing */}
          <button
            onClick={handleSendMessage}
            disabled={!message.trim() && !selectedFile}
            className={`p-2 sm:p-2.5 md:p-3 rounded-full focus:outline-none transition-all flex-shrink-0 ${
              !message.trim() && !selectedFile
                ? "bg-gray-400 cursor-not-allowed opacity-60"
                : "bg-green-500 hover:bg-green-600 active:scale-95"
            }`}
            aria-label="Send message"
          >
            <FaPaperPlane className="h-4 w-4 sm:h-5 sm:w-5 text-white" />
          </button>
        </div>
      </div>
      <VideoCallManger socket={socket} />
    </>
  );
}

export default ChatWindow;