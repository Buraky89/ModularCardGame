import { useEffect, useState } from "react";
import { Card, CardType, ApiResponse } from "./Card";
import MySVG from "./MySVG";

interface CardsListProps {
  uuid: string;
}

function CardsList({ uuid }: CardsListProps) {
  const [deck, setDeck] = useState<Card[]>([]);
  const [playedDeck, setPlayedDeck] = useState<Card[]>([]);

  useEffect(() => {
    const intervalId = setInterval(() => {
      fetch(`http://localhost:3001/players/${uuid}`)
        .then((response) => response.json())
        .then((data: ApiResponse) => {
          setDeck(data.deck);
          setPlayedDeck(data.playedDeck.deck);
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
        setPlayedDeck(data.playedDeck?.deck);
      })
      .catch((error) => console.log(error));
  };

  return (
    <div style={{ display: "flex", flexWrap: "wrap" }}>
      {deck.length > 0 &&
        deck.map((card, index) => (
          <div key={`${card.score}-${card.cardType}`} style={{ marginRight: 10 }}>
            <MySVG
              cardType={card.cardType}
              score={card.score}
              handleClick={() => handleCardClick(index)}
            />
          </div>
        ))}
      <div>
        {playedDeck != null && playedDeck.length > 0 && (
          <>
            <h3>Played Cards:</h3>
            {playedDeck.map((card, index) => (
              <div key={`played-${index}`}>
                <MySVG cardType={card.cardType} score={card.score} handleClick={() => {}} />
              </div>
            ))}
          </>
        )}
      </div>
    </div>
  );
}

export default CardsList;
