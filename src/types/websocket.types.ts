// 서버가 클라이언트로 보내는 메시지 (Server to Client)
// ----------------------------------------------------

// 로비 상태 업데이트
export interface S2C_LobbyState {
    type: 'LOBBY_STATE';
    payload: {
        players: { name: string; isReady: boolean }[];
    };
}

// 게임 시작 카운트다운
export interface S2C_GameStartCountdown {
  type: 'GAME_START_COUNTDOWN';
  payload: {
    duration: number; // in seconds
  };
}

// 게임 시작 취소
export interface S2C_GameStartCancelled {
  type: 'GAME_START_CANCELLED';
  payload: {};
}

// 게임 시작
export interface S2C_GameStarted {
  type: 'GAME_STARTED';
  payload: {};
}


// 서버가 보낼 수 있는 모든 메시지 타입의 통합
export type ServerMessage = 
    | S2C_LobbyState 
    | S2C_GameStartCountdown
    | S2C_GameStartCancelled
    | S2C_GameStarted;


// 클라이언트가 서버로 보내는 메시지 (Client to Server)
// ----------------------------------------------------

// 방 참가
export interface C2S_JoinRoom {
    type: 'JOIN_ROOM';
    payload: {
        roomCode: string;
    };
}

// 준비 상태 변경
export interface C2S_PlayerReady {
    type: 'PLAYER_READY';
    payload: {
        isReady: boolean;
    };
}

// 클라이언트가 보낼 수 있는 모든 메시지 타입의 통합
export type ClientMessage = C2S_JoinRoom | C2S_PlayerReady;