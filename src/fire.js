import firebase from 'firebase'

var config = {
  apiKey: "AIzaSyAPCBUvBKWwdvqVgCefQLjRIAtk87krdvA",
  authDomain: "cards-vc.firebaseapp.com",
  databaseURL: "https://cards-vc.firebaseio.com",
  projectId: "cards-vc",
  storageBucket: "cards-vc.appspot.com",
  messagingSenderId: "914898907164"
};

var fire = firebase.initializeApp(config);

export default fire;