import React, { useEffect, useRef, useState } from 'react';
import io from 'socket.io-client';
import '../styles/VideoCall.css';

const VideoCall = ({ roomId, userName, onEndCall }) => {
  const [localStream, setLocalStream] = useState(null);
  const [remoteStream, setRemoteStream] = useState(null);
  const [isMuted, setIsMuted] = useState(false);
  const [isVideoOff, setIsVideoOff] = useState(false);
  const [isConnected, setIsConnected] = useState(false);
  
  const localVideoRef = useRef(null);
  const remoteVideoRef = useRef(null);
  const peerConnectionRef = useRef(null);
  const socketRef = useRef(null);

  // STUN server configuration
  const configuration = {
    iceServers: [
      { urls: 'stun:stun.l.google.com:19302' },
      { urls: 'stun:stun1.l.google.com:19302' }
    ]
  };

  useEffect(() => {
    // Initialize socket connection
    socketRef.current = io('http://localhost:5050');

    // Get user media (camera and microphone)
    navigator.mediaDevices.getUserMedia({ 
      video: true, 
      audio: true 
    })
    .then(stream => {
      setLocalStream(stream);
      if (localVideoRef.current) {
        localVideoRef.current.srcObject = stream;
      }

      // Join room
      socketRef.current.emit('join-room', roomId, userName);
    })
    .catch(error => {
      console.error('Error accessing media devices:', error);
      alert('Could not access camera/microphone. Please check permissions.');
    });

    // Socket event listeners
    socketRef.current.on('user-connected', (userId, socketId) => {
      console.log('User connected:', userId);
      createOffer(socketId);
    });

    socketRef.current.on('offer', async (offer, socketId) => {
      console.log('Received offer from:', socketId);
      await createAnswer(offer, socketId);
    });

    socketRef.current.on('answer', async (answer) => {
      console.log('Received answer');
      if (peerConnectionRef.current) {
        await peerConnectionRef.current.setRemoteDescription(new RTCSessionDescription(answer));
        setIsConnected(true);
      }
    });

    socketRef.current.on('ice-candidate', async (candidate) => {
      console.log('Received ICE candidate');
      if (peerConnectionRef.current && candidate) {
        try {
          await peerConnectionRef.current.addIceCandidate(new RTCIceCandidate(candidate));
        } catch (error) {
          console.error('Error adding ICE candidate:', error);
        }
      }
    });

    socketRef.current.on('user-disconnected', () => {
      console.log('User disconnected');
      setIsConnected(false);
      if (remoteVideoRef.current) {
        remoteVideoRef.current.srcObject = null;
      }
      setRemoteStream(null);
    });

    socketRef.current.on('call-ended', () => {
      handleEndCall();
    });

    // Cleanup on unmount
    return () => {
      if (localStream) {
        localStream.getTracks().forEach(track => track.stop());
      }
      if (peerConnectionRef.current) {
        peerConnectionRef.current.close();
      }
      if (socketRef.current) {
        socketRef.current.emit('end-call', roomId);
        socketRef.current.disconnect();
      }
    };
  }, [roomId, userName]);

  const createPeerConnection = () => {
    const peerConnection = new RTCPeerConnection(configuration);

    // Add local stream tracks to peer connection
    if (localStream) {
      localStream.getTracks().forEach(track => {
        peerConnection.addTrack(track, localStream);
      });
    }

    // Handle incoming tracks
    peerConnection.ontrack = (event) => {
      console.log('Received remote track');
      const [stream] = event.streams;
      setRemoteStream(stream);
      if (remoteVideoRef.current) {
        remoteVideoRef.current.srcObject = stream;
      }
      setIsConnected(true);
    };

    // Handle ICE candidates
    peerConnection.onicecandidate = (event) => {
      if (event.candidate) {
        console.log('Sending ICE candidate');
        socketRef.current.emit('ice-candidate', event.candidate, roomId);
      }
    };

    // Handle connection state changes
    peerConnection.onconnectionstatechange = () => {
      console.log('Connection state:', peerConnection.connectionState);
      if (peerConnection.connectionState === 'connected') {
        setIsConnected(true);
      } else if (peerConnection.connectionState === 'disconnected' || 
                 peerConnection.connectionState === 'failed') {
        setIsConnected(false);
      }
    };

    return peerConnection;
  };

  const createOffer = async (socketId) => {
    try {
      peerConnectionRef.current = createPeerConnection();
      const offer = await peerConnectionRef.current.createOffer();
      await peerConnectionRef.current.setLocalDescription(offer);
      
      console.log('Sending offer');
      socketRef.current.emit('offer', offer, roomId);
    } catch (error) {
      console.error('Error creating offer:', error);
    }
  };

  const createAnswer = async (offer, socketId) => {
    try {
      peerConnectionRef.current = createPeerConnection();
      await peerConnectionRef.current.setRemoteDescription(new RTCSessionDescription(offer));
      
      const answer = await peerConnectionRef.current.createAnswer();
      await peerConnectionRef.current.setLocalDescription(answer);
      
      console.log('Sending answer');
      socketRef.current.emit('answer', answer, roomId);
    } catch (error) {
      console.error('Error creating answer:', error);
    }
  };

  const toggleMute = () => {
    if (localStream) {
      const audioTrack = localStream.getAudioTracks()[0];
      if (audioTrack) {
        audioTrack.enabled = !audioTrack.enabled;
        setIsMuted(!audioTrack.enabled);
      }
    }
  };

  const toggleVideo = () => {
    if (localStream) {
      const videoTrack = localStream.getVideoTracks()[0];
      if (videoTrack) {
        videoTrack.enabled = !videoTrack.enabled;
        setIsVideoOff(!videoTrack.enabled);
      }
    }
  };

  const handleEndCall = () => {
    if (localStream) {
      localStream.getTracks().forEach(track => track.stop());
    }
    if (peerConnectionRef.current) {
      peerConnectionRef.current.close();
    }
    if (socketRef.current) {
      socketRef.current.emit('end-call', roomId);
      socketRef.current.disconnect();
    }
    onEndCall();
  };

  return (
    <div className="video-call-container">
      <div className="video-call-header">
        <h2>Video Call - Room: {roomId}</h2>
        <div className="connection-status">
          {isConnected ? (
            <span className="status-connected">🟢 Connected</span>
          ) : (
            <span className="status-connecting">🟡 Connecting...</span>
          )}
        </div>
      </div>

      <div className="videos-container">
        {/* Remote Video (Large) */}
        <div className="remote-video-wrapper">
          <video 
            ref={remoteVideoRef} 
            autoPlay 
            playsInline
            className="remote-video"
          />
          {!remoteStream && (
            <div className="waiting-message">
              <svg width="80" height="80" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
              </svg>
              <p>Waiting for other participant...</p>
            </div>
          )}
        </div>

        {/* Local Video (Small - Picture in Picture) */}
        <div className="local-video-wrapper">
          <video 
            ref={localVideoRef} 
            autoPlay 
            playsInline 
            muted
            className="local-video"
          />
          <span className="local-label">You</span>
        </div>
      </div>

      {/* Controls */}
      <div className="video-controls">
        <button 
          className={`control-btn ${isMuted ? 'muted' : ''}`}
          onClick={toggleMute}
          title={isMuted ? 'Unmute' : 'Mute'}
        >
          {isMuted ? (
            <svg fill="none" stroke="currentColor" viewBox="0 0 24 24" width="24" height="24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5.586 15H4a1 1 0 01-1-1v-4a1 1 0 011-1h1.586l4.707-4.707C10.923 3.663 12 4.109 12 5v14c0 .891-1.077 1.337-1.707.707L5.586 15z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2" />
            </svg>
          ) : (
            <svg fill="none" stroke="currentColor" viewBox="0 0 24 24" width="24" height="24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.536 8.464a5 5 0 010 7.072m2.828-9.9a9 9 0 010 12.728M5.586 15H4a1 1 0 01-1-1v-4a1 1 0 011-1h1.586l4.707-4.707C10.923 3.663 12 4.109 12 5v14c0 .891-1.077 1.337-1.707.707L5.586 15z" />
            </svg>
          )}
        </button>

        <button 
          className={`control-btn ${isVideoOff ? 'video-off' : ''}`}
          onClick={toggleVideo}
          title={isVideoOff ? 'Turn on camera' : 'Turn off camera'}
        >
          {isVideoOff ? (
            <svg fill="none" stroke="currentColor" viewBox="0 0 24 24" width="24" height="24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 3l18 18" />
            </svg>
          ) : (
            <svg fill="none" stroke="currentColor" viewBox="0 0 24 24" width="24" height="24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
            </svg>
          )}
        </button>

        <button 
          className="control-btn end-call-btn"
          onClick={handleEndCall}
          title="End call"
        >
          <svg fill="none" stroke="currentColor" viewBox="0 0 24 24" width="24" height="24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 8l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2M5 3a2 2 0 00-2 2v1c0 8.284 6.716 15 15 15h1a2 2 0 002-2v-3.28a1 1 0 00-.684-.948l-4.493-1.498a1 1 0 00-1.21.502l-1.13 2.257a11.042 11.042 0 01-5.516-5.517l2.257-1.128a1 1 0 00.502-1.21L9.228 3.683A1 1 0 008.279 3H5z" />
          </svg>
        </button>
      </div>
    </div>
  );
};

export default VideoCall;
