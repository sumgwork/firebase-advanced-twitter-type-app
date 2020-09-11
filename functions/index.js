const functions = require("firebase-functions");
const admin = require("firebase-admin");
const express = require("express");
const firebase = require("firebase");

admin.initializeApp();

const app = express();

const firebaseConfig = {
  apiKey: "AIzaSyBHPdYfLXtVofYuj42LaaP46WPUaAR1HAM",
  authDomain: "socialape-c834e.firebaseapp.com",
  databaseURL: "https://socialape-c834e.firebaseio.com",
  projectId: "socialape-c834e",
  storageBucket: "socialape-c834e.appspot.com",
  messagingSenderId: "858465680849",
  appId: "1:858465680849:web:0fd8050accc8e108b4b4f0",
};
// Initialize Firebase
firebase.initializeApp(firebaseConfig);

const db = admin.firestore();

app.get("/scream", (request, response) => {
  db.collection("screams")
    .orderBy("createdAt", "desc")
    .get()
    .then((data) => {
      let screams = [];
      data.forEach((doc) => {
        screams.push({ screamId: doc.id, ...doc.data() });
      });
      response.json(screams);
    })
    .catch((err) => {
      response.status(500).json({ error: "Something went wrong" });
      console.error(err);
    });
});

app.post("/scream", (request, response) => {
  const newScream = {
    body: request.body.body,
    userHandle: request.body.userHandle,
    createdAt: new Date().toISOString(),
  };

  db.collection("screams")
    .add(newScream)
    .then((doc) => {
      response.json({ message: `document ${doc.id} created successfully` });
    })
    .catch((err) => {
      response.status(500).json({ error: "Something went wrong" });
      console.error(err);
    });
});

// Signup Route
app.post("/signup", (req, res) => {
  const newUser = {
    email: req.body.email,
    password: req.body.password,
    confirmPassword: req.body.confirmPassword,
    handle: req.body.handle,
  };

  let token, userId;
  // Validate data
  db.doc(`/users/${newUser.handle}`)
    .get()
    .then((doc) => {
      if (doc.exists) {
        // User already exists
        return res.status(400).json({
          handle: "This handle is already taken",
        });
      } else {
        // Create the user
        return firebase
          .auth()
          .createUserWithEmailAndPassword(newUser.email, newUser.password);
      }
    })
    .then((data) => {
      // User is created, create access token
      userId = data.user.uid;
      return data.user.getIdToken();
    })
    .then((idToken) => {
      token = idToken;
      const userCredentials = {
        handle: newUser.handle,
        email: newUser.email,
        createdAt: new Date().toISOString(),
        userId,
      };
      return db.doc(`/users/${newUser.handle}`).set(userCredentials);
    })
    .then(() => {
      return res.status(201).json({
        token,
      });
    })
    .catch((err) => {
      console.error(err);
      if (err.code === "auth/email-already-in-use") {
        return res.status(500).json({ email: "Email is already in use" });
      }
      return res.status(500).json({ error: err.message });
    });
});

exports.api = functions.region("australia-southeast1").https.onRequest(app);
