import React, { useEffect, useMemo, useRef } from "react";
import useVideoCallStore from "../../store/videoCallStore"; // Zustand store for managing call state
import useUserStore from "../../store/useUserStore"; // For user info
import useThemeStore from "../../store/themeStore"; // App theme store
import { motion } from "framer-motion"; // Animation library
import {
  FaMicrophone,
  FaMicrophoneSlash,
  FaPhoneSlash,
  FaVideo,
  FaVideoSlash,
} from "react-icons/fa";

function VideoCallModel({ socket }) {
  const localVideoRef = useRef(null);   // 🎥 Local user's video
  const remoteVideoRef = useRef(null);  // 📺 Other user's video

  // 🧩 Pull states & actions from Zustand store
  const {
    setCurrentCall,
    setincomingCall,
    setCallType,
    setCallModelOpen,
    endCall,
    setCallStatus,
    setCallActive,
    setLocalStream,
    setRemoteStream,
    setPeerConnection,
    addIceCandidate,
    processQueueIceCandidates,
    toggleVideo,
    toggleAudio,
    clearIncomingCall,
    currentCall,
    incomingCall,
    isCallActive,
    callType,
    localStream,
    remoteStream,
    isVideoEnabled,
    isAudioEnabled,
    isCallModelOpen,
    peerConnection,
    iceCandidatesQueue,
    callStatus,
  } = useVideoCallStore();

  const { user } = useUserStore();

  // ⚙️ WebRTC STUN server configuration (needed for NAT traversal)
  const rtcConfiguration = {
    iceServers: [
      { urls: "stun:stun.l.google.com:19302" },
      { urls: "stun:stun1.l.google.com:3478" },
      { urls: "stun:stun2.l.google.com:19302" },
      { urls: "stun:stun3.l.google.com:3478" },
      { urls: "stun:stun4.l.google.com:19302" },
    ],
  };

  // 👤 Determine who to display (caller or receiver)
  const displayInfo = useMemo(() => {
    if (incomingCall && !isCallActive) {
      // Receiver: show caller info
      return {
        name: incomingCall?.callerName,
        avatar: incomingCall?.callerAvatar,
      };
    } else if (currentCall) {
      // Caller or Active: show participant info
      return {
        name: currentCall?.participantName,
        avatar: currentCall?.participantAvatar,
      };
    }
    return null;
  }, [incomingCall, currentCall, isCallActive]);

  // 🎥 Attach local video stream
  useEffect(() => {
    if (localStream && localVideoRef.current) {
      localVideoRef.current.srcObject = localStream;
      localVideoRef.current.play().catch(err => console.error("Local video error:", err));
    }
  }, [localStream]);

  // 📺 Attach remote video stream
  useEffect(() => {
    if (remoteStream && remoteVideoRef.current) {
      remoteVideoRef.current.srcObject = remoteStream;
      remoteVideoRef.current.play().catch(err => console.error("Remote video error:", err));
    }
  }, [remoteStream]);

  // 🎙️ Get microphone & camera
  const initializeMedia = async (video = true) => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: video ? { width: 640, height: 480 } : false,
        audio: true,
      });
      setLocalStream(stream);
      return stream;
    } catch (error) {
      console.error("Media access error:", error);
      throw error;
    }
  };

  // 🔧 Create a WebRTC peer connection
  const createPeerConnection = (stream, role) => {
    const pc = new RTCPeerConnection(rtcConfiguration);

    // 🎤 Add local audio/video tracks
    stream.getTracks().forEach((track) => {
      pc.addTrack(track, stream);
    });

    // 🧊 When local ICE candidates are found — send via socket
    pc.onicecandidate = (event) => {
      if (event.candidate && socket) {
        const participantId = currentCall?.participantId || incomingCall?.callerId;
        const callId = currentCall?.callId || incomingCall?.callId;

        socket.emit("webrtc_ice_candidate", {
          candidate: event.candidate,
          receiverId: participantId,
          callId,
        });
      }
    };

    // 📥 When remote tracks are received, update remote stream
    const remoteStreamInstance = new MediaStream();
    pc.ontrack = (event) => {
      remoteStreamInstance.addTrack(event.track);
      setRemoteStream(remoteStreamInstance);
    };

    // 🔌 Monitor connection status
    pc.onconnectionstatechange = () => {
      if (pc.connectionState === "connected") {
        setCallStatus("connected");
        setCallActive(true);
      } else if (pc.connectionState === "failed") {
        setCallStatus("failed");
        setTimeout(handleEndCall, 2000);
      }
    };

    setPeerConnection(pc);
    return pc;
  };

  // 📞 Caller → starts a new call
  const initializeCallerCall = async () => {
    try {
      setCallStatus("connecting");

      const stream = await initializeMedia(callType === "video");
      const pc = createPeerConnection(stream, "CALLER");

      // Create SDP Offer (Caller)
      const offer = await pc.createOffer({
        offerToReceiveAudio: true,
        offerToReceiveVideo: callType === "video",
      });

      await pc.setLocalDescription(offer);

      // Send offer via socket
      socket.emit("webrtc_offer", {
        offer,
        receiverId: currentCall?.participantId,
        callId: currentCall?.callId,
      });
    } catch (error) {
      setCallStatus("failed");
      setTimeout(handleEndCall, 2000);
    }
  };

  // 📞 Receiver → answers an incoming call
  const handleAnswerCall = async () => {
    try {
      setCallStatus("connecting");

      // Get mic/camera
      const stream = await initializeMedia(callType === "video");
      createPeerConnection(stream, "RECEIVER");

      // Notify caller the call was accepted
      socket.emit("accept_call", {
        callerId: incomingCall?.callerId,
        callId: incomingCall?.callId,
        receiverInfo: {
          username: user?.username,
          profilePicture: user?.profilePicture,
        },
      });

      // Let caller know receiver is ready
      socket.emit("receiver_ready", {
        callerId: incomingCall?.callerId,
        callId: incomingCall?.callId,
      });

      // Save current call info
      setCurrentCall({
        callId: incomingCall?.callId,
        participantId: incomingCall?.callerId,
        participantName: incomingCall?.callerName,
        participantAvatar: incomingCall?.callerAvatar,
      });

      clearIncomingCall();
    } catch (error) {
      handleEndCall();
    }
  };

  // 🚫 Receiver → rejects incoming call
  const handleRejectedCall = () => {
    socket.emit("reject_call", {
      callerId: incomingCall?.callerId,
      callId: incomingCall?.callId,
    });
    cleanupCall();
  };

  // 📴 Common cleanup for both caller & receiver
  const handleEndCall = () => {
    const participantId = currentCall?.participantId || incomingCall?.callerId;
    const callId = currentCall?.callId || incomingCall?.callId;

    socket.emit("end_call", { callId, participantId });
    cleanupCall();
  };

  // 🧹 Utility: stop streams & reset state
  const cleanupCall = () => {
    if (localStream) {
      localStream.getTracks().forEach((t) => t.stop());
      setLocalStream(null);
    }
    if (remoteStream) {
      remoteStream.getTracks().forEach((t) => t.stop());
      setRemoteStream(null);
    }
    if (peerConnection) {
      peerConnection.close();
      setPeerConnection(null);
    }
    endCall();
    clearIncomingCall();
    setCallModelOpen(false);
    setCallActive(false);
    setCallStatus(null);
  };

  // 🧠 Socket event listeners (signaling between Caller & Receiver)
  useEffect(() => {
    if (!socket) return;

    // ✅ Receiver tells Caller they're ready
    const handleReceiverReady = ({ callId }) => {
      if (currentCall?.callId !== callId) return;
      initializeCallerCall(); // Caller proceeds with offer creation
    };

    // ✅ Caller receives answer from Receiver
    const handleWebRTCAnswer = async ({ answer }) => {
      if (!peerConnection) return;
      await peerConnection.setRemoteDescription(new RTCSessionDescription(answer));
      await processQueueIceCandidates();
    };

    // ✅ Receiver gets offer from Caller
    const handleWebRTCOffer = async ({ offer, senderId, callId }) => {
      if (!peerConnection) return;
      await peerConnection.setRemoteDescription(new RTCSessionDescription(offer));
      await processQueueIceCandidates();

      const answer = await peerConnection.createAnswer();
      await peerConnection.setLocalDescription(answer);

      // Send back answer
      socket.emit("webrtc_answer", {
        answer,
        receiverId: senderId,
        callId,
      });
    };

    // ✅ Both: Handle ICE candidates from the other peer
    const handleWebRTCIceCandidates = async ({ candidate }) => {
      if (peerConnection && peerConnection.remoteDescription) {
        await peerConnection.addIceCandidate(new RTCIceCandidate(candidate));
      } else {
        addIceCandidate(candidate); // Queue it
      }
    };

    // ✅ Call rejected or ended (both sides cleanup)
    socket.on("call_rejected", cleanupCall);
    socket.on("call_ended", cleanupCall);
    socket.on("receiver_ready", handleReceiverReady);
    socket.on("webrtc_offer", handleWebRTCOffer);
    socket.on("webrtc_answer", handleWebRTCAnswer);
    socket.on("webrtc_ice_candidate", handleWebRTCIceCandidates);

    return () => {
      socket.off("receiver_ready", handleReceiverReady);
      socket.off("webrtc_offer", handleWebRTCOffer);
      socket.off("webrtc_answer", handleWebRTCAnswer);
      socket.off("webrtc_ice_candidate", handleWebRTCIceCandidates);
      socket.off("call_rejected", cleanupCall);
      socket.off("call_ended", cleanupCall);
    };
  }, [socket, peerConnection, currentCall, incomingCall]);

  // 🎨 UI
  if (!isCallModelOpen && !incomingCall) return null;

  const shouldShowActiveCall =
    isCallActive || callStatus === "calling" || callStatus === "connecting";

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-75">
      <motion.div
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        className="relative w-full max-w-5xl aspect-video bg-gray-900/50 backdrop-blur-lg rounded-3xl shadow-2xl border border-gray-700 overflow-hidden"
      >
        {/* 📲 Incoming call screen (Receiver only) */}
        {incomingCall && !isCallActive && (
          <div className="flex flex-col items-center justify-center h-full text-white">
            <img
              src={displayInfo?.avatar}
              alt={displayInfo?.name}
              className="w-32 h-32 rounded-full mb-4"
            />
            <h2 className="text-2xl font-semibold">{displayInfo?.name}</h2>
            <p className="text-lg text-gray-300">
              Incoming {callType} call...
            </p>
            <div className="flex space-x-6 mt-6">
              <button onClick={handleRejectedCall} className="bg-red-500 w-16 h-16 rounded-full">
                <FaPhoneSlash className="w-6 h-6" />
              </button>
              <button onClick={handleAnswerCall} className="bg-green-500 w-16 h-16 rounded-full">
                <FaVideo className="w-6 h-6" />
              </button>
            </div>
          </div>
        )}

        {/* 🎥 Active call screen (Caller + Receiver) */}
        {shouldShowActiveCall && (
          <div className="relative w-full h-full overflow-hidden">
            {/* Remote video */}
            <motion.video
              ref={remoteVideoRef}
              autoPlay
              playsInline
              className={`w-full h-full object-cover ${
                callType === "video" && remoteStream ? "block" : "hidden"
              }`}
            />

            {/* Local video (picture-in-picture) */}
            <motion.video
              ref={localVideoRef}
              autoPlay
              muted
              playsInline
              className={`absolute bottom-6 right-6 w-44 h-32 rounded-xl border object-cover ${
                callType === "video" && localStream ? "block" : "hidden"
              }`}
            />

            {/* Call controls (Both sides) */}
            <div className="absolute bottom-6 left-1/2 -translate-x-1/2 flex gap-6 bg-black/50 backdrop-blur-lg px-6 py-4 rounded-full">
              {callType === "video" && (
                <button onClick={toggleVideo} className="w-12 h-12 bg-gray-600 rounded-full">
                  {isVideoEnabled ? <FaVideo /> : <FaVideoSlash />}
                </button>
              )}
              <button onClick={toggleAudio} className="w-12 h-12 bg-gray-600 rounded-full">
                {isAudioEnabled ? <FaMicrophone /> : <FaMicrophoneSlash />}
              </button>
              <button onClick={handleEndCall} className="w-12 h-12 bg-red-500 rounded-full">
                <FaPhoneSlash />
              </button>
            </div>
          </div>
        )}
      </motion.div>
    </div>
  );
}

export default VideoCallModel;
