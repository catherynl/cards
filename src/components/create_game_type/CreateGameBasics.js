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
    const minPlayers = parseInt(this.inputMinPlayers.value === '' ? 1 : this.inputMinPlayers.value, 10);
    if (Number.isNaN(minPlayers) || minPlayers > 99) {
      window.alert('invalid value for minPlayers: ' + this.inputMinPlayers.value);
      return;
    }
    const maxPlayers = parseInt(this.inputMaxPlayers.value === '' ? 20 : this.inputMaxPlayers.value, 10);
    if (Number.isNaN(maxPlayers) || maxPlayers < 1) {
      window.alert('invalid value for maxPlayers: ' + this.inputMaxPlayers.value);
      return;
    }
    if (maxPlayers > 20) {
      window.alert('max players cannot exceed 20');
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
        Minimum players supported: &nbsp;
        <input type="text" ref={ el => this.inputMinPlayers = el } placeholder="1" />
        <br />
        Maximum players supported: &nbsp;
        <input type="text" ref={ el => this.inputMaxPlayers = el } placeholder="20" />
        <br />
        <button onClick={ this.finishClicked.bind(this) }>Next</button>
      </div>
    );
  }
}

export default CreateGameBasics;