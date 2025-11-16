import React, { useState, useRef, useEffect } from "react";
import { format } from "date-fns";
import { FaCheck, FaCheckDouble, FaSmile, FaPlus, FaRegCopy } from "react-icons/fa";
import { HiDotsVertical } from "react-icons/hi";
import { MdDelete } from "react-icons/md";
import { RxCross2 } from "react-icons/rx";
import EmojiPicker from "emoji-picker-react";

const MessageBubble = ({selectedContact, message, theme, currentUser, OnReact, deletedMessage }) => {
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [showReactionPicker, setShowReactionPicker] = useState(false);
  const [showReactionDetails, setShowReactionDetails] = useState(false);
  const [showOption, setShowOption] = useState(false);
  const [isHoveringBubble, setIsHoveringBubble] = useState(false);
  
  const reactionPickerRef = useRef(null);
  const reactionDetailsRef = useRef(null);
  const optionRef = useRef(null);
  const emojiPickerRef = useRef(null);

  const isOwnMessage = message.sender?._id === currentUser?._id;

  // Common reaction emojis
  const quickReactions = ["👍", "❤️", "😂", "😮", "😢", "🙏"];

  // Close pickers when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (
        reactionPickerRef.current &&
        !reactionPickerRef.current.contains(event.target)
      ) {
        setShowReactionPicker(false);
      }
      if (
        reactionDetailsRef.current &&
        !reactionDetailsRef.current.contains(event.target)
      ) {
        setShowReactionDetails(false);
      }
      if (
        optionRef.current &&
        !optionRef.current.contains(event.target) &&
        !event.target.closest('[data-option-button]')
      ) {
        setShowOption(false);
      }
      if (
        emojiPickerRef.current &&
        !emojiPickerRef.current.contains(event.target)
      ) {
        setShowEmojiPicker(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Process reactions to group by emoji
  const processReactions = () => {
    if (!message.reactions || message.reactions.length === 0) return [];

    const reactionMap = {};
    message.reactions.forEach((reaction) => {
      const emoji = reaction.emoji;
      if (!reactionMap[emoji]) {
        reactionMap[emoji] = {
          emoji,
          count: 0,
          users: [],
        };
      }
      reactionMap[emoji].count++;
      reactionMap[emoji].users.push(reaction.user);
    });

    return Object.values(reactionMap).sort((a, b) => b.count - a.count);
  };

  const handleReactionClick = (emoji) => {
    OnReact(message._id, emoji);
    setShowReactionPicker(false);
    setShowEmojiPicker(false);
  };

  const handleDeleteMessage = () => {
    if (window.confirm("Are you sure you want to delete this message?")) {
      deletedMessage({ messageId: message._id });
    }
    setShowOption(false);
  };

  const handleCopyMessage = () => {
    if (message.content) {
      navigator.clipboard.writeText(message.content)
        .then(() => {
          alert("Message copied to clipboard!");
        })
        .catch(err => {
          console.error("Failed to copy message:", err);
        });
    }
    setShowOption(false);
  };

  const reactions = processReactions();
  const hasReactions = reactions.length > 0;

  return (
    <div
      className={`flex mb-3 sm:mb-4 sm:right-3 ${isOwnMessage ? "justify-end " : "justify-start"} relative`}
    >
      <div className={`max-w-[85%] xs:max-w-[80%] sm:max-w-[75%] md:max-w-[70%] lg:max-w-[65%] xl:max-w-[60%] min-w-[120px] sm:min-w-[150px] ${isOwnMessage ? "order-2" : "order-1"} relative`}>
        {/* Message Bubble Container */}
        <div 
          className="relative inline-block"
          onMouseEnter={() => setIsHoveringBubble(true)}
          onMouseLeave={() => setIsHoveringBubble(false)}
        >
          <div
            className={`rounded-lg px-3 py-2 sm:px-4 sm:py-2.5 shadow-md transition-all ${
              isOwnMessage
                ? theme === "dark"
                  ? "bg-[#005c4b] text-white"
                  : "bg-[#d9fdd3] text-black"
                : theme === "dark"
                ? "bg-[#202c33] text-white"
                : "bg-white text-black"
            } ${hasReactions ? "mb-5 sm:mb-6" : ""}`}
          >
            {/* Message Content */}
            {message.content && (
              <p className="text-sm sm:text-base break-words whitespace-pre-wrap leading-relaxed mr-3">
                {message.content}
              </p>
            )}

            {/* Media Content */}
            {message.media && (
              <div className="mt-2">
                {message.mediaType?.startsWith("image/") ? (
                  <img
                    src={message.media}
                    alt="Shared"
                    className="rounded-lg max-w-full h-auto cursor-pointer hover:opacity-90 transition-opacity"
                    onClick={() => window.open(message.media, '_blank')}
                  />
                ) : message.mediaType?.startsWith("video/") ? (
                  <video
                    src={message.media}
                    controls
                    className="rounded-lg max-w-full h-auto"
                  />
                ) : (
                  <a
                    href={message.media}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-blue-500 underline text-sm hover:text-blue-600 transition-colors"
                  >
                    View File
                  </a>
                )}
              </div>
            )}

            {/* Time and Status */}
            <div className="flex items-center justify-end gap-1 mt-1">
              <span
                className={`text-[10px] sm:text-xs ${
                  isOwnMessage
                    ? theme === "dark"
                      ? "text-gray-300"
                      : "text-gray-600"
                    : theme === "dark"
                    ? "text-gray-400"
                    : "text-gray-500"
                }`}
              >
                {message.createdAt
                  ? format(new Date(message.createdAt), "HH:mm")
                  : ""}
              </span>
              {isOwnMessage && (
                <>
                  {message.messageStatus === "sent" && (
                    <FaCheck className="w-3 h-3 text-gray-400" />
                  )}
                  {message.messageStatus === "delivered" && (
                    <FaCheckDouble className="w-3 h-3 text-gray-400" />
                  )}
                  {message.messageStatus === "read" && (
                    <FaCheckDouble className="w-3 h-3 text-blue-500" />
                  )}
                </>
              )}
            </div>

            {/* Three Dots Menu Button - Top Right Corner - Only shows when hovering bubble */}
            <div 
              className={`absolute top-1 right-1 transition-opacity duration-200 z-20 ${
                isHoveringBubble ? "opacity-100" : "opacity-0 pointer-events-none"
              }`}
            >
              <button
                data-option-button
                onClick={() => setShowOption(!showOption)}
                className={`p-1.5 sm:p-2 rounded-full transition-all hover:scale-110 ${
                  theme === "dark" 
                    ? "text-white hover:bg-white/10" 
                    : "text-gray-800 hover:bg-black/5"
                }`}
                aria-label="Message options"
              >
                <HiDotsVertical size={16} className="sm:w-[18px] sm:h-[18px]" />
              </button>
            </div>

            {/* Dropdown Menu */}
            {showOption && (
              <div
                ref={optionRef}
                className={`absolute top-8 sm:top-10 ${
                  isOwnMessage ? "right-1" : "left-1"
                } z-50 w-32 sm:w-36 rounded-lg sm:rounded-xl shadow-xl py-2 text-sm border ${
                  theme === "dark" 
                    ? "bg-[#1d1f1f] text-white border-gray-700" 
                    : "bg-white text-black border-gray-200"
                }`}
              >
                {/* Copy Button */}
                <button
                  onClick={handleCopyMessage}
                  className={`flex items-center w-full px-3 sm:px-4 py-2 sm:py-2.5 gap-2 sm:gap-3 transition-colors ${
                    theme === "dark" ? "hover:bg-gray-700" : "hover:bg-gray-100"
                  }`}
                >
                  <FaRegCopy size={14} className="flex-shrink-0" />
                  <span className="text-xs sm:text-sm">Copy</span>
                </button>

                {/* Delete Button (only for own messages) */}
                {isOwnMessage && (
                  <button
                    onClick={handleDeleteMessage}
                    className={`flex items-center w-full px-3 sm:px-4 py-2 sm:py-2.5 gap-2 sm:gap-3 text-red-600 transition-colors ${
                      theme === "dark" ? "hover:bg-gray-700" : "hover:bg-red-50"
                    }`}
                  >
                    <MdDelete className="text-red-600 flex-shrink-0" size={14} />
                    <span className="text-xs sm:text-sm">Delete</span>
                  </button>
                )}
              </div>
            )}
          </div>

          {/* React Button - Side of Message - Only shows when hovering bubble */}
          <div
            className={`absolute ${
              isOwnMessage ? "-left-10 sm:-left-12" : "-right-10 sm:-right-12"
            } top-1/2 transform -translate-y-1/2 transition-opacity duration-200 z-20 ${
              isHoveringBubble ? "opacity-100" : "opacity-0 pointer-events-none"
            }`}
          >
            <button
              onClick={() => setShowReactionPicker(!showReactionPicker)}
              className={`p-1.5 sm:p-2 rounded-full shadow-lg transition-all hover:scale-110 ${
                theme === "dark"
                  ? "bg-[#202c33] hover:bg-[#2a3942]"
                  : "bg-white hover:bg-gray-50"
              }`}
              aria-label="Add reaction"
            >
              <FaSmile
                className={`w-4 h-4 sm:w-5 sm:h-5 ${
                  theme === "dark" ? "text-gray-300" : "text-gray-600"
                }`}
              />
            </button>
          </div>

          {/* Reaction Picker */}
          {showReactionPicker && (
            <div
              ref={reactionPickerRef}
              className={`absolute -top-12 sm:-top-14 ${
                isOwnMessage ? "right-0" : "left-0"
              } bg-[#202c33] dark:bg-[#2a3942] rounded-full px-2 py-1.5 sm:px-3 sm:py-2 gap-1 shadow-xl flex items-center z-50 border border-gray-600`}
            >
              {quickReactions.map((emoji, index) => (
                <button
                  key={index}
                  onClick={() => handleReactionClick(emoji)}
                  className="hover:scale-125 transition-transform p-0.5 sm:p-1 text-lg sm:text-xl"
                  aria-label={`React with ${emoji}`}
                >
                  {emoji}
                </button>
              ))}
              <div className="w-5 h-5 sm:w-6 sm:h-6 mx-1">
                <button
                  className="hover:bg-[#ffffff1a] rounded-full p-1 transition-colors"
                  onClick={() => setShowEmojiPicker(true)}
                  aria-label="More reactions"
                >
                  <FaPlus className="h-3 w-3 sm:h-4 sm:w-4 text-gray-300" />
                </button>
              </div>

              {/* Extended Emoji Picker */}
              {showEmojiPicker && (
                <div
                  ref={emojiPickerRef}
                  className={`absolute ${
                    isOwnMessage ? "right-0 top-full" : "left-0 top-full"
                  } mt-2 z-50 shadow-2xl`}
                >
                  <div className="relative">
                    <EmojiPicker
                      onEmojiClick={(emojiObject) => {
                        handleReactionClick(emojiObject.emoji);
                      }}
                      theme={theme}
                      width={Math.min(window.innerWidth - 32, 320)}
                      height={Math.min(window.innerHeight * 0.5, 400)}
                    />
                    <button
                      onClick={() => setShowEmojiPicker(false)}
                      className="absolute top-2 right-2 text-gray-500 hover:text-gray-700 bg-white rounded-full p-1.5 shadow-md transition-colors"
                      aria-label="Close emoji picker"
                    >
                      <RxCross2 size={16} />
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Reactions Display - Attached to bottom of bubble */}
          {hasReactions && (
            <div
              className={`absolute -bottom-3 sm:-bottom-4 ${
                isOwnMessage ? "right-1 sm:right-2" : "left-1 sm:left-2"
              } z-10`}
            >
              <div
                onClick={() => setShowReactionDetails(!showReactionDetails)}
                className={`flex items-center gap-1 px-2 py-1 sm:px-2.5 sm:py-1 rounded-full cursor-pointer shadow-lg transition-transform hover:scale-105 mb-4 ${
                  theme === "dark"
                    ? "bg-[#2a3942] text-white"
                    : "bg-gray-200 text-black"
                }`}
              >
                {/* Show max 3 emojis */}
                {reactions.slice(0, 3).map((reaction, index) => (
                  <span key={`${reaction.emoji}-${index}`} className="text-xs sm:text-sm leading-none">
                    {reaction.emoji}
                  </span>
                ))}
                {/* Total count */}
                <span className="text-[10px] sm:text-xs font-semibold ml-0.5">
                  {message.reactions.length}
                </span>
              </div>
            </div>
          )}

          {/* Reaction Details Popup */}
          {showReactionDetails && hasReactions && (
            <div
              ref={reactionDetailsRef}
              className={`absolute ${
                isOwnMessage ? "right-0" : "left-0"
              } bottom-full mb-2 p-3 sm:p-4 rounded-lg sm:rounded-xl shadow-2xl z-50 min-w-[240px] sm:min-w-[280px] max-w-[90vw] sm:max-w-[350px] ${
                theme === "dark"
                  ? "bg-[#2a2a2a] text-white"
                  : "bg-white text-black"
              } border ${theme === "dark" ? "border-gray-600" : "border-gray-200"}`}
            >
              {/* Reaction Tabs */}
              <div className="flex items-center gap-2 border-b pb-2 sm:pb-3 mb-3 overflow-x-auto scrollbar-thin" style={{
                borderColor: theme === "dark" ? "#404040" : "#e5e7eb"
              }}>
                <button className={`text-xs sm:text-sm font-semibold px-2.5 sm:px-3 py-1 sm:py-1.5 rounded-full whitespace-nowrap ${
                  theme === "dark" ? "bg-gray-700" : "bg-gray-200"
                }`}>
                  All {message.reactions.length}
                </button>
                {reactions.map((reaction, idx) => (
                  <button
                    key={idx}
                    className={`text-xs sm:text-sm px-2.5 sm:px-3 py-1 sm:py-1.5 rounded-full whitespace-nowrap transition-colors ${
                      theme === "dark" ? "hover:bg-gray-700" : "hover:bg-gray-100"
                    }`}
                  >
                    {reaction.emoji} {reaction.count}
                  </button>
                ))}
              </div>

              {/* Users List */}
              <div className="space-y-2 max-h-48 sm:max-h-60 overflow-y-auto scrollbar-thin">
                {reactions.map((reaction, idx) =>
                  reaction.users.map((user, userIdx) => (
                    <div
                      key={`${idx}-${userIdx}`}
                      className="flex items-center justify-between py-1.5 sm:py-2 px-2 rounded transition-colors hover:bg-gray-500/10"
                    >
                      <div className="flex items-center gap-2 sm:gap-3 flex-1 min-w-0">
                        {/* User Avatar */}
                        {user?.profilePicture ? (
                          <img
                            src={user.profilePicture}
                            alt={user.username}
                            className="w-8 h-8 sm:w-9 sm:h-9 rounded-full object-cover flex-shrink-0"
                          />
                        ) : (
                          <div className={`w-8 h-8 sm:w-9 sm:h-9 rounded-full flex items-center justify-center text-xs sm:text-sm font-semibold flex-shrink-0 ${
                            theme === "dark" ? "bg-gray-600 text-white" : "bg-gray-300 text-gray-700"
                          }`}>
                            {user?.username?.[0]?.toUpperCase() || "?"}
                          </div>
                        )}
                        {/* Username */}
                        <div className="flex-1 min-w-0">
                          <span className="text-xs sm:text-sm font-medium block truncate">
                            {user?._id === currentUser?._id ? "You" : user?.username || "Unknown"}
                          </span>
                        </div>
                      </div>
                      {/* Emoji */}
                      <span className="text-lg sm:text-xl flex-shrink-0 ml-2">{reaction.emoji}</span>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default MessageBubble;