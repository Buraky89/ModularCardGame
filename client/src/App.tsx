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
            <button onClick={() => handleCustomTokenButtonClick("eyJhbGciOiJSUzI1NiIsInR5cCIgOiAiSldUIiwia2lkIiA6ICJ2UHUtbWVvR2REQnluZzUyanFycXlTUF9MMDYtbXpBR2VmOVFPNTRxTE9BIn0.eyJleHAiOjE2ODE3Njk0MDEsImlhdCI6MTY4MTc2OTEwMSwiYXV0aF90aW1lIjoxNjgxNzY5MDk2LCJqdGkiOiIwYWM0NTUwNy05ZGEzLTQyMzYtYmQzMy1jMTdjODdlNTIzNWUiLCJpc3MiOiJodHRwOi8vbG9jYWxob3N0OjgwODAvcmVhbG1zL0ZsZXhpYmxlQ2FyZEdhbWUiLCJhdWQiOiJhY2NvdW50Iiwic3ViIjoiYzcwZjU5ZGMtMmY3Yy00MTAzLWFkMmYtN2ZiYjNiYjg1NTM2IiwidHlwIjoiQmVhcmVyIiwiYXpwIjoiZmxleGlibGUtY2FyZC1nYW1lIiwic2Vzc2lvbl9zdGF0ZSI6IjViN2VhMmUzLTEzZjktNDdiNC1hZWZkLWZkMGFjZjEwZDhlNSIsImFjciI6IjEiLCJhbGxvd2VkLW9yaWdpbnMiOlsiaHR0cDovL2xvY2FsaG9zdDozMDAyIiwiaHR0cDovL2xvY2FsaG9zdDozMDAyLyJdLCJyZWFsbV9hY2Nlc3MiOnsicm9sZXMiOlsib2ZmbGluZV9hY2Nlc3MiLCJ1bWFfYXV0aG9yaXphdGlvbiIsImRlZmF1bHQtcm9sZXMtZmxleGlibGVjYXJkZ2FtZSJdfSwicmVzb3VyY2VfYWNjZXNzIjp7ImFjY291bnQiOnsicm9sZXMiOlsibWFuYWdlLWFjY291bnQiLCJtYW5hZ2UtYWNjb3VudC1saW5rcyIsInZpZXctcHJvZmlsZSJdfX0sInNjb3BlIjoicHJvZmlsZSBlbWFpbCIsInNpZCI6IjViN2VhMmUzLTEzZjktNDdiNC1hZWZkLWZkMGFjZjEwZDhlNSIsImVtYWlsX3ZlcmlmaWVkIjpmYWxzZSwibmFtZSI6ImR1bW15IHBsYXllcjEiLCJwcmVmZXJyZWRfdXNlcm5hbWUiOiJkdW1teXBsYXllcjEiLCJnaXZlbl9uYW1lIjoiZHVtbXkiLCJmYW1pbHlfbmFtZSI6InBsYXllcjEiLCJlbWFpbCI6ImR1bW15cGxheWVyMUBkdW1teXBsYXllci5jb20ifQ.EhEMxYc83jS9Vyn5xYuVYqweel_REIu0IonxGuLeDW-40fo6HKYTH8v3g5FxyD8Ir8XgDwiGzRke-S0Y7-nGDfa91M9SqinA55DVwWvxGaeDfX-dG1puthI0zMO3j7jenRPEGtK3a4mksqShBCGVGenwopiiCkc5ZF5YMbSfbKKZj4hczgjbWxSc9JLRx31yJm7AlGnfBRPJPvZp4Tk63KmFDx7G70D_dLonOlNiMRQGKxTdVpZ58SBs3UgRZRYsmGPlTy-DGPTOxE2Pw6SN0RIi7cv5FPIacH0sWz1TXUmkS7tPVAGKD8mfTwfK1RLppgKSvInsx9bhvaLvQQxqtQ")}>Set token to dummyplayer1</button>
            <button onClick={() => handleCustomTokenButtonClick("eyJhbGciOiJSUzI1NiIsInR5cCIgOiAiSldUIiwia2lkIiA6ICJ2UHUtbWVvR2REQnluZzUyanFycXlTUF9MMDYtbXpBR2VmOVFPNTRxTE9BIn0.eyJleHAiOjE2ODE3Njk0MjEsImlhdCI6MTY4MTc2OTEyMSwiYXV0aF90aW1lIjoxNjgxNzY5MTE2LCJqdGkiOiIxNzNhMGE5OS0wMGE2LTQ0YzMtODM4MS1jOWQ5M2NhMDk3MjkiLCJpc3MiOiJodHRwOi8vbG9jYWxob3N0OjgwODAvcmVhbG1zL0ZsZXhpYmxlQ2FyZEdhbWUiLCJhdWQiOiJhY2NvdW50Iiwic3ViIjoiY2VlZjM3ZmMtOTZjZS00NDQ0LWFjMGMtZTdmZWMyN2QyNTdhIiwidHlwIjoiQmVhcmVyIiwiYXpwIjoiZmxleGlibGUtY2FyZC1nYW1lIiwic2Vzc2lvbl9zdGF0ZSI6ImQ2MzQ4MmU4LWRjM2QtNDg1Ny1hYzQxLTYyZjU1ZDNhZDg1NCIsImFjciI6IjEiLCJhbGxvd2VkLW9yaWdpbnMiOlsiaHR0cDovL2xvY2FsaG9zdDozMDAyIiwiaHR0cDovL2xvY2FsaG9zdDozMDAyLyJdLCJyZWFsbV9hY2Nlc3MiOnsicm9sZXMiOlsib2ZmbGluZV9hY2Nlc3MiLCJ1bWFfYXV0aG9yaXphdGlvbiIsImRlZmF1bHQtcm9sZXMtZmxleGlibGVjYXJkZ2FtZSJdfSwicmVzb3VyY2VfYWNjZXNzIjp7ImFjY291bnQiOnsicm9sZXMiOlsibWFuYWdlLWFjY291bnQiLCJtYW5hZ2UtYWNjb3VudC1saW5rcyIsInZpZXctcHJvZmlsZSJdfX0sInNjb3BlIjoicHJvZmlsZSBlbWFpbCIsInNpZCI6ImQ2MzQ4MmU4LWRjM2QtNDg1Ny1hYzQxLTYyZjU1ZDNhZDg1NCIsImVtYWlsX3ZlcmlmaWVkIjpmYWxzZSwibmFtZSI6ImR1bW15IHBsYXllcjIiLCJwcmVmZXJyZWRfdXNlcm5hbWUiOiJkdW1teXBsYXllcjIiLCJnaXZlbl9uYW1lIjoiZHVtbXkiLCJmYW1pbHlfbmFtZSI6InBsYXllcjIiLCJlbWFpbCI6ImR1bW15cGxheWVyMkBkdW1teXBsYXllci5jb20ifQ.WUiGSHRNgFAVK5b9DB06_IDC0K8Gg-5AdBasGPYLyh8qB-ZACdh07LvDBzvbck_UtuDckWI5h9ddRCYFwm_bo1a9-ti6evbhl1xM53mIHmk7ikb6Wxh2OusODYMEy-v2wOd6XZFHYfa2B-mLb9bHEsWQ-j7NKQXZx7Vi0eOtc3NtbWMAJE4Qspxi7xf70zsxhbhReMvmHgtGnUKB7s5RIrb8a6n_4SNVSJ1B-6KGqv3Vw5dwED33nnTSgYxYPeX9sOSveG6FmoLR5bJBCSJDAlDUqi1Qar_32EFqwFL5r8RjTOJ8RI0mmF16hbO-tHYVd35U4rLB2b4gRIoEfvLWgw")}>Set token to dummyplayer2</button>
            <button onClick={() => handleCustomTokenButtonClick("eyJhbGciOiJSUzI1NiIsInR5cCIgOiAiSldUIiwia2lkIiA6ICJ2UHUtbWVvR2REQnluZzUyanFycXlTUF9MMDYtbXpBR2VmOVFPNTRxTE9BIn0.eyJleHAiOjE2ODE3Njk0NDUsImlhdCI6MTY4MTc2OTE0NSwiYXV0aF90aW1lIjoxNjgxNzY5MTQwLCJqdGkiOiI1Mzg5ODNkMi0wZmIxLTQ3MjMtYmJkMi0xNTYzZTkxOTllMTEiLCJpc3MiOiJodHRwOi8vbG9jYWxob3N0OjgwODAvcmVhbG1zL0ZsZXhpYmxlQ2FyZEdhbWUiLCJhdWQiOiJhY2NvdW50Iiwic3ViIjoiODM2YzgzMDgtNGE0My00YWVmLWFmNjQtMmJiMzdiMDg5ZGMyIiwidHlwIjoiQmVhcmVyIiwiYXpwIjoiZmxleGlibGUtY2FyZC1nYW1lIiwic2Vzc2lvbl9zdGF0ZSI6ImEwNzI2MGRkLWY4MmItNGQ3NC04NTMyLTRkMWE5MTQ3NTZhYiIsImFjciI6IjEiLCJhbGxvd2VkLW9yaWdpbnMiOlsiaHR0cDovL2xvY2FsaG9zdDozMDAyIiwiaHR0cDovL2xvY2FsaG9zdDozMDAyLyJdLCJyZWFsbV9hY2Nlc3MiOnsicm9sZXMiOlsib2ZmbGluZV9hY2Nlc3MiLCJ1bWFfYXV0aG9yaXphdGlvbiIsImRlZmF1bHQtcm9sZXMtZmxleGlibGVjYXJkZ2FtZSJdfSwicmVzb3VyY2VfYWNjZXNzIjp7ImFjY291bnQiOnsicm9sZXMiOlsibWFuYWdlLWFjY291bnQiLCJtYW5hZ2UtYWNjb3VudC1saW5rcyIsInZpZXctcHJvZmlsZSJdfX0sInNjb3BlIjoicHJvZmlsZSBlbWFpbCIsInNpZCI6ImEwNzI2MGRkLWY4MmItNGQ3NC04NTMyLTRkMWE5MTQ3NTZhYiIsImVtYWlsX3ZlcmlmaWVkIjpmYWxzZSwibmFtZSI6ImR1bW15IHBsYXllcjMiLCJwcmVmZXJyZWRfdXNlcm5hbWUiOiJkdW1teXBsYXllcjMiLCJnaXZlbl9uYW1lIjoiZHVtbXkiLCJmYW1pbHlfbmFtZSI6InBsYXllcjMiLCJlbWFpbCI6ImR1bW15cGxheWVyM0BkdW1teXBsYXllci5jb20ifQ.CuquwFqKrgNmBSXNpLncJO9ykpH2ErgYi_ym-URtelXlZBKyYACzkTaIKm7Qe8OJumz-RlVp8Q-0O9ttboMqLOXW6GRruqqXo5Y5jurcGW6aaMx33RmqhL8pI18qkqUwfFr_vAVe7uUtSBnA5VCeO-3zmZ55_S22HTcbF-RBtmKz-V23ANGTyN_f9xd6bR_9nGhm1kPtgSwI7u09cYGiUrOj9I1pZ8z6QKBjJyQ2wC0YjGnuYRqKIMJ_HL5cmLOjCosJwVMZ8RLhUzfE2vqHA6WTvLj24zt9pfKbiPfgv3skKFtMdqZrJ0_LWaU6cOJrAua3qKmTiEspjZvDSlZz8A")}>Set token to dummyplayer3</button>
            <button onClick={() => handleCustomTokenButtonClick("eyJhbGciOiJSUzI1NiIsInR5cCIgOiAiSldUIiwia2lkIiA6ICJ2UHUtbWVvR2REQnluZzUyanFycXlTUF9MMDYtbXpBR2VmOVFPNTRxTE9BIn0.eyJleHAiOjE2ODE3NjkzNDIsImlhdCI6MTY4MTc2OTA0MiwiYXV0aF90aW1lIjoxNjgxNzY5MDM3LCJqdGkiOiI0ZWRmYTA2Mi1lNGExLTQ0ZDYtYWYyMi1kNDExZWE2MTVjN2EiLCJpc3MiOiJodHRwOi8vbG9jYWxob3N0OjgwODAvcmVhbG1zL0ZsZXhpYmxlQ2FyZEdhbWUiLCJhdWQiOiJhY2NvdW50Iiwic3ViIjoiODNmMDhkNGYtNzBiMC00YmY2LTk5M2YtMzM3ZmNlYzUxNzhjIiwidHlwIjoiQmVhcmVyIiwiYXpwIjoiZmxleGlibGUtY2FyZC1nYW1lIiwic2Vzc2lvbl9zdGF0ZSI6IjBmNThmZWZjLTA4MzEtNDRmOC05NzM1LWM5ZDY2NGIyNzUwMCIsImFjciI6IjEiLCJhbGxvd2VkLW9yaWdpbnMiOlsiaHR0cDovL2xvY2FsaG9zdDozMDAyIiwiaHR0cDovL2xvY2FsaG9zdDozMDAyLyJdLCJyZWFsbV9hY2Nlc3MiOnsicm9sZXMiOlsib2ZmbGluZV9hY2Nlc3MiLCJ1bWFfYXV0aG9yaXphdGlvbiIsImRlZmF1bHQtcm9sZXMtZmxleGlibGVjYXJkZ2FtZSJdfSwicmVzb3VyY2VfYWNjZXNzIjp7ImFjY291bnQiOnsicm9sZXMiOlsibWFuYWdlLWFjY291bnQiLCJtYW5hZ2UtYWNjb3VudC1saW5rcyIsInZpZXctcHJvZmlsZSJdfX0sInNjb3BlIjoicHJvZmlsZSBlbWFpbCIsInNpZCI6IjBmNThmZWZjLTA4MzEtNDRmOC05NzM1LWM5ZDY2NGIyNzUwMCIsImVtYWlsX3ZlcmlmaWVkIjpmYWxzZSwibmFtZSI6ImR1bW15IHBsYXllcjQiLCJwcmVmZXJyZWRfdXNlcm5hbWUiOiJkdW1teXBsYXllcjQiLCJnaXZlbl9uYW1lIjoiZHVtbXkiLCJmYW1pbHlfbmFtZSI6InBsYXllcjQiLCJlbWFpbCI6ImR1bW15cGxheWVyNEBkdW1teXBsYXllci5jb20ifQ.DoAzB1uj6_1aIujex4b3W6nq9cQuvu9zc_S6KnwmeqfrOQ8BGR-cvUYklkokwQAD_Z80ymLrU8ubqT8oa4JzPAHfezmy5a1VBfMpBEQWy4N1t4GZ6N8Pw_411ZzRPdvzNlRAFnl89yJb-TZGJ7VOD2dxILYApPJ7eAJG5KU8H0MvuG7y2AlcUiTUBcGuMcwX3Qx0BHcLr6hCJNvVqzm5pluvDNQHDq7vLdxR1nwu9UJAfWRbJqu5A3iHhX7dt5H8p5AsmTwUsmwz1MI2cThntCS_pNoCCR04iFrG9sXpOfFhYm3ZPzzZO-nbqgI6Azf0A24ighaLoZOt06wU6N7FOg")}>Set token to dummyplayer4</button>
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
