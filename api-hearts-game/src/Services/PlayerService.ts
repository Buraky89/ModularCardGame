import { Channel } from "amqplib";
import Events from "../Common/Events";
import { v4 as uuidv4 } from "uuid";
import { Player } from "../Common/Player";
import { CardService } from "./CardService";

class PlayerService {
  public players: Player[] = [];
  private channel: Channel | null = null;
  private cardService: CardService;

  constructor() {
    this.cardService = new CardService();
  }

  async start(channel: Channel): Promise<void> {
    this.channel = channel;

    // Listen to the event that the cards are ready to be distributed
    this.channel.assertQueue(Events.CardsAreReadyToBeDistributed, {
      durable: false,
    });
  }

  async addPlayer(playerName: string, uuid: string): Promise<void> {
    var playerLengthIsMax = false;
    const player = new Player(playerName, uuid);
    if (this.players.length == 1) {
      player.isTheirTurn = true;
      player.isFirstPlayer = true;
    }
    this.players.push(player);
    if (this.players.length == 4) playerLengthIsMax = true;
    console.log(`Player added: ${uuid}`);

    // Publish NewPlayerApprovedToJoin event
    if (this.channel) {
      const message = {
        event: Events.NewPlayerApprovedToJoin,
        payload: {
          uuid,
        },
      };
      const buffer = Buffer.from(JSON.stringify(message));
      await this.channel.publish("", "game-events", buffer);
    }

    if (playerLengthIsMax) {
      // Publish CardsAreReadyToBeDistributed event
      const message = {
        event: Events.CardsAreReadyToBeDistributed,
      };
      const buffer = Buffer.from(JSON.stringify(message));
      await this.channel?.publish("", "game-events", buffer);
    }
  }

  public distributeCards(): void {
    this.players.forEach((player) => {
      player.setCards(this.cardService.getNextCards());
    });
  }

  public haveAnyPlayersCards(): boolean {
    return this.players.some((player) => player.getDeck().length > 0);
  }

  public isThisAValidCardToPlay(
    player: Player,
    selectedIndex: number
  ): boolean {
    return true;
  }

  public setWhoseTurn(): void {
    const currentPlayer = this.players.find((player) => player.isTheirTurn);
    if (currentPlayer) {
      currentPlayer.isTheirTurn = false;
      const currentIndex = this.players.indexOf(currentPlayer);
      const nextIndex = (currentIndex + 1) % this.players.length;
      const nextPlayer = this.players[nextIndex];
      nextPlayer.isTheirTurn = true;
    }
  }

  getWinner(): Player | null {
    let maxPoints = -1;
    let winner: Player | null = null;
    for (const player of this.players) {
      if (player.points > maxPoints) {
        maxPoints = player.points;
        winner = player;
      }
    }
    return winner;
  }
}

export { PlayerService };
