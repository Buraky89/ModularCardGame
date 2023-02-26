class PlayerService {
  private players: string[] = [];

  addPlayer(uuid: string): void {
    console.log(`Player added: ${uuid}`);
    this.players.push(uuid);
  }
}

export { PlayerService };
