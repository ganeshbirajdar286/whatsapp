import express from 'express'
import { checkAuthenticated, getALLUser, logout, sendOtp, updateProfile, verifyotp } from '../controllers/authController.js';
import { isLogined}  from '../middleware/auth.middleware.js';
import { multerMiddleWare } from '../config/cloudinary.config.js';
const router=express.Router();


router.post("/send-otp",sendOtp);
router.post("/verify-otp",verifyotp);
router.put("/update-profile",isLogined,multerMiddleWare,updateProfile);
router.get("/logout",isLogined,logout)
router.get("/check-auth",isLogined,checkAuthenticated);
router.get("/users",isLogined,getALLUser)
 
export default router;    