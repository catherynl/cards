import React, { Component } from 'react';

class CreateGameBasics extends Component {

  // props:
  // onFinish (callback, takes three arguments: name, minPlayers, maxPlayers)

  finishClicked() {
    const name = this.inputName.value;
    if (name === '') {
      window.alert('give your game a name!');
      return;
    }
    const minPlayers = parseInt(this.inputMinPlayers.value, 10);
    if (Number.isNaN(minPlayers) || minPlayers > 99) {
      window.alert('invalid value for minPlayers: ' + this.inputMinPlayers.value);
      return;
    }
    const maxPlayers = parseInt(this.inputMaxPlayers.value, 10);
    if (Number.isNaN(maxPlayers) || maxPlayers < 1) {
      window.alert('invalid value for maxPlayers: ' + this.inputMaxPlayers.value);
      return;
    }
    if (maxPlayers < minPlayers) {
      window.alert('maxPlayers cannot be less than minPlayers');
      return;
    }
    this.props.onFinish(name, minPlayers, maxPlayers);
  }

  render() {
    return (
      <div>
        First, let's get the basics.
        <br />
        Game name: <input type="text" ref={ el => this.inputName = el } />
        <br />
        Minimum players supported: <input type="text" ref={ el => this.inputMinPlayers = el } />
        <br />
        Maximum players supported: <input type="text" ref={ el => this.inputMaxPlayers = el } />
        <br />
        <button onClick={ this.finishClicked.bind(this) }>Next</button>
      </div>
    );
  }
}

export default CreateGameBasics;