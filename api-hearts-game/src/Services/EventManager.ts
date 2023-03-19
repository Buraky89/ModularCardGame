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
import { v4 as uuidv4 } from "uuid";

enum GameState {
  NOT_STARTED,
  STARTED,
  ENDED,
}

class EventManager {
  public amqpService: AmqpService;
  public gameService: GameService;
  public uuid: string = uuidv4();

  constructor() {
    this.uuid = uuidv4();
    this.amqpService = new AmqpService();
    this.gameService = new GameService();
  }

  async start(): Promise<void> {
    const channel = await this.amqpService.start();

    // Pass channel object to PlayerService instance
    await this.gameService.playerService.start(channel);

    await channel.consume("game-events", this.handleMessage.bind(this), {
      noAck: true,
    });
  }

  async stop(): Promise<void> {
    await this.amqpService.stop();
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
      await this.amqpService.publish("", "game-events", buffer);
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
      this.gameService.playerService.addPlayer(playerName, uuid);
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
      await this.gameService.playGame(player, selectedIndex);

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
        await this.amqpService.publish("", "game-events", buffer);
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
