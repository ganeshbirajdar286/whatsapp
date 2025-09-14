import  mongoose from "mongoose"

const connectDB=async()=>{
    try{
      await mongoose.connect(process.env.MONGODB_URI);
      console.log("mongodb connected succesfully!!");
    }catch(error){
     console.error("error  in connecting mongo!!",error.message)
     process.exit(1) // closeing database
    }
}
export default connectDB;