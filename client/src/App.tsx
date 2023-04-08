import React, { useState, useEffect } from 'react';
import { GameClient } from './Common/GameClient';
import { State } from './Common/StateManager';
import { LogMessage, LogLevel } from './Common/Logger';
import CardsList from './CardsList'; // Import CardsList component
import { SocketClientMock } from 'socket.io-mock-ts';
import GameStateManager from './Common/GameStateManager';

interface AppState {
  state: string;
  gameUuids: string[];
  subscribedGameUuids: string[];
  userUuid: string;
  jwtToken: string;
  gameStateManagers: Map<string, GameStateManager>;
}

const App: React.FC = () => {
  const updateState = () => {
    const newState: AppState = {
      state: State[client.stateManager.state],
      gameUuids: client.stateManager.gameUuids,
      subscribedGameUuids: client.stateManager.subscribedGameUuids,
      userUuid: client.stateManager.userUuid,
      jwtToken: client.stateManager.jwtToken,
      gameStateManagers: client.stateManager.gameStateManagers
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
    gameStateManagers: new Map()
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
    appState.gameUuids.forEach(uuid => {
      client.fetchGameData(uuid);
    });
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

      {appState.subscribedGameUuids.length > 0 && appState.gameStateManagers.size > 0 && (
        Array.from(appState.gameStateManagers.entries()).map(([gameUuid, gameStateManager]) => (
          <CardsList
            key={gameUuid}
            gameStateManager={gameStateManager}
            gameUuid={gameUuid}
          />
        ))
      )}

    </div>
  );
};

export default App;
