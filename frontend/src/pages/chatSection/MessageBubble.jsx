import { format } from "date-fns";
import React, { useRef, useState } from "react";
import { FaCheck, FaCheckDouble, FaPlus, FaSmile } from "react-icons/fa";
import { HiDotsVertical } from "react-icons/hi";
import useOutSideClick from "../../hooks/useOutSideClick";
import EmojiPicker from "emoji-picker-react";
import { RxCross2 } from "react-icons/rx";
import { FaRegCopy } from "react-icons/fa";
import { MdDelete } from "react-icons/md";
function MessageBubble({
  message,
  theme,
  currentUser,
  OnReact,
  deletedMessage,
}) {
  const [showEmojiPicker, setshowEmojiPicker] = useState(false);
  const [showReaction, setShowReaction] = useState(false);
  const messageRef = useRef(null);
  const [showOption, setShowOption] = useState(false);
  const optionRef = useState(null);

  const emojiPickerRef = useRef(null);
  const reactionMenuRef = useRef(null);
  const isUserMessage = message.sender._id === currentUser?._id;

  const bubbleClass = isUserMessage ? `chat-end` : `chat-start`;

  const bubbleContentClass = isUserMessage
    ? `chat-bubble md:max-w-[50%] min-w-[130px]  ${theme === "dark"
      ? "bg-[#144d38] text-white"
      : "bg-[#d9fdd3]  text-black"
    }`
    : `chat-bubble md:max-w-[50%] min-w-[130px] ${theme === "dark" ? "bg-[#144d38] text-white" : "bg-[#fff]  text-black"
    } `;
  const quickReactions = ["👍", "❤️", "😂", "😮", "😢", "🙏"];

  const handleReact = (emoji) => {
    OnReact(message._id, emoji);
    setshowEmojiPicker(false);
    setShowReaction(false);
  };

  useOutSideClick(emojiPickerRef, () => {
    if (showEmojiPicker) setshowEmojiPicker(false);
  });

  useOutSideClick(reactionMenuRef, () => {
    if (showReaction) setShowReaction(false);
  });
  useOutSideClick(optionRef, () => {
    if (showOption) setShowOption(false);
  });

  if (message === 0) return;
  return (
    <>
      <div className={`chat ${bubbleClass}`}>
        <div
          className={`${bubbleContentClass} relative group `}
          ref={messageRef}
        >
          <div className="flex  justify-center gap-2">
            {message.contentType === "text" && (
              <p className="mr-2">{message.content}</p>
            )}
            {message.contentType === "image" && (
              <div>
                <img
                  src={message.imageOrVideoUrl}
                  alt="image-video"
                  className="rounded-lg "
                />
              </div>
            )}
          </div>
          <div className="self-end flex  items-center justify-end gap-1 text-xs opacity-60 mt-2 ml-2">
            <span>{format(new Date(message.createdAt), "HH:mm")}</span>

            {isUserMessage && (
              <>
                {message.messageStatus === "send" && <FaCheck size={12} />}
                {message.messageStatus === "delivered" && (
                  <FaCheckDouble size={12} />
                )}
                {message.messageStatus === "read" && (
                  <FaCheckDouble size={12} className="text-blue-700" />
                )}
              </>
            )}
          </div>
          <div className="absolute top-1 right-1 opacity-0 group-hover:opacity-100 transition-opacity z-20">
            <button
              onClick={() => setShowOption((prev) => !prev)}
              className={`p-1 rounded-full ${theme === "dark" ? "text-white" : "text-gray-800"
                }`}
            >
              <HiDotsVertical size={18} />
            </button>
          </div>

          <div
            className={`absolute ${isUserMessage ? "-left-10" : "-right-10"
              } top-1/2 transform -translate-y-1/2 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col gap-2`}
          >
            <button
              onClick={() => setShowReaction(!showReaction)}
              className={`p-2 rounded-full ${theme === "dark"
                  ? "bg-[#202c33] hover:bg-[#202c33]/80"
                  : "bg-white hover:bg-gray-100"
                } shadow-lg`}
            >
              <FaSmile
                className={`${theme === "dark" ? "text-gray-300" : "text-gray-600"
                  }`}
              />
            </button>
          </div>

          {showReaction && (
            <div
              ref={reactionMenuRef}
              className={`absolute -top-8 ${isUserMessage ? "-left-30" : "left-56"
                } transform -translate-x-1/2 flex items-center  bg-[#202c33]/90 rounded-full px-2 py-1.5 gap-1 shadow-lg `}
            >
              {quickReactions.map((emoji, index) => (
                <button
                  key={index}
                  onClick={() => handleReact(emoji)}
                  className="hover:scale-125 transition-transform p-1"
                >
                  {emoji}
                </button>
              ))}
              <div className="w-[20px] h-5  mx-1">
                <button
                  className="hover:bg-[#ffffff1a] rounded-full p-1"
                  onClick={() => setshowEmojiPicker(true)}
                >
                  <FaPlus className="h-4 w-4 text-gray-300 rounded-full" />
                </button>
              </div>
              {showEmojiPicker && (
                <div
                  ref={emojiPickerRef}
                  className="absolute left-0 bottom-16 z-50"
                >
                  <div className="relative ">
                    <EmojiPicker
                      onEmojiClick={(emojiObject) => {
                        handleReact(emojiObject.emoji);
                      }}
                      theme={theme}
                      className={`absolute ${isUserMessage ? "right-5 bottom-0" : "bottom-0 left-7"
                        }`}
                    />
                    <button
                      onClick={() => setshowEmojiPicker(false)}
                      className="absolute top-2 right-2 text-gray-500 hover:text-gray-700"
                    >
                      <RxCross2 />
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}
          {message.reactions && message.reactions.length > 0 && (
            <div
              className={`absolute -bottom-5  z-100 ${isUserMessage ? "right-2" : "left-2"
                }  
                  ${theme === "dark" ? "bg-[#2a3942]" : "bg-gray-200"
                } rounded-full px-2  shadow-md`}
            >
              {message.reactions.map((reaction, index) => (
                <span key={index} className="mr-1">
                  {reaction.emoji}
                </span>
              ))}
            </div>
          )}
          {showOption && (
            <div
              ref={optionRef}
              className={`absolute top-8 right-1 z-50 w-30 rounded-xl shadow-lg py-2 text-sm 
    ${theme === "dark" ? "bg-[#1d1f1f] text-white" : "bg-gray-100 text-black"}`}
            >
              {/* Copy Button */}
              <button
                onClick={() => {
                  if (message.contentType === "text") {
                    navigator.clipboard.writeText(message.content);
                  }
                  setShowOption(false);
                }}
                className="flex items-center w-full px-4 py-2 gap-3 rounded-lg hover:bg-gray-200 "
              >
                <FaRegCopy size={14} />
                <span>Copy</span>
              </button>

              {/* Delete Button (only for user messages) */}
              {isUserMessage && (
                <button
                  onClick={() => {
                    deletedMessage({messageId: message?._id});
                    console.log(message?._id);
                    setShowOption(false);
                  }}
                  className="flex items-center w-full px-4 py-2 gap-3 rounded-lg text-red-600 hover:bg-red-100 "
                >
                  <MdDelete className="text-red-600" size={14} />
                  <span>Delete</span>
                </button>
              )}
            </div>
          )}

        </div>
      </div>
    </>
  );
}

export default MessageBubble;
