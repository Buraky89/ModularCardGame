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
  GameUpdatedEventCreationRequest = "GameUpdatedEventCreationRequest",
  NewViewerWantsToSubscribe = "NewViewerWantsToSubscribe",
  NewViewerWantsToSubscribeGeneral = "NewViewerWantsToSubscribeGeneral",
  NewViewerApprovedToSubscribe = "NewViewerApprovedToSubscribe",
  GameRestarted = "GameRestarted",
  CardsAreDistributed = "CardsAreDistributed",
  GameMessageToPlayer = "GameMessageToPlayer",
  GeneralUpdateMessage = "GeneralUpdateMessage",
  GeneralUpdateMessageExchange = "GeneralUpdateMessageExchange",
}

export default Events;
