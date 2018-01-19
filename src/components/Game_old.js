import React, { Component } from 'react';
import fire from '../fire';
import KeyHandler from 'react-key-handler';
import { range } from 'lodash';

import Deck from './Deck';
import Hand from './Hand';
import GameType from '../utils/GameType';
import {
  ACTION_MAP,
  PASS_CARDS_INDEX,
  DRAW_CARDS_INDEX,
  UNDO_PLAY_INDEX,
  DISCARD_CARDS_INDEX
} from '../utils/stage';
import {
  RECENTLY_PLAYED_INDEX,
  DECK_INDEX,
  MAX_ABS_CARD_RANK,
  CARD_WIDTH_UI
} from '../utils/magic_numbers';

class Game extends Component {

  constructor(props) {
    super(props); // playerIndex, gameId, leaveGame (callback)
    this.state = {
      gameState: {
        started: false,
        finished: false,
        currentStage: 0,
        hands: {},
        players: [],
        tradeConfirmed: [],
        cardsToBePassed: {},
      },
      cardsSelected: [], // booleans, one for each card in this player's hand
      secondPhaseAction: -1,   // actionIndex corresponding to action awaiting confirmation; else -1
      selectedTarget: -1,   // index of player selected to pass cards to, or index of pile to draw from; -1 if none
      minPlayers: 10000, // prevents "Start Game" from being shown too early
    };
    this.gameType = 0;
  }

  onCardSelected(cardIndex) {
    let { cardsSelected } = this.state;
    cardsSelected[cardIndex] = !(cardsSelected[cardIndex]);
    this.setState({ cardsSelected });
  }

  startGameClicked() {
    fire.database().ref(this._getFirePrefix() + '/hands')
      .set(this.gameType.getHandsFromAdditionalHands(this._getNumPlayers()));
    fire.database().ref(this._getFirePrefix() + '/started').set(true);
  }

  enterPressed() {
    if (this.isYourTurn()) {
      // if at least play is a valid option, and at least one card is selected, play; else, end turn.
      const canPlayCards = this.gameType.getPlayCardsInStage(this._getCurrentStage());
      if (canPlayCards && this.state.cardsSelected.some(val => val)) {
        this.playCardsClicked();
      } else if (this.gameType.getEndTurnInStage(this._getCurrentStage())) {
        this.endTurnClicked();
      }
    }
  }

  recordTargetSelection(targetInd) {
    this.setState({ selectedTarget: targetInd });
  }

  nextStageClicked() {
    this.enterNextStage();
  }

  playAgainClicked() {
    const { gameState } = this.state;
    const resetGameState = {
      started: false,
      finished: false,
      currentStage: 0,
      hands: {},
      playersToMove: this.getFirstStagePlayersToMove()
    };
    Object.assign(gameState, resetGameState);
    fire.database().ref(this._getFirePrefix()).set(gameState);
  }

  endGameClicked() {
    const winner = Math.floor(Math.random() * this._getNumPlayers()) + 1;
    fire.database().ref(this._getFirePrefix() + '/winner').set(winner);
    fire.database().ref(this._getFirePrefix() + '/finished').set(true);
  }

  leaveGameClicked() {
    this.props.leaveGame();
  }
}

export default Game;