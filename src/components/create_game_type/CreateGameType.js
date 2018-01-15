import React, { Component } from 'react';
import fire from '../../fire';

import CreateDeck from './CreateDeck';

class CreateGameType extends Component {

  constructor(props) {
    super(props);  // backToHome (callback)
    this.state = {
      gameTypeId: 'test_hearts',
      stage: 0   // 0: createDeck, 1: finished
    };
  }

  _getFirePrefix() {
    return 'gameTypes/' + this.state.gameTypeId;
  }

  setDeck(deck) {
    this.deck = deck;
    const { stage } = this.state;
    this.setState({ stage: stage + 1 });
  }

  submitClicked() {
    fire.database().ref(this._getFirePrefix() + '/deck').set(this.deck);
    window.alert('submitted to database!');
    this.props.backToHome();
  }

  cancelClicked() {
    this.props.backToHome();
  }

  renderCreateDeck() {
    return (
      <CreateDeck onFinish={ this.setDeck.bind(this) } />
    );
  }

  renderSubmit() {
    return (
      <div>
        Created a deck containing { this.deck.length } cards!
        <br />
        <button onClick={ this.submitClicked.bind(this) }>Submit Game Type</button>
      </div>
    );
  }

  renderCreateInterface() {
    switch (this.state.stage) {
      case 0:
        return this.renderCreateDeck();
      case 1:
        return this.renderSubmit();
      default:
        console.log('ERROR. invalid create game stage:', this.state.stage);
    }
  }

  render() {
    return (
      <div>
        <p>Let's create a new type of game...</p>
        { this.renderCreateInterface() }
        <button onClick={ this.cancelClicked.bind(this) }>Cancel</button>
      </div>
    );
  }
}

export default CreateGameType;