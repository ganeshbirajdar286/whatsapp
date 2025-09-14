import express from 'express'

import {  multerMiddleWare } from '../config/cloudinary.config.js';
import { isLogined}  from '../middleware/auth.middleware.js';
import { deleteMessage, getConversation, getMessage, markAsRead, sendMessage } from '../controllers/chat.controller.js';
const router=express.Router();


router.post("/send-message",isLogined, multerMiddleWare,sendMessage);
router.get("/conversation",isLogined,getConversation)
router.get("/conversation/:conversationId/messages",isLogined,getMessage);
router.put("/messages/read",isLogined,markAsRead); 
router.delete("/message/:messageId",isLogined,deleteMessage)
 
export default router;    