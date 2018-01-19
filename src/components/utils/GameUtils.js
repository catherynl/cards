import React, { Component } from 'react';
import { range } from 'lodash';

import { RECENTLY_PLAYED_INDEX } from '../../utils/magic_numbers';

class GameUtils extends Component {

  // props: gameType, gameState, playerIndex

  _getFirePrefix() {
    return 'games/' + this.props.gameId;
  }

  _getNumPlayers() {
    return this.props.gameState.players.length;
  }

  _getCurrentStage() {
    return this.props.gameState.currentStage;
  }

  _isTrickTakingStage() {
    return this.props.gameType.getIsTrickTakingInStage(this._getCurrentStage());
  }

  _haveRecentlyPlayed() {
    if (this.props.gameState.hands[RECENTLY_PLAYED_INDEX + this.props.playerIndex].cards) {
      return true;
    } else {
      return false;
    }
  }

  _getRecentlyPlayed() {
    return range(this._getNumPlayers()).map(ind => this.props.gameState.hands[RECENTLY_PLAYED_INDEX + ind].cards);
  }
}

export default GameUtils;
