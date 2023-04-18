import { AmqpService } from "./AmqpService";
import { GameService } from "./GameService";
import Events from "../Common/Events";
import {
  NewPlayerWantsToJoinPayload,
  PlayerPlayedPayload,
  NewPlayerApprovedToJoinPayload,
  PlayerAttemptsToPlayPayload,
  GameEndedPayload,
  GameStartRequestedPayload,
  GameStartApprovedPayload,
} from "../Common/Payloads";

enum GameState {
  NOT_STARTED,
  STARTED,
  ENDED,
}

class EventManager {
  public amqpService: AmqpService;
  public gameService: GameService;
  public uuid: string;

  constructor(uuid: string) {
    this.uuid = uuid;
    this.amqpService = new AmqpService();
    this.gameService = new GameService();
  }

  async start(): Promise<void> {
    const channel = await this.amqpService.start(this.uuid);

    // Pass channel object to PlayerService instance
    await this.gameService.playerService.start(channel);

    await channel.consume(
      `game-events-${this.uuid}`,
      this.handleMessage.bind(this),
      {
        noAck: true,
      }
    );

    await channel.consume(
      `game-events-exchange-q-${this.uuid}`,
      this.handleExchange.bind(this),
      {
        noAck: true,
      }
    );
  }

  async stop(): Promise<void> {
    await this.amqpService.stop();
  }

  async handleExchange(msg: any): Promise<void> {
    if (this.gameService.gameState == GameState.ENDED) {
      console.log("Game is ended, ignoring message");
      return;
    }

    const message = JSON.parse(msg.content.toString());
    console.log(`Received message: ${JSON.stringify(message)}`);
    this.handleExchangeEvent(message);
  }

  async handleMessage(msg: any): Promise<void> {
    if (this.gameService.gameState == GameState.ENDED) {
      console.log("Game is ended, ignoring message");
      return;
    }

    const message = JSON.parse(msg.content.toString());
    console.log(`Received message: ${JSON.stringify(message)}`);
    this.handleEvent(message);
  }

  handleExchangeEvent(message: any): void {
    if (this.gameService.gameState == GameState.ENDED) {
      console.log("Game is ended, ignoring event");
      return;
    }

    // Loop through each player and send the message to their queue
    for (const player of this.gameService.playerService.players) {
      const playerQueue = `game-events-for-player-${player.uuid}-${this.uuid}`;
      if (this.amqpService != null && this.amqpService.channel != null) {
        this.amqpService.channel
          .assertQueue(playerQueue, { durable: false })
          .then(() => {
            const buffer = Buffer.from(JSON.stringify(message));
            if (this.amqpService.channel != null) {
              console.log(`Exchanging message to player ${player.uuid}`);
              this.amqpService.channel.sendToQueue(playerQueue, buffer);
            }
          })
          .catch((error) => {
            console.error(
              `Error sending message to player ${player.uuid}:`,
              error
            );
          });
      }
    }
  }

  handleEvent(message: any): void {
    if (this.gameService.gameState == GameState.ENDED) {
      console.log("Game is ended, ignoring event");
      return;
    }

    const { event, payload } = message;

    switch (event) {
      case Events.NewPlayerWantsToJoin:
        this.handleNewPlayerWantsToJoin(payload as NewPlayerWantsToJoinPayload);
        break;
      case Events.PlayerPlayed:
        this.handlePlayerPlayed(payload as PlayerPlayedPayload);
        break;
      case Events.NewPlayerApprovedToJoin:
        this.handleNewPlayerApprovedToJoin(
          payload as NewPlayerApprovedToJoinPayload
        );
        break;
      case Events.CardsAreReadyToBeDistributed:
        console.log(
          `It seems cards are ready to distribute. Adding players' cards`
        );
        this.gameService.playerService.distributeCards();
        break;
      case Events.PlayerAttemptsToPlay:
        this.handlePlayerAttemptsToPlay(payload as PlayerAttemptsToPlayPayload);
        break;
      case Events.GameEnded:
        this.handleGameEnded(payload as GameEndedPayload);
        break;
      case Events.GameStartRequested:
        this.handleGameStartRequested(payload as GameStartRequestedPayload);
        break;
      case Events.GameStartApproved:
        this.handleGameStartApproved(payload as GameStartApprovedPayload);
        break;
      default:
        throw new Error(`Invalid event: ${event}`);
    }
  }

