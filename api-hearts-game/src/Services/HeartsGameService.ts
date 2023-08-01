import { GameService } from "./GameService";
import { Card, CardType } from "../Common/Card";
import { Player } from "../Common/Player";
import { IPlayerService } from "../Interfaces/IPlayerService";

class HeartsGameService extends GameService {
  public playerService: IPlayerService;

  private keyValueStore: { [key: string]: any } = {};

  constructor(playerService: IPlayerService) {
    super(playerService);
    this.playerService = playerService;
    // Initialize heartsBroken value in the key-value store
    this.keyValueStore['heartsBroken'] = false;
  }

  GetPlayerUuidsToExchange(playerUuid: string) {

    const players = this.playerService.players;
    const viewers = this.playerService.viewers;

    const mergedPlayersMap = new Map(
      [...players, ...viewers].map(player => [player.uuid, player])
    );

    if (playerUuid !== "") {
      const player = players.find(p => p.uuid === playerUuid);

      if (player) {
        mergedPlayersMap.clear();
        mergedPlayersMap.set(player.uuid, player);
      }
    }

    return Array.from(mergedPlayersMap.values());
  }

  calculatePoints(turnNumber: number, card: Card): number {
    if (card.cardType === CardType.HEARTS) {
      return 1;
    } else if (card.cardType === CardType.SPADES && card.score === 12) {
      return 13;
    }
    return 0;
  }

  isThisAValidCardToPlay(player: Player, selectedIndex: number, outputEvent?: { message: string }): boolean {
    const isFirstTurn = (this.turnNumber == 1);

    // Get the selected card from the player's deck
    const selectedCard = player.getDeck()[selectedIndex];

    // Check if the selected index is valid
    if (!selectedCard) {
      if (outputEvent) outputEvent.message = "Invalid card selected.";
      return false;
    }

    // The player should have the card that they are trying to play
    if (!player.hasCard(selectedCard)) {
      if (outputEvent) outputEvent.message = "You don't have this card in your deck.";
      return false;
    }

    // On the first turn, the player holding the 2 of clubs starts the game
    if (isFirstTurn) {
      if (selectedCard.cardType === CardType.CLUBS && selectedCard.score === 2) {
        return true;
      }
      if (outputEvent) outputEvent.message = "First player must start with the 2 of Clubs.";
      return false;
    }

    // Hearts cannot be led until they have been broken, unless the player has only hearts left
    if (!this.keyValueStore['heartsBroken'] && selectedCard.cardType === CardType.HEARTS && !player.hasOnlyHearts()) {
      if (outputEvent) outputEvent.message = "Hearts have not been broken yet.";
      return false;
    }

    // On first trick, you cannot play a Heart or Queen of Spades, even if you have no clubs
    if (this.turnNumber === 1 && (selectedCard.cardType === CardType.HEARTS || (selectedCard.cardType === CardType.SPADES && selectedCard.score === 12))) {
      if (outputEvent) outputEvent.message = "Hearts or the Queen of Spades cannot be played in the first trick.";
      return false;
    }

    // A player must follow suit if they can
    let firstCardInTrick = this.playedDeck[0];
    if (firstCardInTrick && selectedCard.cardType !== firstCardInTrick.cardType && player.hasCardOfSuit(firstCardInTrick.cardType)) {
      if (outputEvent) outputEvent.message = "You must follow the suit of the first card in the trick.";
      return false;
    }

    // If none of the above conditions were met, the card is valid to play
    return true;
  }


}

export { HeartsGameService };
