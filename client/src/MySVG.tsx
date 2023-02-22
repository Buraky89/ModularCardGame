import { CardType } from "./Card";

interface MySVGProps {
  cardType: CardType;
  score: number;
  handleClick: () => void;
}

function MySVG(props: MySVGProps) {
  const cardTypeToSvgName = (cardType: CardType): string => {
    switch (cardType) {
      case CardType.SPADES:
        return "spade";
      case CardType.HEARTS:
        return "heart";
      case CardType.DIAMONDS:
        return "diamond";
      case CardType.CLUBS:
        return "club";
      default:
        return "";
    }
  };

  const scoreToSvgName = (score: number): string => {
    switch (score) {
      case 1:
        return "1";
      case 2:
        return "2";
      case 3:
        return "3";
      case 4:
        return "4";
      case 5:
        return "5";
      case 6:
        return "6";
      case 7:
        return "7";
      case 8:
        return "8";
      case 9:
        return "9";
      case 10:
        return "10";
      case 11:
        return "jack";
      case 12:
        return "queen";
      case 13:
        return "king";
      default:
        return "";
    }
  };

  return (
    <svg
      width="169.075"
      height="244.640"
      viewBox="0 0 169.075 244.640"
      xmlns="http://www.w3.org/2000/svg"
      xmlnsXlink="http://www.w3.org/1999/xlink"
      style={{ cursor: "pointer" }}
      onClick={props.handleClick}
    >
      <use href={`/svg-cards.svg#${cardTypeToSvgName(props.cardType)}_${scoreToSvgName(props.score)}`} x="0" y="0" />
    </svg>
  );
}

export default MySVG;
