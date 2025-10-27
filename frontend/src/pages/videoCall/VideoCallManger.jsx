import React, { useCallback, useEffect } from "react";
import useVideoCallStore from "../../store/videoCallStore";
import useUserStore from "../../store/useUserStore";
import VideoCallModel from "./VideoCallModel";

const VideoCallManger = ({ socket }) => {
  const {
    setCurrentCall,
    setincomingCall,
    setCallType,
    setCallModelOpen,
    endCall,
    setCallStatus,
  } = useVideoCallStore();
  const { user } = useUserStore();

  useEffect(() => {
    if (!socket) return;

    // Handle incoming call
    const handleIncomingcall = ({
      callId,
      callerId,
      callerName,
      callerAvatar,
      callType,
    }) => {
      console.log("📞 Incoming call received:", {
        callId,
        callerId,
        callerName,
        callType,
      });

      setincomingCall({
        callId,
        callerId, // IMPORTANT: Make sure callerId is included
        callerName,
        callerAvatar,
      });
      setCallType(callType);
      setCallModelOpen(true);
      setCallStatus("ringing");
    };

    // Handle call failed
    const handleCallEnded = ({ reason }) => {
      console.log("❌ Call failed:", reason);
      setCallStatus("failed");
      setTimeout(() => {
        endCall();
      }, 2000);
    };

    socket.on("incoming_call", handleIncomingcall);
    socket.on("call_failed", handleCallEnded);

    return () => {
      socket.off("incoming_call", handleIncomingcall);
      socket.off("call_failed", handleCallEnded);
    };
  }, [
    socket,
    setincomingCall,
    setCallType,
    setCallModelOpen,
    setCallStatus,
    endCall,
  ]);

  // Memoized function to initiate call
  const initiateCall = useCallback(
    (receiverId, receiverName, receiverAvatar, callType = "video") => {
      const callId = `${user?._id}-${receiverId}-${Date.now()}`;
      const callData = {
        callId,
        participantId: receiverId,
        participantName: receiverName,
        participantAvatar: receiverAvatar,
      };

      console.log("📞 Initiating call:", callData);

      // IMPORTANT: Set current call BEFORE emitting
      setCurrentCall(callData);
      setCallType(callType);
      setCallModelOpen(true);
      setCallStatus("calling");

      // Emit the call initiate
      socket.emit("initiate_call", {
        callerId: user?._id,
        receiverId,
        callType,
        callId, // IMPORTANT: Send the callId to backend
        callerInfo: {
          username: user.username,
          profilePicture: user?.profilePicture,
        },
      });

      console.log("✅ Call initiation complete, currentCall set:", callData);
    },
    [user, socket, setCurrentCall, setCallType, setCallModelOpen, setCallStatus]
  );

  // Expose the initiate call function to store
  useEffect(() => {
    console.log("🔧 Exposing initiateCall to store");
    useVideoCallStore.getState().initiateCall = initiateCall;
  }, [initiateCall]);

  return (
    <>
      <VideoCallModel socket={socket} />
    </>
  );
};

export default VideoCallManger;