import { useEffect, useRef, useState } from 'react';
import Peer, { MediaConnection } from 'peerjs';
import { supabase } from '../lib/supabase';

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
  const [peerOpened, setPeerOpened] = useState(false);

  useEffect(() => {
    const initializePeer = async () => {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          video: { width: 1280, height: 720 },
          audio: true,
        });

        setLocalStream(stream);
        originalStreamRef.current = stream;
        console.log("peer id", `${roomCode}-${userId}`);
        const peer = new Peer({
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
          setPeerOpened(true);
          supabase.from('room_participants').insert({
            peer_id: id,
            room_id: roomCode,
            user_id: userId,
            is_active: true,
          }).then(({ error }) => {
            if (error) {
              console.error('Failed to join room:', error);
              setError('Failed to join room');
            }
          });
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

  useEffect(() => {
    if (!peerRef.current || !localStream || !roomCode || !userId || !peerOpened) return;
    discoverPeers();
  }, [roomCode, userId, peerRef.current, localStream, peerOpened]);

  const discoverPeers = () => {
    console.log('Discovering peers in room:', roomCode, peerRef.current, localStream);
    if (!peerRef.current || !localStream) return;
    console.log('Peer initialized:', roomCode, userId);
    supabase.from('room_participants').select('*').eq('room_id', roomCode).eq('is_active', true)
      .then(({ data, error }) => {
        if (error) {
          console.error('Failed to fetch participants:', error);
          return;
        }
        data?.forEach((participant) => {
          console.log('Participant:', participant);
          const potentialPeerId = participant.peer_id;
          console.log('Discovered peer ID:', potentialPeerId);
          if (
            potentialPeerId !== peerRef.current?.id &&
            !connectedPeersRef.current.has(potentialPeerId)
          ) {
            connectToPeer(potentialPeerId);
          }
        });
      });
  };

  const connectToPeer = (peerId: string) => {
    console.log('Attempting to connect to peer:', peerId);
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
