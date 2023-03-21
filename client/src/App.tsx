import React, { useState, useEffect } from "react";
import { v4 as uuidv4 } from "uuid";
import "./App.css";
import CardsList from "./CardsList";
import { playerNames } from "./Names";
import Games from "./Games";
import { AppStateManager } from "./Common/AppStateManager";
import { LoginResponse, JoinResponse, ErrorResponse } from "./Common/ResponseTypes";

function App() {
  const randomPlayerName = playerNames[Math.floor(Math.random() * playerNames.length)];
  const [playerName, setPlayerName] = useState(randomPlayerName);
  const [joined, setJoined] = useState(false);
  const [token, setToken] = useState<string | null>(null);
  const [gameUuids, setGameUuids] = useState<string[]>([]);
  const [appState, setAppState] = useState({ state: 'notLoggedIn', gameUuid: '' });
  const appStateManager = new AppStateManager();

  const handleLogin = async () => {
    try {
      const response = await fetch("http://localhost:3001/login", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ username: playerName }),
      });

      const data: LoginResponse = await response.json();

      if (response.ok) {
        console.log("Logged in successfully");
        setToken(data.token);
        setJoined(true);
        
        const loginResponse: LoginResponse = {
          token: data.token
        };
        const messageEvent = new MessageEvent<LoginResponse>("success", {
          data: loginResponse
        });

        appStateManager.handleLoginSuccess(messageEvent);
      } else {
        console.error(data);

        const errorResponse: ErrorResponse = {
          message: data.toString()
        };
        const errorEvent = new MessageEvent<ErrorResponse>("error", {
          data: errorResponse
        });

        appStateManager.handleLoginError(errorEvent);
      }
    } catch (err) {
      console.error(err);

      const errorResponse: ErrorResponse = {
        message: "Network error"
      };
      const errorEvent = new MessageEvent<ErrorResponse>("error", {
        data: errorResponse
      });

      appStateManager.handleLoginError(errorEvent);
    }
  };

  const handleSelectGame = async (uuid: string) => {
    try {
      const response = await fetch("http://localhost:3001/join", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`,
        },
        body: JSON.stringify({ token, gameUuid: uuid }),
      });

      const data: JoinResponse = await response.json();

      if (response.ok) {
        console.log(data.message);
        //setUuid(data.uuid);
        //setGameUuid(uuid);
        appStateManager.selectGame(uuid);
      } else {
        console.error(data.message);
      }
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    const getGames = async () => {
      try {
        const response = await fetch("http://localhost:3001/getGames");
        const data = await response.json();

        if (response.ok && data.length > 0) {
          setGameUuids(data);
        }
      } catch (err) {
        console.error(err);
      }
    };

    getGames();
  }, []);

  useEffect(() => {
    const intervalId = setInterval(() => {
      setAppState(appStateManager.getState());
    }, 500);

    return () => {
      clearInterval(intervalId);
    };
  }, []);

  return (
    <div className="App">
      <div>
        <label>
          Player Name:
          <input
            type="text"
            value={playerName}
            onChange={(e) => setPlayerName(e.target.value)}
          />
        </label>
        <button onClick={handleLogin}>Login</button>
      </div>
      {appState.state === 'inGame' && joined && token && <CardsList uuid={uuidv4()} token={token} gameUuid={appState.gameUuid} />}
      {appState.state === 'connectingToGames' && <div>Connecting to games...</div>}
      {appState.state === 'notLoggedIn' && <div>Not logged in</div>}
      {appState.state === 'loginError' && <div>Login error</div>}
      {appState.state === 'connectionLostWaiting' && <div>Connection lost. Waiting...</div>}
      {appState.state === 'notLoggedIn' || appState.state === 'loginError' || appState.state === 'connectingToGames' ?
        <Games uuids={gameUuids} onSelect={handleSelectGame} /> : null}
    </div>
  );
}

export default App;
