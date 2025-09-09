import { useState, useEffect } from 'react';
import type { GameState, Player, EvaluatedHand } from '../core/types';
import { setupNewGame, getPlayerHandRanks, type PlayerHandResult } from '../core/game';
import Card from '../components/Card';
import '../App.css';

type GamePhase = 'predicting' | 'results';

function Game() {
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
    startNewRound();
  }, []);

  const handlePredictionChange = (playerId: number, rank: number) => {
    setPredictions(prev => ({ ...prev, [playerId]: rank }));
  };

  const handleCheckResults = () => {
    if (Object.keys(predictions).length !== gameState?.players.length) {
      alert('모든 플레이어의 순위를 예측해야 합니다.');
      return;
    }
    const finalResults = getPlayerHandRanks(gameState!);
    setResults(finalResults);

    // 점수 계산
    const newScores = { ...scores };
    finalResults.forEach((result, index) => {
      const actualRank = index + 1;
      if (predictions[result.playerId] === actualRank) {
        newScores[result.playerId] += 1;
      }
    });
    setScores(newScores);

    setGamePhase('results');
  };

  if (!gameState) {
    return <div>Loading...</div>;
  }

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
      <main>
        <div className="community-cards-area">
          <h2>커뮤니티 카드</h2>
          <div className="card-list">
            {gameState.communityCards.map((card, index) => <Card key={index} card={card} />)}
          </div>
        </div>
        <div className="players-area">
          <h2>플레이어</h2>
          {gameState.players.map(player => (
            <PlayerSection
              key={player.id}
              player={player}
              prediction={predictions[player.id]}
              onPredictionChange={handlePredictionChange}
              phase={gamePhase}
              result={results?.find(r => r.playerId === player.id)}
              actualRank={results ? results.findIndex(r => r.playerId === player.id) + 1 : undefined}
            />
          ))}
        </div>
        <div className="actions">
          {gamePhase === 'predicting' ? (
            <button onClick={handleCheckResults}>결과 확인</button>
          ) : (
            <button onClick={startNewRound}>새 라운드</button>
          )}
        </div>
      </main>
    </div>
  );
}

interface PlayerSectionProps {
  player: Player;
  prediction: number;
  onPredictionChange: (playerId: number, rank: number) => void;
  phase: GamePhase;
  result?: PlayerHandResult;
  actualRank?: number;
}

const PlayerSection: React.FC<PlayerSectionProps> = ({ player, prediction, onPredictionChange, phase, result, actualRank }) => {
  const isCorrect = prediction === actualRank;

  return (
    <div className={`player ${phase === 'results' && (isCorrect ? 'correct' : 'incorrect')}`}>
      <h3>플레이어 {player.id}</h3>
      <div className="card-list">
        {player.holeCards.map((card, index) => <Card key={index} card={card} />)}
      </div>
      {phase === 'predicting' ? (
        <div className="prediction-input">
          <span>예상 등수: </span>
          {[1, 2, 3, 4].map(rank => (
            <label key={rank}>
              <input
                type="radio"
                name={`player-${player.id}-rank`}
                value={rank}
                checked={prediction === rank}
                onChange={() => onPredictionChange(player.id, rank)}
              />
              {rank}등
            </label>
          ))}
        </div>
      ) : (
        <div className="result-display">
          <p><strong>{result?.evaluatedHand.rankName}</strong></p>
          <p>예측: {prediction}등 / 결과: <strong>{actualRank}등</strong></p>
          {isCorrect ? <p className="correct-text">정답!</p> : null}
        </div>
      )}
    </div>
  );
};

export default Game;
