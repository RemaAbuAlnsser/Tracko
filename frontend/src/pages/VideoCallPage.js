import React from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import VideoCall, { getUrlParams } from '../components/VideoCall';

function VideoCallPage() {
  const navigate = useNavigate();
  const { roomId } = useParams();
  
  // Try to get roomID from URL params first, then from query string
  const roomID = roomId || getUrlParams().get('roomID');
  
  // Get user info from localStorage
  const userData = localStorage.getItem('user');
  const user = userData ? JSON.parse(userData) : null;
  
  // Get user type and name
  const userType = user?.user_type || 'guest';
  const userName = user?.full_name || 'Guest';
  
  // Add user type prefix to name for clarity
  const displayName = user ? `${userName} (${userType === 'student' ? 'Student' : userType === 'company' ? 'Trainer' : 'Guest'})` : 'Guest';

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

  // Check if user is logged in
  if (!user) {
    return (
      <div style={{
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        height: '100vh',
        flexDirection: 'column',
        gap: '20px',
        padding: '20px',
        textAlign: 'center'
      }}>
        <h2>⚠️ Please Login First</h2>
        <p style={{ color: '#6b7280', maxWidth: '400px' }}>
          You need to be logged in to join the video call. Please login with your account first.
        </p>
        <button 
          onClick={() => navigate('/login')}
          style={{
            padding: '10px 20px',
            background: '#667eea',
            color: 'white',
            border: 'none',
            borderRadius: '8px',
            cursor: 'pointer',
            fontSize: '16px'
          }}
        >
          Go to Login
        </button>
      </div>
    );
  }

  return (
    <VideoCall 
      roomID={roomID} 
      userName={displayName}
      onClose={() => navigate(-1)}
    />
  );
}

export default VideoCallPage;
