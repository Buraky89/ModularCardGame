import { useEffect, useState, useRef } from "react";
import { Card, CardType, ApiResponse, Player } from "./Card";
import MySVG from "./MySVG";
import { PlayerBox } from "./PlayerBox";
import "./CardsList.css";

interface CardsListProps {
  token: string;
  uuid: string;
}

function moveLastPlayerToBeginningUntilMe(players: Player[], myUuid: string): Player[] {
  const index = players.findIndex(player => player.uuid === myUuid);
  if (index === -1) {
    // myUuid is not among the players
    return players;
  }
  players.sort((a, b) => a.uuid.localeCompare(b.uuid));
  while (players[players.length - 1].uuid !== myUuid) {
    const lastPlayer = players.pop()!;
    players.unshift(lastPlayer);
  }
  return players;
}

enum GameState {
  NOT_STARTED,
  STARTED,
  ENDED,
}

function CardsList({ uuid, token }: CardsListProps) {
  const [deck, setDeck] = useState<Card[]>([]);
  const [playedDeck, setPlayedDeck] = useState<Card[]>([]);
  const [players, setPlayers] = useState<Player[]>([]);
  const [autoPlay, setAutoPlay] = useState<boolean>(false);
  const [gameState, setGameState] = useState<GameState>(GameState.NOT_STARTED);

  const timerIdRef = useRef<NodeJS.Timeout>();

  const headers = {
    "Content-Type": "application/json",
    Authorization: `Bearer ${token}`,
  };

  useEffect(() => {
    const intervalId = setInterval(() => {
      fetch(`http://localhost:3001/players/${uuid}`, { headers })
        .then((response) => response.json())
        .then((data: ApiResponse & { gameState: GameState }) => {
          if(data.deck) setDeck(data.deck);
          setPlayedDeck(data.playedDeck);
          setPlayers(moveLastPlayerToBeginningUntilMe(data.players, uuid) || []);
          setGameState(data.gameState);
        })
        .catch((error) => console.log(error));
    }, 5000);
  
    return () => clearInterval(intervalId);
  }, [uuid]);

  useEffect(() => {
    if (autoPlay) {
      timerIdRef.current = setInterval(() => {
        if (deck.length > 0) {
          handleCardClick(0);
        }
      }, 500);
    } else {
      clearInterval(timerIdRef.current!);
    }

    return () => clearInterval(timerIdRef.current!);
  }, [autoPlay, deck]);

  const handleCardClick = (cardIndex: number) => {
    fetch(`http://localhost:3001/players/${uuid}/play`, {
      method: "POST",
      headers,
      body: JSON.stringify({
        cardIndex,
      }),
    })
      .then((response) => response.json())
      .then((data: ApiResponse) => {
        setDeck(data.deck || []);
        setPlayedDeck(data.playedDeck);
        setPlayers(data.players || []);
      })
      .catch((error) => console.log(error));
  };

  const isYourTurn = players.find((player) => player.uuid === uuid && player.isTheirTurn);

  const startGame = () => {
    fetch(`http://localhost:3001/players/${uuid}/start`, {
      method: "POST",
      headers
    })
      .then((response) => response.json())
      //.then(() => setGameState(GameState.STARTED))
      .catch((error) => console.log(error));
  };

  return (
    <div className="cards-list">
      {gameState === GameState.NOT_STARTED && (
        <div className="not-started">
          <h1>Game is not started yet</h1>
          <button onClick={startGame}>Start</button>
        </div>
      )}
      {gameState !== GameState.NOT_STARTED && (
        <>
          <div className="player-row">
            <PlayerBox player={players[1]} isActive={players[1]?.isTheirTurn} />
          </div>
          <div className="main-row">
            <PlayerBox player={players[0]} isActive={players[0]?.isTheirTurn} />
            <div className="played-cards-container">
              {playedDeck.length > 0 &&
                playedDeck.map((card, index) => (
                  <div
                    style={{
                      position: "absolute",
                      top: "40%",
                      left: "40%",
                      zIndex: 1000 + index - playedDeck.length - index,
                      transform: `rotate(${index * 30}deg)`,
                    }}
                  >
                    <MySVG
                      key={`played-card-${index}`}
                      cardType={card.cardType}
                      score={card.score}
                      hidden={card.hidden}
                      handleClick={() => {}}
                    />
                  </div>
                ))}
              <div className="center-card"></div>
            </div>
            <PlayerBox player={players[2]} isActive={players[2]?.isTheirTurn} />
          </div>
          <div className="player-row">
            <PlayerBox player={players[3]} isActive={players[3]?.isTheirTurn} />
          </div>
          <div className="deck-row">
            {deck.map((card, index) => (
              <div key={`card-${index}`} className="deck-card" onClick={() => handleCardClick(index)}>
                <MySVG
                  cardType={card.cardType}
                  score={card.score}
                  hidden={card.hidden}
                  handleClick={() => handleCardClick(index)}
                />
              </div>
            ))}
          </div>
          <div className="auto-play-row">
            <label>
              <input type="checkbox" checked={autoPlay} onChange={() => setAutoPlay(!autoPlay)} />
              Auto Play
            </label>
          </div>
        </>
      )}
      {gameState === GameState.ENDED && (
        <div className="overlay">
          <div className="game-ended">
            <h1>Game ended</h1>
            <p>Final scores:</p>
            {players.map((player, index) => (
              <div key={player.uuid}>
                {player.name}: {player.points}
              </div>
            ))}
            <button onClick={startGame}>Start Again</button>
          </div>
        </div>
    )}
    </div>
  );  
}

export default CardsList;
