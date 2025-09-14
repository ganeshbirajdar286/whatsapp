import {mongoose,Schema} from "mongoose";

const userSchema= new Schema({
    phoneNumber:{
        type:String,
        unique:true,
        sparse:true
    },
    phoneSuffix:{   // country code for india 91+
        type:String,
        unique:false,
    },
    username:{
        type:String,
    },
    email:{
        type:String,
        lowercase:true,
        validate: {
      validator: function(value) {
        // Basic regex for email format validation
        return /^[^@]+@[^@]+\.[^@]+$/.test(value); 
      },
      message: 'Please enter a valid email address.'
    }
    },
    emailOtp:{
        type:String,
    },
    emailOtpExpiry:{
        type:Date,
    },
    profilePicture:{
        type:String,
    },
     about:{
        type:String,
    },
    lastSeen:{
        type:Date,
    },
    isOnline:{
        type:Boolean,
        default:false,
    },
    isVerified:{
        type:Boolean,
        default:false,
    },
    agreed:{
         type:Boolean,
        default:false,
    }
},{timestamps:true});

const User=mongoose.model("User",userSchema);
export default User;