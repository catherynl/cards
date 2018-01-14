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
      minPlayers: 10000  // really big number
    };
    this.firePrefix = 'games/' + this.props.gameId;
  }

  getNumPlayers() {
    return this.state.gameState.players.length;
  }

  async componentWillMount() {
    const { gameState } = this.state;
    const gamesRef = fire.database().ref(this.firePrefix);
    const currentState = await gamesRef.once('value');
    this.setState({ gameState: currentState.val() });

    gamesRef.on('child_changed', snapshot => {
      gameState[snapshot.key] = snapshot.val();
      this.setState({ gameState });
    });

    gamesRef.on('child_added', snapshot => {
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
    fire.database().ref(this.firePrefix + '/hands').set(hands);
    fire.database().ref(this.firePrefix + '/started').set(true);
  }

  playCardsClicked() {
    const newPlayerToMove = (this.state.gameState.playerToMove + 1) % this.getNumPlayers();
    fire.database().ref(this.firePrefix + '/playerToMove').set(newPlayerToMove);
  }

  renderStartGameButton() {
    return (
      <button onClick={ this.startGameClicked.bind(this) }>Start Game!</button>
    );
  }

  renderPlayersTurn() {
    return (
      <div>
        { this.props.playerIndex === this.state.gameState.playerToMove
          ? <div>Your turn!
              <button onClick={ this.playCardsClicked.bind(this) }>Play turn</button>
            </div>
          : <div>This player's turn!</div> }
      </div>
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