import React, { Component } from 'react';
import fire from '../fire';
import Chat from './Chat';
import Game from './Game';

class App extends Component {

  constructor(props) {
    super(props);
    this.state = {
      username: 'anonymous monkey',
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
    
  }

  renderChangeUsername() {
    return (
      <form onSubmit={this.changeUsername.bind(this)}>
        <input type="text" ref={ el => this.inputUsername = el } placeholder={ this.state.username } />
        <input type="submit" value="Change username"/>
      </form>
    );
  }

  renderNewGame() {
    return (
      <button onClick={this.newGameClicked}>New game</button>
    );
  }

  renderEnterGame() {
    return (
      <form onSubmit={this.enterGameClicked}>
        <input type="text" ref={ el => this.inputGameId = el } placeholder={ 'game id' } />
        <input type="submit" value="Enter game"/>
      </form>
    );
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
          ? <Game username={this.state.username} gameId={this.state.gameId} />
          : this.renderGoToGame() }
        <Chat username={this.state.username} />
      </div>
    );
  }
}

export default App;