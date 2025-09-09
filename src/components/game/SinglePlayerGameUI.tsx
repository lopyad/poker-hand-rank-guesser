import React, { useState, useEffect } from 'react';
import type { GameState, Player, EvaluatedHand } from '../../core/types';
import { type PlayerHandResult } from '../../core/game';
import Card from '../Card';

type GamePhase = 'predicting' | 'results';

interface SinglePlayerGameUIProps {
  gameState: GameState | null;
  gamePhase: GamePhase;
  predictions: { [playerId: number]: number };
  onPredictionChange: (playerId: number, rank: number) => void;
  onCheckResults: () => void;
  onStartNewRound: () => void;
  scores: { [playerId: number]: number };
  results: PlayerHandResult[] | null; 
}

const SinglePlayerGameUI: React.FC<SinglePlayerGameUIProps> = ({
  gameState,
  gamePhase,
  predictions,
  onPredictionChange,
  onCheckResults,
  onStartNewRound,
  scores,
  results,
}) => {
  const [humanPrediction, setHumanPrediction] = useState<number | null>(null);

  useEffect(() => {
    if (gamePhase === 'predicting') {
      setHumanPrediction(null); // Reset prediction when a new round starts
    }
  }, [gamePhase]);

  if (!gameState) {
    return <div>Loading...</div>;
  }

  const handleHumanPredictionChange = (rank: number) => {
    setHumanPrediction(rank);
    onPredictionChange(1, rank); // Always update prediction for Player 1
  };

  return (
    <main>
      <div className="community-cards-area">
        <h2>커뮤니티 카드</h2>
        <div className="card-list">
          {gameState.communityCards.map((card, index) => <Card key={index} card={card} />)}
        </div>
      </div>

      {gamePhase === 'predicting' && (
        <div className="prediction-controls">
          <div className="prediction-buttons">
            <span>예상 등수: </span>
            {[1, 2, 3, 4].map(rank => (
              <button
                key={rank}
                className={`prediction-button ${humanPrediction === rank ? 'selected' : ''}`}
                onClick={() => handleHumanPredictionChange(rank)}
              >
                {rank}등
              </button>
            ))}
          </div>
          <button className="actions-button" onClick={onCheckResults}>결과 확인</button>
        </div>
      )}
      {gamePhase === 'results' && (
        <div className="actions">
          <button onClick={onStartNewRound}>새 라운드</button>
        </div>
      )}

      <div className="players-area">
        {gameState.players.map(player => (
          <PlayerSection
            key={player.id}
            player={player}
            prediction={predictions[player.id]} // Pass prediction prop
            predictions={predictions} // Pass predictions map
            // onPredictionChange={onPredictionChange} // Removed as input is central
            phase={gamePhase}
            result={results?.find(r => r.playerId === player.id)}
            actualRank={results ? results.findIndex(r => r.playerId === player.id) + 1 : undefined}
            isAI={player.id !== 1} // Pass isAI prop
          />
        ))}
      </div>
    </main>
  );
};

interface PlayerSectionProps {
  player: Player;
  prediction: number; // Keep prediction prop for PlayerSection
  predictions: { [playerId: number]: number }; // Added predictions map
  // onPredictionChange: (playerId: number, rank: number) => void; // Removed
  phase: GamePhase;
  result?: PlayerHandResult;
  actualRank?: number;
  isAI?: boolean; // Added isAI prop
}

const PlayerSection: React.FC<PlayerSectionProps> = ({ player, prediction, predictions, phase, result, actualRank, isAI }) => {
  const isCorrect = actualRank !== undefined && prediction === actualRank; // Check correctness using passed prediction

  return (
    <div className={`player ${phase === 'results' && (isCorrect ? 'correct' : 'incorrect')}`}>
      <h3>플레이어 {player.id} {isAI ? '(AI)' : ''}</h3>
      <div className="card-list">
        {isAI && phase === 'predicting' ? (
          // Display face-down cards for AI during predicting phase
          <>
            <div className="card-component back-card"></div>
            <div className="card-component back-card"></div>
            <div className="card-component back-card"></div>
            <div className="card-component back-card"></div>
          </>
        ) : (
          // Display actual cards
          player.holeCards.map((card, index) => <Card key={index} card={card} />)
        )}
      </div>
      {phase === 'results' ? (
        <div className="result-display">
          <p><strong>{result?.evaluatedHand.rankName}</strong></p>
          <p>예측: {predictions[player.id] || '-'}등 / 결과: <strong>{actualRank}등</strong></p>
          {isCorrect ? <p className="correct-text">정답!</p> : null}
        </div>
      ) : null}
    </div>
  );
};

export default SinglePlayerGameUI;