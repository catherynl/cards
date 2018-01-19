import React, { Component } from 'react';
import fire from '../fire';

import Chat from './Chat';
import SharedNotes from './SharedNotes';
import Game from './Game';
import CreateGameType from './create_game_type/CreateGameType';
import { getRandomName } from '../utils/words';

const INVALID_GAMEID_CHARS = [".", "#", "$", "[", "]"];

class App extends Component {

  constructor(props) {
    super(props);
    this.state = {
      username: getRandomName(),
      playerIndex: 0,
      gameId: 0,
      creatingGame: false,
      availableGameTypes: [],  // array of objects (with name, id fields)
    };
    this.game = 
  }

  async componentWillMount() {
    window.addEventListener('keydown', function(e) {
      if(e.keyCode === 32 && e.target === document.body) {
        e.preventDefault();
      }
    });

    const gameTypesRef = fire.database().ref('gameTypes');
    gameTypesRef.on('child_added', snapshot => {
      const { availableGameTypes } = this.state;
      availableGameTypes.push({ name: snapshot.val().name, id: snapshot.key });
      this.setState({ availableGameTypes });
    });
  }

  clearGameID() {
    this.setState({ gameId: 0 });
  }

  changeUsername(e) {
    e.preventDefault();
    this.setState({ username: this.inputUsername.value });
    this.inputUsername.placeholder = this.inputUsername.value;
    this.inputUsername.value = '';
  }

  newGameClicked(gameTypeId) {
    const game = {
      finished: false,
      gameTypeId: gameTypeId,
      players: [this.state.username],
      playersToMove: [true],
      started: false,
      currentStage: 0,
      winner: 0
    };
    const gameRef = fire.database().ref('games').push(game);
    fire.database().ref('sharedNotes/' + gameRef.key).set({ text: '', playerLock: -1 });
    this.setState({ gameId: gameRef.key });
  }

  async enterGameClicked(e) {
    e.preventDefault();
    const gameId = this.inputGameId.value;
    if (!gameId || INVALID_GAMEID_CHARS.some((char) => gameId.indexOf(char) !== -1)) {
      window.alert('Invalid game id');
      return;
    }

    const firePrefix = 'games/' + gameId;
    const snapshot = await fire.database().ref(firePrefix).once('value');
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

    fire.database().ref(firePrefix + '/players/' + numPlayers).set(this.state.username);
    fire.database().ref(firePrefix + '/recentlyPlayed/' + numPlayers).set(0);
    fire.database().ref(firePrefix + '/playersToMove/' + numPlayers).set(false);
    fire.database().ref(firePrefix + '/hands/' + numPlayers).set(0);

    const updatedPlayers = await fire.database().ref(firePrefix + '/players/' + numPlayers).once('value');
    if (updatedPlayers.val() === this.state.username) {
      this.setState({ gameId: gameId, playerIndex: numPlayers });
    } else {
      window.alert('Race condition! Please try again :)');
    }
  }

  newTypeClicked() {
    this.setState({ creatingGame: true });
  }

  doneCreatingType() {
    this.setState({ creatingGame: false });
  }

  renderChangeUsername() {
    return (
      <form onSubmit={ this.changeUsername.bind(this) }>
        <input type="text" ref={ el => this.inputUsername = el } placeholder={ this.state.username } />
        <input type="submit" className="button" value="Change username"/>
      </form>
    );
  }

  renderNewGame() {
    return (
      <div>
        Start new game of game type below:
        <ul className='game-types-ul'>
        {
          this.state.availableGameTypes.map(
            (gameType, ind) => {
              return (
                <li key={ ind }>
                  <button onClick={ () => this.newGameClicked(gameType.id) }>{ gameType.name }</button>
                </li>
              );}
          )
        }
        </ul>
      </div>
    );
  }

  renderEnterGame() {
    return (
      <form onSubmit={ this.enterGameClicked.bind(this) }>
        <input type="text" ref={ el => this.inputGameId = el } placeholder={ 'game id' } />
        <input type="submit" className="button" value="Enter game"/>
      </form>
    );
  }

  renderGame() {
    return (<Game playerIndex={ this.state.playerIndex } gameId={ this.state.gameId } leaveGame={ this.clearGameID.bind(this) } />);
  }

  renderGoToGame() {
    return (
      <div>
        { this.renderEnterGame() }
        { this.renderNewGame() }
      </div>
    );
  }

  renderCreateGame() {
    return (
      <div className='create-game-type'>
        <CreateGameType backToHome={ this.doneCreatingType.bind(this) } />
      </div>
    );
  }

  renderSharedNotes() {
    return (
      <SharedNotes gameId={ this.state.gameId } playerIndex={ this.state.playerIndex } />
    );
  }

  renderHome() {
    return (
      <div>
        Hello <span className='username'>{ this.state.username }</span>!
        Welcome to Cards, V&C's website for playing arbitrary card games :)
        <br />
        { this.renderChangeUsername() }
        { this.renderGoToGame() }
        Or create your own game!
        <br />
        <button onClick={ this.newTypeClicked.bind(this) }>New game type</button>
      </div>
    );
  }

  render() {
    return (
      <div className='page'>
        <div className='game-section'>
          { this.state.gameId 
            ? this.renderGame()
            : this.state.creatingGame
            ? this.renderCreateGame()
            : this.renderHome()
          }
        </div>
        <div className='chat-section'>
          <Chat username={ this.state.username } gameId={ this.state.gameId } />
          { this.state.gameId ? this.renderSharedNotes() : null }
          <br />
        </div>
      </div>
    );
  }
}

export default App;