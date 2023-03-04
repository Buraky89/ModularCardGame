import React, { useState } from "react";
import "./App.css";
import CardsList from "./CardsList";

function App() {
  const [playerName, setPlayerName] = useState("Player ");
  const [uuid, setUuid] = useState("");
  const [joined, setJoined] = useState(false);

  const handleJoin = async () => {
    try {
      const response = await fetch("http://localhost:3001/join", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ playerName, uuid }),
      });

      const data = await response.json();

      if (response.ok) {
        console.log(data.message);
        setJoined(true);
      } else {
        console.error(data.message);
      }
    } catch (err) {
      console.error(err);
    }
  };

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
        <label>
          UUID:
          <input
            type="text"
            value={uuid}
            onChange={(e) => setUuid(e.target.value)}
          />
        </label>
        <button onClick={handleJoin}>Join Game</button>
      </div>
      {joined && <CardsList uuid={uuid} />}
    </div>
  );
}

export default App;
