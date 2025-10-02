import { useState } from 'react';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { Auth } from './components/Auth';
import { Home } from './components/Home';
import { Room } from './components/Room';

function AppContent() {
  const { user, loading } = useAuth();
  const [currentRoom, setCurrentRoom] = useState<string | null>(null);

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 flex items-center justify-center">
        <div className="text-white text-xl">Loading...</div>
      </div>
    );
  }

  if (!user) {
    return <Auth />;
  }

  if (currentRoom) {
    return <Room roomCode={currentRoom} onLeave={() => setCurrentRoom(null)} />;
  }

  return <Home onJoinRoom={setCurrentRoom} />;
}

function App() {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  );
}

export default App;
