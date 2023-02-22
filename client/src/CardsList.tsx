import { useEffect, useState } from "react";
import { Card, CardType } from "./Card";
import MySVG from "./MySVG";

interface CardsListProps {
  clientName: string;
}

interface ApiResponse {
  deck: Card[];
}

function CardsList({ clientName }: CardsListProps) {
  const [cards, setCards] = useState<Card[]>([]);

  useEffect(() => {
    fetch(`http://localhost:3001/${clientName}/deck`)
      .then((response) => response.json())
      .then((data: ApiResponse) => setCards(data.deck))
      .catch((error) => console.log(error));
  }, [clientName]);

  const handleCardClick = (cardIndex: number) => {
    fetch(`http://localhost:3001/${clientName}/submit`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        cardIndex
      })
    })
    .then((response) => response.json())
    .then((data: ApiResponse) => setCards(data.deck))
    .catch((error) => console.log(error));
  };

  return (
    <div style={{ display: "flex", flexWrap: "wrap" }}>
      {cards.map((card, index) => (
        <div key={`${card.score}-${card.cardType}`} style={{ marginRight: 10 }}>
          <MySVG
            cardType={card.cardType}
            score={card.score}
            handleClick={() => handleCardClick(index)}
          />
        </div>
      ))}
    </div>
  );
}

export default CardsList;