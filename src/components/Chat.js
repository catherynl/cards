import React, { Component } from 'react';
import fire from '../fire';
import KeyHandler from 'react-key-handler';

class Chat extends Component {

  constructor(props) {
    super(props); // username, gameId
    this.state = { 
      messages: [],
      messagesRef: 0
    };
  }

  componentWillReceiveProps(props) {
    // remove previous listener and clear old messages
    if (this.state.messagesRef && props.gameId !== this.props.gameId) {
      this.state.messagesRef.off('child_added');
      this.setState({ messages: [] });
    }

    // create new listener
    if (!this.state.messagesRef || props.gameId !== this.props.gameId) {
      const messagesRef = fire.database().ref('messages/' + props.gameId).orderByKey().limitToLast(20);
      messagesRef.on('child_added', snapshot => {
        /* Update React state when message is added at Firebase Database */
        const message = { text: snapshot.val(), id: snapshot.key };
        this.setState({ messages: [message].concat(this.state.messages) });
      });
      this.setState({ messagesRef });
    }
  }

  addMessage(e) {
    e.preventDefault();
    fire.database().ref('messages/' + this.props.gameId).push({
      username: this.props.username,
      message: this.inputMessage.value
    });
    this.inputMessage.value = '';
  }

  focusOnChat() {
    this.inputMessage.focus();
  }

  render() {
    return (
      <div className="chat">

        Chat box

        <form onSubmit={ this.addMessage.bind(this) }>
          <input type="text" ref={ el => this.inputMessage = el } />
          <input type="submit" className="button" value="Send message"/>
        </form>

        <ul>
          {
            /* Render the list of messages */
            this.state.messages.map( 
              messageObject => 
                <li key={ messageObject.id }>
                  {messageObject.text.username + ': ' + messageObject.text.message}
                </li>
            )
          }
        </ul>

        <KeyHandler keyEventName="keyup" keyValue=" " onKeyHandle={() => this.focusOnChat()} />
      </div>
    );
  }
}

export default Chat;