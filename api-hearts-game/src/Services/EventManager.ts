import { AmqpService } from "./AmqpService";
import { HeartsGameService } from "./HeartsGameService";
import Events from "../Common/Events";
import {
  NewPlayerWantsToJoinPayload,
  PlayerPlayedPayload,
  NewPlayerApprovedToJoinPayload,
  PlayerAttemptsToPlayPayload,
  GameEndedPayload,
  GameStartRequestedPayload,
  GameStartApprovedPayload,
  NewViewerApprovedToSubscribePayload,
  CardsAreDistributedPayload,
  GameMessageToPlayerPayload,
} from "../Common/Payloads";
import { Player } from "../Common/Player";

class EventManager {
  public amqpService: AmqpService;
  public gameService: HeartsGameService;
  public uuid: string;

  constructor(uuid: string) {
    this.uuid = uuid;
    this.amqpService = new AmqpService();
    this.gameService = new HeartsGameService();
  }

  eventHandlers: { [key in Events]?: (payload: any) => Promise<void> } = {
    [Events.NewPlayerWantsToJoin]: (payload) => this.handleNewPlayerWantsToJoin(payload),
    [Events.NewViewerWantsToSubscribe]: (payload) => this.handleNewViewerWantsToSubscribe(payload),
    [Events.PlayerPlayed]: (payload) => this.handlePlayerPlayed(payload),
    [Events.NewPlayerApprovedToJoin]: (payload) => this.handleNewPlayerApprovedToJoin(payload),
    [Events.NewViewerApprovedToSubscribe]: (payload) => this.handleNewViewerApprovedToSubscribe(payload),
    [Events.CardsAreReadyToBeDistributed]: () => this.gameService.distributeCards(this.uuid),
    [Events.PlayerAttemptsToPlay]: (payload) => this.handlePlayerAttemptsToPlay(payload),
    [Events.GameEnded]: (payload) => this.handleGameEnded(payload),
    [Events.GameStartRequested]: (payload) => this.handleGameStartRequested(payload),
    [Events.GameStartApproved]: (payload) => this.handleGameStartApproved(payload),
    [Events.CardsAreDistributed]: (payload) => this.handleCardsAreDistributed(payload),
  };

  async start(): Promise<void> {
    const channel = await this.amqpService.start(this.uuid);

    await this.gameService.startPlayerService(channel);

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
    const message = JSON.parse(msg.content.toString());
    console.log(`Received message: ${JSON.stringify(message)}`);
    this.handleExchangeEvent(message);
  }

  async handleMessage(msg: any): Promise<void> {
    if (this.gameService.isGameEnded()) {
      console.log("Game is ended, ignoring message");
      return;
    }

    const message = JSON.parse(msg.content.toString());
    console.log(`Received message: ${JSON.stringify(message)}`);
    await this.handleEvent(message);
  }

  async handleExchangeEvent(message: any): Promise<void> {
    const { event, payload } = message;

    let playerUuid = "";
    if (event === Events.GameMessageToPlayer) {
      const gameMessageToPlayerPayload = payload as GameMessageToPlayerPayload;
      playerUuid = gameMessageToPlayerPayload.playerUuid;
    }
    const mergedPlayersArray = this.gameService.GetPlayerUuidsToExchange(playerUuid);

    for (const player of mergedPlayersArray) {
      const playerUuid = player.uuid;
      const gameState = await this.gameService.getGameData(playerUuid);

      if (event !== Events.GameMessageToPlayer) {
        const messageToExchange = {
          event: Events.GameUpdated,
          payload: {
            gameUuid: this.uuid,
            data: gameState,
          },
        };
        await this.exchangeToPlayerQueue(player.uuid, messageToExchange);
      } else {
        await this.exchangeToPlayerQueue(player.uuid, message);
      }
    }
  }

  async exchangeToPlayerQueue(playerUuid: string, messageToExchange: any) {
    const playerQueue = `game-events-for-player-${playerUuid}-${this.uuid}`;
    if (this.amqpService != null && this.amqpService.channel != null) {
      await this.amqpService.channel
        .assertQueue(playerQueue, { durable: false })
        .then(() => {
          const buffer = Buffer.from(JSON.stringify(messageToExchange));
          if (this.amqpService.channel != null) {
            console.log(`Exchanging message to player ${playerUuid}`);
            this.amqpService.channel.sendToQueue(playerQueue, buffer);
          }
        })
        .catch((error) => {
          console.error(
            `Error sending message to player ${playerUuid}:`,
            error
          );
        });
    }
  }

  async handleEvent(message: any): Promise<void> {
    const { event, payload } = message;

    if (
      this.gameService.isGameEnded() &&
      event !== Events.GameEnded
    ) {
      console.log("Game is ended, ignoring event");
      return;
    }

    const handler = this.eventHandlers[event as Events];
    if (!handler) {
      throw new Error(`Invalid event: ${event}`);
    }

    await handler.bind(this)(payload);
  }

  async publishMessageToExchange(payload: any, uuid: string): Promise<void> {
    await this.publishMessage(payload, `game-events-exchange-q-${this.uuid}`);
  }

  async publishMessageToGameEvents(payload: any, uuid: string): Promise<void> {
    await this.publishMessage(payload, `game-events-${this.uuid}`);
  }

  async publishMessage(payload: any, queue: string): Promise<void> {
    const buffer = Buffer.from(JSON.stringify(payload));
    await this.amqpService.publish("", queue, buffer);
  }

