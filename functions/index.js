const functions = require("firebase-functions");
const express = require("express");
const firebase = require("firebase");
const { admin, db } = require("./util/admin");

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

const AuthM = (req, res, next) => {
  let idToken;
  if (
    req.headers.authorization &&
    req.headers.authorization.startsWith("Bearer ")
  ) {
    idToken = req.headers.authorization.split("Bearer ")[1];
  } else {
    console.error("No token");
    res.status(403).json({ error: "Unauthorized" });
  }

  admin
    .auth()
    .verifyIdToken(idToken)
    .then((decodedToken) => {
      req.user = decodedToken;

      return db
        .collection("users")
        .where("userId", "==", req.user.uid)
        .limit(1)
        .get();
    })
    .then((data) => {
      req.user.handle = data.docs[0].data().handle;
      return next();
    })
    .catch((err) => {
      console.error("Error while verifying token", err);
      return res.status(403).json(err);
    });
};

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

app.post("/scream", AuthM, (request, response) => {
  const newScream = {
    body: request.body.body,
    userHandle: request.user.handle,
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

const isEmpty = (string) => string.trim() === "";

const isEmail = (email) => {
  const emailRegEx = /^(([^<>()\[\]\\.,;:\s@"]+(\.[^<>()\[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/;
  return email.match(emailRegEx);
};

// Signup Route
app.post("/signup", (req, res) => {
  const newUser = {
    email: req.body.email,
    password: req.body.password,
    confirmPassword: req.body.confirmPassword,
    handle: req.body.handle,
  };

  let errors = {};

  if (isEmpty(newUser.email)) {
    errors.email = "Must not be empty";
  } else if (!isEmail(newUser.email)) {
    errors.email = "Invalid";
  }

  if (isEmpty(newUser.password)) {
    errors.password = "Must not be empty";
  }

  if (newUser.password !== newUser.confirmPassword) {
    errors.confirmPassword = "Passwords don't match";
  }

  if (isEmpty(newUser.handle)) {
    errors.handle = "Must not be empty";
  }

  if (Object.keys(errors).length) {
    return res.status(404).json(errors);
  }

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

// Login Route
app.post("/login", (req, res) => {
  const user = {
    email: req.body.email,
    password: req.body.password,
  };

  let errors = {};

  if (isEmpty(user.email)) {
    errors.email = "Must not be empty";
  } else if (!isEmail(user.email)) {
    errors.email = "Invalid";
  }

  if (isEmpty(user.password)) {
    errors.password = "Must not be empty";
  }

  if (Object.keys(errors).length) {
    return res.status(404).json(errors);
  }

  firebase
    .auth()
    .signInWithEmailAndPassword(user.email, user.password)
    .then((data) => data.user.getIdToken())
    .then((token) => res.json({ token }))
    .catch((err) => {
      console.error(err);
      if (
        err.code === "auth/wrong-password" ||
        err.code === "auth/user-not-found"
      ) {
        return res.status(403).json({ general: "Invalid credentials!" });
      }
      return res.status(500).json({ error: err.code });
    });
});

exports.api = functions.region("australia-southeast1").https.onRequest(app);
