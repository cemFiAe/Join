const firebaseConfig = {
  apiKey: "AIzaSyBJ9O4WkUOiBOjPuC6z22W9nagK4yP7P4k",
  authDomain: "join-group-project.firebaseapp.com",
  databaseURL: "https://join-group-project-default-rtdb.europe-west1.firebasedatabase.app",
  projectId: "join-group-project",
  storageBucket: "join-group-project.appspot.com", 
  messagingSenderId: "900142495151",
  appId: "1:900142495151:web:5af18bb423452236fceb5a",
  measurementId: "G-JJNQ7FE4GR"
};

firebase.initializeApp(firebaseConfig);

const database = firebase.database();