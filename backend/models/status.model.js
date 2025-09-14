import {mongoose,Schema} from "mongoose";
const statusSchema=new Schema({
    user:{
        type:mongoose.Schema.Types.ObjectId,
        ref:"User",
        required:true
    },
    content:{type:String},
    contentType:{type:String,enum:["image","video","text"],default:"text"},
    viewers:[{
        type:mongoose.Schema.Types.ObjectId,
        ref:"User",
    }],
    expiresAt:{
        type:Date,
        require:true,
    },
},{timestamps:true});

const Status=mongoose.model("Status",statusSchema);
export default Status;