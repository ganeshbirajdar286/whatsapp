const response=( res,statuscode,message,data=null)=>{
 if(!res){
    console.error("Response obbject is null");
    return;
 }
 const responseObject={
status:statuscode<400?"success":"error",
message,
data,
 }
 return res.status(statuscode).json(responseObject)
}


export default response;