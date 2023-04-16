import React, { useState, useEffect } from 'react';
import { GameClient } from './Common/GameClient';
import { State, StateManager } from './Common/StateManager';
import { LogMessage, LogLevel } from './Common/Logger';
import CardsList from './CardsList'; // Import CardsList component
import { SocketClientMock } from 'socket.io-mock-ts';
import GameStateManager from './Common/GameStateManager';
import StateManagerWrapper from './Common/StateManagerWrapper';
import Dev from './Dev'; // Import Logs component
import './App.css'; // Import the CSS file

const App: React.FC = () => {
  const updateState = () => {
    const newState: StateManagerWrapper = client.getStateManager();
    console.log("new state", newState);
    setAppState(newState);
  };

  const [client] = useState(new GameClient(updateState));

  // TODO: at a later time, use a base component that runs this automatically. it will also probably handle update state and all that stuff too.
  useEffect(() => {
    client.afterInit();
  }, []);

  const [appState, setAppState] = useState<StateManagerWrapper | null>(client.getStateManager());
  const [logs, setLogs] = useState<LogMessage[]>([]);
  const [devMode, setDevMode] = useState(false);
  const [devModeClicks, setDevModeClicks] = useState(0);

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

  useEffect(() => {
    const fetchInterval = setInterval(() => {
      handleFetchButtonClick();
    }, 5000);

    return () => {
      clearInterval(fetchInterval);
    };
  }, []);

  const handleLogin = () => {
    client.login();
  };

  const handleGameUuidSelection = (uuid: string) => {
    client.selectTheGameUuid(uuid);
  };

  const handleFetchButtonClick = () => {
    appState?.stateManager.subscribedGameUuids.forEach(uuid => {
      client.fetchGameData(uuid);
    });
  };

  const handleCreateButtonClick = () => {
    client.createGame();
  };

  const toggleDevMode = () => {
    if (devModeClicks >= 4) {
      setDevMode(!devMode);
      setDevModeClicks(0);
    } else {
      setDevModeClicks(devModeClicks + 1);
    }
  };

  const closeDevMode = () => {
    setDevMode(false);
  };

  if (appState == null) {
    return (<></>);
  }

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text).then(
      () => {
        // Clipboard successfully set
      },
      () => {
        // Clipboard write failed
      }
    );
  };

  const handleLogout = () => {
    client.logout();
  };

  const renderLoginButton = () => {
    const { state } = appState.stateManager;

    if (state === State.NotLoggedIn || state === State.TOKEN_RETRIEVAL_FAILED) {
      return <button onClick={handleLogin}>Login</button>;
    } else if (
      state === State.LoggingIn ||
      state === State.EXCHANGING_CODE_FOR_TOKEN
    ) {
      return (
        <button disabled>
          <span className="spinner"></span>
        </button>
      );
    } else {
      return <button onClick={handleLogout}>Logout</button>;
    }
  };

  return (
    <div>
      <header className="header">
        {!devMode && (
          <>
            {renderLoginButton()}
            <h1 onClick={toggleDevMode} style={{ cursor: 'pointer', flex: 1, textAlign: 'center' }}>Hearts</h1>
          </>
        )}
        {devMode && (
          <button onClick={closeDevMode}>X</button>
        )}
      </header>
      <div className="main-content">
        {devMode ? (
          <Dev logs={logs} appState={appState} />
        ) : (
          <>
            {appState.stateManager.state === State.GameListLoaded && (
              <>
                {appState.stateManager.gameUuids.map((gameUuid) => (
                  <button key={gameUuid} className="uuid-button" onClick={() => handleGameUuidSelection(gameUuid)}>
                    {gameUuid}
                  </button>
                ))}
              </>
            )}

            <br />
            <button className="plus-button" onClick={handleCreateButtonClick}>+</button>
            <br />

            {appState.stateManager.subscribedGameUuids.length > 0 && appState.stateManager.gameStateManagers.size > 0 && (
              Array.from(appState.stateManager.gameStateManagers.entries()).map(([gameUuid, gameStateManager]) => (
                <CardsList
                  key={gameUuid}
                  gameStateManager={gameStateManager}
                  gameUuid={gameUuid}
                />
              ))
            )}
          </>
        )}
      </div>
    </div>
  );
};

export default App;
