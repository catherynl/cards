import React, { Component } from 'react';
import fire from '../fire';
import { range } from 'lodash';
import Deck from './Deck';
import Hand from './Hand';

class Game extends Component {

  constructor(props) {
    super(props); // playerIndex, gameId
    this.state = {
      gameState: { players: [], hands: [] },
      minPlayers: 10000  // really big number.
    };
  }

  getNumPlayers() {
    return this.state.gameState.players.length;
  }

  async componentWillMount() {
    const gamesRef = fire.database().ref('games/' + this.props.gameId);
    const currentState = await gamesRef.once('value');
    this.setState({ gameState: currentState.val() });

    gamesRef.on('child_changed', snapshot => {
      const { gameState } = this.state;
      gameState[snapshot.key] = snapshot.val();
      this.setState({ gameState });
    });

    gamesRef.on('child_added', snapshot => {
      const { gameState } = this.state;
      gameState[snapshot.key] = snapshot.val();
      this.setState({ gameState });
    });

    const gameTypeId = currentState.val().gameTypeId;
    const gameTypeSnapshot = await fire.database().ref('gameTypes/' + gameTypeId).once('value');
    this.setState({ minPlayers: gameTypeSnapshot.val().minPlayers });
  }

  shouldShowStartGameButton() {
    const minPlayersReached = (this.getNumPlayers() >= this.state.minPlayers);
    return minPlayersReached && !this.state.gameState.started;
  }

  shouldShowPlayersTurn(ind) {
    const { gameState } = this.state;
    return (gameState.started) && (ind === gameState.playerToMove);
  }

  startGameClicked() {
    const deck = new Deck();
    const hands = deck.deal(this.getNumPlayers());
    const prefix = 'games/' + this.props.gameId
    fire.database().ref(prefix + '/hands').set(hands);
    fire.database().ref(prefix + '/started').set(true);
  }

  renderStartGameButton() {
    return (
      <button onClick={ this.startGameClicked.bind(this) }>Start Game!</button>
    );
  }

  renderPlayersTurn() {
    return (
      <div>This player's turn!</div>
    );
  }

  render() {
    const { gameState } = this.state;
    return (
      <div>
        { 'Game id: ' + this.props.gameId }
        <ul>
          {
            range(this.getNumPlayers()).map(ind =>
              <li key={ ind }>
                {'Player ' + (ind + 1) + ': ' + gameState.players[ind]}
                { this.shouldShowPlayersTurn(ind) ? this.renderPlayersTurn() : null }
                <br />
                { gameState.hands
                  ? <Hand
                    cards={ gameState.hands[ind] }
                    visible={ ind === this.props.playerIndex }/>
                  : null }
              </li>
            )
          }
        </ul>
        { this.shouldShowStartGameButton() ? this.renderStartGameButton() : null }
      </div>
    );
  }
}

export default Game;