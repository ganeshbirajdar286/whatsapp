import { create } from "zustand";
import { subscribeWithSelector } from "zustand/middleware";

const useVedioCallStore = create(
  subscribeWithSelector((set, get) => ({
    // call state
    currentCall: null,
    incomingCall: null,
    isCallActive: false,
    callType: null, //video or audio

    // media state
    localStream: null,
    remoteStream: null,
    isVideoEnabled: true,
    isAudioEnabled: true,
    isCallModelOpen: false,

    // webrtc
    peerConnection: null,
    iceCandidatesQueue: [], //queue for ICE candidates
    callStatus: "idle", //idle,calling,ringing,connecting,connected,ended

    setCurrentCall: (call) => {
      set({ currentCall: call });
    },

    setincomingCall: (call) => {
      set({ incomingCall: call });
    },

    setCallActive: (call) => {
      set({ isCallActive: call });
    },

    setCallType: (type) => {
      set({ callType: type });
    },
 
    setLocalStream: (stream) => {
      set({ localStream: stream });
    },

    setRemoteStream: (stream) => {
      set({ remoteStream: stream });
    },

    setPeerConnection: (pc) => {
      set({ peerConnection: pc });
    },

    setCallModelOpen: (open) => {
      set({ isCallModelOpen: open });
    },

    setCallStatus: (status) => {
      set({ callStatus: status });
    },


    addIceCandidate: (candidate) => {
      const { iceCandidatesQueue } = get();
      set({ iceCandidatesQueue: [...iceCandidatesQueue, candidate] });
    },

    processQueueIceCandidates: async () => {
      // Get current peer connection and any stored ICE candidates from the Zustand store
      const { peerConnection, iceCandidatesQueue } = get();

      // Proceed only if:
      // 1️⃣ peerConnection exists
      // 2️⃣ remoteDescription is already set (so ICE candidates can be added safely)
      // 3️⃣ there are ICE candidates waiting in the queue
      if (
        peerConnection &&
        peerConnection.remoteDescription &&
        iceCandidatesQueue.length > 0
      ) {
        // Loop through all queued ICE candidates
        for (const candidate of iceCandidatesQueue) {
          try {
            // Convert the plain candidate object into an RTCIceCandidate
            // and add it to the peer connection
            await peerConnection.addIceCandidate(
              //peerConnection.addIceCandidate() Adds it so WebRTC can try that route
              new RTCIceCandidate(candidate) //RTCIceCandidate Converts that object into a WebRTC-native format
            );
          } catch (error) {
            // If something goes wrong while adding a candidate, log the error
            console.error("ICE candidate error", error);
          }
        }

        // Once all candidates have been added successfully,
        // clear the queue so they are not reprocessed later
        set({ iceCandidatesQueue: [] });
      }
    },

    toggleVideo: () => {
      const { localStream, isVideoEnabled } = get();
      if (localStream) {
        const videoTrack = localStream.getVideoTracks()[0];
        if (videoTrack) {
          videoTrack.enabled = !isVideoEnabled;
          // If camera is ON → turns it OFF
          //If camera is OFF → turns it ON
          //enabled = false pauses the video stream (it doesn’t stop the track permanently).
          set({ isVideoEnabled: !isVideoEnabled });
        }
      }
    },

    toggleAudio: () => {
      const { localStream, isAudioEnabled } = get();
      if (localStream) {
        const audioTrack = localStream.getAudioTracks()[0];
        if (audioTrack) {
          audioTrack.enabled = !isAudioEnabled;

          set({ isAudioEnabled: !isAudioEnabled });
        }
      }
    },

    endCall: () => {
      const { localStream, peerConnection } = get();
      if (localStream) {
        localStream.getTracks().forEach((track) => track.stop());
      }
      if (peerConnection) {
        peerConnection.close();
      }
      set({
        currentCall: null,
        incomingCall: null,
        isCallActive: false,
        callType: null,
        localStream: null,
        remoteStream: null,
        isVideoEnabled: true,
        isAudioEnabled: true,
        isCallModelOpen: false,
        peerConnection: null,
        iceCandidatesQueue: [],
        callStatus: "idle",
      });
    },

    clearIncomingCall:()=>{
      set({incomingCall:null});
    }
  }))
);

export default useVedioCallStore;
