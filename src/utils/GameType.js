import { range } from 'lodash';

import { MAX_ABS_CARD_RANK, MAX_NUM_SUITS } from './magic_numbers';
import { PLAY_CARDS_INDEX, END_TURN_INDEX } from './stage';

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

  getPlayCardsInStage(stageIndex) {
    return this.getActionInStage(stageIndex, PLAY_CARDS_INDEX);
  }

  getEndTurnInStage(stageIndex) {
    return this.getActionInStage(stageIndex, END_TURN_INDEX);
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

  getIsTrickTakingInStage(stageIndex) {
    return this._getNextPlayerRulesInStage(stageIndex) === 'trickTaking';
  }

  _getNextPlayerRulesInStage(stageIndex) {
    return this.stages[stageIndex].nextPlayerRules;
  }

  getHandIndices() {
    return range(this.maxPlayers).concat([21]); // TODO fix for more decks
  }

  getCardComparisonRank(card) {
    switch (this.rankOrder) {
      case 'K-high':
        return card.rank;
      case 'A-high':
        return card.rank === 1 ? 13 : card.rank - 1;
      case '2-high':
        return card.rank < 3 ? card.rank + 11 : card.rank - 2;
      default:
        console.log('ERROR: invalid rankOrder encountered:', this.rankOrder);
        return;
    }
  }

  // returns compare function for sorting cards, based on this.rankOrder and this.handSortOrder
  _getCompareFunction() {
    let getCardValue;
    switch (this.handSortOrder) {
      case 'suitFirst':
        getCardValue = (card) => card.suit * MAX_ABS_CARD_RANK + this.getCardComparisonRank(card);
        break;
      case 'rankFirst':
        // 10 is a large enough constant to account for custom suits
        getCardValue = (card) => this.getCardComparisonRank(card) * (MAX_NUM_SUITS + 10) + card.suit;
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