import { useEffect, useState } from "react";
import { Card, CardType, ApiResponse, Player } from "./Card";
import MySVG from "./MySVG";

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
    <div style={{ display: "flex", flexWrap: "wrap" }}>
      {deck.length > 0 &&
        deck.map((card, index) => (
          <div key={`${card.score}-${card.cardType}`} style={{ marginRight: 10 }}>
            <MySVG
              cardType={card.cardType}
              score={card.score}
              hidden={card.hidden}
              handleClick={() => handleCardClick(index)}
            />
          </div>
        ))}
      {isYourTurn && <h1>Your Turn</h1>}
      <div>
        {playedDeck != null && playedDeck.length > 0 && (
          <>
            <h3>Played Cards:</h3>
            {playedDeck.map((card, index) => (
              <div key={`played-${index}`}>
                <MySVG cardType={card.cardType} score={card.score} hidden={card.hidden} handleClick={() => {}} />
              </div>
            ))}
          </>
        )}
      </div>
      <div style={{ border: "5px solid #ccc" }}>
        <h3>Player's Cards:</h3>
        <div style={{ marginBottom: 20 }}>
          {players.map((player) => (
            <div key={player.uuid}>
              <h2 style={{ color: player.isTheirTurn ? "red" : "black", fontWeight: player.isTheirTurn ? "bold" : "normal" }}>{player.name}</h2>
                {
                player.deck.map((card, index) => (
                  <div key={`player-card-${player.uuid}-${index}`} style={{ display: "inline-block", marginRight: 10 }}>
                    <MySVG cardType={card.cardType} score={card.score} hidden={card.hidden} handleClick={() => {}} />
                  </div>
                ))}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

export default CardsList;
