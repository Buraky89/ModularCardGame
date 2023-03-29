import { Card, Player } from "../Card";
import { GameDispatcher } from "./GameDispatcher";

enum GameState {
  NOT_STARTED,
  STARTED,
  ENDED,
}

class GameStateManager {
  public deck: Card[] = [];
  public playedDeck: Card[] = [];
  public players: Player[] = [];
  public autoPlay: boolean = false;
  public gameState: GameState = GameState.NOT_STARTED;
  private token: string;
  private uuid: string;
  private gameUuid: string;
  private gameDispatcher: GameDispatcher;

  constructor(uuid: string, token: string, gameUuid: string) {
    this.uuid = uuid;
    this.token = token;
    this.gameUuid = gameUuid;
    this.gameDispatcher = new GameDispatcher();
  }

  public updateGameData(data: any) {
    if (data.deck) this.deck = data.deck;
    if (data.playedDeck) this.playedDeck = data.playedDeck;
    if (data.players) this.players = data.players;
    if (data.gameState !== undefined) this.gameState = data.gameState;
  }

  public async handleCardClick(cardIndex: number) {
    // Mock the HTTP call with the imaginary method playCard
    await this.gameDispatcher.playCard(
      this.token,
      this.uuid,
      this.gameUuid,
      cardIndex
    );
  }

  public async startGame() {
    // Mock the HTTP call with the imaginary method startGame
    await this.gameDispatcher.startGame(this.uuid, this.token, this.gameUuid);
  }

  public setAutoPlay(autoPlay: boolean) {
    this.autoPlay = autoPlay;
    if (this.autoPlay && this.gameState === GameState.STARTED) {
      this.autoPlayInterval();
    }
  }

  private autoPlayInterval() {
    if (this.deck.length > 0) {
      this.handleCardClick(0);
    }
    setTimeout(() => this.autoPlayInterval(), 500);
  }
}

export default GameStateManager;
