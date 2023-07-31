import { EventFactory } from "../Common/EventFactory";
import Events from "../Common/Events";
import { Event } from "../Common/Event";
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
  public latestEventVersion: number;

  constructor(uuid: string, amqpService: IAmqpService, gameService: IGameService, logger: ILogger) {
    this.uuid = uuid;
    this.amqpService = amqpService;
    this.gameService = gameService;
    this.logger = logger;
    this.latestEventVersion = 0;
  }

  eventHandlers: { [key in Events]?: (payload: any) => Promise<void> } = {
    // TODO: Check this list again. Do not update the event versions in EventFactory for the event that does not exist here. (i.e. GameUpdated)
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
    [Events.GameUpdatedEventCreationRequest]: (payload) => this.handleGameUpdatedEventCreationRequest(payload),
    [Events.GameMessageToPlayer]: (payload) => this.handleGameMessageToPlayerEvent(payload),
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

    await this.publishMessageToExchange(msg, this.uuid);
  }

  async handleMessage(msg: any): Promise<void> {
    if (this.gameService.isGameEnded()) {
      this.logger.info("Game is ended, ignoring message");
      return;
    }

    const message = JSON.parse(msg.content.toString());
    this.logger.info(`Received message: ${JSON.stringify(message)}`);
    await this.handleEvent(message);

    if ((message as Event).eventType !== Events.GameUpdatedEventCreationRequest) {
      await this.publishMessageToGameEvents(EventFactory.gameUpdatedEventCreationRequest(this.uuid), this.uuid)
    }

  }

  async handleGameMessageToPlayerEvent(message: any): Promise<void> {
    const gameMessageToPlayerPayload = message as GameMessageToPlayerPayload;

    await this.exchangeToPlayerQueue(gameMessageToPlayerPayload.playerUuid, EventFactory.gameMessageToPlayerExchange(this.uuid, gameMessageToPlayerPayload.playerUuid, message));
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
    const { eventType: event, eventPayload: payload, eventVersion } = message;

    // Here we check the version of incoming event.
    // If it's not the next version, we ignore it.
    if (eventVersion !== this.latestEventVersion + 1) {
      this.logger.info(`Ignoring event ${event}, expected version ${this.latestEventVersion + 1} but got ${eventVersion}`);
      // TODO: prevent being acknowledged at this point. afterwards, the event is going to be handled...
      return;
    } else {
      this.logger.info(`Well, nice event: ${event}, expected version ${this.latestEventVersion + 1} and got ${eventVersion}`);
    }

    // Update the latest version to the one we just received
    this.latestEventVersion = eventVersion;

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

  async publishMessageToGameEvents(payload: Event, uuid: string): Promise<void> {
    await this.amqpService.publishMessageToGameEvents(payload, uuid);
  }

  private async handleGameStartRequested(
    payload: GameStartRequestedPayload
  ): Promise<void> {
    const { uuid } = payload;
    const player = await this.gameService.findPlayer(uuid);
    if (player && await this.gameService.isPlayersStillNotMax() == false) {
      this.logger.info("Game start requested by first player");
      const message = EventFactory.gameStartApproved(this.uuid);

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

    this.publishMessageToGameEvents(EventFactory.gameUpdatedEventCreationRequest(this.uuid), this.uuid)
  }

  private async handleCardsAreDistributed(
    payload: CardsAreDistributedPayload
  ): Promise<void> {
    await this.gameService.onCardsAreDistributed();
  }

  private async handleGameUpdatedEventCreationRequest(
    payload: GameStartRequestedPayload
  ): Promise<void> {
    const mergedPlayersArray = this.gameService.GetPlayerUuidsToExchange("");

    for (const player of mergedPlayersArray) {
      const playerUuid = player.uuid;
      const gameState = await this.gameService.getGameData(playerUuid);

      const messageToExchange = EventFactory.gameUpdated(this.uuid, gameState);

      await this.exchangeToPlayerQueue(player.uuid, messageToExchange);
    }
  }

  private async handleGameEnded(payload: GameEndedPayload): Promise<void> {
    this.logger.info("Game has ended!");
    this.gameService.endGame();

    this.publishMessageToGameEvents(EventFactory.gameUpdatedEventCreationRequest(this.uuid), this.uuid)
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

        var gameEndedInfo = await this.gameService.playGame(
          player,
          selectedIndex,
          this.uuid
        );

        if (gameEndedInfo.ended == true) {
          await this.publishMessageToGameEvents(EventFactory.gameEnded(gameEndedInfo.winner, gameEndedInfo.players), this.uuid);
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

    this.publishMessageToGameEvents(EventFactory.gameUpdatedEventCreationRequest(this.uuid), this.uuid)
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
        const message = EventFactory.gameMessageToPlayer(this.uuid, player.uuid, `It is not your turn yet.`);

        await this.publishMessageToGameEvents(message, this.uuid);

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
        const message = EventFactory.playerPlayed(uuid, selectedIndex);

        this.logger.info("message", message);

        await this.publishMessageToGameEvents(message, this.uuid);
      } else {
        this.logger.info("Invalid card played");

        const message = EventFactory.gameMessageToPlayer(uuid, player.uuid, failureEvent.message);

        await this.publishMessageToGameEvents(message, this.uuid);
      }
    } else {
      this.logger.info(`Player ${uuid} not found`);
    }
  }

  async restartGame(): Promise<any> {
    this.gameService.restartAsClean();

    const message = EventFactory.gameRestarted();
    // TODO: nothing is done with this event.

    await this.publishMessageToGameEvents(message, this.uuid)
  }
}

export { EventManager };
