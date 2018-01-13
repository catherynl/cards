import React, { Component } from 'react';
import fire from '../fire';

class App extends Component {

  constructor(props) {
    super(props);
    this.state = { 
      messages: [],
      username: 'anonymous monkey',
    }; // <- set up react state
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

  addMessage(e) {
    e.preventDefault(); // <- prevent form submit from reloading the page
    fire.database().ref('messages').push({
      username: this.state.username,
      message: this.inputMessage.value
    });
    this.inputMessage.value = '';
  }

  changeUsername(e) {
    e.preventDefault();
    this.setState({ username: this.inputUsername.value });
    this.inputUsername.placeholder = this.inputUsername.value;
    this.inputUsername.value = '';
  }

  render() {
    console.log(this.state.messages);
    return (
      <div>
        <form onSubmit={this.changeUsername.bind(this)}>
          <input type="text" ref={ el => this.inputUsername = el } placeholder={ this.state.username } />
          <input type="submit" value="Change username"/>
        </form>

        <form onSubmit={this.addMessage.bind(this)}>
          <input type="text" ref={ el => this.inputMessage = el } />
          <input type="submit"/>
          List of messages
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
        </form>
      </div>
    );
  }
}

export default App;