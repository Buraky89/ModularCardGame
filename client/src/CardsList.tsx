import { useEffect, useState } from "react";
import { Card, CardType } from "./Card";
import MySVG from "./MySVG";


interface ApiResponse {
  deck: Card[];
}


function CardsList() {
  const [cards, setCards] = useState<Card[]>([]);

  useEffect(() => {
    fetch("http://localhost:3001/client1/deck")
      .then((response) => response.json())
      .then((data: ApiResponse) => setCards(data.deck))
      .catch((error) => console.log(error));
  }, []);

  return (
    <div style={{ display: "flex", flexWrap: "wrap" }}>
      {cards.map((card) => (
        <div key={`${card.score}-${card.cardType}`}>
          <MySVG cardType={card.cardType} score={card.score} />  
        </div>
      ))}
    </div>
  );
}

export default CardsList;
