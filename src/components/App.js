import React, { Component } from 'react';
import fire from '../fire';
import Chat from './Chat';

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
        <Chat />
      </div>
    );
  }
}

export default App;