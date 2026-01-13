import React, { useEffect, useRef } from 'react';
import { ZegoUIKitPrebuilt } from '@zegocloud/zego-uikit-prebuilt';

function randomID(len) {
  let result = '';
  if (result) return result;
  var chars = '12345qwertyuiopasdfgh67890jklmnbvcxzMNBVCZXASDQWERTYHGFUIOLKJP',
    maxPos = chars.length,
    i;
  len = len || 5;
  for (i = 0; i < len; i++) {
    result += chars.charAt(Math.floor(Math.random() * maxPos));
  }
  return result;
}

export function getUrlParams(url = window.location.href) {
  let urlStr = url.split('?')[1];
  return new URLSearchParams(urlStr);
}

const VideoCall = ({ roomID, userName, onClose }) => {
  const containerRef = useRef(null);
  const zpRef = useRef(null);

  useEffect(() => {
    const initMeeting = async () => {
      if (!containerRef.current) return;

      // ZEGOCLOUD credentials
      const appID = 1848332705;
      const serverSecret = "e2236f6f8c7b6162beeabac0cc9b75d1";
      
      // Get user info from localStorage to get unique user ID
      const userData = localStorage.getItem('user');
      const user = userData ? JSON.parse(userData) : null;
      
      // Use actual user ID or generate random one for guests
      const userID = user ? String(user.id) : randomID(5);
      const displayName = userName || (user ? user.full_name : 'Guest');
      
      console.log('🎥 Joining video call:', {
        roomID,
        userID,
        displayName
      });
      
      // Generate Kit Token
      const kitToken = ZegoUIKitPrebuilt.generateKitTokenForTest(
        appID, 
        serverSecret, 
        roomID,
        userID,
        displayName
      );

      // Create instance object from Kit Token
      const zp = ZegoUIKitPrebuilt.create(kitToken);
      zpRef.current = zp;

      // Start the call
      zp.joinRoom({
        container: containerRef.current,
        sharedLinks: [
          {
            name: 'Copy link',
            url: `${window.location.protocol}//${window.location.host}/video-call?roomID=${roomID}`,
          },
        ],
        scenario: {
          mode: ZegoUIKitPrebuilt.GroupCall,
        },
        showScreenSharingButton: true,
        showPreJoinView: false,
        onLeaveRoom: () => {
          if (onClose) {
            onClose();
          }
        },
      });
    };

    initMeeting();

    // Cleanup on unmount
    return () => {
      if (zpRef.current) {
        zpRef.current = null;
      }
    };
  }, [roomID, userName, onClose]);

  return (
    <div style={{
      position: 'fixed',
      top: 0,
      left: 0,
      width: '100vw',
      height: '100vh',
      zIndex: 9999,
      backgroundColor: '#000'
    }}>
      {onClose && (
        <button
          onClick={onClose}
          style={{
            position: 'absolute',
            top: '20px',
            right: '20px',
            zIndex: 10000,
            padding: '10px 20px',
            background: '#ef4444',
            color: 'white',
            border: 'none',
            borderRadius: '8px',
            cursor: 'pointer',
            fontSize: '16px',
            fontWeight: '600'
          }}
        >
          ✕ Close
        </button>
      )}
      <div
        ref={containerRef}
        style={{ width: '100%', height: '100%' }}
      />
    </div>
  );
};

export default VideoCall;