  private async handleGameStartRequested(
    payload: GameStartRequestedPayload
  ): Promise<void> {
    const { uuid } = payload;
    const player = await this.gameService.findPlayer(uuid);

    if (player && await this.gameService.isPlayersStillNotMax() == true) {
      console.log("Game start requested by first player");
      const message = {
        event: Events.GameStartApproved,
        payload: {},
      };
      await this.publishMessageToGameEvents(message, this.uuid);
    } else if (await this.gameService.isPlayersStillNotMax() == true) {
      console.log("There are not enough players to start yet");
    } else {
      console.log(`Player ${uuid} cannot request game start`);
    }
  }

  private async handleGameStartApproved(
    payload: GameStartApprovedPayload
  ): Promise<void> {
    console.log("Game start approved");
    this.gameService.startGame();

    await this.publishMessageToExchange(payload, this.uuid);
  }

  private async handleCardsAreDistributed(
    payload: CardsAreDistributedPayload
  ): Promise<void> {
    await this.gameService.onCardsAreDistributed();
  }

  private async handleGameEnded(payload: GameEndedPayload): Promise<void> {
    console.log("Game has ended!");
    this.gameService.endGame();

    await this.publishMessageToExchange(payload, this.uuid);
  }

  private async handleNewPlayerWantsToJoin(
    payload: NewPlayerWantsToJoinPayload
  ): Promise<void> {
    const { date, ip, uuid, playerName } = payload;
    if (await this.gameService.isPlayersStillNotMax() == true) {
      this.gameService.addPlayer(playerName, uuid, this.uuid);
    } else {
      console.log("Game has already maximum number of players!");
    }
  }

  private async handleNewViewerWantsToSubscribe(
    payload: NewPlayerWantsToJoinPayload
  ): Promise<void> {
    const { date, ip, uuid, playerName } = payload;
    this.gameService.subscribeViewer(playerName, uuid, this.uuid);
  }

  async handlePlayerPlayed(payload: PlayerPlayedPayload): Promise<void> {
    const { uuid, selectedIndex } = payload;

    const player = await this.gameService.findPlayer(uuid);

    if (player) {
      // Check if it's the player's turn before allowing them to play
      if (player.isTheirTurn) {
        // Acquire the mutex before playing and changing the turn
        const release =
          await this.gameService.turnMutex();

        var isGameEnded = await this.gameService.playGame(
          player,
          selectedIndex,
          this.uuid
        );

        if (isGameEnded != "") {
          await this.publishMessageToGameEvents(isGameEnded, this.uuid);
        }

        // Set the next player's isTheirTurn property to true
        await this.gameService.setWhoseTurn();

        // Release the mutex when done
        release();
      } else {
        console.log(`Player ${uuid} tried to play out of turn`);
      }
    } else {
      console.log(`Player ${uuid} not found`);
    }
  }

  private async handleNewPlayerApprovedToJoin(
    payload: NewPlayerApprovedToJoinPayload
  ): Promise<void> {
    const { uuid } = payload;
    console.log(`New player ${uuid} approved to join`);
    // Do something with the approved player

    await this.publishMessageToExchange(payload, this.uuid);
  }

  private async handleNewViewerApprovedToSubscribe(
    payload: NewViewerApprovedToSubscribePayload
  ): Promise<void> {
    const { uuid } = payload;
    console.log(`New viewer ${uuid} approved to subscribe`);
    // Do something with the approved player
  }

  private async handlePlayerAttemptsToPlay(
    payload: PlayerAttemptsToPlayPayload
  ): Promise<void> {
    if (this.gameService.isGameNotStarted()) {
      console.log("Game is not started yet. Cannot play.");
      return;
    }

    const { uuid, selectedIndex } = payload;
    console.log("payload", payload);
    const player = await this.gameService.findPlayer(uuid);

    if (player) {
      if (!player.isTheirTurn) {
        const message = {
          event: Events.GameMessageToPlayer,
          payload: {
            uuid,
            playerUuid: player.uuid,
            message: `It is not your turn yet.`,
          },
        };

        await this.publishMessageToExchange(message, this.uuid);

        console.log(`Player ${player.name} cannot play at this time.`);

        return;
      }

      let failureEvent = { message: "" };

      const isValidCard =
        await this.gameService.isThisAValidCardToPlay(
          player,
          selectedIndex,
          failureEvent
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

        await this.publishMessageToGameEvents(message, this.uuid);
        await this.publishMessageToExchange(message, this.uuid);
      } else {
        console.log("Invalid card played");

        const message = {
          event: Events.GameMessageToPlayer,
          payload: {
            uuid,
            playerUuid: player.uuid,
            message: failureEvent.message,
          },
        };

        await this.publishMessageToExchange(message, this.uuid);
      }
    } else {
      console.log(`Player ${uuid} not found`);
    }
  }

  async getGameData(uuid: string): Promise<any> {
    return this.gameService.getGameData(uuid);
  }

  public isGameEnded(): boolean {
    return this.gameService.isGameEnded();
  }

  public isGameNotStarted(): boolean {
    return this.gameService.isGameNotStarted();
  }

  public isGameStarted(): boolean {
    return this.gameService.isGameStarted();
  }

  async restartGame(): Promise<any> {
    this.gameService.restartAsClean();

    const message = {
      event: Events.GameRestarted,
    };

    await this.publishMessageToExchange(message, this.uuid);
  }
}

export { EventManager };
