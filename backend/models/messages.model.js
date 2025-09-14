import {mongoose,Schema} from "mongoose";


const messageSchema=new Schema({
    conversation:{
        type:mongoose.Schema.Types.ObjectId,
        ref:"Conversation",
        require:true,
    },
    sender:{
       type:mongoose.Schema.Types.ObjectId,
       ref:"User",
        require:true
    },
     receiver:{
        type:mongoose.Schema.Types.ObjectId,
         ref:"User",
        require:true
    },
    content:{type:String},
    imageOrVideoUrl:{type:String},
    contentType:{type:String,enum:["image","video","text"]},
    reaction:[{
        user:{
            type:mongoose.Schema.Types.ObjectId,
         ref:"User",
        },
        emoji:{
            type:String,
        }
    }],
    messageStatus:{
        type:String,
        default:"send"
    }
},{timestamps:true})

const Message=mongoose.model("Message",messageSchema);
export default Message;