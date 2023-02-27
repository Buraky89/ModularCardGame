interface NewPlayerWantsToJoinPayload {
  date: Date;
  ip: string;
  uuid: string;
}

interface PlayerPlayedPayload {
  uuid: string;
  selectedIndex: number;
}

interface NewPlayerApprovedToJoinPayload {
  uuid: string;
  approvedAt: Date;
}

export {
  NewPlayerWantsToJoinPayload,
  PlayerPlayedPayload,
  NewPlayerApprovedToJoinPayload,
};
