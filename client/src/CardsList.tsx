import { useEffect, useState } from "react";
import { Card, CardType, ApiResponse, Player } from "./Card";
import MySVG from "./MySVG";
import "./CardsList.css";

interface CardsListProps {
  uuid: string;
}

function CardsList({ uuid }: CardsListProps) {
  const [deck, setDeck] = useState<Card[]>([]);
  const [playedDeck, setPlayedDeck] = useState<Card[]>([]);
  const [players, setPlayers] = useState<Player[]>([]);

  useEffect(() => {
    const intervalId = setInterval(() => {
      fetch(`http://localhost:3001/players/${uuid}`)
        .then((response) => response.json())
        .then((data: ApiResponse) => {
          setDeck(data.deck);
          setPlayedDeck(data.playedDeck);
          setPlayers(data.players || []);
        })
        .catch((error) => console.log(error));
    }, 5000);

    return () => clearInterval(intervalId);
  }, [uuid]);

  const handleCardClick = (cardIndex: number) => {
    fetch(`http://localhost:3001/players/${uuid}/play`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
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

  return (
    <div style={{ height: "100%", display: "flex", flexDirection: "column" }}>
      <div style={{ height: "20%", display: "flex" }}>
        <div style={{ width: "33.33%", backgroundColor: "#fff", boxShadow: "0 0 10px rgba(0,0,0,0.3)", display: "flex", justifyContent: "center", alignItems: "center", fontSize: 24, fontWeight: "bold" }}>
          <span className={players[0]?.isTheirTurn ? "active-player" : undefined}>{players[0]?.name || "Player A"}</span>
        </div>
      </div>
      <div style={{ height: "50%", display: "flex" }}>
        <div style={{ width: "11.11%", backgroundColor: "#fff", boxShadow: "0 0 10px rgba(0,0,0,0.3)", display: "flex", justifyContent: "center", alignItems: "center", fontSize: 24, fontWeight: "bold" }}>
          <span className={players[1]?.isTheirTurn ? "active-player" : undefined}>{players[1]?.name || "Player B"}</span>
        </div>
        <div style={{ width: "77.78%", backgroundColor: "#007f00", display: "flex", justifyContent: "center", alignItems: "center", position: "relative" }}>
          {playedDeck.length > 0 &&
            playedDeck.map((card, index) => (
                <div style={{ position: "absolute", top: "40%", left: "40%", zIndex: 1000 + index - playedDeck.length - index, transform: `rotate(${index * 30}deg)` }}>
                  <MySVG
                    key={`played-card-${index}`}
                    cardType={card.cardType}
                    score={card.score}
                    hidden={card.hidden}
                    
                    handleClick={() => {}}
                  />
                </div>
            ))}
          <div style={{ width: "80%", height: 0, paddingBottom: "80%", borderRadius: "50%", backgroundColor: "#8cff8c", display: "flex", justifyContent: "center", alignItems: "center" }}></div>
        </div>
        <div style={{ width: "11.11%", backgroundColor: "#fff", boxShadow: "0 0 10px rgba(0,0,0,0.3)", display: "flex", justifyContent: "center", alignItems: "center", fontSize: 24, fontWeight: "bold" }}>
          <span className={players[2]?.isTheirTurn ? "active-player" : undefined}>{players[2]?.name || "Player C"}</span>
        </div>
      </div>
      <div style={{ height: "30%", display: "flex", justifyContent: "center", alignItems: "center", backgroundColor: "#222" }}>
        {deck.map((card, index) => (
          <div key={`card-${index}`} style={{ marginRight: 10 }}>
            <MySVG cardType={card.cardType} score={card.score} hidden={card.hidden} handleClick={() => handleCardClick(index)} />
          </div>
        ))}
      </div>
    </div>
  );
}

export default CardsList;
