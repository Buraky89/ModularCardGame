import { Player } from "./Player";

interface NewPlayerWantsToJoinPayload {
  date: Date;
  ip: string;
  uuid: string;
  playerName: string;
}

interface PlayerPlayedPayload {
  uuid: string;
  selectedIndex: number;
}

interface NewPlayerApprovedToJoinPayload {
  uuid: string;
  approvedAt: Date;
}

interface NewViewerApprovedToSubscribePayload {
  uuid: string;
  approvedAt: Date;
}

interface PlayerAttemptsToPlayPayload {
  uuid: string;
  selectedIndex: number;
}

interface CardsAreDistributedPayload {
}

interface GameMessageToPlayerPayload {
  uuid: string;
  playerUuid: string;
  message: string;
}

interface GameStartRequestedPayload {
  uuid: string;
}

interface GameStartApprovedPayload {
  uuid: string;
}

interface GameEndedPayload {
  winner: Player;
  players: Player[];
}

export {
  NewPlayerWantsToJoinPayload,
  PlayerPlayedPayload,
  NewPlayerApprovedToJoinPayload,
  PlayerAttemptsToPlayPayload,
  GameEndedPayload,
  GameStartRequestedPayload,
  GameStartApprovedPayload,
  NewViewerApprovedToSubscribePayload,
  CardsAreDistributedPayload,
  GameMessageToPlayerPayload,
};
