import firebase from 'firebase';

// Initialize Firebase
var config = {
  apiKey: "AIzaSyCKMqjJ6IGlv3uaxHUtto0XOyX4ysbvMBA",
  authDomain: "resonanceplayer.firebaseapp.com",
  databaseURL: "https://resonanceplayer.firebaseio.com",
  projectId: "resonanceplayer",
  storageBucket: "resonanceplayer.appspot.com",
  messagingSenderId: "346867573999"
};

const fire = firebase.initializeApp(config);

export default fire;
