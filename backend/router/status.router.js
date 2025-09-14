import express from 'express'
import { createStatus, deleteStatus, getStatuses, viewStatus } from '../controllers/status.controller.js';
import {  multerMiddleWare } from '../config/cloudinary.config.js';
import { isLogined}  from '../middleware/auth.middleware.js';
import { deleteMessage, getConversation, getMessage, markAsRead, sendMessage } from '../controllers/chat.controller.js';

const router=express.Router();


router.post("/",isLogined, multerMiddleWare,createStatus);
router.get("/",isLogined,getStatuses);
router.put("/:statusId/view",isLogined,viewStatus);
router.delete("/:statusId",isLogined,deleteStatus); 

 
export default router;    