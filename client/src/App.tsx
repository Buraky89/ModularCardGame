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


  const queryParams = new URLSearchParams(window.location.search);
  const customToken = queryParams.get("customToken") || undefined;

  const [client] = useState(new GameClient(updateState, customToken));

  // TODO: at a later time, use a base component that runs this automatically. it will also probably handle update state and all that stuff too.
  useEffect(() => {
    client.afterInit();
  }, []);

  const [appState, setAppState] = useState<StateManagerWrapper | null>(client.getStateManager());
  const [logs, setLogs] = useState<LogMessage[]>([]);
  const [devMode, setDevMode] = useState(false);
  const [devModeClicks, setDevModeClicks] = useState(0);

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

  const handleCustomTokenButtonClick = (token: string) => {
    const url = new URL(window.location.href);
    url.searchParams.set("customToken", token);
    window.location.href = url.toString();
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
            <button onClick={() => handleCustomTokenButtonClick("eyJhbGciOiJSUzI1NiIsInR5cCIgOiAiSldUIiwia2lkIiA6ICJ2UHUtbWVvR2REQnluZzUyanFycXlTUF9MMDYtbXpBR2VmOVFPNTRxTE9BIn0.eyJleHAiOjE2ODE4OTQyNzIsImlhdCI6MTY4MTg1ODI3NywiYXV0aF90aW1lIjoxNjgxODU4MjcyLCJqdGkiOiJhYmZmZTkxMi05YjQ3LTQ2ODItYjg2Zi00ZDNlNGVmYmMwYjMiLCJpc3MiOiJodHRwOi8vbG9jYWxob3N0OjgwODAvcmVhbG1zL0ZsZXhpYmxlQ2FyZEdhbWUiLCJhdWQiOiJhY2NvdW50Iiwic3ViIjoiYzcwZjU5ZGMtMmY3Yy00MTAzLWFkMmYtN2ZiYjNiYjg1NTM2IiwidHlwIjoiQmVhcmVyIiwiYXpwIjoiZmxleGlibGUtY2FyZC1nYW1lIiwic2Vzc2lvbl9zdGF0ZSI6ImQ2MDk5ZDI4LWIxYjQtNDBmNi05M2FmLTk3OTU2NzI1ZWVlYyIsImFjciI6IjEiLCJhbGxvd2VkLW9yaWdpbnMiOlsiaHR0cDovL2xvY2FsaG9zdDozMDAyIiwiaHR0cDovL2xvY2FsaG9zdDozMDAyLyJdLCJyZWFsbV9hY2Nlc3MiOnsicm9sZXMiOlsib2ZmbGluZV9hY2Nlc3MiLCJ1bWFfYXV0aG9yaXphdGlvbiIsImRlZmF1bHQtcm9sZXMtZmxleGlibGVjYXJkZ2FtZSJdfSwicmVzb3VyY2VfYWNjZXNzIjp7ImFjY291bnQiOnsicm9sZXMiOlsibWFuYWdlLWFjY291bnQiLCJtYW5hZ2UtYWNjb3VudC1saW5rcyIsInZpZXctcHJvZmlsZSJdfX0sInNjb3BlIjoicHJvZmlsZSBlbWFpbCIsInNpZCI6ImQ2MDk5ZDI4LWIxYjQtNDBmNi05M2FmLTk3OTU2NzI1ZWVlYyIsImVtYWlsX3ZlcmlmaWVkIjpmYWxzZSwibmFtZSI6ImR1bW15IHBsYXllcjEiLCJwcmVmZXJyZWRfdXNlcm5hbWUiOiJkdW1teXBsYXllcjEiLCJnaXZlbl9uYW1lIjoiZHVtbXkiLCJmYW1pbHlfbmFtZSI6InBsYXllcjEiLCJlbWFpbCI6ImR1bW15cGxheWVyMUBkdW1teXBsYXllci5jb20ifQ.Yeoib9N2bc8k97AJ7fuugMORzDSeyAh0hdlRmmLAjcHezVD90iiVUBSLdGu32vXd1jhtpM7-cgbrMHnYa0kQZEloTC0ZcO1VDywaDCnJ_EQJMqPxhcwZAbDk6A9flPfXg6A3PEz_1u82kkb_B48G_FapTnRSxlKeqZ2QnLeM1ATl53FP_2RiWUEQAUifgBvbD9pPbLdhlg4YfZ0cETRO9X-w8HRHip8n43l4rnfwS8CNgBvjWaMkdoVfGjW26o9lASyDuL4nCL3Fqt8iS_QD-W9PKuCETVtvVlxdUGv_RowW00e8l2PBT2gb6ps5zMyfO7mvxHUVw0EA0-t33BVGTg")}>Set token to dummyplayer1</button>
            <button onClick={() => handleCustomTokenButtonClick("eyJhbGciOiJSUzI1NiIsInR5cCIgOiAiSldUIiwia2lkIiA6ICJ2UHUtbWVvR2REQnluZzUyanFycXlTUF9MMDYtbXpBR2VmOVFPNTRxTE9BIn0.eyJleHAiOjE2ODE4OTQzMTksImlhdCI6MTY4MTg1ODMyNCwiYXV0aF90aW1lIjoxNjgxODU4MzE5LCJqdGkiOiIyYzQxMDkyNC02ZDllLTQ5NzgtOTZlMy0xMzNjYjczNWJlMDMiLCJpc3MiOiJodHRwOi8vbG9jYWxob3N0OjgwODAvcmVhbG1zL0ZsZXhpYmxlQ2FyZEdhbWUiLCJhdWQiOiJhY2NvdW50Iiwic3ViIjoiY2VlZjM3ZmMtOTZjZS00NDQ0LWFjMGMtZTdmZWMyN2QyNTdhIiwidHlwIjoiQmVhcmVyIiwiYXpwIjoiZmxleGlibGUtY2FyZC1nYW1lIiwic2Vzc2lvbl9zdGF0ZSI6ImQwY2MyNWIzLTYwZjEtNGU4Zi1hNjM0LTYxNTFhMGVmMzE5ZiIsImFjciI6IjEiLCJhbGxvd2VkLW9yaWdpbnMiOlsiaHR0cDovL2xvY2FsaG9zdDozMDAyIiwiaHR0cDovL2xvY2FsaG9zdDozMDAyLyJdLCJyZWFsbV9hY2Nlc3MiOnsicm9sZXMiOlsib2ZmbGluZV9hY2Nlc3MiLCJ1bWFfYXV0aG9yaXphdGlvbiIsImRlZmF1bHQtcm9sZXMtZmxleGlibGVjYXJkZ2FtZSJdfSwicmVzb3VyY2VfYWNjZXNzIjp7ImFjY291bnQiOnsicm9sZXMiOlsibWFuYWdlLWFjY291bnQiLCJtYW5hZ2UtYWNjb3VudC1saW5rcyIsInZpZXctcHJvZmlsZSJdfX0sInNjb3BlIjoicHJvZmlsZSBlbWFpbCIsInNpZCI6ImQwY2MyNWIzLTYwZjEtNGU4Zi1hNjM0LTYxNTFhMGVmMzE5ZiIsImVtYWlsX3ZlcmlmaWVkIjpmYWxzZSwibmFtZSI6ImR1bW15IHBsYXllcjIiLCJwcmVmZXJyZWRfdXNlcm5hbWUiOiJkdW1teXBsYXllcjIiLCJnaXZlbl9uYW1lIjoiZHVtbXkiLCJmYW1pbHlfbmFtZSI6InBsYXllcjIiLCJlbWFpbCI6ImR1bW15cGxheWVyMkBkdW1teXBsYXllci5jb20ifQ.LIciuupO4Fh1GQ2XGbxRMNkqBMoWXTTCvTG5abdWJ71AF6TfDkZ3YX7TC1s0f-PgdlWezlsmoMI4AL4ncQ9RVDVE8iDkFdFxYHNNNDMIqPXCafFgduMuFWEczb9Iue3Bm7O_1QZ862r9SIDbYECxF8mHWQuGeiONgwsyfgSJOtXcqmkXX6fpq6EC_mX3kMT4x0psovr-jESOrppHsGP14J4q8w61XpJXG7ZbuejgdJZDDc9AfYHN4SOcDO6JpmoBC1ThjVjsZbOku2xVGNzx0NRXBZkjKXCSNrwL69vN0A7hXTVwNrAOxPjbDEpGVJgbpPuKNtS36TnRfW3t6GhjPA")}>Set token to dummyplayer2</button>
            <button onClick={() => handleCustomTokenButtonClick("eyJhbGciOiJSUzI1NiIsInR5cCIgOiAiSldUIiwia2lkIiA6ICJ2UHUtbWVvR2REQnluZzUyanFycXlTUF9MMDYtbXpBR2VmOVFPNTRxTE9BIn0.eyJleHAiOjE2ODE4OTQzMzcsImlhdCI6MTY4MTg1ODM0MiwiYXV0aF90aW1lIjoxNjgxODU4MzM3LCJqdGkiOiI0ZmQwMTJkYi02MGQ2LTQ5ZjUtYjYxOS0xNWIzMWQ4ZjFhNDIiLCJpc3MiOiJodHRwOi8vbG9jYWxob3N0OjgwODAvcmVhbG1zL0ZsZXhpYmxlQ2FyZEdhbWUiLCJhdWQiOiJhY2NvdW50Iiwic3ViIjoiODM2YzgzMDgtNGE0My00YWVmLWFmNjQtMmJiMzdiMDg5ZGMyIiwidHlwIjoiQmVhcmVyIiwiYXpwIjoiZmxleGlibGUtY2FyZC1nYW1lIiwic2Vzc2lvbl9zdGF0ZSI6IjRhMWVmNThkLWRiNTEtNDMyNS05MGU5LTRhYzNmNDYwNWVmZCIsImFjciI6IjEiLCJhbGxvd2VkLW9yaWdpbnMiOlsiaHR0cDovL2xvY2FsaG9zdDozMDAyIiwiaHR0cDovL2xvY2FsaG9zdDozMDAyLyJdLCJyZWFsbV9hY2Nlc3MiOnsicm9sZXMiOlsib2ZmbGluZV9hY2Nlc3MiLCJ1bWFfYXV0aG9yaXphdGlvbiIsImRlZmF1bHQtcm9sZXMtZmxleGlibGVjYXJkZ2FtZSJdfSwicmVzb3VyY2VfYWNjZXNzIjp7ImFjY291bnQiOnsicm9sZXMiOlsibWFuYWdlLWFjY291bnQiLCJtYW5hZ2UtYWNjb3VudC1saW5rcyIsInZpZXctcHJvZmlsZSJdfX0sInNjb3BlIjoicHJvZmlsZSBlbWFpbCIsInNpZCI6IjRhMWVmNThkLWRiNTEtNDMyNS05MGU5LTRhYzNmNDYwNWVmZCIsImVtYWlsX3ZlcmlmaWVkIjpmYWxzZSwibmFtZSI6ImR1bW15IHBsYXllcjMiLCJwcmVmZXJyZWRfdXNlcm5hbWUiOiJkdW1teXBsYXllcjMiLCJnaXZlbl9uYW1lIjoiZHVtbXkiLCJmYW1pbHlfbmFtZSI6InBsYXllcjMiLCJlbWFpbCI6ImR1bW15cGxheWVyM0BkdW1teXBsYXllci5jb20ifQ.B3_h7SKksxwQkwH8V_stCjzNvx4SPsBQAOPZsoaD1131_robda9t8vcGqo5VBu0_e0DMUYyBDSACZhmFpf94jcfvf-F5xb3kAi7k8PM_0AMd_ZCZmajo5M-i4btSClurNLiLb8OZ7_Tsg4huSAqDNYx6JtunCzyutbhvKCDMDKyscgZo7KYTxyGVUNfTxwkgFES-Y49R8vNICj_fsWuqWAvYkvhCKYTePsbnkBnfy0juo-PSct45yvkFUqmZA-VhWJtFCe3tKiK75FuEO8_ffCx1U2UkMEXj-oO9aMdI26y9n3tivYxjK5nBDzDacouxOhKpkdIS_CR5p7eyq6hjhg")}>Set token to dummyplayer3</button>
            <button onClick={() => handleCustomTokenButtonClick("eyJhbGciOiJSUzI1NiIsInR5cCIgOiAiSldUIiwia2lkIiA6ICJ2UHUtbWVvR2REQnluZzUyanFycXlTUF9MMDYtbXpBR2VmOVFPNTRxTE9BIn0.eyJleHAiOjE2ODE4OTQzNjAsImlhdCI6MTY4MTg1ODM2NSwiYXV0aF90aW1lIjoxNjgxODU4MzYwLCJqdGkiOiI3Y2I0MGJiNS00N2I4LTQ4ZTMtOTk0Ni1kNDFjYjhkYjVkMmYiLCJpc3MiOiJodHRwOi8vbG9jYWxob3N0OjgwODAvcmVhbG1zL0ZsZXhpYmxlQ2FyZEdhbWUiLCJhdWQiOiJhY2NvdW50Iiwic3ViIjoiODNmMDhkNGYtNzBiMC00YmY2LTk5M2YtMzM3ZmNlYzUxNzhjIiwidHlwIjoiQmVhcmVyIiwiYXpwIjoiZmxleGlibGUtY2FyZC1nYW1lIiwic2Vzc2lvbl9zdGF0ZSI6IjUzNjVhYzY4LTc5Y2MtNDA5NS05NjhiLWNjYjkxYjQ4YWU0YiIsImFjciI6IjEiLCJhbGxvd2VkLW9yaWdpbnMiOlsiaHR0cDovL2xvY2FsaG9zdDozMDAyIiwiaHR0cDovL2xvY2FsaG9zdDozMDAyLyJdLCJyZWFsbV9hY2Nlc3MiOnsicm9sZXMiOlsib2ZmbGluZV9hY2Nlc3MiLCJ1bWFfYXV0aG9yaXphdGlvbiIsImRlZmF1bHQtcm9sZXMtZmxleGlibGVjYXJkZ2FtZSJdfSwicmVzb3VyY2VfYWNjZXNzIjp7ImFjY291bnQiOnsicm9sZXMiOlsibWFuYWdlLWFjY291bnQiLCJtYW5hZ2UtYWNjb3VudC1saW5rcyIsInZpZXctcHJvZmlsZSJdfX0sInNjb3BlIjoicHJvZmlsZSBlbWFpbCIsInNpZCI6IjUzNjVhYzY4LTc5Y2MtNDA5NS05NjhiLWNjYjkxYjQ4YWU0YiIsImVtYWlsX3ZlcmlmaWVkIjpmYWxzZSwibmFtZSI6ImR1bW15IHBsYXllcjQiLCJwcmVmZXJyZWRfdXNlcm5hbWUiOiJkdW1teXBsYXllcjQiLCJnaXZlbl9uYW1lIjoiZHVtbXkiLCJmYW1pbHlfbmFtZSI6InBsYXllcjQiLCJlbWFpbCI6ImR1bW15cGxheWVyNEBkdW1teXBsYXllci5jb20ifQ.cIgwag2Cm7hASj15JzSl9IbDVGKyjJOHc9ElftEhrBaXyDH2HX_PbW_ddlCmFBy1sDLv4NGhUWX-BahokEtooZq59B6Vr0jNmZwhz4wR2gD_HjjBefU_ogguCRjQa76jrLViBTIjaFbyv0mKStxWrDv1TnKvWlbwYFnpzVKggVGEWP8cwtc8784m3nF4yJcP_HsYo6OqxxthQtUd5fUlOqOyuk7pxkECXfTZZij0bROP3elgKn5L9iOGB2F-Y8hBiMQe2F1hwSacFhUxiHmzHu3qyIK8fdNFf8v9bGHMZ1uWlap5WpIMk31xpK0H275k49gqB_CPgP4XkZZKoOYgPw")}>Set token to dummyplayer4</button>
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
