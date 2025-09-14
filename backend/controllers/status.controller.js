import { uploadFileToCloudinary } from "../config/cloudinary.config.js";
import Status from "../models/status.model.js";
import response from "../utils/responseHandle.js";
import Message from "../models/messages.model.js";

export const createStatus = async (req, res) => {
    try {
        const { content, contentType } = req.body;
        const userId = req.user?.userId;
        const file = req.file;
        let finalContentType = contentType || "text";
        let mediaUrl = null
        //handle file upload
        if (file) {
            const uploadfile = await uploadFileToCloudinary(file);
            if (!uploadfile?.secure_url) {
                return response(res, 400, "Failed to upload media");
            }
            mediaUrl = uploadfile?.secure_url;
            if (file.mimetype.startsWith("image")) {
                finalContentType = "image";
            } else if (file.mimetype.startsWith("video")) {
                finalContentType = "video";
            }
            else {
                return response(res, 400, "Unsupported file type")
            }
        } else if (content?.trim()) {
            finalContentType = "text"
        } else {
            return response(res, 400, "Message contain in required");
        }
        const expiresAt = new Date();
        expiresAt.setHours(expiresAt.getHours() + 24)

        const status = new Status({
            user: userId,
            content: mediaUrl || content,
            contentType: finalContentType,
            expiresAt,
        })
        await status.save();

        const populateStatus = await Status.findOne(status?._id)
            .populate("user", "username profilePicture")
            .populate("viewers", "username profilePicture");
        
        //  emit socket event
        if(req.io &&  req.socketUserMap){
            //boardcast to all connecting users except the creator
           for(const [connectingUserId,socketId] of req.socketUserMap){
               if(connectingUserId !== userId){
                req.io.to(socketId).emit("new_status",populateStatus)
               }
           }

        }

        return response(res, 200, "status upload succesfully!", populateStatus);
    } catch (error) {
        console.error(error);
        return response(res, 500, "Internal server error");
    }
}

export const getStatuses = async (req, res) => {
    try {
        const statuses = await Status.find({
            expiresAt: { $gt: new Date() }
        }).populate("viewers", "username profilePicture").sort({ createdAt: -1 })
        return response(res, 200,"statuses retrived successfully!! ",statuses)
    } catch (error) {
        console.error(error);
        return response(res, 500, "Internal server error");
    }
}

export const viewStatus = async (req, res) => {
    const { statusId } = req.params;
    const userId = req.user?.userId;
    try {
       const status = await Status.findById(statusId);
           let updatedStatus;
        if (!status) {
            return response(res, 404, "no status found")
        }
        if (!status.viewers.includes(statusId)) {
            status.viewers.push(userId)
            await status.save()

        updatedStatus = await Status.findById(statusId)
                .populate("user", "username profilePicture")
                .populate("viewers", "username profilePicture");

            // emit socket event 
             if(req.io &&  req.socketUserMap){
            //boardcast to all connecting users except the creator
            const statusOwnerSocketId =req.socketUserMap.get(status.user._id.toString())
            if(statusOwnerSocketId){
                const viewData ={
                    statusId,
                    viewerId:userId,
                    totalViewers:updatedStatus.viewers.length,
                    viewers:updatedStatus.viewers,
                }
              req.io.to(statusOwnerSocketId).emit("status_viewed",viewData);
            }else{
                 console.log("status owener not connected ");
            }
        }
        } else {
            console.log("user already viewed");
        }
        return response(res, 200, "status viewed successfully",updatedStatus)
    } catch (error) {
        console.error(error);
        return response(res, 500, "Internal server error");
    }
}



export const deleteStatus = async (req, res) => {
    const { statusId } = req.params;
    const userId = req.user?.userId;
    try {
        const status = await Status.findById(statusId)
        if (!status) {
            return response(res, 404, "no status found")
        }
        if (status.user.toString() !== userId) {
            return response(res, 400, "Not authorized to delete messages!! ");
        }
        await status.deleteOne();
      // emit socket event 
             if(req.io &&  req.socketUserMap){
            //boardcast to all connecting users except the creator
            for(const [connectingUserId,socketId] of req.socketUserMap){
               if(connectingUserId !== userId){
                req.io.to(socketId).emit("status_deleted",statusId)
               }
           }
            }

        return response(res, 200, "status deleted successfully")
    } catch (error) {
        console.error(error);
        return response(res, 500, "Internal server error");
    }
}