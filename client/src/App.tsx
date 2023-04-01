import React, { useState, useEffect } from 'react';
import { GameClient } from './Common/GameClient';
import { State } from './Common/StateManager';
import { LogMessage } from './Common/Logger';

interface AppState {
  state: string;
  gameUuids: string[];
  subscribedGameUuids: string[];
  userUuid: string;
  jwtToken: string;
}

const App: React.FC = () => {
  const updateState = () => {
    const newState: AppState = {
      state: State[client.stateManager.state],
      gameUuids: client.stateManager.gameUuids,
      subscribedGameUuids: client.stateManager.subscribedGameUuids,
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
    subscribedGameUuids: [],
    userUuid: '',
    jwtToken: '',
  });
  const [logs, setLogs] = useState<LogMessage[]>([]);

  useEffect(() => {
    setLogs(client.logger.getLogs());
  }, [client]);

  const handleLogin = () => {
    client.login(loginName);
  };

  const handleGameUuidSelection = (event: React.ChangeEvent<HTMLSelectElement>) => {
    client.selectTheGameUuid(event.target.value);
  };

  const handleButtonClick = () => {
    client.fetchGameData(appState.gameUuids[0]);
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
        Subs Game UUIDs: {appState.subscribedGameUuids.join(', ')}
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


      <br />
      <button onClick={handleButtonClick}>Fetch Game Data</button>
      <br />
      <h2>Logs</h2>
      <div style={{ maxHeight: '200px', overflowY: 'auto' }}>
        <pre>
          {logs.map((log, index) => (
            <div key={index} style={{ color: log.level === 1 ? 'red' : 'black' }}>
              [{log.timestamp}] {log.level === 0 ? 'LOG' : 'ERROR'}: {log.message}
            </div>
          ))}
        </pre>
      </div>
    </div>
  );
};

export default App;
