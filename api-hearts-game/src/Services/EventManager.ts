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

enum GameState {
  NOT_STARTED,
  STARTED,
  ENDED,
}

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
    [Events.CardsAreReadyToBeDistributed]: () => this.gameService.playerService.distributeCards(this.uuid),
    [Events.PlayerAttemptsToPlay]: (payload) => this.handlePlayerAttemptsToPlay(payload),
    [Events.GameEnded]: (payload) => this.handleGameEnded(payload),
    [Events.GameStartRequested]: (payload) => this.handleGameStartRequested(payload),
    [Events.GameStartApproved]: (payload) => this.handleGameStartApproved(payload),
    [Events.CardsAreDistributed]: (payload) => this.handleCardsAreDistributed(payload),
  };

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
      this.gameService.gameState == GameState.ENDED &&
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
    const player = this.gameService.playerService.players.find(
      (p) => p.uuid === uuid
    );

    if (player && this.gameService.playerService.players.length == 4) {
      console.log("Game start requested by first player");
      const message = {
        event: Events.GameStartApproved,
        payload: {},
      };
      await this.publishMessageToGameEvents(message, this.uuid);
    } else if (this.gameService.playerService.players.length < 4) {
      console.log("There are not enough players to start yet");
    } else {
      console.log(`Player ${uuid} cannot request game start`);
    }
  }

  private async handleGameStartApproved(
    payload: GameStartApprovedPayload
  ): Promise<void> {
    console.log("Game start approved");
    this.gameService.gameState = GameState.STARTED;

    await this.publishMessageToExchange(payload, this.uuid);
  }

  private async handleCardsAreDistributed(
    payload: CardsAreDistributedPayload
  ): Promise<void> {
    this.gameService.playerService.onCardsAreDistributed();
  }

  private async handleGameEnded(payload: GameEndedPayload): Promise<void> {
    console.log("Game has ended!");
    this.gameService.gameState = GameState.ENDED;

    await this.publishMessageToExchange(payload, this.uuid);
  }

  private async handleNewPlayerWantsToJoin(
    payload: NewPlayerWantsToJoinPayload
  ): Promise<void> {
    const { date, ip, uuid, playerName } = payload;
    if (this.gameService.playerService.players.length < 4) {
      this.gameService.playerService.addPlayer(playerName, uuid, this.uuid);
    } else {
      console.log("Game has already maximum number of players!");
    }
  }

  private async handleNewViewerWantsToSubscribe(
    payload: NewPlayerWantsToJoinPayload
  ): Promise<void> {
    const { date, ip, uuid, playerName } = payload;
    this.gameService.playerService.subscribeViewer(playerName, uuid, this.uuid);
  }

  async handlePlayerPlayed(payload: PlayerPlayedPayload): Promise<void> {
    const { uuid, selectedIndex } = payload;

    const player = this.gameService.playerService.players.find(
      (p) => p.uuid === uuid
    );

    if (player) {
      // Check if it's the player's turn before allowing them to play
      if (player.isTheirTurn) {
        // Acquire the mutex before playing and changing the turn
        const release =
          await this.gameService.playerService.turnMutex.acquire();

        var isGameEnded = await this.gameService.playGame(
          player,
          selectedIndex,
          this.uuid
        );

        if (isGameEnded != "") {
          await this.publishMessageToGameEvents(isGameEnded, this.uuid);
        }

        // Set the next player's isTheirTurn property to true
        await this.gameService.playerService.setWhoseTurn();

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
    if (this.gameService.gameState == GameState.NOT_STARTED) {
      console.log("Game is not started yet. Cannot play.");
      return;
    }

    const { uuid, selectedIndex } = payload;
    console.log("payload", payload);
    const player = this.gameService.playerService.players.find(
      (p) => p.uuid === uuid
    );

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
    return this.gameService.gameState == GameState.ENDED;
  }

  async restartGame(): Promise<any> {
    this.gameService.restartAsClean();

    const message = {
      event: Events.GameRestarted,
    };

    await this.publishMessageToExchange(message, this.uuid);

    // this.start()
    //   .then(() => {
    //     console.log("GameService started");
    //   })
    //   .catch((error) => {
    //     console.error("Error starting GameService", error);
    //   });
  }
}

export { EventManager };
