import React, { useState, useEffect } from "react";
import { v4 as uuidv4 } from "uuid";
import "./App.css";
import CardsList from "./CardsList";
import { playerNames } from "./Names";
import Games from "./Games";

interface LoginResponse {
  token: string;
}

interface JoinResponse {
  message: string;
  uuid: string;
}

function App() {
  const randomPlayerName = playerNames[Math.floor(Math.random() * playerNames.length)];
  const [playerName, setPlayerName] = useState(randomPlayerName);
  const [uuid, setUuid] = useState("");
  const [joined, setJoined] = useState(false);
  const [token, setToken] = useState<string | null>(null);
  const [gameUuid, setGameUuid] = useState("");
  const [gameUuids, setGameUuids] = useState<string[]>([]);

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
      } else {
        console.error(data);
      }
    } catch (err) {
      console.error(err);
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
        setUuid(data.uuid);
        setGameUuid(uuid);
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
      {joined && token && <CardsList uuid={uuid} token={token} gameUuid={gameUuid} />}
      <Games uuids={gameUuids} onSelect={handleSelectGame} />
    </div>
  );
}

export default App;
