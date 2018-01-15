import React, { Component } from 'react';
import fire from '../fire';
import KeyHandler from 'react-key-handler';

class Chat extends Component {

  constructor(props) {
    super(props); // username
    this.state = { 
      messages: []
    };
  }

  componentWillMount() {
    /* Create reference to messages in Firebase Database */
    const messagesRef = fire.database().ref('messages').orderByKey().limitToLast(20);
    messagesRef.on('child_added', snapshot => {
      /* Update React state when message is added at Firebase Database */
      const message = { text: snapshot.val(), id: snapshot.key };
      this.setState({ messages: [message].concat(this.state.messages) });
    })
  }

  addMessage(e) {
    e.preventDefault();
    fire.database().ref('messages').push({
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
          <input type="submit" class="button" value="Send message"/>
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