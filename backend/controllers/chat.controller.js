import { uploadFileToCloudinary } from "../config/cloudinary.config.js";
import Conversation from "../models/conversation.model.js";
import response from "../utils/responseHandle.js";
import Message from "../models/messages.model.js";
import mongoose from "mongoose";

export const sendMessage = async (req, res) => {
    try {
        const { sender, receiver, content, messageStatus } = req.body;
        const file = req.file;
        const participants = [sender, receiver].sort();
        //check converstion already exits
        let conversation = await Conversation.findOne({ participants });
        if (!conversation) {
            conversation = new Conversation({
                participants,
            })
            await conversation.save();
        }
        let imageOrVideoUrl = null;
        let contentType = null;

        //handle file upload
        if (file) {
            const uploadfile = await uploadFileToCloudinary(file);
            if (!uploadfile?.secure_url) {
                return response(res, 400, "Failed to upload media");
            }
            imageOrVideoUrl = uploadfile?.secure_url;
            if (file.mimetype.startsWith("image")) {
                contentType = "image";
            } else if (file.mimetype.startsWith("video")) {
                contentType = "video";
            }
            else {
                return response(res, 400, "Unsupported file type")
            }
        } else if (content?.trim()) {
            contentType = "text"
        } else {
            return response(res, 400, "Message contain in required");
        }
        const message = new Message({
            conversation: conversation?._id,
            sender,
            receiver,
            content,
            imageOrVideoUrl,
            contentType,
            messageStatus
        })
        await message.save();
        if (message?.content) {
            conversation.lastMessage = message?.id;
        }
        conversation.unreadCount += 1;
        await conversation.save();

        const populateMessage = await Message.findOne(message?._id)
            .populate("sender", "username profilePicture")
            .populate("receiver", "username profilePicture");

        // emit socket event 
        if (req.io && req.socketUserMap) {
            const receiverSocketId = req.socketUserMap.get(receiver);
            if (receiverSocketId) {
                req.io.to(receiverSocketId).emit('receiver_message', populateMessage);
                message.messageStatus = "delivered";
                await message.save();
            }
        }
        return response(res, 200, "Message send succesfully!", populateMessage);
    } catch (error) {
        console.error(error);
        return response(res, 500, "Internal server error");
    }
}

export const getConversation = async (req, res) => {
    const userId = req.user?.userId;
    try {
        let conversation = await Conversation.find({
            participants: userId,
        }).populate(
            "participants", "username profilePicture isOnline  lastSeen"
        )
            .populate({
                path: "lastMessage",
                populate: {
                    path: "sender receiver",
                    select: "username profilePicture "
                }
            }).sort({ updatedAt: -1 })
        return response(res, 201, "Conversation get successfully ", conversation);
    } catch (error) {
        console.error(error);
        return response(res, 500, "Internal server error");
    }
}

//get message of special  conversation

export const getMessage = async (req, res) => {
    const userId = req.user?.userId;
    const { conversationId } = req.params;
    try {

        // Validate ObjectId
        if (!mongoose.Types.ObjectId.isValid(conversationId)) {
            return response(res, 400, "Invalid conversationId");
        }
        const conversation = await Conversation.findById(conversationId);
        if (!conversation) return response(res, 400, "Conversation not found");
        if (!conversation.participants.includes(userId)) return response(res, 400, "Not authorized");

        const messages = await Message.find({ conversation: conversationId })
            .populate("sender", "username profilePicture")
            .populate("receiver", "username profilePicture")
            .sort({ createdAt: 1 });

        // mark messages as read in DB
        await Message.updateMany(
            { conversation: conversationId, receiver: userId, messageStatus: { $in: ["send", "delivered"] } },
            { $set: { messageStatus: "read" } }
        );

        // reset unread count for this user on this conversation
        conversation.unreadCount = 0;
        await conversation.save();

        return response(res, 200, "Messages retrieved", messages);
    } catch (error) {
        console.error("getMessage error:", error);
        return response(res, 500, "Internal server error");
    }
};

export const markAsRead = async (req, res) => {
    const { messageIds } = req.body;
    const userId = req.user?.userId;
    try {
        //get relavant message to determine sender
        let message = await Message.find({
            _id: { $in: messageIds },
            receiver: userId,
        })
        await Message.updateMany(
            { _id: { $in: messageIds }, receiver: userId },
            { $set: { messageStatus: "read" } }
        );

        // notify to original sender  
        if (req.io && req.socketUserMap) {
            for (const msg of message) {
                const senderSocketId = req.socketUserMap.get(msg.sender.toString());
                if (senderSocketId) {
                    const updatedMessage = {
                        _id: msg._id,
                        messageStatus: "read",
                    };
                    req.io.to(senderSocketId).emit("message_read", updatedMessage);
                    await msg.save();
                }
            }
        }
        return response(res, 200, "messageds marked as read", message)
    } catch (error) {
        console.error(error);
        return response(res, 500, "Internal server error");
    }
}

export const deleteMessage = async (req, res) => {
    const { messageId } = req.params;
    const userId = req.user?.userId;
    try {
        const message = await Message.findById(messageId);
        if (!message) {
            return response(res, 404, "message not found");
        }
        if (message.sender.toString() !== userId) {
            return response(res, 403, "not authorized to delete this message")
        }

        await message.deleteOne();
        // emit socket event 
        if (req.io && req.socketUserMap) {
            const receiverSocketId = req.socketUserMap.get(message.receiver.toString());
            if (receiverSocketId) {
                req.io.to(receiverSocketId).emit("message_deleted", messageId)
            }
        }


        return response(res, 200, "message deleted succesfully!!");

    } catch (error) {
        console.error(error);
        return response(res, 500, "Internal server error");
    }
} 