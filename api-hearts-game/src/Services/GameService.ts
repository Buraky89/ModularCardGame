import { connect, Connection, ConsumeMessage, Channel } from "amqplib";
import { v4 as uuidv4 } from "uuid";
import { PlayerService } from "./PlayerService";
import Events from "../Common/Events";
import {
  NewPlayerWantsToJoinPayload,
  PlayerPlayedPayload,
  NewPlayerApprovedToJoinPayload,
  PlayerAttemptsToPlayPayload,
} from "../Common/Payloads";
import { Card } from "../Common/Card";
import { Player } from "../Common/Player";

class GameService {
  private playerService: PlayerService;
  private connection: Connection | null = null;
  private playedDeck: Card[] = [];
  private channel: Channel | null = null;
  private turnNumber = 1;

  constructor() {
    this.playerService = new PlayerService();
  }

  async start(): Promise<void> {
    this.connection = await connect("amqp://localhost");
    this.channel = await this.connection.createChannel();
    await this.channel.assertQueue("game-events");

    // Pass channel object to PlayerService instance
    await this.playerService.start(this.channel);

    await this.channel.consume("game-events", this.handleMessage.bind(this), {
      noAck: true,
    });
  }

  async stop(): Promise<void> {
    if (this.connection) {
      await this.connection.close();
      this.connection = null;
    }
  }

  async handleMessage(msg: any): Promise<void> {
    const message = JSON.parse(msg.content.toString());
    console.log(`Received message: ${JSON.stringify(message)}`);
    this.handleEvent(message);
  }

  handleEvent(message: any): void {
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
        const { playerId, cardIndex } = payload;

        if (this.playerService.isThisAValidCardToPlay(playerId, cardIndex)) {
          const message = {
            event: Events.PlayerPlayed,
            payload: {
              uuid: playerId,
              selectedIndex: cardIndex,
            },
          };
          const buffer = Buffer.from(JSON.stringify(message));
          this.channel?.sendToQueue("game-events", buffer);
        } else {
          console.log("Invalid card to play.");
        }

        break;
      default:
        throw new Error(`Invalid event: ${event}`);
    }
  }

  async playGame(player: Player, selectedIndex: number): Promise<void> {
    while (this.playerService.haveAnyPlayersCards()) {
      console.log(`Turn ${this.turnNumber}:`);

      if (player.deck.length === 0) {
        continue;
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
  }

  private handleNewPlayerWantsToJoin(
    payload: NewPlayerWantsToJoinPayload
  ): void {
    const { date, ip, uuid, playerName } = payload;
    this.playerService.addPlayer(playerName, uuid);
  }

  private async handlePlayerPlayed(
    payload: PlayerPlayedPayload
  ): Promise<void> {
    const { uuid, selectedIndex } = payload;

    const player = this.playerService.players.find((p) => p.uuid === uuid);

    if (player) {
      await this.playGame(player, selectedIndex);
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

    const player = this.playerService.players.find((p) => p.uuid === uuid);

    if (player) {
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
        const buffer = Buffer.from(JSON.stringify(message));
        await this.channel?.publish("", "game-events", buffer);
      } else {
        console.log("Invalid card played");
      }
    } else {
      console.log(`Player ${uuid} not found`);
    }
  }
}

export { GameService };
