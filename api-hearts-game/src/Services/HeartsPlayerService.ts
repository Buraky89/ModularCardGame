import { Channel } from "amqplib";
import Events from "../Common/Events";
import { v4 as uuidv4 } from "uuid";
import { Player } from "../Common/Player";
import { CardService } from "./CardService";
import { Mutex } from "async-mutex";
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

  public distributeCards(): void {
    super.distributeCards();

    // After adding a player, check if all players are present and if so, set the first player
    if (this.players.length === 4) {
      this.setFirstPlayerWithTwoOfClubs();
    }
  }

  setFirstPlayerWithTwoOfClubs(): void {
    // Iterate over each player
    for (let player of this.players) {
      // Check if the player's deck has the 2 of clubs
      let deck = player.getDeck();
      for (let card of deck) {
        if (card.cardType === CardType.CLUBS && card.score === 2) {
          // If so, set this player as the first player and break the loop
          console.log("setting the first player with club 2", player);
          player.setFirstPlayer();
          break;
        }
      }
    }
  }
}

export { HeartsPlayerService };
