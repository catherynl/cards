import fire from '../../fire';

import Deck from './Deck';

class GameModel {

  // props:
  // gameTypeId or gameId
  // gameType
  // onStateChange: callback (takes gameState as an argument)
  // onLocalStateChange: callback (takes a partial update in the form of props)
  // playerIndex


  constructor(props) {
    if (props.gameTypeId) {
      // TODO: create game
      this.gameId = 'something';
    } else {
      this.gameId = props.gameId;
    }
    this.onStateChange = props.onStateChange;
    this.onLocalStateChange = props.onLocalStateChange;
    this.playerIndex = props.playerIndex;
    this.gameState = {};
    this.gameType;

    this._setState({ playersToMove: this.getFirstStagePlayersToMove() });

    const listenerCallback = snapshot => {
      const newState = {}
      newState[snapshot.key] = snapshot.val();
      this._setState(newState);

      if (snapshot.key === 'tradeConfirmed' && this.playerIndex === 0 ) {
        const tradeConfirmed = snapshot.val();
        if (this._getNumPlayers() === tradeConfirmed.filter(i => i).length) {
          const hands = this.gameState.hands;
          const cardsToBePassed = this.gameState.cardsToBePassed;
          range(this._getNumPlayers()).forEach(i => {
            const cardsToConcat = cardsToBePassed[i] ? cardsToBePassed[i] : [];
            hands[i].cards = hands[i].cards ? hands[i].cards : [];
            const newCards = hands[i].cards.concat(cardsToConcat);
            this.gameType.sortHand(newCards);
            hands[i].cards = newCards;
          });
          fire.database().ref(this._getFirePrefix() + '/hands').set(hands);
          fire.database().ref(this._getFirePrefix() + '/cardsToBePassed').set({});
        }
      }
    };

    const removalListenerCallback = snapshot => {
      switch (snapshot.key) {
        case 'hands':
        case 'cardsToBePassed':
        case 'recentlyPlayed':
          const newState = {};
          newState[snapshot.key] = {};
          this.setState(newState);
          break;
        case 'tradeConfirmed':
          const newState = {};
          newState[snapshot.key] = [];
          this.setState(newState);
          break;
        default:
          window.alert('WARNING: a field that was not expected to be cleared has been ' +
                       'removed from the game state database: ' + snapshot.key);
      }
    };

    gamesRef.on('child_changed', listenerCallback);
    gamesRef.on('child_added', listenerCallback);
    gamesRef.on('child_removed', removalListenerCallback);
  }

  _getFirePrefix() {
    return 'games/' + this.gameId;
  }

  _getRecentlyPlayedCardsFirePrefix() {
    return this._getFirePrefix() + '/hands/' + (RECENTLY_PLAYED_INDEX + this.props.playerIndex) + '/cards';
  }

  _getNumPlayers() {
    return this.gameState.players.length;
  }

  _getCurrentStage() {
    return this.gameState.currentStage;
  }

  _isTrickTakingStage() {
    return this.gameType.getIsTrickTakingInStage(this._getCurrentStage());
  }

  _haveRecentlyPlayed() {
    if (this.gameState.hands[RECENTLY_PLAYED_INDEX + this.playerIndex].cards) {
      return true;
    } else {
      return false;
    }
  }

  _getRecentlyPlayed() {
    return range(this._getNumPlayers()).map(ind => this.gameState.hands[RECENTLY_PLAYED_INDEX + ind].cards);
  }

  _getValidPileIndsToDrawFrom() {
    // can only draw from nonempty table piles
    return Object.keys(this.gameState.hands)
            .filter(i => i >= DECK_INDEX && this._getNumCardsInHand(i) > 0)
  }

  _getNumCardsInHand(handInd) {
    if (this.gameState.hands[handInd] && this.gameState.hands[handInd].cards) {
      return this.gameState.hands[handInd].cards.length;
    }
    return 0;
  }

  _setState(props) {
    // update this.gameState
    this.onStateChange(this.gameState);
  }

