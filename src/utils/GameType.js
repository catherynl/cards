import { range } from 'lodash';

class GameType {

  constructor(gameType) {
    this.name = gameType.name;
    this.deck = gameType.deck;
    this.rankOrder = gameType.rankOrder;
    this.handSortOrder = gameType.handSortOrder;
    this.minPlayers = gameType.minPlayers;
    this.maxPlayers = gameType.maxPlayers;
    this.stages = gameType.stages;

    this.cardCompareFunction = this._getCompareFunction();
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

  getStage(index) {
    return this.stages[index];
  }

  getNumStages() {
    return this.stages.length;
  }

  getActionInStage(stageIndex, actionIndex) {
    return this.stages[stageIndex].availableActions[actionIndex];
  }

  getHandleRemainingInStage(stageIndex) {
    return this.stages[stageIndex].handleRemaining;
  }

  getDealCountPerPlayerInStage(stageIndex) {
    return this.stages[stageIndex].dealCountPerPlayer;
  }

  getHandIndices() {
    return range(this.maxPlayers).concat([21]); // TODO fix for more decks
  }

  // returns compare function for sorting cards, based on this.rankOrder and this.handSortOrder
  _getCompareFunction() {
    let getCardComparisonRank;
    switch (this.rankOrder) {
      case 'K-high':
        getCardComparisonRank = (card) => card.rank;
        break;
      case 'A-high':
        getCardComparisonRank = (card) => card.rank === 1 ? 13 : card.rank - 1;
        break;
      case '2-high':
        getCardComparisonRank = (card) => card.rank < 3 ? card.rank + 11 : card.rank - 2;
        break;
      default:
        console.log('ERROR: invalid rankOrder encountered:', this.rankOrder);
        return;
    }
    let getCardValue;
    switch (this.handSortOrder) {
      case 'suitFirst':
        getCardValue = (card) => card.suit * 100 + getCardComparisonRank(card);   // assumes card rank will never exceed 100
        break;
      case 'rankFirst':
        getCardValue = (card) => getCardComparisonRank(card) * 10 + card.suit;    // assumes there will never be more than 10 suits
        break;
      default:
        console.log('ERROR: invalid handSortOrder encountered:', this.handSortOrder);
        return;
    }
    const cardCompareFunction = (card1, card2) => getCardValue(card1) - getCardValue(card2);
    return cardCompareFunction;
  }

  // hand: array of cards
  sortHand(hand) {
    return hand.sort(this.cardCompareFunction);
  }
}

export default GameType;