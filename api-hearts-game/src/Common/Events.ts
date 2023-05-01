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
}

export default Events;
