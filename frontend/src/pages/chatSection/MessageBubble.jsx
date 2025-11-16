import React, { useState, useRef, useEffect } from "react";
import { format } from "date-fns";
import {
  FaCheck,
  FaCheckDouble,
  FaSmile,
  FaPlus,
  FaRegCopy,
} from "react-icons/fa";
import { HiDotsVertical } from "react-icons/hi";
import { MdDelete } from "react-icons/md";
import { RxCross2 } from "react-icons/rx";
import EmojiPicker from "emoji-picker-react";



const MessageBubble = ({
  selectedContact,
  message,
  theme,
  currentUser,
  OnReact,
  deletedMessage,
}) => {
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

  const quickReactions = ["👍", "❤️", "😂", "😮", "😢", "🙏"];

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
        !event.target.closest("[data-option-button]")
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

  // Group reactions
  const processReactions = () => {
    if (!message.reactions || message.reactions.length === 0) return [];

    const reactionMap = {};
    message.reactions.forEach((reaction) => {
      const emoji = reaction.emoji;
      if (!reactionMap[emoji]) {
        reactionMap[emoji] = { emoji, count: 0, users: [] };
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
      navigator.clipboard.writeText(message.content).then(() => {
        alert("Message copied!");
      });
    }
    setShowOption(false);
  };

  const reactions = processReactions();
  const hasReactions = reactions.length > 0;

  return (
    <div
      className={`flex mb-3 relative ${
        isOwnMessage ? "justify-end" : "justify-start pl-6"
      }`}
    >
      <div
        className={`max-w-[85%] xs:max-w-[80%] sm:max-w-[75%] md:max-w-[70%] lg:max-w-[65%] xl:max-w-[60%] min-w-[120px] ${
          isOwnMessage ? "order-2" : "order-1"
        } relative`}
      >
        {/* BUBBLE */}
        <div className="relative inline-block group">
          <div
            className={`rounded-lg px-3 py-2 shadow-md ${
              isOwnMessage
                ? theme === "dark"
                  ? "bg-[#005c4b] text-white"
                  : "bg-[#d9fdd3] text-black"
                : theme === "dark"
                ? "bg-[#202c33] text-white"
                : "bg-white text-black"
            } ${hasReactions ? "mb-5" : ""}`}
          >
            {message.content && (
              <p className="text-sm break-words whitespace-pre-wrap mr-3">
                {message.content}
              </p>
            )}

            {/* MEDIA */}
            {message.media && (
              <div className="mt-2">
                {message.mediaType?.startsWith("image/") ? (
                  <img src={message.media} className="rounded-lg max-w-full" />
                ) : message.mediaType?.startsWith("video/") ? (
                  <video
                    src={message.media}
                    controls
                    className="rounded-lg max-w-full"
                  />
                ) : (
                  <a
                    href={message.media}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-blue-500 underline"
                  >
                    View File
                  </a>
                )}
              </div>
            )}

            {/* TIME */}
            <div className="flex items-center justify-end gap-1 mt-1">
              <span className="text-[10px] opacity-70">
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

            {/* Three dots button (hover appears like WhatsApp Web) */}
            {/* OPTIONS BUTTON */}
            <div
              className={`absolute top-1 
    ${
      isOwnMessage
        ? "right-2 sm:right-3 md:right-0"
        : "left-2 sm:left-3 md:-left-3"
    }
    opacity-0 group-hover:opacity-100 
    transition-opacity duration-200 z-30`}
            >
              <button
                data-option-button
                onClick={() => setShowOption(!showOption)}
                className="p-2 rounded-full hover:bg-gray-200 dark:hover:bg-white/10 cursor-pointer"
              >
                <HiDotsVertical
                  className={`text-gray-600 dark:text-gray-900`}
                  size={18}
                />
              </button>
            </div>

            {/* OPTIONS MENU */}
            {showOption && (
              <div
                ref={optionRef}
                className={`absolute top-8 w-36 rounded-lg shadow-xl py-2 text-sm z-50 ${
                  isOwnMessage ? "right-1" : "left-1"
                } ${
                  theme === "dark"
                    ? "bg-[#1d1f1f] text-white"
                    : "bg-white text-black"
                }`}
              >
                <button
                  onClick={handleCopyMessage}
                  className="flex items-center gap-2 w-full px-4 py-2 hover:bg-gray-100 dark:hover:bg-gray-700"
                >
                  <FaRegCopy size={14} /> Copy
                </button>

                {isOwnMessage && (
                  <button
                    onClick={handleDeleteMessage}
                    className="flex items-center w-full px-4 py-2 gap-2 text-red-600 hover:bg-red-50 dark:hover:bg-gray-700"
                  >
                    <MdDelete size={14} /> Delete
                  </button>
                )}
              </div>
            )}
          </div>

          {/* --- Reaction Button (appears on hover near bubble) --- */}
          <div
            className={`
    absolute top-1/2 -translate-y-1/2
    ${
      isOwnMessage ? "left-0 -translate-x-[110%]" : "right-0 translate-x-[110%]"
    }
    opacity-0 group-hover:opacity-100
    transition-opacity duration-200 z-20
  `}
          >
            <button
              onClick={() => setShowReactionPicker(!showReactionPicker)}
              className="p-1.5 rounded-full shadow bg-white dark:bg-[#202c33] cursor-pointer"
            >
              <FaSmile className="text-gray-500 dark:text-gray-300" />
            </button>
          </div>

          {/* REACTION PICKER (ROW OF EMOJIS) FIXED RESPONSIVE */}
          {showReactionPicker && (
            <div
              ref={reactionPickerRef}
              className={`absolute -top-12 
    ${isOwnMessage ? "right-0 translate-x-[20%]" : "left-30 -translate-x-[20%]"} 
    max-w-[90vw] bg-[#202c33] dark:bg-[#2a3942] 
    rounded-full px-3 py-2 shadow-xl flex gap-2 z-50`}
            >
              {quickReactions.map((emoji, i) => (
                <button
                  key={i}
                  onClick={() => handleReactionClick(emoji)}
                  className="text-xl hover:scale-100"
                >
                  {emoji}
                </button>
              ))}

              {/* More Emoji button */}
              <button
                className="hover:bg-white/10 p-2 rounded-full"
                onClick={() => setShowEmojiPicker(true)}
              >
                <FaPlus className="text-gray-300 " />
              </button>

              {/* EMOJI PICKER POPUP */}
              {showEmojiPicker && (
                <div
                  ref={emojiPickerRef}
                  className="absolute top-full left-1/2 -translate-x-1/2 mt-2 max-w-[90vw] z-50 shadow-2xl"
                >
                  <EmojiPicker
                    onEmojiClick={(e) => handleReactionClick(e.emoji)}
                    theme={theme}
                    width={Math.min(window.innerWidth - 40, 320)}
                    height={350}
                  />

                  <button
                    onClick={() => setShowEmojiPicker(false)}
                    className="absolute top-2 right-2 bg-white rounded-full p-1 shadow"
                  >
                    <RxCross2 size={16} />
                  </button>
                </div>
              )}
            </div>
          )}

          {/* REACTIONS SUMMARY */}
          {hasReactions && (
            <div
              className={`absolute -bottom-4 ${
                isOwnMessage ? "right-1" : "left-1"
              }`}
            >
              <div
                className={`flex gap-1 px-3 py-1 rounded-full shadow cursor-pointer ${
                  theme === "dark" ? "bg-[#2a3942]" : "bg-gray-200"
                }`}
                onClick={() => setShowReactionDetails(!showReactionDetails)}
              >
                {reactions.slice(0, 3).map((r, i) => (
                  <span key={i}>{r.emoji}</span>
                ))}

                <span className=" flex items-center text-xs font-bold">
                  {message.reactions.length}
                </span>
              </div>
            </div>
          )}

          {/* REACTION DETAILS POPUP — FIXED */}
          {showReactionDetails && hasReactions && (
            <div
              ref={reactionDetailsRef}
              className={`fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 
      z-[9999] w-[90vw] max-w-[350px] p-4 rounded-xl shadow-2xl
      ${theme === "dark" ? "bg-[#2a2a2a] text-white" : "bg-white text-black"}
      border ${theme === "dark" ? "border-gray-600" : "border-gray-200"}`}
            >
              {/* Tabs */}
              <div className="flex gap-2 border-b pb-2 mb-3 overflow-x-auto">
                <button className="px-3 py-1 rounded-full bg-gray-700 text-white text-sm ">
                  All {message.reactions.length}
                </button>

                {reactions.map((r, i) => (
                  <button
                    key={i}
                    className="px-3 py-1 rounded-full text-sm hover:bg-gray-100 dark:hover:bg-gray-700"
                  >
                    {r.emoji} {r.count}
                  </button>
                ))}
              </div>

              {/* Users */}
              <div className="space-y-2 max-h-60 overflow-y-auto">
                {reactions.map((item, i) =>
                  item.users.map((u, j) => (
                    <div
                      key={`${i}-${j}`}
                      className="flex justify-between items-center py-2 px-2"
                    >
                      <div className="flex items-center gap-3">
                        {u?.profilePicture ? (
                          <img
                            src={u.profilePicture}
                            className="w-8 h-8 rounded-full"
                          />
                        ) : (
                          <div className="w-8 h-8 bg-gray-400 rounded-full flex items-center justify-center text-white">
                            {u?.username?.[0]?.toUpperCase()}
                          </div>
                        )}

                        <span className="text-sm">
                          {u?._id === currentUser?._id ? "You" : u.username}
                        </span>
                      </div>

                      <span className="text-xl">{item.emoji}</span>
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
