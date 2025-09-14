import React, { useRef, useEffect } from 'react';
import './MultiGame.css';
import MultiplayerGameLobby from '../components/game/MultiplayerGameLobby';
import MultiplayerGameUI from '../components/game/MultiplayerGameUI';
import { useAuthStore } from '../store/authStore';
import { useMultiGameStore } from '../store/multiGameStore';
import { type ServerMessage } from '../types/websocket.types';

// PUT 요청 및 WebSocket 연결을 처리하는 재사용 가능한 함수
const connectToRoomAndWebSocket = async (
  newRoomCode: string,
  token: string,
  backendUrl: string,
  wsRef: React.RefObject<WebSocket | null>
): Promise<boolean> => {
  try {
    // 1. PUT 요청으로 방 참여 성공 여부 체크
    const putResponse = await fetch(`${backendUrl}/game/multi/room`, {
      method: 'PUT',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ roomCode: newRoomCode }),
    });

    if (!putResponse.ok) {
      console.error("Failed to join room (PUT request):", putResponse.status, putResponse.statusText);
      alert(`방 참여에 실패했습니다: ${putResponse.statusText}`);
      return false;
    }
    console.log(`Successfully joined room ${newRoomCode} via PUT request.`);

    // 2. WebSocket 연결 설정
    // 기존 WebSocket 연결이 있다면 닫기
    if (wsRef.current) {
      wsRef.current.close();
    }

    const wsProtocol = backendUrl.startsWith('https') ? 'wss' : 'ws';
    const wsHost = new URL(backendUrl).host;
    const wsUrl = `${wsProtocol}://${wsHost}/ws/${newRoomCode}?token=${token}`;
    
    wsRef.current = new WebSocket(wsUrl);

    return true;
  } catch (error) {
    console.error("Error in connectToRoomAndWebSocket:", error);
    alert("방 연결 및 WebSocket 설정 중 오류가 발생했습니다.");
    return false;
  }
};

const MultiGame: React.FC = () => {
  const {
    phase,
    roomCode,
    manualRoomCode,
    players,
    setPhase,
    setRoomCode,
    setManualRoomCode,
    setPlayers,
    startCountdown,
    cancelCountdown,
    reset,
  } = useMultiGameStore();

  const { token } = useAuthStore();
  const backendUrl = import.meta.env.VITE_BACKEND_URL;
  const ws = useRef<WebSocket | null>(null);

  // 중앙 웹소켓 메시지 핸들러
  useEffect(() => {
    if (!ws.current) return;

    ws.current.onopen = () => {
      console.log('WebSocket connected to room:', roomCode);
      ws.current?.send(JSON.stringify({ type: "JOIN_ROOM", payload: { roomCode: roomCode } }));
    };

    ws.current.onmessage = (event) => {
      console.log('WebSocket message received:', event.data);
      try {
        const message: ServerMessage = JSON.parse(event.data);
        switch (message.type) {
          case 'LOBBY_STATE':
            setPlayers(message.payload.players);
            break;
          case 'GAME_START_COUNTDOWN':
            startCountdown(message.payload.duration);
            break;
          case 'GAME_START_CANCELLED':
            cancelCountdown();
            break;
          case 'GAME_STARTED':
            setPhase('game');
            break;
        }
      } catch (error) {
        console.error("Failed to parse message:", error);
      }
    };

    ws.current.onclose = (event) => {
      console.log('WebSocket disconnected:', event.code, event.reason);
    };

    ws.current.onerror = (error) => {
      console.error('WebSocket error:', error);
    };

  }, [ws.current, roomCode, setPlayers, startCountdown, cancelCountdown, setPhase]); // ws.current가 변경될 때마다 핸들러를 새로 설정


  // WebSocket 연결 및 스토어 정리 (컴포넌트 언마운트 시)
  useEffect(() => {
    return () => {
      if (ws.current) {
        console.log('Closing WebSocket connection.');
        ws.current.close();
      }
      console.log('Resetting multi-game store.');
      reset();
    };
  }, [reset]);

  const handlePlayerReadyToggle = (isReady: boolean) => {
    if (ws.current && ws.current.readyState === WebSocket.OPEN) {
      const message = {
        type: 'PLAYER_READY',
        payload: {
          isReady: isReady,
        },
      };
      ws.current.send(JSON.stringify(message));
    } else {
      console.error('WebSocket is not connected or not open.');
    }
  };

  const handleGetRoomCode = async () => {
    if (!token) {
      console.error("No authentication token found. Please log in.");
      alert("로그인이 필요합니다.");
      return;
    }

    try {
      // 1. GET 요청으로 방 코드 받아오기
      const getResponse = await fetch(`${backendUrl}/game/multi/room`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      if (!getResponse.ok) {
        console.error("Failed to fetch room code:", getResponse.status, getResponse.statusText);
        alert(`방 코드를 받아오는데 실패했습니다: ${getResponse.statusText}`);
        return;
      }

      const getResult = await getResponse.json();
      if (!getResult || !getResult.data) {
        console.error("Invalid response format for GET room code:", getResult);
        alert("방 코드를 받아오는데 실패했습니다: 잘못된 응답 형식");
        return;
      }
      const newRoomCode = getResult.data;
      
      // 2. 재사용 가능한 함수 호출
      const connected = await connectToRoomAndWebSocket(newRoomCode, token, backendUrl, ws);
      if (connected) {
        setRoomCode(newRoomCode);
      } else {
        setRoomCode(null);
      }

    } catch (error) {
      console.error("Error in room code process:", error);
      alert("방 코드 처리 중 오류가 발생했습니다.");
    }
  };

  const handleJoinRoomManually = async () => {
    if (!token) {
      console.error("No authentication token found. Please log in.");
      alert("로그인이 필요합니다.");
      return;
    }
    if (!manualRoomCode) {
      alert("방 코드를 입력해주세요.");
      return;
    }

    // 수동 입력된 방 코드로 연결 시도
    const connected = await connectToRoomAndWebSocket(manualRoomCode, token, backendUrl, ws);
    if (connected) {
      setRoomCode(manualRoomCode); // 성공 시 현재 방 코드 업데이트
    } else {
      setRoomCode(null); // 실패 시 초기화
    }
  };

  const renderPhase = () => {
    switch (phase) {
      case 'lobby':
        return (
          <MultiplayerGameLobby
            roomCode={roomCode}
            manualRoomCode={manualRoomCode}
            handleGetRoomCode={handleGetRoomCode}
            handleJoinRoomManually={handleJoinRoomManually}
            setManualRoomCode={setManualRoomCode}
            setPhase={setPhase}
            players={players}
            onPlayerReadyToggle={handlePlayerReadyToggle}
          />
        );
      case 'game':
        return <MultiplayerGameUI />;
      default:
        return <div>Invalid game phase</div>;
    }
  };

  return (
    <div className="multigame-container">
      <h1>Multiplayer Game</h1>
      {renderPhase()}
    </div>
  );
};

export default MultiGame;
