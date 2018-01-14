import React, { Component } from 'react';
import fire from '../fire';
import { range } from 'lodash';

class Game extends Component {

  constructor(props) {
    super(props); // playerIndex, gameId
    this.state = {
      gameState: { players: [] },
      isPlayersTurn: false,
      minPlayers: 10000  // really big number.
    };
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

    const gameTypeId = currentState.val().gameTypeId;
    const gameTypeSnapshot = await fire.database().ref('gameTypes/' + gameTypeId).once('value');
    this.setState({ minPlayers: gameTypeSnapshot.val().minPlayers });
  }

  shouldRenderStartGameButton() {
    const minPlayersReached = (this.state.gameState.players.length >= this.state.minPlayers);
    return minPlayersReached && !this.state.gameState.started;
  }

  startGameClicked() {
    // TODO: shuffle deck and populate hands
    fire.database().ref('games/' + this.props.gameId + '/started').set(true);
  }

  renderStartGameButton() {
    return (
      <button onClick={ this.startGameClicked.bind(this) }>Start Game!</button>
    );
  }

  render() {
    return (
      <div>
        { 'Game id: ' + this.props.gameId }
        <ul>
          {
            range(this.state.gameState.players.length).map(
              ind =>
                <li key={ ind }>
                  {'Player ' + (ind + 1) + ': ' + this.state.gameState.players[ind]}
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