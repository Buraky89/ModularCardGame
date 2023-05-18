import { GameService } from "./GameService";
import { HeartsPlayerService } from "./HeartsPlayerService"; // import HeartsPlayerService
import { Card, CardType } from "../Common/Card";
import GameState from "../Common/Enums";
import { Player } from "../Common/Player";

class HeartsGameService extends GameService {
  public playerService: HeartsPlayerService;

  private keyValueStore: { [key: string]: any } = {};

  constructor() {
    super();
    this.playerService = new HeartsPlayerService();
    // Initialize heartsBroken value in the key-value store
    this.keyValueStore['heartsBroken'] = false;
  }

  calculatePoints(turnNumber: number, card: Card): number {
    if (card.cardType === CardType.HEARTS) {
      return 1;
    } else if (card.cardType === CardType.SPADES && card.score === 12) {
      return 13;
    }
    return 0;
  }

  isThisAValidCardToPlay(player: Player, selectedIndex: number): boolean {
    const isFirstTurn = (this.turnNumber == 1);

    // Get the selected card from the player's deck
    const selectedCard = player.getDeck()[selectedIndex];

    // Check if the selected index is valid
    if (!selectedCard) {
      return false;
    }

    // The player should have the card that they are trying to play
    if (!player.hasCard(selectedCard)) {
      return false;
    }

    // On the first turn, the player holding the 2 of clubs starts the game
    if (isFirstTurn) {
      return selectedCard.cardType === CardType.CLUBS && selectedCard.score === 2;
    }

    // Hearts cannot be led until they have been broken, unless the player has only hearts left
    if (!this.keyValueStore['heartsBroken'] && selectedCard.cardType === CardType.HEARTS && !player.hasOnlyHearts()) {
      return false;
    }

    // On first trick, you cannot play a Heart or Queen of Spades, even if you have no clubs
    if (this.turnNumber === 1 && (selectedCard.cardType === CardType.HEARTS || (selectedCard.cardType === CardType.SPADES && selectedCard.score === 12))) {
      return false;
    }

    // A player must follow suit if they can
    let firstCardInTrick = this.playedDeck[0];
    if (firstCardInTrick && selectedCard.cardType !== firstCardInTrick.cardType && player.hasCardOfSuit(firstCardInTrick.cardType)) {
      return false;
    }

    // If none of the above conditions were met, the card is valid to play
    return true;
  }

}

export { HeartsGameService };
