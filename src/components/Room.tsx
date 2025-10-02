import { useEffect, useRef, useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useWebRTC } from '../hooks/useWebRTC';
import { useRecording } from '../hooks/useRecording';
import {
  Mic,
  MicOff,
  Video,
  VideoOff,
  Monitor,
  MonitorOff,
  Phone,
  Circle,
  Copy,
  Check,
} from 'lucide-react';
import { supabase } from '../lib/supabase';

interface RoomProps {
  roomCode: string;
  onLeave: () => void;
}

export const Room = ({ roomCode, onLeave }: RoomProps) => {
  const { user } = useAuth();
  const localVideoRef = useRef<HTMLVideoElement>(null);
  const [copied, setCopied] = useState(false);

  const {
    localStream,
    participants,
    isAudioEnabled,
    isVideoEnabled,
    isScreenSharing,
    toggleAudio,
    toggleVideo,
    toggleScreenShare,
  } = useWebRTC(roomCode, user?.id || '');

  const { isRecording, recordingTime, startRecording, stopRecording } = useRecording();

  useEffect(() => {
    if (localVideoRef.current && localStream) {
      localVideoRef.current.srcObject = localStream;
    }
  }, [localStream]);

  useEffect(() => {
    const joinRoom = async () => {
      if (!user) return;

      await supabase.from('room_participants').insert({
        room_id: roomCode,
        user_id: user.id,
        is_active: true,
      });
    };

    joinRoom();

    return () => {
      leaveRoom();
    };
  }, [roomCode, user]);

  const leaveRoom = async () => {
    if (!user) return;

    await supabase
      .from('room_participants')
      .update({ is_active: false, left_at: new Date().toISOString() })
      .eq('room_id', roomCode)
      .eq('user_id', user.id)
      .eq('is_active', true);
  };

  const handleLeave = async () => {
    await leaveRoom();
    onLeave();
  };

  const copyRoomCode = () => {
    navigator.clipboard.writeText(roomCode);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleRecording = async () => {
    if (isRecording) {
      stopRecording();
    } else {
      try {
        await startRecording();
      } catch (err) {
        console.error(err);
      }
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 flex flex-col">
      <div className="bg-black/30 backdrop-blur-md border-b border-white/10 px-4 py-3">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-4">
            <h1 className="text-white font-semibold text-lg">Room: {roomCode}</h1>
            <button
              onClick={copyRoomCode}
              className="flex items-center gap-2 px-3 py-1.5 bg-white/10 hover:bg-white/20 rounded-lg transition text-white text-sm"
            >
              {copied ? (
                <>
                  <Check className="w-4 h-4" />
                  Copied!
                </>
              ) : (
                <>
                  <Copy className="w-4 h-4" />
                  Copy Code
                </>
              )}
            </button>
          </div>

          {isRecording && (
            <div className="flex items-center gap-2 px-4 py-2 bg-red-600 rounded-lg">
              <Circle className="w-3 h-3 text-white fill-white animate-pulse" />
              <span className="text-white font-mono text-sm">{recordingTime}</span>
            </div>
          )}

          <div className="text-gray-300 text-sm">
            {participants.length + 1} {participants.length === 0 ? 'Participant' : 'Participants'}
          </div>
        </div>
      </div>

      <div className="flex-1 p-4 overflow-hidden">
        <div
          className={`grid gap-4 h-full ${
            participants.length === 0
              ? 'grid-cols-1'
              : participants.length === 1
              ? 'grid-cols-2'
              : participants.length <= 4
              ? 'grid-cols-2'
              : 'grid-cols-3'
          }`}
        >
          <div className="relative bg-slate-800 rounded-xl overflow-hidden shadow-2xl group">
            <video
              ref={localVideoRef}
              autoPlay
              muted
              playsInline
              className="w-full h-full object-cover"
            />
            <div className="absolute bottom-4 left-4 bg-black/60 backdrop-blur-sm px-3 py-1.5 rounded-lg">
              <span className="text-white text-sm font-medium">You</span>
            </div>
            {!isVideoEnabled && (
              <div className="absolute inset-0 flex items-center justify-center bg-slate-700">
                <div className="w-20 h-20 rounded-full bg-blue-600 flex items-center justify-center">
                  <span className="text-white text-2xl font-bold">
                    {user?.email?.charAt(0).toUpperCase()}
                  </span>
                </div>
              </div>
            )}
          </div>

          {participants.map((participant) => (
            <ParticipantVideo key={participant.peerId} participant={participant} />
          ))}
        </div>
      </div>

      <div className="bg-black/30 backdrop-blur-md border-t border-white/10 px-4 py-6">
        <div className="max-w-2xl mx-auto flex items-center justify-center gap-4">
          <button
            onClick={toggleAudio}
            className={`p-4 rounded-full transition shadow-lg ${
              isAudioEnabled
                ? 'bg-slate-700 hover:bg-slate-600 text-white'
                : 'bg-red-600 hover:bg-red-700 text-white'
            }`}
            title={isAudioEnabled ? 'Mute' : 'Unmute'}
          >
            {isAudioEnabled ? <Mic className="w-6 h-6" /> : <MicOff className="w-6 h-6" />}
          </button>

          <button
            onClick={toggleVideo}
            className={`p-4 rounded-full transition shadow-lg ${
              isVideoEnabled
                ? 'bg-slate-700 hover:bg-slate-600 text-white'
                : 'bg-red-600 hover:bg-red-700 text-white'
            }`}
            title={isVideoEnabled ? 'Stop Video' : 'Start Video'}
          >
            {isVideoEnabled ? <Video className="w-6 h-6" /> : <VideoOff className="w-6 h-6" />}
          </button>

          <button
            onClick={toggleScreenShare}
            className={`p-4 rounded-full transition shadow-lg ${
              isScreenSharing
                ? 'bg-green-600 hover:bg-green-700 text-white'
                : 'bg-slate-700 hover:bg-slate-600 text-white'
            }`}
            title={isScreenSharing ? 'Stop Sharing' : 'Share Screen'}
          >
            {isScreenSharing ? (
              <MonitorOff className="w-6 h-6" />
            ) : (
              <Monitor className="w-6 h-6" />
            )}
          </button>

          <button
            onClick={handleRecording}
            className={`p-4 rounded-full transition shadow-lg ${
              isRecording
                ? 'bg-red-600 hover:bg-red-700 text-white animate-pulse'
                : 'bg-slate-700 hover:bg-slate-600 text-white'
            }`}
            title={isRecording ? 'Stop Recording' : 'Start Recording'}
          >
            <Circle className={`w-6 h-6 ${isRecording ? 'fill-white' : ''}`} />
          </button>

          <div className="w-px h-12 bg-white/20 mx-2" />

          <button
            onClick={handleLeave}
            className="p-4 rounded-full bg-red-600 hover:bg-red-700 text-white transition shadow-lg"
            title="Leave Meeting"
          >
            <Phone className="w-6 h-6 rotate-[135deg]" />
          </button>
        </div>
      </div>
    </div>
  );
};

const ParticipantVideo = ({ participant }: { participant: { peerId: string; stream: MediaStream } }) => {
  const videoRef = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    if (videoRef.current) {
      videoRef.current.srcObject = participant.stream;
    }
  }, [participant.stream]);

  const hasVideo = participant.stream.getVideoTracks().length > 0 &&
                    participant.stream.getVideoTracks()[0].enabled;

  return (
    <div className="relative bg-slate-800 rounded-xl overflow-hidden shadow-2xl">
      <video
        ref={videoRef}
        autoPlay
        playsInline
        className="w-full h-full object-cover"
      />
      <div className="absolute bottom-4 left-4 bg-black/60 backdrop-blur-sm px-3 py-1.5 rounded-lg">
        <span className="text-white text-sm font-medium">
          Participant {participant.peerId.slice(-4)}
        </span>
      </div>
      {!hasVideo && (
        <div className="absolute inset-0 flex items-center justify-center bg-slate-700">
          <div className="w-20 h-20 rounded-full bg-green-600 flex items-center justify-center">
            <span className="text-white text-2xl font-bold">P</span>
          </div>
        </div>
      )}
    </div>
  );
};
