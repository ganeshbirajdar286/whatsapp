import jwt from "jsonwebtoken"

export const jwtToken=(userId)=>{
   return jwt.sign({userId},process.env.JWT_SECRET,{
    expiresIn:"1y"
   })
}
  