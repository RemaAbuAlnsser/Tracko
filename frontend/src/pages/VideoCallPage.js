import React from 'react';
import { useNavigate } from 'react-router-dom';
import VideoCall, { getUrlParams } from '../components/VideoCall';

function VideoCallPage() {
  const navigate = useNavigate();
  const roomID = getUrlParams().get('roomID');
  
  // Get user info from localStorage
  const userData = localStorage.getItem('user');
  const user = userData ? JSON.parse(userData) : null;
  const userName = user?.full_name || 'Guest';

  if (!roomID) {
    return (
      <div style={{
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        height: '100vh',
        flexDirection: 'column',
        gap: '20px'
      }}>
        <h2>Invalid Room ID</h2>
        <button 
          onClick={() => navigate(-1)}
          style={{
            padding: '10px 20px',
            background: '#667eea',
            color: 'white',
            border: 'none',
            borderRadius: '8px',
            cursor: 'pointer'
          }}
        >
          Go Back
        </button>
      </div>
    );
  }

  return (
    <VideoCall 
      roomID={roomID} 
      userName={userName}
      onClose={() => navigate(-1)}
    />
  );
}

export default VideoCallPage;
