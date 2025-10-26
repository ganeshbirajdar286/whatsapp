import React, { useEffect, useMemo, useRef } from "react";
import useVideoCallStore from "../../store/videoCallStore";
import useUserStore from "../../store/useUserStore";
import useThemeStore from "../../store/themeStore";
import { motion } from "framer-motion";
import {
  FaMicrophone,
  FaMicrophoneSlash,
  FaPhoneSlash,
  FaTimes,
  FaVideo,
  FaVideoSlash,
} from "react-icons/fa";

function VideoCallModel({ socket }) {
  const localVideoRef = useRef(null);
  const remoteVideoRef = useRef(null);

  // Debug socket connection
  useEffect(() => {
    if (socket) {
      console.log("🔌 Socket in VideoCallModel:", {
        connected: socket.connected,
        id: socket.id,
      });
      
      if (!socket.connected) {
        console.warn("⚠️ Socket is NOT connected!");
      }
    } else {
      console.error("❌ Socket is undefined!");
    }
  }, [socket]);

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
  const { theme } = useThemeStore();

  const rtcConfiguration = {
    iceServers: [
      { urls: "stun:stun.l.google.com:19302" },
      { urls: "stun:stun.l.google.com:5349" },
      { urls: "stun:stun1.l.google.com:3478" },
      { urls: "stun:stun1.l.google.com:5349" },
      { urls: "stun:stun2.l.google.com:19302" },
      { urls: "stun:stun2.l.google.com:5349" },
      { urls: "stun:stun3.l.google.com:3478" },
      { urls: "stun:stun3.l.google.com:5349" },
      { urls: "stun:stun4.l.google.com:19302" },
      { urls: "stun:stun4.l.google.com:5349" },
    ],
  };

  // Display info
  const displayInfo = useMemo(() => {
    if (incomingCall && !isCallActive) {
      return {
        name: incomingCall?.callerName,
        avatar: incomingCall?.callerAvatar,
      };
    } else if (currentCall) {
      return {
        name: currentCall?.participantName,
        avatar: currentCall?.participantAvatar,
      };
    }
    return null;
  }, [incomingCall, currentCall, isCallActive]);

  // Connection detection
  useEffect(() => {
    if (peerConnection && remoteStream) {
      console.log("✅ Both peer connection and remote stream available");
      console.log("📊 Remote stream details:", {
        id: remoteStream.id,
        active: remoteStream.active,
        tracks: remoteStream.getTracks().map(t => ({
          kind: t.kind,
          enabled: t.enabled,
          readyState: t.readyState,
          id: t.id.slice(0, 8)
        }))
      });
      setCallStatus("connected");
      setCallActive(true);
    }
  }, [peerConnection, remoteStream, setCallActive, setCallStatus]);

  // Set up local stream
  useEffect(() => {
    if (localStream && localVideoRef.current) {
      console.log("🎥 Setting local video srcObject");
      localVideoRef.current.srcObject = localStream;
      // Force play
      localVideoRef.current.play().catch(err => {
        console.error("Error playing local video:", err);
      });
    }
  }, [localStream]);

  // Set up remote stream
  useEffect(() => {
    if (remoteStream && remoteVideoRef.current) {
      console.log("🎥 Setting remote video srcObject", {
        tracks: remoteStream.getTracks().length,
        video: remoteStream.getVideoTracks().length,
        audio: remoteStream.getAudioTracks().length
      });
      remoteVideoRef.current.srcObject = remoteStream;
      // Force play
      remoteVideoRef.current.play().catch(err => {
        console.error("Error playing remote video:", err);
      });
    }
  }, [remoteStream]);

  // FIXED: Initialize media stream - NOW RETURNS THE STREAM
  const initializeMedia = async (video = true) => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: video ? { width: 640, height: 480 } : false,
        audio: true,
      });
      console.log("✅ Local media stream acquired:", stream.getTracks());
      setLocalStream(stream);
      return stream; // CRITICAL FIX: Return the stream
    } catch (error) {
      console.error("❌ Error accessing media devices:", error);
      throw error;
    }
  };

  // FIXED: Create peer connection with proper stream handling
  const createPeerConnection = (stream, role) => {
    console.log(`🔧 Creating peer connection for ${role}`);
    
    if (!stream) {
      console.error("❌ No stream provided to createPeerConnection!");
      throw new Error("Stream is required");
    }

    const pc = new RTCPeerConnection(rtcConfiguration);

    // Add local tracks using addTrack (ensures proper stream association)
    stream.getTracks().forEach((track) => {
      console.log(`📤 ${role} adding ${track.kind} track (${track.id.slice(0, 8)}...)`);
      const sender = pc.addTrack(track, stream);
      console.log(`✅ Track added, sender:`, sender.track?.kind);
    });

    // Log all senders
    console.log(`📊 ${role} total senders:`, pc.getSenders().length);

    // Handle ICE candidates
    pc.onicecandidate = (event) => {
      if (event.candidate && socket) {
        const participantId = currentCall?.participantId || incomingCall?.callerId;
        const callId = currentCall?.callId || incomingCall?.callId;
        
        if (participantId && callId) {
          console.log(`🧊 ${role} sending ICE candidate`);
          socket.emit("webrtc_ice_candidate", {
            candidate: event.candidate,
            receiverId: participantId,
            callId: callId,
          });
        }
      }
    };

    // Handle remote stream - FIXED: Accumulate all tracks
    const remoteStreamInstance = new MediaStream();
    
    pc.ontrack = (event) => {
      console.log(`📥 ${role} received remote ${event.track.kind} track (${event.track.id.slice(0, 8)}...)`);
      console.log(`📊 Track details:`, {
        kind: event.track.kind,
        enabled: event.track.enabled,
        readyState: event.track.readyState,
        muted: event.track.muted
      });
      
      // Add track to our remote stream
      if (!remoteStreamInstance.getTracks().find(t => t.id === event.track.id)) {
        remoteStreamInstance.addTrack(event.track);
        console.log(`✅ Track added to remote stream. Total tracks: ${remoteStreamInstance.getTracks().length}`);
        
        // Update the state with the accumulated stream
        setRemoteStream(remoteStreamInstance);
      }
    };

    // Connection state monitoring
    pc.onconnectionstatechange = () => {
      console.log(`🔌 ${role} connection state:`, pc.connectionState);
      
      if (pc.connectionState === "connected") {
        console.log("✅ Peer connection established!");
        setCallStatus("connected");
        setCallActive(true);
      } else if (pc.connectionState === "failed") {
        console.error("❌ Peer connection failed!");
        setCallStatus("failed");
        setTimeout(handleEndCall, 2000);
      } else if (pc.connectionState === "disconnected") {
        console.warn("⚠️ Peer connection disconnected");
      }
    };

    pc.oniceconnectionstatechange = () => {
      console.log(`🧊 ${role} ICE state:`, pc.iceConnectionState);
      if (pc.iceConnectionState === "connected" || pc.iceConnectionState === "completed") {
        console.log("✅ ICE connection successful!");
      }
    };

    pc.onsignalingstatechange = () => {
      console.log(`📡 ${role} signaling state:`, pc.signalingState);
    };

    setPeerConnection(pc);
    return pc;
  };

  // FIXED: Caller initialization with proper async handling
  const initializeCallerCall = async () => {
    try {
      console.log("📞 Initializing caller flow...");
      setCallStatus("connecting");

      // Get media and WAIT for it
      const stream = await initializeMedia(callType === "video");
      
      if (!stream) {
        throw new Error("Failed to get media stream");
      }

      console.log("✅ Creating peer connection...");
      const pc = createPeerConnection(stream, "CALLER");

      console.log("✅ Creating offer...");
      const offer = await pc.createOffer({
        offerToReceiveAudio: true,
        offerToReceiveVideo: callType === "video",
      });

      await pc.setLocalDescription(offer);
      console.log("✅ Sending offer to receiver...");

      socket.emit("webrtc_offer", {
        offer,
        receiverId: currentCall?.participantId,
        callId: currentCall?.callId,
      });
    } catch (error) {
      console.error("❌ CALLER ERROR:", error);
      setCallStatus("failed");
      setTimeout(handleEndCall, 2000);
    }
  };

  // FIXED: Answer call with proper async handling
  const handleAnswerCall = async () => {
    try {
      console.log("📞 Answering call...");
      console.log("📋 Incoming call details:", incomingCall);
      setCallStatus("connecting");

      // Get media and WAIT for it
      const stream = await initializeMedia(callType === "video");
      
      if (!stream) {
        throw new Error("Failed to get media stream");
      }

      console.log("✅ Creating peer connection...");
      createPeerConnection(stream, "RECEIVER");

      console.log("✅ Accepting call...");
      
      const acceptData = {
        callerId: incomingCall?.callerId,
        callId: incomingCall?.callId,
        receiverInfo: {
          username: user?.username,
          profilePicture: user?.profilePicture,
        },
      };
      
      console.log("📤 Emitting accept_call:", acceptData);
      socket.emit("accept_call", acceptData);

      // Signal receiver is ready
      const readyData = {
        callerId: incomingCall?.callerId,
        callId: incomingCall?.callId,
      };
      
      console.log("📤 Emitting receiver_ready:", readyData);
      socket.emit("receiver_ready", readyData);

      setCurrentCall({
        callId: incomingCall?.callId,
        participantId: incomingCall?.callerId,
        participantName: incomingCall?.callerName,
        participantAvatar: incomingCall?.callerAvatar,
      });

      clearIncomingCall();
      console.log("✅ Call answer process completed");
    } catch (error) {
      console.error("❌ Receiver Error:", error);
      handleEndCall();
    }
  };

  // Reject call
  const handleRejectedCall = () => {
    if (incomingCall) {
      socket.emit("reject_call", {
        callerId: incomingCall?.callerId,
        callId: incomingCall?.callId,
      });
    }

    if (localStream) {
      localStream.getTracks().forEach((track) => track.stop());
      setLocalStream(null);
    }

    if (remoteStream) {
      remoteStream.getTracks().forEach((track) => track.stop());
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

  // End call
  const handleEndCall = () => {
    const participantId = currentCall?.participantId || incomingCall?.callerId;
    const callId = currentCall?.callId || incomingCall?.callId;

    if (participantId && callId) {
      socket.emit("end_call", {
        callId: callId,
        participantId: participantId,
      });
    }

    if (localStream) {
      localStream.getTracks().forEach((track) => track.stop());
      setLocalStream(null);
    }

    if (remoteStream) {
      remoteStream.getTracks().forEach((track) => track.stop());
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

  // Socket event listeners
  useEffect(() => {
    if (!socket) return;
    
    console.log("🔌 Registering socket event listeners");

    const handleCallAccepted = ({ receiverName }) => {
      console.log("✅ Call accepted by", receiverName);
      // Don't initialize here - wait for receiver_ready
    };

    const handleReceiverReady = ({ callId }) => {
      console.log("✅✅✅ RECEIVER_READY EVENT RECEIVED ✅✅✅");
      console.log("📋 Received callId:", callId);
      console.log("📋 Current call state:", JSON.stringify(currentCall, null, 2));
      console.log("📋 Incoming call state:", JSON.stringify(incomingCall, null, 2));
      console.log("📋 Call status:", callStatus);
      console.log("📋 Is call active:", isCallActive);
      
      if (!currentCall) {
        console.error("❌ currentCall is NULL! Cannot proceed.");
        return;
      }
      
      if (currentCall.callId !== callId) {
        console.error("❌ CallId mismatch!", {
          receivedCallId: callId,
          currentCallId: currentCall.callId
        });
        return;
      }
      
      console.log("✅ All checks passed, initializing caller...");
      setTimeout(() => {
        console.log("🚀 Executing initializeCallerCall NOW");
        initializeCallerCall();
      }, 500);
    };

    const handleCallRejected = () => {
      console.log("❌ Call rejected");
      setCallStatus("rejected");
      setTimeout(() => {
        endCall();
        clearIncomingCall();
        setCallModelOpen(false);
      }, 1500);
    };

    const handleCallEnded = () => {
      console.log("📞 Call ended by other user");
      
      if (localStream) {
        localStream.getTracks().forEach((track) => track.stop());
        setLocalStream(null);
      }

      if (remoteStream) {
        remoteStream.getTracks().forEach((track) => track.stop());
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

    const handleWebRTCOffer = async ({ offer, senderId, callId }) => {
      console.log("📨 Received WebRTC offer");
      
      if (!peerConnection) {
        console.error("❌ No peer connection!");
        return;
      }

      try {
        await peerConnection.setRemoteDescription(new RTCSessionDescription(offer));
        console.log("✅ Remote description set");

        await processQueueIceCandidates();

        const answer = await peerConnection.createAnswer();
        await peerConnection.setLocalDescription(answer);

        socket.emit("webrtc_answer", {
          answer,
          receiverId: senderId,
          callId,
        });
        console.log("📤 Answer sent");
      } catch (error) {
        console.error("❌ Offer handling error:", error);
      }
    };

    const handleWebRTCAnswer = async ({ answer, senderId, callId }) => {
      console.log("📨 Received WebRTC answer");
      
      if (!peerConnection) {
        console.error("❌ No peer connection!");
        return;
      }

      if (peerConnection.signalingState === "closed") {
        console.log("❌ Peer connection closed");
        return;
      }

      try {
        await peerConnection.setRemoteDescription(new RTCSessionDescription(answer));
        console.log("✅ Remote description set from answer");

        await processQueueIceCandidates();
      } catch (error) {
        console.error("❌ Answer handling error:", error);
      }
    };

    const handleWebRTCIceCandidates = async ({ candidate, senderId }) => {
      if (peerConnection && peerConnection.signalingState !== "closed") {
        if (peerConnection.remoteDescription) {
          try {
            await peerConnection.addIceCandidate(new RTCIceCandidate(candidate));
            console.log("✅ ICE candidate added");
          } catch (error) {
            console.error("❌ ICE candidate error:", error);
          }
        } else {
          console.log("⏳ Queuing ICE candidate");
          addIceCandidate(candidate);
        }
      }
    };

    socket.on("call_accepted", handleCallAccepted);
    socket.on("receiver_ready", handleReceiverReady);
    socket.on("call_rejected", handleCallRejected);
    socket.on("call_ended", handleCallEnded);
    socket.on("webrtc_offer", handleWebRTCOffer);
    socket.on("webrtc_answer", handleWebRTCAnswer);
    socket.on("webrtc_ice_candidate", handleWebRTCIceCandidates);
    
    // Verify registration
    console.log("✅ All socket event listeners registered:", [
      "call_accepted",
      "receiver_ready", 
      "call_rejected",
      "call_ended",
      "webrtc_offer",
      "webrtc_answer",
      "webrtc_ice_candidate"
    ]);

    return () => {
      console.log("🔌 Unregistering socket event listeners");
      socket.off("call_accepted", handleCallAccepted);
      socket.off("receiver_ready", handleReceiverReady);
      socket.off("call_rejected", handleCallRejected);
      socket.off("call_ended", handleCallEnded);
      socket.off("webrtc_offer", handleWebRTCOffer);
      socket.off("webrtc_answer", handleWebRTCAnswer);
      socket.off("webrtc_ice_candidate", handleWebRTCIceCandidates);
    };
  }, [socket, peerConnection, currentCall, incomingCall, user]);

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
        {/* Incoming call UI */}
        {incomingCall && !isCallActive && (
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex flex-col items-center justify-center h-full text-white"
          >
            <div className="text-center mb-8">
              <div className="w-32 h-32 rounded-full bg-gray-300 mx-auto mb-4 overflow-hidden">
                <img
                  src={displayInfo?.avatar}
                  alt={displayInfo?.name}
                  className="w-full h-full object-cover"
                />
              </div>
              <h2 className="text-2xl font-semibold mb-2 text-white">
                {displayInfo?.name}
              </h2>
              <p className="text-lg text-gray-300">
                Incoming {callType} call...
              </p>
            </div>
            <div className="flex space-x-6">
              <motion.button
                whileTap={{ scale: 0.9 }}
                onClick={handleRejectedCall}
                className="w-16 h-16 bg-red-500 hover:bg-red-600 rounded-full flex items-center justify-center shadow-lg"
              >
                <FaPhoneSlash className="w-6 h-6" />
              </motion.button>
              <motion.button
                whileTap={{ scale: 0.9 }}
                onClick={handleAnswerCall}
                className="w-16 h-16 bg-green-500 hover:bg-green-600 rounded-full flex items-center justify-center shadow-lg"
              >
                <FaVideo className="w-6 h-6" />
              </motion.button>
            </div>
          </motion.div>
        )}

        {/* Active call UI */}
        {shouldShowActiveCall && (
          <div className="relative w-full h-full overflow-hidden">
            {/* Remote video - Always render but hide if no stream */}
            <motion.video
              ref={remoteVideoRef}
              autoPlay
              playsInline
              className={`w-full h-full object-cover bg-gray-800 ${
                callType === "video" && remoteStream ? "block" : "hidden"
              }`}
              initial={{ opacity: 0 }}
              animate={{ opacity: remoteStream ? 1 : 0 }}
              transition={{ duration: 0.6 }}
              onLoadedMetadata={() => console.log("🎬 Remote video loaded")}
              onPlay={() => console.log("▶️ Remote video playing")}
            />

            {/* Fallback avatar/status */}
            {(!remoteStream || callType !== "video") && (
              <motion.div
                className="w-full h-full bg-gray-900 flex items-center justify-center"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
              >
                <div className="text-center">
                  <div className="w-32 h-32 rounded-full bg-gray-700 mx-auto mb-4 overflow-hidden">
                    <img
                      src={displayInfo?.avatar}
                      alt={displayInfo?.name}
                      className="w-full h-full object-cover"
                    />
                  </div>
                  <p className="text-white text-lg">
                    {callStatus === "calling"
                      ? `Calling ${displayInfo?.name}...`
                      : callStatus === "connecting"
                      ? "Connecting..."
                      : callStatus === "connected"
                      ? displayInfo?.name
                      : callStatus === "failed"
                      ? "Connection Failed"
                      : callStatus === "rejected"
                      ? "Call Rejected"
                      : displayInfo?.name}
                  </p>
                </div>
              </motion.div>
            )}

            {/* Local video (PiP) - Always render but hide if no stream */}
            <motion.video
              ref={localVideoRef}
              autoPlay
              muted
              playsInline
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: localStream ? 1 : 0, scale: localStream ? 1 : 0.9 }}
              className={`absolute bottom-6 right-6 w-44 h-32 rounded-xl border border-white/30 shadow-lg object-cover ${
                callType === "video" && localStream ? "block" : "hidden"
              }`}
              onLoadedMetadata={() => console.log("🎬 Local video loaded")}
              onPlay={() => console.log("▶️ Local video playing")}
            />

            {/* Call status */}
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              className="absolute top-4 left-4"
            >
              <div className="px-4 py-2 rounded-full bg-gray-800/80 text-white shadow-md">
                <p className="text-sm font-medium capitalize">{callStatus}</p>
              </div>
            </motion.div>

            {/* Call controls */}
            <motion.div
              initial={{ opacity: 0, y: 40 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="absolute bottom-6 left-1/2 -translate-x-1/2 flex gap-6 bg-black/50 backdrop-blur-lg px-6 py-4 rounded-full shadow-xl"
            >
              {callType === "video" && (
                <motion.button
                  whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 0.9 }}
                  onClick={toggleVideo}
                  className={`w-12 h-12 rounded-full flex items-center justify-center ${
                    isVideoEnabled
                      ? "bg-gray-600 hover:bg-gray-700 text-white"
                      : "bg-red-500 hover:bg-red-600 text-white"
                  }`}
                >
                  {isVideoEnabled ? (
                    <FaVideo className="w-5 h-5" />
                  ) : (
                    <FaVideoSlash className="w-5 h-5" />
                  )}
                </motion.button>
              )}

              <motion.button
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.9 }}
                onClick={toggleAudio}
                className={`w-12 h-12 rounded-full flex items-center justify-center ${
                  isAudioEnabled
                    ? "bg-gray-600 hover:bg-gray-700 text-white"
                    : "bg-red-500 hover:bg-red-600 text-white"
                }`}
              >
                {isAudioEnabled ? (
                  <FaMicrophone className="w-5 h-5" />
                ) : (
                  <FaMicrophoneSlash className="w-5 h-5" />
                )}
              </motion.button>

              <motion.button
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.9 }}
                onClick={handleEndCall}
                className="w-12 h-12 bg-red-500 hover:bg-red-600 rounded-full flex items-center justify-center text-white"
              >
                <FaPhoneSlash className="w-5 h-5" />
              </motion.button>
            </motion.div>
          </div>
        )}
      </motion.div>
    </div>
  );
}

export default VideoCallModel;