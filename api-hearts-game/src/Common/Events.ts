enum Events {
  NewPlayerWantsToJoin = "NewPlayerWantsToJoin",
  NewPlayerApprovedToJoin = "NewPlayerApprovedToJoin",
  PlayerPlayed = "PlayerPlayed",
  CardsAreReadyToBeDistributed = "CardsAreReadyToBeDistributed",
  PlayerAttemptsToPlay = "PlayerAttemptsToPlay",
  GameEnded = "GameEnded",
  GameStartRequested = "GameStartRequested",
  GameStartApproved = "GameStartApproved",
  GameUpdated = "GameUpdated",
  NewViewerWantsToSubscribe = "NewViewerWantsToSubscribe",
  NewViewerApprovedToSubscribe = "NewViewerApprovedToSubscribe",
  GameRestarted = "GameRestarted",
  CardsAreDistributed = "CardsAreDistributed",
}

export default Events;
