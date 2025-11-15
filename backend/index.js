import dotenv from "dotenv"
import express from "express"
import connectDB from "./config/dbConnect.js"
import  cors from "cors"
import cookieParser from "cookie-parser"
import authRouter from "../backend/router/auth.router.js"
import chatRouter from "../backend/router/chat.router.js"
import initializeSocket from "./services/socket.services.js"
import http from "http"

dotenv.config()
const app =express();
const allowedOrigins = [
  /\.vercel\.app$/,  // allow ANY Vercel URL
  process.env.FRONTEND_URL, // your main production URL (optional)
];

const corsOption = {
  origin: function (origin, callback) {
    // Allow mobile apps, Postman etc
    if (!origin) return callback(null, true);

    const isAllowed = allowedOrigins.some((allowed) =>
      typeof allowed === "string"
        ? allowed === origin
        : allowed.test(origin)
    );

    if (isAllowed) {
      return callback(null, true);
    }
    console.log("❌ CORS blocked:", origin);
    return callback(new Error("Not allowed by CORS"));
  },

  credentials: true,

  methods: ["GET", "POST", "PUT", "DELETE", "PATCH"],

  allowedHeaders: ["Content-Type", "Authorization"],
};

app.use(cors(corsOption))
const port=process.env.PORT;
app.use(express.json());
app.use(express.urlencoded({extended:true}));
app.use(cookieParser());

//create server 
const server =http.createServer(app)
const io =initializeSocket(server);

//apply scoket middleware before routes 
app.use((req,res,next)=>{
    req.io =io;
    req.socketUserMap=io.socketUserMap;
    next();
})

app.use("/api/auth",authRouter);
app.use("/api/chat",chatRouter);


server.listen(port,(req,res)=>{ 
    connectDB();
    console.log(`server started at http://localhost:${port}`);
})      