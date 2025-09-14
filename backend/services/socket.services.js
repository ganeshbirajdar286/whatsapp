import { Server } from "socket.io";
import User from "../models/user.model.js";
import Message from "../models/messages.model.js";


//Map to store online users ->userId,socketId 
const onlineUsers=new Map();  // this is javascript  object  

//Map to track typing status ->userid ->[conversation]:boolean
const typingUser =new Map();

const initializeSocket =(server)=>{
const io=new Server(server,{
    cors:{
        origin:process.env.FORNTEND_URL,
        credential:true,
        methods:["GET","POST","PUT","DELETE","OPTIONS"]
    },
    pingTimeout:60000,// disconnect inactiveusers or sockets after 60s
})

//when a new socket connection  is  established 
io.on("connection",(socket)=>{
    console.log(`user connected : ${socket.id}`);
    let userId=null;

 //handle user connection and mark them online in db
 socket.on("user_connection",async(connectingUserId)=>{
    try {
        userId=connectingUserId;
        onlineUsers.set(userId,socket.id);  // Map {
                                            //   "101" => "abc123",
                                               //   "102" => "xyz456",
                                            // }
        socket.join(userId)//Every user gets their own private room named with their userId.
        
        //update user status in db 
        await User.findByIdAndUpdate(userId,{
             isOnline:true,
             lastSeen:new Date(),
        })
     // notify all users that this  user is online
      io.emit("user_status",{userId,isOnline:true})
    } catch (error) {
        console.error("Error handling user connection",error)
    }
 })

 //return online status of requested user
 socket.on("get_user_status",(requestedUserId,callback)=>{
    const isOnline=onlineUsers.has(requestedUserId);
    callback({
        userId:requestedUserId,
        isOnline,
        lastSeen:isOnline?new Date : null ,
    })
 })

 //forward message to receiver if online
 socket.on("send_message",async(message)=>{
    try {
       const receiverSocketId=onlineUsers.get(message.receiver?._id) 
       if(receiverSocketId){
         io.to(receiverSocketId).emit("receive_message",message)
       }
    } catch (error) {
        console.log("Error sending message",error);
        socket.emit("message_error",{error:"Failed to send messages"})
    }
 })

 //update messages as read and notify sender
 socket.on("message_read",async({messageIds,senderId})=>{
   try {
      await Message.updateMany(
         {_id:{$in:messageIds}},
         {$set:{messageStatus:"read"}}
      )

      const senderSocketId=onlineUsers.get(senderId);
      if(senderSocketId){
         messageIds.forEach((messageId)=>{
            io.to(senderSocketId).emit("message_status_update",{
               messageId,
               messageStatus:"read"
            })
         })
      }
   } catch (error) {
       console.log("Error updating message read status",error);
   }
 })

 //handle typing start event and auto-stop after 3s
 socket.on("typing_start",({conversationId,receiverId})=>{
   if(!userId || !conversationId || !receiverId) return;

   if(!typingUser.has(userId)) typingUser.set(userId,{});
   const userTyping =typingUser.get(userId);
   userTyping[conversationId]=true;

   //clear any exiting timeout
   if(userTyping[`${conversationId}_timeout`]){
      clearTimeout(userTyping[`${conversationId}_timeout`])
   }


   //auto-stop typing after 3s
   userTyping[`${conversationId}_timeout`]=setTimeout(() => {
      userTyping[conversationId]=false;
      socket.to(receiverId).emit("user_typing",{
         userId,
         conversationId,
         isTyping:false,
      })
   }, 3000);

   //  notify receiver
   socket.io(receiverId).emit("user_typing",{
      userId,
      conversationId,
      isTyping:true,
   })

   socket.on("typing_stop",(conversationId,receiverId)=>{
      if(!userId || !conversationId || !receiverId) return;

   if(!typingUser.has(userId)){
      const userTyping=typingUser.get(userId);
      userTyping[conversationId]=false;
   };
    
    if(userTyping[`${conversationId}_timeout`]){
      clearTimeout(userTyping[`${conversationId}_timeout`])
      delete userTyping[`${conversationId}_timeout`]
    }

    socket.to(receiverId).emit("user_typing",{
      userId,
      conversationId,
      isTyping:false,
    })
   })

   //add reaction or update reaction on message
   socket.on("add_reaction",async({messageId,emoji,userId,reactionUserId})=>{
      try {
         const message = await Message.findById(messageId);
         if(!message) return;
         const exitingIndex= message.reactions.findIndex((r)=>r.user.tostring()=== reactionUserId)

         if(exitingIndex>-1){
         const exiting =message.reactions(exitingIndex)
         if(exiting.emoji===nam===emoji){
            //remove same reaction
            message.reactions,splice(exitingIndex,1)
         }else{
            //change  emoji
            message.reactions[exitingIndex].emoji =emoji;   
         }
         }else{
            //add new reaction
           message.reactions.push({user:reactionUserId,emoji});
         }
         await message.save();

         const populateMessage =await Message.findOne(message?._id)
         .populate("sender","username profilepicture")
         .populate("receiver","username profilePicture")
          .populate("reactions.user","username")

          const reactionUpdated ={
            messageId,
            reactions:populateMessage.reactions
          }

          const senderSocket =onlineUsers.get(populateMessage.sender._id.toString());
          const receiverSocket = onlineUsers.get(populateMessage.receiver?._id.toString());

          if(senderSocket) io.to(senderSocket).emit("reaction_update",reactionUpdated);
          if(receiverSocket) io.to(receiverSocket).emit("reaction_update",reactionUpdated);
      } catch (error) {
         console.log("Error handling reaction",error);
      }

   })
   
 }) 
 //handle disconnection and mark user offline

const handleDisconnected = async()=>{
   if(!userId) return;
   try {
      onlineUsers.delete(userId);
      //clear all typing timesouts
      if(typingUser.has(userId)){
         const userTyping =typingUser.get(userId)
         Object.keys(userTyping).forEach((key)=>{
            if(key.endsWith("_timeout")) clearTimeout(userTyping[key])
         })
      typingUser.delete(userId)
      }

      await User.findByIdAndUpdate(userId,{
         isOnline:false,
         lastSeen:new Date()
      })

      io.emit("user_status",{
         userId,isOnline:false,lastSeen:new Date(),
      })
      socket.leave(userId);
      console.log(`user ${userId} disconnected`);
   } catch (error) {
      console.error("Error handling disconnection",error)
   }
}

//disconnect event 
socket.on("disconnnect",handleDisconnected)
})

// attach the online user map to the scoket server for external user
io.socketUserMap=onlineUsers;
return io;
}


export default initializeSocket;