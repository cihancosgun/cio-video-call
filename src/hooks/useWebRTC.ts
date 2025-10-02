import { useEffect, useRef, useState } from 'react';
import Peer, { MediaConnection } from 'peerjs';

interface Participant {
  peerId: string;
  stream: MediaStream;
}

export const useWebRTC = (roomCode: string, userId: string) => {
  const [participants, setParticipants] = useState<Participant[]>([]);
  const [localStream, setLocalStream] = useState<MediaStream | null>(null);
  const [isAudioEnabled, setIsAudioEnabled] = useState(true);
  const [isVideoEnabled, setIsVideoEnabled] = useState(true);
  const [isScreenSharing, setIsScreenSharing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const peerRef = useRef<Peer | null>(null);
  const connectionsRef = useRef<Map<string, MediaConnection>>(new Map());
  const connectedPeersRef = useRef<Set<string>>(new Set());
  const screenStreamRef = useRef<MediaStream | null>(null);
  const originalStreamRef = useRef<MediaStream | null>(null);

  useEffect(() => {
    const initializePeer = async () => {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          video: { width: 1280, height: 720 },
          audio: true,
        });

        setLocalStream(stream);
        originalStreamRef.current = stream;

        const peer = new Peer(`${roomCode}-${userId}`, {
          config: {
            iceServers: [
              { urls: 'stun:stun.l.google.com:19302' },
              { urls: 'stun:stun1.l.google.com:19302' },
            ],
          },
        });

        peerRef.current = peer;

        peer.on('open', (id) => {
          console.log('Peer connected with ID:', id);
          discoverPeers();
        });

        peer.on('call', (call) => {
          call.answer(stream);
          call.on('stream', (remoteStream) => {
            addParticipant(call.peer, remoteStream);
          });

          call.on('close', () => {
            removeParticipant(call.peer);
          });

          connectionsRef.current.set(call.peer, call);
        });

        peer.on('error', (err) => {
          console.error('Peer error:', err);
          setError('Connection error occurred');
        });

      } catch (err) {
        console.error('Failed to get media:', err);
        setError('Failed to access camera/microphone');
      }
    };

    initializePeer();

    return () => {
      localStream?.getTracks().forEach((track) => track.stop());
      screenStreamRef.current?.getTracks().forEach((track) => track.stop());
      connectionsRef.current.forEach((conn) => conn.close());
      peerRef.current?.destroy();
    };
  }, [roomCode, userId]);

  const discoverPeers = () => {
    if (!peerRef.current || !localStream) return;

    const interval = setInterval(() => {
      for (let i = 0; i < 10; i++) {
        const potentialPeerId = `${roomCode}-peer${i}`;
        if (
          potentialPeerId !== peerRef.current?.id &&
          !connectedPeersRef.current.has(potentialPeerId)
        ) {
          connectToPeer(potentialPeerId);
        }
      }
    }, 2000);

    setTimeout(() => clearInterval(interval), 10000);
  };

  const connectToPeer = (peerId: string) => {
    if (!peerRef.current || !localStream || connectionsRef.current.has(peerId)) {
      return;
    }

    try {
      const call = peerRef.current.call(peerId, localStream);

      call.on('stream', (remoteStream) => {
        addParticipant(peerId, remoteStream);
        connectedPeersRef.current.add(peerId);
      });

      call.on('close', () => {
        removeParticipant(peerId);
        connectedPeersRef.current.delete(peerId);
      });

      call.on('error', () => {
        connectionsRef.current.delete(peerId);
      });

      connectionsRef.current.set(peerId, call);
    } catch (err) {
      console.error('Failed to connect to peer:', err);
    }
  };

  const addParticipant = (peerId: string, stream: MediaStream) => {
    setParticipants((prev) => {
      if (prev.some((p) => p.peerId === peerId)) {
        return prev;
      }
      return [...prev, { peerId, stream }];
    });
  };

  const removeParticipant = (peerId: string) => {
    setParticipants((prev) => prev.filter((p) => p.peerId !== peerId));
    connectionsRef.current.delete(peerId);
  };

  const toggleAudio = () => {
    if (localStream) {
      const audioTrack = localStream.getAudioTracks()[0];
      if (audioTrack) {
        audioTrack.enabled = !audioTrack.enabled;
        setIsAudioEnabled(audioTrack.enabled);
      }
    }
  };

  const toggleVideo = () => {
    if (localStream) {
      const videoTrack = localStream.getVideoTracks()[0];
      if (videoTrack) {
        videoTrack.enabled = !videoTrack.enabled;
        setIsVideoEnabled(videoTrack.enabled);
      }
    }
  };

  const toggleScreenShare = async () => {
    if (isScreenSharing) {
      if (screenStreamRef.current) {
        screenStreamRef.current.getTracks().forEach((track) => track.stop());
      }

      if (originalStreamRef.current) {
        setLocalStream(originalStreamRef.current);
        replaceStream(originalStreamRef.current);
      }

      setIsScreenSharing(false);
    } else {
      try {
        const screenStream = await navigator.mediaDevices.getDisplayMedia({
          video: { width: 1920, height: 1080 },
          audio: false,
        });

        screenStreamRef.current = screenStream;

        screenStream.getVideoTracks()[0].onended = () => {
          toggleScreenShare();
        };

        const audioTrack = originalStreamRef.current?.getAudioTracks()[0];
        if (audioTrack) {
          screenStream.addTrack(audioTrack);
        }

        setLocalStream(screenStream);
        replaceStream(screenStream);
        setIsScreenSharing(true);
      } catch (err) {
        console.error('Failed to share screen:', err);
        setError('Failed to share screen');
      }
    }
  };

  const replaceStream = (newStream: MediaStream) => {
    connectionsRef.current.forEach((call) => {
      const sender = call.peerConnection
        .getSenders()
        .find((s) => s.track?.kind === 'video');

      if (sender) {
        const videoTrack = newStream.getVideoTracks()[0];
        if (videoTrack) {
          sender.replaceTrack(videoTrack);
        }
      }
    });
  };

  return {
    localStream,
    participants,
    isAudioEnabled,
    isVideoEnabled,
    isScreenSharing,
    toggleAudio,
    toggleVideo,
    toggleScreenShare,
    error,
  };
};
