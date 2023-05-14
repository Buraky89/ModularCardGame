import { GameService } from "./GameService";
import { Card, CardType } from "../Common/Card";
import GameState from "../Common/Enums";
import { Player } from "../Common/Player";

class HeartsGameService extends GameService {
  calculatePoints(card: Card): number {
    if (card.cardType === CardType.HEARTS) {
      return 1;
    } else if (card.cardType === CardType.SPADES && card.score === 12) {
      // Queen of Spades is 13th in rank
      return 13;
    }
    return 0;
  }

  async playGame(
    player: Player,
    selectedIndex: number,
    eventManagerUuid: string
  ): Promise<any> {
    if (this.gameState == GameState.ENDED) {
      console.log("Game is ended, cannot play game");
      return;
    }

    if (this.playerService.haveAnyPlayersCards()) {
      if (!player.isTheirTurn) {
        console.log(`It is not ${player.name}'s turn`);
        return;
      }

      console.log(`Turn ${this.turnNumber}:`);

      if (player.getDeck().length === 0) {
        // TODO: no more cards to play
      }

      const result = await player.playTurn(
        this.turnNumber,
        this.playedDeck,
        selectedIndex
      );

      if (result) {
        // Update points calculation for Hearts
        let points = this.calculatePoints(result.card);
        console.log(
          `${player.name} played ${result.card.cardType} and earned ${points} pointsssss`
        );
      } else {
        console.log(`${player.name} has no more cards in their deck.`);
      }

      this.turnNumber++;
    }

    //return super.playGame(player, selectedIndex, eventManagerUuid);
  }
}

export { HeartsGameService };
