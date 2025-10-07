import React, { useActionState, useEffect, useRef, useState } from "react";
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
import MessageBubble from "./MessageBubble";
import EmojiPicker from "emoji-picker-react"; 

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
  const fileInputRef = useRef(null);
  const { theme } = useThemeStore();
  const { user } = useUserStore();
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
  const currentConversationId = conversation?._id
  


  //get online status and lastseen
  const online = isUserOnline(selectedContact?._id);
  const lastSeen = getUserLastSeen(selectedContact?._id);
  const isTypeing = isUserTyping(selectedContact?._id);

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
  ;

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
      setShowFileMenu(file);
      if (file.type.startsWith("image/")) {
        setFilePreview(URL.createObjectURL(file));
      }
    }
  };

  const handleSendMessage = async () => {
    if (!selectedContact) return;
    setFilePreview(null);
    try {
      const formData = new FormData();
      formData.append("sender", user?._id);
      formData.append("receiver", selectedContact?._id);

      const status = online ? "delivered" : "send";
      formData.append("messageStatus", status);
      if (message.trim()) {
        formData.append("content", message.trim());
      }
      //if there is file  include that too

      if (selectedFile) {
        formData.append("media", selectedFile, selectedFile.name); //selectedFile.name → Optional third parameter, sets the filename explicitly (if not provided, browser defaults to the file’s name).
      }
      if (!message.trim() && !selectedFile) return;
      await sendMessage(formData);
      // clear state
      setMessage("");
      setFilePreview(null);
      setSelectedFile(null);
      setShowFileMenu(null);
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
      <>
        <div className="flex justify-center my-4">
          <span
            className={`px-4 py-2 rounded-full text-sm ${theme === "dark"
              ? "bg-gray-700 text-gray-300"
              : "bg-gray-200 text-gray-600"
              }`}
          >
            {dateString}
          </span>
        </div>
      </>
    );
  };

  // grouping  of messages
  const groupedMessages = Array.isArray(messages)
    ? messages.reduce((acc, message) => {
      if (!message.createdAt) return acc;
      const date = new Date(message.createdAt);
      if (isValidate(date)) {
        const dateString = format(date, "yyyy-MM-dd"); // ✅ Correct: MM = Month
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
    addReaction(messageId, emoji);
  };

  if (!selectedContact) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center mx-auto h-screen text-center">
        <div className="max-w-md">
          <img src={whatsappImage} alt="chat-app" className="w-full h-auto" />
          <h2
            className={`text-3xl font-semibold mb-4 ${theme === "dark" ? "text-white " : "text-black"
              } `}
          >
            Select a conversation to start chatting
          </h2>
          <p
            className={` ${theme === "dark" ? "text-gray-400 " : "text-gray-600"
              } mb-6 `}
          >
            Choose a contact for list on begin messaging
          </p>
          <p
            className={` ${theme === "dark" ? "text-gray-400 " : "text-gray-600"
              } text-sm mt-8 flex items-center justify-center gap-2 `}
          >
            <FaLock className="h-4 w-4 " />
            Your personal messages are end-to-end encrypted
          </p>
        </div>
      </div>
    );
  }
  return (
    <div className="flex-1 h-screen w-full flex flex-col">
      <div
        className={`p-4 ${theme === "dark"
          ? "bg-[#303430] text-white "
          : " bg-[rgb(239,242,245)] text-gray-600 "
          } flex `}
      >
        <button
          className="mr-2 focus:outline-none "
          onClick={() => setSelectedContact(null)}
        >
          <FaArrowLeft className=" h-6 w-6 " />
        </button>
        <img
          src={selectedContact?.profilePicture}
          alt={selectedContact?.username}
          className="w-10 h-10  rounded-full"
        />
        <div className="ml-3 flex-grow  ">
          <h2 className="font-semibold text-start">
            {selectedContact?.username}
          </h2>
          {isTypeing ? (
            <>
              <div>Typing...</div>
            </>
          ) : (
            <p
              className={`text-sm ${theme === "dark" ? "text-gray-400" : "text-gray-500"
                }`}
            >
              {online
                ? "Online"
                : lastSeen
                  ? `Last seen ${format(new Date(lastSeen), "HH:mm")}`
                  : "Offline"}
            </p>
          )}
        </div>
        <div className="flex items-center space-x-4 ">
          <button className="focus:outline-none">
            <FaVideo className="h-5  w-5 " />
          </button>
          <button>
            <FaEllipsisV className="h-5 w-5" />
          </button>
        </div>
      </div>
      <div
        className={`flex-1 p-4 overflow-y-auto ${theme === "dark" ? "bg-[#191a1a]" : "bg-[rgb(241,236,229)]"
          }`}
      >
        {/* explaination
         const groupedMessages = {
          "2025-10-01": [{id: 1, text: "Hi" }, {id: 2, text: "Hello" }],
        "2025-10-02": [{id: 3, text: "How are you?" }]
          };

        console.log(Object.entries(groupedMessages)); */}

        {/* output
        [
        ["2025-10-01", [{id: 1, text: "Hi" }, {id: 2, text: "Hello" }]],
        ["2025-10-02", [{id: 3, text: "How are you?" }]]
        ]  */}

        {/* Object.entries() converts the object into an array of [key, value] pairs, */}

        {Object.entries(groupedMessages).map(([date, msgs]) => (
          <React.Fragment key={date}>
            
            {/* Render date separator */}
            {renderDateSeparator(new Date(date))}

            {/* Render messages for the selected conversation */}

             
            {msgs
              .filter(
                (msg) => msg.conversation === currentConversationId
              )
              .map((msg) => (
                <MessageBubble
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
      {filePreview && (
        <div className="relative  p-2 ">
          <img
            src={filePreview}
            alt="file-preview"
            className="w-80 object-cover rounded  shadow-lg  mx-auto "
          />
          <button
            onClick={() => {
              setSelectedFile(null);
              setFilePreview(null);
            }}
            className="absolute top-1 right-1 bg-red-500 hover:bg-red-600 text-white  rounded-full p-1"
          >
            <FaTimes className="h-4 w-4 " />
          </button>
        </div>
      )}
      <div
        className={`p-4 flex items-center space-x-3 ${theme === "dark" ? "bg-[#303430]" : "bg-white"
          } relative`}
      >
        {/* Emoji button */}
        <button
          className="focus:outline-none"
          onClick={() => setshowEmojiPicker(!showEmojiPicker)}
        >
          <FaSmile
            className={`h-6 w-6 ${theme === "dark" ? "text-gray-400" : "text-gray-500"
              }`}
          />
        </button>

        {/* Emoji Picker */}
        {showEmojiPicker && (
          <div
            ref={emojiPickerRef}
            className="absolute left-0 bottom-16 z-50"
          >
            <EmojiPicker
              onEmojiClick={(emojiObject) => {
                setMessage((prev) => prev + emojiObject.emoji);
                setshowEmojiPicker(false);
              }}
              theme={theme}
            />
          </div>
        )}

        {/* File button + dropdown */}
        <div className="relative">
          <button
            className="focus:outline-none"
            onClick={() => setShowFileMenu(!showFileMenu)}
          >
            <FaPaperclip
              className={`h-6 w-6 ${theme === "dark" ? "text-gray-400" : "text-gray-500"
                }`}
            />
          </button>

          {showFileMenu && (
            <div
              className={`absolute bottom-12 left-0 ${theme === "dark" ? "bg-gray-700" : "bg-gray-300"
                } rounded-lg shadow-lg flex flex-col`}
            >
              <button
                className={`px-4 py-2 w-full text-left flex items-center transition-colors ${theme === "dark"
                  ? "bg-gray-700 hover:bg-gray-600 text-white"
                  : "bg-gray-100 hover:bg-gray-200 text-black"
                  }`}
              >
                <FaImage className="mr-2" /> Image / Video
              </button>

              <button
                className={`px-4 py-2 w-full text-left flex items-center transition-colors ${theme === "dark"
                  ? "bg-gray-700 hover:bg-gray-600 text-white"
                  : "bg-gray-100 hover:bg-gray-200 text-black"
                  }`}
              >
                <FaFile className="mr-2" /> Documents
              </button>

            </div>
          )}
        </div>

        {/* Input */}
        <input
          type="text"
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          onKeyPress={(e) => {
            if (e.key === "Enter") {
              handleSendMessage();
            }
          }}
          placeholder="Type a message"
          className={`flex-grow px-4 py-2 border rounded-full focus:outline-none focus:ring-2 focus:ring-green-500 ${theme === "dark"
            ? "bg-gray-700 text-white border-gray-600"
            : "bg-white text-black border-gray-300"
            }`}
        />

        {/* Send button */}
        <button
          onClick={handleSendMessage}
          className="p-3 rounded-full bg-green-500 hover:bg-green-600 focus:outline-none"
        >
          <FaPaperPlane className="h-5 w-5 text-white" />
        </button>
      </div>

    </div>
  );
}

export default ChatWindow;
