import { AmqpService } from "./AmqpService";
import { v4 as uuidv4 } from "uuid";
import { PlayerService } from "./PlayerService";
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
import { Card } from "../Common/Card";
import { Player } from "../Common/Player";

enum GameState {
  NOT_STARTED,
  STARTED,
  ENDED,
}

class GameService {
  private playerService: PlayerService;
  private amqpService: AmqpService;
  private playedDeck: Card[] = [];
  private turnNumber = 1;
  public gameState: GameState = GameState.NOT_STARTED;

  constructor() {
    this.playerService = new PlayerService();
    this.amqpService = new AmqpService();
  }

  async start(): Promise<void> {
    const channel = await this.amqpService.start();

    // Pass channel object to PlayerService instance
    await this.playerService.start(channel);

    await channel.consume("game-events", this.handleMessage.bind(this), {
      noAck: true,
    });
  }

  async stop(): Promise<void> {
    await this.amqpService.stop();
  }

  async handleMessage(msg: any): Promise<void> {
    if (this.gameState == GameState.ENDED) {
      console.log("Game is ended, ignoring message");
      return;
    }

    const message = JSON.parse(msg.content.toString());
    console.log(`Received message: ${JSON.stringify(message)}`);
    this.handleEvent(message);
  }

  handleEvent(message: any): void {
    if (this.gameState == GameState.ENDED) {
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
        this.playerService.distributeCards();
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
    const player = this.playerService.players.find((p) => p.uuid === uuid);

    if (
      player &&
      player.isFirstPlayer &&
      this.playerService.players.length == 4
    ) {
      console.log("Game start requested by first player");
      const message = {
        event: Events.GameStartApproved,
        payload: {},
      };
      const buffer = Buffer.from(JSON.stringify(message));
      await this.amqpService.publish("", "game-events", buffer);
    } else if (this.playerService.players.length < 4) {
      console.log("There are not enough players to start yet");
    } else {
      console.log(`Player ${uuid} cannot request game start`);
    }
  }

  private handleGameStartApproved(payload: GameStartApprovedPayload): void {
    console.log("Game start approved");
    this.gameState = GameState.STARTED;
  }

  async playGame(player: Player, selectedIndex: number): Promise<void> {
    if (this.gameState == GameState.ENDED) {
      console.log("Game is ended, cannot play game");
      return;
    }

    if (this.playerService.haveAnyPlayersCards()) {
      if (!player.isTheirTurn) {
        console.log(`It is not ${player.name}'s turn`);
        return;
      }

      console.log(`Turn ${this.turnNumber}:`);

      if (player.getDeck().length === 0) {
        // TODO: no more cards to play
      }

      //this.playerService.giveTurn(player);
      const result = await player.playTurn(
        this.turnNumber,
        this.playedDeck,
        selectedIndex
      );

      if (result) {
        console.log(
          `${player.name} played ${result.card.cardType} and earned ${result.points} points`
        );
      } else {
        console.log(`${player.name} has no more cards in their deck.`);
      }

      //console.log("Last two cards played:", playedDeck.showLastCards());
      this.turnNumber++;
    }

    if (!this.playerService.haveAnyPlayersCards()) {
      console.log(
        `${this.playerService.players[0].name}: ${this.playerService.players[0].points} points`
      );
      console.log(
        `${this.playerService.players[1].name}: ${this.playerService.players[1].points} points`
      );
      console.log(
        `${this.playerService.players[2].name}: ${this.playerService.players[2].points} points`
      );
      console.log(
        `${this.playerService.players[3].name}: ${this.playerService.players[3].points} points`
      );

      console.log("Game has ended");
      const players = this.playerService.players.map((p) => ({
        name: p.name,
        score: p.points,
      }));
      const message = {
        event: Events.GameEnded,
        payload: {
          winner: this.playerService.getWinner(),
          players,
        },
      };
      const buffer = Buffer.from(JSON.stringify(message));
      await this.amqpService.publish("", "game-events", buffer);
      this.gameState = GameState.ENDED;
      return;
    }
  }

  private handleGameEnded(payload: GameEndedPayload): void {
    console.log("Game has ended!");
    this.gameState = GameState.ENDED;
  }

  private handleNewPlayerWantsToJoin(
    payload: NewPlayerWantsToJoinPayload
  ): void {
    const { date, ip, uuid, playerName } = payload;
    if (this.playerService.players.length < 4) {
      this.playerService.addPlayer(playerName, uuid);
    } else {
      console.log("Game has already maximum number of players!");
    }
  }

  async handlePlayerPlayed(payload: PlayerPlayedPayload): Promise<void> {
    const { uuid, selectedIndex } = payload;

    const player = this.playerService.players.find((p) => p.uuid === uuid);

    if (player) {
      await this.playGame(player, selectedIndex);

      // Set the next player's isTheirTurn property to true
      this.playerService.setWhoseTurn();
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
    const player = this.playerService.players.find((p) => p.uuid === uuid);

    if (player) {
      if (!player.isTheirTurn) {
        console.log(`Player ${player.name} cannot play at this time.`);
        return;
      }

      const isValidCard = await this.playerService.isThisAValidCardToPlay(
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
    const player = this.playerService.players.find((p) => p.uuid === uuid);
    if (!player) {
      return {
        players: this.playerService.players,
        playedDeck: this.playedDeck,
        gameState: this.gameState,
      };
    }

    return {
      deck: player.getDeck(),
      players: this.playerService.players,
      playedDeck: this.playedDeck,
      gameState: this.gameState,
    };
  }
}

export { GameService };
