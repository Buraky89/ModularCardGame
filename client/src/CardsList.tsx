import { useEffect, useState } from "react";
import { Card } from "./Card";



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
    <ul>
      {cards.map((card) => (
        <li key={`${card.score}-${card.cardType}`}>
          {card.score} of {card.cardType}
        </li>
      ))}
    </ul>
  );
}

export default CardsList;
