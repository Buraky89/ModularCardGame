import { ApiResponse } from "../Card";

interface LoginResponse {
  token: string;
}

interface JoinResponse {
  message: string;
  uuid: string;
}

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
      .then((data: ApiResponse) => { })
      .catch((error) => console.log(error));
  }

  public createGame(token: string): void {
    const headers = {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    };

    fetch("http://localhost:3001/createGame", {
      method: "POST",
      headers,
    })
      .then((response) => response.json())
      .then((data) => {
        console.log("Game created:", data);
      })
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
      .then(() => { })
      .catch((error) => console.log(error));
  }

  public async loginGame(
    playerName: string,
    setToken: (token: string) => void
  ): Promise<void> {
    try {
      const token = await this.handleLogin(playerName, setToken);
    } catch (error) {
      console.error(error);
    }
  }

  public async joinGame(
    playerName: string,
    gameUuid: string,
    token: string,
    setUuid: (uuid: string) => void
  ): Promise<void> {
    try {
      await this.handleJoinGame(token, gameUuid, setUuid);
    } catch (error) {
      console.error(error);
    }
  }

  public async subscribeGame(
    playerName: string,
    gameUuid: string,
    token: string,
    setUuid: (uuid: string) => void
  ): Promise<void> {
    try {
      await this.handleSubscribeGame(token, gameUuid, setUuid);
    } catch (error) {
      console.error(error);
    }
  }

  public async subscribeGeneral(
    token: string,
  ): Promise<void> {
    try {
      await this.handleSubscribeGeneral(token);
    } catch (error) {
      console.error(error);
    }
  }

  private async handleLogin(
    playerName: string,
    setToken: (token: string) => void
  ): Promise<string> {
    const response = await fetch("http://localhost:3001/login", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ username: playerName }),
    });

    const data: LoginResponse = await response.json();

    if (response.ok) {
      console.log("Logged in successfully");
      setToken(data.token);
      return data.token;
    } else {
      console.error(data);
      throw new Error("Login failed");
    }
  }

  private async handleJoinGame(
    token: string,
    gameUuid: string,
    setUuid: (uuid: string) => void
  ): Promise<void> {
    const response = await fetch("http://localhost:3001/join", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ token, gameUuid }),
    });

    const data: JoinResponse = await response.json();

    if (response.ok) {
      console.log(data.message);
      setUuid(data.uuid);
    } else {
      console.error(data.message);
      throw new Error("Joining game failed");
    }
  }

  private async handleSubscribeGame(
    token: string,
    gameUuid: string,
    setUuid: (uuid: string) => void
  ): Promise<void> {
    const response = await fetch("http://localhost:3001/subscribe", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ token, gameUuid }),
    });

    const data: JoinResponse = await response.json();

    if (response.ok) {
      console.log(data.message);
      setUuid(data.uuid);
    } else {
      console.error(data.message);
      throw new Error("Joining game failed");
    }
  }

  private async handleSubscribeGeneral(
    token: string
  ): Promise<void> {
    const response = await fetch("http://localhost:3001/subscribe-general", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ token }),
    });

    const data: JoinResponse = await response.json();

    if (response.ok) {
      console.log(data.message);
    } else {
      console.error(data.message);
      throw new Error("Subscribing general failed");
    }
  }

  public fetchGames(callback: (gameList: string[]) => void): void {
    fetch("http://localhost:3001/getGames")
      .then((response) => {
        if (!response.ok) {
          throw new Error(`Network error: ${response.statusText}`);
        }
        return response.json();
      })
      .then((data: string[]) => {
        callback(data);
      })
      .catch((error) => {
        console.error("Error fetching game list:", error);
      });
  }
}

export default GameDispatcher;
