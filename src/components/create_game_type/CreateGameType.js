import React, { Component } from 'react';
import fire from '../../fire';

import CreateGameBasics from './CreateGameBasics';
import CreateDeck from './CreateDeck';
import CreateStages from './CreateStages';
import CreateAdditionalPiles from './CreateAdditionalPiles';

class CreateGameType extends Component {

  constructor(props) {
    super(props);  // backToHome (callback)
    this.state = {
      stage: 0,   // 0: basics (name and players), 1: createDeck, 2: createStages, 3: additionalPiles, 4: finished

      // props for CreateDeck
      rankOrder: 'A-high',
      handSortOrder: 'suitFirst'
    };
    // other fields: name, minPlayers, maxPlayers, deck, stages, additionalHands
  }

  rankOrderChanged(e) {
    this.setState({ rankOrder: e.target.value });
  }

  handSortOrderChanged(e) {
    this.setState({ handSortOrder: e.target.value });
  }

  _incrementStage() {
    const { stage } = this.state;
    this.setState({ stage: stage + 1 });
  }

  setBasics(name, minPlayers, maxPlayers) {
    this.name = name;
    this.minPlayers = minPlayers;
    this.maxPlayers = maxPlayers;
    this._incrementStage();
  }

  setDeck(deck) {
    this.deck = deck;
    this._incrementStage();
  }

  setStages(stages) {
    this.stages = stages;
    this._incrementStage();
  }

  setAdditionalHands(additionalHands) {
    this.additionalHands = additionalHands;
    this._incrementStage();
  }

  submitClicked() {
    const gameType = { name: this.name,
                       minPlayers: this.minPlayers,
                       maxPlayers: this.maxPlayers,
                       deck: this.deck,
                       rankOrder: this.state.rankOrder,
                       handSortOrder: this.state.handSortOrder,
                       stages: this.stages
                     };
    const gameTypeRef = fire.database().ref('/gameTypes').push(gameType);
    window.alert('Submitted "' + this.name + ' (' + gameTypeRef.key + ')" to database!');
    this.props.backToHome();
  }

  cancelClicked() {
    this.props.backToHome();
  }

  renderCreateBasics() {
    return (
      <CreateGameBasics onFinish={ this.setBasics.bind(this) } />
    );
  }

  renderCreateDeck() {
    return (
      <CreateDeck
        onFinish={ this.setDeck.bind(this) }
        rankOrder={ this.state.rankOrder }
        handSortOrder={ this.state.handSortOrder }
        onRankOrderChange={ this.rankOrderChanged.bind(this) }
        onHandSortOrderChange={ this.handSortOrderChanged.bind(this) } />
    );
  }

  renderCreateStages() {
    return (
      <CreateStages onFinish={ this.setStages.bind(this) } />
    );
  }

  renderCreateAdditionalPiles() {
    return (
      <CreateAdditionalPiles onFinish={ this.setAdditionalHands.bind(this) } />
    );
  }

  renderSubmit() {
    return (
      <button onClick={ this.submitClicked.bind(this) }>Submit Game Type</button>
    );
  }

  renderMessage() {
    switch (this.state.stage) {
      case 0:
        return (
          <p>Let's create a new type of game...</p>
        );
      case 1:
        return (
          <p>
            Great, you've named your game { this.name }!
            It supports at least { this.minPlayers } player(s) and at most { this.maxPlayers }.
          </p>
        );
      case 2:
        return (
          <p>
            Created a deck containing { this.deck.length } cards!
            Cards are ranked according to { this.state.rankOrder }, and hands will be sorted { this.state.handSortOrder }.
          </p>
        );
      case 3:
        return (
          <p>Created a game with { this.stages.length } stages! One last thing:</p>
        );
      case 4:
        return (
          <p>Created { this.additionalPiles.length } card piles for the table! Ready to submit...</p>
        );
      default:
        console.log('ERROR. invalid create game stage:', this.state.stage);
    }
  }

  renderCreateInterface() {
    switch (this.state.stage) {
      case 0:
        return this.renderCreateBasics();
      case 1:
        return this.renderCreateDeck();
      case 2:
        return this.renderCreateStages();
      case 3:
        return this.renderCreateAdditionalPiles();
      case 4:
        return this.renderSubmit();
      default:
        console.log('ERROR. invalid create game stage:', this.state.stage);
    }
  }

  render() {
    return (
      <div>
        { this.renderMessage() }
        { this.renderCreateInterface() }
        <br />
        <button onClick={ this.cancelClicked.bind(this) }>Cancel</button>
      </div>
    );
  }
}

export default CreateGameType;