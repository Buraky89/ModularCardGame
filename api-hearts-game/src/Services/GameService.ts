import { AmqpService } from "./AmqpService";
import { PlayerService } from "./PlayerService";
import Events from "../Common/Events";
import { Card, CardType } from "../Common/Card";
import { Player } from "../Common/Player";
import GameState from "../Common/Enums";
import { Channel } from "amqplib";

class GameService {
  public playerService: PlayerService;
  private amqpService: AmqpService;
  public playedDeck: Card[] = [];
  public turnNumber = 1;
  public gameState: GameState = GameState.NOT_STARTED;

  constructor() {
    this.playerService = new PlayerService();
    this.amqpService = new AmqpService();
  }

  restartAsClean() {
    this.playerService.restartAsClean();
    this.playedDeck = [];
    this.turnNumber = 1;
    this.gameState = GameState.NOT_STARTED;
    this.playerService.restartAsClean();
  }

  public async distributeCards(eventManagerUuid: string): Promise<void> {
    this.playerService.players.forEach((player) => {
      player.setCards(this.playerService.cardService.getNextCards());
    });

    // Publish CardsAreDistributed event after distributing cards
    await this.playerService.publishCardsAreDistributedEvent(eventManagerUuid);
  }

  public async startPlayerService(channel: Channel): Promise<void> {
    await this.playerService.start(channel);
  }

  public async onCardsAreDistributed(): Promise<void> {
    await this.playerService.onCardsAreDistributed();
  }

  async subscribeViewer(
    playerName: string,
    uuid: string,
    eventManagerUuid: string
  ): Promise<void> {
    await this.playerService.subscribeViewer(playerName, uuid, eventManagerUuid);
  }

  isThisAValidCardToPlay(
    player: Player,
    selectedIndex: number
  ): boolean {
    return true;
  }

  calculatePoints(turnNumber: number, card: Card): number {
    return turnNumber * card.score;
  }

  async playGame(
    player: Player,
    selectedIndex: number,
    eventManagerUuid: string
  ): Promise<any> {
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
        let points = this.calculatePoints(this.turnNumber, result.card);

        console.log(
          `${player.name} played ${result.card.cardType} and earned ${points} points`
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

      return message;
    } else {
      return "";
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
