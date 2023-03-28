import { ApiResponse } from "../Card";

export class GameDispatcher {
  public playCard(
    token: string,
    uuid: string,
    gameUuid: string,
    cardIndex: Number
  ): void {
    const headers = {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    };

    fetch(`http://localhost:3001/players/${uuid}/play`, {
      method: "POST",
      headers,
      body: JSON.stringify({
        cardIndex,
        gameUuid,
      }),
    })
      .then((response) => response.json())
      .then((data: ApiResponse) => {})
      .catch((error) => console.log(error));
  }

  public startGame(token: string, uuid: string, gameUuid: string): void {
    const headers = {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    };

    fetch(`http://localhost:3001/players/${uuid}/start`, {
      method: "POST",
      headers,
      body: JSON.stringify({
        gameUuid,
      }),
    })
      .then((response) => response.json())
      .then(() => {})
      .catch((error) => console.log(error));
  }
}

export default GameDispatcher;
