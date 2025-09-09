import { Routes, Route } from 'react-router-dom';
import Lobby from './pages/Lobby';
import Game from './pages/Game';
import GameSetup from './pages/GameSetup';
import './App.css';

function App() {
  return (
    <Routes>
      <Route path="/" element={<Lobby />} />
      <Route path="/setup" element={<GameSetup />} />
      <Route path="/game" element={<Game />} />
    </Routes>
  );
}

export default App;