import React, { useState, useEffect } from 'react';
import { GameClient } from './Common/GameClient';
import { State, StateManager } from './Common/StateManager';
import { LogMessage, LogLevel } from './Common/Logger';
import CardsList from './CardsList'; // Import CardsList component
import { SocketClientMock } from 'socket.io-mock-ts';
import GameStateManager from './Common/GameStateManager';
import StateManagerWrapper from './Common/StateManagerWrapper';

const App: React.FC = () => {
  const updateState = () => {
    const newState: StateManagerWrapper = client.getStateManager();
    setAppState(newState);
  };
  
  const [client] = useState(new GameClient(updateState));
  const [appState, setAppState] = useState<StateManagerWrapper | null>(client.getStateManager());
  const [logs, setLogs] = useState<LogMessage[]>([]);


  const queryParams = new URLSearchParams(window.location.search);
  const code = queryParams.get("code") || undefined;

  useEffect(() => {
    if (client.stateManager.state === State.NotLoggedIn && code) {
      client.exchangeCodeForToken(code);
    }
  }, []);

  useEffect(() => {
    setLogs(client.logger.getLogs());
  }, [client]);

  const handleLogin = () => {
    client.login();
  };

  const handleGameUuidSelection = (event: React.ChangeEvent<HTMLSelectElement>) => {
    client.selectTheGameUuid(event.target.value);
  };

  if(appState == null){
    return (<></>);
  }

  const handleFetchButtonClick = () => {
    appState.stateManager.gameUuids.forEach(uuid => {
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
        State: {State[appState.stateManager.state]}
        <br />
        JWT Token: {appState.stateManager.jwtToken}
        <br />
        Game UUIDs: {appState.stateManager.gameUuids.join(', ')}
        <br />
        Subs Game UUIDs: {appState.stateManager.subscribedGameUuids.join(', ')}
        <br />
        User UUID: {appState.stateManager.userUuid}
      </p>
      <button onClick={handleLogin}>Login</button>
      {appState.stateManager.state === State.GameListLoaded && (
        <>
          <label htmlFor="gameUuidSelection">Select a Game UUID: </label>
          <select id="gameUuidSelection" onChange={handleGameUuidSelection}>
            <option value="">--Select a game UUID--</option>
            {appState.stateManager.gameUuids.map((gameUuid) => (
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

      {appState.stateManager.subscribedGameUuids.length > 0 && appState.stateManager.gameStateManagers.size > 0 && (
        Array.from(appState.stateManager.gameStateManagers.entries()).map(([gameUuid, gameStateManager]) => (
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
