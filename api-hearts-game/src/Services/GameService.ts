import { AmqpService } from "./AmqpService";
import { PlayerService } from "./PlayerService";
import Events from "../Common/Events";
import { Card } from "../Common/Card";
import { Player } from "../Common/Player";

enum GameState {
  NOT_STARTED,
  STARTED,
  ENDED,
}

class GameService {
  public playerService: PlayerService;
  private amqpService: AmqpService;
  private playedDeck: Card[] = [];
  private turnNumber = 1;
  public gameState: GameState = GameState.NOT_STARTED;

  constructor() {
    this.playerService = new PlayerService();
    this.amqpService = new AmqpService();
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