  getFirstStagePlayersToMove() {
    const stageType = this.gameType.getStageType(0);
    switch (stageType) {
      case 'deal':
      case 'trade':
        let newPlayersToMove = Array(this._getNumPlayers()).fill(true);
        fire.database()
          .ref(this._getFirePrefix() + '/playersToMove')
          .set(newPlayersToMove);
        return newPlayersToMove;
      case 'buffer':
        newPlayersToMove = Array(this._getNumPlayers()).fill(false);
        fire.database()
          .ref(this._getFirePrefix() + '/playersToMove')
          .set(newPlayersToMove);
        return newPlayersToMove;
      case 'play':
      default:
        return this.gameState.playersToMove;
    }
  }

  enterNextStage() {
    const nextStage = this._getCurrentStage() + 1;
    fire.database().ref(this._getFirePrefix() + '/currentStage').set(nextStage);

    let newPlayersToMove = Array(this._getNumPlayers()).fill(false);
    const stageType = this.gameType.getStageType(nextStage);
    switch (stageType) {
      case 'deal':
      case 'trade':
        newPlayersToMove = Array(this._getNumPlayers()).fill(true);
        break;
      case 'play':
        newPlayersToMove[0] = true;
        break;
      case 'buffer':
        break;
      default:
        console.log('stage unrecognized, no players to move');
    };

    // clean up newly obtained tag
    const hands = this.gameState.hands;
    Object.keys(hands).forEach(i => {
      if (hands[i].cards) {
        hands[i].cards.forEach(card => {
          card.newlyObtained = false;
        });
      }
    });

    fire.database()
      .ref(this._getFirePrefix() + '/playersToMove')
      .set(newPlayersToMove);
    fire.database().ref(this._getFirePrefix() + '/tradeConfirmed').set({});
    fire.database().ref(this._getFirePrefix() + '/hands').set(hands);
  }

  playCardsClicked(props) {
    const myHand = this.gameState.hands[this.playerIndex].cards;
    if (!myHand) {
      window.alert('nothing to play.');
      return;
    }
    const selectedCards = myHand.filter((el, ind) => props.cardsSelected[ind]);
    if (selectedCards.length === 0) {
      window.alert('must select at least one card to play.');
      return;
    }
    if (this._isTrickTakingStage() && this._haveRecentlyPlayed()) {
      // end of the trick has been reached, so clear recentlyPlayed
      const hands = this.gameState.hands;
      range(this._getNumPlayers()).forEach(ind => {
        hands[RECENTLY_PLAYED_INDEX + ind].cards = [];
      });
      hands[RECENTLY_PLAYED_INDEX + this.playerIndex].cards = selectedCards;
      fire.database().ref(this._getFirePrefix() + '/hands').set(hands);
    } else {
      fire.database().ref(this._getRecentlyPlayedCardsFirePrefix()).set(selectedCards);
    }
    const remainingHand = myHand.filter((el, ind) => !cardsSelected[ind]);
    fire.database().ref(this._getFirePrefix() + '/hands/' + this.playerIndex + '/cards')
      .set(remainingHand);
    this.onLocalStateChange({ cardsSelected: Array(remainingHand.length).fill(false) });
  }

  passCardsClicked(props) {
    if (props.secondPhaseAction === -1) {
      const numPlayers = this._getNumPlayers();
      if (numPlayers === 1) {
        window.alert('no other players to pass to!');
        return;
      }
      const myHand = this.gameState.hands[this.playerIndex].cards;
      if (!myHand) {
        window.alert('nothing to pass.');
        return;
      }
      const selectedCards = myHand.filter((el, ind) => props.cardsSelected[ind]);
      if (selectedCards.length === 0) {
        window.alert('must select at least one card to pass.');
        return;
      }
      const updatedState = { secondPhaseAction: PASS_CARDS_INDEX };
      if (numPlayers === 2) {
        // only one other player to pass to, so set the choice by default
        updatedState['selectedTarget'] = 1 - this.playerIndex;
      }
      this.onLocalStateChange(updatedState);
    } else {
      console.assert(props.secondPhaseAction === PASS_CARDS_INDEX, 'invalid state entered with secondPhaseAction.');

      const passIndex = props.selectedTarget;
      if (passIndex === -1) {
        window.alert('must select player to pass to.');
        return;
      }

      // TODO: de-dup these lines from above
      const myHand = this.gameState.hands[this.playerIndex].cards;
      const selectedCards = myHand.filter((el, ind) => props.cardsSelected[ind]);

      selectedCards.forEach(card => {
        card.newlyObtained = true;1
      })
      const cardsToBePassed = this.gameState.cardsToBePassed;
      const newCardsToBePassed = cardsToBePassed[passIndex]
        ? cardsToBePassed[passIndex].concat(selectedCards)
        : selectedCards;

      fire.database()
        .ref(this._getFirePrefix() + '/cardsToBePassed/' + passIndex)
        .set(newCardsToBePassed);
      const remainingHand = myHand.filter((el, ind) => !props.cardsSelected[ind]);
      this.onLocalStateChange({
        cardsSelected: Array(remainingHand.length).fill(false),
        secondPhaseAction: -1 });
      fire.database()
        .ref(this._getFirePrefix() + '/hands/' + this.playerIndex + '/cards')
        .set(remainingHand);
    }
  }

