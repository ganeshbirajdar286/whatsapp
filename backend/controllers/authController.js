import User from "../models/user.model.js";
import otpGenerator from "../utils/otpGenerater.js"
import response from "../utils/responseHandle.js";
import { sendOtptoEmail } from "../services/email.services.js";
import { senOtpToPhoneNumber } from "../services/twillo.services.js";
import { jwtToken } from "../utils/jwtToken.js";
import { verifyOtp } from "../services/twillo.services.js";
import { uploadFileToCloudinary } from "../config/cloudinary.config.js";
import  Conversation from "../models/conversation.model.js"






//step-1 send otp
export  const sendOtp = async (req, res) => {
    const { phoneNumber, phoneSuffix, email } = req.body
    const otp = otpGenerator()
    const expiry = new Date(Date.now() + 5 * 60 * 1000);
    let user;
    try {
        if (email) {
            user = await User.findOne({ email })
            if (!user) {
                user = new User({ email })
            }
            user.emailOtp = otp;
            user.emailOtpExpiry = expiry;
            await sendOtptoEmail(email, otp)
            await user.save();
            return response(res, 200, "Otp send to email", { email })
        }
        if (!phoneNumber || !phoneSuffix) {
            return response(res, 400, "phoneNumber and phoneSuffix required")
        }
        const fullPhoneNumber = `${phoneSuffix}${phoneNumber}`
        user = await User.findOne({ phoneNumber })
        if (!user) {
            user = await new User({ phoneNumber, phoneSuffix })
        }
        await senOtpToPhoneNumber(fullPhoneNumber)
        await user.save();
        return response(res, 200, "Otp send succesfully!!", user)
    } catch (error) {
        console.log(error);
        return response(res, 500, "Internal server error");
    }
}

//step2- verify otp
export const verifyotp = async (req, res) => {
    const {phoneNumber,phoneSuffix,email,otp} = req.body;
    let user;
    try {
        if (email) {
            user = await User.findOne({ email })
            if (!user) {
                return response(res, 404, "User not found")
            }
            const now = new Date();
            if (!user.emailOtp || String(user.emailOtp) !== (String(otp)) || now > new Date(user.emailOtpExpiry)) {
                return response(res, 400, "Invalid or expiry  otp")
            };
            user.isVerified = true;
            user.emailOtp = null;
            user.emailOtpExpiry = null;
            await user.save();
        }else{
         if (!phoneNumber || !phoneSuffix) {
            return response(res, 400, "phoneNumber and phoneSuffix required")
        }
         const fullPhoneNumber = `${phoneSuffix}${phoneNumber}`
          user=await User.findOne({phoneNumber})
         if (!user) {
                return response(res, 404, "User not found")
            }
          const newOtp=otp.join("")
               const result=await verifyOtp(fullPhoneNumber,newOtp)
            if( result.status !== "approved"){
                return  response(res,400,"Invaid otp");
            }
            user.isVerified=true;
            await user.save();
        }
        const token=jwtToken(user?._id)
        res.cookie("token",token,{
            maxAge:1000*60*60*24*365,
            httpOnly:true,
            sameSite:"none",
            secure: true,
        })
        return response(res,200,"otp verify successfully",user)
    } catch (error) {
       console.log(error);
        return response(res, 500, "Internal server error");
    }
}

export const updateProfile=async(req,res)=>{
const {username, about, agreed}=req.body 

const userId=req.user.userId


try {
  
   const user = await User.findById(userId); 
    
    const file=req.file
    if(file){
        const uploadResult=await uploadFileToCloudinary(file);
        user.profilePicture=uploadResult?.secure_url
    }else if(req.body.profilePicture){
      user.profilePicture= req.body.profilePicture
    }
    if(username) user.username=username;
    if(agreed) user.agreed=agreed;
    if(about) user.about=about; 
    await user.save()
    return response(res,200,"user profile updated succesfully",user)
} catch (error) {
      console.log(error);
        return response(res, 500, "Internal server error");
}
} 

export const logout=async(req,res)=>{
    try {
        res.cookie("token"," ",{
              expires: new Date(0), // expire immediately\
            httpOnly:true,
            sameSite:"none",
            secure: true,
        });
        return response(res,200,"user logout successfully")
        
    } catch (error) {
      console.log(error);
        return response(res, 500, "Internal server error");  
    }
}

export const checkAuthenticated=async(req,res)=>{
  try {
 const userId=req.user.userId;
    if(!userId){
        return response(res,404,"unauthorized! pls login before loging this app ")
    }
    const user =await User.findById(userId);
     if(!user){
        return response(res,404,"user not found ")
    }
    return response(res,200,"user retrived and allow to use whatapp",user);
  } catch (error) {
    console.log(error); 
    return response(res, 500, "Internal server error");  
  } 
}

export const getALLUser = async (req, res) => {
  try {
    const userId = req.user?.userId;

    if (!userId) {
      return response(res, 404, "unauthorized! pls login before loging this app");
    }

    // Get all users except the current one
    const otherUsers = await User.find({ _id: { $ne: userId } })
      .select("username profilePicture lastSeen isOnline about phoneNumber phoneSuffix")
      .lean();

    // Attach conversation info
    const usersWithConversation = await Promise.all(
      otherUsers.map(async (user) => {
        const conversation = await Conversation.findOne({
          participants: { $all: [userId, user._id] },
        }).populate({
          path: "lastMessage",
          select: "content createdAt sender receiver",
        }).lean();

        return {
          ...user,
          conversation: conversation || null, // include conversation info
        };
      })
    );

    return response(res, 200, "Users retrieved successfully", usersWithConversation);
  } catch (error) {
    console.error(error);
    return response(res, 500, "Internal server error");
  }
};
