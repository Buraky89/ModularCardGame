import React, { useState, useEffect } from 'react';
import { GameClient, State } from './Common/StateManager';

interface AppState {
  state: string;
  gameUuids: string[];
  gameUuid: string;
  userUuid: string;
  jwtToken: string;
}

const TestTest: React.FC = () => {
  const [client] = useState(new GameClient());
  const [loginName, setLoginName] = useState('');
  const [appState, setAppState] = useState<AppState>({
    state: 'NotLoggedIn',
    gameUuids: [],
    gameUuid: '',
    userUuid: '',
    jwtToken: '',
  });

  useEffect(() => {

    client.socket.on("any", (message: any) => {
      const newState: AppState = {
        state: State[client.stateManager.state],
        gameUuids: client.stateManager.gameUuids,
        gameUuid: client.stateManager.gameUuid,
        userUuid: client.stateManager.userUuid,
        jwtToken: client.stateManager.jwtToken,
      };
      setAppState(newState);
    });
  }, [client]);

  const handleLogin = () => {
    client.login(loginName);
  };

  return (
    <div>
      <h1>Game Client</h1>
      <p>
        State: {appState.state}
        <br />
        JWT Token: {appState.jwtToken}
        <br />
        Game UUIDs: {appState.gameUuids.join(', ')}
        <br />
        Game UUID: {appState.gameUuid}
        <br />
        User UUID: {appState.userUuid}
      </p>
      <input
        type="text"
        value={loginName}
        onChange={(e) => setLoginName(e.target.value)}
        placeholder="Enter login name"
      />
      <button onClick={handleLogin}>Login</button>
    </div>
  );
};

export default TestTest;