  drawCardsClicked(props) {
    if (props.secondPhaseAction === -1) {
      const validPilesForDraw = this._getValidPileIndsToDrawFrom();
      if (validPilesForDraw.length === 0) {
        window.alert('no piles to draw from.');
        return;
      }
      const updatedState = { secondPhaseAction: DRAW_CARDS_INDEX };
      if (validPilesForDraw.length === 1) {
        updatedState['selectedTarget'] = validPilesForDraw[0];
      }
      this.onLocalStateChange(updatedState);
    } else {
      console.assert(props.secondPhaseAction === DRAW_CARDS_INDEX, 'invalid state entered with secondPhaseAction.');

      const numCardsToDraw = parseInt(props.numCardsToActOn === '' ? 1 : props.numCardsToActOn, 10);
      if (numCardsToDraw < 1) {
        window.alert('cannot draw fewer than 1 card.');
        return;
      }

      const targetInd = props.selectedTarget;
      const hands = this.gameState.hands;
      if (!(hands[targetInd])) {
        window.alert('must select somewhere to draw from.');
        return;
      }
      if (this._getNumCardsInHand(targetInd) < numCardsToDraw) {
        window.alert('cannot draw from here -- pile has too few cards.');
        return;
      }
      const targetCards = hands[targetInd].cards;
      const newCards = range(numCardsToDraw).map(i => targetCards.pop());
      fire.database().ref(this._getFirePrefix() + '/hands/' + targetInd + '/cards').set(targetCards);
      let myCards = hands[this.props.playerIndex].cards;
      myCards = myCards.concat(newCards);
      this.gameType.sortHand(myCards);
      fire.database().ref(this._getFirePrefix() + '/hands/' + this.playerIndex + '/cards').set(myCards);
      this.onLocalStateChange({ secondPhaseAction: -1 });
      // this.numCardsToActOn.value = '';   // TODO: fix after refactor
    }
  }

  discardCardsClicked(props) {
    if (props.secondPhaseAction === -1) {
      const myHand = this.gameState.hands[this.playerIndex].cards;
      if (!myHand) {
        window.alert('nothing to discard.');
        return;
      }
      const selectedCards = myHand.filter((el, ind) => props.cardsSelected[ind]);
      if (selectedCards.length === 0) {
        window.alert('must select at least one card to discard.');
        return;
      }
      this.onLocalStateChange({ secondPhaseAction: DISCARD_CARDS_INDEX });
    } else {
      console.assert(props.secondPhaseAction === DISCARD_CARDS_INDEX, 'invalid state entered with secondPhaseAction.');

      const targetInd = props.selectedTarget;
      const hands = this.gameState.hands;
      if (!(hands[targetInd])) {
        window.alert('must select somewhere to discard to.');
        return;
      }

      const myCards = this.gameState.hands[this.playerIndex].cards;
      const selectedCards = myCards.filter((el, ind) => props.cardsSelected[ind]);
      const remainingHand = myCards.filter((el, ind) => !props.cardsSelected[ind]);
      fire.database()
        .ref(this._getFirePrefix() + '/hands/' + this.playerIndex + '/cards')
        .set(remainingHand);

      let targetCards = hands[targetInd].cards ? hands[targetInd].cards : [];
      targetCards = targetCards.concat(selectedCards);
      fire.database().ref(this._getFirePrefix() + '/hands/' + targetInd + '/cards').set(targetCards);
      this.onLocalStateChange({
        cardsSelected: Array(remainingHand.length).fill(false),
        secondPhaseAction: -1 });
    }
  }

