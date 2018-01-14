import React, { Component } from 'react';
import fire from '../fire';

class Game extends Component {

  constructor(props) {
    super(props); // username, gameId
    this.state = {
      playerIndex = 0,
      isPlayersTurn = false
    };
  }

  componentWillMount() {
    /* Create reference to messages in Firebase Database */
    let messagesRef = fire.database().ref('messages').orderByKey().limitToLast(100);
    messagesRef.on('child_added', snapshot => {
      /* Update React state when message is added at Firebase Database */
      let message = { text: snapshot.val(), id: snapshot.key };
      this.setState({ messages: [message].concat(this.state.messages) });
    })
  }

  render() {
    return (
      <div>
        { 'Game id: ' + this.props.gameId }
      </div>
    );
  }
}

export default Game;