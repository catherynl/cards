import React, { Component } from 'react';
import fire from '../../fire';
import { range } from 'lodash';

import {
  _getFirePrefix,
  _getNumPlayers,
  _isTrickTakingStage,
  _haveRecentlyPlayed,
  _getRecentlyPlayed
} from '../utils/GameUtils';

class PlayCardsAction extends Component {

	// props: gameState, playerIndex, cardsSelected, setState

  _getRecentlyPlayedCardsFirePrefix() {
    return this._getFirePrefix() + '/hands/' + (RECENTLY_PLAYED_INDEX + this.props.playerIndex) + '/cards';
  }

	playCardsClicked() {
    const myHand = this.props.gameState.hands[this.props.playerIndex].cards;
    if (!myHand) {
      window.alert('nothing to play.');
      return;
    }
    const cardsSelected = myHand.filter((el, ind) => this.props.cardsSelected[ind]);
    if (cardsSelected.length === 0) {
      window.alert('must select at least one card to play.');
      return;
    }
    if (this._isTrickTakingStage() && this._haveRecentlyPlayed()) {
      // end of the trick has been reached, so clear recentlyPlayed
      const { hands } = this.props.gameState;
      range(this._getNumPlayers()).forEach(ind => {
        hands[RECENTLY_PLAYED_INDEX + ind].cards = [];
      });
      hands[RECENTLY_PLAYED_INDEX + this.props.playerIndex].cards = cardsSelected;
      fire.database().ref(this._getFirePrefix() + '/hands').set(hands);
    } else {
      fire.database().ref(this._getRecentlyPlayedCardsFirePrefix()).set(cardsSelected);
    }
    const remainingHand = myHand.filter((el, ind) => !this.props.cardsSelected[ind]);
    this.props.setState({ cardsSelected: Array(remainingHand.length).fill(false) });
    fire.database().ref(this._getFirePrefix() + '/hands/' + this.props.playerIndex + '/cards')
      .set(remainingHand);
  }

  undoPlayClicked() {
    const { gameState } = this.props;
    const recentlyPlayed = this._getRecentlyPlayed();
    const cardsToReplace = (recentlyPlayed && recentlyPlayed[this.props.playerIndex])
     ? recentlyPlayed[this.props.playerIndex]
     : [];
    const myHand = gameState.hands[this.props.playerIndex];
    const myCards = (myHand && myHand.cards) ? myHand.cards : [];
    const newHand = myCards.concat(cardsToReplace);
    fire.database()
      .ref(this._getFirePrefix() + '/hands/' + this.props.playerIndex + '/cards')
      .set(newHand);
    fire.database()
      .ref(this._getRecentlyPlayedCardsFirePrefix())
      .set([]);
  }
}

export default PlayCardsAction;
