import { PlayerService } from "./PlayerService";
import Events from "../Common/Events";
import { Card } from "../Common/Card";
import { Player } from "../Common/Player";
import GameState from "../Common/Enums";
import { MutexInterface } from "async-mutex";
import { IGameService } from "../Interfaces/IGameService";

class GameService implements IGameService {
  public playerService: PlayerService;
  public playedDeck: Card[] = [];
  public turnNumber = 1;
  public gameState: GameState = GameState.NOT_STARTED;

  constructor() {
    this.playerService = new PlayerService();
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

  public async startPlayerService(callback: (message: any) => void): Promise<void> {
    await this.playerService.start(callback);
  }

  public async onCardsAreDistributed(): Promise<void> {
    await this.playerService.onCardsAreDistributed();
  }

  public async findPlayer(uuid: string): Promise<Player | undefined> {
    const player = this.playerService.players.find(
      (p) => p.uuid === uuid
    );
    return player;
  }

  public async isPlayersStillNotMax(): Promise<boolean> {
    return this.playerService.players.length < 4;
  }

  public async setWhoseTurn(): Promise<void> {
    return this.playerService.setWhoseTurn();
  }

  public async addPlayer(playerName: string, uuid: string, gameUuid: string): Promise<void> {
    return this.playerService.addPlayer(playerName, uuid, gameUuid);
  }

  public async turnMutex(): Promise<MutexInterface.Releaser> {
    return this.playerService.turnMutex.acquire();
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
    selectedIndex: number,
    outputEvent?: { message: string }
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

  public isGameEnded(): boolean {
    return this.gameState === GameState.ENDED;
  }

  public isGameNotStarted(): boolean {
    return this.gameState === GameState.NOT_STARTED;
  }

  public isGameStarted(): boolean {
    return this.gameState === GameState.STARTED;
  }

  public async startGame(): Promise<void> {
    this.gameState = GameState.STARTED;
  }

  public async endGame(): Promise<void> {
    this.gameState = GameState.ENDED;
  }
}

export { GameService };
