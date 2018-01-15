class GameType {

  constructor(gameType) {
    console.log(gameType);
    this.name = gameType.name;
    this.deck = gameType.deck;
    this.rankOrder = gameType.rankOrder;
    this.handSortOrder = gameType.handSortOrder;
    this.minPlayers = gameType.minPlayers;
    this.maxPlayers = gameType.maxPlayers;
    this.stages = gameType.stages;
  }

  getName() {
    return this.name;
  }
  getDeck() {
    return this.deck;
  }
  getRankOrder() {
    return this.rankOrder;
  }
  getHandSortOrder() {
    return this.handSortOrder;
  }
  getMinPlayers() {
    return this.minPlayers;
  }
  getMaxPlayers() {
    return this.maxPlayers;
  }
  getStages() {
    return this.stages;
  }

  sampleFunction() {
    return;
  }
}

export default GameType;