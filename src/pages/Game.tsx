import { useState, useEffect } from 'react';
import type { GameState, Player, EvaluatedHand } from '../core/types';
import { setupNewGame, getPlayerHandRanks, type PlayerHandResult } from '../core/game';
import '../App.css';
import { useGameMode } from '../context/GameModeContext'; // Import the hook

// Import game mode specific UI components
import SinglePlayerGameUI from '../components/game/SinglePlayerGameUI';
import MultiplayerGameUI from '../components/game/MultiplayerGameUI';
import LocalMultiplayerGameUI from '../components/game/LocalMultiplayerGameUI';

type GamePhase = 'predicting' | 'results';

function Game() {
  const { gameMode } = useGameMode(); // Get gameMode from context
  console.log("Current Game Mode:", gameMode); // Log for verification

  const [gameState, setGameState] = useState<GameState | null>(null);
  const [gamePhase, setGamePhase] = useState<GamePhase>('predicting');
  const [predictions, setPredictions] = useState<{ [playerId: number]: number }>({});
  const [results, setResults] = useState<PlayerHandResult[] | null>(null);
  const [scores, setScores] = useState<{ [playerId: number]: number }>({ 1: 0, 2: 0, 3: 0, 4: 0 });

  const startNewRound = () => {
    setGameState(setupNewGame());
    setGamePhase('predicting');
    setPredictions({});
    setResults(null);
  };

  useEffect(() => {
    // You can use gameMode here to initialize game state differently
    // For example:
    if (gameMode === 'single') {
      console.log("Starting single player game...");
      // setupNewGame() might need to be modified to accept game mode
      // or you might have different setup functions for different modes
    } else if (gameMode === 'multiplayer') {
      console.log("Starting online multiplayer game...");
      // Logic for online multiplayer setup
    } else if (gameMode === 'local-multiplayer') {
      console.log("Starting local multiplayer game...");
      // Logic for local multiplayer setup
    }
    startNewRound();
  }, [gameMode]); // Add gameMode to dependency array if you want to react to mode changes

  const handlePredictionChange = (playerId: number, rank: number) => {
    setPredictions(prev => ({ ...prev, [playerId]: rank }));
  };

  const handleCheckResults = () => {
    let currentPredictions = { ...predictions };

    if (gameMode === 'single') {
      // Generate random predictions for AI players (2, 3, 4)
      gameState?.players.forEach(player => {
        if (player.id !== 1 && !(player.id in currentPredictions)) {
          currentPredictions[player.id] = Math.floor(Math.random() * 4) + 1; // Random rank from 1 to 4
        }
      });
      setPredictions(currentPredictions);
    }

    if (Object.keys(currentPredictions).length !== gameState?.players.length) {
      alert('모든 플레이어의 순위를 예측해야 합니다.');
      return;
    }
    const finalResults = getPlayerHandRanks(gameState!);
    setResults(finalResults);

    // 점수 계산
    const newScores = { ...scores };
    finalResults.forEach((result, index) => {
      const actualRank = index + 1;
      if (currentPredictions[result.playerId] === actualRank) {
        newScores[result.playerId] += 1;
      }
    });
    setScores(newScores);

    setGamePhase('results');
  };

  if (!gameState) {
    return <div>Loading...</div>;
  }

  const renderGameUI = () => {
    switch (gameMode) {
      case 'single':
        return (
          <SinglePlayerGameUI
            gameState={gameState}
            gamePhase={gamePhase}
            predictions={predictions}
            onPredictionChange={handlePredictionChange}
            onCheckResults={handleCheckResults}
            onStartNewRound={startNewRound}
            scores={scores}
            results={results} // Pass results prop
          />
        );
      case 'multiplayer':
        return <MultiplayerGameUI />;
      case 'local-multiplayer':
        return <LocalMultiplayerGameUI
            gameState={gameState}
            gamePhase={gamePhase}
            predictions={predictions}
            onPredictionChange={handlePredictionChange}
            onCheckResults={handleCheckResults}
            onStartNewRound={startNewRound}
            scores={scores}
            results={results} // Pass results prop
          />
      default:
        return <SinglePlayerGameUI
                  gameState={gameState}
                  gamePhase={gamePhase}
                  predictions={predictions}
                  onPredictionChange={handlePredictionChange}
                  onCheckResults={handleCheckResults}
                  onStartNewRound={startNewRound}
                  scores={scores}
                  results={results} // Pass results prop
                />; // Default to single player
    }
  };

  return (
    <div className="app">
      <header>
        <h1>포커 핸드 순위 맞추기</h1>
        <div className="scores">
          {Object.keys(scores).map(playerId => (
            <span key={playerId}>P{playerId}: {scores[Number(playerId)]}점 </span>
          ))}
        </div>
      </header>
      {renderGameUI()}
    </div>
  );
}

export default Game;