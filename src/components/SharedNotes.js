import React, { Component } from 'react';
import fire from '../fire';

class SharedNotes extends Component {

  constructor(props) {
    super(props);  // gameId, playerIndex
    this.state = { 
      text: '',
      playerLock: -1
    };
  }

  _onFirebaseChange(snapshot) {
    if (snapshot.key === 'text') {
      this.setState({ text: snapshot.val() });
    } else if (snapshot.key === 'playerLock') {
      this.setState({ playerLock: snapshot.val() });
    } else {
      console.log('ERROR. unrecognized snapshot key:', snapshot.key);
    }
  }

  componentWillMount() {
    const notesRef = fire.database().ref('sharedNotes/' + this.props.gameId);
    notesRef.on('child_added', this._onFirebaseChange.bind(this));
    notesRef.on('child_changed', this._onFirebaseChange.bind(this));
  }

  componentWillReceiveProps(props) {
    if (props.gameId !== this.props.gameId) {
      // remove previous listener and clear old contents
      const oldNotesRef = fire.database().ref('sharedNotes/' + this.props.gameId);
      oldNotesRef.off('child_added');
      oldNotesRef.off('child_changed');
      this.setState({ text: '', playerLock: -1 });

      // create new listener
      const notesRef = fire.database().ref('sharedNotes/' + props.gameId);
      notesRef.on('child_added', this._onFirebaseChange.bind(this));
      notesRef.on('child_changed', this._onFirebaseChange.bind(this));
    }
  }

  shouldDisableNotes() {
    return this.state.playerLock !== -1 && this.state.playerLock !== this.props.playerIndex;
  }

  handleTextChange(e) {
    fire.database().ref('sharedNotes/' + this.props.gameId + '/text').set(e.target.value);
  }

  lockNotes() {
    fire.database().ref('sharedNotes/' + this.props.gameId + '/playerLock').set(this.props.playerIndex);
  }

  unlockNotes() {
    fire.database().ref('sharedNotes/' + this.props.gameId + '/playerLock').set(-1);
  }

  renderIsTypingMessage() {
    return (
      <em>(Player {this.state.playerLock + 1} is typing...)</em>
    );
  }

  render() {
    return (
      <div>
        Shared notes: &nbsp;
        { this.shouldDisableNotes() ? this.renderIsTypingMessage() : null }
        <br />
        <textarea
          value={ this.state.text }
          onChange={ this.handleTextChange.bind(this) }
          disabled={ this.shouldDisableNotes() }
          onFocus={ this.lockNotes.bind(this) }
          onBlur={ this.unlockNotes.bind(this) } />
      </div>
    );
  }
}

export default SharedNotes;