  endTurnClicked() {
    const nextPlayerInCycle = (this.playerIndex + 1) % this._getNumPlayers();
    let newPlayerToMove = nextPlayerInCycle;

    if (this._isTrickTakingStage()) {
      const recentlyPlayed = this._getRecentlyPlayed();
      const numPlayersWhoHavePlayed = recentlyPlayed.filter((val) => val).length;
      if (numPlayersWhoHavePlayed === this._getNumPlayers()) {
        // try to determine who won the trick
        const eachPlayerPlayedSingleCard = recentlyPlayed.every((val) => val.length === 1);
        // only try to guess if everyone played exactly one card
        if (eachPlayerPlayedSingleCard) {
          const startingSuit = recentlyPlayed[nextPlayerInCycle][0].suit;
          let maxRankOfStartingSuit = -MAX_ABS_CARD_RANK;
          let winningPlayer = -1;
          recentlyPlayed.forEach((val, ind) =>
          {
            if (val[0].suit === startingSuit) {
              const rank = this.gameType.getCardComparisonRank(val[0]);
              if (rank > maxRankOfStartingSuit) {
                maxRankOfStartingSuit = rank;
                winningPlayer = ind;
              }
            }
          });
          newPlayerToMove = winningPlayer;
        }
      }
    }

    fire.database()
      .ref(this._getFirePrefix() + '/playersToMove/' + this.playerIndex)
      .set(false);
    fire.database()
      .ref(this._getFirePrefix() + '/playersToMove/' + newPlayerToMove)
      .set(true);
  }

  confirmTradeClicked() {
    fire.database().ref(this._getFirePrefix() + '/tradeConfirmed/' + this.playerIndex).set(true);
  }

  dealCardsClicked() {
    const deck = new Deck({
      cards: this.gameType.getDeck(),
      displayMode: this.gameState.hands[DECK_INDEX].displayMode,
      visible: this.gameState.hands[DECK_INDEX].visibility[this.playerIndex]
    });
    const hands = deck.deal(
      this._getNumPlayers(),
      this.gameType.getDealCountPerPlayerInStage(this._getCurrentStage()),
      this.gameType.getHandleRemainingInStage(this._getCurrentStage()));
    range(this._getNumPlayers()).forEach(i => {
      this.gameType.sortHand(hands[i].cards);
      hands[i].name = 'Player ' + (i + 1) + ': ' + this.gameState.players[i];
    });
    const numCardsInMyHand = hands[this.playerIndex].cards.length;
    this.onLocalStateChange({ cardsSelected: Array(numCardsInMyHand).fill(false) });
    // augment hands with recently played
    range(this._getNumPlayers()).forEach(i => {
      hands[RECENTLY_PLAYED_INDEX + i] = {
        cards: [],
        displayMode: 'fan',
        visibility: Array(this._getNumPlayers()).fill(true) };
    });

    let oldHands = this.gameState.hands;
    oldHands = Object.assign(oldHands, hands);
    fire.database().ref(this._getFirePrefix() + '/hands').set(oldHands);
    this.enterNextStage();
  }

  undoPlayClicked() {
    const recentlyPlayed = this._getRecentlyPlayed();
    const cardsToReplace = (recentlyPlayed && recentlyPlayed[this.playerIndex])
     ? recentlyPlayed[this.playerIndex]
     : [];
    const myHand = this.gameState.hands[this.playerIndex];
    const myCards = (myHand && myHand.cards) ? myHand.cards : [];
    const newHand = myCards.concat(cardsToReplace);
    fire.database()
      .ref(this._getFirePrefix() + '/hands/' + this.playerIndex + '/cards')
      .set(newHand);
    fire.database()
      .ref(this._getRecentlyPlayedCardsFirePrefix())
      .set([]);
  }

  cancelActionClicked() {
    this.onLocalStateChange({ secondPhaseAction: -1 });
  }

  revealHandClicked() {
    const visibility = Array(this._getNumPlayers()).fill(true);
    fire.database()
      .ref(this._getFirePrefix() + '/hands/' + this.playerIndex + '/visibility')
      .set(visibility);
  }

  startGameClicked() {
    fire.database().ref(this._getFirePrefix() + '/hands')
      .set(this.gameType.getHandsFromAdditionalHands(this._getNumPlayers()));
    fire.database().ref(this._getFirePrefix() + '/started').set(true);
  }

  nextStageClicked() {
    this.enterNextStage();
  }
}

export default GameModel;