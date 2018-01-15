import React, { Component } from 'react';
import fire from '../fire';
import { range } from 'lodash';

import Deck from './Deck';
import Hand from './Hand';

class Game extends Component {

  constructor(props) {
    super(props); // playerIndex, gameId, leaveGame (callback)
    this.state = {
      gameState: {
        started: false,
        finished: false,
        hands: [],
        players: [],
        recentlyPlayed: [] },
      cardsSelected: [],  // booleans, one for each card in this player's hand
      minPlayers: 10000  // really big number
    };
  }

  _getFirePrefix() {
    return 'games/' + this.props.gameId;
  }

  _getNumPlayers() {
    return this.state.gameState.players.length;
  }

  async componentWillMount() {
    const gamesRef = fire.database().ref(this._getFirePrefix());
    const currentState = await gamesRef.once('value');
    const newGameState = Object.assign(this.state.gameState, currentState.val());
    this.setState({ gameState: newGameState });

    const listenerCallback = snapshot => {
      const { gameState } = this.state;
      gameState[snapshot.key] = snapshot.val();
      this.setState({ gameState });
    };
    const removalListenerCallback = snapshot => {
      if (snapshot.key === 'hands') {
        const { gameState } = this.state;
        gameState.hands = gameState.hands.map((el) => []);
        this.setState({ gameState });
      } else {
        console.log('WARNING: a field other than "hands" has been removed from the game state database:', snapshot.key);
        window.alert('WARNING: a field other than "hands" has been removed from the game state database:', snapshot.key);
      }
    };

    gamesRef.on('child_changed', listenerCallback);
    gamesRef.on('child_added', listenerCallback);
    gamesRef.on('child_removed', removalListenerCallback);

    const gameTypeId = currentState.val().gameTypeId;
    const gameTypeSnapshot = await fire.database().ref('gameTypes/' + gameTypeId).once('value');
    this.setState({ minPlayers: gameTypeSnapshot.val().minPlayers });
  }

  onCardSelected(cardIndex) {
    let { cardsSelected } = this.state;
    cardsSelected[cardIndex] = !(cardsSelected[cardIndex]);
    this.setState({ cardsSelected });
  }

  shouldShowStartGameButton() {
    const minPlayersReached = (this._getNumPlayers() >= this.state.minPlayers);
    return minPlayersReached && !this.state.gameState.started;
  }

  shouldShowPlayersTurn(ind) {
    const { gameState } = this.state;
    return (gameState.started) && (ind === gameState.playerToMove);
  }

  shouldShowGameInPlay() {
    return this.state.gameState.started && !this.state.gameState.finished;
  }

  shouldShowGameFinished() {
    return this.state.gameState.finished;
  }

  shouldShowEndGameButton() {
    return true; // TODO game logic
  }

  startGameClicked() {
    const deck = new Deck();
    const hands = deck.deal(this._getNumPlayers());
    const numCardsInMyHand = hands[this.props.playerIndex].length;
    this.setState({ cardsSelected: Array(numCardsInMyHand).fill(false) });
    fire.database().ref(this._getFirePrefix() + '/hands').set(hands);
    fire.database().ref(this._getFirePrefix() + '/started').set(true);
  }

  playCardsClicked() {
    const myHand = this.state.gameState.hands[this.props.playerIndex];
    const cardsSelected = myHand.filter((el, ind) => this.state.cardsSelected[ind]);
    if (cardsSelected.length === 0) {
      window.alert('must select at least one card to play.');
      return;
    }
    fire.database().ref(this._getFirePrefix() + '/recentlyPlayed/' + this.props.playerIndex).set(cardsSelected);
    const remainingHand = myHand.filter((el, ind) => !this.state.cardsSelected[ind]);
    this.setState({ cardsSelected: Array(remainingHand.length).fill(false) });
    fire.database().ref(this._getFirePrefix() + '/hands/' + this.props.playerIndex).set(remainingHand);
    const newPlayerToMove = (this.state.gameState.playerToMove + 1) % this._getNumPlayers();
    fire.database().ref(this._getFirePrefix() + '/playerToMove').set(newPlayerToMove);
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

  renderPlayersHand(playerInd) {
    const { gameState } = this.state;
    if (playerInd === this.props.playerIndex) {
      return (
        <Hand
          cards={ gameState.hands[playerInd] ? gameState.hands[playerInd] : [] }
          isYours={ true }
          visible={ true }
          onSelect={ this.onCardSelected.bind(this) }
          onPlayCards= { this.playCardsClicked.bind(this) }
          cardsSelected={ this.state.cardsSelected }
        />);
    } else {
      return (
        <Hand
          cards={ gameState.hands[playerInd] ? gameState.hands[playerInd] : [] }
          isYours={ false }
          visible={ false }
        />);
    }
  }

  renderPlayersTurn() {
    return (
      <div>
        { this.props.playerIndex === this.state.gameState.playerToMove
          ? <div>
              Your turn!
              <br />
              <button onClick={ this.playCardsClicked.bind(this) }>Play card</button>
            </div>
          : <div>This player's turn!</div> }
      </div>
    );
  }

  renderGameInPlay() {
    const { gameState } = this.state;
    return (
      <div>
        { range(this._getNumPlayers()).map(ind =>
          <div className='player'>
            {'Player ' + (ind + 1) + ': ' + gameState.players[ind]}
            { this.shouldShowPlayersTurn(ind) ? this.renderPlayersTurn() : null }
            <br />
            { gameState.hands ? this.renderPlayersHand(ind) : null }
            <br />Recently played<br />
            { gameState.recentlyPlayed[ind]
              ? <Hand
                cards={ gameState.recentlyPlayed[ind] }
                isYours={ false }
                visible={ true } />
              : null }
          </div>
        )}
        { this.shouldShowEndGameButton()
          ? <button onClick={ this.endGameClicked.bind(this) }>End game</button>
          : null }
      </div>
    );
  }

  renderGameFinished() {
    return (
      <div>
        <p>Game is finished! The winner is player { this.state.gameState.winner }!</p>
        <button onClick={ this.leaveGameClicked.bind(this) }>Back to Home</button>
      </div>
    );
  }

  render() {
    return (
      <div class='game'>
        <div class='game-id'>
          { 'Game id: ' + this.props.gameId }
        </div>
        { this.shouldShowStartGameButton() ? this.renderStartGameButton() : null }
        { this.shouldShowGameInPlay() ? this.renderGameInPlay() : null }
        { this.shouldShowGameFinished() ? this.renderGameFinished() : null }
      </div>
    );
  }
}

export default Game;