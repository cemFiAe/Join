  // Deine echten Konfigurationsdaten
  const firebaseConfig = {
    apiKey: "AIzaSyAPtUJlnbfEpZDm9PL12D7VJnDcmdw-qnY",
    authDomain: "join-sign-up-log-in.firebaseapp.com",
    databaseURL: "https://join-sign-up-log-in-default-rtdb.europe-west1.firebasedatabase.app",
    projectId: "join-sign-up-log-in",
    storageBucket: "join-sign-up-log-in.appspot.com",
    messagingSenderId: "267430670218",
    appId: "1:267430670218:web:a8246754c760696ce376273",
    measurementId: "G-S0G3G3520P"
  };

  // Initialisiere Firebase
  firebase.initializeApp(firebaseConfig);
  const database = firebase.database();