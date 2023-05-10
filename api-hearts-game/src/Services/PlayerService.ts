import { Channel } from "amqplib";
import Events from "../Common/Events";
import { v4 as uuidv4 } from "uuid";
import { Player } from "../Common/Player";
import { CardService } from "./CardService";
import { Mutex } from "async-mutex";

class PlayerService {
  public players: Player[] = [];
  public viewers: Player[] = [];
  private channel: Channel | null = null;
  private cardService: CardService;
  public turnMutex: Mutex;

  constructor() {
    this.cardService = new CardService();
    this.turnMutex = new Mutex(); // Initialize the mutex
  }

  restartAsClean() {
    this.players = [];
    this.cardService = new CardService();
  }

  async start(channel: Channel): Promise<void> {
    this.channel = channel;
  }

  async addPlayer(
    playerName: string,
    uuid: string,
    eventManagerUuid: string
  ): Promise<void> {
    if (this.players.some((p: Player) => p.uuid === uuid)) {
      return;
    }

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
      await this.channel.publish("", `game-events-${eventManagerUuid}`, buffer);
    }

    if (playerLengthIsMax) {
      // Publish CardsAreReadyToBeDistributed event
      const message = {
        event: Events.CardsAreReadyToBeDistributed,
      };
      const buffer = Buffer.from(JSON.stringify(message));
      await this.channel?.publish(
        "",
        `game-events-${eventManagerUuid}`,
        buffer
      );
    }
  }

  async subscribeViewer(
    playerName: string,
    uuid: string,
    eventManagerUuid: string
  ): Promise<void> {
    if (this.viewers.some((p: Player) => p.uuid === uuid)) {
      return;
    }

    const player = new Player(playerName, uuid);
    this.viewers.push(player);
    if (this.viewers.length > 499) return;
    console.log(`Viewer added: ${uuid}`);

    // Publish NewViewerApprovedToSubscribe event
    if (this.channel) {
      const message = {
        event: Events.NewViewerApprovedToSubscribe,
        payload: {
          uuid,
        },
      };
      const buffer = Buffer.from(JSON.stringify(message));
      await this.channel.publish("", `game-events-${eventManagerUuid}`, buffer);
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
