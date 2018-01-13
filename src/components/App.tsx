import * as React from 'react';
import './App.css';

const logo = require('../logo.svg');

class App extends React.Component {

  handleStartGame() {
    console.log('hi');
  }

  render() {
    return (
      <div className="App">
        <div className="App-header">
          <img src={logo} className="App-logo" alt="logo" />
          <h2>Welcome to React</h2>
        </div>
        <p className="App-intro">
          Start a new card game!
          <button onClick={this.handleStartGame}>Start game</button>
        </p>
      </div>
    );
  }
}

export default App;
