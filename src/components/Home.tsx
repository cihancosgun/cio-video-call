import { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { Video, LogOut, Plus, DoorOpen } from 'lucide-react';
import { supabase } from '../lib/supabase';

interface HomeProps {
  onJoinRoom: (roomCode: string) => void;
}

export const Home = ({ onJoinRoom }: HomeProps) => {
  const { user, signOut } = useAuth();
  const [roomCode, setRoomCode] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const generateRoomCode = () => {
    return Math.floor(100000 + Math.random() * 900000).toString();
  };

  const handleStartNewSession = async () => {
    setError('');
    setLoading(true);

    try {
      const newRoomCode = generateRoomCode();

      const { error: insertError } = await supabase.from('rooms').insert({
        room_code: newRoomCode,
        host_id: user?.id,
        is_active: true,
      });

      if (insertError) {
        if (insertError.code === '23505') {
          handleStartNewSession();
          return;
        }
        throw insertError;
      }

      onJoinRoom(newRoomCode);
    } catch (err) {
      setError('Failed to create room. Please try again.');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleJoinSession = async () => {
    if (!roomCode.trim() || roomCode.length !== 6) {
      setError('Please enter a valid 6-digit room code');
      return;
    }

    setError('');
    setLoading(true);

    try {
      const { data, error: fetchError } = await supabase
        .from('rooms')
        .select('*')
        .eq('room_code', roomCode)
        .eq('is_active', true)
        .maybeSingle();

      if (fetchError) throw fetchError;

      if (!data) {
        setError('Room not found or has ended');
        setLoading(false);
        return;
      }

      onJoinRoom(roomCode);
    } catch (err) {
      setError('Failed to join room. Please try again.');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">
      <nav className="bg-white/10 backdrop-blur-md border-b border-white/10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center gap-3">
              <div className="bg-blue-600 p-2 rounded-lg">
                <Video className="w-6 h-6 text-white" />
              </div>
              <span className="text-white text-xl font-bold">VideoMeet</span>
            </div>
            <button
              onClick={signOut}
              className="flex items-center gap-2 text-white hover:text-gray-300 transition px-4 py-2 rounded-lg hover:bg-white/10"
            >
              <LogOut className="w-5 h-5" />
              Sign Out
            </button>
          </div>
        </div>
      </nav>

      <div className="max-w-4xl mx-auto px-4 py-16">
        <div className="text-center mb-12">
          <h1 className="text-5xl font-bold text-white mb-4">
            Premium Video Meetings
          </h1>
          <p className="text-xl text-gray-300">
            Connect with anyone, anywhere with crystal-clear video quality
          </p>
        </div>

        {error && (
          <div className="bg-red-500/20 border border-red-500 text-red-100 px-4 py-3 rounded-lg mb-6 max-w-md mx-auto">
            {error}
          </div>
        )}

        <div className="grid md:grid-cols-2 gap-6 mb-8">
          <div className="bg-white/10 backdrop-blur-md rounded-2xl p-8 border border-white/20 hover:bg-white/15 transition">
            <div className="bg-gradient-to-br from-blue-600 to-blue-700 w-16 h-16 rounded-xl flex items-center justify-center mb-6 mx-auto">
              <Plus className="w-8 h-8 text-white" />
            </div>
            <h2 className="text-2xl font-bold text-white mb-3 text-center">
              Start New Meeting
            </h2>
            <p className="text-gray-300 mb-6 text-center">
              Create a new room and invite others to join
            </p>
            <button
              onClick={handleStartNewSession}
              disabled={loading}
              className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 rounded-lg transition disabled:opacity-50 disabled:cursor-not-allowed shadow-lg hover:shadow-xl"
            >
              {loading ? 'Creating...' : 'Start New Session'}
            </button>
          </div>

          <div className="bg-white/10 backdrop-blur-md rounded-2xl p-8 border border-white/20 hover:bg-white/15 transition">
            <div className="bg-gradient-to-br from-green-600 to-green-700 w-16 h-16 rounded-xl flex items-center justify-center mb-6 mx-auto">
              <DoorOpen className="w-8 h-8 text-white" />
            </div>
            <h2 className="text-2xl font-bold text-white mb-3 text-center">
              Join Meeting
            </h2>
            <p className="text-gray-300 mb-6 text-center">
              Enter a room code to join an existing meeting
            </p>
            <div className="space-y-3">
              <input
                type="text"
                value={roomCode}
                onChange={(e) => setRoomCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
                placeholder="Enter 6-digit code"
                maxLength={6}
                className="w-full px-4 py-3 rounded-lg bg-white/20 border border-white/30 text-white placeholder-gray-400 focus:ring-2 focus:ring-green-500 focus:border-transparent outline-none transition text-center text-2xl tracking-widest font-mono"
              />
              <button
                onClick={handleJoinSession}
                disabled={loading || roomCode.length !== 6}
                className="w-full bg-green-600 hover:bg-green-700 text-white font-semibold py-3 rounded-lg transition disabled:opacity-50 disabled:cursor-not-allowed shadow-lg hover:shadow-xl"
              >
                {loading ? 'Joining...' : 'Join Session'}
              </button>
            </div>
          </div>
        </div>

        <div className="bg-white/5 backdrop-blur-md rounded-xl p-6 border border-white/10">
          <h3 className="text-lg font-semibold text-white mb-4">Features</h3>
          <div className="grid sm:grid-cols-3 gap-4">
            <div className="flex items-start gap-3">
              <div className="bg-blue-600/20 p-2 rounded-lg">
                <Video className="w-5 h-5 text-blue-400" />
              </div>
              <div>
                <h4 className="text-white font-medium">HD Video</h4>
                <p className="text-gray-400 text-sm">Crystal clear quality</p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <div className="bg-green-600/20 p-2 rounded-lg">
                <DoorOpen className="w-5 h-5 text-green-400" />
              </div>
              <div>
                <h4 className="text-white font-medium">Screen Share</h4>
                <p className="text-gray-400 text-sm">Share your screen</p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <div className="bg-red-600/20 p-2 rounded-lg">
                <Video className="w-5 h-5 text-red-400" />
              </div>
              <div>
                <h4 className="text-white font-medium">Recording</h4>
                <p className="text-gray-400 text-sm">Save your meetings</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
