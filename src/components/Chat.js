import React, { Component } from 'react';
import fire from '../fire';

class Chat extends Component {

  constructor(props) {
    super(props); // username
    this.state = { 
      messages: []
    };
  }

  componentWillMount() {
    /* Create reference to messages in Firebase Database */
    const messagesRef = fire.database().ref('messages').orderByKey().limitToLast(100);
    messagesRef.on('child_added', snapshot => {
      /* Update React state when message is added at Firebase Database */
      const message = { text: snapshot.val(), id: snapshot.key };
      this.setState({ messages: [message].concat(this.state.messages) });
    })
  }

  addMessage(e) {
    e.preventDefault(); // <- prevent form submit from reloading the page
    fire.database().ref('messages').push({
      username: this.props.username,
      message: this.inputMessage.value
    });
    this.inputMessage.value = '';
  }

  render() {
    return (
      <div>

        Chat box

        <form onSubmit={this.addMessage.bind(this)}>
          <input type="text" ref={ el => this.inputMessage = el } />
          <input type="submit"/>
        </form>

        <ul>
          {
            /* Render the list of messages */
            this.state.messages.map( 
              messageObject => 
                <li key={ messageObject.id }>
                  {messageObject.text.username + ': ' + messageObject.text.message}
                </li>
            ).reverse()
          }
        </ul>
      </div>
    );
  }
}

export default Chat;