import React, { Component } from 'react';
import fire from '../fire';
import { range } from 'lodash';

class Game extends Component {

  constructor(props) {
    super(props); // playerIndex, gameId
    this.state = {
      gameState: { players: [] },
      isPlayersTurn: false
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
    })
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
      </div>
    );
  }
}

export default Game;