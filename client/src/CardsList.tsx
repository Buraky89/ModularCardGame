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
      {cards.map((card, index) => (
        <div key={`${card.score}-${card.cardType}`} style={{ marginRight: 10 }}>
          <MySVG cardType={card.cardType} score={card.score} index={index} />  
        </div>
      ))}
    </div>
  );
}

export default CardsList;
