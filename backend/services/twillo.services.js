import twilio from 'twilio';


// twillo credentails from  env 
const accountSid=process.env.TWILIO_ACCOUNT_SID;
const authToken=process.env.TWILIO_AUTH_TOKEN;
const serviceSid=process.env.TWILIO_SERVICE_SID;

const client =twilio(accountSid,authToken)

//Twilio generates a unique OTP (e.g., 123456) for that phone number and sends it via SMS
export const senOtpToPhoneNumber=async(phoneNumber)=>{
    try {
        if(!phoneNumber){
            throw new Error("phone number is required ")
        }
        const response= await client.verify.v2.services(serviceSid).verifications.create({
            to:phoneNumber,
            channel:"sms"
        })
        return response;
    } catch (error) {
        console.log("failed  to send sms",error.message);
    }
}


//Twilio's backend checks if the provided otp matches the one it previously sent to the phoneNumber.
export const verifyOtp=async(phoneNumber,otp)=>{
   
    try {
        const response= await client.verify.v2.services(serviceSid).verificationChecks.create({
            to:phoneNumber,
            code:otp,
        })   
        return response;

    } catch (error) {
        console.log("otp verification failed",error.message);
        return(error.message)
    } 
}
 