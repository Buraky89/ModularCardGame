import React, { useState, useEffect } from 'react';
import { GameClient, State } from './Common/StateManager';

interface AppState {
  state: string;
  gameUuids: string[];
  gameUuid: string;
  userUuid: string;
  jwtToken: string;
}

const App: React.FC = () => {
  const updateState = () => {
    const newState: AppState = {
      state: State[client.stateManager.state],
      gameUuids: client.stateManager.gameUuids,
      gameUuid: client.stateManager.gameUuid,
      userUuid: client.stateManager.userUuid,
      jwtToken: client.stateManager.jwtToken,
    };
    setAppState(newState);
  };
  
  const [client] = useState(new GameClient(updateState));
  const [loginName, setLoginName] = useState('');
  const [appState, setAppState] = useState<AppState>({
    state: 'NotLoggedIn',
    gameUuids: [],
    gameUuid: '',
    userUuid: '',
    jwtToken: '',
  });
  

  const handleLogin = () => {
    client.login(loginName);
  };

  const handleGameUuidSelection = (event: React.ChangeEvent<HTMLSelectElement>) => {
    client.selectTheGameUuid(event.target.value);
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
      {appState.state === State[State.GameListLoaded] && (
        <>
          <label htmlFor="gameUuidSelection">Select a Game UUID: </label>
          <select id="gameUuidSelection" onChange={handleGameUuidSelection}>
            <option value="">--Select a game UUID--</option>
            {appState.gameUuids.map((gameUuid) => (
              <option key={gameUuid} value={gameUuid}>
                {gameUuid}
              </option>
            ))}
          </select>
        </>
      )}
    </div>
  );
};

export default App;
