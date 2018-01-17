import React, { Component } from 'react';
import fire from '../fire';

class SharedNotes extends Component {

  constructor(props) {
    super(props);  // gameId
    this.state = { 
      text: ''
    };
  }

  componentWillMount() {
    const notesRef = fire.database().ref('sharedNotes/' + this.props.gameId);
    notesRef.on('value', snapshot => {
      this.setState({ text: snapshot.val() });
    });
  }

  componentWillReceiveProps(props) {
    if (props.gameId !== this.props.gameId) {
      // remove previous listener and clear old contents
      const oldNotesRef = fire.database().ref('sharedNotes/' + this.props.gameId);
      oldNotesRef.off('value');
      this.setState({ text: '' });

      // create new listener
      const notesRef = fire.database().ref('sharedNotes/' + props.gameId);
      notesRef.on('value', snapshot => {
        this.setState({ text: snapshot.val() });
      });
    }
  }

  handleTextChange(e) {
    fire.database().ref('sharedNotes/' + this.props.gameId).set(e.target.value);
  }

  render() {
    return (
      <div>
        Shared notes:
        <br />
        <textarea value={ this.state.text } onChange={ this.handleTextChange.bind(this) } />
      </div>
    );
  }
}

export default SharedNotes;