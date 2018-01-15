import React, { Component } from 'react';
import fire from '../../fire';

import CreateDeck from './CreateDeck';

class CreateGameType extends Component {

  constructor(props) {
    super(props);
    this.state = {
      gameTypeId: '-L2lZUVmmtuzjlQW0xMx'
    };
    this.createDeck = new CreateDeck();
  }

  _getFirePrefix() {
    return 'gameTypes/' + this.state.gameTypeId;
  }

  submitClicked() {
    fire.database().ref(this._getFirePrefix() + '/deck').set(this.createDeck.getCards());
    window.alert('submitted to database!');
  }

  render() {
    return (
      <div>
        { this.createDeck.render() }
        <button onClick={ this.submitClicked.bind(this) }>Submit Game Type</button>
      </div>
    );
  }
}

export default CreateGameType;