import React, { Component } from 'react';
import fire from '../fire';
import { range } from 'lodash';

import Deck from './Deck';
import Hand from './Hand';
import GameType from '../utils/GameType';
import { actionMap } from '../utils/stage';

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
        recentlyPlayed: [],
        tradeConfirmed: [],
      },
      cardsSelected: [],  // booleans, one for each card in this player's hand
      minPlayers: 10000,  // prevents "Start Game" from being shown too early
    };
    this.gameType = 0;
  }

  _getFirePrefix() {
    return 'games/' + this.props.gameId;
  }

  _getNumPlayers() {
    return this.state.gameState.players.length;
  }

  _getCurrentStage() {
    return this.state.gameState.currentStage;
  }

  async componentWillMount() {
    const gamesRef = fire.database().ref(this._getFirePrefix());
    const currentState = await gamesRef.once('value');
    const newGameState = Object.assign(this.state.gameState, currentState.val());
    this.setState({ gameState: newGameState });

    const gameTypeRef = fire.database().ref('gameTypes/' + newGameState.gameTypeId);
    const gameType = await gameTypeRef.once('value');
    this.gameType = new GameType(gameType.val());
    this.setState({ minPlayers: this.gameType.getMinPlayers() });

    const listenerCallback = snapshot => {
      const { gameState } = this.state;
      gameState[snapshot.key] = snapshot.val();
      this.setState({ gameState });

      if (snapshot.key === 'tradeConfirmed') {
        const tradeConfirmed = snapshot.val();
        if (this._getNumPlayers() === tradeConfirmed.filter(i => i).length) {
          this.enterNextStage();
        }
      }
    };
    const removalListenerCallback = snapshot => {
      if (snapshot.key === 'hands') {
        const { gameState } = this.state;
        gameState['hands'] = {};
        this.setState({ gameState });
      } else if (snapshot.key === 'recentlyPlayed') {
        const { gameState } = this.state;
        gameState['recentlyPlayed'] = [];
        this.setState({ gameState });
      } else {
        window.alert('WARNING: a field other than "hands" or "recentlyPlayed" has been ' +
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
    return this.props.playerIndex === this.state.gameState.playerToMove;
  }

  enterNextStage() {
    const nextStage = this._getCurrentStage() + 1;
    fire.database().ref(this._getFirePrefix() + '/currentStage').set(nextStage);
  }

  shouldShowStartGameButton() {
    const minPlayersReached = (this._getNumPlayers() >= this.state.minPlayers);
    return minPlayersReached && !this.state.gameState.started;
  }

  shouldShowPlayerActions() {
    return this.isYourTurn();
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

  startGameClicked() {
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
    fire.database().ref(this._getFirePrefix() + '/recentlyPlayed/' + this.props.playerIndex).set(cardsSelected);
    const remainingHand = myHand.filter((el, ind) => !this.state.cardsSelected[ind]);
    this.setState({ cardsSelected: Array(remainingHand.length).fill(false) });
    fire.database().ref(this._getFirePrefix() + '/hands/' + this.props.playerIndex + '/cards')
      .set(remainingHand);
  }

  drawCardsClicked() {
    return;
  }

  passCardsClicked() {
    return;
  }

  endTurnClicked() {
    const newPlayerToMove = (this.state.gameState.playerToMove + 1) % this._getNumPlayers();
    fire.database().ref(this._getFirePrefix() + '/playerToMove').set(newPlayerToMove);
  }

  confirmTradeClicked() {
    fire.database().ref(this._getFirePrefix() + '/tradeConfirmed/' + this.props.playerIndex).set(true);
  }

  dealCardsClicked() {
    const deck = new Deck({ cards: this.gameType.getDeck() });
    const hands = deck.deal(
      this._getNumPlayers(),
      this.gameType.getDealCountPerPlayerInStage(this._getCurrentStage()),
      this.gameType.getHandleRemainingInStage(this._getCurrentStage()));
    Object.keys(hands).forEach(i => this.gameType.sortHand(hands[i].cards));
    const numCardsInMyHand = hands[this.props.playerIndex].cards.length;
    this.setState({ cardsSelected: Array(numCardsInMyHand).fill(false) });
    fire.database().ref(this._getFirePrefix() + '/hands').set(hands);
    this.enterNextStage();
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
      recentlyPlayed: [],
      playerToMove: 0
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
        <button onClick={ this.startGameClicked.bind(this) }>Start Game!</button>
      </div>
    );
  }

  renderPlayersTurnIndicator() {
    const text = this.isYourTurn() ? '(Your turn)' : '(This player\'s turn)';
    return <span className='your-turn'>{ text }</span>;
  }

  renderPlayer(ind) {
    const { gameState } = this.state;
    return (
      <div className='player' key={ ind }>
        <div className='player-name'>
          {'Player ' + (ind + 1) + ': ' + gameState.players[ind]}
          &nbsp;
          { ind === this.state.gameState.playerToMove
            ? this.renderPlayersTurnIndicator()
            : null }
        </div>
        { gameState.hands ? this.renderHand(ind) : null }
        Recently played
        <br />
        { gameState.recentlyPlayed[ind]
          ? <Hand
            cards={ gameState.recentlyPlayed[ind] }
            isYours={ false }
            visible={ true } />
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
    return (
      <Hand
        key={ playerInd }
        cards={ cards ? cards : [] }
        isYours={ playerInd === this.props.playerIndex }
        visible={ hand.visibility[this.props.playerIndex] }
        onSelect={ this.onCardSelected.bind(this) }
        onPlayCards={ this.playCardsClicked.bind(this) }
        cardsSelected={ this.state.cardsSelected }
      />
    );
  }

  renderPlayerActions() {
    return (
      <div className='player-actions'>
        {
          Object.keys(actionMap)
            .filter(i => this.gameType.getActionInStage(this._getCurrentStage(), i))
            .map(i => {
              const action = actionMap[i];
              const {name, displayName} = action;
              const onClick = this[name + 'Clicked'].bind(this);
              return <button key={i} onClick={onClick}>{displayName}</button>;
            })
        }
      </div>
    );
  }

  renderNonPlayerHands() {
    return (
      <div>
        { this.state.gameState.hands
          ? <div className='non-player-hands'>
              { Object.keys(this.state.gameState.hands)
                .filter(i => i >= 20) // TODO magic number
                .map(i => this.renderHand(i)) }
            </div>
          : null }
      </div>
    );
  }

  renderStageName() {
    const stageIndex = this._getCurrentStage();
    return (
      <div>Stage {stageIndex + 1}: {this.gameType.getStage(stageIndex).name}</div>
    );
  }

  renderGameInPlay() {
    return (
      <div>
        { this.renderStageName() }
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