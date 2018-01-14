import React, { Component } from 'react';
import fire from '../fire';
import Chat from './Chat';
import Game from './Game';

class App extends Component {

  constructor(props) {
    super(props);
    this.state = {
      username: 'anonymous monkey',
      playerIndex: 0,
      gameId: 0,
    };
  }

  componentWillMount() {
  }

  changeUsername(e) {
    e.preventDefault();
    this.setState({ username: this.inputUsername.value });
    this.inputUsername.placeholder = this.inputUsername.value;
    this.inputUsername.value = '';
  }

  newGameClicked() {
    const game = {
      gameTypeId: '-L2lZUVmmtuzjlQW0xMx',
      players: [this.state.username],
      started: false,
      playerToMove: 0,
      hands: 0,
      table: 0
    };
    const gameRef = fire.database().ref('games').push(game);
    this.setState({ gameId: gameRef.key });
  }

  async enterGameClicked() {
    const gameId = this.inputGameId.value;
    if (!gameId) {
      window.alert('Invalid game id');
      return;
    }
    const snapshot = await fire.database().ref('games/' + gameId).once('value');
    const game = snapshot.val();
    if (!game) {
      window.alert('Invalid game id');
      return;
    }
    const gameTypeSnapshot = await fire.database().ref('gameTypes/' + game.gameTypeId).once('value');
    const maxPlayers = gameTypeSnapshot.val().maxPlayers;

    const numPlayers = game.players.length;
    if (game.started || maxPlayers <= numPlayers) {
      window.alert('Sorry, you cannot join the game right now');
      return;
    }

    fire.database().ref('games/' + gameId + '/players/' + numPlayers).set(this.state.username);
    const updatedPlayers = await fire.database().ref('games/' + gameId + '/players/' + numPlayers).once('value');
    if (updatedPlayers.val() === this.state.username) {
      this.setState({ gameId: gameId, playerIndex: numPlayers });
    } else {
      window.alert('Race condition! Please try again :)');
    }
  }

  renderChangeUsername() {
    return (
      <form onSubmit={ this.changeUsername.bind(this) }>
        <input type="text" ref={ el => this.inputUsername = el } placeholder={ this.state.username } />
        <input type="submit" value="Change username"/>
      </form>
    );
  }

  renderNewGame() {
    return (
      <button onClick={ this.newGameClicked.bind(this) }>New game</button>
    );
  }

  renderEnterGame() {
    return (
      <div>
        <input type="text" ref={ el => this.inputGameId = el } placeholder={ 'game id' } />
        <button onClick={ this.enterGameClicked.bind(this) }>Enter game</button>
      </div>
    );
  }

  renderGame() {
    return (<Game playerIndex={ this.state.playerIndex } gameId={ this.state.gameId } />);
  }

  renderGoToGame() {
    return (
      <div>
        { this.renderNewGame() }
        { this.renderEnterGame() }
      </div>
    );
  }

  render() {
    return (
      <div>
        { this.renderChangeUsername() }
        { this.state.gameId 
          ? this.renderGame()
          : this.renderGoToGame() }
        <Chat username={ this.state.username } />
        <br />
      </div>
    );
  }
}

export default App;