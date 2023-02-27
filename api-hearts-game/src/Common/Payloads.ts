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

interface PlayerAttemptsToPlayPayload {
  uuid: string;
  selectedIndex: number;
}

export {
  NewPlayerWantsToJoinPayload,
  PlayerPlayedPayload,
  NewPlayerApprovedToJoinPayload,
  PlayerAttemptsToPlayPayload,
};
