import React, { useState, useEffect } from 'react';
import { GameClient } from './Common/GameClient';
import { State } from './Common/StateManager';
import { LogMessage, LogLevel } from './Common/Logger';

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

  const handleFetchButtonClick = () => {
    client.fetchGameData(appState.gameUuids[0]);
  };

  const handleCreateButtonClick = () => {
    client.createGame();
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
      <button onClick={handleFetchButtonClick}>Fetch Game Data</button>
      <br />
      <button onClick={handleCreateButtonClick}>Create Game</button>
      <br />
      <h2>Logs</h2>
      <div style={{ maxHeight: '200px', overflowY: 'auto' }}>
        <pre>
          {logs.map((log, index) => (
            <div
              key={index}
              style={{
                color:
                  log.level === LogLevel.ERROR
                    ? 'red'
                    : log.level === LogLevel.LOG
                    ? 'black'
                    : 'blue',
              }}
            >
              [{log.timestamp}, {log.source}] {LogLevel[log.level]}: {log.message}
            </div>
          ))}
        </pre>
      </div>
    </div>
  );
};

export default App;
