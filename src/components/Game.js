import React, { Component } from 'react';
import fire from '../fire';
import KeyHandler from 'react-key-handler';
import { range } from 'lodash';

import Deck from './Deck';
import Hand from './Hand';
import GameType from '../utils/GameType';
import { ACTION_MAP, PASS_CARDS_INDEX, DRAW_CARDS_INDEX } from '../utils/stage';
import { RECENTLY_PLAYED_INDEX, DECK_INDEX, MAX_ABS_CARD_RANK } from '../utils/magic_numbers';

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

  _getFirePrefix() {
    return 'games/' + this.props.gameId;
  }

  _getRecentlyPlayedCardsFirePrefix() {
    return this._getFirePrefix() + '/hands/' + (RECENTLY_PLAYED_INDEX + this.props.playerIndex) + '/cards';
  }

  _getNumPlayers() {
    return this.state.gameState.players.length;
  }

  _getCurrentStage() {
    return this.state.gameState.currentStage;
  }

  _getRecentlyPlayed() {
    return range(this._getNumPlayers()).map(ind => this.state.gameState.hands[RECENTLY_PLAYED_INDEX + ind].cards);
  }

  _haveRecentlyPlayed() {
    return this.state.gameState.hands[RECENTLY_PLAYED_INDEX + this.props.playerIndex].cards;
  }

  _isTrickTakingStage() {
    return this.gameType.getIsTrickTakingInStage(this._getCurrentStage());
  }

  _getPlayersToMove() {
    return this.state.gameState.playersToMove;
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
        return this.state.gameState.playersToMove;
    }
  }

  async componentWillMount() {
    const gamesRef = fire.database().ref(this._getFirePrefix());
    const currentState = await gamesRef.once('value');
    const newGameState = Object.assign(this.state.gameState, currentState.val());

    const gameTypeRef = fire.database().ref('gameTypes/' + newGameState.gameTypeId);
    const gameType = await gameTypeRef.once('value');
    this.gameType = new GameType(gameType.val());

    newGameState.playersToMove = this.getFirstStagePlayersToMove();

    this.setState({
      gameState: newGameState,
      minPlayers: this.gameType.getMinPlayers()
    });

    const listenerCallback = snapshot => {
      const { gameState } = this.state;
      gameState[snapshot.key] = snapshot.val();
      this.setState({ gameState });

      if (snapshot.key === 'tradeConfirmed' && this.props.playerIndex === 0 ) {
        const tradeConfirmed = snapshot.val();
        if (this._getNumPlayers() === tradeConfirmed.filter(i => i).length) {
          const hands = gameState.hands;
          const cardsToBePassed = gameState.cardsToBePassed;
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
        case 'tradeConfirmed':
        case 'recentlyPlayed':
          const { gameState } = this.state;
          gameState[snapshot.key] = {};
          this.setState({ gameState });
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

  onCardSelected(cardIndex) {
    let { cardsSelected } = this.state;
    cardsSelected[cardIndex] = !(cardsSelected[cardIndex]);
    this.setState({ cardsSelected });
  }

  isYourTurn() {
    return this._getPlayersToMove()[this.props.playerIndex];
  }

  haveConfirmedTrade() {
    return this.state.gameState.tradeConfirmed[this.props.playerIndex];
  }

  allHaveConfirmedTrade() {
    const tradeConfirmed = Array.from(this.state.gameState.tradeConfirmed);
    return this._getNumPlayers() === tradeConfirmed.filter(i => i).length;
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
    const hands = this.state.gameState.hands;
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
  }

  shouldShowStartGameButton() {
    const minPlayersReached = (this._getNumPlayers() >= this.state.minPlayers);
    return minPlayersReached && !this.state.gameState.started;
  }

  shouldShowPlayerActions() {
    return this.isYourTurn() && !this.haveConfirmedTrade();
  }

  shouldShowGameInPlay() {
    return this.state.gameState.started && !this.state.gameState.finished;
  }

  shouldShowGameFinished() {
    return this.state.gameState.finished;
  }

  shouldShowNextStageButton() {
    return this._getCurrentStage() + 1 < this.gameType.getNumStages();
  }

  shouldShowEndGameButton() {
    return true; // TODO game logic
  }

  shouldShowPlayersTurnIndicator(i) {
    return this.gameType.getStageType(this._getCurrentStage()) === 'play' && this._getPlayersToMove()[i]
  }

  startGameClicked() {
    fire.database().ref(this._getFirePrefix() + '/hands').set(this.gameType.getHandsFromAdditionalHands(this._getNumPlayers()));
    fire.database().ref(this._getFirePrefix() + '/started').set(true);
  }

  playCardsClicked() {
    const myHand = this.state.gameState.hands[this.props.playerIndex].cards;
    if (!myHand) {
      window.alert('nothing to play.');
      return;
    }
    const cardsSelected = myHand.filter((el, ind) => this.state.cardsSelected[ind]);
    if (cardsSelected.length === 0) {
      window.alert('must select at least one card to play.');
      return;
    }
    if (this._isTrickTakingStage() && this._haveRecentlyPlayed()) {
      // end of the trick has been reached, so clear recentlyPlayed
      const { hands } = this.state.gameState;
      range(this._getNumPlayers()).forEach(ind => {
        hands[RECENTLY_PLAYED_INDEX + ind].cards = [];
      });
      hands[RECENTLY_PLAYED_INDEX + this.props.playerIndex].cards = cardsSelected;
      fire.database().ref(this._getFirePrefix() + '/hands').set(hands);
    } else {
      fire.database().ref(this._getRecentlyPlayedCardsFirePrefix()).set(cardsSelected);
    }
    const remainingHand = myHand.filter((el, ind) => !this.state.cardsSelected[ind]);
    this.setState({ cardsSelected: Array(remainingHand.length).fill(false) });
    fire.database().ref(this._getFirePrefix() + '/hands/' + this.props.playerIndex + '/cards')
      .set(remainingHand);
  }

  passCardsClicked() {
    if (this.state.secondPhaseAction === -1) {
      if (this._getNumPlayers() === 1) {
        window.alert('no other players to pass to!');
        return;
      }
      const myHand = this.state.gameState.hands[this.props.playerIndex].cards;
      if (!myHand) {
        window.alert('nothing to play.');
        return;
      }
      const selectedCards = myHand.filter((el, ind) => this.state.cardsSelected[ind]);
      if (selectedCards.length === 0) {
        window.alert('must select at least one card to pass.');
        return;
      }
      this.setState({ secondPhaseAction: PASS_CARDS_INDEX });
    } else {
      console.assert(this.state.secondPhaseAction === PASS_CARDS_INDEX, 'invalid state entered with secondPhaseAction.');

      const passIndex = this.state.selectedTarget;
      if (passIndex === -1) {
        window.alert('must select player to pass to.');
        return;
      }

      // TODO: de-dup these lines from above
      const myHand = this.state.gameState.hands[this.props.playerIndex].cards;
      const selectedCards = myHand.filter((el, ind) => this.state.cardsSelected[ind]);

      selectedCards.forEach(card => {
        card.newlyObtained = true;
      })
      const cardsToBePassed = this.state.gameState.cardsToBePassed;
      const newCardsToBePassed = cardsToBePassed[passIndex]
        ? cardsToBePassed[passIndex].concat(selectedCards)
        : selectedCards;

      fire.database()
        .ref(this._getFirePrefix() + '/cardsToBePassed/' + passIndex)
        .set(newCardsToBePassed);
      const remainingHand = myHand.filter((el, ind) => !this.state.cardsSelected[ind]);
      this.setState({
        cardsSelected: Array(remainingHand.length).fill(false),
        secondPhaseAction: -1 });
      fire.database()
        .ref(this._getFirePrefix() + '/hands/' + this.props.playerIndex + '/cards')
        .set(remainingHand);
    }
  }

  drawCardsClicked() {
    if (this.state.secondPhaseAction === -1) {
      this.setState({ secondPhaseAction: DRAW_CARDS_INDEX });
    } else {
      console.assert(this.state.secondPhaseAction === DRAW_CARDS_INDEX, 'invalid state entered with secondPhaseAction.');

      const targetInd = this.state.selectedTarget;
      const hands = this.state.gameState.hands;
      const targetCards = hands[targetInd].cards;
      if (targetCards.length === 0) {
        window.alert('cannot draw from here -- pile is empty.');
        return;
      }
      const newCard = targetCards.pop();
      fire.database().ref(this._getFirePrefix() + '/hands/' + targetInd + '/cards').set(targetCards);
      const myCards = hands[this.props.playerIndex].cards;
      myCards.push(newCard);
      this.gameType.sortHand(myCards);
      fire.database().ref(this._getFirePrefix() + '/hands/' + this.props.playerIndex + '/cards').set(myCards);
      this.setState({ secondPhaseAction: -1 });
    }
  }

  endTurnClicked() {
    const nextPlayerInCycle = (this.props.playerIndex + 1) % this._getNumPlayers();
    let newPlayerToMove = nextPlayerInCycle;

    if (this._isTrickTakingStage()) {
      const recentlyPlayed = this._getRecentlyPlayed();
      const numPlayersWhoHavePlayed = recentlyPlayed.filter((val) => val).length;
      if (numPlayersWhoHavePlayed === this._getNumPlayers()) {
        // try to determine who won the trick
        const eachPlayerPlayedSingleCard = recentlyPlayed.every((val) => val.length === 1);
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
      .ref(this._getFirePrefix() + '/playersToMove/' + this.props.playerIndex)
      .set(false);
    fire.database()
      .ref(this._getFirePrefix() + '/playersToMove/' + newPlayerToMove)
      .set(true);
  }

  confirmTradeClicked() {
    fire.database().ref(this._getFirePrefix() + '/tradeConfirmed/' + this.props.playerIndex).set(true);
  }

  dealCardsClicked() {
    const deck = new Deck({
      cards: this.gameType.getDeck(),
      displayMode: this.state.gameState.hands[DECK_INDEX].displayMode,
      visible: this.state.gameState.hands[DECK_INDEX].visibility[this.props.playerIndex]
    });
    const hands = deck.deal(
      this._getNumPlayers(),
      this.gameType.getDealCountPerPlayerInStage(this._getCurrentStage()),
      this.gameType.getHandleRemainingInStage(this._getCurrentStage()));
    range(this._getNumPlayers()).forEach(i => this.gameType.sortHand(hands[i].cards));
    const numCardsInMyHand = hands[this.props.playerIndex].cards.length;
    this.setState({ cardsSelected: Array(numCardsInMyHand).fill(false) });
    // augment hands with recently played
    range(this._getNumPlayers()).forEach(i => {
      hands[RECENTLY_PLAYED_INDEX + i] = { 
        cards: [],
        displayMode: 'fan',
        visibility: Array(this._getNumPlayers()).fill(true) };
    });

    let oldHands = this.state.gameState.hands;
    oldHands = Object.assign(oldHands, hands);
    fire.database().ref(this._getFirePrefix() + '/hands').set(oldHands);
    this.enterNextStage();
  }

  undoPlayClicked() {
    const { gameState } = this.state;
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

  cancelActionClicked() {
    this.setState({ secondPhaseAction: -1 });
  }

  revealHandClicked() {
    const visibility = Array(this._getNumPlayers()).fill(true);
    fire.database()
      .ref(this._getFirePrefix() + '/hands/' + this.props.playerIndex + '/visibility')
      .set(visibility);
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

  renderStartGameButton() {
    return (
      <div>
        Players so far:
        {
          this.state.gameState.players.map((player, ind) => {
            return (
              <div key={ ind }>&nbsp; { player } (Player { ind + 1 })</div>
            );
          })
        }
        <button onClick={ this.startGameClicked.bind(this) }>Start Game!</button>
      </div>
    );
  }

  renderPlayersTurnIndicator(ind) {
    const text = this.props.playerIndex === ind ? '(Your turn)' : '(This player\'s turn)';
    return <span className='turn-indicator'>{ text }</span>;
  }

  renderPlayer(ind) {
    const { gameState } = this.state;
    return (
      <div className='player' key={ ind }>
        <div className='player-name'>
          {'Player ' + (ind + 1) + ': ' + gameState.players[ind]}
          &nbsp;
          { this.shouldShowPlayersTurnIndicator(ind)
            ? this.renderPlayersTurnIndicator(ind)
            : null }
        </div>
        { gameState.hands ? this.renderHand(ind) : null }
        Recently played
        <br />
        { gameState.hands[RECENTLY_PLAYED_INDEX + ind]
          ? this.renderHand(RECENTLY_PLAYED_INDEX + ind)
          : null }
      </div>
    );
  }

  renderHand(playerInd) {
    const hand = this.state.gameState.hands[playerInd];
    if (!hand) {
      return <div></div>; // to allow correct spacing
    }
    const cards = hand.cards;
    const isYours = playerInd === this.props.playerIndex;
    return (
      <Hand
        key={ playerInd }
        cards={ cards ? cards : [] }
        isYours={ isYours }
        visible={ hand.visibility[this.props.playerIndex] }
        displayMode={ hand.displayMode }
        onSelect={ isYours ? this.onCardSelected.bind(this) : null }
        cardsSelected={ isYours ? this.state.cardsSelected : null }
      />
    );
  }

  renderTradeConfirmed() {
    let text = this.haveConfirmedTrade()
      ? 'Confirmed trade! Waiting for other players.'
      : '';
    text = this.allHaveConfirmedTrade()
      ? 'Everyone has confirmed! See results of trade.'
      : text;
    return (<div>{ text }</div>);
  }

  renderPlayerActions() {
    return (
      <div className='player-actions'>
        {
          range(Object.keys(ACTION_MAP).length)    // forces i to be a Number, not a string
            .filter(i => this.gameType.getActionInStage(this._getCurrentStage(), i))
            .map(i => {
              const action = ACTION_MAP[i];
              const {name, displayName} = action;
              const onClick = this[name + 'Clicked'].bind(this);
              if (this.state.secondPhaseAction === -1) {
                return <button key={i} onClick={onClick}>{displayName}</button>;
              } else {
                if (this.state.secondPhaseAction === i) {
                  return (
                    <div key={i}>
                      { this.renderSecondPhaseAction(i) }
                      <button onClick={onClick}>Confirm {displayName}</button>
                    </div>
                  )
                } else {
                  return null;   // don't display actions other than the one waiting for confirmation
                }
              }
            })
        }
        { this.state.secondPhaseAction !== -1 ? this.renderCancelAction() : null }
        <KeyHandler keyEventName="keydown" keyValue="Enter" onKeyHandle={ this.enterPressed.bind(this) } />
      </div>
    );
  }

  renderSecondPhaseAction(actionInd) {
    switch (actionInd) {
      case PASS_CARDS_INDEX:
        return (
          <div>
            Which player are you passing to?
            {
              range(this._getNumPlayers())
                .filter(i => i !== this.props.playerIndex)
                .map(i => {
                  const keyBinding = (i + 1) % 10;
                  return (
                    <div key={i}>
                      Player {i + 1} (Press { keyBinding }) &nbsp;
                      { this.state.selectedTarget === i ? <span>Selected!</span> : null }
                      <KeyHandler
                        keyEventName="keydown"
                        keyValue={ keyBinding.toString() }
                        onKeyHandle={ () => this.recordTargetSelection(i) } />
                    </div>
                  );
                })
            }
          </div>
        );
      case DRAW_CARDS_INDEX:
        return (
          <div>
            Which pile are you drawing from?
            {
              Object.keys(this.state.gameState.hands)
                // can only draw from nonempty table piles
                .filter(i => i >= DECK_INDEX && this.state.gameState.hands[i].cards.length > 0)
                .map((handInd, i) => {
                  return (<div key={ i }>
                    { this.state.gameState.hands[handInd].name } (Stack id: { handInd }) &nbsp;
                    (Press { i } to select) &nbsp;
                    { this.state.selectedTarget === handInd ? <span>Selected!</span> : null }
                    <KeyHandler
                      keyEventName="keydown"
                      keyValue={ i.toString() }
                      onKeyHandle={ () => this.recordTargetSelection(handInd) } />
                  </div>);
                })
            }
          </div>
        );
      default:
        console.log('ERROR. invalid type of action passed to renderSecondPhaseAction.');
    }
  }

  renderCancelAction() {
    return (
      <button onClick={ this.cancelActionClicked.bind(this) }>Cancel</button>
    );
  }

  renderNonPlayerHands() {
    return (
      <div>
        { this.state.gameState.hands
          ? <div className='non-player-hands'>
              { Object.keys(this.state.gameState.hands)
                .filter(i => i >= DECK_INDEX)
                .map(i => {
                  return (<div key={ i }>
                    Stack id: { i } ({ this.state.gameState.hands[i].name })
                    { this.renderHand(i) }
                  </div>);
                }) }
            </div>
          : null }
      </div>
    );
  }

  renderStageName() {
    const stageIndex = this._getCurrentStage();
    let text;
    const stageType = this.gameType.getStageType(stageIndex);
    switch (stageType) {
      case 'deal':
        text = '(Anyone can deal)';
        break;
      case 'trade':
        text = '(Everyone should move)';
        break;
      case 'buffer':
        text = '(No moves on buffer mode)';
        break;
      default:
        text = '';
    }
    return (
      <div>
        Stage {stageIndex + 1}: {this.gameType.getStage(stageIndex).name}
        <span className='turn-indicator'> {text}</span>
      </div>
    );
  }

  renderGameInPlay() {
    return (
      <div>
        { this.renderStageName() }
        { this.renderTradeConfirmed() }
        { this.shouldShowPlayerActions() ? this.renderPlayerActions() : null }
        { range(this._getNumPlayers()).map(ind =>
          this.renderPlayer(ind)
        )}
        { this.renderNonPlayerHands() }
        { this.shouldShowNextStageButton()
          ? <button onClick={ this.nextStageClicked.bind(this) }>Next stage</button>
          : null }
        { this.shouldShowEndGameButton()
          ? <button onClick={ this.endGameClicked.bind(this) }>End game</button>
          : null }
      </div>
    );
  }

  renderGameFinished() {
    return (
      <div>
        <p>Game is finished! The winner is <span className='player-name'>player { this.state.gameState.winner }!</span></p>
        <button onClick={ this.playAgainClicked.bind(this) }>Play Again!</button>
        <button onClick={ this.leaveGameClicked.bind(this) }>Back to Home</button>
      </div>
    );
  }

  render() {
    return (
      <div className='game'>
        <div className='game-id'>
          Game ID: {this.props.gameId }
        </div>
        { !this.state.gameState.started
          ? <span>Give this id to your friends so they can join your game!</span>
          : null }
        { this.shouldShowStartGameButton() ? this.renderStartGameButton() : null }
        { this.shouldShowGameInPlay() ? this.renderGameInPlay() : null }
        { this.shouldShowGameFinished() ? this.renderGameFinished() : null }
      </div>
    );
  }
}

export default Game;