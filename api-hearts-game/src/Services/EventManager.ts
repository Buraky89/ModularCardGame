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
import { IAmqpService } from "../Interfaces/IAmqpService";
import { IGameService } from "../Interfaces/IGameService";

interface ILogger {
  info(...message: any[]): void;
  error(...message: any[]): void;
}

class EventManager {
  public amqpService: IAmqpService;
  public gameService: IGameService;
  public uuid: string;
  public logger: ILogger;

  constructor(uuid: string, amqpService: IAmqpService, gameService: IGameService, logger: ILogger) {
    this.uuid = uuid;
    this.amqpService = amqpService;
    this.gameService = gameService;
    this.logger = logger;
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
    const callback = (message: any) => {
      this.publishMessageToGameEvents(message, this.uuid);
    };
    await this.gameService.startPlayerService(callback);


    await this.amqpService.subscribeQueue(this.uuid, this.handleMessage.bind(this));
    await this.amqpService.subscribeExchange(this.uuid, this.handleExchange.bind(this));
  }

  async stop(): Promise<void> {
    await this.amqpService.stop();
  }

  async handleExchange(msg: any): Promise<void> {
    const message = JSON.parse(msg.content.toString());
    this.logger.info(`Received message: ${JSON.stringify(message)}`);
    await this.handleExchangeEvent(message);
  }

  async handleMessage(msg: any): Promise<void> {
    console.log("HANDLEMESSAGE RUNNNNN;");
    if (this.gameService.isGameEnded()) {
      this.logger.info("Game is ended, ignoring message");
      return;
    }

    const message = JSON.parse(msg.content.toString());
    this.logger.info(`Received message: ${JSON.stringify(message)}`);
    await this.handleEvent(message);
  }

  async handleExchangeEvent(message: any): Promise<void> {
    console.log("handleExchangeEventhandleExchangeEventhandleExchangeEventhandleExchangeEvent");
    const { event, payload } = message;

    let playerUuid = "";
    if (event === Events.GameMessageToPlayer) {
      const gameMessageToPlayerPayload = payload as GameMessageToPlayerPayload;
      playerUuid = gameMessageToPlayerPayload.playerUuid;
    }
    const mergedPlayersArray = this.gameService.GetPlayerUuidsToExchange(playerUuid);

    await this.delay(1000);

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
        console.log("this.exchangeToPlayerQueue messageToExchange ", player.uuid, messageToExchange);
        await this.exchangeToPlayerQueue(player.uuid, messageToExchange);
      } else {
        console.log("this.exchangeToPlayerQueue message", player.uuid, message);
        await this.exchangeToPlayerQueue(player.uuid, message);
      }
    }
  }

  async delay(ms: number) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  async exchangeToPlayerQueue(playerUuid: string, messageToExchange: any) {
    try {
      this.logger.info(`Exchanging message to player ${playerUuid}`);
      await this.amqpService.publishMessageToPlayerQueue(this.uuid, playerUuid, messageToExchange);
    } catch (error) {
      this.logger.error(`Error sending message to player ${playerUuid}: ${error}`);
    }
  }

  async handleEvent(message: any): Promise<void> {
    const { event, payload } = message;

    if (
      this.gameService.isGameEnded() &&
      event !== Events.GameEnded
    ) {
      this.logger.info("Game is ended, ignoring event");
      return;
    }

    const handler = this.eventHandlers[event as Events];
    if (!handler) {
      throw new Error(`Invalid event: ${event}`);
    }

    await handler.bind(this)(payload);
  }

  async subscribePlayerExchangeQueue(
    viewerUuid: string,
    gameUuid: string,
    callback: (msg: any) => void,
  ): Promise<void> {
    return await this.amqpService.subscribePlayerExchangeQueue(viewerUuid, gameUuid, callback);
  }

  async publishMessageToExchange(payload: any, uuid: string): Promise<void> {
    await this.amqpService.publishMessageToExchange(payload, uuid);
  }

  async publishMessageToGameEvents(payload: any, uuid: string): Promise<void> {
    await this.amqpService.publishMessageToGameEvents(payload, uuid);
  }

  private async handleGameStartRequested(
    payload: GameStartRequestedPayload
  ): Promise<void> {
    const { uuid } = payload;
    const player = await this.gameService.findPlayer(uuid);
    if (player && await this.gameService.isPlayersStillNotMax() == false) {
      this.logger.info("Game start requested by first player");
      const message = {
        event: Events.GameStartApproved,
        payload: {},
      };
      await this.publishMessageToGameEvents(message, this.uuid);
    } else if (await this.gameService.isPlayersStillNotMax() == true) {
      this.logger.info("There are not enough players to start yet");
    } else {
      this.logger.info(`Player ${uuid} cannot request game start`);
    }
  }

  private async handleGameStartApproved(
    payload: GameStartApprovedPayload
  ): Promise<void> {
    this.logger.info("Game start approved");
    this.gameService.startGame();

    await this.publishMessageToExchange(payload, this.uuid);
  }

  private async handleCardsAreDistributed(
    payload: CardsAreDistributedPayload
  ): Promise<void> {
    await this.gameService.onCardsAreDistributed();
  }

  private async handleGameEnded(payload: GameEndedPayload): Promise<void> {
    this.logger.info("Game has ended!");
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
      this.logger.info("Game has already maximum number of players!");
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
        this.logger.info(`Player ${uuid} tried to play out of turn`);
      }
    } else {
      this.logger.info(`Player ${uuid} not found`);
    }
  }

  private async handleNewPlayerApprovedToJoin(
    payload: NewPlayerApprovedToJoinPayload
  ): Promise<void> {
    const { uuid } = payload;
    this.logger.info(`New player ${uuid} approved to join`);
    // Do something with the approved player

    await this.publishMessageToExchange(payload, this.uuid);
  }

  private async handleNewViewerApprovedToSubscribe(
    payload: NewViewerApprovedToSubscribePayload
  ): Promise<void> {
    const { uuid } = payload;
    this.logger.info(`New viewer ${uuid} approved to subscribe`);
    // Do something with the approved player
  }

  private async handlePlayerAttemptsToPlay(
    payload: PlayerAttemptsToPlayPayload
  ): Promise<void> {
    if (this.gameService.isGameNotStarted()) {
      this.logger.info("Game is not started yet. Cannot play.");
      return;
    }

    const { uuid, selectedIndex } = payload;
    this.logger.info("payload", payload);
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

        this.logger.info(`Player ${player.name} cannot play at this time.`);

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
        this.logger.info("message", message);

        await this.publishMessageToGameEvents(message, this.uuid);
        await this.publishMessageToExchange(message, this.uuid);
      } else {
        this.logger.info("Invalid card played");

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
      this.logger.info(`Player ${uuid} not found`);
    }
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
