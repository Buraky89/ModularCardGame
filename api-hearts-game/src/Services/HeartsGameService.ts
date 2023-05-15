import { GameService } from "./GameService";
import { Card, CardType } from "../Common/Card";
import GameState from "../Common/Enums";
import { Player } from "../Common/Player";

class HeartsGameService extends GameService {
  calculatePoints(turnNumber: number, card: Card): number {
    if (card.cardType === CardType.HEARTS) {
      return 1;
    } else if (card.cardType === CardType.SPADES && card.score === 12) {
      return 13;
    }
    return 0;
  }
}

export { HeartsGameService };
