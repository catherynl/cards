import React, { Component } from 'react';
import fire from '../fire';
import { range } from 'lodash';
import Deck from './Deck';
import Hand from './Hand';

class Game extends Component {

  constructor(props) {
    super(props); // playerIndex, gameId
    this.state = {
      gameState: {
        hands: [],
        players: [],
        recentlyPlayed: [] },
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
    const { gameState } = this.state;
    const gamesRef = fire.database().ref(this._getFirePrefix());
    const currentState = await gamesRef.once('value');
    this.setState({ gameState: currentState.val() });

    const listenerCallback = snapshot => {
      const { gameState } = this.state;
      gameState[snapshot.key] = snapshot.val();
      this.setState({ gameState });
    };

    gamesRef.on('child_changed', listenerCallback);
    gamesRef.on('child_added', listenerCallback);

    const gameTypeId = currentState.val().gameTypeId;
    const gameTypeSnapshot = await fire.database().ref('gameTypes/' + gameTypeId).once('value');
    this.setState({ minPlayers: gameTypeSnapshot.val().minPlayers });
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
    fire.database().ref(this._getFirePrefix() + '/hands').set(hands);
    fire.database().ref(this._getFirePrefix() + '/started').set(true);
  }

  playCardsClicked() {
    const hands = this.state.gameState.hands;
    const indexSelected = Math.floor(Math.random() * hands[this.props.playerIndex].length);
    const cardsSelected = hands[this.props.playerIndex].splice(indexSelected, 1);
    fire.database().ref(this._getFirePrefix() + '/recentlyPlayed/' + this.props.playerIndex).set(cardsSelected);
    const newPlayerToMove = (this.state.gameState.playerToMove + 1) % this._getNumPlayers();
    fire.database().ref(this._getFirePrefix() + '/playerToMove').set(newPlayerToMove);
  }

  endGameClicked() {
    const winner = Math.floor(Math.random() * this._getNumPlayers()) + 1;
    fire.database().ref(this._getFirePrefix() + '/winner').set(winner);
    fire.database().ref(this._getFirePrefix() + '/finished').set(true);
  }

  renderStartGameButton() {
    return (
      <div>
        <button onClick={ this.startGameClicked.bind(this) }>Start Game!</button>
      </div>
    );
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
        <ul>
          { range(this._getNumPlayers()).map(ind =>
            <li key={ ind }>
              {'Player ' + (ind + 1) + ': ' + gameState.players[ind]}
              { this.shouldShowPlayersTurn(ind) ? this.renderPlayersTurn() : null }
              <br />
              { gameState.hands
                ? <Hand
                  cards={ gameState.hands[ind] }
                  visible={ ind === this.props.playerIndex } />
                : null }
              <br />Recently played<br />
              { gameState.recentlyPlayed
                ? <Hand
                  cards={ gameState.recentlyPlayed[ind] }
                  visible={true} />
                : null }
            </li>
          )}
        </ul>
        { this.shouldShowEndGameButton()
          ? <button onClick={ this.endGameClicked.bind(this) }>End game</button>
          : null }
      </div>
    );
  }

  renderGameFinished() {
    return (
      <div>
        Game is finished! The winner is player { this.state.gameState.winner }!
      </div>
    );
  }

  render() {
    return (
      <div>
        { 'Game id: ' + this.props.gameId }
        { this.shouldShowStartGameButton() ? this.renderStartGameButton() : null }
        { this.shouldShowGameInPlay() ? this.renderGameInPlay() : null }
        { this.shouldShowGameFinished() ? this.renderGameFinished() : null }
      </div>
    );
  }
}

export default Game;