  private async handleGameStartRequested(
    payload: GameStartRequestedPayload
  ): Promise<void> {
    const { uuid } = payload;
    const player = this.gameService.playerService.players.find(
      (p) => p.uuid === uuid
    );

    if (
      player &&
      player.isFirstPlayer &&
      this.gameService.playerService.players.length == 4
    ) {
      console.log("Game start requested by first player");
      const message = {
        event: Events.GameStartApproved,
        payload: {},
      };
      const buffer = Buffer.from(JSON.stringify(message));
      await this.amqpService.publish("", `game-events-${this.uuid}`, buffer);
    } else if (this.gameService.playerService.players.length < 4) {
      console.log("There are not enough players to start yet");
    } else {
      console.log(`Player ${uuid} cannot request game start`);
    }
  }

  private handleGameStartApproved(payload: GameStartApprovedPayload): void {
    console.log("Game start approved");
    this.gameService.gameState = GameState.STARTED;
  }

  private handleGameEnded(payload: GameEndedPayload): void {
    console.log("Game has ended!");
    this.gameService.gameState = GameState.ENDED;
  }

  private handleNewPlayerWantsToJoin(
    payload: NewPlayerWantsToJoinPayload
  ): void {
    const { date, ip, uuid, playerName } = payload;
    if (this.gameService.playerService.players.length < 4) {
      this.gameService.playerService.addPlayer(playerName, uuid, this.uuid);
    } else {
      console.log("Game has already maximum number of players!");
    }
  }

  async handlePlayerPlayed(payload: PlayerPlayedPayload): Promise<void> {
    const { uuid, selectedIndex } = payload;

    const player = this.gameService.playerService.players.find(
      (p) => p.uuid === uuid
    );

    if (player) {
      await this.gameService.playGame(player, selectedIndex, this.uuid); // TODO: is this the best way? (sending eventManagerUuid to the gameService?)

      // Set the next player's isTheirTurn property to true
      this.gameService.playerService.setWhoseTurn();
    } else {
      console.log(`Player ${uuid} not found`);
    }
  }

  private handleNewPlayerApprovedToJoin(
    payload: NewPlayerApprovedToJoinPayload
  ): void {
    const { uuid } = payload;
    console.log(`New player ${uuid} approved to join`);
    // Do something with the approved player
  }

  private async handlePlayerAttemptsToPlay(
    payload: PlayerAttemptsToPlayPayload
  ): Promise<void> {
    const { uuid, selectedIndex } = payload;
    console.log("payload", payload);
    const player = this.gameService.playerService.players.find(
      (p) => p.uuid === uuid
    );

    if (player) {
      if (!player.isTheirTurn) {
        console.log(`Player ${player.name} cannot play at this time.`);
        return;
      }

      const isValidCard =
        await this.gameService.playerService.isThisAValidCardToPlay(
          player,
          selectedIndex
        );

      if (isValidCard) {
        const message = {
          event: Events.PlayerPlayed,
          payload: {
            uuid,
            selectedIndex,
          },
        };
        console.log("message", message);
        const buffer = Buffer.from(JSON.stringify(message));
        await this.amqpService.publish("", `game-events-${this.uuid}`, buffer);

        await this.amqpService.publish(
          "",
          `game-events-exchange-q-${this.uuid}`,
          buffer
        );
      } else {
        console.log("Invalid card played");
      }
    } else {
      console.log(`Player ${uuid} not found`);
    }
  }

  async getGameData(uuid: string): Promise<any> {
    return this.gameService.getGameData(uuid);
  }

  public isGameEnded(): boolean {
    return this.gameService.gameState == GameState.ENDED;
  }

  async restartGame(): Promise<any> {
    this.gameService = new GameService();
    this.start()
      .then(() => {
        console.log("GameService started");
      })
      .catch((error) => {
        console.error("Error starting GameService", error);
      });
  }
}

export { EventManager };
