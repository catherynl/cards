import React, { Component } from 'react';

import GameType from '../utils/GameType';

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
      localGameState: {
        cardsSelected: [], // booleans, one for each card in this player's hand
        secondPhaseAction: -1,   // actionIndex corresponding to action awaiting confirmation; else -1
        selectedTarget: -1,   // index of player selected to pass cards to, or index of pile to draw from; -1 if none
      },
    };
    this.gameType = 0;
  }

  componentWillMount() {
    const gamesRef = fire.database().ref(this._getFirePrefix());
    const currentState = await gamesRef.once('value');
    this._setState(currentState.val());
    
    const gameTypeRef = fire.database().ref('gameTypes/' + this.gameState.gameTypeId);
    const gameType = await gameTypeRef.once('value');
    this.gameType = new GameType(gameType.val());
  }
}

