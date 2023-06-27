import Events from "../Common/Events";
import { Player } from "../Common/Player";
import { CardService } from "./CardService";
import { Mutex } from "async-mutex";

class PlayerService {
  public players: Player[] = [];
  public viewers: Player[] = [];
  public cardService: CardService;
  public turnMutex: Mutex;
  public callback: ((message: any) => void) | undefined;

  constructor() {
    this.cardService = new CardService();
    this.turnMutex = new Mutex();
  }

  restartAsClean() {
    this.players = [];
    this.cardService = new CardService();
  }

  async start(callback: (message: any) => void): Promise<void> {
    this.callback = callback;
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
    if (this.players.length === 1) {
      player.isTheirTurn = true;
      player.isFirstPlayer = true;
    }
    this.players.push(player);
    if (this.players.length === 4) playerLengthIsMax = true;
    console.log(`Player added: ${uuid}`);

    // Publish NewPlayerApprovedToJoin event
    if (this.callback) {
      const message = {
        event: Events.NewPlayerApprovedToJoin,
        payload: {
          uuid,
        },
      };
      this.callback(message);
    }

    if (playerLengthIsMax) {
      // Publish CardsAreReadyToBeDistributed event
      const message = {
        event: Events.CardsAreReadyToBeDistributed,
      };
      if (this.callback) {
        this.callback(message);
      }
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
    if (this.callback) {
      const message = {
        event: Events.NewViewerApprovedToSubscribe,
        payload: {
          uuid,
        },
      };
      this.callback(message);
    }
  }

  public async distributeCards(eventManagerUuid: string): Promise<void> {
    this.players.forEach((player) => {
      player.setCards(this.cardService.getNextCards());
    });

    // Publish CardsAreDistributed event after distributing cards
    await this.publishCardsAreDistributedEvent(eventManagerUuid);
  }

  async publishCardsAreDistributedEvent(eventManagerUuid: string): Promise<void> {
    if (this.callback) {
      const message = {
        event: Events.CardsAreDistributed,
        payload: {},
      };
      this.callback(message);
    }
  }

  public onCardsAreDistributed(): void {

  }

  public haveAnyPlayersCards(): boolean {
    return this.players.some((player) => player.getDeck().length > 0);
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
