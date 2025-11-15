import jwt from "jsonwebtoken";
import response from "../utils/responseHandle.js";

export const isLogined = async (req, res, next) => {
  const authHeader = req.headers["authorization"];
  const authToken = req.cookies?.token;

  let token;

  // 1. FIRST → Check header
  if (authHeader?.startsWith("Bearer ")) {
    token = authHeader.split(" ")[1];
  } 
  // 2. If header missing → fallback to cookie
  else if (authToken) {
    token = authToken;
  } 
  // 3. Both missing → send error
  else {
    return response(res, 401, "Authorization token missing (header + cookie)");
  }

  // 4. Verify token
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = decoded;
    next();
  } catch (error) {
    console.log(error);
    return response(res, 401, "Token expired or invalid");
  }
};
