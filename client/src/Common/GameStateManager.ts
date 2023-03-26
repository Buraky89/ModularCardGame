import { Card, Player } from "../Card";

enum GameState {
  NOT_STARTED,
  STARTED,
  ENDED,
}

class GameStateManager {
  private deck: Card[] = [];
  private playedDeck: Card[] = [];
  private players: Player[] = [];
  private autoPlay: boolean = false;
  private gameState: GameState = GameState.NOT_STARTED;
  private token: string;
  private uuid: string;
  private gameUuid: string;

  constructor(uuid: string, token: string, gameUuid: string) {
    this.uuid = uuid;
    this.token = token;
    this.gameUuid = gameUuid;
    this.setupGameStatePolling();
  }

  private async getPlayerData() {
    // Mock the HTTP call with the imaginary method getPlayerData
    const data = await getPlayerData(this.gameUuid, this.uuid, this.token);
    if (data.deck) this.deck = data.deck;
    this.playedDeck = data.playedDeck;
    this.players = data.players || [];
    this.gameState = data.gameState;
  }

  private setupGameStatePolling() {
    setInterval(async () => {
      await this.getPlayerData();
    }, 5000);
  }

  private async handleCardClick(cardIndex: number) {
    // Mock the HTTP call with the imaginary method playCard
    const data = await playCard(
      this.uuid,
      this.token,
      cardIndex,
      this.gameUuid
    );
    this.deck = data.deck || [];
    this.playedDeck = data.playedDeck;
    this.players = data.players || [];
  }

  private async startGame() {
    // Mock the HTTP call with the imaginary method startGame
    await startGame(this.uuid, this.token, this.gameUuid);
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
