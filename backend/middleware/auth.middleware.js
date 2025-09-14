import jwt from "jsonwebtoken"
import response from "../utils/responseHandle.js";

export const isLogined =async(req,res,next)=>{
      const authToken =req.cookies.token;
      if(!authToken){
        return response(res,401,"authorization token missing");
      }
      try {
          const decoded = jwt.verify(authToken, process.env.JWT_SECRET);
           req.user=decoded;
           next();
      } catch (error) {
        console.log(error);
        return response(res,404,"token expired")
      } 
} 