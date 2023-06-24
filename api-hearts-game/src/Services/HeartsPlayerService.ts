import { Player } from "../Common/Player";
import { PlayerService } from "./PlayerService";
import { CardType } from "../Common/Card";

class HeartsPlayerService extends PlayerService {

  // Override the addPlayer method
  async addPlayer(
    playerName: string,
    uuid: string,
    eventManagerUuid: string
  ): Promise<void> {
    await super.addPlayer(playerName, uuid, eventManagerUuid);


  }


  public onCardsAreDistributed(): void {
    // After adding a player, check if all players are present and if so, set the first player
    if (this.players.length === 4) {
      this.setFirstPlayerWithTwoOfClubs();
    }
  }

  setFirstPlayerWithTwoOfClubs(): void {
    let firstPlayer: Player | null = null;

    // Iterate over each player to find the first player
    for (let player of this.players) {
      // Check if the player's deck has the 2 of clubs
      let deck = player.getDeck();
      for (let card of deck) {
        if (card.cardType === CardType.CLUBS && card.score === 2) {
          // If so, set this player as the first player and break the loop
          console.log("setting the first player with club 2", player);
          player.setFirstPlayer(true);
          firstPlayer = player;
          break;
        }
      }
    }

    // Now iterate over each player again to set other players' isFirstPlayer to false
    if (firstPlayer !== null) {
      for (let player of this.players) {
        if (player !== firstPlayer) {
          player.setFirstPlayer(false);
        }
      }
    }
  }

}

export { HeartsPlayerService };
