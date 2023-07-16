import { BasePayload } from "./BasePayload";
import { Player } from "./Player";

interface NewPlayerWantsToJoinPayload extends BasePayload {
  date: Date;
  ip: string;
  uuid: string;
  playerName: string;
}

interface GeneralUpdateMessagePayload extends BasePayload {
  gameUuidList: string[];
}

interface PlayerPlayedPayload extends BasePayload {
  uuid: string;
  selectedIndex: number;
}

interface NewPlayerApprovedToJoinPayload extends BasePayload {
  uuid: string;
  approvedAt: Date;
}

interface NewViewerApprovedToSubscribePayload extends BasePayload {
  uuid: string;
  approvedAt: Date;
}

interface PlayerAttemptsToPlayPayload extends BasePayload {
  uuid: string;
  selectedIndex: number;
}

interface CardsAreDistributedPayload extends BasePayload {
}

interface GameMessageToPlayerPayload extends BasePayload {
  uuid: string;
  playerUuid: string;
  message: string;
}

interface GameStartRequestedPayload extends BasePayload {
  uuid: string;
}

interface GameStartApprovedPayload extends BasePayload {
  uuid: string;
}

interface GameEndedPayload extends BasePayload {
  winner: Player;
  players: Player[];
}

interface GeneralUpdateMessageExchangePayload extends BasePayload {
  gameUuidList: string[];
  viewerUuid: string;
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
  GeneralUpdateMessageExchangePayload
};
