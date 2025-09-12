import { useEffect } from 'react';
import { Routes, Route } from 'react-router-dom';
import Lobby from './pages/Lobby';
import Game from './pages/Game';
import GameSetup from './pages/GameSetup';
import Login from './pages/Login';
import { useAuthStore } from './store/authStore';
import './App.css';

function App() {
  const { checkAuthStatus } = useAuthStore();
  const backendUrl = import.meta.env.VITE_BACKEND_URL;

  useEffect(() => {
    checkAuthStatus(backendUrl);
  }, [checkAuthStatus, backendUrl]);

  return (
    <Routes>
      <Route path="/" element={<Lobby />} />
      <Route path="/login" element={<Login />} />
      <Route path="/setup" element={<GameSetup />} />
      <Route path="/game" element={<Game />} />
    </Routes>
  );
}

export default App;
