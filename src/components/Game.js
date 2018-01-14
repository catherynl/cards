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
      isPlayersTurn: false,
      minPlayers: 10000  // really big number.
    };
  }

  getNumPlayers() {
    return this.state.gameState.players.length;
  }

  async componentWillMount() {
    let gamesRef = fire.database().ref('games/' + this.props.gameId);
    const currentState = await gamesRef.once('value');
    this.setState({ gameState: currentState.val() });

    gamesRef.on('child_changed', snapshot => {
      let gameState = this.state.gameState;
      gameState[snapshot.key] = snapshot.val();
      this.setState({ gameState });
    });

    gamesRef.on('child_added', snapshot => {
      let gameState = this.state.gameState;
      gameState[snapshot.key] = snapshot.val();
      this.setState({ gameState });
    });

    const gameTypeId = currentState.val().gameTypeId;
    const gameTypeSnapshot = await fire.database().ref('gameTypes/' + gameTypeId).once('value');
    this.setState({ minPlayers: gameTypeSnapshot.val().minPlayers });
  }

  shouldRenderStartGameButton() {
    const minPlayersReached = (this.getNumPlayers() >= this.state.minPlayers);
    return minPlayersReached && !this.state.gameState.started;
  }

  startGameClicked() {
    const deck = new Deck();
    const hands = deck.deal(this.getNumPlayers());
    fire.database().ref('games/' + this.props.gameId + '/hands').set(hands);
    fire.database().ref('games/' + this.props.gameId + '/started').set(true);
  }

  renderStartGameButton() {
    return (
      <button onClick={ this.startGameClicked.bind(this) }>Start Game!</button>
    );
  }

  render() {
    const { gameState } = this.state;
    return (
      <div>
        { 'Game id: ' + this.props.gameId }
        <ul>
          {
            range(this.getNumPlayers()).map(
              ind =>
                <li key={ ind }>
                  {'Player ' + (ind + 1) + ': ' + gameState.players[ind]}
                  <br />
                  { gameState.hands ? <Hand cards={ gameState.hands[ind] }/> : null }
                </li>
            )
          }
        </ul>
        { this.shouldRenderStartGameButton() ? this.renderStartGameButton() : null }
      </div>
    );
  }
}

export default Game;