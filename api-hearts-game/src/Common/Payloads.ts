import { Player } from "./Player";

interface BaseEvent {
  version: string;
}

interface NewPlayerWantsToJoinPayload extends BaseEvent {
  date: Date;
  ip: string;
  uuid: string;
  playerName: string;
}

interface GeneralUpdateMessagePayload extends BaseEvent {
  gameUuidList: string[];
}

interface PlayerPlayedPayload extends BaseEvent {
  uuid: string;
  selectedIndex: number;
}

interface NewPlayerApprovedToJoinPayload extends BaseEvent {
  uuid: string;
  approvedAt: Date;
}

interface NewViewerApprovedToSubscribePayload extends BaseEvent {
  uuid: string;
  approvedAt: Date;
}

interface PlayerAttemptsToPlayPayload extends BaseEvent {
  uuid: string;
  selectedIndex: number;
}

interface CardsAreDistributedPayload extends BaseEvent {
}

interface GameMessageToPlayerPayload extends BaseEvent {
  uuid: string;
  playerUuid: string;
  message: string;
}

interface GameStartRequestedPayload extends BaseEvent {
  uuid: string;
}

interface GameStartApprovedPayload extends BaseEvent {
  uuid: string;
}

interface GameEndedPayload extends BaseEvent {
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
  GeneralUpdateMessagePayload,
};
